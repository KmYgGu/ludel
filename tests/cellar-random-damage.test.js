const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const b=new Game.CellarEncounter({floorY:660,width:2560}),f=new Game.Fighter(Game.Characters.rubania,{x:80,y:490});assert.equal(b.totalHp(),800);assert.equal(b.slimes[0].maxHp,800);b.image={};const damage={};b.animations={damage:{source:damage,cell:127,height:203,scale:1},reload:{}};
b.random=()=>0.09;Game.damageEnemy(b.slimes[0],10,f);assert.equal(b.damageTicks,18);let drawn;const ctx=new Proxy({}, {get:(_,key)=>key==='drawImage'?(source)=>drawn=source:()=>{},set:()=>true});b.draw(ctx);assert.equal(drawn,damage,'idle can display damage');b.world.timeStopped=true;b.update(f);assert.equal(b.damageTicks,18);b.world.timeStopped=false;for(let i=0;i<18;i++)b.update(f);assert.equal(b.damageTicks,0);
b.random=()=>0.1;Game.damageEnemy(b.slimes[0],10,f);assert.equal(b.damageTicks,0);b.startReload();Game.damageEnemy(b.slimes[0],10,f);assert.equal(b.reloadDamageTicks,36);assert(b.reloadInterrupted);assert.equal(b.damageTicks,0);
for(const mode of ['prepare','guard','kick','cancel']){
 b.phase='counterkick';b.counterMode=mode;b.damageTicks=0;b.random=()=>0;
 Game.damageEnemy(b.slimes[0],1,f);assert.equal(b.phase,'counterkick');assert.equal(b.damageTicks,0);
 drawn=null;b.draw(ctx);assert.notEqual(drawn,damage,'CounterKick must never display damage');
}
for(const phase of ['aim','oneshoot','panning','gunready','fastlock','fastshoot1','fastshoot2','holster','lieaim','lieshoot']){
 b.phase=phase;b.phaseTick=10;b.reticle={x:1,y:1};b.lockedTarget={};b.proneShots=3;
 const ammo=b.ammo;Game.damageEnemy(b.slimes[0],1,f);
 assert.equal(b.phase,'damage');assert.equal(b.phaseTick,0);assert.equal(b.reticle,null);assert.equal(b.lockedTarget,null);assert.equal(b.proneShots,0);
 for(let i=0;i<18;i++)b.update(f);
 assert.equal(b.phase,'idle');assert.equal(b.ammo,ammo,'cancelled attacks cannot fire');
}
console.log('PASS: CounterKick excludes flinch; damage cancels attacks; guaranteed reload flinch and time stop remain intact.');
