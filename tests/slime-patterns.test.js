const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
global.window = global;
for (const file of ['js/core.js', 'js/character.js', 'js/characters/rubania.js', 'js/bosses/slime.js']) {
  vm.runInThisContext(fs.readFileSync(file, 'utf8'));
}
const fighter = new Game.Fighter(Game.Characters.rubania, { x: 80, y: 240 });
// Keep historical damage fixtures at 300; the ceiling suite checks production HP 500.
Game.Bosses.slime.maxHp = 300;
function arena() {
  const encounter = new Game.SlimeEncounter({ width: 960, enemies: [] });
  encounter.random = () => 0.5;
  return encounter;
}
let fight = arena();
let slime = fight.slimes[0];
const initialX = slime.cx;
fight.update(fighter);
assert.equal(slime.cx, initialX - 0.45);
Game.damageEnemy(slime, 20, fighter);
assert.equal(slime.hp, 280);
assert(slime.vx > 0 && slime.vy < 0 && slime.scale < 1);
const fullHop = -slime.vy;
fight.world.ceilingY = -200;
slime.cx = 960 - slime.spriteW / 2;
fight.update(fighter);
assert(slime.vx < 0, 'right wall reflects backward hop forward');
assert(slime.vy < 0 && slime.feet < 480, 'wall collision also launches upward');
for (let i = 0; i < 180; i++) fight.update(fighter);
assert(!slime.bouncing && slime.feet === 480, 'hops settle on floor');
assert(slime.cx >= slime.spriteW / 2 && slime.cx <= 960 - slime.spriteW / 2);
assert(Math.abs(slime.vx) > 0.45, 'damaged slime chases faster');
fight.world.ceilingY = 20;
slime.takeDamage(80, fighter);
fight.update(fighter);
assert.equal(fight.slimes.length, 2);
assert.equal(fight.totalHp(), 200);
assert(fight.slimes.every(s => s.scale < slime.scale));
assert(fight.slimes.every(s => s.defense === 2));
fight.slimes.forEach(s => Game.damageEnemy(s, 100, fighter));
fight.update(fighter);
assert.equal(fight.slimes.length, 4);
assert.equal(fight.totalHp(), 100);
assert(fight.slimes.every(s => s.defense === 4));
const small = fight.slimes[0];
Game.damageEnemy(small, 1, fighter);
assert.equal(small.hp, 24.75, 'tiny hits retain fractional damage under defense');
assert(-small.vy > fullHop, 'small fragments can hop higher');
small.cx = small.spriteW / 2;
small.vx = -4;
fight.update(fighter);
assert(small.vx > 0, 'left wall reflects');
assert(small.vy < 0, 'left wall launches upward');
for (let i = 0; i < 120; i++) fight.update(fighter);
assert(fight.slimes.length <= 4);
fight.slimes.forEach(s => Game.damageEnemy(s, 1000, fighter));
fight.update(fighter);
assert.equal(fight.totalHp(), 0);
assert.equal(fight.slimes.length, 0);
assert.equal(fight.world.enemies.length, 0);
fight = arena();
Game.damageEnemy(fight.slimes[0], 220, fighter);
fight.update(fighter);
assert.equal(fight.slimes.length, 4, 'large hit crosses both split thresholds');
assert.equal(fight.totalHp(), 80);
for (const generation of [0, 1, 2]) {
  const encounter = arena();
  const target = encounter.create(600, 480, 300 / 2 ** generation, 300 / 2 ** generation, generation);
  encounter.slimes = [target];
  encounter.update(fighter);
  const speed = Math.abs(target.vx);
  if (generation === 0) assert.equal(speed, 0.45);
  if (generation === 1) assert(speed >= 3.2);
  if (generation === 2) assert(speed >= 6);
  const hp = target.hp;
  Game.damageEnemy(target, 20, fighter);
  assert.equal(hp - target.hp, 20 / 2 ** generation);
  target.cx = 960 - target.spriteW / 2;
  target.feet = 480; target.vx = 4; target.vy = 0; target.bouncing = false;
  // Move the player beyond the right edge to force a chase into the wall.
  encounter.update({x: 1000, w: 74});
  assert(target.bouncing && target.vx < 0 && target.vy < 0, 'chase wall collision launches a hop');
}
for (const generation of [0, 1, 2]) {
for (const weapon of ['whip', 'slide', 'knife', 'cross', 'axe', 'holy', 'kick']) {
  fight = arena();
  slime = fight.create(729.5, 480, 300 / 2 ** generation, 300 / 2 ** generation, generation);
  fight.slimes = [slime];
  const hpBefore = slime.hp;
  const f = new Game.Fighter(Game.Characters.rubania, {x: 80, y: 240});
  const box = {x: slime.x, y: slime.y, w: slime.w, h: slime.h};
  if (weapon === 'whip') f.attackHit = box;
  if (weapon === 'slide') f.slideHit = box;
  if (weapon === 'knife') f.knives = [box];
  if (weapon === 'cross') f.crosses = [box];
  if (weapon === 'axe') f.axes = [{...box, vy: -1}];
  if (weapon === 'holy') {
    f.holies = [{...box, phase: 'flame', tick: 0, t: 120}];
    f.updateHolies(fight.world = {width:960,enemies:[slime]});
  } else if (weapon === 'kick') {
    f.kicking = true; f.kickHit = box; fight.resolveContact(f);
    assert.equal(f.kicking, false);
    assert.equal(f.kickInvuln, 24);
  } else f.applyWeaponDamage({enemies:[slime]});
  const baseDamage = {whip:20,slide:3,knife:8,cross:6,axe:28,holy:4,kick:5};
  assert.equal(hpBefore - slime.hp, baseDamage[weapon] / 2 ** generation, weapon + ' respects split defense');
  assert(slime.bouncing, weapon + ' damage triggers rebound');
}
}
new vm.Script(fs.readFileSync('js/game.js', 'utf8'));
console.log('PASS: chase, size/speed, size-based hops, both wall reflections, landing, 1→2→4 splits, HP conservation, defeat, all seven damage sources.');
const bounceForces = [];
for (const generation of [0, 2]) {
  const encounter = arena();
  const target = encounter.create(600, 480, 300 / 2 ** generation, 300 / 2 ** generation, generation);
  encounter.slimes = [target];
  Game.damageEnemy(target, 1, fighter);
  const hitX = Math.abs(target.vx), hitY = Math.abs(target.vy);
  target.cx = 960 - target.spriteW / 2; target.feet = 480; target.vx = 5; target.vy = 0;
  encounter.update(fighter);
  bounceForces.push({hitX, hitY, wallY: Math.abs(target.vy)});
  target.feet = target.spriteH + 21; target.vy = -10; target.vx = 0; target.bouncing = true;
  encounter.update(fighter);
  assert.equal(target.spriteY, 20);
  assert(target.vy === 0 && target.ceilingState === 'crawl', 'ceiling catches slime');
}
assert(bounceForces[0].hitX > bounceForces[1].hitX);
assert(bounceForces[0].hitY < bounceForces[1].hitY);
assert(bounceForces[0].wallY < bounceForces[1].wallY);
for (const generation of [0, 1, 2]) {
  const encounter = new Game.SlimeEncounter({width:1280,height:720,floorY:660,ceilingY:20});
  const target=encounter.create(640,660,300 / 2 ** generation,300 / 2 ** generation,generation);
  encounter.slimes=[target];
  let highHops=0;
  const clearance=target.feet-target.spriteH-20;
  for(let i=0;i<100;i++) {
    encounter.random=()=>i/100;
    if(encounter.hopHeight(target,30*target.scale)>clearance) highHops++;
  }
  assert.equal(highHops,[0,25,65][generation]);
  if(generation===0) {
    encounter.random=()=>0.5;
    encounter.recoil(target,fighter);
    assert.equal(target.vy,-Math.sqrt(2*0.38*90*target.scale*1.325));
  } else {
    encounter.random=()=>0;
    encounter.recoil(target,fighter);target.vx=0;target.bouncesLeft=0;
    let touched=false;
    for(let i=0;i<120;i++) {
      encounter.update(fighter);
      if(target.spriteY===20 && target.ceilingState==='crawl') {touched=true;break;}
    }
    assert(touched,'boosted fragment hop physically reaches ceiling');
  }
}
const contactFight=arena();
const contactSlime=contactFight.slimes[0];
const player=new Game.Fighter(Game.Characters.rubania,{x:contactSlime.cx-37,y:310});
const slimeHp=contactSlime.hp;
let samples=0;contactFight.random=()=>{samples++;return 0.5;};
contactFight.resolveContact(player);
assert.equal(player.hp,82);
assert(contactSlime.bouncing && contactSlime.vy<0 && contactSlime.vx>0);
assert.equal(contactSlime.hp,slimeHp,'successful contact recoil does not hurt slime');
const count=samples;
contactFight.resolveContact(player);
assert.equal(samples,count,'invulnerable contact does not retrigger recoil');
player.invuln=0;player.kickInvuln=24;contactFight.resolveContact(player);
assert.equal(samples,count,'kick protection does not count as attack success');
console.log('PASS: unchanged base recoil, 25%/65% ceiling hops, ceiling reach, successful contact recoil and protected contacts.');
// Exercise the actual game startup, fixed updates and drawing with a canvas stub.
vm.runInThisContext(fs.readFileSync('js/input.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/physics.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/stages/outer-wall.js', 'utf8'));
const playerBody = {x:300,y:21,w:74,h:170,vx:0,vy:-11};
Game.moveAndCollide(playerBody,[{x:0,y:0,w:960,h:20,oneWay:false}],{width:960});
assert.equal(playerBody.y,20);
assert.equal(playerBody.vy,0);
const gameSource = fs.readFileSync('js/game.js','utf8');
assert(gameSource.includes('Game.createOuterWallPlatform()'));
assert.deepEqual([Game.createOuterWallPlatform().x,Game.createOuterWallPlatform().y,Game.createOuterWallPlatform().w],[550,550,180]);
assert(gameSource.includes('width: 1280') && gameSource.includes('height: 720'));
assert(fs.readFileSync('index.html','utf8').includes('width="1280" height="720"'));
// A medium sibling stays medium and keeps its speed when the other one splits.
const mixed = arena();
Game.damageEnemy(mixed.slimes[0], 100, fighter);
mixed.update(fighter);
const medium = mixed.slimes[1];
medium.bouncing = false; medium.vy = 0; medium.feet = 480;
mixed.update(fighter);
const mediumSpeed = Math.abs(medium.vx);
Game.damageEnemy(mixed.slimes[0], 100, fighter);
mixed.update(fighter);
assert.equal(mixed.slimes.length, 3);
assert.equal(medium.generation, 1);
assert.equal(Math.abs(medium.vx), mediumSpeed);
const fragments = mixed.slimes.filter(s => s.generation === 2);
assert.equal(fragments.length, 2);
fragments.forEach(s => {s.bouncing=false;s.vy=0;s.feet=480;});
mixed.update(fighter);
assert(fragments.every(s => Math.abs(s.vx) > mediumSpeed + 2));
// Independently sampled random factors produce wide/low and short/high hops.
function recoil(samples) {
  const encounter = arena(); encounter.random = () => samples.shift();
  const target = encounter.slimes[0];
  Game.damageEnemy(target, 1, fighter);
  return {x: Math.abs(target.vx), y: Math.abs(target.vy)};
}
const wide = recoil([1,0]), high = recoil([0,1]);
assert(wide.x > high.x * 2 && high.y > wide.y * 1.5);
// Simulate a full-height jump from the floor onto the lowered platform.
const jumper = new Game.Fighter(Game.Characters.rubania,{x:590,y:490});
jumper.grounded=true; jumper.startJump();
const solids=[{x:0,y:660,w:1280,h:60,oneWay:false},{x:550,y:550,w:180,h:20,oneWay:true}];
let landed = false;
for(let i=0;i<100;i++) {
  Game.applyGravity(jumper,jumper.def.stats.gravity,jumper.def.stats.maxFall);
  Game.moveAndCollide(jumper,solids,{width:1280});
  if(jumper.grounded) {landed=jumper.y+jumper.h===550;break;}
}
assert(landed,'normal jump lands on centered platform');
const largeArena = new Game.SlimeEncounter({width:1280,height:720,floorY:660,enemies:[]});
assert.equal(largeArena.slimes[0].feet,660);
largeArena.update(fighter);
assert.equal(largeArena.slimes[0].feet,660);
for(const facing of [-1,1]) {
  const air = new Game.Fighter(Game.Characters.rubania,{x:500,y:100});
  air.facing=facing; air.grounded=false; air.vx=facing*3.2;
  air.startAttack();
  const input=new Game.Input();
  const world={width:1280,height:720,solids:[],enemies:[]};
  for(const direction of [-facing,0,facing]) {
    input.left=direction<0;input.right=direction>0;
    const before=air.x;
    air.update(input,world);
    assert(Math.abs(air.x-before-direction*3.2)<1e-9);
    assert.equal(air.facing,facing,'air movement preserves attack direction');
    assert(air.attackT>0);
  }
  air.attackT=17;
  input.left=facing>0;input.right=facing<0;
  air.update(input,world);
  const hit=air.attackHit,cx=air.x+air.w/2;
  assert(hit && (facing>0?hit.x>cx:hit.x+hit.w<cx),'whip hitbox retains locked direction');
}
console.log('PASS: 1280x720 arena/floor, reachable platform, air attack reversal/stop and locked whip direction.');
console.log('PASS: mixed medium/small speed isolation, independent random recoil, normal jump reaches platform.');
console.log('PASS: size-dependent bounce, slime/player ceiling collision, one centered platform.');
Game.Input.prototype.bind = function () {};
Game.Fighter.prototype.load = function () { return Promise.resolve(); };
Game.loadImage = function () { return Promise.resolve({width:768,height:438}); };
let nextFrame;
const draws = [];
const ctx = new Proxy({}, {get: (obj, key) => key === 'drawImage' ? (...args) => draws.push(args) : () => {}, set: () => true});
const mouseEvents = {};
global.document = {getElementById: () => ({getContext: () => ctx, addEventListener(name, callback) { mouseEvents[name] = callback; }})};
global.requestAnimationFrame = callback => { nextFrame = callback; };
vm.runInThisContext(fs.readFileSync('js/hud.js', 'utf8'));
vm.runInThisContext(fs.readFileSync('js/game.js', 'utf8'));
setImmediate(() => {
  assert(nextFrame, 'game starts after loading');
  Game.debug = true;
  for (let i = 1; i < 401; i++) nextFrame(i * 1000 / 60);
  assert(draws.length > 100, 'animated enemy renders throughout simulation');
  draws.forEach(args => {
    assert(args.slice(1).every(Number.isFinite));
    assert(args[1] >= 0 && args[2] >= 0 && args[1] + args[3] <= args[0].width && args[2] + args[4] <= args[0].height);
  });
  console.log('PASS: actual game startup, 400 frames including bodypress scheduling/drawing, padded sprite sampling and debug drawing.');
  let prevented = false;
  mouseEvents.mousedown({button: 1, preventDefault() { prevented = true; }});
  nextFrame(402 * 1000 / 60);
  assert(prevented && Game.clearSequence, 'middle click enters normal stage clear scoring');
  console.log('PASS: middle-click debug clear triggers score settlement.');
});
