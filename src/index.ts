import * as elflib from './types/index.js';
import * as reader from './reader.js';
import fs, { FileHandle } from 'fs/promises';
import { readElf, OpenOptions } from './parser.js';
import { packElf } from './writer.js';
import { Reader, Blob } from './reader.js';

function isReader(item: any): item is reader.Reader {
    return typeof item === 'object' && typeof item.close === 'function' && typeof item.open === 'function' &&
        typeof item.read === 'function' && typeof item.size === 'function' && typeof item.view === 'function';
}

function isFileHandle(item: any): item is fs.FileHandle {
    return typeof item === 'object' && typeof item.fd === 'number' && typeof item.stat === 'function' && typeof item.read === 'function';
}

function isBlob(item: any): item is reader.Blob {
    return typeof item === 'object' && typeof item.size === 'number' && typeof item.arrayBuffer === 'function';
}

const defaultOptions: OpenOptions = { readSymbolData: false };

/** Parse an ELF file.
  * @param {any} input the path to the ELF file, or the data for the file.
  * @param {OpenOptions} [options] options for the parser.
  * @returns {Promise<elflib.File>} a result indicating the success or failure of parsing and the data for the ELF file. */
export async function open(input: Uint8Array|ArrayBuffer|number[]|Reader|Blob|FileHandle|string|number, options: OpenOptions = defaultOptions): Promise<elflib.File> {
    if      (input instanceof Uint8Array)  return readElf(reader.buffer(input), options);
    else if (input instanceof ArrayBuffer) return readElf(reader.buffer(input), options);
    else if (input instanceof Array)       return readElf(reader.array(input), options);
    else if (typeof input === 'string')    return readElf(reader.file(input), options);
    else if (typeof input === 'number')    return readElf(reader.syncfile(input), options);
    else if (isFileHandle(input))          return readElf(reader.asyncfile(input), options);
    else if (isBlob(input))                return readElf(reader.blob(input), options);
    else if (isReader(input))              return readElf(input, options);
    else throw new Error('Unsupported ELF input type');
}

/** Pack an ELF file back to binary.
  * @param {elflib.File} elf the ELF object to pack.
  * @returns {Promise<boolean>} a result indicating the success or failure of packing and the binary buffer for the ELF file. */
export async function pack(elf: elflib.File) {
    return packElf(elf);
} 

export * from './reader.js';
export * from './elf.js';
export * from './types/index.js';
export * from './debug.js';
export * from './rplsections.js';
export * from './sections.js';
export { OpenOptions };
