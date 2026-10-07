const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const path of ['js/core.js','js/characters/rubania.js','js/shop-system.js'])vm.runInThisContext(fs.readFileSync(path,'utf8'));
const actor={hp:20,maxHp:100,mp:100,maxMp:100,def:JSON.parse(JSON.stringify(Game.Characters.rubania))};
const shop=new Game.ShopSession(actor,10000);
shop.buy('heal');assert.equal(actor.hp,50);shop.buy('heal');shop.buy('heal');assert.equal(actor.hp,100);
const points=shop.points;shop.buy('heal');assert.equal(shop.points,points);
shop.buy('maxMp');assert.equal(actor.maxMp,120);assert.equal(actor.mp,100);
const dmg=actor.def.stats.knifeDamage;shop.buy('subPower');assert(actor.def.stats.knifeDamage>dmg);
const infos=new Set();const random=Math.random;Math.random=()=>0;
try {
 for(let i=0;i<17;i++) {
  const pointsBefore=shop.points;infos.add(shop.buy('info'));
  assert.equal(shop.points,pointsBefore-150);
  assert.equal(Boolean(actor.knowsCellarBoss),i>=12);
 }
} finally {Math.random=random;}
assert.equal(infos.size,17);assert(actor.knowsCellarBoss);
const before=shop.points;assert(shop.buy('info').includes('모두'));assert.equal(shop.points,before);
shop.points=0;const damage=actor.def.stats.whipDamage;shop.buy('whipPower');assert.equal(actor.def.stats.whipDamage,damage);
console.log('PASS: 30% heal/cap, max MP, subweapon enhancement, no duplicate hints, exhausted pool and insufficient points.');
