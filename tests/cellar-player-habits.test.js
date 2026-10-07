const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const b=new Game.CellarEncounter({floorY:660,width:1280}),f=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});b.animations={counterkick:{},liedown:{},lieaim:{},lieshoot:{},aim:{},gunready:{}};
function counts(distance){const result={};for(let i=0;i<1000;i++){b.random=()=>(i+0.5)/1000;const p=b.chooseAttack(distance);result[p]=(result[p]||0)+1;}return result;}
const ordinary=counts(450);f.grounded=false;for(let i=0;i<120;i++)b.observePlayer(f);assert.equal(b.airFrames,120);assert(counts(450).gunready>ordinary.gunready);assert(counts(200).gunready>0,'air habit can provoke fast shot even nearby');
f.grounded=true;f.crouching=true;f.h=85;for(let i=0;i<120;i++)b.observePlayer(f);assert.equal(b.airFrames,0);assert.equal(b.lowFrames,120);assert(counts(450).liedown>ordinary.liedown);
f.crouching=false;f.h=f.def.stats.standH;for(let i=0;i<120;i++)b.observePlayer(f);assert.equal(b.lowFrames,0);assert.deepEqual(counts(450),ordinary,'old habits fade within two seconds');
f.slideT=10;b.observePlayer(f);assert.equal(b.lowFrames,1);const index=b.postureIndex;b.world.timeStopped=true;b.update(f);assert.equal(b.postureIndex,index);
console.log('PASS: air/low habit preferences, near-air fast shot, two-second expiry, slide observation and time-stop freeze.');
