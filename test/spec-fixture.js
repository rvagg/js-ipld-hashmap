/* eslint-env mocha */

import { create as createHashMap, load as loadHashMap } from '../ipld-hashmap.js'
import { words } from './words-fixture.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import { assert } from 'chai'
import { CarWriter } from '@ipld/car/writer'
import { CarBlockIterator } from '@ipld/car/iterator'
import fs from 'fs'
import { Readable } from 'stream'

/**
 * @typedef {import('multiformats/cid').CID} CID
 */

function makeStore () {
  const store = {
    /** @type {Map<CID, Uint8Array>} */
    map: new Map(),
    /** @param {CID} k */
    get (k) {
      return store.map.get(k.toString())
    },
    /**
       * @param {CID} k
       * @param {Uint8Array} v
       */
    put (k, v) {
      store.map.set(k.toString(), v)
    }
  }
  return store
}

async function parseWords (cb) {
  let line = 0
  let match
  while (line < words.length) {
    const wordsRe = /\w+/g
    while ((match = wordsRe.exec(words[line])) !== null) {
      const word = match[0]
      const column = wordsRe.lastIndex - word.length + 1
      const datum = { line, column }
      datum.line++
      await cb(word, datum)
    }
    line++
  }
}

async function verifyMap (actualMap, expectedCid, expectedMap) {
  assert(actualMap.cid.equals(expectedCid), 'CIDs match')

  assert.strictEqual(await actualMap.size(), expectedMap.size)
  for (const entry of expectedMap.entries()) {
    assert.deepStrictEqual([entry[0], await actualMap.get(entry[0])], entry)
  }

  let cidCount = 0
  let root
  for await (const cid of actualMap.cids()) {
    if (!root) {
      root = cid
    }
    cidCount++
  }
  assert.ok(cidCount >= 30, `has at least 30 CIDs making up the collection (got ${cidCount})`)
  assert(actualMap.cid.equals(root), 'first CID emitted is the root')

  // delete a word that doesn't exist and see that it hasn't mutated
  assert.strictEqual(await actualMap.has('polynomial'), false, 'doesn\'t have word it shouldn\'t')
  assert.strictEqual(await actualMap.get('polynomial'), undefined, 'doesn\'t have word it shouldn\'t')
  await actualMap.delete('polynomial')
  assert.strictEqual(await actualMap.has('polynomial'), false, 'doesn\'t have word it shouldn\'t')
  assert.strictEqual(await actualMap.get('polynomial'), undefined, 'doesn\'t have word it shouldn\'t')
  assert(actualMap.cid.equals(expectedCid), 'CIDs still match')

  // delete one and test that deletion sticks
  await actualMap.delete('Alice')
  assert.strictEqual(await actualMap.has('Alice'), false, 'doesn\'t have what we deleted')
  assert.strictEqual(await actualMap.get('Alice'), undefined, 'doesn\'t have what we deleted')
  assert(!actualMap.cid.equals(expectedCid), 'CIDs no longer match')
}

const runCreate = async () => {
  // index the words found in ipld-hashmap.js, storing an array of each instance's location
  const expectedMap = new Map()
  const store = makeStore()
  const map = await createHashMap(store, { bitWidth: 5, blockHasher, blockCodec })

  await parseWords(async (word, datum) => {
    // store in our existing memory map
    if (!expectedMap.has(word)) {
      expectedMap.set(word, [])
    }
    expectedMap.get(word).push(datum)

    // store in the ipld map
    let results = await map.get(word)
    results = results ? results.slice() : [] // copy of results, or new
    results.push(datum)
    await map.set(word, results)
  })

  const actualMap = await loadHashMap(store, map.cid, { blockHasher, blockCodec })
  await verifyMap(actualMap, map.cid, expectedMap)

  const { writer, out } = await CarWriter.create([map.cid])
  Readable.from(out).pipe(fs.createWriteStream('hamt.car'))

  for await (const cid of map.cids()) {
    const bytes = store.get(cid)
    if (!bytes) throw new Error('nope: ' + cid)
    await writer.put({ cid, bytes })
  }
  await writer.close()

  console.log(`wrote ${map.cid} to hamt.car`)
}

const runLoad = async () => {
  const inStream = fs.createReadStream('hamt.car')
  const reader = await CarBlockIterator.fromIterable(inStream)
  const root = (await reader.getRoots())[0]
  const store = makeStore()
  for await (const { cid, bytes } of reader) {
    store.put(cid, bytes)
  }
  const actualMap = await loadHashMap(store, root, { blockHasher, blockCodec })
  console.log(`loaded ${root} from hamt.car`)
  const expectedMap = new Map()
  await parseWords(async (word, datum) => {
    // store in our existing memory map
    if (!expectedMap.has(word)) {
      expectedMap.set(word, [])
    }
    expectedMap.get(word).push(datum)
  })
  const obj = {}
  const keys = [...expectedMap.keys()]
  keys.sort()
  for (const key of keys) {
    // console.log(key, value)
    obj[key] = expectedMap.get(key)
  }
  await verifyMap(actualMap, root, expectedMap)
  console.log(JSON.stringify(obj, null, 2))
}

// runCreate to generate the fixture
runCreate().catch((err) => {
  console.error(err)
  process.exit(1)
}).then(() => {
  // runLoad to load and verify the fixture -- run this alone without generating to check against spec
  runLoad().catch((err) => {
    console.error(err)
    process.exit(1)
  })
})
