import http from 'node:http';
import {createReadStream} from 'node:fs';
import {stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.join(path.dirname(fileURLToPath(import.meta.url)),'dist');
const port=Number(process.env.PORT||4173);
const types={'.woff2':'font/woff2','.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.mp4':'video/mp4','.txt':'text/plain; charset=utf-8','.vtt':'text/vtt; charset=utf-8'};
const server=http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  res.setHeader('Cache-Control','no-cache');
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405,{Allow:'GET, HEAD'});res.end();return}
  let pathname;
  try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400);res.end();return}
  const filename=path.resolve(root,'.'+pathname.replaceAll('\\','/'));
  if(filename!==root&&!filename.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  let file=filename,info,status=200;
  try{
    info=await stat(file);
    if(info.isDirectory()){
      if(!pathname.endsWith('/')){res.writeHead(308,{Location:pathname+'/'});res.end();return}
      file=path.join(file,'index.html');info=await stat(file);
    }
    if(!info.isFile())throw Error('Not a file');
  }catch{
    const lang=['zh','en','ru'].includes(pathname.split('/')[1])?pathname.split('/')[1]:'zh';
    file=path.join(root,lang,'404','index.html');
    try{info=await stat(file)}catch{res.writeHead(503);res.end('Build the website first.');return}
    status=404;
  }
  let start=0,end=info.size-1;
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  res.setHeader('Accept-Ranges','bytes');
  if(req.headers.range&&status===200){
    const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if(!match||(!match[1]&&!match[2])){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
    if(!match[1])start=Math.max(0,info.size-Number(match[2]));
    else{start=Number(match[1]);if(match[2])end=Math.min(Number(match[2]),end)}
    if(!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});res.end();return}
    status=206;res.setHeader('Content-Range',`bytes ${start}-${end}/${info.size}`);
  }
  res.writeHead(status,{'Content-Length':end-start+1});
  if(req.method==='HEAD'){res.end();return}
  const stream=createReadStream(file,{start,end});
  stream.on('error',()=>res.destroy());res.on('close',()=>stream.destroy());stream.pipe(res);
});
server.listen(port,process.env.HOST||'::',()=>console.log(`Website preview: http://localhost:${port}/zh/`));
