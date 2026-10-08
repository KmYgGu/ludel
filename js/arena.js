// Registry contract: a boss exposes bodies and visible combat state, never player input.
Game.ArenaBosses=new Map();
Game.registerArenaBoss=function(id,definition){Game.ArenaBosses.set(id,definition);};
Game.registerArenaBoss('slime',{
  stage:'outerWall',name:Game.Bosses.slime.name,create:world=>new Game.SlimeEncounter(world),
  attach(e,assets){e.image=assets.slime;e.reactionsImage=assets.reactions;},
  place(e,x){e.slimes[0].cx=x;e.sync(e.slimes[0]);},
  state(e,body){
    const airborne=body.feet<e.floorY-2;
    const attacking=!!body.press||body.ceilingState==='fall'||body.bouncing;
    return {phase:attacking?(body.press||body.ceilingState||'bounce'):'idle',attacking,
      grounded:!airborne,low:!airborne,kind:airborne?'air':'crouch',
      facing:Math.sign(body.vx)||1,reach:body.spriteW/2+120,hitbox:body.attack,
      projectiles:e.waves};
  }
});
Game.registerArenaBoss('cellar',{
  stage:'wineCellar',name:Game.Bosses.cellar.title,create:world=>new Game.CellarEncounter(world),
  attach(e,assets){e.image=assets.cellar;e.animations=assets.animations;},
  place(e,x){e.slimes[0].x=x-e.slimes[0].w/2;},
  state(e,body){
    const attacking=['aim','oneshoot','panning','gunready','fastlock','fastshoot1','fastshoot2','lieaim','lieshoot','counterkick','jump'].includes(e.phase);
    return {phase:e.phase,attacking,grounded:body.y+body.h>=e.world.floorY-2,
      low:body.h<130,kind:body.h<130?'crouch':'stand',facing:e.facing,reach:e.phase==='counterkick'?240:900,
      hitbox:e.fastImpact||{x:body.x+(e.facing>0?body.w:-240),y:body.y,w:240,h:body.h},projectiles:e.bullets};
  }
});

Game.ArenaTarget=function(team,attacker,world){
  this.team=team;this.attacker=attacker;this.world=world;this.body=null;this.cues=new WeakMap();this.serial=0;
  this.kickInvuln=0;this.kickHit=null;this.slideT=0;this.kicking=false;
  this.def={stats:{standH:195,attackTime:60,attackRecoverTime:0,kickDamage:0}};
  for(const key of ['x','y','w','h','hp'])Object.defineProperty(this,key,{get:()=>this.body?this.body[key]:0});
};
Game.ArenaTarget.prototype.refresh=function(){
  this.hitBodies=null;
  const source=this.attacker.encounter.slimes.find(b=>b.hp>0);
  const center=source?source.x+source.w/2:0;
  this.body=this.team.encounter.slimes.filter(b=>b.hp>0).sort((a,b)=>Math.abs(a.x+a.w/2-center)-Math.abs(b.x+b.w/2-center))[0]||null;
  if(!this.body)return;
  const s=this.team.definition.state(this.team.encounter,this.body);
  let cue=this.cues.get(this.body);
  if(!cue||cue.phase!==s.phase){cue={phase:s.phase,elapsed:0,serial:++this.serial};this.cues.set(this.body,cue);}else cue.elapsed++;
  this.combatState=s;this.grounded=s.grounded;this.crouching=s.low;this.facing=s.facing;
  this.attackKind=s.kind;this.attackT=s.attacking?Math.max(1,60-cue.elapsed):0;this.attackSerial=cue.serial;
  this.attackHit=s.attacking?s.hitbox:null;this.knives=s.projectiles||[];
};
Game.ArenaTarget.prototype.hurtBox=function(){return this.body||{x:0,y:0,w:0,h:0};};
Game.ArenaTarget.prototype.whipAttackBox=function(){return this.attackHit;};
Game.ArenaTarget.prototype.selectHitBody=function(box){
  this.hitBodies=this.team.encounter.slimes.filter(b=>b.hp>0&&Game.aabb(b,box));
  if(this.hitBodies.length)this.body=this.hitBodies[0];return this.hitBodies.length>0;
};
Game.ArenaTarget.prototype.takeHit=function(hit){
  const bodies=this.hitBodies||[this.body];this.hitBodies=null;this.damagedBodies=[];
  const source=this.attacker.encounter.slimes.find(b=>b.hp>0)||hit;
  for(const body of bodies){
  if(!body||body.hp<=0||(hit.continuous&&body.arenaMercy>0)||(hit.hitBodies&&hit.hitBodies.has(body)))continue;
  const hp=body.hp;
  delete body.arenaLaunch;
  Game.damageEnemy(body,hit.damage,{x:source.x,y:source.y,w:source.w,h:source.h,attackHit:hit});
  if(body.hp>=hp)continue;
  if(hit.hitBodies)hit.hitBodies.add(body);
  if(hit.continuous)body.arenaMercy=36;
  this.damagedBodies.push(body);
  }
  return this.damagedBodies.length>0;
};
Game.ArenaTarget.prototype.launchFromCounter=function(hit,direction){
  if(!this.takeHit(hit))return false;
  for(const body of this.damagedBodies)if(body.cx!=null){
    body.press=null;body.ceilingState=null;
    body.arenaLaunch={direction,wall:false};body.feet-=40;
    body.vx=direction*28;body.vy=-3;body.bouncing=true;
  }
  return true;
};
Game.ArenaTarget.prototype.onKickConnect=function(){};

