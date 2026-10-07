const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const world={floorY:660,width:2560,solids:[{x:0,y:660,w:2560,h:60}]},b=new Game.CellarEncounter(world),f=new Game.Fighter(Game.Characters.rubania,{x:650,y:575});
b.random=()=>0.5;world.enemies=b.slimes;b.animations={backhop:{}};f.grounded=true;f.crouching=true;f.h=85;f.facing=1;f.startAttack();const input=new Game.Input();let sawHop=false;
for(let i=0;i<60;i++){f.update(input,world);b.update(f);if(b.phase==='backhop')sawHop=true;}
assert(sawHop,'a real close low-attack sequence triggers backhop');assert.equal(b.slimes[0].hp,800,'maximum reaction escapes this attack before impact');assert.equal(b.slimes[0].y+b.slimes[0].h,660);assert(b.slimes[0].x>1100);
console.log('PASS: real fighter low-attack timing triggers a delayed hop without guaranteed immunity.');

