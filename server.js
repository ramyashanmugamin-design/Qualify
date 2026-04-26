const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Agent = require('./Agent');
const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');

// Suppress PDF.js warnings globally - must be done before any PDF processing
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

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/rtf', 'text/rtf', 'text/plain'];
    const allowedExtensions = ['.pdf', '.doc', '.docx', '.rtf', '.txt'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    
    if (allowedExtensions.includes(ext) && (allowedMimes.includes(mime) || file.originalname.endsWith('.rtf') || file.originalname.endsWith('.txt'))) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file format. Supported: PDF, DOC, DOCX, RTF, TXT'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

// Middleware
app.use(express.static('.', {
    setHeaders: (res, filePath) => {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
    }
}));
app.use(express.json());

// Routes

// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Extract text from uploaded files
async function extractTextFromFile(filePath, mimeType) {
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

// Upload and process files
app.post('/api/upload', upload.fields([
    { name: 'jobDescription', maxCount: 1 },
    { name: 'resume', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.jobDescription || !req.files.resume) {
            return res.status(400).json({ error: 'Both job description and resume files are required' });
        }

        const jobFile = req.files.jobDescription[0];
        const resumeFile = req.files.resume[0];

        // Extract text from files
        const jobDescription = await extractTextFromFile(jobFile.path, jobFile.mimetype);
        const resumeText = await extractTextFromFile(resumeFile.path, resumeFile.mimetype);

        // Clean up uploaded files
        fs.unlinkSync(jobFile.path);
        fs.unlinkSync(resumeFile.path);

        // Initialize agent and process
        const agent = new Agent();
        agent.loadJobDescription(jobDescription);
        agent.loadResume(resumeText);

        const result = {
            requiredSkills: agent.requiredSkills.map(skill => skill.name),
            candidateSkills: Object.keys(agent.candidateSkills),
            alignmentScore: agent.calculateAlignmentScore(agent.requiredSkills),
            message: 'Files processed successfully. Please assess your skills.'
        };

        res.json(result);
    } catch (error) {
        console.error('Upload error:', error);
        
        // Clean up any uploaded files
        if (req.files) {
            if (req.files.jobDescription && req.files.jobDescription[0]) {
                try { fs.unlinkSync(req.files.jobDescription[0].path); } catch (e) {}
            }
            if (req.files.resume && req.files.resume[0]) {
                try { fs.unlinkSync(req.files.resume[0].path); } catch (e) {}
            }
        }
        
        res.status(400).json({ error: error.message || 'File upload failed' });
    }
});

// Handle file size errors
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(400).json({ error: 'File size exceeds 2MB limit' });
        }
        return res.status(400).json({ error: 'File upload error: ' + err.message });
    } else if (err) {
        return res.status(400).json({ error: err.message });
    }
    next();
});

// Return JSON for unknown API routes
app.use('/api', (req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
});

// SPA fallback for frontend routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Qualify Agent running on http://localhost:${PORT}`);
});
