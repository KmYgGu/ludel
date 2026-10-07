const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const p of ['js/core.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function arena(){const e=new Game.SlimeEncounter({width:1280,height:720,floorY:660,ceilingY:20,enemies:[]});e.random=()=>0.5;e.pressCooldown=Infinity;return e;}
const player=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});
let e=arena(),s=e.slimes[0];
assert.equal(s.hp,500);assert.equal(s.maxHp,500);assert.equal(s.scale,1);
// Physics reaches the ceiling and starts crawling without vertical movement.
s.feet=s.spriteH+21;s.vy=-8;s.vx=0;s.bouncing=true;
e.update(player);assert.equal(s.ceilingState,'crawl');assert.equal(s.spriteY,20);assert.equal(s.vy,0);
const x=s.cx;e.update(player);assert(s.cx<x);assert.equal(s.spriteY,20);
player.x=1100;const before=s.cx;e.update(player);assert(s.cx>before,'crawler follows new player position');
// Alignment locks the drop location after a brief warning.
player.x=s.cx-player.w/2;e.update(player);assert.equal(s.ceilingState,'ready');
const dropX=s.cx;player.x=50;
for(let i=0;i<17;i++)e.update(player);assert.equal(s.ceilingState,'ready');
e.update(player);assert.equal(s.ceilingState,'fall');
for(let i=0;i<140&&s.ceilingState==='fall';i++)e.update(player);
assert.equal(s.cx,dropX);assert.equal(s.feet,660);assert.equal(s.ceilingState,'recover');
for(let i=0;i<30;i++)e.update(player);assert.equal(s.ceilingState,null);
// Each player attack interrupts attached slime tracking and forces downward fall.
for(const state of ['crawl','ready'])for(const weapon of ['whip','slide','knife','cross','axe','holy','kick']){
 e=arena();s=e.slimes[0];e.attachCeiling(s);s.ceilingState=state;
 const f=new Game.Fighter(Game.Characters.rubania,{x:0,y:490});
 const box={x:s.x,y:s.y,w:s.w,h:s.h};
 if(weapon==='whip')f.attackHit=box;
 if(weapon==='slide')f.slideHit=box;
 if(weapon==='knife')f.knives=[box];
 if(weapon==='cross')f.crosses=[box];
 if(weapon==='axe')f.axes=[{...box,vy:-1}];
 if(weapon==='holy'){f.holies=[{...box,phase:'flame',tick:0,t:120}];f.updateHolies({enemies:[s],height:720});}
 else if(weapon==='kick'){f.kickHit=box;f.kicking=true;e.resolveContact(f);}
 else f.applyWeaponDamage({enemies:[s]});
 assert(s.hp<500);assert.equal(s.ceilingState,'knocked');assert.equal(s.vx,0);assert(s.vy>0);
 const hitX=s.cx;e.update(f);assert.equal(s.cx,hitX,'knocked slime does not chase');
}
// Falling attack damage, successful contact recoil, and attack interruption damage.
e=arena();s=e.slimes[0];s.ceilingState='fall';s.feet=660;s.vy=8;e.sync(s);
const f=new Game.Fighter(Game.Characters.rubania,{x:s.cx-37,y:490});
e.resolveContact(f);assert.equal(f.hp,76);assert.equal(s.ceilingState,null);assert(s.bouncing);
f.invuln=36;s.ceilingState='fall';e.resolveContact(f);assert.equal(f.hp,76);assert.equal(s.ceilingState,'fall');
// Threshold damage while attached defers splitting until the interrupted landing.
e=arena();s=e.slimes[0];e.attachCeiling(s);Game.damageEnemy(s,200,player);
e.update(player);assert.equal(e.slimes.length,1);assert.equal(e.totalHp(),300);
for(let i=0;i<200&&e.slimes.length===1;i++)e.update(player);
assert.equal(e.slimes.length,2);assert.equal(e.totalHp(),300);
assert(e.slimes.every(s=>s.maxHp===250&&s.defense===2));
// Killing an attached slime removes it immediately on the next update.
e=arena();s=e.slimes[0];e.attachCeiling(s);Game.damageEnemy(s,1000,player);e.update(player);
assert.equal(e.totalHp(),0);assert.equal(e.slimes.length,0);
// Visual hanging flip stays anchored to the ceiling.
e=arena();s=e.slimes[0];e.attachCeiling(s);e.image={width:768,height:438};
const calls=[];const ctx=new Proxy({}, {get:(obj,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
e.draw(ctx);assert(calls.some(c=>c[0]==='scale'&&c[1]===1&&c[2]===-1));
console.log('PASS: production HP500, ceiling attachment/crawl, locked drop after warning, all seven attack interruptions, falling damage/protection, split preservation, defeat and hanging render.');
