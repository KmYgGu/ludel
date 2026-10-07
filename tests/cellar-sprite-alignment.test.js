const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;
for(const p of ['js/core.js','js/bosses/slime.js','js/stages/outer-wall.js','js/stages/wine-cellar.js'])vm.runInThisContext(fs.readFileSync(p,'utf8'));
const encounter=new Game.CellarEncounter({floorY:660});encounter.image={};encounter.animations={};
for(const name of ['aim','oneshoot','panning','gunready','holster','fastshoot1','fastshoot2','liedown','rise','lieaim','lieshoot','frontmove','backmove','reload','damage','counterkick','backhop','jump','plungingfire']){
 encounter.animations[name]={source:{},cell:203,height:203,count:name==='frontmove'?10:12,scale:name.startsWith('fastshoot')?1/6:1};
}
let translation,scale,draw;
const ctx={save(){},restore(){},translate(x,y){translation={x,y};},scale(x,y){scale={x,y};},drawImage(...args){draw=args;},fillRect(){}};
for(const facing of [-1,1])for(const phase of Object.keys(Game.cellarSpriteAnchors)){
 const anchor=Game.cellarSpriteAnchors[phase];encounter.phase=phase;encounter.facing=facing;
 const count=phase==='frontmove'?10:phase==='backmove'?12:phase==='idle'?16:phase==='holster'?12:(phase==='liedown'||phase==='lieshoot')?6:phase.startsWith('fastshoot')?1:8;
 for(let index=0;index<count;index++){
  const ticks=(phase==='frontmove'||phase==='backmove')?5:phase==='liedown'?3:phase==='aim'?2.5:phase==='panning'?1:phase==='gunready'?4:phase==='holster'?8:4;
  encounter.phaseTick=Math.ceil(index*ticks);encounter.tick=index*8;encounter.draw(ctx);
  assert.equal(translation.x+scale.x*(draw[5]+anchor.x),980,phase+' shared origin');
  assert.equal(translation.y+scale.y*(draw[6]+anchor.y),660,phase+' floor alignment');
 }
}
console.log('PASS: idle and every attack frame share the same boot center and ground line in both directions.');
