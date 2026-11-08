import {coach} from '../server/coach.mjs';
export default async function handler(req,res){
 const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
 const body=typeof req.body==='string'?req.body:JSON.stringify(req.body??{});
 const request=new Request('https://bridge.invalid/api/coach',{method:req.method,headers,...(req.method==='GET'||req.method==='HEAD'?{}:{body})});
 const result=await coach(request,process.env);res.statusCode=result.status;result.headers.forEach((v,k)=>res.setHeader(k,v));res.end(await result.text());
}
