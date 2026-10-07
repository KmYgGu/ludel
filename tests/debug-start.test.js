const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/physics.js','js/input.js','js/character.js','js/characters/rubania.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const actor=new Game.Fighter(Game.Characters.rubania,{x:80,y:490});
for(const [edge,weapon] of [['knifePressed','knife'],['crossPressed','cross'],['axePressed','axe'],['holyPressed','holy'],['clockPressed','clock']]){
 actor.updateSubweapon({[edge]:true},{enemies:[],width:1280,floorY:660});assert.equal(actor.subweapon,weapon);
}
Game.debugTools=false;actor.subweapon='knife';actor.updateSubweapon({crossPressed:true},{enemies:[]});assert.equal(actor.subweapon,'knife');Game.debugTools=true;
const elements=new Map();function element(id){if(!elements.has(id))elements.set(id,{hidden:false,handlers:{},addEventListener(type,fn){this.handlers[type]=fn},querySelector(){return this},focus(){}});return elements.get(id)}
global.document={getElementById:element,querySelector:()=>element('controls'),querySelectorAll:()=>[]};global.localStorage={getItem:()=>null};
vm.runInThisContext(fs.readFileSync('js/title.js','utf8'));
let prevented=false;element('title-screen').handlers.wheel({deltaY:100,preventDefault(){prevented=true}});assert(prevented);assert.equal(Game.menu.startStage,'wineCellar');
element('title-screen').handlers.wheel({deltaY:-100,preventDefault(){}});assert.equal(Game.menu.startStage,'outerWall');
Game.menu.active=false;element('title-screen').handlers.wheel({deltaY:100,preventDefault(){}});assert.equal(Game.menu.startStage,'outerWall');
console.log('PASS: title wheel selection and all five debug weapon switches, with normal ownership restriction retained.');
