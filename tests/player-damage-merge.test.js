const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/hud.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const f=new Game.Fighter(Game.Characters.rubania,{x:720,y:490});f.hp=72;f.damageWhiteSegments=[{from:82,to:100,age:48}];f.damageFeedback=[{amount:10,beforeHp:82,afterHp:72,age:92,offsetX:0,offsetY:0}];Game.Hud.updateDamage(f,0,640);
assert.deepEqual(f.damageWhiteSegments,[{from:72,to:91,age:0}],'new damage merges with only the remaining white portion');
let color,white=[];const ctx=new Proxy({}, {get:(_,key)=>key==='fillRect'?(...a)=>{if(color==='#f8f4e9')white.push(a)}:()=>{},set:(_,key,value)=>{if(key==='fillStyle')color=value;return true}});Game.Hud.player(ctx,f);assert.equal(white.length,1);assert(Math.abs(white[0][2]-39.9)<0.001);
Game.Hud.updateDamage(f,48,640);white=[];Game.Hud.player(ctx,f);assert.equal(white.length,1);assert(Math.abs(white[0][2]-19.95)<0.001);
Game.Hud.updateDamage(f,30,640);assert.equal(f.damageWhiteSegments.length,0);
console.log('PASS: staggered damage merges into one shrinking interval without restoring already-drained white health.');
