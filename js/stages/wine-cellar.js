Game.Stages.wineCellar = {
  id: 'wineCellar', name: '와인 저장고',
  sprite:'sprites/stages/wine_cellar.png',
  // Independent foreground objects, kept out of the background painting.
  objects:[120,300,480].flatMap(y=>
    Array.from({length:7},(_,column)=>({type:'oakBarrel',x:330+column*180,y,w:180,h:180}))
  ),
  stone: { shadow:'#141018', face:'#30252f', edge:'#5b4555', platform:'#5b4555', highlight:'#7a6070' }
};
Game.Bosses.cellar = {
  name:'미츄헨 데슈타프', title:'성주의 재물로 움직이는 자',
  sprite:'sprites/bosses/stage2/idle.png', maxHp:800, timeStopImmune:false
};
Game.cellarBossLabel = function (actor) {
  return actor.knowsCellarBoss ? Game.Bosses.cellar.name : Game.Bosses.cellar.title;
};
Game.cellarRevolverTiming = { frames:8, aimFrameTicks:2.5, shotFrameTicks:4, panningFrameTicks:1, burstShots:5, holsterFrameTicks:8 };
// Kept visible for pattern testing; its role can be changed without changing targeting.
Game.cellarShowReticle = true;
Game.cellarReloadFrameTicks = 6;
Game.cellarJumpTiming={prepare:12,flight:96,height:320,recovery:12,apex:60,shotStart:12,shotFrameTicks:8};
// One origin per animation keeps the artist's motion between frames intact.
Game.cellarSpriteAnchors = {
  idle:{x:102.5,y:201},
  plungingfire:{x:95.5,y:230},jump:{x:102,y:203},backhop:{x:101.5,y:203},counterkick:{x:100.5,y:203},reload:{x:89,y:205},damage:{x:63.5,y:203},
  frontmove:{x:102,y:204},backmove:{x:67.5,y:201},
  aim:{x:60.5,y:202},
  oneshoot:{x:65,y:202},
  panning:{x:65.5,y:202},
  gunready:{x:103.5,y:202},
  holster:{x:55.5,y:211},
  fastshoot1:{x:606,y:1320},fastshoot2:{x:606,y:1320},
  liedown:{x:101.5,y:202},rise:{x:101.5,y:191},
  lieaim:{x:103.5,y:150},lieshoot:{x:99.5,y:98}
};
// These sheets were trimmed as a whole; their frame pitch did not change.
Game.cellarTrimmedLayouts={
  plungingfire:{width:1632,count:6,pitch:272,dx:0,dy:0},
  aim:{width:1618,count:8,pitch:203,dx:-2,dy:-1},
  backhop:{width:966,count:5,pitch:203,dx:-29,dy:0},
  backmove:{width:1365,count:12,pitch:117,dx:-21,dy:0},
  counterkick:{width:1940,count:10,pitch:199,dx:-39,dy:-1},
  frontmove:{width:1938,count:10,pitch:204,dx:-45,dy:0},
  gunready:{width:1535,count:8,pitch:203,dx:-45,dy:-1},
  jump:{width:743,count:4,pitch:203,dx:-41,dy:-4},
  liedown:{width:1178,count:6,pitch:203,dx:-39,dy:0},
  lieaim:{width:2337,count:8,pitch:2362/8,dx:-3,dy:0},
  lieshoot:{width:1587,count:6,pitch:1592/6,dx:-3,dy:-3},
  oneshoot:{width:1615,count:8,pitch:203,dx:-5,dy:-5},
  panning:{width:1622,count:8,pitch:204,dx:-5,dy:-6},
  reload:{width:1390,count:7,pitch:1458/7,dx:-33,dy:-4}
};

