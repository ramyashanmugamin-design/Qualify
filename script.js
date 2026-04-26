// File upload and form handling
let uploadedData = null;

// File input change handlers
document.getElementById('jobDescription').addEventListener('change', function() {
    handleFileSelection(this, 'jobDescription');
});

document.getElementById('resume').addEventListener('change', function() {
    handleFileSelection(this, 'resume');
});

function updateSubmitButtonState() {
    const submitBtn = document.getElementById('submitBtn');
    const jobDescSelected = document.getElementById('jobDescription').files.length > 0;
    const resumeSelected = document.getElementById('resume').files.length > 0;

    submitBtn.disabled = !(jobDescSelected && resumeSelected);
}

// Handle file selection
function handleFileSelection(input, fieldType) {
    const fileName = document.getElementById(fieldType + 'Name');
    const errorDiv = document.getElementById(fieldType + 'Error');
    
    errorDiv.textContent = '';
    
    if (input.files && input.files[0]) {
        const file = input.files[0];
        
        // Validate file
        const validationError = validateFile(file);
        if (validationError) {
            errorDiv.textContent = validationError;
            fileName.textContent = '';
            input.value = '';
            updateSubmitButtonState();
            return;
        }
        
        fileName.textContent = '✓ ' + file.name;
    } else {
        fileName.textContent = '';
    }

    updateSubmitButtonState();
}

// Validate file size and type
function validateFile(file) {
    const maxSize = 2 * 1024 * 1024; // 2MB
    const allowedFormats = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'application/rtf', 'text/rtf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.rtf', '.txt'];
    
    // Check file size
    if (file.size > maxSize) {
        return 'File size exceeds 2 MB limit';
    }
    
    // Check file format
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    const isValidExtension = allowedExtensions.includes(ext);
    const isValidMime = allowedFormats.includes(file.type) || file.name.endsWith('.rtf');
    
    if (!isValidExtension || !isValidMime) {
        return 'Invalid file format. Supported: PDF, DOC, DOCX, RTF';
    }
    
    return null;
}

// Handle form submission
document.getElementById('uploadForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const jobDescInput = document.getElementById('jobDescription');
    const resumeInput = document.getElementById('resume');
    const submitBtn = document.getElementById('submitBtn');
    const loadingSpinner = document.getElementById('loadingSpinner');
    const generalError = document.getElementById('generalError');
    
    // Validate both files are selected
    if (!jobDescInput.files || !jobDescInput.files[0] || !resumeInput.files || !resumeInput.files[0]) {
        generalError.textContent = 'Please select both files before submitting';
        generalError.classList.remove('hidden');
        return;
    }
    
    // Create FormData
    const formData = new FormData();
    formData.append('jobDescription', jobDescInput.files[0]);
    formData.append('resume', resumeInput.files[0]);
    
    try {
        // Disable button and show loading
        submitBtn.disabled = true;
        loadingSpinner.classList.remove('hidden');
        generalError.classList.add('hidden');
        
        // Send files to server
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const text = await response.text();
        let data;

        try {
            data = text ? JSON.parse(text) : null;
        } catch (parseError) {
            throw new Error(`Invalid JSON response from server: ${text}`);
        }
        
        if (!response.ok) {
            const message = data?.error || text || 'Upload failed';
            throw new Error(message);
        }
        
        // Store data and show results
        uploadedData = data;
        displayResults(data);
        
    } catch (error) {
        console.error('Error:', error);
        generalError.textContent = 'Error: ' + error.message;
        generalError.classList.remove('hidden');
        // Hide results section on error to prevent showing stale data
        document.getElementById('resultsSection').classList.add('hidden');
        document.querySelector('.upload-container').style.display = 'block';
    } finally {
        submitBtn.disabled = false;
        loadingSpinner.classList.add('hidden');
    }
});

