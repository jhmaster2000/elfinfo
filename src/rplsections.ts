import { decode } from './encoding.js';
import { HelperDataView } from './reader.js';
import * as ELF from './types/index.js';

export namespace RPL {
    export function readFileInfoSection(section: ELF.Section, endian: ELF.Endian): ELF.RPLFileInfo {
        if (section.size < 0x60) throw new Error('RPL_FILEINFO section is too small, must be at least 0x60 in size.');
        const view = HelperDataView(new DataView(section.data.buffer), endian === ELF.Endian.Big);
        const fileinfo: ELF.RPLFileInfo = new ELF.RPLFileInfo();

        let ix = 0;
        const magic: string = view.readUInt16(ix).toString(16).toUpperCase();
        if (magic !== 'CAFE') throw new Error(`RPL_FILEINFO section magic number is invalid! Expected "CAFE", got "${magic}"`);

        /*fileinfo.magic             = magic;*/             ix += 2;
        fileinfo.version             = view.readUInt16(ix); ix += 2;
        fileinfo.textSize            = view.readUInt32(ix); ix += 4;
        fileinfo.textAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.dataSize            = view.readUInt32(ix); ix += 4;
        fileinfo.dataAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.loadSize            = view.readUInt32(ix); ix += 4;
        fileinfo.loadAlign           = view.readUInt32(ix); ix += 4;
        fileinfo.tempSize            = view.readUInt32(ix); ix += 4;
        fileinfo.trampAdjust         = view.readUInt32(ix); ix += 4;
        fileinfo.sdaBase             = view.readUInt32(ix); ix += 4;
        fileinfo.sda2Base            = view.readUInt32(ix); ix += 4;
        fileinfo.stackSize           = view.readUInt32(ix); ix += 4;
        fileinfo.stringsOffset       = view.readUInt32(ix); ix += 4;
        fileinfo.flags               = view.readUInt32(ix); ix += 4;
        fileinfo.heapSize            = view.readUInt32(ix); ix += 4;
        fileinfo.tagOffset           = view.readUInt32(ix); ix += 4;
        fileinfo.minVersion          = view.readUInt32(ix); ix += 4;
        fileinfo.compressionLevel    = view.readSInt32(ix); ix += 4;
        fileinfo.trampAddition       = view.readUInt32(ix); ix += 4;
        fileinfo.fileInfoPad         = view.readUInt32(ix); ix += 4;
        fileinfo.cafeSdkVersion      = view.readUInt32(ix); ix += 4;
        fileinfo.cafeSdkRevision     = view.readUInt32(ix); ix += 4;
        fileinfo.tlsModuleIndex      = view.readUInt16(ix); ix += 2;
        fileinfo.tlsAlignShift       = view.readUInt16(ix); ix += 2;
        fileinfo.runtimeFileInfoSize = view.readUInt32(ix); ix += 4;
        fileinfo.strings = [];

        // Section does not have strings
        if (section.size === 0x60 || section.size <= fileinfo.stringsOffset) return fileinfo;

        const stringData = section.data.slice(fileinfo.stringsOffset);
        const strings: { [addr: number]: string; } = {};

        let strIx = 0;
        for (let i = 0; i < section.size - fileinfo.stringsOffset; i++) {
            if (stringData[i] === 0) {
                const slen = i - strIx;
                if (slen > 0)   strings[fileinfo.stringsOffset + strIx] = decode(stringData, strIx, slen);
                if (slen === 0) strings[fileinfo.stringsOffset + strIx] = '';
                strIx = i + 1;
            }
        }
        fileinfo.strings = strings;
        return fileinfo;
    }

    export function isFileInfoSection(section: ELF.Section): section is ELF.RPLFileInfoSection {
        return section.type === ELF.SectionType.RPLFileInfo;
    }

    export async function packCrcSection(section: ELF.RPLCrcSection, size: number, elf: ELF.File): Promise<Buffer> {
        let crcs = Buffer.alloc(size);
        for (let i = 0; i < elf.sections.length; i++) crcs.writeUInt32BE(await elf.sections[i].crc32Hash, i * section.entSize);
        return crcs;
    }

    export function packFileInfoSection(section: ELF.RPLFileInfoSection): Buffer {
        const fileinfo = Buffer.alloc(section.size);
        let ix = 0;
        fileinfo.writeUInt16BE(section.fileinfo.magic,               ix); ix += 2;
        fileinfo.writeUInt16BE(section.fileinfo.version,             ix); ix += 2;
        fileinfo.writeUInt32BE(section.fileinfo.textSize,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.textAlign,           ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.dataSize,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.dataAlign,           ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.loadSize,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.loadAlign,           ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.tempSize,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.trampAdjust,         ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.sdaBase,             ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.sda2Base,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.stackSize,           ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.stringsOffset,       ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.flags,               ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.heapSize,            ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.tagOffset,           ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.minVersion,          ix); ix += 4;
        fileinfo.writeInt32BE (section.fileinfo.compressionLevel,    ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.trampAddition,       ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.fileInfoPad,         ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.cafeSdkVersion,      ix); ix += 4;
        fileinfo.writeUInt32BE(section.fileinfo.cafeSdkRevision,     ix); ix += 4;
        fileinfo.writeUInt16BE(section.fileinfo.tlsModuleIndex,      ix); ix += 2;
        fileinfo.writeUInt16BE(section.fileinfo.tlsAlignShift,       ix); ix += 2;
        fileinfo.writeUInt32BE(section.fileinfo.runtimeFileInfoSize, ix); ix += 4;
        
        for (let key in section.fileinfo.strings) {
            const str = section.fileinfo.strings[key];

            if (fileinfo[ix] !== 0) throw new Error(
                `Failed to pack ELF because of corrupt string section of index ${section.index}:\n` +
                `\tString '${str}' at .strtab offset 0x${Number(key).toString(16).toUpperCase()} is overlapped by the previous string which is too long.`
            );
            ix += fileinfo.write(str + '\0', ix);
        }

        return fileinfo;
    }
}
