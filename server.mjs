import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg'};
createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'); const relative=decodeURIComponent(url.pathname).replace(/^\/+/, '')||'index.html';const target=path.resolve(root,relative);if(!target.startsWith(root)){res.writeHead(403);res.end();return;}res.setHeader('Content-Type',types[path.extname(target)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await readFile(target));}catch{res.writeHead(404);res.end('Not found');}}).listen(4173,'127.0.0.1',()=>console.log('KOZO PHOTO: http://127.0.0.1:4173'));