// Display results
function displayResults(data) {
    const requiredSkillsList = document.getElementById('requiredSkillsList');
    const candidateSkillsList = document.getElementById('candidateSkillsList');
    const resultsSection = document.getElementById('resultsSection');
    
    // Display required skills
    requiredSkillsList.innerHTML = data.requiredSkills
        .map(skill => `<span class="skill-tag">${skill}</span>`)
        .join('');
    
    // Display candidate skills
    candidateSkillsList.innerHTML = data.candidateSkills.length > 0
        ? data.candidateSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')
        : '<p style="color: #64748b;">No skills detected in resume</p>';
    
    // Show results section and hide upload form
    document.querySelector('.upload-container').style.display = 'none';
    resultsSection.classList.remove('hidden');
    
    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Reset form
function resetForm() {
    // Reset file inputs
    document.getElementById('jobDescription').value = '';
    document.getElementById('resume').value = '';
    document.getElementById('jobDescriptionName').textContent = '';
    document.getElementById('resumeName').textContent = '';
    document.getElementById('jobDescriptionError').textContent = '';
    document.getElementById('resumeError').textContent = '';
    document.getElementById('generalError').classList.add('hidden');
    
    // Hide results and clear assessment page
    document.querySelector('.upload-container').style.display = 'block';
    document.getElementById('resultsSection').classList.add('hidden');
    clearAssessment();
    updateSubmitButtonState();
    
    uploadedData = null;
    
    // Scroll to top
    document.querySelector('.upload-container').scrollIntoView({ behavior: 'smooth' });
}

const assessmentResources = {
    'javascript': {
        focus: 'Modern JavaScript patterns, ES6+, and DOM scripting',
        resources: [
            { name: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', time: '15 hours' },
            { name: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/', time: '20 hours' },
            { name: 'JavaScript.info', url: 'https://javascript.info/', time: '10 hours' }
        ]
    },
    'python': {
        focus: 'Python fundamentals, data structures, and practical applications',
        resources: [
            { name: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', time: '12 hours' },
            { name: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com/', time: '15 hours' },
            { name: 'Python for Everybody', url: 'https://www.py4e.com/', time: '20 hours' }
        ]
    },
    'java': {
        focus: 'Object-oriented programming, JVM concepts, and enterprise development',
        resources: [
            { name: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/', time: '25 hours' },
            { name: 'Head First Java', url: 'https://www.oreilly.com/library/view/head-first-java/0596009208/', time: '30 hours' },
            { name: 'Java Programming MOOC', url: 'https://java-programming.mooc.fi/', time: '20 hours' }
        ]
    },
    'react': {
        focus: 'Component-based UI development, state management, and modern React patterns',
        resources: [
            { name: 'React Official Documentation', url: 'https://react.dev/learn', time: '15 hours' },
            { name: 'React Tutorial for Beginners', url: 'https://react-tutorial.app/', time: '10 hours' },
            { name: 'The Road to React', url: 'https://www.roadtoreact.com/', time: '20 hours' }
        ]
    },
    'node.js': {
        focus: 'Server-side JavaScript, APIs, and backend development',
        resources: [
            { name: 'Node.js Official Documentation', url: 'https://nodejs.org/en/docs/', time: '12 hours' },
            { name: 'Node.js Best Practices', url: 'https://github.com/goldbergyoni/nodebestpractices', time: '8 hours' },
            { name: 'Express.js Guide', url: 'https://expressjs.com/en/guide/', time: '6 hours' }
        ]
    },
    'sql': {
        focus: 'Database design, querying, and data manipulation',
        resources: [
            { name: 'SQLZoo Interactive Tutorial', url: 'https://sqlzoo.net/', time: '10 hours' },
            { name: 'W3Schools SQL Tutorial', url: 'https://www.w3schools.com/sql/', time: '8 hours' },
            { name: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', time: '15 hours' }
        ]
    },
    'html': {
        focus: 'Semantic markup, accessibility, and modern HTML5 features',
        resources: [
            { name: 'MDN HTML Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', time: '8 hours' },
            { name: 'HTML5 Doctor', url: 'http://html5doctor.com/', time: '6 hours' },
            { name: 'Codecademy HTML Course', url: 'https://www.codecademy.com/learn/learn-html', time: '5 hours' }
        ]
    },
    'css': {
        focus: 'Responsive design, CSS Grid, Flexbox, and modern styling techniques',
        resources: [
            { name: 'MDN CSS Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', time: '15 hours' },
            { name: 'CSS-Tricks Complete Guide', url: 'https://css-tricks.com/guides/', time: '20 hours' },
            { name: 'Flexbox Froggy', url: 'https://flexboxfroggy.com/', time: '2 hours' }
        ]
    },
    'git': {
        focus: 'Version control, branching strategies, and collaborative development',
        resources: [
            { name: 'Git Official Documentation', url: 'https://git-scm.com/doc', time: '8 hours' },
            { name: 'Learn Git Branching', url: 'https://learngitbranching.js.org/', time: '4 hours' },
            { name: 'Pro Git Book', url: 'https://git-scm.com/book/en/v2', time: '20 hours' }
        ]
    },
    'docker': {
        focus: 'Containerization, Docker Compose, and container orchestration',
        resources: [
            { name: 'Docker Official Documentation', url: 'https://docs.docker.com/', time: '12 hours' },
            { name: 'Docker for Beginners', url: 'https://docker-curriculum.com/', time: '8 hours' },
            { name: 'Play with Docker', url: 'https://labs.play-with-docker.com/', time: '3 hours' }
        ]
    },
    'aws': {
        focus: 'Cloud computing, serverless architecture, and AWS services',
        resources: [
            { name: 'AWS Free Tier Tutorials', url: 'https://aws.amazon.com/free/', time: '10 hours' },
            { name: 'AWS Developer Guide', url: 'https://docs.aws.amazon.com/', time: '25 hours' },
            { name: 'A Cloud Guru AWS Courses', url: 'https://acloudguru.com/course/aws-certified-cloud-practitioner', time: '15 hours' }
        ]
    },
    'machine learning': {
        focus: 'ML algorithms, data preprocessing, and model evaluation',
        resources: [
            { name: 'Scikit-learn Documentation', url: 'https://scikit-learn.org/stable/user_guide.html', time: '20 hours' },
            { name: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', time: '15 hours' },
            { name: 'Fast.ai Practical Deep Learning', url: 'https://course.fast.ai/', time: '40 hours' }
        ]
    },
    'agile': {
        focus: 'Agile methodologies, Scrum framework, and team collaboration',
        resources: [
            { name: 'Scrum Guide', url: 'https://scrumguides.org/', time: '4 hours' },
            { name: 'Agile Manifesto', url: 'https://agilemanifesto.org/', time: '2 hours' },
            { name: 'Mountain Goat Software', url: 'https://www.mountaingoatsoftware.com/agile', time: '10 hours' }
        ]
    }
};

// Proceed to assessment by showing interactive proficiency inputs
function proceedToAssessment() {
    if (!uploadedData) {
        alert('Please upload files first');
        return;
    }

    const requiredSkills = uploadedData.requiredSkills || [];
    const candidateSkills = uploadedData.candidateSkills || [];

    displayAssessmentForm(requiredSkills, candidateSkills);

    // Show all buttons when entering assessment form
    const submitBtn = document.getElementById('submitAssessmentBtn');
    const backBtn = document.getElementById('backToResultsBtn');
    const uploadBtn = document.getElementById('uploadDifferentFilesBtn');
    submitBtn.style.display = 'block';
    backBtn.style.display = 'block';
    uploadBtn.style.display = 'block';

    document.getElementById('resultsSection').classList.add('hidden');
    document.getElementById('assessmentSection').classList.remove('hidden');
    document.getElementById('assessmentSection').scrollIntoView({ behavior: 'smooth' });
}

function backToResults() {
    clearAssessment();
    document.getElementById('resultsSection').classList.remove('hidden');
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
}

function clearAssessment() {
    const assessmentSection = document.getElementById('assessmentSection');
    const assessmentForm = document.getElementById('assessmentForm');
    const assessmentResultsSection = document.getElementById('assessmentResultsSection');
    const gapList = document.getElementById('gapList');
    const learningPlanList = document.getElementById('learningPlanList');
    const submitBtn = document.getElementById('submitAssessmentBtn');
    const backBtn = document.getElementById('backToResultsBtn');
    const uploadBtn = document.getElementById('uploadDifferentFilesBtn');

    assessmentSection.classList.add('hidden');
    assessmentForm.innerHTML = '';
    assessmentResultsSection.classList.add('hidden');
    gapList.innerHTML = '';
    learningPlanList.innerHTML = '';
    
    // Restore button visibility
    submitBtn.style.display = 'block';
    backBtn.style.display = 'block';
    uploadBtn.style.display = 'block';
}

function normalizeSkillId(skill) {
    return skill.toLowerCase().replace(/[^a-z0-9]+/g, '_');
}

function displayAssessmentForm(requiredSkills, candidateSkills) {
    const assessmentForm = document.getElementById('assessmentForm');
    const candidateSet = new Set(candidateSkills.map(skill => skill.toLowerCase()));

    const skillCards = requiredSkills.map(skill => {
        const skillId = normalizeSkillId(skill);
        const normalized = skill.toLowerCase();
        const present = candidateSet.has(normalized) ? 'Found in resume' : 'Not found in resume';
        const statusClass = candidateSet.has(normalized) ? 'skill-present' : 'skill-missing';

        return `
            <div class="skill-card ${statusClass}">
                <strong>${skill}</strong>
                <p class="skill-status">${present}</p>
                <label for="proficiency-${skillId}">
                    Proficiency Level
                    <select id="proficiency-${skillId}" data-skill="${skill}">
                        <option value="1">1 - Beginner (Basic understanding)</option>
                        <option value="2">2 - Developing (Some experience)</option>
                        <option value="3">3 - Competent (Can work independently)</option>
                        <option value="4">4 - Advanced (Strong expertise)</option>
                        <option value="5">5 - Expert (Can mentor others)</option>
                    </select>
                </label>
            </div>
        `;
    }).join('');

    assessmentForm.innerHTML = `
        <h3>📊 Rate Your Proficiency</h3>
        <p>For each required skill, select your current proficiency level on a 1-5 scale. Review whether the skill appears in your resume to help identify potential gaps.</p>
        <div class="assessment-grid">
            ${skillCards}
        </div>
    `;

    // Ensure the assessment form is visible
    assessmentForm.style.display = 'block';

    document.getElementById('assessmentResultsSection').classList.add('hidden');
}

function submitSelfAssessment() {
    if (!uploadedData) {
        alert('Please upload files first');
        return;
    }

    const requiredSkills = uploadedData.requiredSkills || [];
    const candidateSkills = uploadedData.candidateSkills || [];
    const candidateSet = new Set(candidateSkills.map(skill => skill.toLowerCase()));

    const assessment = requiredSkills.map(skill => {
        const skillId = normalizeSkillId(skill);
        const select = document.getElementById(`proficiency-${skillId}`);
        const proficiency = select ? parseInt(select.value, 10) : 1;
        const claimed = candidateSet.has(skill.toLowerCase());
        let gapReason = null;

        if (!claimed) {
            gapReason = 'Skill not claimed in resume.';
        } else if (proficiency < 3) {
            gapReason = 'Skill claimed in resume, but self-rated below competence.';
        }

        return {
            skill,
            claimed,
            proficiency,
            gapReason
        };
    });

    const gaps = assessment.filter(item => item.gapReason !== null);
    const learningPlan = generateLearningPlan(gaps);

    renderSelfAssessmentResults(assessment, gaps, learningPlan);
}

function generateLearningPlan(gaps) {
    return gaps.map(gap => {
        const key = gap.skill.toLowerCase();
        const recommendation = assessmentResources[key];
        const resources = recommendation ? recommendation.resources : [
            { name: 'Codecademy Interactive Learning', url: 'https://www.codecademy.com/', time: '8 hours' },
            { name: 'freeCodeCamp Curriculum', url: 'https://www.freecodecamp.org/learn', time: '15 hours' },
            { name: 'Coursera Programming Courses', url: 'https://www.coursera.org/browse/computer-science', time: '20 hours' },
            { name: 'Udemy ' + gap.skill + ' Course', url: 'https://www.udemy.com/topic/' + encodeURIComponent(gap.skill.toLowerCase()) + '/', time: '10 hours' }
        ];
        const totalTime = resources.reduce((sum, resource) => {
            const match = resource.time.match(/(\d+)(?:\+)?/);
            return sum + (match ? parseInt(match[1], 10) : 0);
        }, 0) + ' hours';

        const personalizedReason = recommendation
            ? `AI-enhanced recommendation for ${gap.skill}, tuned to your current proficiency and identified gap.`
            : `Adaptive recommendation for ${gap.skill} that balances core skill development with relevant modern learning resources.`;

        const focusText = recommendation
            ? recommendation.focus
            : `Build targeted knowledge in ${gap.skill}, then reinforce it with hands-on projects and real-world application.`;

        return {
            skill: gap.skill,
            reason: personalizedReason,
            focus: focusText,
            resources,
            time: totalTime
        };
    });
}

function renderSelfAssessmentResults(assessment, gaps, learningPlan) {
    const assessmentResultsSection = document.getElementById('assessmentResultsSection');
    const gapList = document.getElementById('gapList');
    const learningPlanList = document.getElementById('learningPlanList');

    const gapCards = gaps.length > 0
        ? gaps.map(gap => `
            <div class="skill-card skill-missing">
                <strong>${gap.skill}</strong>
                <p>${gap.gapReason}</p>
                <p><em>Self-rated proficiency: ${gap.proficiency}/5</em></p>
            </div>
        `).join('')
        : '<div class="skill-card skill-match"><strong>No skill gaps identified!</strong><p>Great job! Your resume claims and self-assessment are well-aligned.</p></div>';

    const learningCards = learningPlan.length > 0
        ? learningPlan.map(plan => {
            const resourceList = plan.resources.map(resource =>
                `<li><a href="${resource.url}" target="_blank" rel="noopener noreferrer">${resource.name}</a> <span style="color: var(--text-secondary);">(${resource.time})</span></li>`
            ).join('');

            return `
                <div class="skill-card learning-plan">
                    <strong>${plan.skill}</strong>
                    <p>${plan.reason}</p>
                    <p><em>${plan.focus}</em></p>
                    <div class="time-estimate">⏱️ Estimated learning time: ${plan.time}</div>
                    <ul>${resourceList}</ul>
                </div>
            `;
        }).join('')
        : '<div class="skill-card skill-match"><strong>No learning recommendations needed</strong><p>You\'re all set! Continue building on your existing strengths.</p></div>';

    gapList.innerHTML = gapCards;
    learningPlanList.innerHTML = learningCards;

    // Hide the assessment form (Rate Your Proficiency section)
    const assessmentForm = document.getElementById('assessmentForm');
    assessmentForm.style.display = 'none';

    // Hide Submit and Back buttons, keep only Upload Different Files
    const submitBtn = document.getElementById('submitAssessmentBtn');
    const backBtn = document.getElementById('backToResultsBtn');
    const uploadBtn = document.getElementById('uploadDifferentFilesBtn');
    
    submitBtn.style.display = 'none';
    backBtn.style.display = 'none';
    uploadBtn.style.display = 'block';

    assessmentResultsSection.classList.remove('hidden');
    assessmentResultsSection.scrollIntoView({ behavior: 'smooth' });
}

// Drag and drop functionality
const uploadBoxes = document.querySelectorAll('.upload-box');

uploadBoxes.forEach((box) => {
    const fileInput = box.querySelector('.file-input');
    
    box.addEventListener('dragover', (e) => {
        e.preventDefault();
        box.style.borderColor = 'var(--primary-color)';
        box.style.background = 'rgba(99, 102, 241, 0.05)';
    });
    
    box.addEventListener('dragleave', () => {
        box.style.borderColor = 'var(--border-color)';
        box.style.background = 'transparent';
    });
    
    box.addEventListener('drop', (e) => {
        e.preventDefault();
        box.style.borderColor = 'var(--border-color)';
        box.style.background = 'transparent';
        
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            fileInput.files = e.dataTransfer.files;
            
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    });
});
