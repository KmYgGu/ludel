const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/hud.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
Game.Input.prototype.bind=function(){};
let fighter;Game.Fighter.prototype.load=function(){fighter=this;return Promise.resolve();};
Game.loadImage=()=>Promise.resolve(null);
const ctx=new Proxy({}, {get:()=>()=>{},set:()=>true});
const elements=new Map();global.document={getElementById(id){if(!elements.has(id))elements.set(id,{events:{},getContext:()=>ctx,addEventListener(k,v){this.events[k]=v;},focus(){}});return elements.get(id);}};
let frame;global.requestAnimationFrame=callback=>frame=callback;
vm.runInThisContext(fs.readFileSync('js/game.js','utf8'));
setImmediate(()=>{
 let t=1;frame(t);
 fighter.ownedSubweapons.add('axe');fighter.healPurchases=2;fighter.def.stats.whipDamage=35;
 for(let death=0;death<3;death++){
  fighter.hp=0;t+=34;frame(t);assert.equal(fighter.lives,2-death);assert(Game.deathState);
  assert.equal(document.getElementById('new-game').hidden,false,'title return available after every death');
  if(death<2){
   document.getElementById('retry-stage').events.click();assert(!Game.deathState);
   assert.equal(fighter.hp,fighter.maxHp);assert.equal(fighter.mp,fighter.maxMp);
   assert(fighter.ownedSubweapons.has('axe'));assert.equal(fighter.healPurchases,2);assert.equal(fighter.def.stats.whipDamage,35);
  }else{assert(!Game.deathState.canRetry);assert.equal(document.getElementById('retry-stage').hidden,true);}
 }
 let returned=false;global.location={reload(){returned=true}};
 document.getElementById('new-game').events.click();assert(returned,'title menu starts a fresh page');
 console.log('PASS: actual death/retry flow, one life per death, retained upgrades/ownership and final game over.');
});
