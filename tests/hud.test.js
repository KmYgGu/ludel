const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const file of ['js/core.js','js/hud.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'));
assert(Game.Hud.bossWidth(1000,1280)>Game.Hud.bossWidth(500,1280));
assert(Game.Hud.bossWidth(99999,1280)<=1040);
const boxes=[];const ctx={save(){},restore(){},fillText(){},fillRect(...args){assert(args.every(Number.isFinite));boxes.push(args);}};
Game.Hud.boss(ctx,'Boss',250,500,1280,720);
assert(boxes.some(([x,y,w,h])=>x===360&&y===684&&w===560&&h===12));
console.log('PASS: max-HP-based boss width, screen bounds and bottom-center positioning.');
