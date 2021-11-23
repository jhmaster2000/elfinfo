import * as elflib from './types/index.js';
import * as reader from './reader.js';
import fs, { FileHandle } from 'fs/promises';
import { readElf, OpenOptions } from './parser.js';
import { packElf } from './writer.js';

function isFileHandle(item: any): item is fs.FileHandle {
    return typeof item === 'object' && typeof item.fd === 'number' && typeof item.stat === 'function' && typeof item.read === 'function';
}

const defaultOptions: OpenOptions = { readSymbolData: false };

/** Parse an ELF file.
  * @param {any} input the path to the ELF file, or the data for the file.
  * @param {OpenOptions} [options] options for the parser.
  * @returns {Promise<elflib.File>} a result indicating the success or failure of parsing and the data for the ELF file. */
export async function open(input: Uint8Array|ArrayBuffer|number[]|string|number|FileHandle, options: OpenOptions = defaultOptions): Promise<elflib.File> {
    if      (input instanceof Uint8Array)  return readElf(reader.buffer(input), options);
    else if (input instanceof ArrayBuffer) return readElf(reader.buffer(input), options);
    else if (input instanceof Array)       return readElf(reader.array(input), options);
    else if (typeof input === 'string')    return readElf(reader.filePath(input), options);
    else if (typeof input === 'number')    return readElf(reader.fileDescriptor(input), options);
    else if (isFileHandle(input))          return readElf(await reader.fileHandle(input), options);
    else throw new Error('Unsupported ELF input type');
}

/** Pack an ELF file back to binary.
  * @param {elflib.File} elf the ELF object to pack.
  * @returns {Promise<Buffer>} the binary buffer for the ELF file. */
export async function pack(elf: elflib.File): Promise<Buffer> {
    return packElf(elf);
}

export * from './reader.js';
export * from './elf.js';
export * from './types/index.js';
export * from './debug.js';
export * from './rplsections.js';
export * from './sections.js';
export { OpenOptions };
