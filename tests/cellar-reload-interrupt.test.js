const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const boss=new Game.CellarEncounter({floorY:660,width:1280}),f=new Game.Fighter(Game.Characters.rubania,{x:80,y:490});f.grounded=true;boss.animations={reload:{},aim:{}};boss.ammo=0;boss.startReload();boss.phaseTick=30;Game.damageEnemy(boss.slimes[0],10,f);
for(let i=0;i<36;i++)boss.update(f);assert.equal(boss.phase,'idle');assert(boss.ammo>0);assert(boss.ammo<6);assert(boss.reloadBlocked);const loaded=boss.ammo;
for(let i=0;i<14;i++){boss.update(f);assert.notEqual(boss.phase,'reload');}boss.update(f);assert.equal(boss.phase,'aim');assert.equal(boss.ammo,loaded);
for(let i=0;i<20+32;i++)boss.update(f);assert.equal(boss.phase,'idle');assert.equal(boss.reloadBlocked,false,'another action unlocks reload');boss.update(f);assert.equal(boss.phase,'idle','upcoming burst keeps remaining rounds instead of topping up');boss.ammo=0;boss.update(f);assert.equal(boss.phase,'reload','empty cylinder can reload after another action');
console.log('PASS: hit reload ends after flinch, keeps loaded rounds, chooses attack before reloading again.');
