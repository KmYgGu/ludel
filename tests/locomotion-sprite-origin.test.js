const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/sprite-fit.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
Game.measureAnchor=()=>null;
const sheets={};for(const name of ['idle','walk','run','backstep'])sheets[name]=Game.spriteFit[name].map(()=>({sw:203,sh:203}));
Game.applySpriteFit(sheets,{});
for(const [name,frames] of Object.entries(sheets)){
 assert.equal(new Set(frames.map(f=>f.originX)).size,1,name+' shared horizontal origin');
 assert.equal(new Set(frames.map(f=>f.originY)).size,1,name+' shared ground');
 assert.equal(new Set(frames.map(f=>f.fit)).size,1,name+' shared size');
}
console.log('PASS: every locomotion sequence uses one common position and scale across all frames.');
