/**
 * @ignore
 * @template V
 * @template {number} Codec
 * @param {Loader} loader
 * @param {CID|null} root
 * @param {CreateOptions<Codec, V>} options
 * @returns {Promise<HashMap<V>>}
 */
export function _load<V, Codec extends number>(loader: Loader, root: CID | null, options: import("./interface").CreateOptions<Codec, V>): Promise<import("./interface").HashMap<V>>;
/**
 * Create a new {@link HashMap} instance, beginning empty, or loading from existing data in a
 * backing store.
 *
 * A backing store must be provided to make use of a HashMap, an interface to the store is given
 * through the mandatory `loader` parameter. The backing store stores IPLD blocks, referenced by
 * CIDs. `loader` must have two functions: `get(cid)` which should return the raw bytes (`Buffer`
 * or `Uint8Array`) of a block matching the given CID, and `put(cid, block)` that will store the
 * provided raw bytes of a block (`block`) and store it with the associated CID.
 *
 * @async
 * @template V
 * @template {number} Codec
 * @param {Loader} loader - A loader with `get(cid):block` and `put(cid, block)` functions for
 * loading an storing block data by CID.
 * @param {CreateOptions<Codec, V>} options - Options for the HashMap. Defaults are provided but you can tweak
 * behavior according to your needs with these options.
 * @return {Promise<HashMap<V>>} - A HashMap instance, either loaded from an existing root block CID, or a new,
 * empty HashMap if no CID is provided.
 */
export function create<V, Codec extends number>(loader: Loader, options: import("./interface").CreateOptions<Codec, V>): Promise<import("./interface").HashMap<V>>;
/**
 * @template V
 * @template {number} Codec
 * @param {Loader} loader
 * @param {CID} root - A root of an existing HashMap. Provide a CID if you want to load existing
 * data.
 * @param {CreateOptions<Codec, V>} options
 * @returns {Promise<HashMap<V>>}
 */
export function load<V, Codec extends number>(loader: Loader, root: CID, options: import("./interface").CreateOptions<Codec, V>): Promise<import("./interface").HashMap<V>>;
/**
 * <V>
 */
export type IAMap<V> = import('iamap').IAMap<V>;
/**
 * <V>
 */
export type Store<V> = import('iamap').Store<V>;
export type MultihashHasher = import('multiformats/hashes/interface').MultihashHasher;
/**
 * <V>
 */
export type HashMap<V> = import('./interface').HashMap<V>;
/**
 * <Codec,V>
 */
export type CreateOptions<Codec extends number, V> = import('./interface').CreateOptions<Codec, V>;
/**
 * <V>
 */
export type Loader = import('./interface').Loader;
import { CID } from "multiformats/cid";
//# sourceMappingURL=ipld-hashmap.d.ts.map