import { create as createIAMap, load as loadIAMap, registerHasher } from 'iamap'
import { CID } from 'multiformats/cid'
import * as Block from 'multiformats/block'
import { sha256 } from 'multiformats/hashes/sha2'

const DEFAULT_HASHER = sha256
const DEFAULT_HASH_BYTES = 32
// 5/3 seems to offer best perf characteristics in terms of raw speed
// (Filecoin found this too for their HAMT usage)
// but amount and size of garbage will change with different parameters
const DEFAULT_BITWIDTH = 5
const DEFAULT_BUCKET_SIZE = 3

const textDecoder = new TextDecoder()

/**
 * @template V
 * @typedef {import('iamap').IAMap<V>} IAMap<V>
 */
/**
 * @template V
 * @typedef {import('iamap').Store<V>} Store<V>
 */
/**
 * @typedef {import('multiformats/hashes/interface').MultihashHasher} MultihashHasher
 */
/**
 * @template V
 * @typedef {import('./interface').HashMap<V>} HashMap<V>
 */
/**
 * @template {number} Codec
 * @template V
 * @typedef {import('./interface').CreateOptions<Codec,V>} CreateOptions<Codec,V>
 */
/**
 * @typedef {import('./interface').Loader} Loader<V>
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
 * @name HashMap
 * @template V
 * @implements {HashMap<V>}
 * @class
 * @hideconstructor
 * @property {CID} cid - The _current_ CID of this HashMap. It is important to note that this CID
 * will change when successfully performing mutation operations {@link HashMap#set} or
 * {@link HashMap#delete}. Where a {@link HashMap#set} does not change an existing value (because
 * a key already exists with that value) or {@link HashMap#delete} does not delete an existing
 * key/value pair (because it doesn't already exist in this HashMap), the `cid` will not change.
 */
class HashMapImpl {
  /**
   * @param {IAMap<V>} iamap
   */
  constructor (iamap) {
    // IAMap is immutable, so mutation operations return a new instance so
    // we use `this._iamap` as the _current_ instance and wrap around that,
    // switching it out as we mutate
    this._iamap = iamap
  }

  /**
   * @name HashMap#get
   * @description
   * Fetches the value of the provided `key` stored in this HashMap, if it exists.
   * @function
   * @async
   * @memberof HashMap
   * @param {string} key - The key of the key/value pair entry to look up in this HashMap.
   * @return {Promise<V|undefined>}
   * The value stored for the given `key` which may be any type serializable by IPLD, or a CID to
   * an existing IPLD object. This should match what was provided by {@link HashMap#set} as the
   * `value` for this `key`. If the `key` is not stored in this HashMap, `undefined` will be
   * returned.
   */
  async get (key) {
    return this._iamap.get(key)
  }

  /**
   * @name HashMap#has
   * @description
   * Check whether the provided `key` exists in this HashMap. The equivalent of performing
   * `map.get(key) !== undefined`.
   * @function
   * @async
   * @memberof HashMap
   * @param {string} key - The key of the key/value pair entry to look up in this HashMap.
   * @return {Promise<boolean>}
   * `true` if the `key` exists in this HashMap, `false` otherwise.
   */
  async has (key) {
    return this._iamap.has(key)
  }

  /**
   * @name HashMap#size
   * @description
   * Count the number of key/value pairs stored in this HashMap.
   * @function
   * @async
   * @memberof HashMap
   * @return {Promise<number>}
   * An integer greater than or equal to zero indicating the number of key/value pairse stored
   * in this HashMap.
   */
  async size () {
    return this._iamap.size()
  }

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
   * @param {string} key - The key of the new key/value pair entry to store in this HashMap.
   * @param {V} value - The value to store, either an object that can be serialized inline
   * via IPLD or a CID pointing to another object.
   * @returns {Promise<void>}
   */
  async set (key, value) {
    this._iamap = await this._iamap.set(key, value)
  }

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
   * @param {string} key - The key of the key/value pair entry to remove from this HashMap.
   * @returns {Promise<void>}
   */
  async delete (key) {
    this._iamap = await this._iamap.delete(key)
  }

  /**
   * @name HashMap#values
   * @description
   * Asynchronously emit all values that exist within this HashMap collection. This will cause a
   * full traversal of all nodes that make up this collection so may result in many block loads
   * from the backing store if the collection is large.
   * @function
   * @async
   * @returns {AsyncIterator<V>}
   * An async iterator that yields values of the type stored in this collection, either inlined
   * objects or CIDs.
   */
  async * values () {
    yield * this._iamap.values()
  }

  /**
   * @name HashMap#keys
   * @description
   * Asynchronously emit all keys that exist within this HashMap collection. This will cause a
   * full traversal of all nodes that make up this collection so may result in many block loads
   * from the backing store if the collection is large.
   * @function
   * @async
   * @returns {AsyncIterator<string>}
   * An async iterator that yields string keys stored in this collection.
   */
  async * keys () {
    for await (const key of this._iamap.keys()) {
      // IAMap keys are Buffers, make them strings
      yield textDecoder.decode(key)
    }
  }

