// solana_sum_generator_main.ts
// Main controller for multi-threaded Solana vanity address search

import { Worker } from 'worker_threads';
import * as os from 'os';
import * as fs from 'fs';

const OUTPUT_FILE = 'solana_sum_addresses.txt';
const targetMatches = 1; // Change as needed
const suffix = 'summon'; // Change as needed
const numWorkers = os.cpus().length;

let found = 0;
const output: string[] = [];
const workers: Worker[] = [];

function stopAllWorkers() {
    for (const worker of workers) {
        worker.terminate();
    }
}

for (let i = 0; i < numWorkers; i++) {
    const worker = new Worker('./solana_sum_worker.js', {
        workerData: { suffix }
    });
    worker.on('message', (msg) => {
        if (found < targetMatches) {
            output.push(`Address: ${msg.pubkey}\nPrivateKey: ${msg.privkey}\n`);
            console.log(`Found: ${msg.pubkey}`);
            found++;
            if (found >= targetMatches) {
                fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
                console.log(`Done. Saved to ${OUTPUT_FILE}`);
                stopAllWorkers();
            }
        }
    });
    workers.push(worker);
}
