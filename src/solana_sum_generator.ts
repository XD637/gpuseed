#!/usr/bin/env node
// solana_sum_generator.ts
// Multi-threaded Solana vanity address generator (all in one file)

import { Worker } from 'worker_threads';
import * as os from 'os';
import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import { Command } from 'commander';

// Parse CLI arguments
const program = new Command();
program
    .name('solana-vanity-generator')
    .description('Multi-threaded Solana vanity address generator')
    .version('1.0.0')
    .option('-s, --suffix <string>', 'Address suffix to search for', 'sum')
    .option('-p, --prefix <string>', 'Address prefix to search for (case-sensitive)')
    .option('-c, --count <number>', 'Number of addresses to generate', '500')
    .option('-o, --output <file>', 'Output JSON file', 'solana_addresses.json')
    .option('-w, --workers <number>', 'Number of worker threads (default: CPU cores)')
    .option('--contains <string>', 'Address must contain this string anywhere')
    .parse();

const options = program.opts();

const OUTPUT_FILE = options.output;
const targetMatches = parseInt(options.count);
const suffix = options.suffix;
const prefix = options.prefix;
const contains = options.contains;
const numWorkers = options.workers ? parseInt(options.workers) : os.cpus().length;

// Warn if pattern is too long
if (suffix && suffix.length > 4) {
    console.log(`WARNING: Suffix "${suffix}" is ${suffix.length} characters. This will take exponentially longer to find!`);
    console.log(`Recommendation: Use 4 or fewer characters for reasonable generation time.\n`);
}
if (prefix && prefix.length > 4) {
    console.log(`WARNING: Prefix "${prefix}" is ${prefix.length} characters. This will take exponentially longer to find!`);
    console.log(`Recommendation: Use 4 or fewer characters for reasonable generation time.\n`);
}
if (contains && contains.length > 4) {
    console.log(`WARNING: Contains "${contains}" is ${contains.length} characters. This will take exponentially longer to find!`);
    console.log(`Recommendation: Use 4 or fewer characters for reasonable generation time.\n`);
}

let found = 0;
const workers: Worker[] = [];

// Initialize JSON file with empty array
if (!fs.existsSync(OUTPUT_FILE)) {
    fs.writeFileSync(OUTPUT_FILE, '[]');
}

// Worker code as a string
const workerCode = `
import { parentPort, workerData } from 'worker_threads';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const { suffix, prefix, contains } = workerData;

function findVanity() {
    while (true) {
        const kp = Keypair.generate();
        const pubkey = kp.publicKey.toBase58();
        let matches = true;
        if (suffix && !pubkey.endsWith(suffix)) matches = false;
        if (prefix && !pubkey.startsWith(prefix)) matches = false;
        if (contains && !pubkey.includes(contains)) matches = false;
        if (matches) {
            const privkey = bs58.encode(new Uint8Array(kp.secretKey));
            parentPort?.postMessage({ pubkey, privkey });
        }
    }
}

findVanity();
`;

function saveToJson(pubkey: string, privkey: string) {
    try {
        // Read existing data
        const existingData = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
        
        // Add new entry
        existingData.push({
            address: pubkey,
            privateKey: privkey
        });
        
        // Write back to file
        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(existingData, null, 2));
    } catch (error) {
        console.error('Error saving to JSON:', error);
    }
}

function stopAllWorkers() {
    for (const worker of workers) {
        worker.terminate();
    }
}

for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker(workerCode, {
        eval: true,
        workerData: { suffix, prefix, contains }
    });
    worker.on('message', (msg) => {
        if (found < targetMatches) {
            saveToJson(msg.pubkey, msg.privkey);
            console.log(`Found ${found + 1}/${targetMatches}: ${msg.pubkey}`);
            found++;
            if (found >= targetMatches) {
                console.log(`Done! All ${targetMatches} addresses saved to ${OUTPUT_FILE}`);
                stopAllWorkers();
            }
        }
    });
    workers.push(worker);
}

// Graceful shutdown handling
process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...');
    stopAllWorkers();
    console.log(`Progress saved! Found ${found} addresses so far in ${OUTPUT_FILE}`);
    process.exit(0);
});

// Display search criteria
const patterns: string[] = [];
if (suffix) patterns.push(`suffix: "${suffix}"`);
if (prefix) patterns.push(`prefix: "${prefix}"`);
if (contains) patterns.push(`contains: "${contains}"`);

console.log(`Solana Vanity Address Generator`);
console.log(`Started ${numWorkers} workers`);
console.log(`Searching for addresses with ${patterns.join(', ')}`);
console.log(`Target: ${targetMatches} addresses`);
console.log(`Output: ${OUTPUT_FILE}`);
console.log(`Press Ctrl+C to stop and save progress\n`);
