const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
const storage=new Map();global.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
const nodes=new Map();global.document={getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:true,textContent:'',addEventListener(){},replaceChildren(){},appendChild(){}});return nodes.get(id)},createElement(){return {}}};
for(const file of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js','js/arena.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'));
const arena=Game.arena;Game.menu={active:true};
arena.encounterStage('outerWall');assert(!arena.unlocked());arena.encounterStage('wineCellar');assert(arena.unlocked());
arena.seen.clear();arena.loadRecords();assert(arena.unlocked(),'encounters survive reopening');
Game.registerArenaBoss('same-stage-test',{...Game.ArenaBosses.get('slime')});arena.seen.add('same-stage-test');
assert(!arena.pairs().some(p=>p.includes('slime')&&p.includes('same-stage-test')));arena.seen.delete('same-stage-test');
const names=['aim','oneshoot','panning','gunready','fastshoot1','fastshoot2','holster','liedown','rise','lieaim','lieshoot','frontmove','backmove','reload','damage','counterkick','backhop','jump','plungingfire'];
arena.assets={animations:Object.fromEntries(names.map(n=>[n,{count:8}]))};
assert.equal(arena.start(['slime','slime']),false);
let seed=7;Math.random=()=>((seed=(1664525*seed+1013904223)>>>0)/4294967296);
for(const [roll,stage] of [[0,'outerWall'],[.99,'wineCellar']]){
  arena.random=()=>roll;assert(arena.start(['slime','cellar']));assert.equal(arena.stage.id,stage);
  assert.equal(arena.teams[0].encounter.totalHp(),500);assert.equal(arena.teams[1].encounter.totalHp(),800);
  const phases=new Set();let maxBodies=1;
  for(let i=0;i<60000&&!arena.result;i++){
    arena.step();phases.add(arena.teams[1].encounter.phase);maxBodies=Math.max(maxBodies,arena.teams[0].encounter.slimes.length);
    for(const team of arena.teams)for(const body of team.encounter.slimes)assert(Number.isFinite(body.x+body.y+body.hp));
  }
  assert(arena.result,'fight reaches a result on '+stage);assert(maxBodies>1,'slime splits');assert(phases.has('reload'),'ammo requires reloading');
  console.log(stage,arena.tick,arena.result,'patterns', [...phases].join(','));
}
arena.random=()=>0;arena.start(['slime','cellar']);
const slime=arena.teams[0].encounter,proxy=arena.targets[1];
const extra=slime.create(100,660,100,100,1);slime.slimes.push(extra);proxy.refresh();
assert.notEqual(proxy.body,extra);assert(Game.combatOverlap(proxy,extra));assert.equal(proxy.body,extra,'projectiles hit an untracked split body');
const hp=extra.hp;proxy.takeHit({damage:18,rapidFire:true});assert.equal(extra.hp,hp-9,'split defense retains campaign value');
const cellar=arena.teams[1].encounter;cellar.phase='counterkick';cellar.counterMode='guard';arena.targets[0].refresh();
arena.targets[0].takeHit({damage:28});assert.equal(cellar.slimes[0].hp,786);assert.equal(cellar.counterMode,'kick');
console.log('PASS: persistent unlock, distinct stages, random arenas, full fights, split targeting, defense, guard and base stats.');

// Several separate shots must each damage and recoil the slime, without player mercy.
arena.start(['slime','cellar']);
const multi=arena.teams[0].encounter,gunner=arena.teams[1].encounter,target=arena.targets[1];
multi.random=()=>0.4;
const a=multi.create(500,660,100,100,1),b=multi.create(580,660,100,100,1),outside=multi.create(1000,660,100,100,1);
multi.slimes=[a,b,outside];target.refresh();
const area={x:350,y:400,w:340,h:260};
assert(Game.combatOverlap(target,area));target.takeHit({...area,damage:18});
assert.equal(a.hp,91);assert.equal(b.hp,91);assert.equal(outside.hp,100);
assert(a.vx<0&&b.vx<0&&a.vy<0&&b.vy<0,'each hit recoils away from gunner');
a.vx=0;b.vx=0;
assert(Game.combatOverlap(target,area));target.takeHit({...area,damage:18});
assert.equal(a.hp,82);assert.equal(b.hp,82);assert(a.vx<0&&b.vx<0,'consecutive shots restore recoil');
const oldX=a.cx;multi.update(arena.targets[0]);assert(a.cx<oldX,'recoil actually moves body on update');
// A bullet continues through multiple bodies but damages each body only once.
a.cx=500;b.cx=580;multi.sync(a);multi.sync(b);gunner.phase='idle';gunner.cooldown=999;
gunner.bullets=[{x:350,y:620,w:10,h:8,vx:340,damage:18}];
const beforeA=a.hp,beforeB=b.hp;
gunner.update(target);assert.equal(a.hp,beforeA-9);assert.equal(b.hp,beforeB-9);assert.equal(gunner.bullets.length,1);
const bullet=gunner.bullets[0];bullet.x=350;gunner.update(target);
assert.equal(a.hp,beforeA-9);assert.equal(b.hp,beforeB-9,'same projectile cannot hit twice');
// Counter kick launches every body intersecting the kick, not merely the aim target.
Game.combatOverlap(target,area);assert(target.launchFromCounter({...area,damage:26},-1));
assert(a.arenaLaunch&&b.arenaLaunch);assert(!outside.arenaLaunch);
Game.combatOverlap(target,area);target.takeHit({...area,damage:18});assert(!a.arenaLaunch,'later hit must not be overwritten by old wall launch');
console.log('PASS: multiple targets, repeated hit recoil, projectile penetration, once-per-body damage and counter launch.');
