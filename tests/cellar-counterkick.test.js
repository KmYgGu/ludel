const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){const world={floorY:660,width:1280,ceilingY:20,solids:[{x:0,y:660,w:1280,h:60}]},b=new Game.CellarEncounter(world),f=new Game.Fighter(Game.Characters.rubania,{x:810,y:490});f.allowZeroHp=true;b.animations={counterkick:{},reload:{}};b.random=()=>0;return {b,f,world};}
let {b,f,world}=setup();b.ammo=0;b.update(f);assert.equal(b.phase,'counterkick');for(let i=0;i<6;i++)b.update(f);assert.equal(b.counterFrame(),1);
const hp=b.slimes[0].hp;Game.damageEnemy(b.slimes[0],20,f);assert.equal(b.slimes[0].hp,hp-10);assert.equal(b.counterMode,'kick');assert.equal(b.phaseTick,0);assert.equal(b.ammo,0);
const start=b.slimes[0].x;for(let i=0;i<28;i++)b.update(f);assert(b.slimes[0].x<start);assert(f.counterLaunch);assert.equal(f.hp,74);assert.equal(b.phase,'idle');
const input=new Game.Input();let reachedWall=false,landed=false;
for(let i=0;i<160;i++){f.update(input,world);if(f.counterLaunch&&f.counterLaunch.wallHit){reachedWall=true;assert.equal(f.x,0);assert(Game.screenShake);}if(!f.counterLaunch){landed=true;break;}}
assert(reachedWall);assert(landed);assert.equal(f.y+f.h,world.floorY);
({b,f,world}=setup());b.cooldown=1;b.update(f);for(let i=0;i<6+48;i++)b.update(f);assert.equal(b.counterMode,'cancel');assert.equal(b.counterFrame(),2);for(let i=0;i<6;i++)b.update(f);assert.equal(b.phase,'idle');assert.equal(b.ammo,6);assert.equal(f.hp,100);
({b,f}=setup());b.phase='counterkick';b.counterMode='guard';b.phaseTick=4;b.world.timeStopped=true;b.update(f);assert.equal(b.phaseTick,4);
({b,f}=setup());f.invuln=10;assert.equal(f.launchFromCounter({x:930,y:500,w:20,h:100,damage:26},-1),false);assert.equal(f.counterLaunch,null);
({b,f,world}=setup());f.x=1000;assert(f.launchFromCounter({x:950,y:500,w:20,h:100,damage:26},1));for(let i=0;i<160&&f.counterLaunch;i++)f.update(new Game.Input(),world);assert.equal(f.x,world.width-f.w);assert.equal(f.y+f.h,world.floorY);
for(const facing of [-1,1]){
 ({b,f}=setup());b.facing=facing;b.phase='counterkick';b.counterMode='guard';b.phaseTick=0;
 f.x=b.slimes[0].x+b.slimes[0].w/2-f.w/2;
 Game.damageEnemy(b.slimes[0],10,f);
 for(let i=0;i<13;i++)b.update(f);
 assert(f.counterLaunch,'counter catches a player pressed against the body after lunging');
 assert.equal(f.hp,74);assert(b.counterConnected);
}
({b,f}=setup());b.facing=1;b.phase='counterkick';b.counterMode='kick';b.phaseTick=11;
f.x=b.slimes[0].x-200;b.update(f);assert.equal(f.hp,100,'rear extension does not hit a distant player');
console.log('PASS: counter catches point-blank players in both directions, rear range is limited, guard, wall launch and timeout remain intact.');
