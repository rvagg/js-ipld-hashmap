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

  // accessors
  for (const fn of 'get has size'.split(' ')) {
    this[fn] = async function () {
      return iamap[fn].apply(iamap, arguments)
    }
  }

  // iterators
  for (const fn of 'values entries ids'.split(' ')) {
    this[fn] = async function * () {
      yield * iamap[fn]()
    }
  }

  this.keys = async function * () {
    for await (const key of iamap.keys()) {
      // IAMap keys are Buffers, make them strings
      yield key.toString('utf8')
    }
  }

  this.entries = async function * () {
    for await (const entry of iamap.entries()) {
      // IAMap keys are Buffers, make them strings
      entry.key = entry.key.toString('utf8')
      yield entry
    }
  }

  // mutators
  for (const fn of 'set delete'.split(' ')) {
    this[fn] = async function () {
      // iamap mutation operations return a new iamap, so update with that
      iamap = await iamap[fn].apply(iamap, arguments)
    }
  }

  Object.defineProperty(this, 'id', {
    get () {
      return iamap.id
    }
  })
}

HashMap.create = async function create (loader, root, options) {
  if (!CID.isCID(root)) {
    options = root
    root = null
  }

  if (!loader || typeof loader.get !== 'function' || typeof loader.put !== 'function') {
    throw new TypeError('HashMap.create() requires a loader object with get() and put() methods')
  }

  if (options && typeof options !== 'object') {
    throw new TypeError(`HashMap.create() the 'options' argument must be an object`)
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
      const block = Block.create(bytes, cid)
      if (!(await block.validate())) {
        throw new Error(`Loadded block for ${cid.toString()} did not validate bytes against CID`)
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
    throw new TypeError(`HashMap.create() requires a 'hasher' function and a 'hashBytes' integer to use a custom 'hashAlg'`)
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
