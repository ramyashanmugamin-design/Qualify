const Agent = require('./Agent');

async function main() {
    if (process.argv.length < 4) {
        console.log('Usage: node index.js <job_description.txt> <resume.txt>');
        process.exit(1);
    }

    const agent = new Agent();
    await agent.run(process.argv[2], process.argv[3]);
}

main();