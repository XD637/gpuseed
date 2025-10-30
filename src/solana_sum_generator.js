"use strict";
// solana_sum_generator.ts
// Multi-threaded Solana vanity address generator (all in one file)
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const OUTPUT_FILE = 'solana_sum_addresses.json';
const targetMatches = 500; // Change as needed
const suffix = 'sum'; // Change as needed
const numWorkers = os.cpus().length;
let found = 0;
const workers = [];
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
function saveToJson(pubkey, privkey) {
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
    }
    catch (error) {
        console.error('Error saving to JSON:', error);
    }
}
function stopAllWorkers() {
    for (const worker of workers) {
        worker.terminate();
    }
}
for (let i = 0; i < numWorkers; i++) {
    const worker = new worker_threads_1.Worker(workerCode, {
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
