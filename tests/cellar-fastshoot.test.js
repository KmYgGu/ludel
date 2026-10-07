const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){
 const world={width:1280,floorY:660,timeStopped:false,enemyDamageMultiplier:1};
 const boss=new Game.CellarEncounter(world);boss.animations={gunready:{}};boss.attackCount=2;boss.cooldown=1;
 const fighter=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});fighter.grounded=true;
 boss.update(fighter);assert.equal(boss.phase,'gunready');
 for(let i=0;i<100&&boss.phase==='gunready';i++)boss.update(fighter);
 assert.equal(boss.phase,'fastlock');assert(boss.exclamation>0);
 return {world,boss,fighter};
}
let {boss,fighter}=setup();const hp=fighter.hp,lockedX=boss.lockedTarget.x;
assert.equal(boss.lockedTarget.w,32);assert.equal(boss.lockedTarget.h,32);
for(let i=0;i<7;i++)boss.update(fighter);assert.equal(fighter.hp,hp);
boss.update(fighter);assert.equal(boss.phase,'fastshoot1');assert.equal(fighter.hp,hp-30);assert.equal(boss.fastImpact.x,lockedX);
for(let i=0;i<3;i++)boss.update(fighter);assert.equal(boss.phase,'fastshoot2');
for(let i=0;i<3;i++)boss.update(fighter);assert.equal(boss.phase,'holster');
for(let i=0;i<95;i++)boss.update(fighter);assert.equal(boss.phase,'holster');
boss.update(fighter);assert.equal(boss.phase,'idle');assert.equal(boss.lockedTarget,null);
fighter.x=1100;boss.update(fighter);assert.equal(boss.facing,1);
boss.phase='aim';fighter.x=200;boss.update(fighter);assert.equal(boss.facing,1,'turn only while resting');
for(const move of ['backstepT']){
 const test=setup();test.fighter[move]=10;
 for(let i=0;i<8;i++)test.boss.update(test.fighter);
 assert.equal(test.fighter.hp,hp-30,move+' alone grants no fast-shot immunity');
}
const sliding=setup();sliding.fighter.slideT=10;
for(let i=0;i<8;i++)sliding.boss.update(sliding.fighter);
assert.equal(sliding.fighter.hp,hp-30,'sliding in the captured area is vulnerable');
const actualSlide=setup();actualSlide.fighter.facing=-1;actualSlide.fighter.crouching=true;actualSlide.fighter.setHeight(85);
const slideInput={frame:0,jumpPressed:true,down:true,jump:false,axisX:()=>0,clearEdges(){}};
actualSlide.world.solids=[{x:0,y:660,w:1280,h:60}];actualSlide.world.enemies=[];
for(let i=0;i<8;i++){
 actualSlide.fighter.update(slideInput,actualSlide.world);slideInput.jumpPressed=false;actualSlide.boss.update(actualSlide.fighter);
}
assert.equal(actualSlide.fighter.hp,hp,'fast sliding escapes the captured area by movement');
const actualBackstep=setup();actualBackstep.fighter.facing=1;
actualBackstep.world.solids=[{x:0,y:660,w:1280,h:60}];actualBackstep.world.enemies=[];
const backstepInput={frame:0,backstepPressed:true,down:false,jump:false,axisX:()=>0,clearEdges(){}};
for(let i=0;i<8;i++){
 actualBackstep.fighter.update(backstepInput,actualBackstep.world);backstepInput.backstepPressed=false;actualBackstep.boss.update(actualBackstep.fighter);
}
assert.equal(actualBackstep.fighter.hp,hp,'actual backstep escapes by moving its hurtbox');
const air=setup();air.fighter.grounded=false;air.boss.lockedTarget.airborne=true;air.fighter.x=200;
for(let i=0;i<8;i++)air.boss.update(air.fighter);assert.equal(air.fighter.hp,hp,'airborne escape uses actual hitbox overlap');
const escaped=setup();escaped.fighter.x=200;
for(let i=0;i<8;i++)escaped.boss.update(escaped.fighter);assert.equal(escaped.fighter.hp,hp,'ground attack stays at the captured position');
const stopped=setup();stopped.world.timeStopped=true;const t=stopped.boss.phaseTick,warning=stopped.boss.exclamation;
for(let i=0;i<20;i++)stopped.boss.update(stopped.fighter);
assert.equal(stopped.boss.phaseTick,t);assert.equal(stopped.boss.exclamation,warning);assert.equal(stopped.fighter.hp,hp);
console.log('PASS: 32x32 locked shot, no action-based immunity, actual backstep/slide escape, airborne overlap, attack sequence and time stop.');
