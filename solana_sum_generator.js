"use strict";
// Solana Vanity Address Generator Script
// This script generates Solana keypairs and saves those whose public address ends with "sum" to a file.
// Edit `targetMatches` to control how many matches you want to find.
Object.defineProperty(exports, "__esModule", { value: true });
var web3_js_1 = require("@solana/web3.js");
var bs58_1 = require("bs58");
var fs = require("fs");
var OUTPUT_FILE = 'solana_sum_addresses.txt';
var targetMatches = 1; // Change as needed
var found = 0;
var output = [];
while (found < targetMatches) {
    var kp = web3_js_1.Keypair.generate();
    var pubkey = kp.publicKey.toBase58();
    if (pubkey.endsWith('sum')) {
        // bs58.encode expects Uint8Array
        var privkey = bs58_1.default.encode(new Uint8Array(kp.secretKey));
        output.push("Address: ".concat(pubkey, "\nPrivateKey: ").concat(privkey, "\n"));
        console.log("Found: ".concat(pubkey));
        found++;
    }
}
fs.writeFileSync(OUTPUT_FILE, output.join('\n'));
console.log("Done. Saved to ".concat(OUTPUT_FILE));
