import Result from "./src/result.js"
import Analyzer from "./src/analyzer.js"
import fs from 'fs';
import fetch from 'node-fetch';


/**
 * 
 * @param {string} ctypo - ctypo to be evaluated.
 */
async function evaluateCtypo(ctypo) {
    const blackbook = await fs.promises.readFile('./resources/blackbook.txt', 'utf8');
    const blackbookList = blackbook.split('\n').filter(Boolean);

    const verifiedDomains = await fs.promises.readFile('./resources/top_domains.txt', 'utf8');
    const verifiedDomainsList = verifiedDomains.split('\n').filter(Boolean);

    const keyphrases = await fs.promises.readFile('./resources/keyphrases_domain_parking.txt', 'utf8');
    const keyphrasesList = keyphrases.split('\n').filter(Boolean);

    if (blackbookList.includes(ctypo)) {
        return Result.Malware;
    }

    var analyzer = new Analyzer(true, verifiedDomainsList, keyphrasesList, fetch);

    var request;
    try {
        request = await fetch(`https://${ctypo}`);
    } catch(error) {
        request = await fetch(`http://${ctypo}`);
    }
    var visitedUrl = new URL(request.url);
    var visitedDomain = visitedUrl.hostname.replace(/^www\./, "");

    analyzer.inputDomain = ctypo;
    analyzer.visitedDomain = visitedDomain;

    await analyzer.analyze();
    return analyzer.analysis;
}

/**
 * 
 * @param {string} ctypos_file - file containing a set of ctypos to evaluate
 */
async function evaluateCtypos(ctypos_file) {
    const ctypos = await fs.promises.readFile(ctypos_file, 'utf8');
    const ctyposList = ctypos.split('\n').filter(Boolean);

    var res = {}
    for(const ctypo of ctyposList) {
        res[ctypo] = await evaluateCtypo(ctypo);
    }
    
    return res;
}


async function main() {
    const args = process.argv.slice(1);

    if (args[1] === '--one' || args[1] === '-o') {
        const ctypo = args[2];
        console.log(await evaluateCtypo(ctypo));
    } else if (args[1] === '--multiple' || args[1] === '-m') {
        const ctypos_file = args[2];
        console.log(await evaluateCtypos(ctypos_file));
    } else {
        if (!(args[1] === '--help' || args[1] === '-h')) {
            console.log(`USAGE ERROR!\n\n`);
        }
        console.log(
            `Usage:\t${args[0]} [options] [argument]\n\nOptions:\n
            -o, --one\t\tEvaluate the ctypo passed as an argument\n\n
            -m, --multiple\tEvaluate the ctypos present in the text file passed as an argument\n\n
            -h, --help\t\tPrint this message\n\nExample:\t${args[0]} -o gogle.com`
        );
    }
}

main();
