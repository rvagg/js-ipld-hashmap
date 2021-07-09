import { CID } from 'multiformats/cid';
import { BlockCodec } from 'multiformats/codecs/interface';
import { MultihashHasher } from 'multiformats/hashes/interface';
export interface HashMap<V> {
    readonly cid: CID;
    get(key: string | Uint8Array): Promise<V | void>;
    has(key: string | Uint8Array): Promise<boolean>;
    size(): Promise<number>;
    set(key: string | Uint8Array, value: V): Promise<void>;
    delete(key: string | Uint8Array): Promise<void>;
    values(): AsyncIterable<V>;
    keys(): AsyncIterable<string>;
    keysRaw(): AsyncIterable<Uint8Array>;
    entries(): AsyncIterable<[string, V]>;
    entriesRaw(): AsyncIterable<[Uint8Array, V]>;
    cids(): AsyncIterable<CID>;
}
export interface CreateOptions<Codec extends number, V> {
    blockCodec: BlockCodec<Codec, V>;
    blockHasher: MultihashHasher;
    hasher?: MultihashHasher;
    hashBytes?: number;
    bitWidth: number;
    bucketSize: number;
}
export interface Loader {
    get(cid: CID): Promise<Uint8Array>;
    put(cid: CID, bytes: Uint8Array): Promise<void>;
}
//# sourceMappingURL=interface.d.ts.map