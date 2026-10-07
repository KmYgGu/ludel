const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(x,playerX){
 const b=new Game.CellarEncounter({width:2560,floorY:660}),f=new Game.Fighter(Game.Characters.rubania,{x:playerX,y:490});
 b.animations={jump:{},aim:{}};b.random=()=>0;b.slimes[0].x=x;b.tick=59;b.cooldown=1000;return {b,f};
}
for(const [x,playerX,expected] of [[930,80,130],[930,1800,1730],[40,180,840],[2400,2280,1600]]){
 const {b,f}=setup(x,playerX);b.update(f);assert.equal(b.phase,'jump');
 assert.equal(Math.abs(b.jumpPlan.targetX-x),800);
 b.world.timeStopped=true;const tick=b.phaseTick;b.update(f);assert.equal(b.phaseTick,tick);b.world.timeStopped=false;
 for(let i=0;i<59;i++)b.update(f);assert.equal(b.slimes[0].y+b.slimes[0].h,340);
 for(let i=0;i<60;i++)b.update(f);assert.equal(b.phase,'idle');assert.equal(b.slimes[0].x,expected);assert.equal(b.slimes[0].y+b.slimes[0].h,660);assert.equal(b.jumpCooldown,180);
}
let {b,f}=setup(930,850);b.update(f);assert.notEqual(b.phase,'jump','normal nearby distance does not provoke a leap');
({b,f}=setup(930,80));b.random=()=>0.5;b.update(f);assert.notEqual(b.phase,'jump','leap is occasional');
({b,f}=setup(930,80));b.phase='aim';b.update(f);assert.equal(b.phase,'aim','leap cannot interrupt attacks');
({b,f}=setup(930,80));b.update(f);for(let i=0;i<59;i++)b.update(f);b.slimes[0].takeDamage(1);assert.equal(b.phase,'damage');assert.equal(b.jumpPlan,null);for(let i=0;i<50;i++)b.update(f);assert.equal(b.slimes[0].y+b.slimes[0].h,660);
console.log('PASS: fixed 800-pixel leaps, distant approach, inward wall escape, height, landing, cooldown, chance, commitment, time stop and damage interruption.');
