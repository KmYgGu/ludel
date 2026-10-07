const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const file of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js']) vm.runInThisContext(fs.readFileSync(file,'utf8'));
const s=Game.Characters.rubania.stats;
function run(facing,wall=false){
  const f=new Game.Fighter(Game.Characters.rubania,{x:wall?5:500,y:490});
  f.grounded=true;f.facing=facing;
  const input={frame:0,backstepPressed:true,axisX:()=>0,clearEdges(){},down:false,jump:false};
  const world={width:2000,height:720,solids:[{x:0,y:660,w:2000,h:60}],enemies:[]};
  const start=f.x,speeds=[];
  for(let i=0;i<s.backstepTime;i++){f.update(input,world);speeds.push(Math.abs(f.vx));}
  assert.equal(f.backstepT,0);
  if(!wall) assert(Math.abs(f.x-start+facing*s.backstepSpd*s.backstepTime)<1e-9);
  else assert(f.x>=0);
  for(let i=1;i<speeds.length;i++) assert(speeds[i]<=speeds[i-1]);
  assert(speeds[0]>s.backstepSpd*2.5);assert(speeds.at(-1)<0.02);
  f.update(input,world);assert.equal(f.vx,0);
}
run(1);run(-1);run(1,true);
console.log('PASS: fast start, progressive slowing, original distance/duration both ways, wall collision and no residual drift.');
