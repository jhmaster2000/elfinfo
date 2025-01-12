import assert from 'assert';
import * as elfinfo from "../src";
import { stockPrograms, stockProgramNames, stockProgramAbis } from './testprograms';
import { category, test } from './';

category("Stock Programs", async () => {

    await Promise.all(stockProgramNames.flatMap<Promise<void>>(name =>
        stockProgramAbis.map(async (abi) => {
            const { program } = stockPrograms[name][abi];

            const elf = await elfinfo.open(program);

            elf.warnings.forEach(w => console.warn(w));
            elf.errors.forEach(e => console.error(e));

            test(`${name} (${abi}) should open without problems`, async () => {
                assert(elf.success === true);
                assert(elf.errors.length === 0);
                assert(elf.warnings.length === 0);
            });

            test(`${name} (${abi}) should have sections`, async () => {
                assert(elf.elf);
                assert(elf.elf.sections.length > 0);
            });

            test(`${name} (${abi}) should have segments`, async () => {
                assert(elf.elf);
                assert(elf.elf.segments.length > 0);
            });

            const symbols = elf.elf && elfinfo.getSymbols(elf.elf);
            test(`${name} (${abi}) should have symbols`, async () => {
                assert(symbols);
            });

            test(`${name} (${abi}) should have a main symbol`, async () => {
                let main_symbol_found = false;
                assert(symbols);
                for (const symbol of symbols) {
                    if (/_?main/.test(symbol.name)) {
                        main_symbol_found = true;
                        break;
                    }
                }
                assert(main_symbol_found);
            });
        })));
});
