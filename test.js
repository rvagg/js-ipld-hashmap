const HashMap = require('./')
const ZipDatastore = require('datastore-zipcar')

async function test () {
  const file = 'test.zcar'
  const ds = new ZipDatastore(file)
  const map = await HashMap.create(ds)
  await map.set('foo', 'bar')
  await map.set('bar', 'baz')
  await map.set('baz', 'boom')
  await ds.close()

  console.log('loading from', map.id.toString())
  const ds2 = new ZipDatastore(file)
  const map2 = await HashMap.create(ds2, map.id)

  console.log('entries')
  for await (const entry of map2.entries()) {
    console.log('\t', entry)
  }
  console.log('keys')
  for await (const key of map2.keys()) {
    console.log('\t', key)
  }
  console.log('values')
  for await (const value of map2.values()) {
    console.log('\t', value)
  }

  console.log('get(foo)', await map.get('foo'))
}

test().catch((err) => {
  console.error(err)
  process.exit(1)
})
