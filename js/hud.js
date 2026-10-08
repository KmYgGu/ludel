Game.Hud = {
  playerLayout: function (overrideScale) {
    const scale=overrideScale==null?(Game.mobileHudScale?Game.mobileHudScale():1):overrideScale;
    return scale>1 ? {x:12*scale,width:1280*0.29,hpText:18*scale,hpY:23*scale,hpH:6*scale,
      mpText:45*scale,mpY:50*scale,mpH:5*scale,equipmentY:69*scale,livesX:150*scale,font:14*scale}
      : {x:25,width:210,hpText:24,hpY:33,hpH:14,mpText:69,mpY:78,mpH:10,equipmentY:111,livesX:150,font:12};
  },
  updateBossDamage: function(encounter,ticks) {
    const hp=encounter.totalHp();
    if(!encounter.hpFeedback)encounter.hpFeedback={lastHp:hp,from:hp,to:hp,age:78};
    const state=encounter.hpFeedback;
    state.age=Math.min(78,state.age+ticks);
    const remaining=1-Game.clamp((state.age-18)/60,0,1);
    const edge=state.from+(state.to-state.from)*remaining;
    if(hp<state.lastHp){state.from=hp;state.to=Math.max(state.lastHp,edge);state.age=0;}
    else if(hp>state.lastHp){state.from=hp;state.to=Math.max(hp,edge);state.age=0;}
    state.lastHp=hp;
  },
  updateDamage: function(actor,ticks,cameraX) {
    if(!actor.damageWhiteSegments)actor.damageWhiteSegments=[];
    actor.damageWhiteSegments=actor.damageWhiteSegments.filter(segment=>{segment.age+=ticks;return segment.age<78;});
    actor.damageFeedback=(actor.damageFeedback||[]).filter(effect=>{
      effect.age+=ticks;
      if(effect.startX==null){effect.x=actor.x+actor.w/2+effect.offsetX;effect.y=actor.y+actor.h*0.3+effect.offsetY;}
      if(effect.age>=60&&effect.startX==null){effect.startX=effect.x-cameraX;effect.startY=effect.y-8;}
      if(effect.age>=92){
        let from=effect.afterHp,to=effect.beforeHp;
        for(const segment of actor.damageWhiteSegments){
          const remaining=1-Game.clamp((segment.age-18)/60,0,1);
          from=Math.min(from,segment.from);
          to=Math.max(to,segment.from+(segment.to-segment.from)*remaining);
        }
        actor.damageWhiteSegments=[{from,to,age:0}];return false;
      }
      return true;
    });
  },
  drawDamage: function(ctx,actor,cameraX) {
    for(const effect of actor.damageFeedback||[]){
      ctx.save();
      const age=effect.age,morph=Game.clamp((age-48)/12,0,1);
      let x=effect.x-cameraX,y=effect.y-Math.min(age/48,1)*8;
      const layout=this.playerLayout();
      const targetX=layout.x+layout.width*((effect.afterHp+effect.beforeHp)/2)/actor.maxHp,targetY=layout.hpY+layout.hpH/2;
      if(age>=60){
        const t=Game.clamp((age-60)/32,0,1),ease=t*t*(3-2*t);
        x=effect.startX+(targetX-effect.startX)*ease;
        y=effect.startY+(targetY-effect.startY)*ease-Math.sin(t*Math.PI)*55;
      }
      if(morph<1){
        ctx.globalAlpha=1-morph;ctx.font='bold 22px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.lineWidth=4;ctx.strokeStyle='#100e16';ctx.strokeText(String(Math.ceil(effect.amount)),x,y);
        ctx.fillStyle='#fed8c1';ctx.fillText(String(Math.ceil(effect.amount)),x,y);
      }
      if(morph>0){
        ctx.globalAlpha=morph;ctx.fillStyle='#f8f4e9';ctx.strokeStyle='#dd9339';ctx.lineWidth=2;
        ctx.beginPath();ctx.arc(x,y,6,0,Math.PI*2);ctx.fill();ctx.stroke();
      }
      ctx.restore();
    }
  },
  bossWidth: function (maxHp, screenWidth) { return Math.min(screenWidth - 240, Math.max(220, Math.round(160 + maxHp * 0.8))); },
  bar: function (ctx, x, y, width, height, ratio, color, light) {
    ctx.fillStyle = '#100e16'; ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
    ctx.fillStyle = '#76634e'; ctx.fillRect(x - 3, y - 3, width + 6, height + 6);
    ctx.fillStyle = '#211923'; ctx.fillRect(x, y, width, height);
    const fill = Math.round(width * Game.clamp(ratio, 0, 1));
    ctx.fillStyle = color; ctx.fillRect(x, y, fill, height);
    ctx.fillStyle = light; ctx.fillRect(x, y, fill, 3);
    ctx.fillStyle = '#c5ac7a';
    ctx.fillRect(x - 7, y + height / 2 - 2, 4, 4);
    ctx.fillRect(x + width + 3, y + height / 2 - 2, 4, 4);
  },
  player: function (ctx, actor) {
    const l=this.playerLayout(ctx.canvas && ctx.canvas.width === 300 ? 1 : undefined);
    const pending=(actor.damageFeedback||[]).reduce((sum,effect)=>sum+effect.amount,0);
    const shownHp=Math.min(actor.maxHp,actor.hp+pending);
    ctx.save(); ctx.font = l.font+'px serif'; ctx.fillStyle = '#d7c8b2';
    ctx.fillText(l.font>12?'체력 '+Math.ceil(shownHp)+'/'+actor.maxHp:'체력  '+Math.ceil(shownHp)+' / '+actor.maxHp, l.x, l.hpText);
    this.bar(ctx, l.x, l.hpY, l.width, l.hpH, shownHp / actor.maxHp, '#862f45', '#be5961');
    ctx.fillStyle='#f8f4e9';
    for(const segment of actor.damageWhiteSegments||[]){
      const remaining=1-Game.clamp((segment.age-18)/60,0,1);
      const from=Math.max(shownHp,segment.from),to=Math.min(actor.maxHp,segment.from+(segment.to-segment.from)*remaining);
      if(to>from)ctx.fillRect(l.x+l.width*from/actor.maxHp,l.hpY,l.width*(to-from)/actor.maxHp,l.hpH);
    }
    ctx.fillStyle = '#c1b7cf'; ctx.fillText(l.font>12?'마력 '+Math.floor(actor.mp)+'/'+actor.maxMp:'마력  '+Math.floor(actor.mp)+' / '+actor.maxMp, l.x, l.mpText);
    this.bar(ctx, l.x, l.mpY, l.width, l.mpH, actor.mp / actor.maxMp, '#4f456f', '#8b7ca5');
    const names = {knife:'나이프',cross:'십자가',axe:'도끼',holy:'성수',clock:'회중시계'};
    ctx.fillStyle = '#bba98a'; ctx.fillText(names[actor.subweapon] || '', l.x, l.equipmentY);
    ctx.fillText('잔기 × ' + (actor.lives == null ? 3 : actor.lives), l.livesX, l.equipmentY); ctx.restore();
  },
  boss: function (ctx, name, hp, maxHp, width, height, feedback) {
    const scale=Game.mobileHudScale?Game.mobileHudScale():1;
    const w = scale>1?Math.min(width-24*scale,this.bossWidth(maxHp,width)*1.6):this.bossWidth(maxHp, width), x = (width - w) / 2, y = height - (scale>1?12*scale:36);
    const barH=scale>1?5*scale:12;
    ctx.save(); ctx.textAlign = 'center'; ctx.font = (scale>1?14*scale:16)+'px serif'; ctx.fillStyle = '#d2bda7';
    ctx.fillText(name + '  ' + Math.ceil(hp) + ' / ' + maxHp, width / 2, y - (scale>1?8*scale:15));
    this.bar(ctx, x, y, w, barH, hp / maxHp, '#74293c', '#ab4b58');
    if(feedback){
      const remaining=1-Game.clamp((feedback.age-18)/60,0,1);
      const edge=Math.min(maxHp,feedback.from+(feedback.to-feedback.from)*remaining);
      if(edge>hp){ctx.fillStyle='#f8f4e9';ctx.fillRect(x+w*hp/maxHp,y,w*(edge-hp)/maxHp,barH);}
    }
    ctx.restore();
  }
};
