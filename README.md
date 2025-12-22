# Solana Vanity Generator

A high-performance, multi-threaded Solana vanity address generator with CLI support.

## Features

- **Multi-threaded**: Utilizes all CPU cores for maximum performance
- **Flexible Matching**: Search by prefix, suffix, or substring
- **Auto-save Progress**: Gracefully handles interruptions (Ctrl+C)
- **Easy to Use**: Simple CLI with intuitive flags
- **Customizable**: Configure worker threads, output files, and targets

## Installation

### Global Installation (Recommended)
```bash
npm install -g solana-vanity-generator
```

### Local Installation
```bash
npm install solana-vanity-generator
```

### From Source
```bash
git clone <your-repo>
cd solana-vanity-generator
npm install
npm run build
npm link
```

## Usage

### Basic Examples

Generate addresses ending with "sum":
```bash
solana-vanity-generator --suffix sum
# or use the short alias
svg --suffix sum
```

Generate addresses starting with "ABC":
```bash
svg --prefix ABC --count 100
```

Generate addresses containing "pump":
```bash
svg --contains pump --count 50
```

Combine multiple patterns:
```bash
svg --prefix So --suffix ana --count 10
```

### CLI Options

```
Options:
  -V, --version          output the version number
  -s, --suffix <string>  Address suffix to search for (default: "sum")
  -p, --prefix <string>  Address prefix to search for (case-sensitive)
  --contains <string>    Address must contain this string anywhere
  -c, --count <number>   Number of addresses to generate (default: "500")
  -o, --output <file>    Output JSON file (default: "solana_addresses.json")
  -w, --workers <number> Number of worker threads (default: CPU cores)
  -h, --help            display help for command
```

### Advanced Usage

Custom worker count and output file:
```bash
svg --suffix DAO --workers 8 --output dao_wallets.json
```

Generate 1000 addresses with specific prefix:
```bash
svg --prefix Pump --count 1000
```

## Output Format

The generated addresses are saved in JSON format:

```json
[
  {
    "address": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "privateKey": "base58_encoded_private_key_here"
  }
]
```

## Performance Tips

1. **More cores = faster generation**: The tool uses all CPU cores by default
2. **Longer patterns = longer generation time**: Each additional character increases difficulty exponentially
3. **Case-sensitive**: Prefix matching is case-sensitive
4. **Save progress**: Press Ctrl+C to safely stop and save current progress

## Example Use Cases

### For NFT Projects
```bash
svg --prefix NFT --count 100 --output nft_wallets.json
```

### For DAOs
```bash
svg --suffix DAO --count 50 --output dao_addresses.json
```

### For Personal Vanity
```bash
svg --contains YourName --count 10
```

## How It Works

The tool uses Node.js worker threads to parallelize the address generation process:
1. Spawns one worker per CPU core
2. Each worker continuously generates Solana keypairs
3. Checks each address against your pattern(s)
4. Saves matches to JSON file in real-time
5. Gracefully handles interruptions

## Security Note

**IMPORTANT**: The generated private keys are stored in plain text. Keep your output files secure and never share them publicly. Consider encrypting the output file for production use.

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

If you find this tool useful, consider starring the repository.
