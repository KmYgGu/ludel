const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/hud.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
let hp=500;const encounter={totalHp:()=>hp};Game.Hud.updateBossDamage(encounter,0);hp=450;Game.Hud.updateBossDamage(encounter,0);assert.deepEqual(encounter.hpFeedback,{lastHp:450,from:450,to:500,age:0});
let style,white=[];const ctx=new Proxy({}, {get:(_,key)=>key==='fillRect'?(...args)=>{if(style==='#f8f4e9')white.push(args)}:()=>{},set:(_,key,value)=>{if(key==='fillStyle')style=value;return true}});
function draw(){white=[];Game.Hud.boss(ctx,'Boss',hp,500,1280,720,encounter.hpFeedback);return white;}
assert.equal(draw().length,1);assert.equal(white[0][2],56);Game.Hud.updateBossDamage(encounter,48);assert.equal(draw()[0][2],28);
hp=400;Game.Hud.updateBossDamage(encounter,0);assert.equal(encounter.hpFeedback.to,475);assert.equal(draw().length,1);assert.equal(white[0][2],84);Game.Hud.updateBossDamage(encounter,78);assert.equal(draw().length,0);
hp=0;Game.Hud.updateBossDamage(encounter,0);assert.equal(draw().length,1,'last hit still has white drain');Game.Hud.updateBossDamage(encounter,78);assert.equal(draw().length,0);
const fresh={totalHp:()=>500};Game.Hud.updateBossDamage(fresh,0);assert.equal(fresh.hpFeedback.to,500);assert.equal(fresh.hpFeedback.age,78);
console.log('PASS: boss proportional white drain, one merged interval, no restoration, fatal hit and per-encounter reset.');
