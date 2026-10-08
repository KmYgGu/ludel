const fs=require('fs'),vm=require('vm'),assert=require('assert');
const elements=new Map();
function element(id){if(!elements.has(id))elements.set(id,{hidden:false,disabled:true,children:[],events:{},addEventListener(k,v){this.events[k]=v;},focus(){},querySelector(){return element(id+'-button');},replaceChildren(){this.children=[];},appendChild(c){this.children.push(c);}});return elements.get(id);}
const backs=[element('settings-back'),element('ranking-back')];
global.window=global;global.Game={Stages:{outerWall:{id:'outerWall',name:'Outer wall'},wineCellar:{id:'wineCellar',name:'Cellar'}}};
global.document={getElementById:element,querySelector:element,querySelectorAll:()=>backs,createElement:()=>({})};
const values=new Map();global.localStorage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};
vm.runInThisContext(fs.readFileSync('js/title.js','utf8'));
assert(Game.menu.active);Game.menu.ready();assert(!element('start-game').disabled);
element('open-settings').events.click();assert(element('main-menu').hidden);assert(!element('settings-menu').hidden);
backs[0].events.click();assert(!element('main-menu').hidden);
Game.menu.record(20,90);Game.menu.record(10,60);
element('open-ranking').events.click();assert(element('main-menu').hidden);assert.equal(element('rank-list').children.length,2);
assert(element('rank-list').children[0].textContent.startsWith('10.0'));
element('start-game').events.click();assert(!Game.menu.active);assert(element('title-screen').hidden);
console.log('PASS: title waits for start, settings/ranking navigation, saved sorted records and game launch.');
