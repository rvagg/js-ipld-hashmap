import { CID } from 'multiformats/cid';
export type IAMap<V> = import('iamap').IAMap<V>;
export type Store<V> = import('iamap').Store<V>;
export type StoreOperationOptions = import('iamap').StoreOperationOptions;
export type MultihashHasher = import('multiformats/hashes/interface').MultihashHasher;
export type HashMap<V> = import('./interface.js').HashMap<V>;
export type CreateOptions<Codec extends number, V> = import('./interface.js').CreateOptions<Codec, V>;
export type Loader = import('./interface.js').Loader;
export type SignalOptions = import('./interface.js').SignalOptions;
/**
 * @template V
 * @typedef {import('iamap').IAMap<V>} IAMap<V>
 */
/**
 * @template V
 * @typedef {import('iamap').Store<V>} Store<V>
 */
/**
 * @typedef {import('iamap').StoreOperationOptions} StoreOperationOptions
 * @typedef {import('multiformats/hashes/interface').MultihashHasher} MultihashHasher
 */
/**
 * @template V
 * @typedef {import('./interface.js').HashMap<V>} HashMap<V>
 */
/**
 * @template {number} Codec
 * @template V
 * @typedef {import('./interface.js').CreateOptions<Codec,V>} CreateOptions<Codec,V>
 */
/**
 * @typedef {import('./interface.js').Loader} Loader<V>
 * @typedef {import('./interface.js').SignalOptions} SignalOptions
 */
/**
 * @classdesc
 * An IPLD HashMap object. Create a new HashMap or load an existing one with the asynchronous
 * {@link HashMap.create} factory method.
 *
 * This class serves mostly as a IPLD usability wrapper for
 * [IAMap](https://github.com/rvagg/iamap) which implements the majority of the logic behind the
 * IPLD HashMap specification, without being IPLD-specific. IAMap is immutable, in that each
 * mutation (delete or set) returns a new IAMap instance. `HashMap`, however, is immutable, and
 * mutation operations may be performed on the same object but its `cid` property will change
 * with mutations.
 *
 * If consumed with TypeScript typings, `HashMap` is generic over value template type `V`, where various
 * operations will accept or return template type `V`.
 *
 * @name HashMap
 * @template V
 * @implements {HashMap<V>}
 * @class
 * @hideconstructor
 * @property {CID} cid - The _current_ CID of this HashMap. It is important to note that this CID
 * will change when successfully performing mutation operations `set()` or
 * `delete()`. Where a `set()` does not change an existing value (because
 * a key already exists with that value) or `delete()` does not delete an existing
 * key/value pair (because it doesn't already exist in this HashMap), the `cid` will not change.
 */
