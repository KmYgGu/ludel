const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const b=new Game.CellarEncounter({floorY:660,width:1280});let style,rects=[];
const ctx={save(){},restore(){},set fillStyle(value){style=value},fillRect(...args){rects.push({style,args})}};
for(let ammo=0;ammo<=6;ammo++){b.ammo=ammo;rects=[];Game.debug=false;b.drawAmmo(ctx);assert.equal(rects.filter(r=>r.style==='#dd9339').length,ammo*3);assert.equal(rects.filter(r=>r.style==='#423534').length,(6-ammo)*3);}
assert.equal(b.aimCue,undefined,'muzzle glint removed');b.ammo=6;b.fireBullet();rects=[];b.drawAmmo(ctx);assert.equal(rects.filter(r=>r.style==='#dd9339').length,15);
assert(rects.every(rect=>rect.args[2]<=10),'ammo display draws only cartridge shapes, with no background panel');
console.log('PASS: six graphic ammo slots always visible, loaded/empty states and immediate shot update; no muzzle glint.');
