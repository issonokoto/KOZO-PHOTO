import fs from 'node:fs';
import {spawnSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {BUNDLED_POSES} from '../poses.js';
import {BUNDLED_FRAMES} from '../frames.js';
const root=fileURLToPath(new URL('../',import.meta.url));
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
// A local single-file copy has no installable URL or external app icons.
html=html.replace(/\s*<link rel="(?:manifest|apple-touch-icon)"[^>]*>/g,'');
let js=fs.readFileSync(path.join(root,'camera.js'),'utf8').replace("import { renderTextCanvas } from './text.js';",'').replace(/import \{ BUNDLED_POSES \} from '\.\/poses\.js(?:\?[^']*)?';/,'');
js=js.replace(/import \{ BUNDLED_FRAMES, drawPhotoFrame \} from '\.\/frames\.js(?:\?[^']*)?';/,'');
function embed(file){
 const mime={'.png':'image/png','.webp':'image/webp'}[path.extname(file)];
 if(!mime)throw new Error('Unsupported image: '+file);
 return 'data:'+mime+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64');
}
const poses=BUNDLED_POSES.map(pose=>({...pose,src:embed(pose.src),thumbnail:pose.thumbnail?embed(pose.thumbnail):undefined}));
const frames=BUNDLED_FRAMES.map(frame=>({...frame,src:embed(frame.src),thumbnail:embed(frame.thumbnail)}));
const frameSource=fs.readFileSync(path.join(root,'frames.js'),'utf8');
const frameRenderer=frameSource.slice(frameSource.indexOf('export function drawPhotoFrame')).replace('export ', '');
const text=fs.readFileSync(path.join(root,'text.js'),'utf8').replaceAll('export ','');
const css=fs.readFileSync(path.join(root,'camera.css'),'utf8');
for(const file of ['pose-placeholder.svg','name.svg','favicon.svg']){
 const data='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'assets',file)).toString('base64');
 html=html.replaceAll('assets/'+file,data);js=js.replaceAll('./assets/'+file,data);
}
const script='const BUNDLED_POSES = '+JSON.stringify(poses)+';\nconst BUNDLED_FRAMES = '+JSON.stringify(frames)+';\n'+frameRenderer+'\n'+text+'\n'+js;
const check=spawnSync(process.execPath,['--input-type=module','--check'],{input:script,encoding:'utf8'});
if(check.status!==0)throw new Error(check.stderr);
html=html.replace(/<link rel="stylesheet" href="camera\.css(?:\?[^\"]*)?">/,'<style>'+css+'</style>').replace(/<script type="module" src="camera\.js(?:\?[^\"]*)?"><\/script>/,'');
html=html.replace('</body>','<script type="module">'+script.replaceAll('</script','<\\/script')+'</script></body>');
fs.writeFileSync(path.join(root,'KOHZO_PHOTO.html'),html);
console.log('KOHZO_PHOTO.html を作成しました。人物素材: '+poses.length+'枚・フレーム: '+frames.length+'種類');
