const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
for(const ammo of [1,2,3]){
 const b=new Game.CellarEncounter({width:2560,floorY:660});
 const f=new Game.Fighter(Game.Characters.rubania,{x:80,y:575});f.h=85;
 b.animations={reload:{},aim:{},oneshoot:{},panning:{}};b.ammo=ammo;b.attackCount=1;b.cooldown=0;
 b.update(f);assert.equal(b.phase,'aim','burst takes priority over optional top-up');
 for(let i=0;i<20;i++)b.update(f);
 if(ammo===1)assert.equal(b.phase,'panning','even the last round uses the burst animation');
 assert(b.bullets.every(shot=>shot.rapidFire&&shot.invuln===false));
 for(let i=0;i<60&&b.phase!=='idle';i++)b.update(f);
 assert.equal(b.ammo,0);assert.equal(b.phase,'idle');
}
const f=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});f.hp=1000;f.allowZeroHp=true;
const shot={x:800,y:527,w:16,h:6,damage:18,rapidFire:true,invuln:false};
f.invuln=30;
for(const side of ['F','B','F','B']){
 assert(f.takeHit(shot));assert.equal(f.hitKey.slice(-1),side);assert.equal(f.invuln,0);
}
assert.equal(f.hp,928);f.kickInvuln=10;assert.equal(f.takeHit(shot),false);
f.kickInvuln=0;assert(f.takeHit({...shot,rapidFire:false,invuln:undefined}));
assert(f.invuln>0);assert.equal(f.takeHit({...shot,rapidFire:false}),false);
console.log('PASS: low-ammo bursts, last-round panning, consecutive damage, alternating hit poses, kick protection and ordinary mercy frames.');
