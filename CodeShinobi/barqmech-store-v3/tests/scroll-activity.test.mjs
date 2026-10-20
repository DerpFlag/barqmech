import test from 'node:test'
import assert from 'node:assert/strict'
import { watchScrollIdle } from '../src/components/scrollActivity.ts'

test('decorative work waits for a quiet scroll window and unsubscribes cleanly', context => {
  const previousWindow=globalThis.window
  globalThis.window=new EventTarget()
  context.mock.timers.enable({apis:['setTimeout']})
  const a=[],b=[]
  let stopA,stopB
  try {
    stopA=watchScrollIdle(idle=>a.push(idle))
    window.dispatchEvent(new Event('scroll'))
    context.mock.timers.tick(100)
    stopB=watchScrollIdle(idle=>b.push(idle))
    window.dispatchEvent(new Event('scroll'))
    context.mock.timers.tick(159)
    assert.deepEqual(a,[true,false])
    assert.deepEqual(b,[false])
    context.mock.timers.tick(1)
    assert.deepEqual(a,[true,false,true])
    assert.deepEqual(b,[false,true])
    stopA();stopB()
    window.dispatchEvent(new Event('scroll'))
    context.mock.timers.tick(200)
    assert.deepEqual(a,[true,false,true])
    const fresh=[]
    stopA=watchScrollIdle(idle=>fresh.push(idle))
    assert.deepEqual(fresh,[true])
  } finally {
    stopA?.();stopB?.()
    context.mock.timers.reset()
    if(previousWindow===undefined)delete globalThis.window
    else globalThis.window=previousWindow
  }
})
