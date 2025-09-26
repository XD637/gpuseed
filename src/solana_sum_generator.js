"use strict";
// solana_sum_generator.ts
// Multi-threaded Solana vanity address generator (all in one file)
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var os = require("os");
var fs = require("fs");
var OUTPUT_FILE = 'solana_sum_addresses.txt';
var targetMatches = 100; // Change as needed
var suffix = 'sum'; // Change as needed
var numWorkers = os.cpus().length;
var found = 0;
var output = [];
var workers = [];
// Worker code as a string
var workerCode = "\nimport { parentPort, workerData } from 'worker_threads';\nimport { Keypair } from '@solana/web3.js';\nimport bs58 from 'bs58';\n\nconst suffix = workerData.suffix;\nconsole.log('Worker started with suffix:', suffix);\n\nfunction findVanity() {\n    while (true) {\n        const kp = Keypair.generate();\n        const pubkey = kp.publicKey.toBase58();\n        if (pubkey.endsWith(suffix)) {\n            const privkey = bs58.encode(new Uint8Array(kp.secretKey));\n            parentPort?.postMessage({ pubkey, privkey });\n        }\n    }\n}\n\nfindVanity();\n";
function stopAllWorkers() {
    for (var _i = 0, workers_1 = workers; _i < workers_1.length; _i++) {
        var worker = workers_1[_i];
        worker.terminate();
    }
}
for (var i = 0; i < numWorkers; i++) {
    var worker = new worker_threads_1.Worker(workerCode, {
        eval: true,
        workerData: { suffix: suffix }
    });
    worker.on('message', function (msg) {
        if (found < targetMatches) {
            output.push("Address: ".concat(msg.pubkey, "\nPrivateKey: ").concat(msg.privkey, "\n"));
            console.log("Found: ".concat(msg.pubkey));
            found++;
            if (found >= targetMatches) {
                fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
                console.log("Done. Saved to ".concat(OUTPUT_FILE));
                stopAllWorkers();
            }
        }
    });
    workers.push(worker);
}
