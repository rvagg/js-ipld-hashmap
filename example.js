import fs from 'fs/promises'
import { create, load } from './ipld-hashmap.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor' // encode blocks using the DAG-CBOR format

// A basic in-memory store for mapping CIDs to their encoded Uint8Array blocks
const store = {
  map: new Map(),
  get (k) { return store.map.get(k.toString()) },
  put (k, v) { store.map.set(k.toString(), v) }
}

// Create a new HashMap by reading the package.json in the current directory and
// storing an entry for each top level and second level field.
async function setup () {
  const map = await create(store, { bitWidth: 4, bucketSize: 2, blockHasher, blockCodec })
  const pkg = JSON.parse(await fs.readFile('./package.json'))
  for (const [key, value] of Object.entries(pkg)) {
    await map.set(key, value)
    if (typeof value === 'object') {
      for (const [key2, value2] of Object.entries(value)) {
        await map.set(`${key} -> ${key2}`, value2)
      }
    }
  }
  // return the CID of the root of the HashMap
  return map.cid
}

// given only the CID of the root of the HashMap, load it and print its contents
async function dump (rootCid) {
  const map = await load(store, rootCid, { blockHasher, blockCodec })
  console.log('ENTRIES ===========================')
  for await (const [key, value] of map.entries()) {
    console.log(`[${key}]:`, value)
  }
  console.log('STATS =============================')
  console.log('size:', await map.size())
  console.log('blocks:')
  for await (const cid of map.cids()) {
    console.log('\t', cid, cid.equals(map.cid) ? '(ROOT)' : '')
    // console.dir(blockCodec.decode(store.get(cid)), { depth: Infinity })
  }
}

setup()
  .then((root) => dump(root))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
