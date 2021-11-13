import * as ELF from './types/index.js';
//import { readProgramHeaderEntries } from './segments';
//import { virtualAddressToFileOffset } from './elf';
import { isSymbolSection, readSectionHeaderEntries } from './sections.js';
import { Reader } from './reader.js';
import { add, toNumberSafe } from './biginthelpers.js';

/** Options for reading an ELF file. */
export interface OpenOptions {
    /** When true, the data for symbols will also be read */
    readSymbolData: boolean
};

async function updateSymbolAddressesAndLoadSymbols(elf: ELF.File, reader: Reader, loadSymbols: boolean) {
    const readerSize = reader.size();
    const elftype = elf.header.type;
    if (elftype === ELF.Type.Executable || elftype === ELF.Type.Relocatable || elftype === ELF.Type.Shared || elftype === ELF.Type.RPL) {
        for (const section of elf.sections) {
            if (isSymbolSection(section)) {
                for (const symbol of section.symbols) {
                    if (elftype === ELF.Type.Relocatable) {
                        if (symbol.shndx < elf.sections.length) {
                            // offset is from start of section
                            symbol.virtualAddress = add(symbol.value, elf.sections[symbol.shndx].addr);
                        } else if (symbol.shndx === 0xFFF1) {
                            // SHN_ABS
                            symbol.virtualAddress = symbol.value;
                        }
                    } else {
                        // the value is the virtual address
                        symbol.virtualAddress = symbol.value;
                    }

                    if (loadSymbols && symbol.virtualAddress &&
                        (symbol.type === ELF.SymbolType.Function || symbol.type === ELF.SymbolType.Object) && symbol.size) {
                        /*const fileOffset = virtualAddressToFileOffset(elf, symbol.value);
                        if (fileOffset) {
                            if (fileOffset + symbol.size <= readerSize) {
                                symbol.data = await reader.read(symbol.size, fileOffset);
                            } else {
                                debugger;
                            }
                        }*/
                    }
                }
            }
        }
    }
}

export async function readElf(reader: Reader, options: OpenOptions): Promise<ELF.File> {
    let elf: ELF.File = new ELF.File();

    await reader.open();

    const size = reader.size();
    if (size <= 0x40) throw new Error('Not a valid ELF file. Too small.');

    const view = await reader.view(16);

    const magic = 0x7F454C46;
    if (view.getInt32(0, false) !== magic) throw new Error(`Not a valid ELF file. The file does not start with ${magic.toString(16).toUpperCase()}.`);

    const eiClass = view.getUint8(4);
    const eiData = view.getUint8(5);
    const eiVer = view.getUint8(6);
    const eiAbi = view.getUint8(7);
    const eiAbiVer = view.getUint8(8);

    if (eiClass < 1 || eiClass > 2) throw new Error('Not a valid ELF file. Class is invalid');
    if (eiData < 1 || eiData > 2) throw new Error('Not a valid ELF file. Endianness is invalid');
    if (eiVer !== 1) throw new Error('Not a valid ELF file. Version is invalid');

    const bits = eiClass === 1 ? 32 : 64;
    const bigEndian = eiData !== 1;
    const abi = eiAbi as ELF.ABI;
    const sizeLeft = bits === 32 ? 0x24 : 0x30;
    const headerview = await reader.view(sizeLeft);
    const readUInt16 = (ix: number) => headerview.getUint16(ix, !bigEndian);
    const readUInt32 = (ix: number) => headerview.getUint32(ix, !bigEndian);
    const readUInt64 = (ix: number) => headerview.getBigUint64(ix, !bigEndian);

    let ix = 0;
    const eType = readUInt16(ix); ix += 2;
    const eMachine = readUInt16(ix); ix += 2;
    const eVersion = readUInt32(ix); ix += 4;
    let eEntry, ePHOff, eSHOff;
    if (bits === 32) {
        eEntry = readUInt32(ix); ix += 4;
        ePHOff = readUInt32(ix); ix += 4;
        eSHOff = readUInt32(ix); ix += 4;
    } else {
        eEntry = readUInt64(ix); ix += 8;
        ePHOff = toNumberSafe(readUInt64(ix)); ix += 8;
        eSHOff = toNumberSafe(readUInt64(ix)); ix += 8;
    }
    const eFlags = readUInt32(ix); ix += 4;
    const eHSize = readUInt16(ix); ix += 2;
    const ePHEntSize = readUInt16(ix); ix += 2;
    const ePHNum = readUInt16(ix); ix += 2;
    const eSHEntSize = readUInt16(ix); ix += 2;
    const eSHNum = readUInt16(ix); ix += 2;
    const eSHStrNdx = readUInt16(ix); ix += 2;

    if (bits === 32 && eHSize !== 0x34 || bits === 64 && eHSize !== 0x40) throw new Error('Not a valid ELF file. Header size is invalid');

    if ((ePHNum !== 0 && (ePHOff < eHSize || ePHOff > size)) || (eSHNum !== 0 && (eSHOff < eHSize || eSHOff > size))) {
        throw new Error('Not a valid ELF file. Invalid offsets');
    }
    if (ePHNum !== 0 && ((bits === 32 && ePHEntSize < 0x20) || (bits === 64 && ePHEntSize < 0x38) || (ePHEntSize > 0xFF))) {
        throw new Error('Not a valid ELF file. Program header entry size is invalid');
    }
    if (eSHNum !== 0 && ((bits === 32 && eSHEntSize < 0x28) || (bits === 64 && eSHEntSize < 0x40) || (ePHEntSize > 0xFF))) {
        throw new Error('Not a valid ELF file. Section header entry size is invalid');
    }

    const type = eType as ELF.Type;
    const isa = eMachine as ELF.ISA;

    //const segments = await readProgramHeaderEntries(reader, ePHOff, ePHEntSize, ePHNum, bits, bigEndian);
    const sections = await readSectionHeaderEntries(reader, eSHOff, eSHEntSize, eSHNum, bits, bigEndian, eSHStrNdx, options.readSymbolData, type);

    elf.header.class = eiClass;
    elf.header.endian = eiData;
    elf.header.version = eiVer;
    elf.header.abi = abi;
    elf.header.abiVersion = eiAbiVer;
    elf.header.isa = isa;
    elf.header.isaVersion = eVersion;
    elf.header.type = type;
    elf.header.flags = eFlags;
    elf.header.entryPoint = eEntry;
    elf.header.programHeadersOffset = ePHOff;
    elf.header.programHeadersEntrySize = ePHEntSize;
    elf.header.programHeadersEntryCount = ePHNum;
    elf.header.sectionHeadersOffset = eSHOff;
    elf.header.sectionHeadersEntrySize = eSHEntSize;
    elf.header.sectionHeadersEntryCount = eSHNum;
    elf.header.shstrIndex = eSHStrNdx;
    elf.sections = sections;

    await updateSymbolAddressesAndLoadSymbols(elf, reader, options.readSymbolData);

    // close the file
    if (reader) {
        try { await reader.close(); }
        catch(e: any) { throw new Error(`Failed to close ELF reader: ${e.toString()}`); }
    }

    return elf;
}
