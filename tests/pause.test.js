const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
const events={};global.addEventListener=(type,f)=>(events[type]||=[]).push(f);
global.matchMedia=()=>({matches:true});
const nodes=new Map();const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
global.document={hidden:false,addEventListener:global.addEventListener,getElementById(id){if(!nodes.has(id))nodes.set(id,{hidden:true,events:{},focus(){},getContext:()=>ctx,addEventListener(type,f){(this.events[type]||=[]).push(f)}});return nodes.get(id)}};
function emit(type,e={}){for(const f of events[type]||[])f(e)}
function click(id){for(const f of document.getElementById(id).events.click||[])f()}
for(const file of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/hud.js','js/pause.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'));
let actor,input,world,updates=0;
const bind=Game.Input.prototype.bind;Game.Input.prototype.bind=function(f){input=this;bind.call(this,f)};
const update=Game.Fighter.prototype.update;Game.Fighter.prototype.update=function(i,w){updates++;world=w;update.call(this,i,w)};
Game.Fighter.prototype.load=function(){actor=this;return Promise.resolve()};Game.loadImage=()=>Promise.resolve(null);
Game.menu={active:true,ready(){}};
let frame;global.requestAnimationFrame=f=>frame=f;
vm.runInThisContext(fs.readFileSync('js/game.js','utf8'));
setImmediate(()=>{
  emit('blur');assert(!Game.paused,'title is not paused');Game.menu.active=false;
  frame(1);frame(101);const count=updates,time=world.timer.remainingFrames;
  input.left=true;input.attack=true;emit('blur');assert(Game.paused);assert(!input.left&&!input.attack);assert(!document.getElementById('pause-screen').hidden);
  frame(120000);assert.equal(updates,count);assert.equal(world.timer.remainingFrames,time);
  document.hidden=true;emit('visibilitychange');click('resume-game');assert(Game.paused,'hidden page cannot resume');
  document.hidden=false;emit('visibilitychange');assert(Game.paused,'returning does not auto-resume');
  emit('keydown',{code:'Space',preventDefault(){}});assert(!input.attack,'paused keyboard blocked');
  click('resume-game');assert(!Game.paused);assert(document.getElementById('pause-screen').hidden);
  frame(120010);assert.equal(updates,count,'background elapsed time discarded');frame(120030);assert(updates<=count+2&&updates>count);
  emit('pagehide');assert(Game.paused);
  click('resume-game');emit('freeze');assert(Game.paused);click('resume-game');emit('resume');assert(Game.paused);
  click('resume-game');emit('pageshow',{persisted:true});assert(Game.paused);
  click('resume-game');emit('pointercancel');assert(Game.paused);
  click('resume-game');emit('touchcancel');assert(Game.paused);
  click('resume-game');emit('pointerdown',{pointerId:1,clientY:10});emit('pointermove',{pointerId:1,clientY:70});assert(Game.paused,'notification pull-down observed near top pauses');
  click('resume-game');frame(121000);const frozenTime=world.timer.remainingFrames;
  frame(123000);assert(Game.paused,'silent suspension detected before advancing game');assert.equal(world.timer.remainingFrames,frozenTime);
  click('resume-game');frame(123010);assert(!Game.paused,'resuming clears gap detector');
  console.log('PASS: actual game pauses on blur/hidden/pagehide, freezes timer, resets inputs and resumes without time jump.');
  console.log('PASS: freeze/resume, cached return, OS touch cancellation, notification gesture and silent suspension.');
});
