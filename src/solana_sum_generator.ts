// solana_sum_generator.ts
// Multi-threaded Solana vanity address generator (all in one file)

import { Worker } from 'worker_threads';
import * as os from 'os';
import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const OUTPUT_FILE = 'solana_sum_addresses.json';
const targetMatches = 500; // Change as needed
const suffix = 'sum'; // Change as needed
const numWorkers = os.cpus().length;

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

const suffix = workerData.suffix;
console.log('Worker started with suffix:', suffix);

function findVanity() {
    while (true) {
        const kp = Keypair.generate();
        const pubkey = kp.publicKey.toBase58();
        if (pubkey.endsWith(suffix)) {
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
            privateKey: privkey,
            used: false
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
        workerData: { suffix }
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

console.log(`Started ${numWorkers} workers looking for addresses ending with "${suffix}"`);
console.log(`Target: ${targetMatches} addresses`);
console.log(`Saving to: ${OUTPUT_FILE}`);
