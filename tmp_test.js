const Agent = require('./Agent');
const agent = new Agent();
agent.loadJobDescription('Looking for experience in JavaScript, NodeJS, and React.');
agent.loadResume('Experienced in JavaScript and React.');
console.log('Required:', agent.requiredSkills.map(s => s.name));
console.log('Candidate:', Object.keys(agent.candidateSkills));
