import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parseCsv,compileCatalog } from '../scripts/build-catalog.mjs'
test('portable CSV parser preserves quotes, commas and multiline fields',()=>{
 assert.deepEqual(parseCsv('id,title\r\n1,"A, B"\r\n2,"A ""quoted""\nline"\n'),[{id:'1',title:'A, B'},{id:'2',title:'A "quoted"\nline'}])
 assert.throws(()=>parseCsv('a,b\n1'),/column count/)
})
test('all committed products have feasible positive prices and no database URLs',()=>{
 const products=parseCsv(readFileSync(new URL('../catalog/products.csv',import.meta.url),'utf8')),prices=parseCsv(readFileSync(new URL('../catalog/prices.csv',import.meta.url),'utf8'))
 const result=compileCatalog(products,prices)
 assert.equal(result.length,346);assert.equal(result.reduce((n,p)=>n+p.variants.length,0),2470)
 assert.equal(JSON.stringify(result).includes('.supabase.co'),false);assert.equal(JSON.stringify(result).includes('C:\\'),false)
 const duplicate=[...prices,prices[0]];assert.throws(()=>compileCatalog(products,duplicate),/Duplicate size/)
 assert.throws(()=>compileCatalog(products,[{...prices[0],silver_pkr:'-1'}]),/Invalid PKR/)
 assert.equal(result[0].variants[0].pricing.sizes[0].areaSqFt,2.25)
 for(const area_sqft of ['', '0', '-1', 'NaN', '999'])assert.throws(()=>compileCatalog(products,[{...prices[0],area_sqft}]),/Invalid area_sqft/)
})
