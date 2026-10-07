const fs = require('fs'), vm = require('vm'), assert = require('assert');
global.window = global;
for (const file of ['js/core.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js']) {
  vm.runInThisContext(fs.readFileSync(file,'utf8'));
}
function arena() {
  const e = new Game.SlimeEncounter({width:1280,height:720,floorY:660,ceilingY:20,enemies:[]});
  e.random=()=>0.5; return e;
}
Game.Bosses.slime.maxHp = 300;
const player = new Game.Fighter(Game.Characters.rubania,{x:600,y:490});
let e=arena(), s=e.slimes[0];
e.startPress(s,player);
const target=s.pressTarget, start=s.cx;
assert.equal(s.spriteH,340*0.62);
Game.damageEnemy(s,20,player);
assert.equal(s.hp,280); assert.equal(s.press,'windup'); assert.equal(s.vx,0);
player.x=100;
for(let i=0;i<47;i++) e.updatePress(s);
assert.equal(s.press,'windup'); assert.equal(s.cx,start);
e.updatePress(s); assert.equal(s.press,'flight');
assert.equal(s.pressTarget,target);
let landed=false;
for(let i=0;i<150;i++) {
  e.updatePress(s);
  assert(s.spriteY >= 20,'press arc stays below solid ceiling');
  if(s.press==='recover') {landed=true;break;}
}
assert(landed); assert.equal(s.cx,target);assert.equal(s.feet,660);
assert.equal(e.waves.length,2);assert(e.waves[0].vx<0 && e.waves[1].vx>0);
player.x=target-player.w/2; player.invuln=0; player.hp=100;
e.resolveContact(player); assert.equal(player.hp,72,'landing deals 28 once');
e.resolveContact(player);assert.equal(player.hp,72);
Game.damageEnemy(s,20,player);assert.equal(s.press,'recover');assert.equal(s.vx,0);
for(let i=0;i<59;i++)e.updatePress(s);
assert.equal(s.press,'recover');e.updatePress(s);assert.equal(s.press,null);
// Ground wave damage and airborne avoidance.
e.slimes=[];
e.waves=[{x:100,y:632,w:64,h:28,vx:6,life:90,damage:16,hit:false,invuln:true}];
player.x=100;player.y=400;player.invuln=0;player.hp=100;
e.resolveContact(player);assert.equal(player.hp,100);
player.y=490;e.resolveContact(player);assert.equal(player.hp,84);
player.invuln=0;e.resolveContact(player);assert.equal(player.hp,84,'one hit per wave');
// Only one large/medium attacker can wind up at a time; small fragments do not press.
e=arena();e.slimes=[e.create(350,660,150,150,1),e.create(900,660,150,150,1)];e.pressCooldown=0;
e.update(player);assert.equal(e.slimes.filter(s=>s.press).length,1);
e.pressCooldown=0;e.update(player);assert.equal(e.slimes.filter(s=>s.press).length,1);
e=arena();e.slimes=[e.create(640,660,75,75,2)];e.pressCooldown=0;e.update(player);
assert.equal(e.slimes[0].press,undefined);
// Split is deferred until the readable attack/recovery completes.
e=arena();s=e.slimes[0];e.startPress(s,player);Game.damageEnemy(s,100,player);
e.update(player);assert.equal(e.slimes.length,1);
s.press='recover';s.pressTimer=1;e.update(player);e.update(player);assert.equal(e.slimes.length,2);
// Killing an airborne attacker prevents its landing waves.
e=arena();s=e.slimes[0];e.startPress(s,player);s.press='flight';
Game.damageEnemy(s,1000,player);e.update(player);assert.equal(e.waves.length,0);assert.equal(e.totalHp(),0);
console.log('PASS: 0.8s telegraph, locked target, ceiling-safe jump, 28 landing damage, two waves, jump avoidance, 1s punish window, single attacker, deferred split and death cancellation.');
