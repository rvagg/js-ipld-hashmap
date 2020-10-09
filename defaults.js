const codec = require('@ipld/dag-cbor')
const hasher = require('multiformats/hashes/sha2').sha256
const { create } = require('./ipld-hashmap.js')

const defaults = { codec, hasher }

module.exports.create = ({loader, root, options}) => {
  if (!options) options = {}
  if (!loader || typeof loader.get !== 'function' || typeof loader.put !== 'function') {
    throw new TypeError('HashMap.create() requires a loader object with get() and put() methods')
  }

  if (options && typeof options !== 'object') {
    throw new TypeError('HashMap.create() the \'options\' argument must be an object')
  }

  return create(loader, root, { ...defaults, ...options })
}
