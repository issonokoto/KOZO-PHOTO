import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BUNDLED_POSES} from '../poses.js';
const root=fileURLToPath(new URL('../',import.meta.url));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
let js=fs.readFileSync(path.join(root,'camera.js'),'utf8').replace("import { renderTextCanvas } from './text.js';",'').replace(/import \{ BUNDLED_POSES \} from '\.\/poses\.js(?:\?[^']*)?';/,'');
const poses=BUNDLED_POSES.map(pose=>({...pose,src:'data:image/png;base64,'+fs.readFileSync(path.join(root,pose.src)).toString('base64')}));
const text=fs.readFileSync(path.join(root,'text.js'),'utf8').replaceAll('export ','');
const css=fs.readFileSync(path.join(root,'camera.css'),'utf8');
for(const file of ['pose-placeholder.svg','name.svg','favicon.svg']){
 const data='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
 html=html.replaceAll('assets/'+file,data);js=js.replaceAll('./assets/'+file,data);
}
const script='const BUNDLED_POSES = '+JSON.stringify(poses)+';\n'+text+'\n'+js;
const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
if(check.status!==0)throw new Error(check.stderr);
html=html.replace(/<link rel="stylesheet" href="camera\.css(?:\?[^\"]*)?">/,'<style>'+css+'</style>').replace(/<script type="module" src="camera\.js(?:\?[^\"]*)?"><\/script>/,'');
html=html.replace('</body>','<script type="module">'+script.replaceAll('</script','<\\/script')+'</script></body>');
fs.writeFileSync(path.join(root,'KOZO_PHOTO.html'),html);
console.log('KOZO_PHOTO.html を作成しました。人物素材: '+poses.length+'枚');
