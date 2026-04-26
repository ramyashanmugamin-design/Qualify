const fs = require('fs');
const readline = require('readline');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

// Suppress PDF.js warnings globally
const originalConsoleWarn = console.warn;
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

const suppressedMessages = [
    'TT: undefined function: 21',
    'TT: undefined function',
    'Warning: TT: undefined function'
];

function shouldSuppress(message) {
    if (typeof message !== 'string') return false;
    return suppressedMessages.some(suppressed => message.includes(suppressed));
}

console.warn = function(...args) {
    if (!shouldSuppress(args[0])) {
        originalConsoleWarn.apply(console, args);
    }
};

console.error = function(...args) {
    if (!shouldSuppress(args[0])) {
        originalConsoleError.apply(console, args);
    }
};

console.log = function(...args) {
    if (!shouldSuppress(args[0])) {
        originalConsoleLog.apply(console, args);
    }
};

// Also suppress at the process level for any uncaught warnings
const originalEmitWarning = process.emitWarning;
process.emitWarning = function(warning, ...args) {
    if (!shouldSuppress(warning)) {
        originalEmitWarning.call(process, warning, ...args);
    }
};

class Agent {
    constructor() {
        this.jobDescription = '';
        this.resume = '';
        this.requiredSkills = [];
        this.candidateSkills = {};
        this.skillLevels = {};
        this.alignmentScore = 0;
        this.resourceDatabase = {
            'javascript': {
                focus: 'Core JavaScript and modern tooling for web development',
                resources: [
                    { name: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', time: '20 hours' },
                    { name: 'Eloquent JavaScript', url: 'https://eloquentjavascript.net/', time: '30 hours' }
                ]
            },
            'python': {
                focus: 'Python fundamentals, scripting, and data workflows',
                resources: [
                    { name: 'Python Official Tutorial', url: 'https://docs.python.org/3/tutorial/', time: '15 hours' },
                    { name: 'Automate the Boring Stuff with Python', url: 'https://automatetheboringstuff.com/', time: '25 hours' }
                ]
            },
            'java': {
                focus: 'Java platform fundamentals, object-oriented design, and enterprise patterns',
                resources: [
                    { name: 'Oracle Java Tutorials', url: 'https://docs.oracle.com/javase/tutorial/', time: '25 hours' },
                    { name: 'Head First Java', url: 'https://www.oreilly.com/library/view/head-first-java/0596009208/', time: '40 hours' }
                ]
            },
            'react': {
                focus: 'Component-driven UI development with React',
                resources: [
                    { name: 'React Official Documentation', url: 'https://react.dev/learn', time: '15 hours' },
                    { name: 'The Road to React', url: 'https://www.roadtoreact.com/', time: '20 hours' }
                ]
            },
            'machine learning': {
                focus: 'Machine learning principles, pipelines, and model evaluation',
                resources: [
                    { name: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', time: '15 hours' },
                    { name: 'Scikit-learn Documentation', url: 'https://scikit-learn.org/stable/user_guide.html', time: '20 hours' }
                ]
            },
            'html': {
                focus: 'Semantic HTML5, accessibility, and responsive markup',
                resources: [
                    { name: 'MDN HTML Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML', time: '8 hours' },
                    { name: 'HTML5 Doctor', url: 'http://html5doctor.com/', time: '6 hours' }
                ]
            },
            'css': {
                focus: 'Modern styling techniques with CSS Grid, Flexbox, and responsive design',
                resources: [
                    { name: 'MDN CSS Documentation', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS', time: '15 hours' },
                    { name: 'CSS-Tricks Complete Guide', url: 'https://css-tricks.com/guides/', time: '20 hours' }
                ]
            },
            'sql': {
                focus: 'Database querying, normalization, and performance tuning',
                resources: [
                    { name: 'SQLZoo Interactive Tutorial', url: 'https://sqlzoo.net/', time: '10 hours' },
                    { name: 'PostgreSQL Tutorial', url: 'https://www.postgresqltutorial.com/', time: '15 hours' }
                ]
            }
        };

        this.learningModel = {
            relatedSkills: {
                'javascript': ['react', 'nodejs', 'typescript'],
                'python': ['pandas', 'django', 'flask'],
                'java': ['spring', 'hibernate', 'android'],
                'machine learning': ['data analysis', 'tensorflow', 'pytorch'],
                'react': ['javascript', 'nodejs', 'graphql'],
                'sql': ['database design', 'postgresql', 'mysql'],
                'aws': ['cloud architecture', 'docker', 'kubernetes']
            }
        };

        // Comprehensive skill database for semantic extraction
        this.skillDatabase = {
            // Programming Languages
            'javascript': { category: 'Language', synonyms: ['js', 'ecmascript', 'node.js', 'nodejs'], type: 'language' },
            'python': { category: 'Language', synonyms: ['py', 'python3', 'python2'], type: 'language' },
            'java': { category: 'Language', synonyms: ['java8', 'java11', 'java17', 'j2ee'], type: 'language' },
            'csharp': { category: 'Language', synonyms: ['c#', 'dotnet', 'asp.net'], type: 'language' },
            'cpp': { category: 'Language', synonyms: ['c++', 'cplusplus'], type: 'language' },
            'php': { category: 'Language', synonyms: ['php7', 'php8'], type: 'language' },
            'ruby': { category: 'Language', synonyms: ['rails', 'ruby on rails'], type: 'language' },
            'go': { category: 'Language', synonyms: ['golang'], type: 'language' },
            'rust': { category: 'Language', synonyms: ['rustlang'], type: 'language' },
            'typescript': { category: 'Language', synonyms: ['ts'], type: 'language' },

            // Frameworks & Libraries
            'react': { category: 'Framework', synonyms: ['reactjs', 'react.js'], type: 'frontend' },
            'angular': { category: 'Framework', synonyms: ['angularjs', 'angular.js'], type: 'frontend' },
            'vue': { category: 'Framework', synonyms: ['vuejs', 'vue.js'], type: 'frontend' },
            'nodejs': { category: 'Framework', synonyms: ['node.js', 'node', 'express', 'expressjs'], type: 'backend' },
            'django': { category: 'Framework', synonyms: ['django rest', 'djangorest'], type: 'backend' },
            'flask': { category: 'Framework', synonyms: ['flask framework'], type: 'backend' },
            'spring': { category: 'Framework', synonyms: ['spring boot', 'springboot'], type: 'backend' },
            'laravel': { category: 'Framework', synonyms: ['laravel framework'], type: 'backend' },
            'dotnet': { category: 'Framework', synonyms: ['.net', 'asp.net core'], type: 'backend' },

            // Databases
            'sql': { category: 'Database', synonyms: ['mysql', 'postgresql', 'oracle', 'mssql', 'sqlite'], type: 'database' },
            'mongodb': { category: 'Database', synonyms: ['mongo', 'nosql'], type: 'database' },
            'redis': { category: 'Database', synonyms: ['redis cache'], type: 'database' },
            'elasticsearch': { category: 'Database', synonyms: ['elastic'], type: 'database' },

            // Cloud Platforms
            'aws': { category: 'Cloud', synonyms: ['amazon web services', 'ec2', 's3', 'lambda'], type: 'cloud' },
            'azure': { category: 'Cloud', synonyms: ['microsoft azure', 'azure cloud'], type: 'cloud' },
            'gcp': { category: 'Cloud', synonyms: ['google cloud', 'google cloud platform'], type: 'cloud' },
            'heroku': { category: 'Cloud', synonyms: ['heroku platform'], type: 'cloud' },
            'docker': { category: 'Cloud', synonyms: ['containerization', 'docker containers'], type: 'cloud' },
            'kubernetes': { category: 'Cloud', synonyms: ['k8s', 'k8', 'kube'], type: 'cloud' },

            // Methodologies & Tools
            'agile': { category: 'Methodology', synonyms: ['scrum', 'kanban', 'xp', 'extreme programming'], type: 'methodology' },
            'devops': { category: 'Methodology', synonyms: ['ci/cd', 'continuous integration', 'continuous deployment'], type: 'methodology' },
            'testing': { category: 'Methodology', synonyms: ['qa', 'quality assurance', 'tdd', 'bdd', 'unit testing'], type: 'methodology' },
            'git': { category: 'Tool', synonyms: ['github', 'gitlab', 'bitbucket', 'version control'], type: 'tool' },
            'jenkins': { category: 'Tool', synonyms: ['ci/cd pipeline'], type: 'tool' },
            'jira': { category: 'Tool', synonyms: ['atlassian', 'confluence'], type: 'tool' },

            // Web Technologies
            'html': { category: 'Web', synonyms: ['html5'], type: 'web' },
            'css': { category: 'Web', synonyms: ['css3', 'sass', 'scss'], type: 'web' },
            'rest': { category: 'Web', synonyms: ['restful', 'api', 'rest api'], type: 'web' },
            'graphql': { category: 'Web', synonyms: ['graph ql'], type: 'web' },

            // Data & ML
            'machine learning': { category: 'Data', synonyms: ['ml', 'ai', 'artificial intelligence', 'deep learning'], type: 'data' },
            'data analysis': { category: 'Data', synonyms: ['data analytics', 'business intelligence', 'bi'], type: 'data' },
            'pandas': { category: 'Data', synonyms: ['pandas library'], type: 'data' },
            'tensorflow': { category: 'Data', synonyms: ['tf', 'keras'], type: 'data' },
            'pytorch': { category: 'Data', synonyms: ['torch'], type: 'data' },

            // Mobile
            'android': { category: 'Mobile', synonyms: ['android development', 'kotlin'], type: 'mobile' },
            'ios': { category: 'Mobile', synonyms: ['swift', 'objective-c'], type: 'mobile' },
            'react native': { category: 'Mobile', synonyms: ['reactnative'], type: 'mobile' },
            'flutter': { category: 'Mobile', synonyms: ['dart'], type: 'mobile' },

            // Specialized stacks
            'mern': { category: 'Stack', synonyms: ['mern stack'], mapsTo: ['react', 'nodejs', 'mongodb', 'express'], type: 'stack' },
            'mean': { category: 'Stack', synonyms: ['mean stack'], mapsTo: ['angular', 'nodejs', 'mongodb', 'express'], type: 'stack' },
            'lamp': { category: 'Stack', synonyms: ['lamp stack'], mapsTo: ['linux', 'apache', 'mysql', 'php'], type: 'stack' }
        };

        // Action-result patterns for resume analysis
        this.actionPatterns = [
            'developed', 'built', 'created', 'implemented', 'designed', 'architected',
            'led', 'managed', 'coordinated', 'directed', 'supervised',
            'optimized', 'improved', 'enhanced', 'upgraded', 'refactored',
            'integrated', 'deployed', 'launched', 'released', 'published',
            'maintained', 'supported', 'troubleshooted', 'debugged', 'fixed',
            'analyzed', 'researched', 'studied', 'evaluated', 'assessed',
            'trained', 'mentored', 'taught', 'coached', 'guided'
        ];

        this.resultPatterns = [
            'resulting in', 'leading to', 'which increased', 'improving', 'reducing',
            'saving', 'generating', 'achieving', 'delivering', 'producing',
            'enabling', 'facilitating', 'streamlining', 'automating', 'scaling'
        ];
    }

    resetState() {
        this.jobDescription = '';
        this.resume = '';
        this.requiredSkills = [];
        this.candidateSkills = {};
        this.skillLevels = {};
        this.alignmentScore = 0;
    }

    // Extract text from file based on mime type
    async extractTextFromFile(filePath, mimeType) {
        try {
            if (mimeType === 'application/pdf' || filePath.endsWith('.pdf')) {
                const dataBuffer = fs.readFileSync(filePath);
                
                // Temporarily suppress all console output during PDF parsing
                const originalConsole = { ...console };
                console.warn = () => {};
                console.error = () => {};
                console.log = () => {};
                
                try {
                    const data = await pdfParse(dataBuffer, { 
                        // Remove version specification to use default
                        pagerender: function(pageData) {
                            return pageData.getTextContent({
                                normalizeWhitespace: false,
                                disableCombineTextItems: false
                            }).then(function(textContent) {
                                let lastY, text = '';
                                for (let item of textContent.items) {
                                    if (lastY == item.transform[5] || !lastY){
                                        text += item.str;
                                    }  
                                    else{
                                        text += '\n' + item.str;
                                    }    
                                    lastY = item.transform[5];
                                }
                                return text;
                            });
                        },
                        // Add options to suppress warnings
                        verbosity: 0,
                        disableFontFace: true,
                        disableCreateObjectURL: true,
                        disableWebFonts: true
                    });
                    return data.text;
                } finally {
                    // Restore console functions
                    Object.assign(console, originalConsole);
                }
            } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || filePath.endsWith('.docx')) {
                const result = await mammoth.extractRawText({ path: filePath });
                return result.value;
            } else if (mimeType === 'application/msword' || filePath.endsWith('.doc')) {
                // For .doc files, use mammoth if available
                try {
                    const result = await mammoth.extractRawText({ path: filePath });
                    return result.value;
                } catch (e) {
                    return fs.readFileSync(filePath, 'utf8');
                }
            } else if (mimeType === 'application/rtf' || mimeType === 'text/rtf' || filePath.endsWith('.rtf')) {
                return fs.readFileSync(filePath, 'utf8');
            }
            return fs.readFileSync(filePath, 'utf8');
        } catch (error) {
            console.error('Error extracting text:', error);
            throw new Error('Failed to extract text from file: ' + error.message);
        }
    }

    // Get mime type from file extension
    getMimeTypeFromPath(filePath) {
        const ext = filePath.split('.').pop().toLowerCase();
        const mimeTypes = {
            'pdf': 'application/pdf',
            'doc': 'application/msword',
            'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'rtf': 'application/rtf',
            'txt': 'text/plain'
        };
        return mimeTypes[ext] || 'text/plain';
    }

    loadJobDescription(text) {
        this.jobDescription = text;
        this.requiredSkills = [];
        this.extractRequiredSkills();
    }

    loadResume(text) {
        this.resume = text;
        this.candidateSkills = {};
        this.extractCandidateSkills();
    }

    extractRequiredSkills() {
        // Layer 1: Semantic Entity Extraction & Normalization
        const extractedEntities = this.extractEntities(this.jobDescription);
        const normalizedSkills = this.normalizeAndMapEntities(extractedEntities);

        // Layer 2: Weighted Scoring & Constraint Analysis
        const weightedSkills = this.analyzeConstraints(this.jobDescription, normalizedSkills);

        // Store results
        this.requiredSkills = weightedSkills.map(skill => ({
            name: skill.name,
            category: skill.category,
            type: skill.type,
            weight: skill.weight,
            constraint: skill.constraint,
            synonyms: skill.synonyms
        }));

        // Calculate overall alignment score (will be used later)
        this.alignmentScore = this.calculateAlignmentScore(weightedSkills);
    }

    escapeRegex(text) {
        return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    matchesSkillInText(text, skillTerm) {
        const escapedTerm = this.escapeRegex(skillTerm.toLowerCase());
        const regex = new RegExp(`(^|[^a-z0-9_])${escapedTerm}($|[^a-z0-9_])`, 'i');
        return regex.test(text.toLowerCase());
    }

    extractEntities(text) {
        const entities = [];
        const lowerText = text.toLowerCase();

        // Extract entities using whole-word / token matching
        for (const [skillKey, skillData] of Object.entries(this.skillDatabase)) {
            // Check main skill name
            if (this.matchesSkillInText(lowerText, skillKey)) {
                entities.push({
                    name: skillKey,
                    category: skillData.category,
                    type: skillData.type,
                    found: skillKey,
                    confidence: 1.0
                });
            }

            // Check synonyms
            for (const synonym of skillData.synonyms) {
                if (this.matchesSkillInText(lowerText, synonym)) {
                    entities.push({
                        name: skillKey,
                        category: skillData.category,
                        type: skillData.type,
                        found: synonym,
                        confidence: 0.8
                    });
                }
            }
        }

        // Remove duplicates and keep highest confidence
        const uniqueEntities = {};
        entities.forEach(entity => {
            if (!uniqueEntities[entity.name] || uniqueEntities[entity.name].confidence < entity.confidence) {
                uniqueEntities[entity.name] = entity;
            }
        });

        return Object.values(uniqueEntities);
    }

    normalizeAndMapEntities(entities) {
        const normalized = [];

        entities.forEach(entity => {
            const skillData = this.skillDatabase[entity.name];

            if (skillData.mapsTo) {
                // Handle stack mappings (e.g., MERN -> React, Node, Express, MongoDB)
                skillData.mapsTo.forEach(mappedSkill => {
                    if (this.skillDatabase[mappedSkill]) {
                        normalized.push({
                            name: mappedSkill,
                            category: this.skillDatabase[mappedSkill].category,
                            type: this.skillDatabase[mappedSkill].type,
                            originalEntity: entity.name,
                            confidence: entity.confidence * 0.9,
                            synonyms: this.skillDatabase[mappedSkill].synonyms
                        });
                    }
                });
            } else {
                // Direct mapping
                normalized.push({
                    name: entity.name,
                    category: skillData.category,
                    type: skillData.type,
                    originalEntity: entity.name,
                    confidence: entity.confidence,
                    synonyms: skillData.synonyms
                });
            }
        });

        // Handle inferred mappings (e.g., Quality Assurance -> Testing tools)
        const inferredMappings = this.applyInferredMappings(normalized, entities);
        normalized.push(...inferredMappings);

        return normalized;
    }

    applyInferredMappings(normalizedSkills, rawEntities) {
        const inferred = [];

        // Example: If JD mentions "Quality Assurance" and resume has testing tools
        const hasQualityAssurance = rawEntities.some(e => e.name === 'testing');
        if (hasQualityAssurance) {
            // This would be checked against resume in real implementation
            // For now, just add the mapping logic
        }

        return inferred;
    }

    analyzeConstraints(text, skills) {
        const lowerText = text.toLowerCase();
        const weightedSkills = [];

        skills.forEach(skill => {
            let weight = 5; // Default weight
            let constraint = 'preferred';

            // Identify must-haves vs nice-to-haves
            const skillContext = this.getSkillContext(text, skill.name, skill.synonyms);

            if (skillContext) {
                const contextText = skillContext.toLowerCase();

                // Must-have indicators
                if (contextText.includes('required') ||
                    contextText.includes('must have') ||
                    contextText.includes('essential') ||
                    contextText.includes('mandatory') ||
                    contextText.includes('strong') ||
                    /^\d+\s*\+?\s*years?/.test(contextText)) { // e.g., "3+ years"
                    weight = 10;
                    constraint = 'must-have';
                }
                // Nice-to-have indicators
                else if (contextText.includes('nice to have') ||
                         contextText.includes('preferred') ||
                         contextText.includes('plus') ||
                         contextText.includes('bonus') ||
                         contextText.includes('advantage')) {
                    weight = 4;
                    constraint = 'nice-to-have';
                }
                // Strong preference
                else if (contextText.includes('experience with') ||
                         contextText.includes('familiar with') ||
                         contextText.includes('knowledge of')) {
                    weight = 7;
                    constraint = 'preferred';
                }
            }

            weightedSkills.push({
                ...skill,
                weight: weight,
                constraint: constraint
            });
        });

        return weightedSkills;
    }

    getSkillContext(text, skillName, synonyms) {
        const sentences = text.split(/[.!?]+/);
        const skillWords = [skillName, ...synonyms];

        for (const sentence of sentences) {
            const lowerSentence = sentence.toLowerCase();
            if (skillWords.some(word => lowerSentence.includes(word))) {
                return sentence.trim();
            }
        }
        return null;
    }

    normalizeSkillKey(skill) {
        return String(skill || '')
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    getResourceProfile(skill) {
        const key = this.normalizeSkillKey(skill);
        if (this.resourceDatabase[key]) {
            return this.resourceDatabase[key];
        }

        return {
            focus: `Build targeted expertise in ${skill} through guided practice and real-world examples.`,
            resources: [
                { name: `${skill} Fundamentals`, url: `https://www.google.com/search?q=${encodeURIComponent(skill + ' tutorial')}`, time: '12 hours' },
                { name: `Hands-on ${skill} Project`, url: `https://www.github.com/search?q=${encodeURIComponent(skill + ' project')}`, time: '15 hours' }
            ]
        };
    }

    inferRelatedSkillsForGap(gap) {
        const gapKey = this.normalizeSkillKey(gap.skill);
        const candidateKeys = new Set(Object.keys(this.candidateSkills).map(key => this.normalizeSkillKey(key)));
        const related = [];

        if (this.learningModel.relatedSkills[gapKey]) {
            related.push(...this.learningModel.relatedSkills[gapKey]);
        }

        if (related.length < 2) {
            const sameTypeSkills = Object.entries(this.skillDatabase)
                .filter(([name, data]) => data.type === gap.type && this.normalizeSkillKey(name) !== gapKey)
                .map(([name]) => name);

            sameTypeSkills.forEach(skill => {
                if (related.length >= 2) return;
                if (!related.includes(skill)) {
                    related.push(skill);
                }
            });
        }

        return related
            .filter(skill => !candidateKeys.has(this.normalizeSkillKey(skill)))
            .slice(0, 2);
    }

    calculateSkillAffinity(gap, candidateSkillName) {
        const gapKey = this.normalizeSkillKey(gap.skill);
        const candidateKey = this.normalizeSkillKey(candidateSkillName);
        const gapData = this.skillDatabase[gapKey] || {};
        const candidateData = this.skillDatabase[candidateKey] || {};
        let score = 0;

        if (gapData.type && candidateData.type && gapData.type === candidateData.type) score += 2;
        if (gapData.category && candidateData.category && gapData.category === candidateData.category) score += 1;
        if (candidateKey.includes(gapKey) || gapKey.includes(candidateKey)) score += 1;

        const candidate = this.candidateSkills[candidateSkillName];
        if (candidate) {
            if (candidate.recency === 'current') score += 2;
            else if (candidate.recency === 'recent') score += 1;
            score += candidate.actionResultScore / 5;
        }

        return score;
    }

    generateLearningPlan(gaps) {
        const plan = [];
        const seenSkills = new Set();

        for (const gap of gaps) {
            const gapKey = this.normalizeSkillKey(gap.skill);
            const coreProfile = this.getResourceProfile(gap.skill);
            const focus = coreProfile.focus;
            const coreTime = coreProfile.resources.reduce((total, res) => {
                const match = res.time.match(/(\d+)/);
                return total + (match ? parseInt(match[1], 10) : 0);
            }, 0);

            if (!seenSkills.has(gapKey)) {
                plan.push({
                    skill: gap.skill,
                    reason: `Core job requirement with a ${gap.constraint} priority and personalized gap analysis.`,
                    focus,
                    resources: coreProfile.resources,
                    time: `${coreTime} hours`
                });
                seenSkills.add(gapKey);
            }

            const relatedSkills = this.inferRelatedSkillsForGap(gap);
            relatedSkills.forEach(related => {
                const relatedKey = this.normalizeSkillKey(related);
                if (seenSkills.has(relatedKey)) return;

                const relatedProfile = this.getResourceProfile(related);
                const relatedTime = relatedProfile.resources.reduce((total, res) => {
                    const match = res.time.match(/(\d+)/);
                    return total + (match ? parseInt(match[1], 10) : 0);
                }, 0);

                const candidateMatches = Object.keys(this.candidateSkills)
                    .sort((a, b) => this.calculateSkillAffinity(gap, b) - this.calculateSkillAffinity(gap, a));

                const personalizedAnchor = candidateMatches.length > 0 ? candidateMatches[0] : null;
                const reasonAnchor = personalizedAnchor
                    ? `AI-inferred complement to ${gap.skill}, building on your existing experience with ${personalizedAnchor}.`
                    : `AI-inferred complement to ${gap.skill} for broader role alignment.`;

                plan.push({
                    skill: related,
                    reason: reasonAnchor,
                    focus: relatedProfile.focus,
                    resources: relatedProfile.resources,
                    time: `${relatedTime} hours`
                });
                seenSkills.add(relatedKey);
            });
        }

        return plan;
    }

    calculateAlignmentScore(weightedSkills) {
        // This will be calculated when comparing with candidate skills
        return 0;
    }

    extractCandidateSkills() {
        // Layer 1: Semantic Entity Extraction & Normalization
        const extractedEntities = this.extractEntities(this.resume);
        const normalizedSkills = this.normalizeAndMapEntities(extractedEntities);

        // Layer 3: Contextual Depth (Recency & Action-Result)
        const skillsWithContext = this.analyzeContextualDepth(this.resume, normalizedSkills);

        // Store results with enhanced context
        this.candidateSkills = {};
        skillsWithContext.forEach(skill => {
            this.candidateSkills[skill.name] = {
                category: skill.category,
                type: skill.type,
                recency: skill.recency,
                actionResultScore: skill.actionResultScore,
                confidence: skill.confidence,
                evidence: skill.evidence
            };
        });
    }

    analyzeContextualDepth(text, skills) {
        const skillsWithContext = [];
        const lowerText = text.toLowerCase();

        skills.forEach(skill => {
            const skillContext = {
                name: skill.name,
                category: skill.category,
                type: skill.type,
                confidence: skill.confidence,
                recency: 'unknown',
                actionResultScore: 0,
                evidence: []
            };

            // Analyze recency
            skillContext.recency = this.determineRecency(text, skill.name, skill.synonyms);

            // Analyze action-result patterns
            skillContext.actionResultScore = this.analyzeActionResult(text, skill.name, skill.synonyms);
            skillContext.evidence = this.extractEvidence(text, skill.name, skill.synonyms);

            skillsWithContext.push(skillContext);
        });

        return skillsWithContext;
    }

    determineRecency(text, skillName, synonyms) {
        const currentYear = new Date().getFullYear();
        const lines = text.split('\n');
        const skillWords = [skillName, ...synonyms];

        let mostRecentYear = 0;
        let foundInCurrentRole = false;

        for (const line of lines) {
            const lowerLine = line.toLowerCase();

            // Check if skill is mentioned in current role section
            if (lowerLine.includes('current') || lowerLine.includes('present') ||
                lowerLine.includes('now') || /^\d{4}\s*-\s*(present|current|now)/.test(lowerLine)) {
                if (skillWords.some(word => lowerLine.includes(word))) {
                    foundInCurrentRole = true;
                }
            }

            // Extract years from date ranges
            const yearMatches = line.match(/\b(19|20)\d{2}\b/g);
            if (yearMatches && skillWords.some(word => lowerLine.includes(word))) {
                yearMatches.forEach(yearStr => {
                    const year = parseInt(yearStr);
                    if (year > mostRecentYear && year <= currentYear) {
                        mostRecentYear = year;
                    }
                });
            }
        }

        if (foundInCurrentRole) {
            return 'current';
        } else if (mostRecentYear > 0) {
            const yearsAgo = currentYear - mostRecentYear;
            if (yearsAgo <= 2) return 'recent';
            if (yearsAgo <= 5) return 'moderate';
            return 'old';
        }

        return 'unknown';
    }

    analyzeActionResult(text, skillName, synonyms) {
        const sentences = text.split(/[.!?]+/);
        const skillWords = [skillName, ...synonyms];
        let score = 0;

        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();

            // Check if sentence contains the skill
            const hasSkill = skillWords.some(word => lowerSentence.includes(word));
            if (!hasSkill) return;

            // Check for action patterns
            const hasAction = this.actionPatterns.some(action =>
                lowerSentence.includes(action)
            );

            // Check for result patterns
            const hasResult = this.resultPatterns.some(result =>
                lowerSentence.includes(result)
            );

            // Scoring based on patterns found
            if (hasAction && hasResult) {
                score += 3; // Strong evidence of practical application
            } else if (hasAction) {
                score += 2; // Good evidence of active use
            } else if (hasResult) {
                score += 1; // Some evidence of impact
            } else {
                score += 0.5; // Basic mention
            }
        });

        return Math.min(5, score); // Cap at 5
    }

    extractEvidence(text, skillName, synonyms) {
        const evidence = [];
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10); // Filter out very short sentences
        const skillWords = [skillName, ...synonyms];

        sentences.forEach((sentence, index) => {
            const lowerSentence = sentence.toLowerCase();
            const hasSkill = skillWords.some(word => lowerSentence.includes(word));

            if (hasSkill) {
                // Only include sentences that are relevant and not too long
                const cleanSentence = sentence.trim();
                if (cleanSentence.length < 200 && cleanSentence.length > 15) {
                    evidence.push({
                        text: cleanSentence,
                        lineNumber: index + 1,
                        type: this.classifyEvidence(cleanSentence)
                    });
                }
            }
        });

        // If no specific evidence found, look for skill mentions in sections
        if (evidence.length === 0) {
            const lines = text.split('\n');
            lines.forEach((line, index) => {
                const lowerLine = line.toLowerCase();
                if (skillWords.some(word => lowerLine.includes(word)) && line.trim().length > 5) {
                    evidence.push({
                        text: line.trim(),
                        lineNumber: index + 1,
                        type: 'mention'
                    });
                }
            });
        }

        return evidence.slice(0, 3); // Limit to top 3 pieces of evidence
    }

    classifyEvidence(sentence) {
        const lowerSentence = sentence.toLowerCase();

        if (this.actionPatterns.some(action => lowerSentence.includes(action)) &&
            this.resultPatterns.some(result => lowerSentence.includes(result))) {
            return 'action-result';
        } else if (this.actionPatterns.some(action => lowerSentence.includes(action))) {
            return 'action';
        } else if (this.resultPatterns.some(result => lowerSentence.includes(result))) {
            return 'result';
        } else {
            return 'mention';
        }
    }

    async assessSkills() {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log(`\n=== ASSESSING PROFICIENCY FOR ${this.requiredSkills.length} SKILLS ===`);
        for (const requiredSkill of this.requiredSkills) {
            console.log(`Assessing: ${requiredSkill.name} (${requiredSkill.category})`);
            const level = await this.askProficiency(requiredSkill.name, rl);
            this.skillLevels[requiredSkill.name] = level;
        }

        rl.close();
    }

    askProficiency(skill, rl) {
        return new Promise((resolve) => {
            const ask = () => {
                rl.question(`On a scale of 1-5, how proficient are you in ${skill}? (1=Beginner, 5=Expert) `, (answer) => {
                    const trimmed = answer.trim();
                    if (trimmed === '') {
                        console.log('Please enter a proficiency level (1-5).');
                        ask();
                        return;
                    }
                    const level = parseInt(trimmed);
                    if (isNaN(level) || level < 1 || level > 5) {
                        console.log('Please enter a valid number between 1 and 5.');
                        ask();
                        return;
                    }
                    resolve(level);
                });
            };
            ask();
        });
    }

    identifyGaps() {
        const gaps = [];

        // Compare required skills with candidate skills
        this.requiredSkills.forEach(requiredSkill => {
            const candidateSkill = this.candidateSkills[requiredSkill.name];

            let hasGap = true;
            let gapReason = '';

            if (candidateSkill) {
                // Check proficiency level (if assessed)
                if (this.skillLevels[requiredSkill.name]) {
                    if (this.skillLevels[requiredSkill.name] >= 3) {
                        hasGap = false;
                    } else {
                        gapReason = `Low proficiency (${this.skillLevels[requiredSkill.name]}/5)`;
                    }
                } else {
                    // If not assessed, check recency and action-result score
                    if (candidateSkill.recency === 'current' && candidateSkill.actionResultScore >= 2) {
                        hasGap = false;
                    } else if (candidateSkill.recency === 'recent' && candidateSkill.actionResultScore >= 1.5) {
                        hasGap = false;
                    } else {
                        gapReason = `Limited recency or practical experience`;
                    }
                }
            } else {
                gapReason = 'Skill not found in resume';
            }

            if (hasGap) {
                gaps.push({
                    skill: requiredSkill.name,
                    category: requiredSkill.category,
                    type: requiredSkill.type,
                    weight: requiredSkill.weight,
                    constraint: requiredSkill.constraint,
                    reason: gapReason,
                    candidateData: candidateSkill || null
                });
            }
        });

        return gaps;
    }

    calculateAlignmentScore(requiredSkills) {
        let totalScore = 0;
        let maxPossibleScore = 0;

        requiredSkills.forEach(requiredSkill => {
            maxPossibleScore += requiredSkill.weight;
            const candidateSkill = this.candidateSkills[requiredSkill.name];

            if (candidateSkill) {
                let skillScore = 0;

                // Base score from presence
                skillScore += requiredSkill.weight * 0.3;

                // Recency bonus
                if (candidateSkill.recency === 'current') skillScore += requiredSkill.weight * 0.4;
                else if (candidateSkill.recency === 'recent') skillScore += requiredSkill.weight * 0.3;
                else if (candidateSkill.recency === 'moderate') skillScore += requiredSkill.weight * 0.2;

                // Action-result bonus
                skillScore += (candidateSkill.actionResultScore / 5) * requiredSkill.weight * 0.3;

                // Proficiency bonus (if assessed)
                if (this.skillLevels[requiredSkill.name]) {
                    skillScore += (this.skillLevels[requiredSkill.name] / 5) * requiredSkill.weight * 0.4;
                }

                totalScore += Math.min(requiredSkill.weight, skillScore);
            }
        });

        return {
            score: totalScore,
            maxScore: maxPossibleScore,
            percentage: maxPossibleScore > 0 ? Math.round((totalScore / maxPossibleScore) * 100) : 0
        };
    }

    async run(jobDescFile, resumeFile) {
        this.resetState();
        
        // Extract text from files using the same logic as the web interface
        const jobDescMimeType = this.getMimeTypeFromPath(jobDescFile);
        const resumeMimeType = this.getMimeTypeFromPath(resumeFile);
        
        const jobDescription = await this.extractTextFromFile(jobDescFile, jobDescMimeType);
        const resumeText = await this.extractTextFromFile(resumeFile, resumeMimeType);
        
        this.loadJobDescription(jobDescription);
        this.loadResume(resumeText);

        console.log('=== REQUIRED SKILLS ANALYSIS ===');
        console.log(`Extracted ${this.requiredSkills.length} skills from job description:`);
        this.requiredSkills.forEach(skill => {
            console.log(`- ${skill.name} (${skill.category}) - ${skill.constraint} (weight: ${skill.weight})`);
        });

        console.log('\n=== CANDIDATE SKILLS ANALYSIS ===');
        console.log(`Extracted ${Object.keys(this.candidateSkills).length} skills from resume:`);
        Object.entries(this.candidateSkills).forEach(([skillName, skillData]) => {
            console.log(`- ${skillName} (${skillData.category})`);
        });

        await this.assessSkills();

        const gaps = this.identifyGaps();
        console.log('\n=== SKILL GAPS IDENTIFIED ===');
        if (gaps.length === 0) {
            console.log('No significant skill gaps found!');
        } else {
            gaps.forEach(gap => {
                console.log(`- ${gap.skill} (${gap.category}) - ${gap.constraint} - ${gap.reason}`);
            });
        }

        const plan = this.generateLearningPlan(gaps);
        console.log('\n=== PERSONALIZED LEARNING PLAN ===');
        if (plan.length === 0) {
            console.log('No learning recommendations needed at this time.');
        } else {
            plan.forEach(item => {
                console.log(`- Learn ${item.skill} (${item.reason})`);
                console.log(`  Resources: ${item.resources.map(r => r.name + ' (' + r.url + ')').join(', ')}`);
                console.log(`  Estimated time: ${item.time}`);
            });
        }
    }
}

module.exports = Agent;