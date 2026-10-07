const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;vm.runInThisContext(fs.readFileSync('js/core.js','utf8'));
const enemy={x:100,y:100,w:100,h:100,hp:100};
const attacker={attackHit:{x:50,y:125,w:70,h:30}};
Game.damageEnemy(enemy,20,attacker);assert.equal(Game.hitEffects.length,1);
assert.equal(Game.hitEffects[0].x,110);assert.equal(Game.hitEffects[0].y,140);
Game.damageEnemy(enemy,0,attacker);assert.equal(Game.hitEffects.length,1);
enemy.takeDamage=()=>{};Game.damageEnemy(enemy,20,attacker);assert.equal(Game.hitEffects.length,1);
delete enemy.takeDamage;enemy.hp=5;Game.damageEnemy(enemy,20,attacker);assert.equal(Game.hitEffects.length,2);
Game.damageEnemy(enemy,20,attacker);assert.equal(Game.hitEffects.length,2);
const ctx={save(){},restore(){},fillRect(x,y,w,h){assert(Number.isFinite(x+y+w+h));}};
for(let i=0;i<14;i++){Game.drawHitEffects(ctx);Game.updateHitEffects();}
assert.equal(Game.hitEffects.length,0);
console.log('PASS: contact location, real damage only, killing blow, no effect on dead/immune targets and effect lifetime/drawing.');
