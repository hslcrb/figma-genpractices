import { readFile, mkdir, stat, rename, rm, cp } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
const root = fileURLToPath(new URL('../', import.meta.url));
const manifest = JSON.parse(await readFile(resolve(root,'sources/figma-assets.json'),'utf8'));
const assetsRoot = resolve(root,'public/assets') + sep;
async function exists(path) { try { return (await stat(path)).size > 30; } catch { return false; } }
// Figma download names are not encoding guarantees: a .png URL may serve JPEG.
// Inspect signatures, not extensions or an untrusted Content-Type header.
function imageType(bytes) {
 if(bytes.length <= 30) return null;
 if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'png';
 if(bytes[0]===0xff && bytes[1]===0xd8 && bytes[2]===0xff) return 'jpeg';
 const header=bytes.toString('ascii',0,16);
 if(header.startsWith('GIF87a') || header.startsWith('GIF89a')) return 'gif';
 if(header.startsWith('RIFF') && header.slice(8,12)==='WEBP' && ['VP8 ','VP8L','VP8X'].includes(header.slice(12,16))) return 'webp';
 const xml=bytes.toString('utf8').replace(/^\uFEFF/, '').trim()
  .replace(/^<\?xml[\s\S]*?\?>\s*/, '')
  .replace(/^(?:<!--[\s\S]*?-->\s*)+/, '');
 // Require SVG as the document root, not an inline icon inside an HTML error page.
 if(/^<svg\b[^>]*(?:\/>|>[\s\S]*<\/svg>)\s*$/.test(xml)) return 'svg';
 return null;
}
function validAsset(path, bytes) {
 const type=imageType(bytes);
 if(/\.svg$/i.test(path)) return type==='svg';
 return /\.(?:png|jpe?g|webp|gif)$/i.test(path) && ['png','jpeg','webp','gif'].includes(type);
}
async function download(item) {
 const path=resolve(root,item.path);
 if(!path.startsWith(assetsRoot)) throw new Error('Unsafe asset path');
 const url=new URL(item.url);
 if(url.origin!=='https://www.figma.com'||!url.pathname.startsWith('/api/mcp/asset/')) throw new Error('Untrusted asset source');
 if(await exists(path) && validAsset(item.path,await readFile(path))) return;
 await mkdir(dirname(path),{recursive:true});
 const tmp=path+'.download';
 try {
  await new Promise((ok,fail)=>{const p=spawn('curl',['--fail','--location','--retry','2','--max-time','60','--silent','--show-error','--output',tmp,item.url],{stdio:['ignore','ignore','pipe']});let stderr='';p.stderr.on('data',d=>{stderr+=d.toString();});p.on('error',fail);p.on('exit',code=>code===0?ok():fail(new Error(`Asset download failed: ${item.path} (exit ${code}). Refresh expired Figma sources if needed. ${stderr.slice(-200)}`)));});
  if(!await exists(tmp)) throw new Error('Empty asset: '+item.path);
  const bytes=await readFile(tmp);
  if(!validAsset(item.path,bytes)) throw new Error(`Unexpected asset content: ${item.path} (detected ${imageType(bytes) || 'unknown/non-image'}, ${bytes.length} bytes)`);
  await rename(tmp,path);
 } finally {await rm(tmp,{force:true});}
}
// Bounded parallelism; never ship a successful build with missing assets.
for(let i=0;i<manifest.length;i+=6) await Promise.all(manifest.slice(i,i+6).map(download));
await rm(resolve(root,'dist'),{recursive:true,force:true});
await cp(resolve(root,'public'),resolve(root,'dist'),{recursive:true});
console.log(`Built dist with ${manifest.length} local Figma assets.`);
