const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){const b=new Game.CellarEncounter({width:1920,floorY:660}),f=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});b.random=()=>0.5;f.grounded=true;b.animations={aim:{},gunready:{},counterkick:{},liedown:{},lieaim:{},lieshoot:{}};return {b,f};}
let {b,f}=setup();b.animations={aim:{}};b.cooldown=1;f.attackT=16;f.attackKind='stand';f.whipAttackBox=()=>({...b.slimes[0]});b.update(f);assert.equal(b.phase,'aim','repeated threat cannot freeze offensive decisions');
({b,f}=setup());f.attackT=20;b.observeTactics(f);const pressure=b.tactics.pressure;f.attackT=0;b.observeTactics(f);assert.equal(b.tactics.punish,18);assert(pressure>0);
b.tactics.punish=0;f.attackT=20;b.observeTactics(f);b.slimes[0].hp-=1;f.attackT=0;b.observeTactics(f);assert.equal(b.tactics.punish,0,'a connected attack is not mistaken for a whiff');
function distribution(b){const result={};for(let i=0;i<1000;i++){b.random=()=>(i+0.5)/1000;const name=b.chooseAttack(250);result[name]=(result[name]||0)+1;}return result;}
({b,f}=setup());const neutral=distribution(b);b.tactics.pressure=1;assert(distribution(b).counterkick>neutral.counterkick,'persistent aggression invites counters');
b.tactics.pressure=0;b.tactics.lastPattern='counterkick';b.tactics.repeats=2;assert(distribution(b).counterkick<neutral.counterkick,'recent repetition reduces preference');
({b,f}=setup());b.animations={reload:{},aim:{}};b.ammo=4;b.tactics.damageHeat=0.8;f.x=80;b.update(f);assert.notEqual(b.phase,'reload','recent damage prevents a careless optional reload');
({b,f}=setup());b.tactics.pressure=1;b.world.timeStopped=true;const memory=JSON.stringify(b.tactics);b.update(f);assert.equal(JSON.stringify(b.tactics),memory);
console.log('PASS: anti-stalling offense, observed whiff punishment, pressure counters, pattern variation, cautious reloading and frozen memory during time stop.');
