const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(hp,roll){
 const b=new Game.CellarEncounter({floorY:660,width:2560}),f=new Game.Fighter(Game.Characters.rubania,{x:550,y:575});
 b.animations={backhop:{}};b.slimes[0].hp=hp;b.random=()=>roll;
 f.grounded=true;f.facing=1;f.attackKind='crouch';f.attackT=30;f.h=85;
 b.updateEvasion(f);return {b,f};
}
for(const hp of [800,400,80,1])assert.equal(setup(hp,0.5).b.evasionPending.delay,3);
for(const hp of [80,1]){
 const {b,f}=setup(hp,0);assert(b.evasionPending,'no chance-based miss at or below ten percent');
 for(let i=0;i<3;i++)b.updateEvasion(f);assert.equal(b.phase,'backhop');
}
assert.equal(setup(81,0).b.evasionPending,null,'above ten percent retains miss chance');
const {b,f}=setup(80,0);b.evasionPending=null;b.seenAttack=null;b.slimes[0].x=2400;f.x=2000;
b.updateEvasion(f);assert.equal(b.evasionPending,null,'wall still blocks a hop');
console.log('PASS: backhop uses fastest reaction at any health, no random misses below ten percent, and wall restrictions remain.');
