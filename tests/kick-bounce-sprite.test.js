const fs=require('fs'),vm=require('vm'),assert=require('assert');
global.window=global;
for(const file of ['js/core.js','js/character.js','js/characters/rubania.js'])vm.runInThisContext(fs.readFileSync(file,'utf8'));
for(const dir of [0,1,-1]){
  const f=new Game.Fighter(Game.Characters.rubania,{x:100,y:100});
  f.sheets.jump=[{}];f.sheets.kickVertical=[{}];f.sheets.kickDiagonal=[{}];
  f.kicking=true;f.kickDir=dir;f.onKickConnect();
  assert.equal(f.kicking,false);assert.equal(f.kickHit,null);assert(f.vy<0);
  const expected=dir===0?f.sheets.kickVertical:f.sheets.kickDiagonal;
  for(let t=f.kickInvuln;t>0;t--){f.kickInvuln=t;assert.strictEqual(f.currentFrames(),expected);}
  f.kickInvuln=0;assert.strictEqual(f.currentFrames(),f.sheets.jump);
}
console.log('PASS: successful vertical/diagonal kick sprites throughout bounce immunity; jump sprite resumes afterward.');
