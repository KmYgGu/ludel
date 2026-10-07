const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;global.Game={};
global.Image=class { complete=true; naturalWidth=1976; };
function element(){return {style:{},children:[],events:{},attrs:{},hidden:true,dataset:{},addEventListener(k,v){this.events[k]=v;},setAttribute(k,v){this.attrs[k]=v;},focus(){},appendChild(c){this.children.push(c);},replaceChildren(){this.children=[];},querySelectorAll(){return this.children;}};}
const els=new Map();function get(id){if(!els.has(id))els.set(id,element());return els.get(id);}
const draws=[];
get('shop-portrait').getContext=()=>({clearRect(){},drawImage(...args){draws.push(args);}});
const categories=['support','weapons','skills'].map(category=>Object.assign(element(),{dataset:{category}}));
global.document={getElementById:get,querySelector:get,querySelectorAll:()=>categories,createElement:element};
vm.runInThisContext(fs.readFileSync('js/shop.js','utf8'));
assert(!Game.shop.active);Game.shop.open(3200);assert(Game.shop.active);assert(!get('shop-screen').hidden);
const random = Math.random; Math.random = () => 0;
for(let i=0;i<8;i++){
  Game.shop.drawPortrait(i*125);
  assert.equal(draws.at(-2)[1],i*247);
  assert.deepEqual(draws.at(-2).slice(3),[247,247,16,1,247,247]);
  assert.equal(draws.at(-1)[1],18);
  assert.equal(draws.at(-1)[2],1+[0,5,8,10,10,10,9,6][i]);
}
Game.shop.drawPortrait(3000);assert(draws.at(-1)[0].src.includes('close'));
Game.shop.drawPortrait(3100);assert(draws.at(-1)[0].src.includes('close'));
Game.shop.drawPortrait(3200);assert(draws.at(-1)[0].src.includes('only'));
Math.random = random;
assert.equal(get('shop-items').children.length,8);assert(get('shop-score').textContent.includes('3,200'));
const greeting=get('shop-speech').textContent;get('shop-items').children[0].events.click();assert.notEqual(get('shop-speech').textContent,greeting);
assert.equal(get('shop-items').children[0].attrs['aria-pressed'],'true');
categories[1].events.click();assert.equal(get('shop-items').children.length,5);
get('shop-items').children[4].events.click();assert(get('shop-speech').textContent.includes('마력'));
categories[2].events.click();assert.equal(get('shop-items').children.length,3);
assert.deepEqual(Array.from({length:15},(_,i)=>Game.shop.farewellFrame(i*125)),[0,1,2,3,4,5,6,7,8,3,4,5,6,7,8]);
let transitioned=false;Game.shop.onNext=()=>{transitioned=true;};
get('shop-next').events.click();Game.shop.drawPortrait(4000);
assert(draws.at(-1)[0].src.includes('Farewell'));assert.equal(draws.at(-1)[1],0);
assert.deepEqual(draws.at(-1).slice(3),[263,248,0,0,263,248]);
Game.shop.drawPortrait(5125);assert.equal(draws.at(-1)[1],3*263);
Game.shop.drawPortrait(5875);assert(Number(get('shop-fade').style.opacity)>0);assert(!transitioned);
Game.shop.drawPortrait(6625);assert(transitioned);assert(!Game.shop.active);
Game.shop.open(3200,undefined,true);assert.notEqual(get('shop-speech').textContent,greeting);assert(get('shop-speech').textContent.includes('다시 왔네'));
console.log('PASS: shop opening, score display, categories, selection, dialogue and distinct death-return greeting.');
