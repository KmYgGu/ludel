const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/characters/rubania.js','js/shop-system.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
function hints(stage){
 const actor={hp:100,maxHp:100,def:JSON.parse(JSON.stringify(Game.Characters.rubania))};
 const session=new Game.ShopSession(actor,10000,stage),results=[];
 while(results.length<30){const text=session.buy('info');if(text.includes('모두'))break;results.push(text);}
 return results;
}
const random=Math.random;Math.random=()=>0;
try{
 const first=hints('outerWall'),second=hints('wineCellar');
 assert.equal(first.length,17);assert.equal(new Set(first).size,17);assert.equal(second.length,8);
 assert(first.some(text=>text.includes('최고점')));
 assert(!second.some(text=>text.includes('최고점')||text.includes('반격 자세')||text.includes('여섯 발')));
 assert(!first.some(text=>text.includes('라미아')||text.includes('베르제브트')||text.includes('루델리안')));
 assert(!second.some(text=>text.includes('데슈타프')||text.includes('총잡이')));
 assert(first[0].includes('코앞에서도 속사'),'pattern information is available on the first purchase');
}finally{Math.random=random;}
console.log('PASS: seven cellar pattern hints are exclusive to the first-clear shop and never repeat.');
