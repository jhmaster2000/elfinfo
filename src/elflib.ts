#!/usr/bin/env node
import { open } from './index.js';
import { debug } from './debug.js';

main(process.argv.slice(2)).then(null, console.error);

async function main(args: string[]): Promise<void> {
    if (args.length) {
        for (const program of args) {
            const elf = await open(program);
            console.log(debug(elf));
            console.log('\n\n');
        }
    } else {
        console.log(`Usage: elflib [program]`);
    }
}
