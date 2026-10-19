import { useState } from 'react'
import { AdminWorkspace } from '../admin/AdminWorkspace.tsx'
import type { AdminOrder } from '../admin/model.ts'
import {demoListingSource} from './demo-listings.ts'

const samples:AdminOrder[]=[
  {id:'sample-1',order_code:'204816',customer_name:'Sample Customer A',customer_email:'customer-a@example.test',customer_phone:'00000000000',address_line1:'Sample address — not a real delivery',city:'Lahore',notes:'Please call before delivery. This is fictional preview content.',subtotal_pkr:7800,shipping_pkr:500,grand_total_pkr:8300,payment_method:'cod',created_at:'2026-10-19T08:30:00Z',order_completed:false,order_lines:[{id:'piece-1',title:'[Artwork] Abstract Ball',image_url:'/catalog-images/artwork-abstract-ball/0-640.webp',product_url:'/products/artwork/artwork-abstract-ball',size:'24 x 24',finish:'Black',quantity:1,unit_price_pkr:7800,line_subtotal_pkr:7800,shipping_line_pkr:500,wooden_frame:false,led_backlight:false,installation:false}]},
  {id:'sample-2',order_code:'204815',customer_name:'Sample Customer B',customer_email:'customer-b@example.test',customer_phone:'00000000001',address_line1:'Fictional studio address',city:'Karachi',notes:null,subtotal_pkr:48400,shipping_pkr:1000,grand_total_pkr:49400,payment_method:'cod',created_at:'2026-10-18T11:45:00Z',order_completed:false,order_lines:[{id:'piece-2',title:'[Artwork] Abstract Ball',image_url:'/catalog-images/artwork-abstract-ball/0-640.webp',product_url:'/products/artwork/artwork-abstract-ball',size:'30 x 30',finish:'Gold',quantity:2,unit_price_pkr:24200,line_subtotal_pkr:48400,shipping_line_pkr:1000,wooden_frame:false,led_backlight:false,installation:false}]},
  {id:'sample-3',order_code:'204814',customer_name:'Sample Customer C',customer_email:'customer-c@example.test',customer_phone:'00000000002',address_line1:'Fictional workshop address',city:'Islamabad',notes:null,subtotal_pkr:5500,shipping_pkr:500,grand_total_pkr:6000,payment_method:'cod',created_at:'2026-10-17T09:00:00Z',order_completed:true,order_completed_at:'2026-10-19T06:00:00Z',order_lines:[]}
]
export default function AdminDemo(){
  const [orders,setOrders]=useState(samples)
  const [listings]=useState(demoListingSource)
  return <AdminWorkspace listingsSource={listings} demo orders={orders} loading={false} error={null} synced="sample preview" updating={null}
    onRefresh={()=>setOrders(samples)} onLogout={()=>{window.location.href='/admin'}}
    onComplete={(id,value)=>setOrders(previous=>previous.map(order=>order.id===id?{...order,order_completed:value,order_completed_at:value?new Date().toISOString():null}:order))}/>
}
