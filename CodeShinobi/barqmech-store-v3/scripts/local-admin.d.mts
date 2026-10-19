import type {IncomingMessage, ServerResponse} from 'node:http'
export function createLocalAdminMiddleware(password:string, options?:{now?:()=>number;catalog?:unknown}): (req:IncomingMessage,res:ServerResponse,next:()=>void)=>Promise<void>
