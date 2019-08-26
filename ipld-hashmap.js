const IAMap = require('iamap')
const CID = require('cids')
const Block = require('@ipld/block')
const murmurhash3 = require('murmurhash3js-revisited')

const DEFAULT_BLOCK_CODEC = 'dag-cbor'
const DEFAULT_BLOCK_ALGORITHM = 'sha2-256'
const DEFAULT_HASH_ALGORITHM = 'murmur3-32'
const DEFAULT_HASHER = murmur332Hasher
const DEFAULT_HASH_BYTES = 32
const DEFAULT_BITWIDTH = 8
const DEFAULT_BUCKET_SIZE = 3

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
 * @class
 * @hideconstructor
 * @property {CID} cid - The _current_ CID of this HashMap. It is important to note that this CID
 * will change when successfully performing mutation operations {@link HashMap#set} or
 * {@link HashMap#delete}. Where a {@link HashMap#set} does not change an existing value (because
 * a key already exists with that value) or {@link HashMap#delete} does not delete an existing
 * key/value pair (because it doesn't already exist in this HashMap), the `cid` will not change.
 */

function HashMap (iamap) {
  /* These are defined by IAMap:
    async set (key, value) { }
    async get (key) { }
    async has (key) { }
    async delete (key) { }
    async size () { }
    async * keys () { }
    async * values () { }
    async * entries () { }
    async * ids () { }

    And IAMap is immutable, so mutation operations return a new instance so
    we use `iamap` as the _current_ instance and wrap around that,
    switching it out as we mutate
  */

  /**
   * @name HashMap#get
   * @description
   * Fetches the value of the provided `key` stored in this HashMap, if it exists.
   * @function
   * @async
   * @memberof HashMap
   * @param {String} key - The key of the key/value pair entry to look up in this HashMap.
   * @return {*|CID|undefined}
   * The value stored for the given `key` which may be any type serializable by IPLD, or a CID to
   * an existing IPLD object. This should match what was provided by {@link HashMap#set} as the
   * `value` for this `key`. If the `key` is not stored in this HashMap, `undefined` will be
   * returned.
   */

  /**
   * @name HashMap#has
   * @description
   * Check whether the provided `key` exists in this HashMap. The equivalent of performing
   * `map.get(key) !== undefined`.
   * @function
   * @async
   * @memberof HashMap
   * @param {String} key - The key of the key/value pair entry to look up in this HashMap.
   * @return {boolean}
   * `true` if the `key` exists in this HashMap, `false` otherwise.
   */

  /**
   * @name HashMap#size
   * @description
   * Count the number of key/value pairs stored in this HashMap.
   * @function
   * @async
   * @memberof HashMap
   * @return {number}
   * An integer greater than or equal to zero indicating the number of key/value pairse stored
   * in this HashMap.
   */

  // accessors
  for (const fn of 'get has size'.split(' ')) {
    this[fn] = async function () {
      return iamap[fn].apply(iamap, arguments)
    }
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
   * @param {String} key - The key of the new key/value pair entry to store in this HashMap.
   * @param {*|CID} value - The value to store, either an object that can be serialized inline
   * via IPLD or a CID pointing to another object.
   */

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
   * @param {String} key - The key of the key/value pair entry to remove from this HashMap.
   */

  // mutators
  for (const fn of 'set delete'.split(' ')) {
    this[fn] = async function () {
      // iamap mutation operations return a new iamap, so update with that
      iamap = await iamap[fn].apply(iamap, arguments)
    }
  }

  // iterators

  /**
   * @name HashMap#values
   * @description
   * Asynchronously emit all values that exist within this HashMap collection. This will cause a
   * full traversal of all nodes that make up this collection so may result in many block loads
   * from the backing store if the collection is large.
   * @function
   * @async
   * @returns {AsyncIterator.<*|CID>}
   * An async iterator that yields values of the type stored in this collection, either inlined
   * objects or CIDs.
   */
  this.values = async function * () {
    yield * iamap.values()
  }

  /**
   * @name HashMap#keys
   * @description
   * Asynchronously emit all keys that exist within this HashMap collection. This will cause a
   * full traversal of all nodes that make up this collection so may result in many block loads
   * from the backing store if the collection is large.
   * @function
   * @async
   * @returns {AsyncIterator.<string>}
   * An async iterator that yields string keys stored in this collection.
   */
  this.keys = async function * () {
    for await (const key of iamap.keys()) {
      // IAMap keys are Buffers, make them strings
      yield key.toString('utf8')
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
   * @returns {AsyncIterator.<Object>}
   * An async iterator that yields key/value pair tuples.
   */
  this.entries = async function * () {
    for await (const entry of iamap.entries()) {
      // IAMap keys are Buffers, make them strings and return a tuple, like Map#entries
      yield [entry.key.toString('utf8'), entry.value]
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
   * @returns {AsyncIterator.<CID>}
   * An async iterator that yields CIDs for the blocks that comprise this HashMap.
   */
  this.cids = async function * () {
    yield * iamap.ids()
  }

  Object.defineProperty(this, 'cid', {
    get () {
      return iamap.id
    }
  })
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
 * @param {Object} loader - A loader with `get(cid):block` and `put(cid, block)` functions for
 * loading an storing block data by CID.
 * @param {CID} [root] - A root of an existing HashMap. Provide a CID if you want to load existing
 * data, otherwise omit this option and a new, empty HashMap will be created.
 * @param {Object} [options] - Options for the HashMap. Defaults are provided but you can tweak
 * behavior according to your needs with these options.
 * @param {string} [options.blockCodec='dag-json'] - The IPLD codec used to encode the blocks.
 * @param {string} [options.blockAlg='sha2-256'] - The hash algorithm to use when creating CIDs for
 * the blocks.
 * @param {string} [options.hashAlg='murmur3-32'] - The hash algorithm used for indexing this
 * HashMap. `'murmur3-32'` is the x86 32-bit Murmur3 hash algorithm, used by default. If you want
 * to change this default, you need to provide a new algorithm. For custom hash algorithms,
 * `hashAlg`, `hasher` and `hashBytes` must be provided together.
 * @param {function} [options.hasher=murmur3.x86] - A function that takes a byte array
 * (`Uint8Array`) and should return a byte representing a hash of the input. Supply this option if
 * you wish to override the default `'murmur3-32'` hasher.
 * @param {number} [options.hashBytes=32] - The number of bytes to expect from `hasher` function.
 * Supply this option if you wish to override the default `'murmur3-32'` hasher.
 * @param {number} [options.bitWidth=8] - The number of bits to take from the hash of the key at
 * each level of the HashMap tree to form an index. Read more about this option in the
 * [IAMap documentation](https://github.com/rvagg/iamap#async-iamapcreatestore-options).
 * @param {number} [options.bucketSize=3] - The maximum number of elements to store at each leaf
 * of the HashMap tree structure before overflowing to a new node. Read more about this option in
 * the [IAMap documentation](https://github.com/rvagg/iamap#async-iamapcreatestore-options).
 * @return {HashMap} - A HashMap instance, either loaded from an existing root block CID, or a new,
 * empty HashMap if no CID is provided.
 */
HashMap.create = async function create (loader, root, options) {
  if (!CID.isCID(root)) {
    options = root
    root = null
  }

  if (!loader || typeof loader.get !== 'function' || typeof loader.put !== 'function') {
    throw new TypeError('HashMap.create() requires a loader object with get() and put() methods')
  }

  if (options && typeof options !== 'object') {
    throw new TypeError('HashMap.create() the \'options\' argument must be an object')
  }

  function fromOptions (name, type, def) {
    if (!options || options[name] === undefined) {
      return def
    }
    if (typeof options[name] !== type) { // eslint-disable-line
      throw new TypeError(`HashMap.create() requires '${name}' to be a ${type}`)
    }
    return options[name]
  }

  const codec = fromOptions('blockCodec', 'string', DEFAULT_BLOCK_CODEC)
  const algorithm = fromOptions('blockAlg', 'string', DEFAULT_BLOCK_ALGORITHM)

  const store = {
    async load (cid) {
      const bytes = await loader.get(cid)
      if (!bytes) {
        return undefined
      }
      const block = Block.create(bytes, cid)
      if (!(await block.validate())) {
        throw new Error(`Loaded block for ${cid.toString()} did not validate bytes against CID`)
      }
      return block.decode()
    },

    async save (obj) {
      const block = Block.encoder(obj, codec, algorithm)
      const cid = await block.cid()
      await loader.put(cid, await block.encode())
      return cid
    },

    isEqual (cid1, cid2) {
      return cid1.equals(cid2)
    },

    isLink (obj) {
      return CID.isCID(obj)
    }
  }

  const hashAlg = fromOptions('hashAlg', 'string', DEFAULT_HASH_ALGORITHM)
  const hasher = fromOptions('hasher', 'function', DEFAULT_HASHER)
  const hashBytes = fromOptions('hashBytes', 'number', DEFAULT_HASH_BYTES)
  if (hashAlg !== DEFAULT_HASH_ALGORITHM && (typeof options.hasher !== 'function' || options.hashBytes !== 'number')) {
    throw new TypeError('HashMap.create() requires a \'hasher\' function and a \'hashBytes\' integer to use a custom \'hashAlg\'')
  }
  IAMap.registerHasher(hashAlg, hashBytes, hasher)

  const bitWidth = fromOptions('bitWidth', 'number', DEFAULT_BITWIDTH)
  const bucketSize = fromOptions('bucketSize', 'number', DEFAULT_BUCKET_SIZE)

  const iamapOptions = { hashAlg, bitWidth, bucketSize }

  let iamap
  if (CID.isCID(root)) {
    // load existing, ignoring bitWidth & bucketSize, they are loaded from the existing root
    iamap = await IAMap.load(store, root)
  } else {
    // create new
    iamap = await IAMap.create(store, iamapOptions)
  }

  return new HashMap(iamap)
}

function murmur332Hasher (key) {
  // key is a `Buffer`
  const b = Buffer.alloc(4)
  b.writeUInt32LE(murmurhash3.x86.hash32(key))
  return b
}

module.exports.create = HashMap.create
