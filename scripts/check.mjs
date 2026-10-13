import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
import {BUNDLED_POSES} from '../poses.js';
import {BUNDLED_FRAMES} from '../frames.js';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['camera.js','text.js','poses.js','frames.js','server.mjs','scripts/install-assets.mjs','scripts/build-standalone.mjs']){
 const result=spawnSync(process.execPath,['--check',file],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../camera.js',import.meta.url),'utf8');
const missing=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]).filter(id=>!html.includes('id="'+id+'"'));
if(missing.length)throw new Error('Missing DOM elements: '+[...new Set(missing)].join(', '));
const ids=new Set();
function checkImage(file){
 const bytes=fs.readFileSync(new URL('../'+file,import.meta.url));
 const png=bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
 const webp=bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!png&&!webp)throw new Error('Invalid image: '+file);
}
for(const pose of BUNDLED_POSES){
 if(ids.has(pose.id))throw new Error('Duplicate pose: '+pose.id);
 ids.add(pose.id);
 checkImage(pose.src);
 if(pose.thumbnail)checkImage(pose.thumbnail);
}
console.log('JavaScript構文と画面要素の参照を確認しました。');
console.log('人物素材: '+BUNDLED_POSES.length+'ポーズを確認しました。');
const frameIds=new Set();
for(const frame of BUNDLED_FRAMES){
 if(!frame.id||frameIds.has(frame.id))throw new Error('Invalid frame id: '+frame.id);
 frameIds.add(frame.id);
 checkImage(frame.src);checkImage(frame.thumbnail);
}
console.log('フレーム: '+BUNDLED_FRAMES.length+'種類を確認しました。');
