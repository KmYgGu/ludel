const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const s=Game.Characters.rubania.stats;
for(const facing of [-1,1]){
 const f=new Game.Fighter(Game.Characters.rubania,{x:500,y:575});f.grounded=true;f.crouching=true;f.h=85;f.facing=facing;
 const input={frame:0,jumpPressed:true,down:true,jump:false,axisX:()=>0,clearEdges(){}};
 const world={width:2000,height:720,solids:[{x:0,y:660,w:2000,h:60}],enemies:[]};
 const speeds=[];for(let i=0;i<s.slideTime;i++){
  f.update(input,world);input.jumpPressed=false;speeds.push(Math.abs(f.vx));
 }
 assert(Math.abs(f.x-500-facing*s.slideSpd*s.slideTime)<1e-8);
 assert(speeds[0]>s.slideSpd*2.5);assert(speeds.at(-1)<s.slideSpd*0.003);
 for(let i=1;i<speeds.length;i++)assert(speeds[i]<=speeds[i-1]);
 f.update(input,world);assert.equal(f.vx,0);assert(f.slideRecoverT>0);
}
console.log('PASS: sliding fast start, gradual slowing, distance both ways and stationary recovery.');
