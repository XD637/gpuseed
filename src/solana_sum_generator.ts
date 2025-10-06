// solana_sum_generator.ts
// Multi-threaded Solana vanity address generator (all in one file)

import { Worker } from 'worker_threads';
import * as os from 'os';
import * as fs from 'fs';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const OUTPUT_FILE = 'solana_sum_addresses.txt';
const targetMatches = 1000; // Change as needed
const suffix = 'sum'; // Change as needed
const numWorkers = os.cpus().length;

let found = 0;
const output: string[] = [];
const workers: Worker[] = [];

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
