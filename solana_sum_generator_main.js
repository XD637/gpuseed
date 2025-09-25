"use strict";
// solana_sum_generator_main.ts
// Main controller for multi-threaded Solana vanity address search
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var os = require("os");
var fs = require("fs");
var OUTPUT_FILE = 'solana_sum_addresses.txt';
var targetMatches = 1; // Change as needed
var suffix = 'summon'; // Change as needed
var numWorkers = os.cpus().length;
var found = 0;
var output = [];
var workers = [];
function stopAllWorkers() {
    for (var _i = 0, workers_1 = workers; _i < workers_1.length; _i++) {
        var worker = workers_1[_i];
        worker.terminate();
    }
}
for (var i = 0; i < numWorkers; i++) {
    var worker = new worker_threads_1.Worker('./solana_sum_worker.js', {
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
