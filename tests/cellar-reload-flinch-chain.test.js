const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
for(const startingAmmo of [0,5,6]){
 const b=new Game.CellarEncounter({floorY:660,width:1280});
 const f=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});
 b.animations={reload:{},damage:{}};b.ammo=startingAmmo;b.startReload();b.phaseTick=35;
 b.slimes[0].takeDamage(1);assert.equal(b.ammo,startingAmmo,'taking damage does not itself add a round');
 for(let i=0;i<36;i++){
  b.slimes[0].takeDamage(1);b.update(f);
  assert.equal(b.reloadDamageTicks,35-i,'repeated hits must not refresh reload flinch');
 }
 assert.equal(b.phase,'idle');assert(b.reloadBlocked);assert(b.ammo<=6);
 assert.equal(b.slimes[0].hp,763,'all hits still deal damage');
 if(startingAmmo===5)assert.equal(b.ammo,6);
}
console.log('PASS: continuous hits cannot trap reload flinch, even at six rounds; damage and normal reload progress remain intact.');
