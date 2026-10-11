import {spawnSync} from 'node:child_process';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
for(const file of ['camera.js','text.js','poses.js','server.mjs','scripts/install-assets.mjs','scripts/build-standalone.mjs']){
 const result=spawnSync(process.execPath,['--check',file],{cwd:root,stdio:'inherit'});
 if(result.status!==0)process.exit(result.status||1);
}
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../camera.js',import.meta.url),'utf8');
const missing=[...js.matchAll(/\$\('([^']+)'\)/g)].map(m=>m[1]).filter(id=>!html.includes('id="'+id+'"'));
if(missing.length)throw new Error('Missing DOM elements: '+[...new Set(missing)].join(', '));
console.log('JavaScript構文と画面要素の参照を確認しました。');
