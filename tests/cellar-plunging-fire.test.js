const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(ammo=6){
 const b=new Game.CellarEncounter({width:1920,floorY:660}),f=new Game.Fighter(Game.Characters.rubania,{x:400,y:490});
 b.slimes[0].x=900;b.animations={jump:{},plungingfire:{}};b.random=()=>0;b.tick=59;b.cooldown=1000;b.ammo=ammo;b.update(f);return {b,f};
}
let {b,f}=setup();assert.equal(b.phase,'jump','new medium-distance opportunity');assert(b.jumpPlan.plunging);
for(let i=0;i<12;i++)b.update(f);assert.equal(b.ammo,6);const rememberedX=f.x+f.w/2;
f.x=1600;
while(b.phaseTick<59)b.update(f);assert.equal(b.ammo,6,'animation does not fire before apex');
b.update(f);assert.equal(b.ammo,5);assert.equal(b.bullets.length,1);const shot=b.bullets[0],vx=shot.vx,vy=shot.vy;
assert.equal(b.jumpPlan.remembered.x,rememberedX);assert(Math.abs(Math.hypot(vx,vy)-40)<1e-9);
f.x=1600;while(b.phaseTick<60)b.update(f);assert.equal(b.slimes[0].y+b.slimes[0].h,340,'six eight-tick shooting frames finish at apex');assert.equal(b.ammo,5);assert.equal(shot.vx,vx);assert.equal(shot.vy,vy);
({b,f}=setup(0));assert.equal(b.phase,'jump');assert(!b.jumpPlan.plunging);for(let i=0;i<12;i++)b.update(f);assert.equal(b.bullets.length,0);
console.log('PASS: medium-range leap, one shot at takeoff, remembered target, fixed trajectory and empty-cylinder movement.');
