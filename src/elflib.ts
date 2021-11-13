#!/usr/bin/env node
import { open } from './index.js';
import { debug } from './debug.js';

(async function main(): Promise<void> {
    const programs = process.argv.slice(2);

    if (programs.length) {
        for (const program of programs) {
            const elf = await open(program);
            console.log(debug(elf));
            console.log('\n\n');
        }
    } else {
        console.log(`Usage: elflib [program]`);
    }
})().catch(console.error);