Game.loadCellarAnimations = function () {
  const names=['aim','oneshoot','panning','gunready','fastshoot1','fastshoot2','holster','liedown','rise','lieaim','lieshoot','frontmove','backmove','reload','damage','counterkick','backhop','jump','plungingfire'];
  return Promise.all(names.map(name=>
    Game.loadImage('sprites/bosses/stage2/'+(name==='liedown'?'lie down.png':name==='rise'?'Rise.png':name==='reload'?'Reload.png':name==='counterkick'?'CounterKick.png':name==='plungingfire'?'plunging fire.png?v=padded-20261007-1':name+(name==='fastshoot2'?'.png.png':'.png'))+((name==='counterkick'||name==='reload')?'?v=origins-20261007-1':name==='backmove'?'?v=backmove-layout-20261006-3':(name==='lieaim'||name==='lieshoot')?'?v=prone-layout-20261006-2':(name==='liedown'||name==='rise')?'?v=crouch-layout-20261005-2':'')).then(image=>{
      if(!image)return null;
      // Remove only background connected to the sheet border; keep cream clothing.
      let source=image;
      try{
        const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
        const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);
        const pixels=ctx.getImageData(0,0,image.width,image.height),data=pixels.data;
        const key=Array.from(data.slice(0,4)),seen=new Uint8Array(image.width*image.height),queue=[];
        function visit(x,y){
          if(x<0||y<0||x>=image.width||y>=image.height)return;
          const p=y*image.width+x,i=p*4;if(seen[p])return;seen[p]=1;
          if(!data[i+3]||key.every((value,k)=>Math.abs(data[i+k]-value)<=2)){data[i+3]=0;queue.push(p);}
        }
        for(let x=0;x<image.width;x++){visit(x,0);visit(x,image.height-1);}
        for(let y=0;y<image.height;y++){visit(0,y);visit(image.width-1,y);}
        for(let head=0;head<queue.length;head++){const p=queue[head],x=p%image.width,y=Math.floor(p/image.width);visit(x-1,y);visit(x+1,y);visit(x,y-1);visit(x,y+1);}
        ctx.putImageData(pixels,0,0);source=canvas;
      }catch(error){/* A non-browser test environment can still load the sheet. */}
      const layout=Game.cellarTrimmedLayouts[name];
      if(layout&&image.width===layout.width){
        const frames=[],padding=2,height=image.height-layout.dy;
        for(let i=0;i<layout.count;i++){
          const frame=document.createElement('canvas');frame.width=Math.ceil(layout.pitch)+padding*2;frame.height=height+padding*2;
          const frameCtx=frame.getContext('2d');frameCtx.imageSmoothingEnabled=false;
          const start=i*layout.pitch+layout.dx,left=Math.max(0,start),right=Math.min(image.width,start+layout.pitch);
          if(right>left)frameCtx.drawImage(source,left,0,right-left,image.height,padding+left-start,padding-layout.dy,right-left,image.height);
          frames.push(frame);
        }
        return {source,frames,padding,cell:layout.pitch,height,count:layout.count,scale:1};
      }
      if(name.startsWith('fastshoot'))return {source,cell:image.width,height:image.height,count:1,anchorX:600,anchorY:1320,scale:1/6};
      if(name==='jump')return {source,cell:image.width/4,height:image.height,count:4,scale:1};
      if(name==='backhop')return {source,cell:image.width/5,height:image.height,count:5,scale:1};
      if(name==='counterkick')return {source,cell:image.width/10,height:image.height,count:10,scale:1};
      if(name==='damage')return {source,cell:image.width,height:image.height,count:1,scale:1};
      if(name==='reload')return {source,cell:image.width/7,height:image.height,count:7,scale:1};
      if(name==='frontmove'||name==='backmove'){
        const count=name==='frontmove'?10:12;
        return {source,cell:image.width/count,height:image.height,count,scale:1};
      }
      if(name==='lieaim'||name==='lieshoot'){
        const count=name==='lieaim'?8:6;
        return {source,cell:image.width/count,height:image.height,count,scale:1};
      }
      if(name==='liedown'||name==='rise'){
        const count=name==='liedown'?6:8;
        return {source,cell:image.width/count,height:image.height,count,scale:1};
      }
      if(name==='holster'){
        const cell=154,count=12,height=229;
        if(image.width!==cell*count||image.height!==height)throw new Error('holster sheet must contain twelve 154x229 frames');
        const frames=[];
        // Isolated textures with transparent borders cannot sample an adjacent pose.
        for(let i=0;i<count;i++){
          const frame=document.createElement('canvas');frame.width=cell+4;frame.height=height+4;
          const frameCtx=frame.getContext('2d');frameCtx.imageSmoothingEnabled=false;
          frameCtx.drawImage(source,i*cell,0,cell,height,2,2,cell,height);frames.push(frame);
        }
        return {source,frames,padding:2,cell,height,count,scale:1};
      }
      return {source,cell:image.height,height:image.height,count:8,anchorX:name==='gunready'?104:60,anchorY:201,scale:1};
    })
  )).then(sheets=>Object.fromEntries(names.map((name,i)=>[name,sheets[i]])));
};
Game.CellarEncounter = function (world) {
  this.world=world;this.def=Game.Bosses.cellar;this.image=null;this.waves=[];this.tick=0;
  this.world.wineLeaks=[];
  this.world.wineFires=[];
  this.animations=null;this.phase='idle';this.phaseTick=0;this.cooldown=90;this.facing=-1;this.bullets=[];
  this.attackCount=0;this.burst=false;this.ammo=6;this.maxAmmo=6;this.reloadLoop=false;this.reloadClosing=false;this.reloadInterrupted=false;this.reloadBlocked=false;
  this.reticle=null;this.lockedTarget=null;this.exclamation=0;this.fastImpact=null;this.fastFlash=0;
  this.safeTicks=0;this.reloadDamageTicks=0;this.damageTicks=0;this.proneShots=0;this.random=Math.random;this.threatTicks=0;this.duckReads=0;this.duckDelay=0;this.duckCooldown=0;
  this.hopReadTicks=0;this.hopCooldown=0;this.hopPlan=null;
  this.jumpCooldown=0;this.jumpPlan=null;
  this.evasionPending=null;this.evasionRest=0;this.seenAttack=null;this.lastAttackT=0;this.syntheticAttack=0;
  this.postureHistory=new Uint8Array(120);this.postureIndex=0;this.airFrames=0;this.lowFrames=0;
  this.tactics={pressure:0,damageHeat:0,lastAttackT:0,attackHp:null,punish:0,lastPattern:null,repeats:0,range:440,rethink:90,nextJump:60};
  this.slimes=[{x:Math.min(930+(world.arenaOrigin||0),(world.width||1280)-180),y:world.floorY-195,w:100,h:195,hp:this.def.maxHp,maxHp:this.def.maxHp}];
  this.slimes[0].takeDamage=(amount)=>{
    const actor=this.slimes[0],guard=this.phase==='counterkick'&&this.counterMode==='guard';
    actor.hp=Math.max(0,actor.hp-amount*(guard?0.5:1));
    this.tactics.damageHeat=Math.min(1,this.tactics.damageHeat+0.3);
    if(guard&&actor.hp>0){this.counterMode='kick';this.phaseTick=0;this.counterConnected=false;}
    if(this.phase==='reload'&&actor.hp>0){
      // Further hits still hurt, but cannot restart an interrupted reload's flinch.
      if(!this.reloadInterrupted){this.reloadDamageTicks=36;this.reloadInterrupted=true;}
    }
    else if(this.phase!=='counterkick'&&actor.hp>0&&this.random()<0.1){
      // A flinch interrupts the action; already fired bullets keep travelling.
      this.damageTicks=18;this.phase='damage';this.phaseTick=0;
      this.reticle=null;this.lockedTarget=null;this.exclamation=0;
      this.burst=false;this.proneShots=0;this.evasionPending=null;this.hopPlan=null;this.jumpPlan=null;
      const feet=actor.y+actor.h;actor.h=195;actor.y=feet-actor.h;
    }
  };
};
Game.CellarEncounter.prototype.update=function(fighter){
  if(this.world.timeStopped)return;
  this.tick++;
  this.world.wineLeaks=(this.world.wineLeaks||[]).filter(leak=>{
    leak.age++;leak.bottom=Math.min(this.world.floorY,leak.top+leak.age*9);
    if(leak.age>=960){if(leak.source)leak.source.leaking=false;return false;}return true;
  });
  this.world.wineFires=(this.world.wineFires||[]).filter(fire=>{
    if(--fire.life<=0)return false;
    if(Game.combatOverlap(fighter,fire))fighter.takeHit({...fire,continuous:true,damage:12*(this.world.enemyDamageMultiplier||1)});
    return true;
  });
  if(this.fastFlash>0)this.fastFlash--;
  if(this.reloadDamageTicks>0)this.reloadDamageTicks--;
  if(this.damageTicks>0)this.damageTicks--;
  if(this.duckCooldown>0)this.duckCooldown--;
  if(this.hopCooldown>0)this.hopCooldown--;
  if(this.jumpCooldown>0)this.jumpCooldown--;
  if(this.evasionRest>0)this.evasionRest--;
  if(this.exclamation>0)this.exclamation--;
  if(this.fastImpact&&--this.fastImpact.life<=0)this.fastImpact=null;
  const actor=this.slimes[0];
  if(actor.hp<=0){this.bullets=[];return;}
  if(fighter&&this.animations){
    this.observePlayer(fighter);
    this.observeTactics(fighter);
    this.updateEvasion(fighter);
    const attackBox=fighter.attackT>0&&(fighter.attackKind==='stand'||fighter.attackKind==='air')?fighter.whipAttackBox():null;
    const standingBody={x:actor.x,y:this.world.floorY-195,w:actor.w,h:195};
    const threat=!!attackBox&&Game.aabb(attackBox,standingBody);
    if(['idle','frontmove','backmove'].includes(this.phase)&&!this.evasionPending&&this.animations.jump&&this.jumpCooldown===0&&this.tick>=this.tactics.nextJump){
      this.tactics.nextJump=this.tick+45+Math.floor(this.random()*46);
      const distance=Math.abs(fighter.x+fighter.w/2-actor.x-actor.w/2);
      const atLeft=actor.x<152,atRight=actor.x>this.world.width-actor.w-152;
      const inJumpRange=distance>=180&&distance<=800;
      if((distance>650||atLeft||atRight||inJumpRange)&&this.random()<(atLeft||atRight?0.65:0.3)){
        const facing=atLeft?1:atRight?-1:fighter.x+fighter.w/2<actor.x+actor.w/2?-1:1;
        const targetX=actor.x+facing*800;
        if(targetX>=16&&targetX+actor.w<=this.world.width-16){
          const playerX=fighter.x+fighter.w/2,startCenter=actor.x+actor.w/2;
          const inPath=(playerX-startCenter)*facing>=0&&(playerX-startCenter)*facing<=800;
          this.jumpPlan={startX:actor.x,targetX,plunging:!!(inPath&&this.animations.plungingfire&&this.ammo>0),fired:false};this.facing=facing;
          this.phase='jump';this.phaseTick=0;this.reloadBlocked=false;
        }
      }
    }
    if(this.phase==='damage'){
      actor.y=Math.min(this.world.floorY-actor.h,actor.y+8);
      if(this.damageTicks===0&&actor.y+actor.h>=this.world.floorY){
        this.phase='idle';this.phaseTick=0;this.cooldown=30;
        this.evasionRest=Math.max(this.evasionRest,24);
      }
    }else if(['idle','frontmove','backmove'].includes(this.phase)){
      this.facing=fighter.x+fighter.w/2<actor.x+actor.w/2?-1:1;
      const distance=Math.abs(fighter.x+fighter.w/2-actor.x-actor.w/2);
      const left=32,right=this.world.width-actor.w-32;
      const canRetreat=this.facing===1?actor.x>left:actor.x<right;
      // Hysteresis keeps the boss from changing direction at every step.
      let movement=this.phase;
      const preferred=this.tactics.range+(this.ammo<=2?60:0);
      if(movement==='frontmove'&&distance<=preferred+60)movement='idle';
      if(movement==='backmove'&&(distance>=preferred||!canRetreat))movement='idle';
      if(movement==='idle'){
        if(distance>preferred+140&&this.animations.frontmove)movement='frontmove';
        else if(distance<preferred-100&&canRetreat&&this.animations.backmove)movement='backmove';
      }
      if(movement!==this.phase){this.phase=movement;this.phaseTick=0;}
      if(this.phase!=='idle'){
        this.phaseTick++;
        const speed=this.phase==='frontmove'?2.4:-3.2;
        actor.x=Math.max(left,Math.min(right,actor.x+this.facing*speed));
      }
      const nearby={x:actor.x-120,y:actor.y-40,w:actor.w+240,h:actor.h+80};
      const projectiles=['knives','crosses','axes','holies'].some(key=>(fighter[key]||[]).some(shot=>Game.aabb(nearby,shot)));
      const safe=distance>560&&!threat&&!projectiles&&!fighter.kicking&&this.tactics.damageHeat<0.35;
      const wantsBurst=(this.attackCount+1)%(distance<340?3:2)===0;
      // Threats influence the response, but cannot freeze the attack timer.
      this.cooldown-=this.attackTransitionSpeed();
      if(this.tactics.punish>0)this.cooldown=Math.min(this.cooldown,6);
      if(!this.evasionPending&&this.animations.counterkick&&this.ammo===0&&((this.reloadBlocked&&this.cooldown<=1)||(distance<340&&this.random()<0.5))){
        this.phase='counterkick';this.counterMode='prepare';this.phaseTick=0;this.counterConnected=false;this.reloadBlocked=false;
      }else if(!this.evasionPending&&!this.reloadBlocked&&this.animations.reload&&(this.ammo===0||(this.ammo<this.maxAmmo&&safe&&!wantsBurst))){
        this.startReload();
      }else if(!this.evasionPending&&this.cooldown<=0&&this.ammo>0){
        this.reloadBlocked=false;this.attackCount++;this.phase=this.chooseAttack(distance);
        this.tactics.repeats=this.tactics.lastPattern===this.phase?this.tactics.repeats+1:1;this.tactics.lastPattern=this.phase;
        this.phaseTick=0;this.burst=wantsBurst;this.facing=fighter.x+fighter.w/2<actor.x+actor.w/2?-1:1;
        if(this.phase==='counterkick'){this.counterMode='prepare';this.counterConnected=false;}
        if(this.phase==='liedown'){
          this.phase='liedown';this.safeTicks=0;this.proneShots=2+Math.floor(this.random()*2);
        }
        if(this.phase==='gunready')this.reticle={x:actor.x+actor.w/2,y:this.world.floorY-133};
      }
    }else if(this.phase==='jump'){
      this.phaseTick++;
      const timing=Game.cellarJumpTiming,t=Game.clamp((this.phaseTick-timing.prepare)/timing.flight,0,1),plan=this.jumpPlan;
      actor.x=plan.startX+(plan.targetX-plan.startX)*t;
      actor.y=this.world.floorY-actor.h-4*timing.height*t*(1-t);
      if(plan.plunging&&!plan.remembered&&this.phaseTick>timing.prepare)plan.remembered={x:fighter.x+fighter.w/2,y:fighter.y+fighter.h/2};
      if(plan.plunging&&!plan.fired&&this.phaseTick>=timing.apex){
        plan.fired=true;
        if(this.ammo>0){
          this.ammo--;
          const x=actor.x+actor.w/2,y=actor.y+actor.h*0.5,dx=plan.remembered.x-x,dy=plan.remembered.y-y,length=Math.hypot(dx,dy)||1;
          this.bullets.push({x,y,w:8,h:8,vx:dx/length*40,vy:dy/length*40,damage:18,plunging:true});
        }
      }
      if(this.phaseTick>=timing.prepare+timing.flight+timing.recovery){
        actor.x=plan.targetX;actor.y=this.world.floorY-actor.h;
        this.phase='idle';this.phaseTick=0;this.jumpPlan=null;this.jumpCooldown=180;this.cooldown=30;
      }
    }else if(this.phase==='backhop'){
      this.phaseTick++;
      const plan=this.hopPlan,t=Game.clamp((this.phaseTick-4)/24,0,1);
      actor.x=plan.startX+(plan.targetX-plan.startX)*(1-(1-t)*(1-t));
      actor.y=this.world.floorY-actor.h-4*120*t*(1-t);
      if(this.phaseTick>=34){
        actor.x=plan.targetX;actor.y=this.world.floorY-actor.h;
        this.phase='idle';this.phaseTick=0;this.cooldown=this.tactics.pressure>0.3?18+Math.floor(this.random()*13):40;this.hopCooldown=45;this.hopPlan=null;this.evasionRest=Math.max(this.evasionRest,24);
      }
    }else if(this.phase==='counterkick'){
      this.phaseTick++;
      if(this.counterMode==='prepare'&&this.phaseTick>=6){this.counterMode='guard';this.phaseTick=0;}
      else if(this.counterMode==='guard'&&this.phaseTick>=48){this.counterMode='cancel';this.phaseTick=0;}
      else if(this.counterMode==='cancel'&&this.phaseTick>=6){this.phase='idle';this.phaseTick=0;this.cooldown=70;}
      else if(this.counterMode==='kick'){
        actor.x=Game.clamp(actor.x+this.facing*9,32,this.world.width-actor.w-32);
        const frame=this.counterFrame();
        const center=actor.x+actor.w/2,rearReach=actor.w/2+80;
        const box={x:this.facing>0?center-rearReach:center-120,y:this.world.floorY-145,w:120+rearReach,h:100};
        if(frame>=6&&!this.counterConnected&&Game.combatOverlap(fighter,box)){
          this.counterConnected=fighter.launchFromCounter({...box,damage:26*(this.world.enemyDamageMultiplier||1)},this.facing);
        }
        if(this.phaseTick>=28){this.phase='idle';this.phaseTick=0;this.cooldown=90;}
      }
    }else if(this.phase==='reload'){
      const ticks=Game.cellarReloadFrameTicks;
      this.phaseTick++;
      if(this.reloadInterrupted&&this.reloadDamageTicks===0){
        this.phase='idle';this.phaseTick=0;this.cooldown=15;this.reloadBlocked=true;
      }else if(this.reloadClosing){
        if(!this.reloadInterrupted&&this.phaseTick>=ticks){this.phase='idle';this.phaseTick=0;this.cooldown=30;}
      }else if(this.phaseTick>=(this.reloadLoop?3:6)*ticks){
        this.ammo=Math.min(this.maxAmmo,this.ammo+1);this.phaseTick=0;
        if(this.ammo>=this.maxAmmo)this.reloadClosing=true;
        else this.reloadLoop=true;
      }
    }else if(this.phase==='liedown'){
      this.phaseTick=Math.min(17,this.phaseTick+1);
      const frame=Math.floor(this.phaseTick/3);
      actor.h=frame===0?195:frame===1?130:85;actor.y=this.world.floorY-actor.h;
      this.safeTicks=threat?0:this.safeTicks+1;
      if(this.phaseTick>=17&&this.animations.lieaim&&this.ammo>0){
        this.phase='lieaim';this.phaseTick=0;this.proneVolley=this.ammo>1&&(this.proneShots>1||threat);
        this.facing=fighter.x+fighter.w/2<actor.x+actor.w/2?-1:1;
      }else if(this.phaseTick>=17&&(this.safeTicks>=24||this.ammo===0)){this.phase='rise';this.phaseTick=0;}
    }else if(this.phase==='lieaim'){
      actor.h=85;actor.y=this.world.floorY-actor.h;
      if(this.ammo<=0){this.phase='rise';this.phaseTick=0;}
      else if(++this.phaseTick>=32){
        this.phase='lieshoot';this.phaseTick=0;this.fireProneBullet();
      }
    }else if(this.phase==='lieshoot'){
      this.phaseTick++;this.safeTicks=threat?0:this.safeTicks+1;
      if(this.phaseTick>=24){
        if((threat||this.proneShots>0)&&this.ammo>0){this.phaseTick=0;this.fireProneBullet();}
        else if(this.safeTicks>=24||this.ammo===0){this.phase='rise';this.phaseTick=0;}
      }
    }else if(this.phase==='rise'){
      this.phaseTick++;
      const frame=Math.min(7,Math.floor(this.phaseTick/4));
      actor.h=frame<4?85:frame<6?130:195;actor.y=this.world.floorY-actor.h;
      if(this.phaseTick>=32){this.phase='idle';this.phaseTick=0;this.cooldown=Math.max(this.cooldown,30);this.duckCooldown=18;this.evasionRest=Math.max(this.evasionRest,24);}
    }else if(this.phase==='gunready'){
      if(this.ammo<=0){this.reticle=null;this.startReload();return;}
      this.phaseTick++;
      const target={x:fighter.x+fighter.w/2,y:fighter.y+fighter.h/2};
      const dx=target.x-this.reticle.x,dy=target.y-this.reticle.y,distance=Math.hypot(dx,dy);
      const speed=Math.min(48,12+this.phaseTick*0.8+Math.max(0,distance-400)*0.018);
      if(distance<=speed){this.reticle.x=target.x;this.reticle.y=target.y;}
      else{this.reticle.x+=dx/distance*speed;this.reticle.y+=dy/distance*speed;}
      if(this.phaseTick>=16&&distance<=speed){
        this.lockedTarget={x:target.x-16,y:target.y-16,w:32,h:32};
        this.phase='fastlock';this.phaseTick=0;this.exclamation=20;
      }
    }else if(this.phase==='fastlock'){
      if(this.ammo<=0){this.reticle=null;this.startReload();return;}
      if(++this.phaseTick>=8){
        this.ammo--;this.phase='fastshoot1';this.phaseTick=0;this.fastFlash=10;
        const area=this.lockedTarget;
        this.spillWine(area.x+area.w/2,area.y+area.h/2);
        this.fastImpact={...area,life:8};
        if(Game.combatOverlap(fighter,area))fighter.takeHit({...area,damage:30*(this.world.enemyDamageMultiplier||1)});
        this.reticle=null;
      }
    }else if(this.phase==='fastshoot1'){
      if(++this.phaseTick>=3){this.phase='fastshoot2';this.phaseTick=0;}
    }else if(this.phase==='fastshoot2'){
      if(++this.phaseTick>=3){this.phase='holster';this.phaseTick=0;}
    }else if(this.phase==='holster'){
      if(++this.phaseTick>=12*Game.cellarRevolverTiming.holsterFrameTicks){this.phase='idle';this.phaseTick=0;this.cooldown=110;this.lockedTarget=null;}
    }else if(this.phase==='aim'){
      if(this.ammo<=0){this.startReload();return;}
      if(++this.phaseTick>=Game.cellarRevolverTiming.frames*Game.cellarRevolverTiming.aimFrameTicks){
        this.phase=this.burst&&this.ammo===1?'panning':'oneshoot';this.phaseTick=0;this.fireBullet();
      }
    }else if(this.phase==='oneshoot'){
      const timing=Game.cellarRevolverTiming;
      if(++this.phaseTick>=timing.frames*timing.shotFrameTicks){
        this.phase=this.burst&&this.ammo>0?'panning':'idle';this.phaseTick=0;this.cooldown=110;
        if(this.phase==='panning')this.fireBullet();
      }
    }else if(this.phase==='panning'){
      const timing=Game.cellarRevolverTiming,cycle=timing.frames*timing.panningFrameTicks;
      this.phaseTick++;
      if(this.phaseTick>=cycle*timing.burstShots||(this.ammo===0&&this.phaseTick%cycle===0)){this.phase='idle';this.phaseTick=0;this.cooldown=110;}
      else if(this.phaseTick%cycle===0)this.fireBullet();
    }
  }
  this.bullets=this.bullets.filter(bullet=>{
    const previous=bullet.x,previousY=bullet.y;bullet.x+=bullet.vx;bullet.y+=bullet.vy||0;
    // Sweep the whole path so the fast bullet cannot skip a player between frames.
    const sweep={x:Math.min(previous,bullet.x),y:Math.min(previousY,bullet.y),w:Math.abs(bullet.vx)+bullet.w,h:Math.abs(bullet.vy||0)+bullet.h};
    if(bullet.plunging){
      const leak=(this.world.wineLeaks||[]).find(wine=>Game.aabb(sweep,{x:wine.x-16,y:wine.top,w:32,h:Math.max(1,wine.bottom-wine.top)})||
        (wine.bottom>=this.world.floorY&&Game.aabb(sweep,{x:wine.x-110,y:this.world.floorY-14,w:220,h:14})));
      if(leak){
        this.world.wineLeaks=this.world.wineLeaks.filter(wine=>wine!==leak);
        if(leak.source)leak.source.leaking=false;
        this.world.wineFires.push({x:leak.x-110,y:this.world.floorY-60,w:220,h:60,life:150});
        return false;
      }
    }
    if(Game.combatOverlap(fighter,sweep)){
      if(fighter.selectHitBody)bullet.hitBodies=bullet.hitBodies||new Set();
      fighter.takeHit({...bullet,damage:bullet.damage*(this.world.enemyDamageMultiplier||1)});
      if(!fighter.selectHitBody)return false;
    }
    return bullet.x+bullet.w>=0&&bullet.x<=this.world.width&&bullet.y+bullet.h>=0&&bullet.y<=this.world.floorY;
  });
};
Game.CellarEncounter.prototype.spillWine=function(x,y){
  let nearest=null,distance=Infinity;
  for(const object of this.world.objects||[]){
    if(object.type!=='oakBarrel')continue;
    const d=Math.hypot(x-object.x-object.w/2,y-object.y-object.h/2);
    if(d<distance){nearest=object;distance=d;}
  }
  if(!nearest||distance>nearest.w/2+90||nearest.leaking)return;
  nearest.leaking=true;
  this.world.wineLeaks.push({x:nearest.x+nearest.w/2,top:nearest.y+nearest.h*0.75,bottom:nearest.y+nearest.h*0.75,age:0,source:nearest});
};
Game.cellarWineSlow=function(world,actor){
  const touching=(world.wineLeaks||[]).some(leak=>
    Game.aabb(actor,{x:leak.x-16,y:leak.top,w:32,h:Math.max(0,leak.bottom-leak.top)})||
    (leak.bottom>=world.floorY&&Game.aabb(actor,{x:leak.x-Math.min(220,40+leak.age*2)/2,y:world.floorY-14,w:Math.min(220,40+leak.age*2),h:14}))
  );
  return touching?0.55:1;
};
Game.drawCellarWine=function(ctx,world,tick,layer){
  ctx.save();ctx.imageSmoothingEnabled=false;
  ctx.filter=world.timeStopped?'grayscale(1)':'none';
  for(const leak of world.wineLeaks||[]){
    ctx.globalAlpha=Math.min(1,(960-leak.age)/60);
    const height=Math.max(0,leak.bottom-leak.top),x=Math.round(leak.x);
    if(layer==='stream'){
    ctx.fillStyle='#491427';ctx.fillRect(x-16,leak.top,32,height);
    ctx.fillStyle='#78263d';ctx.fillRect(x-8,leak.top,12,height);
    ctx.fillStyle='#aa4c5b';
    for(let y=leak.top+((tick*3)%28);y<leak.bottom-6;y+=28)ctx.fillRect(x-4,y,4,8);
    }
    if(layer==='puddle'&&leak.bottom>=world.floorY){
      const width=Math.min(220,40+leak.age*2);
      ctx.fillStyle='#491427';ctx.fillRect(x-width/2,world.floorY-10,width,10);
      ctx.fillStyle='#78263d';ctx.fillRect(x-width/2+8,world.floorY-12,width-16,4);
      ctx.fillStyle='#aa4c5b';ctx.fillRect(x-20,world.floorY-12,40,2);
    }
  }
  ctx.globalAlpha=1;
  if(layer==='puddle')for(const fire of world.wineFires||[]){
      ctx.globalAlpha=Math.min(1,fire.life/30);
      for(let x=fire.x;x<fire.x+fire.w;x+=12){
        const height=36+Math.round(12*Math.sin(x+tick*0.7));
        ctx.fillStyle='#a63829';ctx.fillRect(x,world.floorY-height,12,height);
        ctx.fillStyle='#e77b35';ctx.fillRect(x+2,world.floorY-height+8,8,height-8);
        ctx.fillStyle='#f4c96d';ctx.fillRect(x+4,world.floorY-16,4,16);
      }
  }
  ctx.restore();
};
Game.CellarEncounter.prototype.attackTransitionSpeed=function(){
  const actor=this.slimes[0];
  // Full health keeps the original pause; near zero health halves it.
  return 2-Game.clamp(actor.hp/actor.maxHp,0,1);
};
Game.CellarEncounter.prototype.planBackhop=function(fighter,facing){
  const actor=this.slimes[0];
  facing=typeof facing==='number'?facing:(fighter.x+fighter.w/2<actor.x+actor.w/2?-1:1);
  const targetX=actor.x-facing*260;
  if(targetX<32||targetX+actor.w>this.world.width-32)return null;
  return {startX:actor.x,targetX,facing};
};
Game.CellarEncounter.prototype.updateEvasion=function(fighter){
  const available=['idle','frontmove','backmove'].includes(this.phase);
  if(fighter.attackT>this.lastAttackT)this.syntheticAttack++;
  this.lastAttackT=fighter.attackT;
  const serial=(fighter.attackSerial||0)+':'+this.syntheticAttack;
  if(this.evasionPending){
    const choice=this.evasionPending;
    if(!available){this.evasionPending=null;return;}
    if(--choice.delay>0)return;
    this.evasionPending=null;
    if(choice.action==='backhop'){
      const plan=this.planBackhop(fighter,choice.facing);
      if(!plan)return;
      this.hopPlan=plan;this.facing=plan.facing;this.phase='backhop';
    }else{this.phase='liedown';this.safeTicks=0;this.proneShots=0;}
    this.phaseTick=0;this.reloadBlocked=false;
    const urgency=1-Game.clamp(this.slimes[0].hp/this.slimes[0].maxHp,0,1);
    this.evasionRest=Math.round(48-12*urgency)+Math.floor(this.random()*(25-4*urgency));
    return;
  }
  if(fighter.attackT<=0||this.seenAttack===serial)return;
  // Notice a visible windup, not its future collision rectangle or impact time.
  const elapsed=(fighter.def.stats.attackTime||16)+(fighter.def.stats.attackRecoverTime||0)-fighter.attackT;
  if(elapsed<2)return;
  this.seenAttack=serial;
  if(!available||this.evasionRest>0)return;
  const actor=this.slimes[0],dx=fighter.x+fighter.w/2-actor.x-actor.w/2;
  const urgency=1-Game.clamp(actor.hp/actor.maxHp,0,1);
  const distance=Math.abs(dx),height=Math.abs(fighter.y+fighter.h-this.world.floorY);
  if(dx*this.facing<=0||dx*fighter.facing>=0||height>230)return;
  const judgedReach=(fighter.combatState?fighter.combatState.reach:490)+(this.random()-0.5)*100;
  if(distance>judgedReach)return;
  const missRoll=this.random();
  const low=fighter.attackKind==='crouch';
  const hop=this.animations.backhop&&this.hopCooldown===0&&this.planBackhop(fighter,this.facing);
  const duck=!low&&this.animations.liedown&&this.duckCooldown===0;
  if(!hop&&!duck)return;
  const preferHop=low?1:distance<300?0.35:0.65;
  const action=hop&&(!duck||this.random()<preferHop)?'backhop':'liedown';
  const missChance=action==='backhop'&&actor.hp<=actor.maxHp*0.1?0:0.22-0.14*urgency;
  if(missRoll<missChance)return;
  const familiar=(low?this.lowFrames:this.airFrames)/this.postureHistory.length;
  this.evasionPending={action,facing:this.facing,delay:action==='backhop'?3:Math.max(3,Math.round(4-urgency)+Math.floor(this.random()*(6-2*urgency))-Math.floor(familiar*2))};
};
Game.CellarEncounter.prototype.observePlayer=function(fighter){
  const previous=this.postureHistory[this.postureIndex];
  this.airFrames-=previous&1?1:0;this.lowFrames-=previous&2?1:0;
  const airborne=!fighter.grounded;
  const low=!airborne&&(fighter.crouching||fighter.slideT>0||fighter.h<=fighter.def.stats.standH*0.65);
  const sample=(airborne?1:0)|(low?2:0);
  this.postureHistory[this.postureIndex]=sample;
  this.postureIndex=(this.postureIndex+1)%this.postureHistory.length;
  this.airFrames+=airborne?1:0;this.lowFrames+=low?1:0;
};
Game.CellarEncounter.prototype.observeTactics=function(fighter){
  const memory=this.tactics,actor=this.slimes[0],attack=fighter.attackT||0;
  memory.pressure=Math.max(0,memory.pressure-1/240);
  memory.damageHeat=Math.max(0,memory.damageHeat-1/180);
  if(memory.punish>0)memory.punish--;
  // Read completed visible swings and their outcome, never the future hitbox.
  if(attack>memory.lastAttackT){memory.pressure=Math.min(1,memory.pressure+0.3);memory.attackHp=actor.hp;}
  if(memory.lastAttackT>0&&attack===0&&memory.attackHp===actor.hp)memory.punish=18;
  memory.lastAttackT=attack;
  if(--memory.rethink<=0){
    memory.range=420+Math.floor(this.random()*61)+Math.round(memory.damageHeat*40);
    memory.rethink=60+Math.floor(this.random()*61);
  }
};
Game.CellarEncounter.prototype.chooseAttack=function(distance){
  const weights=distance<340?{counterkick:35,liedown:25,aim:15,gunready:25}:
    distance<=580?{counterkick:8,liedown:22,aim:45,gunready:25}:
    {counterkick:0,liedown:5,aim:30,gunready:65};
  weights.gunready+=70*this.airFrames/this.postureHistory.length;
  weights.liedown+=70*this.lowFrames/this.postureHistory.length;
  const memory=this.tactics;
  if(distance<440){weights.counterkick+=55*memory.pressure+30*memory.damageHeat;weights.liedown+=20*memory.pressure;}
  if(memory.punish>0){weights.aim+=45;weights.gunready+=distance>340?25:0;}
  if(this.ammo<=2){weights.gunready+=20;weights.counterkick+=distance<340?20:0;}
  if(memory.lastPattern&&weights[memory.lastPattern])weights[memory.lastPattern]*=memory.repeats>=2?0.3:0.65;
  const options=Object.entries(weights).filter(([name,weight])=>weight>0&&
    (name==='liedown'?this.animations.liedown&&this.animations.lieaim&&this.animations.lieshoot:this.animations[name]));
  if(!options.length)return 'aim';
  let roll=this.random()*options.reduce((total,[,weight])=>total+weight,0);
  for(const [name,weight] of options){roll-=weight;if(roll<0)return name;}
  return options[options.length-1][0];
};
Game.CellarEncounter.prototype.counterFrame=function(){
  if(this.counterMode==='guard')return 1;
  if(this.counterMode==='cancel')return 2;
  if(this.counterMode==='kick')return Math.min(9,3+Math.floor(this.phaseTick/4));
  return 0;
};
Game.CellarEncounter.prototype.fireProneBullet=function(){
  if(this.ammo<=0)return;
  this.ammo--;this.proneShots=Math.max(0,this.proneShots-1);
  const actor=this.slimes[0];
  this.bullets.push({x:actor.x+actor.w/2+this.facing*144,y:this.world.floorY-47,w:16,h:6,vx:this.facing*40,damage:18});
};
Game.CellarEncounter.prototype.startReload=function(){
  this.phase='reload';this.phaseTick=0;this.reloadLoop=false;this.reloadClosing=false;this.reloadInterrupted=false;
  this.reticle=null;this.lockedTarget=null;
};
Game.CellarEncounter.prototype.reloadFrame=function(){
  if(this.reloadClosing)return 6;
  return (this.reloadLoop?3:0)+Math.floor(this.phaseTick/Game.cellarReloadFrameTicks);
};
Game.CellarEncounter.prototype.fireBullet=function(){
  if(this.ammo<=0)return false;
  this.ammo--;
  const actor=this.slimes[0],center=actor.x+actor.w/2;
  const rapidFire=this.burst||this.phase==='panning';
  this.bullets.push({x:center+this.facing*140,y:this.world.floorY-133,w:16,h:6,vx:this.facing*40,damage:18,rapidFire,invuln:rapidFire?false:undefined});
};
Game.CellarEncounter.prototype.totalHp=function(){return this.slimes.reduce((sum,enemy)=>sum+enemy.hp,0);};
Game.CellarEncounter.prototype.resolveContact=function(fighter){
  const actor=this.slimes[0];
  if(actor.hp>0&&fighter.kickHit&&Game.aabb(fighter.kickHit,actor)){
    Game.damageEnemy(actor,fighter.def.stats.kickDamage,fighter);
    fighter.onKickConnect();
  }
};
Game.CellarEncounter.prototype.drawAmmo=function(ctx){
  const actor=this.slimes[0],x=Math.round(actor.x+actor.w/2-this.maxAmmo*8),y=Math.round(actor.y-64);
  ctx.save();
  for(let i=0;i<this.maxAmmo;i++){
    const bx=x+i*16,loaded=i<this.ammo;
    ctx.fillStyle=loaded?'#dd9339':'#423534';
    ctx.fillRect(bx+3,y+1,4,3);ctx.fillRect(bx+1,y+4,8,13);ctx.fillRect(bx,y+18,10,3);
    ctx.fillStyle=loaded?'#f8f4e9':'#5c4e46';ctx.fillRect(bx+2,y+5,2,10);
  }
  ctx.restore();
};
Game.CellarEncounter.prototype.draw=function(ctx){
  if(!this.image||this.totalHp()<=0)return;
  const actor=this.slimes[0], frame=Math.floor(this.tick/8)%16;
  ctx.imageSmoothingEnabled=false;
  if((this.phase==='idle'&&!(this.damageTicks>0&&this.animations&&this.animations.damage))||!this.animations){
    const anchor=Game.cellarSpriteAnchors.idle;
    ctx.save();ctx.translate(actor.x+actor.w/2,this.world.floorY);ctx.scale(this.facing,1);
    ctx.drawImage(this.image,frame*201,0,201,201,-anchor.x,-anchor.y,201,201);ctx.restore();
  }else{
    const animation=this.phase!=='counterkick'&&this.animations.damage&&(this.damageTicks>0||(this.phase==='reload'&&this.reloadDamageTicks>0))?'damage':this.phase==='jump'&&this.jumpPlan&&this.jumpPlan.plunging&&this.phaseTick>=Game.cellarJumpTiming.shotStart&&this.phaseTick<Game.cellarJumpTiming.apex?'plungingfire':this.phase==='fastlock'?'gunready':this.phase;
    const sheet=this.animations[animation];
    if(sheet){
      const timing=Game.cellarRevolverTiming;
      const index=animation==='plungingfire'?Math.min(5,Math.floor(Math.max(0,this.phaseTick-Game.cellarJumpTiming.shotStart)/Game.cellarJumpTiming.shotFrameTicks)):animation==='jump'?(this.phaseTick<12?0:this.phaseTick<60?1:this.phaseTick<108?2:3):animation==='backhop'?(this.phaseTick<1?0:this.phaseTick<4?1:this.phaseTick<16?2:this.phaseTick<28?3:4):animation==='counterkick'?this.counterFrame():animation==='damage'?0:this.phase==='reload'?this.reloadFrame():(this.phase==='frontmove'||this.phase==='backmove')?Math.floor(this.phaseTick/5)%sheet.count:this.phase==='lieaim'?Math.min(7,Math.floor(this.phaseTick/4)):this.phase==='lieshoot'?Math.min(5,Math.floor(this.phaseTick/4)):this.phase==='liedown'?Math.min(5,Math.floor(this.phaseTick/3)):this.phase==='rise'?Math.min(7,Math.floor(this.phaseTick/4)):this.phase==='gunready'?Math.floor(this.phaseTick/4)%8:this.phase==='fastlock'?7:this.phase==='holster'?Math.min(11,Math.floor(this.phaseTick/timing.holsterFrameTicks)):this.phase.startsWith('fastshoot')?0:this.phase==='panning'?Math.floor(this.phaseTick/timing.panningFrameTicks)%timing.frames:Math.min(timing.frames-1,Math.floor(this.phaseTick/(this.phase==='aim'?timing.aimFrameTicks:timing.shotFrameTicks)));
      const anchor=Game.cellarSpriteAnchors[animation];
      ctx.save();ctx.translate(actor.x+actor.w/2,(this.phase==='jump'||this.phase==='backhop'||this.phase==='damage')?actor.y+actor.h:this.world.floorY);ctx.scale(this.facing*sheet.scale,sheet.scale);
      if(sheet.frames){
        const padding=sheet.padding||0;
        ctx.drawImage(sheet.frames[index],-anchor.x-padding,-anchor.y-padding);
      }else ctx.drawImage(sheet.source,index*sheet.cell,0,sheet.cell,sheet.height,-anchor.x,-anchor.y,sheet.cell,sheet.height);
      ctx.restore();
    }
  }
  this.drawAmmo(ctx);
  if(Game.debug){
    ctx.save();ctx.font='16px monospace';ctx.textAlign='center';ctx.fillStyle='#fed8c1';
    ctx.fillText('탄약 '+this.ammo+' / '+this.maxAmmo,actor.x+actor.w/2,actor.y-72);ctx.restore();
  }
  ctx.fillStyle='#e6d4a6';
  this.bullets.forEach(bullet=>ctx.fillRect(bullet.x,bullet.y,bullet.w,bullet.h));
  if(this.reticle&&Game.cellarShowReticle){
    const r=this.reticle;ctx.save();ctx.strokeStyle=this.phase==='fastlock'?'#ef6554':'#dd9339';ctx.lineWidth=3;
    ctx.beginPath();ctx.arc(r.x,r.y,56,0,Math.PI*2);ctx.moveTo(r.x-72,r.y);ctx.lineTo(r.x+72,r.y);ctx.moveTo(r.x,r.y-72);ctx.lineTo(r.x,r.y+72);ctx.stroke();ctx.restore();
  }
  if(this.exclamation>0){ctx.fillStyle='#fed8c1';ctx.fillRect(actor.x+actor.w/2-4,this.world.floorY-230,8,18);ctx.fillRect(actor.x+actor.w/2-4,this.world.floorY-207,8,6);}
  if(this.fastImpact){ctx.save();ctx.strokeStyle='#dd9339';ctx.lineWidth=3;ctx.strokeRect(this.fastImpact.x,this.fastImpact.y,this.fastImpact.w,this.fastImpact.h);ctx.restore();}
};

