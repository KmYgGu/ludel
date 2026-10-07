const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const b=new Game.CellarEncounter({floorY:660,width:1280});b.animations={counterkick:{},liedown:{},lieaim:{},lieshoot:{},aim:{},gunready:{},reload:{}};
function distribution(distance){const counts={};for(let i=0;i<100;i++){b.random=()=>(i+0.5)/100;const name=b.chooseAttack(distance);counts[name]=(counts[name]||0)+1;}return counts;}
assert.deepEqual(distribution(200),{counterkick:35,liedown:25,aim:15,gunready:25});assert.deepEqual(distribution(450),{counterkick:8,liedown:22,aim:45,gunready:25});assert.deepEqual(distribution(800),{liedown:5,aim:30,gunready:65});
b.random=()=>0;b.ammo=0;const f=new Game.Fighter(Game.Characters.rubania,{x:80,y:490});b.update(f);assert.equal(b.phase,'reload','empty distant boss reloads instead of countering empty space');
b.animations={aim:{}};assert.equal(b.chooseAttack(200),'aim');assert.equal(b.chooseAttack(800),'aim');
console.log('PASS: near/middle/far pattern weights, distant empty reload and available-animation fallback.');
