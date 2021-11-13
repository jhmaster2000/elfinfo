import * as elflib from './types/index.js';
import * as reader from './reader.js';
import { readElf, OpenOptions } from './parser.js';
import * as fs from 'fs/promises';
import { packElf } from './writer.js';

function isReader(item: any): item is reader.Reader {
    return typeof item === 'object' &&
        typeof item.close === 'function' &&
        typeof item.open === 'function' &&
        typeof item.read === 'function' &&
        typeof item.size === 'function' &&
        typeof item.view === 'function';
}

function isFileHandle(item: any): item is fs.FileHandle {
    return typeof item === 'object' &&
        typeof item.fd === 'number' &&
        typeof item.stat === 'function' &&
        typeof item.read === 'function';
}

function isBlob(item: any): item is reader.Blob {
    return typeof item === 'object' &&
        typeof item.size === 'number' &&
        typeof item.arrayBuffer === 'function';
}

function isELF(item: any): item is elflib.File {
    return typeof item === 'object' &&
    typeof item.header === 'object' &&
    typeof item.header.class === 'number' &&
    typeof item.header.endian === 'number' &&
    typeof item.header.version === 'number' &&
    typeof item.header.bits === 'number' &&
    typeof item.header.abi === 'number' &&
    typeof item.header.abiVersion === 'number' &&
    typeof item.header.type === 'number' &&
    typeof item.header.isa === 'number' &&
    typeof item.header.isaVersion === 'number' &&
    typeof item.header.flags === 'number' &&
    (typeof item.header.entryPoint === 'number' || typeof item.header.entryPoint === 'bigint') &&
    typeof item.header.programHeaderOffset === 'number' &&
    typeof item.header.sectionHeaderOffset === 'number' &&
    typeof item.header.programHeaderEntrySize === 'number' &&
    typeof item.header.numProgramHeaderEntries === 'number' &&
    typeof item.header.sectionHeaderEntrySize === 'number' &&
    typeof item.header.numSectionHeaderEntries === 'number' &&
    typeof item.header.shstrIndex === 'number' &&
    //Array.isArray(item.segments) &&
    Array.isArray(item.sections);
}

const defaultOptions: OpenOptions = { readSymbolData: false };

/** Parse an ELF file.
  * @summary Parsing will be async if a path, blob, or file handle is specified and synchronous if an array or buffer is specified.
  * @param {any} input the path to the ELF file, or the data for the file.
  * @param {function} [callback] When specified, this will be called after the file is done parsing.
  * @returns {Promise<elflib.File>} a result indicating the success or failure of parsing and the data for the ELF file. */
export function open(input: Uint8Array | ArrayBuffer | Array<number> | reader.Reader | string | number | fs.FileHandle | string | reader.Blob,
    options?: OpenOptions, callback?: (result: elflib.File) => void | null): Promise<elflib.File> {
    let promise: Promise<elflib.File>;

    if (!options) options = defaultOptions;

    if (input instanceof Uint8Array)       promise = readElf(reader.buffer(input), options);
    else if (input instanceof ArrayBuffer) promise = readElf(reader.buffer(input), options);
    else if (input instanceof Array)       promise = readElf(reader.array(input), options);
    else if (typeof input === 'string')    promise = readElf(reader.file(input), options);
    else if (typeof input === 'number')    promise = readElf(reader.syncfile(input), options);
    else if (isReader(input))              promise = readElf(input, options);
    else if (isFileHandle(input))          promise = readElf(reader.asyncfile(input), options);
    else if (isBlob(input))                promise = readElf(reader.blob(input), options);
    else promise = new Promise((resolve, reject) => reject('unsupported input type'));

    if (callback) promise.then(callback);
    return promise;
}

/** Pack an ELF file back to binary.
  * @param {any} elf the ELF object to pack.
  * @param {function} [callback] When specified, this will be called after the file is done packing.
  * @returns {Promise<boolean>} a result indicating the success or failure of packing and the binary buffer for the ELF file. */
 export function pack(elf: elflib.File, callback?: (result: boolean) => void | null): Promise<boolean> {
    let promise: Promise<boolean>;
    let packed = packElf(elf);

    promise = new Promise((resolve) => resolve(true));

    if (callback) promise.then(callback);
    return promise;
} 

export * from './reader.js';
export * from './elf.js';
export * from './types/index.js';
export * from './debug.js';
export * from './rplsections.js';
export * from './sections.js';
export { OpenOptions };
