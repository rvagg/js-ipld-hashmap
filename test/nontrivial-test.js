const fs = require('fs').promises
const HashMap = require('../')
const tap = require('tap')

tap.test('Tokenized file test', async (t) => {
  // index the words found in ipld-hashmap.js, storing an array of each instance's location
  const iamapSource = (await fs.readFile(require.resolve('../'), 'utf8')).split('\n')
  const expectedMap = new Map()
  const store = {
    map: new Map(),
    get (k) { return store.map.get(k.toString()) },
    put (k, v) { store.map.set(k.toString(), v) }
  }
  const map = await HashMap.create(store, { bitWidth: 5 })

  let line = 0
  let match
  while (line < iamapSource.length) {
    const wordsRe = /\w+/g
    while ((match = wordsRe.exec(iamapSource[line])) !== null) {
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

  const actualMap = await HashMap.create(store, map.cid)

  t.strictEqual(actualMap.cid, map.cid, 'CIDs match')

  t.strictEqual(await actualMap.size(), expectedMap.size)
  for (const [key, value] of expectedMap.entries()) {
    t.strictDeepEqual(value, await actualMap.get(key))
  }

  let cidCount = 0
  let root
  for await (const cid of actualMap.cids()) {
    if (!root) {
      root = cid
    }
    cidCount++
  }
  t.ok(cidCount >= 20, 'has at least 20 CIDs making up the collection')
  t.strictEqual(actualMap.cid, root, 'first CID emitted is the root')

  // delete one and test that deletion sticks
  await actualMap.delete('exports')
  t.strictEqual(await actualMap.has('exports'), false, `doesn't have what we deleted`)
  t.strictEqual(await actualMap.get('exports'), undefined, `doesn't have what we deleted`)
  t.notEqual(actualMap.cid, map.cid, 'CIDs no longer match')
})
