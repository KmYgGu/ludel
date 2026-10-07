const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function setup(){const b=new Game.CellarEncounter({floorY:660,width:2560}),f=new Game.Fighter(Game.Characters.rubania,{x:500,y:490});b.animations={liedown:{},backhop:{}};b.random=()=>0.5;f.grounded=true;f.attackKind='stand';f.attackT=32;f.facing=1;return {b,f};}
let {b,f}=setup();b.updateEvasion(f);assert.equal(b.evasionPending,null,'no response to the first invisible input frame');f.attackT=30;b.updateEvasion(f);assert(b.evasionPending);const selected=b.evasionPending.action;const delay=b.evasionPending.delay;for(let i=0;i<delay-1;i++)b.updateEvasion(f);assert.equal(b.phase,'idle');b.updateEvasion(f);assert.equal(b.phase,selected);assert(b.evasionRest>=48);
b.phase='idle';b.evasionRest=0;for(let i=0;i<30;i++)b.updateEvasion(f);assert.equal(b.phase,'idle','only one decision per attack');
({b,f}=setup());let rolls=0;b.random=()=>{rolls++;return 0.1};f.attackT=30;for(let i=0;i<20;i++)b.updateEvasion(f);assert.equal(b.phase,'idle');assert.equal(rolls,3,'missed reaction is not rerolled each frame');
({b,f}=setup());f.attackT=30;b.evasionRest=30;b.updateEvasion(f);assert.equal(b.evasionPending,null);b.evasionRest=0;b.updateEvasion(f);assert.equal(b.evasionPending,null,'cannot retroactively read an attack missed during recovery');
({b,f}=setup());f.attackT=30;f.whipAttackBox=()=>{throw Error('evasion must not inspect exact future hitboxes')};b.updateEvasion(f);assert(b.evasionPending);b.phase='reload';b.updateEvasion(f);assert.equal(b.evasionPending,null);
({b,f}=setup());f.attackT=30;f.x=1100;b.updateEvasion(f);assert.equal(b.evasionPending,null,'attacks behind the boss are not instantly dodged');
({b,f}=setup());f.attackT=30;b.updateEvasion(f);const wait=b.evasionPending.delay;b.world.timeStopped=true;b.update(f);assert.equal(b.evasionPending.delay,wait);
// Lower health improves reads without removing mistakes, delay or recovery.
function reaction(hp,missRoll,delayRoll){
 const pair=setup();pair.b.animations={liedown:{}};pair.b.slimes[0].hp=hp;pair.f.attackT=30;
 const rolls=[0.5,missRoll,delayRoll];pair.b.random=()=>rolls.length?rolls.shift():0.5;
 pair.b.updateEvasion(pair.f);return pair;
}
assert.equal(reaction(800,0.15,0.5).b.evasionPending,null);
assert(reaction(1,0.15,0.5).b.evasionPending,'low health notices attacks missed at full health');
assert.equal(reaction(1,0.01,0.5).b.evasionPending,null,'near death still misses some attacks');
const healthy=reaction(800,0.5,0.5).b,desperate=reaction(1,0.5,0.5).b;
assert(desperate.evasionPending.delay<healthy.evasionPending.delay);
const quick=reaction(1,0.5,0).b,slow=reaction(1,0.5,0.99).b;
assert(quick.evasionPending.delay>=3);assert(slow.evasionPending.delay>quick.evasionPending.delay);
for(let i=0;i<10;i++)desperate.updateEvasion(f);
assert(desperate.evasionRest>=36,'desperate evasion still leaves a recovery opening');
console.log('PASS: health-dependent human reactions retain visible windup, variation, misses, recovery, one decision per swing, rear blind spot and time stop.');