declare class HashMapImpl<V> implements HashMap<V> {
    _iamap: import("iamap").IAMap<V>;
    /**
     * @ignore
     * @param {IAMap<V>} iamap
     */
    constructor(iamap: IAMap<V>);
    /**
     * @name HashMap#get
     * @description
     * Fetches the value of the provided `key` stored in this HashMap, if it exists.
     * @function
     * @async
     * @memberof HashMap
     * @param {string|Uint8Array} key - The key of the key/value pair entry to look up in this HashMap.
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @return {Promise<V|undefined>}
     * The value (of template type `V`) stored for the given `key` which may be any type serializable
     * by IPLD, or a CID to an existing IPLD object. This should match what was provided by
     * {@link HashMap#set} as the `value` for this `key`. If the `key` is not stored in this HashMap,
     * `undefined` will be returned.
     */
    get(key: string | Uint8Array, options?: SignalOptions): Promise<V | undefined>;
    /**
     * @name HashMap#has
     * @description
     * Check whether the provided `key` exists in this HashMap. The equivalent of performing
     * `map.get(key) !== undefined`.
     * @function
     * @async
     * @memberof HashMap
     * @param {string|Uint8Array} key - The key of the key/value pair entry to look up in this HashMap.
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @return {Promise<boolean>}
     * `true` if the `key` exists in this HashMap, `false` otherwise.
     */
    has(key: string | Uint8Array, options?: SignalOptions): Promise<boolean>;
    /**
     * @name HashMap#size
     * @description
     * Count the number of key/value pairs stored in this HashMap.
     * @function
     * @async
     * @memberof HashMap
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @return {Promise<number>}
     * An integer greater than or equal to zero indicating the number of key/value pairse stored
     * in this HashMap.
     */
    size(options?: SignalOptions): Promise<number>;
    /**
     * @name HashMap#set
     * @description
     * Add a key/value pair to this HashMap. The value may be any object that can be serialized by
     * IPLD, or a CID to a more complex (or larger) object. {@link HashMap#get} operations on the
     * same `key` will retreve the `value` as it was set as long as serialization and deserialization
     * results in the same object.
     *
     * If the `key` already exists in this HashMap, the existing entry will have the `value` replaced
     * with the new one provided. If the `value` is the same, the HashMap will remain unchanged.
     *
     * As a mutation operation, performing a successful `set()` where a new key/value pair or new
     * `value` for a given `key` is set, a new root node will be generated so `map.cid` will be a
     * different CID. This CID should be used to refer to this collection in the backing store where
     * persistence is required.
     * @function
     * @async
     * @memberof HashMap
     * @param {string|Uint8Array} key - The key of the new key/value pair entry to store in this HashMap.
     * @param {V} value - The value (of template type `V`) to store, either an object that can be
     * serialized inline via IPLD or a CID pointing to another object.
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {Promise<void>}
     */
    set(key: string | Uint8Array, value: V, options?: SignalOptions): Promise<void>;
    /**
     * @name HashMap#delete
     * @description
     * Remove a key/value pair to this HashMap.
     *
     * If the `key` exists in this HashMap, its entry will be entirely removed. If the `key` does not
     * exist in this HashMap, no changes will occur.
     *
     * As a mutation operation, performing a successful `delete()` where an existing key/value pair
     * is removed from the collection, a new root node will be generated so `map.cid` will be a
     * different CID. This CID should be used to refer to this collection in the backing store where
     * persistence is required.
     * @function
     * @async
     * @memberof HashMap
     * @param {string|Uint8Array} key - The key of the key/value pair entry to remove from this HashMap.
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {Promise<void>}
     */
    delete(key: string | Uint8Array, options?: SignalOptions): Promise<void>;
    /**
     * @name HashMap#values
     * @description
     * Asynchronously emit all values that exist within this HashMap collection.
     *
     * This will cause a full traversal of all nodes that make up this collection so may result in
     * many block loads from the backing store if the collection is large.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<V>}
     * An async iterator that yields values (of template type `V`) of the type stored in this
     * collection, either inlined objects or CIDs.
     */
    values(options?: SignalOptions): AsyncIterable<V>;
    /**
     * @name HashMap#keys
     * @description
     * Asynchronously emit all keys that exist within this HashMap collection **as strings** rather
     * than the stored bytes.
     *
     * This will cause a full traversal of all nodes that make up this
     * collection so may result in many block loads from the backing store if the collection is large.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<string>}
     * An async iterator that yields string keys stored in this collection.
     */
    keys(options?: SignalOptions): AsyncIterable<string>;
    /**
     * @name HashMap#keysRaw
     * @description
     * Asynchronously emit all keys that exist within this HashMap collection **as their raw bytes**
     * rather than being converted to a string.
     *
     * This will cause a full traversal of all nodes that make up this collection so may result in
     * many block loads from the backing store if the collection is large.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<Uint8Array>}
     * An async iterator that yields string keys stored in this collection.
     */
    keysRaw(options?: SignalOptions): AsyncIterable<Uint8Array>;
    /**
     * @name HashMap#entries
     * @description
     * Asynchronously emit all key/value pairs that exist within this HashMap collection. Keys will be
     * given **as strings** rather than their raw byte form as stored.
     *
     * This will cause a full traversal of all nodes that make up this collection so may result in
     * many block loads from the backing store if the collection is large.
     *
     * Entries are returned in tuple form like
     * [Map#entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries),
     * an array of key/value pairs where element `0` is the key and `1` is the value.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<[string, V]>}
     * An async iterator that yields key/value pair tuples.
     */
    entries(options?: SignalOptions): AsyncIterable<[string, V]>;
    /**
     * @name HashMap#entriesRaw
     * @description
     * Asynchronously emit all key/value pairs that exist within this HashMap collection. Keys will be
     * given **as raw bytes** as stored rather than being converted to strings.
     *
     * This will cause a full traversal of all nodes that make up this collection so may result in
     * many block loads from the backing store if the collection is large.
     *
     * Entries are returned in tuple form like
     * [Map#entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries),
     * an array of key/value pairs where element `0` is the key and `1` is the value.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<[Uint8Array, V]>}
     * An async iterator that yields key/value pair tuples.
     */
    entriesRaw(options?: SignalOptions): AsyncIterable<[Uint8Array, V]>;
    /**
     * @name HashMap#cids
     * @description
     * Asynchronously emit all CIDs for blocks that make up this HashMap.
     *
     * This will cause a full traversal of all nodes that make up this collection so may result in
     * many block loads from the backing store if the collection is large.
     * @function
     * @async
     * @param {SignalOptions} [options] - Optional parameters. `signal` can be used to abort the operation.
     * @returns {AsyncIterable<CID>}
     * An async iterator that yields CIDs for the blocks that comprise this HashMap.
     */
    cids(options?: SignalOptions): AsyncIterable<CID>;
    get cid(): any;
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
    static create<V, Codec extends number>(loader: Loader, options: CreateOptions<Codec, V>): Promise<HashMap<V>>;
    /**
     * @template V
     * @template {number} Codec
     * @param {Loader} loader
     * @param {CID} root - A root of an existing HashMap. Provide a CID if you want to load existing
     * data.
     * @param {CreateOptions<Codec, V>} options
     * @returns {Promise<HashMap<V>>}
     */
    static load<V, Codec extends number>(loader: Loader, root: CID, options: CreateOptions<Codec, V>): Promise<HashMap<V>>;
}
/**
 * @ignore
 * @template V
 * @template {number} Codec
 * @param {Loader} loader
 * @param {CID|null} root
 * @param {CreateOptions<Codec, V>} options
 * @returns {Promise<HashMap<V>>}
 */
export declare function _load<V, Codec extends number>(loader: Loader, root: CID | null, options: CreateOptions<Codec, V>): Promise<HashMap<V>>;
export declare const create: typeof HashMapImpl.create;
export declare const load: typeof HashMapImpl.load;
export {};
//# sourceMappingURL=ipld-hashmap.d.ts.map