const fs=require('fs'),vm=require('vm'),assert=require('assert');global.Game={clamp:(v,min,max)=>Math.max(min,Math.min(max,v))};
vm.runInThisContext(fs.readFileSync('js/hud.js','utf8'));
for(const width of [320,360,390,430,600]){
  const scale=1280/width;Game.mobileHudScale=()=>scale;
  const l=Game.Hud.playerLayout();assert(Math.abs(l.font/scale-14)<1e-9);
  assert(l.x+l.width<640-48*scale,'player bars leave center timer clear');
  const texts=[],fills=[];
  const ctx={canvas:{width:1280},save(){},restore(){},fillText(text,x,y){texts.push({text,x,y,font:this.font})},fillRect(...args){fills.push(args)}};
  Game.Hud.player(ctx,{hp:70,maxHp:100,mp:43,maxMp:100,lives:2,subweapon:'axe',damageFeedback:[{amount:10}],damageWhiteSegments:[]});
  assert.equal(texts[0].text,'체력 80/100');assert(texts.every(t=>t.font===14*scale+'px serif'));
  assert(fills.some(r=>r[0]===l.x&&r[1]===l.hpY&&r[3]===l.hpH));
  assert.equal(Game.Hud.playerLayout(1).width,210,'shop portrait HUD retains own canvas scale');
}
console.log('PASS: existing mobile HUD readable at 320–600px, centered timer clearance, delayed damage and shop scale.');
