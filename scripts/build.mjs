import { readFile, mkdir, stat, rename, rm, cp } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root,'sources/figma-assets.json'),'utf8'));
const assetsRoot = resolve(root,'public/assets') + sep;
async function exists(path) { try { return (await stat(path)).size > 30; } catch { return false; } }
async function download(item) {
 const path=resolve(root,item.path);
 if(!path.startsWith(assetsRoot)) throw new Error('Unsafe asset path');
 const url=new URL(item.url);
 if(url.origin!=='https://www.figma.com'||!url.pathname.startsWith('/api/mcp/asset/')) throw new Error('Untrusted asset source');
 if(await exists(path)) return;
 await mkdir(dirname(path),{recursive:true});
 const tmp=path+'.download';
 try {
  await new Promise((ok,fail)=>{const p=spawn('curl',['--fail','--location','--retry','2','--max-time','60','--silent','--show-error','--output',tmp,item.url],{stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.on('data',d=>{stderr+=d.toString();});p.on('error',fail);p.on('exit',code=>code===0?ok():fail(new Error(`Asset download failed: ${item.path} (exit ${code}). Refresh expired Figma sources if needed. ${stderr.slice(-200)}`)));});
  if(!await exists(tmp)) throw new Error('Empty asset: '+item.path);
  const bytes=await readFile(tmp);
  const valid=item.path.endsWith('.png')?bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):bytes.toString('utf8').includes('<svg');
  if(!valid) throw new Error('Unexpected asset content: '+item.path);
  await rename(tmp,path);
 } finally {await rm(tmp,{force:true});}
}
// Bounded parallelism; never ship a successful build with missing assets.
for(let i=0;i<manifest.length;i+=6) await Promise.all(manifest.slice(i,i+6).map(download));
await rm(resolve(root,'dist'),{recursive:true,force:true});
await cp(resolve(root,'public'),resolve(root,'dist'),{recursive:true});
console.log(`Built dist with ${manifest.length} local Figma assets.`);
