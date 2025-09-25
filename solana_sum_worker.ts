// solana_sum_worker.ts
// Worker thread for generating Solana keypairs and checking for vanity suffix

import { parentPort, workerData } from 'worker_threads';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';


const suffix: string = workerData.suffix;
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
