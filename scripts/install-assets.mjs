import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2]||path.join(root,'incoming'));
const pngFiles=fs.readdirSync(source,{withFileTypes:true}).filter(f=>f.isFile()&&/\.png$/i.test(f.name)).map(f=>f.name);
const definitions=[
 {id:'smile',name:'笑顔',pattern:/老紳士|smile|^001\.png$/i},
 {id:'peace',name:'ピース',pattern:/ピース|peace|^002\.png$/i},
 {id:'thumb',name:'サムズアップ',pattern:/親指|サムズ|thumb|^003\.png$/i}
];
const chosen=definitions.map(pose=>{
 const matches=pngFiles.filter(file=>pose.pattern.test(file));
 if(matches.length!==1)throw new Error(pose.name+'のPNGを1枚だけ用意してください。候補: '+matches.join(', '));
 const bytes=fs.readFileSync(path.join(source,matches[0]));
 if(!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))throw new Error(matches[0]+'はPNGではありません。');
 return {...pose,bytes};
});
for(const pose of chosen)fs.writeFileSync(path.join(root,'assets','kozo-'+pose.id+'.png'),pose.bytes);
const manifest=chosen.map(pose=>({id:pose.id,src:'./assets/kozo-'+pose.id+'.png'}));
fs.writeFileSync(path.join(root,'poses.js'),'export const BUNDLED_POSES = '+JSON.stringify(manifest,null,2)+';\n');
console.log('幸造さんの3ポーズを組み込みました。npm run build で単体版を更新できます。');
