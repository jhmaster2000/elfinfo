#!/usr/bin/env node
import { open } from './index.js';
import { debug } from './debug.js';
import fs from 'fs';

main(process.argv.slice(2)).then(null, console.error);

async function main(args: string[]): Promise<void> {
    if (args.length) {
        for (const program of args) {
            const elf = await open(fs.readFileSync(program));
            console.log(debug(elf));
            console.log('\n\n');
        }
    } else {
        console.log(`Usage: elflib [program]`);
    }
}
