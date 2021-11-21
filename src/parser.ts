import * as ELF from './types/index.js';
//import { readProgramHeaderEntries } from './segments';
//import { virtualAddressToFileOffset } from './elf';
import { isSymbolSection, readSectionHeaderEntries } from './sections.js';
import { HelperDataView, Reader } from './reader.js';
import { add, toNumberSafe } from './biginthelpers.js';

/** Options for reading an ELF file. */
export interface OpenOptions {
    /** When true, the data for symbols will also be read */
    readSymbolData: boolean
};

async function updateSymbolAddressesAndLoadSymbolData(elf: ELF.File, reader: Reader, loadSymbolData: boolean): Promise<void> {
    const elfType = elf.header.type;
    if (elfType !== ELF.Type.Executable && elfType !== ELF.Type.Relocatable && elfType !== ELF.Type.Shared && elfType !== ELF.Type.RPL) return;

    for (const section of elf.sections.filter(isSymbolSection)) {
        for (const symbol of section.symbols) {
            if (elfType === ELF.Type.Relocatable) {
                // offset is from start of section
                if (symbol.shndx < elf.sections.length) 
                    symbol.virtualAddress = add(symbol.value, elf.sections[symbol.shndx].addr);
                // SHN_ABS
                else if (symbol.shndx === 0xFFF1)
                    symbol.virtualAddress = symbol.value;
            } else {
                // the value is the virtual address
                symbol.virtualAddress = symbol.value;
            }

            /*if (loadSymbolData && symbol.virtualAddress && (symbol.type === ELF.SymbolType.Function || symbol.type === ELF.SymbolType.Object) && symbol.size) {
                const fileOffset = virtualAddressToFileOffset(elf, symbol.value);
                if (fileOffset) {
                    if (fileOffset + symbol.size <= reader.size()) symbol.data = await reader.read(symbol.size, fileOffset);
                    else debugger;
                }
            }*/
        }
    }
}

export async function readElf(reader: Reader, options: OpenOptions): Promise<ELF.File> {
    let elf: ELF.File = new ELF.File();

    await reader.open();
    const size = reader.size();
    if (size <= 0x40) throw new Error('Not a valid ELF file. Too small.');

    const ident = await reader.view(16);

    const magic = 0x7F454C46;
    if (ident.getInt32(0, false) !== magic) throw new Error(`Not a valid ELF file. The file does not start with ${magic.toString(16).toUpperCase()}.`);

    const eiClass  = ident.getUint8(4);
    const eiData   = ident.getUint8(5);
    const eiVer    = ident.getUint8(6);
    const eiAbi    = ident.getUint8(7);
    const eiAbiVer = ident.getUint8(8);

    if (eiClass < 1 || eiClass > 2) throw new Error('Not a valid ELF file. Class is invalid');
    if (eiData < 1 || eiData > 2) throw new Error('Not a valid ELF file. Endianness is invalid');
    if (eiVer !== 1) throw new Error('Not a valid ELF file. Version is invalid');

    const bits = eiClass === 1 ? 32 : 64;
    const abi = eiAbi as ELF.ABI;
    const sizeLeft = bits === 32 ? 0x24 : 0x30;
    const view = HelperDataView(await reader.view(sizeLeft), eiData === ELF.Endian.Big);

    let ix = 0;
    const eType    = view.readUInt16(ix); ix += 2;
    const eMachine = view.readUInt16(ix); ix += 2;
    const eVersion = view.readUInt32(ix); ix += 4;

    let eEntry, ePHOff, eSHOff;
    if (bits === 32) {
        eEntry = view.readUInt32(ix); ix += 4;
        ePHOff = view.readUInt32(ix); ix += 4;
        eSHOff = view.readUInt32(ix); ix += 4;
    } else {
        eEntry = view.readUInt64(ix); ix += 8;
        ePHOff = toNumberSafe(view.readUInt64(ix)); ix += 8;
        eSHOff = toNumberSafe(view.readUInt64(ix)); ix += 8;
    }
    const eFlags     = view.readUInt32(ix); ix += 4;
    const eHSize     = view.readUInt16(ix); ix += 2;
    const ePHEntSize = view.readUInt16(ix); ix += 2;
    const ePHNum     = view.readUInt16(ix); ix += 2;
    const eSHEntSize = view.readUInt16(ix); ix += 2;
    const eSHNum     = view.readUInt16(ix); ix += 2;
    const eSHStrNdx  = view.readUInt16(ix); ix += 2;

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

    //const segments = await readProgramHeaderEntries(reader, ePHOff, ePHEntSize, ePHNum, bits, bigEndian);
    const sections = await readSectionHeaderEntries(reader, elf.header, options.readSymbolData);
    elf.sections = sections;

    await updateSymbolAddressesAndLoadSymbolData(elf, reader, options.readSymbolData);

    // close the file
    if (reader) {
        try { await reader.close(); }
        catch(e: any) { throw new Error(`Failed to close ELF reader: ${e.toString()}`); }
    }

    return elf;
}
