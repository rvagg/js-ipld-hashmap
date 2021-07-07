/* eslint-env mocha */

import { create as createHashMap, load as loadHashMap } from '../ipld-hashmap.js'
import { words } from './words-fixture.js'
import { sha256 as blockHasher } from 'multiformats/hashes/sha2'
import * as blockCodec from '@ipld/dag-cbor'
import { assert } from 'chai'

/**
 * @typedef {import('multiformats/cid').CID} CID
 */

describe('Nontrivial', () => {
  it('Tokenized file test', async () => {
    // index the words found in ipld-hashmap.js, storing an array of each instance's location
    const expectedMap = new Map()
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
    const map = await createHashMap(store, { bitWidth: 5, blockHasher, blockCodec })

    let line = 0
    let match
    while (line < words.length) {
      const wordsRe = /\w+/g
      while ((match = wordsRe.exec(words[line])) !== null) {
        const word = match[0]
        const column = wordsRe.lastIndex - word.length + 1
        const datum = { line, column }
        datum.line++

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
      }
      line++
    }

    const actualMap = await loadHashMap(store, map.cid, { blockHasher, blockCodec })

    assert.strictEqual(actualMap.cid, map.cid, 'CIDs match')

    // alice-words HashMap fixture expects this root
    assert.strictEqual(actualMap.cid.toString(),
      'bafyreic672jz6huur4c2yekd3uycswe2xfqhjlmtmm5dorb6yoytgflova',
      'CID matches spec fixture')

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
    assert.strictEqual(actualMap.cid, root, 'first CID emitted is the root')

    // delete a word that doesn't exist and see that it hasn't mutated
    assert.strictEqual(await actualMap.has('polynomial'), false, 'doesn\'t have word it shouldn\'t')
    assert.strictEqual(await actualMap.get('polynomial'), undefined, 'doesn\'t have word it shouldn\'t')
    await actualMap.delete('polynomial')
    assert.strictEqual(await actualMap.has('polynomial'), false, 'doesn\'t have word it shouldn\'t')
    assert.strictEqual(await actualMap.get('polynomial'), undefined, 'doesn\'t have word it shouldn\'t')
    assert(actualMap.cid.equals(map.cid), 'CIDs still match')

    // delete one and test that deletion sticks
    await actualMap.delete('Alice')
    assert.strictEqual(await actualMap.has('Alice'), false, 'doesn\'t have what we deleted')
    assert.strictEqual(await actualMap.get('Alice'), undefined, 'doesn\'t have what we deleted')
    assert(!actualMap.cid.equals(map.cid), 'CIDs no longer match')
  }).timeout(1000 * 10)
})
