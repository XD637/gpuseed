"use strict";
// solana_sum_worker.ts
// Worker thread for generating Solana keypairs and checking for vanity suffix
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var web3_js_1 = require("@solana/web3.js");
var bs58_1 = require("bs58");
var suffix = worker_threads_1.workerData.suffix;
console.log('Worker started with suffix:', suffix);
function findVanity() {
    while (true) {
        var kp = web3_js_1.Keypair.generate();
        var pubkey = kp.publicKey.toBase58();
        if (pubkey.endsWith(suffix)) {
            var privkey = bs58_1.default.encode(new Uint8Array(kp.secretKey));
            worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage({ pubkey: pubkey, privkey: privkey });
        }
    }
}
findVanity();
