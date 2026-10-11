import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {BUNDLED_POSES} from '../poses.js';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['camera.js','text.js','poses.js','server.mjs','scripts/install-assets.mjs','scripts/build-standalone.mjs']){
 const result=spawnSync(process.execPath,['--check',file],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../camera.js',import.meta.url),'utf8');
const missing=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]).filter(id=>!html.includes('id="'+id+'"'));
if(missing.length)throw new Error('Missing DOM elements: '+[...new Set(missing)].join(', '));
const ids=new Set();
for(const pose of BUNDLED_POSES){
 if(ids.has(pose.id))throw new Error('Duplicate pose: '+pose.id);
 ids.add(pose.id);
 const bytes=fs.readFileSync(new URL('../'+pose.src,import.meta.url));
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error('Invalid PNG: '+pose.src);
}
console.log('JavaScript構文と画面要素の参照を確認しました。');
console.log('人物素材: '+BUNDLED_POSES.length+'ポーズを確認しました。');
