const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){const b=new Game.CellarEncounter({floorY:660,width:2560}),f=new Game.Fighter(Game.Characters.rubania,{x:480,y:490});b.animations={backhop:{}};b.random=()=>0.5;f.grounded=true;f.attackKind='stand';f.attackT=30;f.facing=1;return {b,f};}
for(const kind of ['stand','air','crouch']){const {b,f}=setup();f.attackKind=kind;for(let i=0;i<8;i++)b.update(f);assert.equal(b.phase,'backhop');const target=b.hopPlan.targetX;let peak=660;for(let i=0;i<33;i++){b.update(f);peak=Math.min(peak,b.slimes[0].y+b.slimes[0].h);}assert.equal(b.phase,'idle');assert.equal(b.slimes[0].x,target);assert.equal(b.slimes[0].y+b.slimes[0].h,660);assert(peak<560);assert(b.hopCooldown>0);}
let {b,f}=setup();b.slimes[0].x=2350;assert.equal(b.planBackhop(f),null);b.slimes[0].x=100;f.x=300;assert.equal(b.planBackhop(f),null);
({b,f}=setup());f.facing=-1;for(let i=0;i<20;i++)b.update(f);assert.notEqual(b.phase,'backhop');
({b,f}=setup());b.phase='reload';b.update(f);assert.equal(b.phase,'reload');
({b,f}=setup());for(let i=0;i<8;i++)b.update(f);const tick=b.phaseTick,x=b.slimes[0].x;b.world.timeStopped=true;b.update(f);assert.equal(b.phaseTick,tick);assert.equal(b.slimes[0].x,x);Game.damageEnemy(b.slimes[0],10,f);assert.equal(b.slimes[0].hp,790);
console.log('PASS: delayed hops, trajectory and landing, both wall limits, attack direction, commitment, time stop and vulnerability.');
