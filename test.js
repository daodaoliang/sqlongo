const assert = (j, k) => { if (!k && !j || !k(j)) { throw new Error('Assertion failed') } }
const silent = (j) => assert(j, k => typeof k === 'undefined')

process.on('unhandledRejection', e => { throw e })

const runTest = async () => {
  let Sqlongo = require('./index')
  let db = new Sqlongo()

  db.test1 = {
    id: 'integer primary key',
    content: 'text'
  }

  assert(await db.raw(`select * from test1`), k => k.length === 0)
  
  silent(await db.test1.insert({ content: 'Hello, World! 1' }))
  silent(await db.test1.insert({ content: 'Hello, World! 2' }))
  assert(await db.test1.distinct('content', { content: { $like: '%2' } }), k => k.length === 1)
  
  assert(await db`
    select distinct content from test1 where id > ${ 1 }
  `, k => k.length === 1)

  silent(await db.test1.insert({ content: 'Hello, World! 3' }))
  silent(await db.test1.insert({ content: 'Hello, World! 4' }))
  silent(await db.test1.update({ id: 2 }, { content: 'Hello, World! 5' }))
  assert(await db.test1.count(), k => k === 4)

  silent(await db.test1.remove({ id: { $gt: 2 } }, 1))
  assert(await db.test1.count(), k => k === 3)

  silent(await db.test1.remove({ id: { $ne: 2 } }, 1))
  assert(await db.test1.find(), k => k.length === 2)
  assert(await db.test1.find({}, 1), k => k.id === 2 && /5$/.test(k.content))

  silent(await db.test1.insert({ content: 'Hello, World! 3' }))
  assert(await db.test1.find({ id: { $in: [3, 4, 5] } }, -1, 0, 'content-'), k => k.length === 2)
  console.log('Passed.')
}

runTest()
