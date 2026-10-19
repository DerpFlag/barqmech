import test from 'node:test'
import assert from 'node:assert/strict'
import { createCartStorage } from '../src/cart/cartStorage.ts'
class MemoryStorage {
  data = new Map()
  get length() { return this.data.size }
  key(index) { return [...this.data.keys()][index] ?? null }
  getItem(key) { return this.data.get(key) ?? null }
  setItem(key, value) { this.data.set(key, value) }
  removeItem(key) { this.data.delete(key) }
}
const line = (name = 'a', quantity = 1) => ({ mergeKey:name,productId:name,slug:name,categorySlug:'artwork',title:name,imageUrl:'/image.jpg',priceLabel:'Rs. 100',unitPrice:100,quantity,size:'12 x 12',finish:'Silver' })
function setup() {
  const storage = new MemoryStorage()
  let id = 0
  return { storage, a:createCartStorage(storage,()=>`a-${++id}`), b:createCartStorage(storage,()=>`b-${++id}`) }
}
test('stale tabs retain both products after reload',()=>{
  const {a,b,storage}=setup()
  assert.deepEqual(a.read(),[]);assert.deepEqual(b.read(),[])
  a.dispatch({type:'add',line:line('a')});b.dispatch({type:'add',line:line('b')})
  assert.deepEqual(a.read().map(l=>l.productId),['a','b'])
  assert.deepEqual(createCartStorage(storage).read(),a.read())
})
test('interleaved same-revision writes retain both additions to one variant',()=>{
  const {a,b,storage}=setup()
  storage.setItem('barqmech-cart-v3:base','[]')
  const write=storage.setItem.bind(storage)
  let interleaved=false
  storage.setItem=(key,value)=>{
    if(!interleaved&&key.includes(':op:')) { interleaved=true;b.dispatch({type:'add',line:line('a',2)}) }
    write(key,value)
  }
  a.dispatch({type:'add',line:line('a',3)})
  assert.equal(a.read().length,1);assert.equal(a.read()[0].quantity,5)
})
test('quantity, remove and clear propagate without reviving stale lines',()=>{
  const {a,b}=setup()
  a.dispatch({type:'add',line:line('a')});b.dispatch({type:'add',line:line('b')})
  a.dispatch({type:'quantity',mergeKey:'b',quantity:4});assert.equal(b.read()[1].quantity,4)
  b.dispatch({type:'remove',mergeKey:'a'});assert.deepEqual(a.read().map(l=>l.productId),['b'])
  a.dispatch({type:'clear'});assert.deepEqual(b.read(),[])
  b.dispatch({type:'add',line:line('c')});assert.deepEqual(a.read().map(l=>l.productId),['c'])
})
test('legacy migration is stable despite malformed entries and old tab writes',()=>{
  const {a,b,storage}=setup()
  storage.setItem('barqmech-cart-v2',JSON.stringify([line('old'),{quantity:1}]))
  assert.equal(a.read().length,1)
  b.dispatch({type:'add',line:line('new')})
  storage.setItem('barqmech-cart-v2',JSON.stringify([line('stale')]))
  storage.setItem('barqmech-cart-v3:op:bad','invalid-json')
  assert.deepEqual(a.read().map(l=>l.productId),['old','new'])
})
test('variants stay separate, quantities bounded, failed writes throw',()=>{
  const {a,storage}=setup()
  a.dispatch({type:'add',line:line('silver',80)});a.dispatch({type:'add',line:line('silver',80)})
  a.dispatch({type:'add',line:line('gold')});assert.equal(a.read()[0].quantity,99)
  a.dispatch({type:'quantity',mergeKey:'gold',quantity:-1});assert.equal(a.read()[1].quantity,1)
  storage.setItem=()=>{throw new Error('quota')}
  assert.throws(()=>a.dispatch({type:'add',line:line('unsaved')}),/quota/)
  assert.equal(a.read().some(l=>l.productId==='unsaved'),false)
})

test('locked compaction retains cart, ignores covered operations and keeps revisions monotonic',()=>{
 const {a,b,storage}=setup()
 for(let i=0;i<260;i++)a.dispatch({type:'add',line:line('a')})
 const before=a.read();a.compactUnderLock()
 assert.deepEqual(b.read(),before)
 assert.equal([...storage.data.keys()].filter(k=>k.includes(':op:')).length,0)
 b.dispatch({type:'add',line:line('b')})
 assert.deepEqual(a.read().map(l=>l.productId),['a','b'])
 a.dispatch({type:'remove',mergeKey:'a'});a.compactUnderLock(1)
 assert.deepEqual(b.read().map(l=>l.productId),['b'])
})
