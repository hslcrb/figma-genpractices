import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { clamp, wrapIndex, motionAllowed, coverage, createScope } from '../public/motion-core.mjs';
test('motion primitives clamp scroll progress and wrap carousel indices', () => {
 assert.equal(clamp(-1),0); assert.equal(clamp(2),1); assert.equal(clamp(.4),.4);assert.equal(clamp(NaN),0);
 assert.equal(wrapIndex(-1,4),3); assert.equal(wrapIndex(4,4),0); assert.equal(wrapIndex(2,0),0);
});
test('motion preference cannot override OS reduced motion', () => {
 assert.equal(motionAllowed(true,'on'),false); assert.equal(motionAllowed(false,'off'),false);
 assert.equal(motionAllowed(false,null),true); assert.equal(motionAllowed(false,'on'),true);
});
test('all five routes have a motion coverage specification', () => {
 for(const route of ['gallery','area','running','event','aetherfield']) assert.ok(coverage[route].length>=3,route);
});
test('entrypoint loads lifecycle-aware enhancement and stylesheet', async () => {
 const html=await readFile(new URL('../public/index.html',import.meta.url),'utf8');
 assert.match(html,/boot\.mjs/); assert.match(html,/motion\.css/);
});
test('scope disposal removes listeners and runs cleanup exactly once', () => {
 const scope=createScope();const target=new EventTarget();let events=0,cleanups=0;
 scope.on(target,'ping',()=>events++);scope.add(()=>cleanups++);target.dispatchEvent(new Event('ping'));
 scope.dispose();scope.dispose();target.dispatchEvent(new Event('ping'));
 assert.equal(events,1);assert.equal(cleanups,1);assert.equal(scope.disposed,true);assert.equal(scope.signal.aborted,true);
 scope.add(()=>cleanups++);assert.equal(cleanups,2);
});
