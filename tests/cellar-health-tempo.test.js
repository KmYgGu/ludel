const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const path of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(path,'utf8'));
const fighter={x:600,y:465,w:100,h:195,grounded:true,attackT:0,facing:1,def:{stats:{standH:195}}};
function waitingTicks(hp){
  const boss=new Game.CellarEncounter({floorY:660,width:2560});
  boss.slimes[0].hp=hp;boss.animations={aim:{}};boss.cooldown=110;
  let ticks=0;
  while(boss.phase==='idle'&&ticks<200){boss.update(fighter);ticks++;}
  assert.equal(boss.phase,'aim');assert.equal(boss.phaseTick,0);
  return {boss,ticks};
}
assert.equal(waitingTicks(800).ticks,110);
assert.equal(waitingTicks(400).ticks,74);
assert.equal(waitingTicks(1).ticks,56);
const {boss}=waitingTicks(800);
boss.slimes[0].hp=0;assert.equal(boss.attackTransitionSpeed(),2);
boss.slimes[0].hp=400;boss.phase='idle';boss.cooldown=110;
boss.world.timeStopped=true;boss.update(fighter);assert.equal(boss.cooldown,110);
boss.world.timeStopped=false;boss.update(fighter);assert.equal(boss.cooldown,108.5);
console.log('PASS: health scales attack pauses from original speed to at most twice as fast; time stop freezes the pause.');
