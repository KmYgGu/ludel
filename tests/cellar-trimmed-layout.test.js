const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const calls=[];
global.document={createElement(){return {getContext(){return {imageSmoothingEnabled:false,drawImage(...args){calls.push(args);},getImageData(){throw Error('test skips background floodfill');}};}};}};
const filenames={'plunging fire':'plungingfire','lie down':'liedown',Rise:'rise',Reload:'reload',CounterKick:'counterkick'};
Game.loadImage=async path=>{
 const file=path.split('/').pop().split('?')[0].replace(/\.png.*$/,'');const name=filenames[file]||file;
 const layout=Game.cellarTrimmedLayouts[name];return layout?{width:layout.width,height:214}:{width:name==='holster'?1848:203,height:name==='holster'?229:203};
};
Game.loadCellarAnimations().then(sheets=>{
 for(const [name,layout] of Object.entries(Game.cellarTrimmedLayouts)){
  const sheet=sheets[name];assert.equal(sheet.cell,layout.pitch);assert.equal(sheet.frames.length,layout.count);
  assert(sheet.frames.every(frame=>frame.width===sheet.frames[0].width&&frame.height===sheet.frames[0].height));
 }
 const front=calls.filter(args=>args.length===9&&args[0].width===1938);
 assert.equal(front.length,10);
 assert.equal(front[1][1]-front[0][1],159,'first frame starts at the trimmed sheet edge');
 assert.equal(front[2][1]-front[1][1],204,'later frames keep their original pitch');
 assert.equal(front[0][5],47,'one whole-sheet offset restores the original origin');
 console.log('PASS: trimmed sheets preserve original pitches, shared offsets and equal padded frame canvases.');
}).catch(error=>{console.error(error);process.exitCode=1;});
