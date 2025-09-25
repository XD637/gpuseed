// Solana Vanity Address Generator Script
// This script generates Solana keypairs and saves those whose public address ends with "sum" to a file.
// Edit `targetMatches` to control how many matches you want to find.


import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';
import * as fs from 'fs';

const OUTPUT_FILE = 'solana_sum_addresses.txt';
const targetMatches = 1; // Change as needed
let found = 0;

const output: string[] = [];

while (found < targetMatches) {
    const kp = Keypair.generate();
    const pubkey = kp.publicKey.toBase58();
    if (pubkey.endsWith('sum')) {
        // bs58.encode expects Uint8Array
        const privkey = bs58.encode(new Uint8Array(kp.secretKey));
        output.push(`Address: ${pubkey}\nPrivateKey: ${privkey}\n`);
        console.log(`Found: ${pubkey}`);
        found++;
    }
}

fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
console.log(`Done. Saved to ${OUTPUT_FILE}`);
