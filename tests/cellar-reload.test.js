const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(x=500){const b=new Game.CellarEncounter({width:1280,floorY:660});b.animations={reload:{},aim:{},lieaim:{},liedown:{},rise:{}};return {b,f:new Game.Fighter(Game.Characters.rubania,{x,y:490})};}
let {b,f}=setup();for(let i=0;i<7;i++)b.fireBullet();assert.equal(b.ammo,0);assert.equal(b.bullets.length,6);b.bullets=[];b.update(f);assert.equal(b.phase,'reload');
let sequence=[];for(let i=0;i<36;i++){sequence.push(b.reloadFrame());b.update(f);}assert.deepEqual([...new Set(sequence)],[0,1,2,3,4,5]);assert.equal(b.ammo,1);assert.equal(b.reloadFrame(),3);
for(let round=0;round<5;round++){sequence=[];for(let i=0;i<18;i++){sequence.push(b.reloadFrame());b.update(f);}assert.deepEqual([...new Set(sequence)],[3,4,5]);}
assert.equal(b.ammo,6);assert.equal(b.reloadFrame(),6);for(let i=0;i<6;i++)b.update(f);assert.equal(b.phase,'idle');
({b,f}=setup(80));b.ammo=4;b.update(f);assert.equal(b.phase,'reload','safe opportunity reloads partial cylinder');const tick=b.phaseTick;b.world.timeStopped=true;b.update(f);assert.equal(b.phaseTick,tick);assert.equal(b.ammo,4);
({b,f}=setup());b.ammo=4;b.update(f);assert.equal(b.phase,'idle','nearby opponent prevents optional reload');
({b,f}=setup());b.ammo=0;b.phase='aim';b.update(f);assert.equal(b.phase,'reload');assert.equal(b.bullets.length,0);
({b,f}=setup());b.ammo=0;b.phase='fastlock';b.update(f);assert.equal(b.phase,'reload');assert.equal(b.fastImpact,null);
({b,f}=setup());b.ammo=0;b.phase='lieaim';b.update(f);assert.equal(b.phase,'rise');assert.equal(b.bullets.length,0);
({b,f}=setup());b.ammo=1;b.phase='aim';b.phaseTick=19;b.burst=true;b.update(f);assert.equal(b.ammo,0);assert.equal(b.phase,'panning');for(let i=0;i<8;i++)b.update(f);assert.equal(b.phase,'idle','last-round burst ends without firing an empty cylinder');
console.log('PASS: six-round limit, initial/loop/final reload frames, safe reload, time stop and empty attack guards.');
