const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const crops=[];
global.document={createElement(){const canvas={getContext(){return {drawImage(...args){if(args.length===9)crops.push({canvas,args});},getImageData(){throw new Error('pixel reads omitted in this test');}};}};return canvas;}};
Game.loadImage=src=>Promise.resolve(src.endsWith('/holster.png')?{width:1848,height:229}:{width:1624,height:203});
Game.loadCellarAnimations().then(animations=>{
 const sheet=animations.holster;assert.equal(sheet.frames.length,12);
 assert.equal(new Set(sheet.frames).size,12);
 for(let i=0;i<12;i++){
  const crop=crops[i];assert.deepEqual(crop.args.slice(1),[i*154,0,154,229,2,2,154,229]);
  assert.equal(crop.canvas.width,158);assert.equal(crop.canvas.height,233);
 }
 console.log('PASS: holster uses twelve separate textures with exact crops and transparent padding.');
}).catch(error=>{console.error(error);process.exitCode=1;});
