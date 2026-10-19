import type { CartLine } from './types.ts'

const LEGACY_KEY = 'barqmech-cart-v2'
const BASE_KEY = 'barqmech-cart-v3:base'
const OP_PREFIX = 'barqmech-cart-v3:op:'
type StoragePort = Pick<Storage, 'getItem' | 'setItem' | 'key' | 'length'> & Partial<Pick<Storage,'removeItem'>>
export type CartOperation =
  | { type: 'add'; line: CartLine }
  | { type: 'remove'; mergeKey: string }
  | { type: 'quantity'; mergeKey: string; quantity: number }
  | { type: 'clear' }
type Entry = { id: string; revision: number; operation: CartOperation }

const quantity = (value: number) => Math.min(99, Math.max(1, Math.floor(value)))
function validLine(value: unknown): value is CartLine {
  if (!value || typeof value !== 'object') return false
  const line = value as CartLine
  return ['mergeKey', 'productId', 'slug', 'categorySlug', 'title', 'imageUrl', 'priceLabel', 'size', 'finish']
    .every(key => typeof line[key as keyof CartLine] === 'string') &&
    Number.isFinite(line.quantity) && line.quantity > 0 && Number.isFinite(line.unitPrice) && line.unitPrice >= 0
}
function validOperation(value: unknown): value is CartOperation {
  if (!value || typeof value !== 'object') return false
  const operation = value as CartOperation
  if (operation.type === 'clear') return true
  if (operation.type === 'add') return validLine(operation.line)
  return typeof (operation as { mergeKey?: unknown }).mergeKey === 'string' &&
    (operation.type === 'remove' || (operation.type === 'quantity' && Number.isFinite(operation.quantity)))
}
function parse(raw: string | null): unknown {
  try { return raw ? JSON.parse(raw) : null } catch { return null }
}
function apply(lines: CartLine[], operation: CartOperation): CartLine[] {
  switch (operation.type) {
    case 'clear': return []
    case 'remove': return lines.filter(line => line.mergeKey !== operation.mergeKey)
    case 'quantity': return lines.map(line => line.mergeKey === operation.mergeKey ? { ...line, quantity: quantity(operation.quantity) } : line)
    case 'add': {
      const existing = lines.find(line => line.mergeKey === operation.line.mergeKey)
      if (!existing) return [...lines, { ...operation.line, quantity: quantity(operation.line.quantity) }]
      return lines.map(line => line === existing ? { ...line, quantity: quantity(line.quantity + operation.line.quantity) } : line)
    }
  }
}

/** Each change has its own storage key. Concurrent tabs cannot overwrite one
 * another's whole cart, and replay also preserves removals/quantity changes.
 * Keep the legacy array as a migration seed, never as a live write-back target. */
export function createCartStorage(storage: StoragePort, makeId = () => crypto.randomUUID()) {
  function checkpoint() {
    const value = parse(storage.getItem(BASE_KEY)) as {lines?:unknown;revision?:number}|null
    return value && !Array.isArray(value) && Array.isArray(value.lines) && Number.isSafeInteger(value.revision)
      ? {lines:value.lines.filter(validLine),revision:value.revision!} : null
  }
  function base(): CartLine[] {
    const saved=checkpoint()
    if(saved)return saved.lines
    const raw = storage.getItem(BASE_KEY)
    const value = parse(raw === null ? storage.getItem(LEGACY_KEY) : raw)
    return Array.isArray(value) ? value.filter(validLine).map(line => ({ ...line, quantity: quantity(line.quantity) })) : []
  }
  function entries(): Entry[] {
    const found: Entry[] = []
    for (let index = 0; index < storage.length; index++) {
      const key = storage.key(index)
      if (!key?.startsWith(OP_PREFIX)) continue
      const value = parse(storage.getItem(key)) as Entry | null
      if (value && typeof value.id === 'string' && key === OP_PREFIX + value.id &&
        Number.isSafeInteger(value.revision) && value.revision > 0 && validOperation(value.operation)) found.push(value)
    }
    const revision=checkpoint()?.revision??0
    return found.filter(entry=>entry.revision>revision).sort((a, b) => a.revision - b.revision || a.id.localeCompare(b.id))
  }
  function read(): CartLine[] {
    try { return entries().reduce((lines, entry) => apply(lines, entry.operation), base()) }
    catch { return [] }
  }
  return {
    read,
    isCartKey: (key: string | null) => key === null || key === LEGACY_KEY || key === BASE_KEY || key.startsWith(OP_PREFIX),
    /** Caller must hold the same Web Lock as every writer. Snapshot revision makes
     * reads safe between writing the checkpoint and removing covered operations. */
    compactUnderLock(threshold=250) {
      if(!storage.removeItem)return
      const changes=entries()
      if(changes.length<threshold)return
      const revision=changes.at(-1)!.revision
      const lines=changes.reduce((lines,entry)=>apply(lines,entry.operation),base())
      storage.setItem(BASE_KEY,JSON.stringify({lines,revision}))
      for(const entry of changes)storage.removeItem(OP_PREFIX+entry.id)
    },
    dispatch(operation: CartOperation): CartLine[] {
      if (!validOperation(operation)) throw new Error('Invalid cart change')
      if (storage.getItem(BASE_KEY) === null) storage.setItem(BASE_KEY, JSON.stringify(base()))
      const changes = entries()
      const entry: Entry = { id: makeId(), revision: Math.max(changes.at(-1)?.revision ?? 0,checkpoint()?.revision??0) + 1, operation }
      storage.setItem(OP_PREFIX + entry.id, JSON.stringify(entry))
      return read()
    },
  }
}
