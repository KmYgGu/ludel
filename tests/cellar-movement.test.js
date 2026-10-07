const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(x){
  const world={floorY:660,width:1280},boss=new Game.CellarEncounter(world);
  boss.animations={frontmove:{},backmove:{},liedown:{},aim:{}};
  const fighter=new Game.Fighter(Game.Characters.rubania,{x,y:490});
  return {boss,fighter,world,actor:boss.slimes[0]};
}
let s=setup(80);s.boss.update(s.fighter);
assert.equal(s.boss.phase,'frontmove');assert(s.actor.x<930);assert.equal(s.boss.facing,-1);
s=setup(750);s.boss.update(s.fighter);
assert.equal(s.boss.phase,'backmove');assert(s.actor.x>930);assert.equal(s.boss.facing,-1);
const frozen=s.actor.x;s.world.timeStopped=true;s.boss.update(s.fighter);assert.equal(s.actor.x,frozen);
s=setup(750);s.actor.x=1148;s.fighter.x=1000;s.boss.update(s.fighter);
assert.equal(s.actor.x,1148);assert.equal(s.boss.phase,'idle');
s=setup(80);for(let i=0;i<90;i++)s.boss.update(s.fighter);
assert.equal(s.boss.phase,'aim');const shootingX=s.actor.x;s.boss.update(s.fighter);assert.equal(s.actor.x,shootingX);
s=setup(80);s.boss.update(s.fighter);s.fighter.x=500;s.fighter.attackT=30;s.fighter.attackKind='stand';s.boss.random=()=>0.5;for(let i=0;i<8;i++)s.boss.update(s.fighter);
assert.equal(s.boss.phase,'liedown','a moving boss can duck a reachable attack');
console.log('PASS: approach, retreat, wall limits, time stop, shooting commitment and moving duck.');
