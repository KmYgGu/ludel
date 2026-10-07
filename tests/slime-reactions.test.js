const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const p of ['js/core.js','js/bosses/slime.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const e=new Game.SlimeEncounter({width:1280,height:720,floorY:660,ceilingY:20});
e.random=()=>0.5;e.pressCooldown=Infinity;
e.image={width:768,height:438};e.reactionsImage={width:768,height:438};
const player={x:50,w:74};const s=e.slimes[0];
function drawing(){const calls=[];const ctx=new Proxy({}, {get:(o,k)=>(...a)=>calls.push([k,...a]),set:()=>true});e.draw(ctx);return calls;}
Game.damageEnemy(s,20,player);assert.equal(s.reaction,'hit');assert.equal(s.reactionDirection,1);assert.equal(s.reactionTimer,12);
let calls=drawing();let draw=calls.find(c=>c[0]==='drawImage');assert.strictEqual(draw[1],e.reactionsImage);assert.equal(draw[3],251);
Game.damageEnemy(s,20,{x:1200,w:74});assert.equal(s.reactionDirection,-1);
assert(drawing().some(c=>c[0]==='scale'&&c[1]===-1&&c[2]===1));
for(const direction of [-1,1]){
 s.cx=direction<0?s.spriteW/2:1280-s.spriteW/2;
 s.feet=660;s.vx=direction*5;s.vy=0;s.bouncing=true;
 e.update(player);assert.equal(s.reaction,'wall');assert.equal(s.reactionDirection,direction);assert.equal(s.reactionTimer,12);
 for(let frame=0;frame<4;frame++){
  s.reactionTimer=12-frame*3;
  draw=drawing().find(c=>c[0]==='drawImage');
  assert.strictEqual(draw[1],e.reactionsImage);assert.equal(draw[2],frame*192+32);assert.equal(draw[3],32);
  const rightFace=draw[6]+draw[8]*e.def.reactions.wallRightEdges[frame]/128;
  const visibleFace=direction<0?2*s.cx-rightFace:rightFace;
  assert(Math.abs(visibleFace-(s.cx+direction*s.spriteW/2))<1,'flat edge anchors to collided side');
 }
}
e.react(s,'hit',1);s.cx=640;s.vx=0;s.vy=0;s.feet=660;s.bouncing=false;
for(let i=0;i<12;i++)e.update(player);
assert.equal(s.reactionTimer,0);draw=drawing().find(c=>c[0]==='drawImage');assert.strictEqual(draw[1],e.image);
e.attachCeiling(s);Game.damageEnemy(s,1,player);assert.equal(s.reaction,'hit');assert.equal(s.ceilingState,'knocked');
s.press='windup';Game.damageEnemy(s,1,player);assert.equal(s.reaction,'hit');assert.equal(s.press,'windup');
assert(fs.existsSync(Game.Bosses.slime.reactions.sprite));
console.log('PASS: directional hit and wall triggers, four animation frames, 12-frame duration, idle return, ceiling/press compatibility and asset reference.');