Game.arena={active:false,assets:null,last:null,acc:0,teams:[],result:null,seen:new Set(),random:Math.random,
  loadRecords(){try{const data=JSON.parse(localStorage.getItem('rubania-boss-encounters')||'[]');if(Array.isArray(data))this.seen=new Set(data.filter(id=>Game.ArenaBosses.has(id)));}catch(_){}},
  encounterStage(stage){
    for(const [id,boss] of Game.ArenaBosses)if(boss.stage===stage)this.seen.add(id);
    try{localStorage.setItem('rubania-boss-encounters',JSON.stringify([...this.seen]));}catch(_){}
    if(this.assets)this.refreshMenu();
  },
  pairs(){const available=[...Game.ArenaBosses].filter(([id])=>this.seen.has(id));return available.flatMap(([id,a],i)=>available.slice(i+1).filter(([,b])=>a.stage!==b.stage).map(([other])=>[id,other]));},
  unlocked(){return this.pairs().length>0;},
  setup(assets){
    this.assets=assets;this.loadRecords();this.refreshMenu();
    document.getElementById('arena-start').addEventListener('click',()=>this.startSelected());
    document.getElementById('arena-replay').addEventListener('click',()=>this.start(this.ids));
    document.getElementById('arena-exit').addEventListener('click',()=>window.location.reload());
    document.getElementById('arena-pause').addEventListener('click',()=>{if(Game.pause)Game.pause();});
  },
  refreshMenu(){
    const button=document.getElementById('open-arena');button.disabled=!this.unlocked();
    button.textContent=this.unlocked()?'투기장':'투기장 · 보스 2종 조우 시 해금';
    const select=document.getElementById('arena-match');select.replaceChildren();
    this.pairs().forEach(pair=>{const option=document.createElement('option');option.value=pair.join('|');option.textContent=pair.map(id=>Game.ArenaBosses.get(id).name).join(' VS ');select.appendChild(option);});
  },
  startSelected(){const pair=document.getElementById('arena-match').value.split('|');this.start(pair);},
  start(ids){
    const definitions=ids.map(id=>Game.ArenaBosses.get(id));
    if(ids.length!==2||definitions.some(d=>!d)||definitions[0].stage===definitions[1].stage||ids.some(id=>!this.seen.has(id)))return false;
    const stageId=definitions[Math.floor(this.random()*2)].stage;
    const stage=Game.Stages[stageId],width=stageId==='outerWall'?1280:1920;
    const world={width,viewportWidth:1280,height:720,floorY:660,ceilingY:20,arenaOrigin:0,enemyDamageMultiplier:1,timeStopped:false,
      solids:[{x:0,y:660,w:width,h:60,oneWay:false}],objects:[],wineLeaks:[],wineFires:[]};
    if(stageId==='outerWall')world.solids.push({x:0,y:0,w:width,h:20},Game.createOuterWallPlatform());
    else world.objects=stage.objects.map(o=>({...o}));
    this.ids=ids.slice();this.stage=stage;this.world=world;this.result=null;this.tick=0;this.last=null;this.acc=0;
    this.teams=definitions.map((definition,i)=>{
      const encounter=definition.create(world);definition.attach(encounter,this.assets);definition.place(encounter,width*(i===0?0.24:0.76));
      return {id:ids[i],definition,encounter};
    });
    this.targets=this.teams.map((team,i)=>new Game.ArenaTarget(this.teams[1-i],team,world));
    this.targets.forEach(t=>t.refresh());Game.hitEffects=[];Game.screenShake=null;
    this.active=true;Game.paused=false;Game.menu.active=false;
    document.getElementById('title-screen').hidden=true;document.getElementById('arena-controls').hidden=false;
    document.getElementById('arena-result').textContent='';document.getElementById('arena-stage').textContent=stage.name+' · 관전';
    if(Game.resetMobileInput)Game.resetMobileInput();
    if(Game.lockMobilePortrait)Game.lockMobilePortrait();
    return true;
  },
  step(){
    if(this.result)return;
    this.tick++;
    this.teams.forEach(team=>team.encounter.slimes.forEach(body=>{if(body.arenaMercy>0)body.arenaMercy--;}));
    this.targets.forEach(t=>t.refresh());
    // Alternate the first updater each frame, avoiding a permanent initiative advantage.
    for(const i of this.tick%2?[0,1]:[1,0]){
      const team=this.teams[i],target=this.targets[i];if(!target.body||team.encounter.totalHp()<=0)continue;
      const before=new Map(team.encounter.slimes.map(b=>[b,{x:b.x,cx:b.cx}]));
      team.encounter.update(target);
      team.encounter.slimes.forEach(body=>{
        const previous=before.get(body);if(!previous)return;
        const slow=Game.cellarWineSlow(this.world,body);
        if(body.cx!=null){body.cx=previous.cx+(body.cx-previous.cx)*slow;team.encounter.sync(body);}else body.x=previous.x+(body.x-previous.x)*slow;
        if(body.arenaLaunch){
          const flight=body.arenaLaunch,half=body.spriteW/2;
          if(!flight.wall){body.vx=flight.direction*28;const wall=flight.direction>0?this.world.width-half:half;
            if(Math.abs(body.cx-wall)<2){flight.wall=true;body.vx=0;body.vy=1;this.shake=18;}}
          else{body.vx=0;if(body.feet>=this.world.floorY){delete body.arenaLaunch;}}
        }
      });
      team.encounter.resolveContact(target);
    }
    if(this.stage.id==='outerWall')Game.updateOuterWallPlatforms(this.world,{hp:0},this.teams.flatMap(t=>t.encounter.slimes));
    Game.updateHitEffects();
    const dead=this.teams.map(t=>t.encounter.totalHp()<=0);
    if(dead.some(Boolean)){
      this.result=dead.every(Boolean)?'무승부':this.teams[dead[0]?1:0].definition.name+' 승리';
      document.getElementById('arena-result').textContent=this.result;
    }
  },
  frame(time,ctx){
    if(this.last==null)this.last=time;
    this.acc+=Math.min(100,time-this.last);this.last=time;
    while(this.acc>=1000/60){this.step();this.acc-=1000/60;}
    this.draw(ctx);
  },
  draw(ctx){
    const world=this.world,scale=1280/world.width;
    ctx.fillStyle='#100e16';ctx.fillRect(0,0,1280,720);ctx.save();ctx.translate(0,(720-720*scale)/2);ctx.scale(scale,scale);
    if(this.shake>0){ctx.translate(Math.sin(this.shake)*8,0);this.shake--;}
    const image=this.stage.id==='outerWall'?this.assets.outerWall:this.assets.wineCellar;
    if(image)ctx.drawImage(image,0,0,world.width,720);
    for(const solid of world.solids){if(solid.state==='waiting')continue;ctx.save();ctx.translate(solid.x+solid.w/2,solid.y+solid.h/2);ctx.rotate(solid.angle||0);
      ctx.fillStyle=solid.oneWay?this.stage.stone.platform:this.stage.stone.face;ctx.fillRect(-solid.w/2,-solid.h/2,solid.w,solid.h);
      ctx.fillStyle=this.stage.stone.highlight;ctx.fillRect(-solid.w/2,-solid.h/2,solid.w,3);ctx.restore();}
    const gunner=this.teams.find(t=>t.encounter.bullets)?.encounter;
    if(gunner&&gunner.fastFlash>0){ctx.fillStyle='rgba(255,255,255,'+gunner.fastFlash/10*.85+')';ctx.fillRect(0,0,world.width,720);}
    if(this.assets.barrel)for(const object of world.objects)ctx.drawImage(this.assets.barrel,object.x,object.y,object.w,object.h);
    Game.drawCellarWine(ctx,world,this.tick,'stream');
    this.teams.forEach(team=>team.encounter.draw(ctx));
    Game.drawCellarWine(ctx,world,this.tick,'puddle');Game.drawHitEffects(ctx);ctx.restore();
    this.teams.forEach((team,i)=>{
      const node=document.getElementById('arena-health-'+i),hp=Math.ceil(team.encounter.totalHp());
      node.textContent=team.definition.name+' '+hp+' / '+team.encounter.def.maxHp;
      document.getElementById('arena-bar-'+i).value=hp;document.getElementById('arena-bar-'+i).max=team.encounter.def.maxHp;
    });
  }
};
Game.arena.loadRecords();
