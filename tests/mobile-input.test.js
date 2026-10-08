const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
const nodes=new Map();function node(id){if(!nodes.has(id)){const classes=new Set();nodes.set(id,{events:{},style:{},classList:{add:c=>classes.add(c),remove:c=>classes.delete(c),toggle(c,on){on?classes.add(c):classes.delete(c)},contains:c=>classes.has(c)},addEventListener(k,f){(this.events[k]||=[]).push(f)},setPointerCapture(){},getBoundingClientRect:()=>({left:0,top:0,width:200,height:200})});}return nodes.get(id);}
global.document={getElementById:node,querySelector:()=>node('screen'),addEventListener(){}};
global.addEventListener=()=>{};const media={matches:true};global.matchMedia=()=>media;
const storage=new Map();global.localStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
let refresh;global.requestAnimationFrame=f=>refresh=f;
for(const file of ['js/input.js','js/mobile.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'));
const input=new Game.Input(),fighter={def:{stats:{tapWindow:15}},canStartRun:()=>false};
Game.menu={active:false};Game.bindMobileInput(input,fighter);
function send(id,type,pointerId,x=100,y=100){for(const f of node(id).events[type]||[])f({pointerId,clientX:x,clientY:y,preventDefault(){}});}
send('mobile-stick','pointerdown',1,170,100);assert(input.right);
send('mobile-jump','pointerdown',2);assert(input.jump&&input.jumpPressed&&input.right,'simultaneous movement and jump');
send('mobile-attack','pointerdown',3);assert(input.attack&&input.attackPressed&&input.jump);
send('mobile-jump','pointercancel',2);assert(!input.jump&&input.attack&&input.right);
send('mobile-stick','pointermove',1,140,160);assert(input.down&&input.right,'diagonal stick');
send('mobile-stick','pointerup',1);assert(!input.right&&!input.down);
send('mobile-subweapon','pointerdown',4);assert(input.subweaponPressed);
send('mobile-dodge','pointerdown',5);assert(input.backstepPressed);
assert(node('mobile-dodge').classList.contains('pressed'));send('mobile-dodge','pointerup',5);assert(!node('mobile-dodge').classList.contains('pressed'));
Game.updateMobileHud({hp:70,maxHp:100,mp:43.9,maxMp:100,lives:2,subweapon:'axe',damageFeedback:[{amount:10}]},{timer:{remainingFrames:610,expired:false},timeStopped:false});
assert.equal(node('mobile-health').textContent,'체력 80 / 100','readable HP preserves pending damage timing');
assert.equal(node('mobile-magic').textContent,'마력 43 / 100');assert.equal(node('mobile-time').textContent,'00:11');assert.equal(node('mobile-equipment').textContent,'도끼 · 잔기 2');
node('reverse-mobile-controls').checked=true;send('reverse-mobile-controls','change',0);
assert(node('screen').classList.contains('mobile-reversed'));assert.equal(storage.get('rubania-mobile-reversed'),'true');assert(!input.attack);
Game.shop={active:true};refresh();assert(node('mobile-controls').hidden);input.clearEdges();send('mobile-jump','pointerdown',6);assert(!input.jumpPressed);
Game.shop.active=false;refresh();assert(!node('mobile-controls').hidden);
media.matches=false;refresh();assert(node('mobile-controls').hidden);
console.log('PASS: touch multitouch, diagonals, cancellation, mirrored saved layout, overlay and desktop blocking.');
