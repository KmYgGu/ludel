const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){const world={width:1920,floorY:660,objects:Game.Stages.wineCellar.objects.map(o=>({...o})),solids:[{x:0,y:660,w:1920,h:60}]};const b=new Game.CellarEncounter(world),f=new Game.Fighter(Game.Characters.rubania,{x:400,y:490});b.spillWine(420,210);return {b,f,world};}
let {b,f,world}=setup();for(let i=0;i<960;i++)b.update(f);assert.equal(world.wineLeaks.length,0);assert.equal(world.objects[0].leaking,false);assert.equal(Game.cellarWineSlow(world,f),1);
({b,f,world}=setup());for(let i=0;i<60;i++)b.update(f);
b.bullets.push({x:390,y:300,w:8,h:8,vx:40,vy:0,damage:18,plunging:true});b.update(f);
assert.equal(world.wineLeaks.length,0);assert.equal(world.wineFires.length,1);assert.equal(world.wineFires[0].warning,undefined);
const hp=f.hp;
b.update(f);assert.equal(f.hp,hp-12,'standing in active fire hurts');
f.invuln=0;f.y=450-f.h;b.update(f);assert.equal(f.hp,hp-12,'above flames is safe');
world.timeStopped=true;const life=world.wineFires[0].life;b.update(f);assert.equal(world.wineFires[0].life,life);world.timeStopped=false;
for(let i=0;i<150;i++)b.update(f);assert.equal(world.wineFires.length,0,'fire burns out');
({b,f,world}=setup());for(let i=0;i<60;i++)b.update(f);b.bullets.push({x:390,y:300,w:8,h:8,vx:40,damage:18});b.update(f);assert.equal(world.wineFires.length,0,'ordinary bullets cannot ignite wine');
console.log('PASS: wine expiry, jump-shot ignition only, harmless warning, fire damage, jump clearance, burnout and time stop.');