  /**
   * @name HashMap#entries
   * @description
   * Asynchronously emit all key/value pairs that exist within this HashMap collection. This
   * will cause a full traversal of all nodes that make up this collection so may result in
   * many block loads from the backing store if the collection is large.
   *
   * Entries are returned in tuple form like
   * [Map#entries()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map/entries),
   * an array of key/value pairs where element `0` is the key and `1` is the value.
   * @function
   * @async
   * @returns {AsyncIterator<[string, V]>}
   * An async iterator that yields key/value pair tuples.
   */
  async * entries () {
    for await (const entry of this._iamap.entries()) {
      // IAMap keys are Buffers, make them strings
      yield [textDecoder.decode(entry.key), entry.value]
    }
  }

  /**
   * @name HashMap#cids
   * @description
   * Asynchronously emit all CIDs for blocks that make up this HashMap. This will cause a
   * full traversal of all nodes that make up this collection so may result in many block loads
   * from the backing store if the collection is large.
   * @function
   * @async
   * @returns {AsyncIterator<CID>}
   * An async iterator that yields CIDs for the blocks that comprise this HashMap.
   */
  async * cids () {
    yield * this._iamap.ids()
  }

  get cid () {
    return this._iamap.id
  }

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
  static async create (loader, options) {
    return _load(loader, null, options)
  }

  /**
   * @template V
   * @template {number} Codec
   * @param {Loader} loader
   * @param {CID} root - A root of an existing HashMap. Provide a CID if you want to load existing
   * data.
   * @param {CreateOptions<Codec, V>} options
   * @returns {Promise<HashMap<V>>}
   */
  static async load (loader, root, options) {
    return _load(loader, root, options)
  }
}

/**
 * @template V
 * @template {number} Codec
 * @param {Loader} loader
 * @param {CID|null} root
 * @param {CreateOptions<Codec, V>} options
 * @returns {Promise<HashMap<V>>}
 */
export async function _load (loader, root, options) {
  const cid = CID.asCID(root)

  if (!loader || typeof loader.get !== 'function' || typeof loader.put !== 'function') {
    throw new TypeError('\'loader\' object with get() and put() methods is required')
  }

  if (typeof options !== 'object') {
    throw new TypeError('An \'options\' argument is required')
  }

  if (!('blockCodec' in options) ||
      typeof options.blockCodec !== 'object' ||
      typeof options.blockCodec.code !== 'number' ||
      typeof options.blockCodec.encode !== 'function' ||
      typeof options.blockCodec.decode !== 'function') {
    throw new TypeError('A valid \'blockCodec\' option is required')
  }
  const codec = options.blockCodec
  if (!('blockHasher' in options) ||
      typeof options.blockHasher !== 'object' ||
      typeof options.blockHasher.digest !== 'function' ||
      typeof options.blockHasher.code !== 'number') {
    throw new TypeError('A valid \'blockHasher\' option is required')
  }
  const hasher = options.blockHasher

  /** @type {MultihashHasher} */
  const hamtHasher = (() => {
    if ('hasher' in options) {
      if (typeof options.hasher !== 'object' ||
          typeof options.hasher.digest !== 'function' ||
          typeof options.hasher.code !== 'number') {
        throw new TypeError('\'hasher\' option must be a Multihasher')
      }
      return options.hasher
    }
    return DEFAULT_HASHER
  })()
  const hashBytes = (() => {
    if ('hashBytes' in options) {
      if (typeof options.hashBytes !== 'number') {
        throw new TypeError('\'hashBytes\' option must be a number')
      }
      /* c8 ignore next 2 */
      return options.hashBytes
    }
    return DEFAULT_HASH_BYTES
  })()
  /** @param {Uint8Array} bytes  */
  const hashFn = async (bytes) => {
    const hash = await sha256.digest(bytes)
    return hash.digest
  }
  registerHasher(hamtHasher.code, hashBytes, hashFn)

  const bitWidth = DEFAULT_BITWIDTH // fromOptions('bitWidth', 'number', DEFAULT_BITWIDTH)
  const bucketSize = DEFAULT_BUCKET_SIZE // fromOptions('bucketSize', 'number', DEFAULT_BUCKET_SIZE)

  const iamapOptions = { hashAlg: hamtHasher.code, bitWidth, bucketSize }

  const store = {
    /**
     * @param {CID} cid
     * @returns {Promise<V>}
     */
    async load (cid) {
      const bytes = await loader.get(cid)
      if (!bytes) {
        throw new Error(`Could not load block for: ${cid}`)
      }
      // create() validates the block for us
      const block = await Block.create({ bytes, cid, hasher, codec })
      return block.value
    },

    /**
     * @param {V} value
     * @returns {Promise<CID>}
     */
    async save (value) {
      const block = await Block.encode({ value, codec, hasher })
      await loader.put(block.cid, block.bytes)
      return block.cid
    },

    /**
     * @param {CID} cid1
     * @param {CID} cid2
     * @returns {boolean}
     */
    isEqual (cid1, cid2) {
      return cid1.equals(cid2)
    },

    /**
     * @param {any} obj
     * @returns {boolean}
     */
    isLink (obj) {
      return CID.asCID(obj) != null
    }
  }

  let iamap
  if (cid) {
    // load existing, ignoring bitWidth & bucketSize, they are loaded from the existing root
    iamap = await loadIAMap(store, cid)
  } else {
    // create new
    iamap = await createIAMap(store, iamapOptions)
  }

  return new HashMapImpl(iamap)
}

export const create = HashMapImpl.create
export const load = HashMapImpl.load
