const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(x){
 const b=new Game.CellarEncounter({width:2560,floorY:660}),f=new Game.Fighter(Game.Characters.rubania,{x,y:490});
 b.animations={gunready:{}};b.phase='gunready';b.reticle={x:100,y:f.y+f.h/2};return {b,f};
}
let {b,f}=setup(2100);const speeds=[];
for(let i=0;i<10;i++){const x=b.reticle.x;b.update(f);speeds.push(b.reticle.x-x);}
assert(speeds.at(-1)>speeds[0]);assert(speeds.every(speed=>speed<=48));
b.world.timeStopped=true;const frozen=b.reticle.x;b.update(f);assert.equal(b.reticle.x,frozen);b.world.timeStopped=false;
let ticks=10;while(b.phase==='gunready'&&ticks<120){b.update(f);ticks++;}
assert.equal(b.phase,'fastlock');assert(ticks<70,'long-distance aim catches up promptly');
const near=setup(400),far=setup(2100);near.b.update(near.f);far.b.update(far.f);
assert(far.b.reticle.x-100>near.b.reticle.x-100,'distance adds catch-up speed');
({b,f}=setup(80));for(let i=0;i<15;i++)b.update(f);assert.equal(b.phase,'gunready');b.update(f);assert.equal(b.phase,'fastlock','minimum visible preparation remains');
console.log('PASS: accelerating reticle, distance catch-up, speed cap, minimum preparation and time stop.');
