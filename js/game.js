(function () {
  let stage = Game.Stages.outerWall;
  let cellarImage = null;
  let cellarAnimations = null;
  let cellarBackground = null;
  let cellarBarrel = null;
  let stageImage = null;
  const VIEW_WIDTH=1280;
  const camera=Game.createCamera(VIEW_WIDTH);camera.x=0;camera.left=100;
  const WORLD = {
    width: 1280,
    viewportWidth: VIEW_WIDTH,
    arenaOrigin: 0,
    height: 720,
    floorY: 660,
    bg: stage.stone.shadow,
    ceilingY: 20,
    solids: [
      { x: 0, y: 660, w: 1280, h: 60, oneWay: false },
      { x: 0, y: 0, w: 1280, h: 20, oneWay: false },
      Game.createOuterWallPlatform()
    ],
    enemies: null,
    timer: Game.createStageTimer(120),
    enemyDamageMultiplier: 1
  };

  let slimeDef = Game.Bosses.slime;
  let encounter = new Game.SlimeEncounter(WORLD);

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  WORLD.enemies = encounter.slimes;
  Game.Hud.updateBossDamage(encounter,0);

  const input = new Game.Input();
  const fighter = new Game.Fighter(JSON.parse(JSON.stringify(Game.Characters.rubania)), { x: 80, y: WORLD.floorY - Game.Characters.rubania.stats.standH });
  input.bind(fighter);
  if(Game.bindPause)Game.bindPause(function(){
    return !(Game.menu&&Game.menu.active) && !Game.deathState && !(Game.shop&&Game.shop.active);
  },function(){
    if(Game.resetMobileInput)Game.resetMobileInput();
    Object.assign(input,new Game.Input());last=0;feedbackLast=null;acc=0;
  });
  canvas.addEventListener('mousedown', function (event) {
    if (event.button !== 1) return;
    event.preventDefault();
    if (Game.paused || (Game.menu && Game.menu.active) || Game.stageIntro || Game.clearSequence || (Game.shop && Game.shop.active) || (fighter.hp <= 0 && !fighter.allowZeroHp)) return;
    encounter.slimes.forEach(function (slime) { slime.hp = 0; });
    encounter.waves = [];
  });
  canvas.addEventListener('auxclick', function (event) { if (event.button === 1) event.preventDefault(); });
  if (Game.menu) Game.menu.onStart = function () {
    if (Game.debugTools && Game.menu.startStage === 'wineCellar') {
      Game.shop.onNext();
      return;
    }
    Game.beginStageIntro('outerWall', stage.name, slimeDef.name);
  };
  function enterCellar() {
    stage=Game.Stages.wineCellar;slimeDef=Game.Bosses.cellar;stageImage=cellarBackground;
    WORLD.width=1920;WORLD.arenaOrigin=0;
    WORLD.bg=stage.stone.shadow;
    WORLD.solids=[{x:0,y:WORLD.floorY,w:WORLD.width,h:60,oneWay:false}];
    WORLD.objects=Game.Stages.wineCellar.objects.map(object=>({...object}));
    WORLD.timeStopped=false;WORLD.timer=Game.createStageTimer(120);WORLD.enemyDamageMultiplier=1;
    const preserved={sheets:fighter.sheets,hp:fighter.hp,mp:fighter.mp,lives:fighter.lives,
      ownedSubweapons:fighter.ownedSubweapons,subweapon:fighter.subweapon,healPurchases:fighter.healPurchases,
      weaponPurchases:fighter.weaponPurchases,knowsCellarBoss:fighter.knowsCellarBoss};
    Object.assign(fighter,new Game.Fighter(fighter.def,{x:80,y:WORLD.floorY-fighter.def.stats.standH}),preserved);
    fighter.allowZeroHp=false;
    encounter=new Game.CellarEncounter(WORLD);encounter.image=cellarImage;encounter.animations=cellarAnimations;WORLD.enemies=encounter.slimes;
    Game.clearSequence=null;Game.hitEffects=[];Game.deathState=null;camera.x=0;Game.screenShake=null;
    Object.assign(input,new Game.Input());playFrames=0;recorded=false;acc=0;
    Game.beginStageIntro(stage.id,stage.name,Game.cellarBossLabel(fighter));
    Game.shop.onNext=null;
  }
  if(Game.shop)Game.shop.onNext=enterCellar;

  function drawStageIntro() {
    const intro = Game.stageIntro;
    if (!intro) return;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0," + intro.opacity * 0.65 + ")";
    ctx.fillRect(0, 0, VIEW_WIDTH, WORLD.height);
    ctx.globalAlpha = intro.opacity;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#e3d8c5";
    ctx.font = "40px serif";
    ctx.fillText(intro.location, VIEW_WIDTH / 2, WORLD.height / 2 - 24);
    ctx.fillStyle = "#b6a5a5";
    ctx.font = "20px serif";
    ctx.fillText(intro.enemyName, VIEW_WIDTH / 2, WORLD.height / 2 + 28);
    ctx.restore();
  }

  function drawWorld() {
    ctx.save();
    ctx.filter = fighter.clockActive ? "grayscale(1)" : "none";
    ctx.fillStyle = WORLD.bg;
    ctx.fillRect(0, 0, Math.max(WORLD.width,VIEW_WIDTH), WORLD.height);
    if (stageImage) {
      ctx.imageSmoothingEnabled = false;
      if(stage.id==='wineCellar')ctx.drawImage(stageImage,0,0,stageImage.width,stageImage.height,0,0,WORLD.width,WORLD.height);
      else for(let x=WORLD.arenaOrigin-VIEW_WIDTH;x<WORLD.width;x+=VIEW_WIDTH)ctx.drawImage(stageImage,0,0,stageImage.width,stageImage.height,x,0,VIEW_WIDTH,WORLD.height);
    }
    WORLD.solids.forEach(function (s, i) {
      if(s.state==='waiting')return;
      ctx.save();
      if(s.crumbling){ctx.translate(s.x+s.w/2,s.y+s.h/2);ctx.rotate(s.angle);ctx.translate(-s.x-s.w/2,-s.y-s.h/2);}
      const stone = stage.stone;
      ctx.fillStyle = stone.shadow;
      ctx.fillRect(s.x, s.y, s.w, s.h);
      for (let row = 0; row < s.h; row += 20) {
        const offset = Math.floor(row / 20) % 2 ? -30 : 0;
        for (let col = offset; col < s.w; col += 60) {
          const x = Math.max(0, col);
          const width = Math.min(col + 58, s.w) - x;
          if (width <= 0) continue;
      ctx.fillStyle = s.oneWay ? stone.platform : stone.face;
          ctx.fillRect(s.x + x, s.y + row + 2, width, Math.min(16, s.h - row - 2));
        }
      }
      ctx.fillStyle = stone.edge;
      ctx.fillRect(s.x, s.y, s.w, s.oneWay ? 4 : 2);
      if (s.oneWay) {
        ctx.fillStyle = stone.highlight;
        ctx.fillRect(s.x, s.y, s.w, 3);
        ctx.fillStyle = stone.shadow;
        ctx.fillRect(s.x, s.y + s.h - 3, s.w, 3);
      }
      ctx.restore();
    });
    ctx.fillStyle = stage.stone.face;
    if(stage.id!=='wineCellar')ctx.fillRect(0, WORLD.ceilingY, 6, WORLD.floorY - WORLD.ceilingY);
    if(stage.id!=='wineCellar')ctx.fillRect(WORLD.width - 6, WORLD.ceilingY, 6, WORLD.floorY - WORLD.ceilingY);
    ctx.restore();
    if(encounter.fastFlash>0){
      ctx.save();ctx.fillStyle='rgba(255,255,255,'+(encounter.fastFlash/10*0.85)+')';
      ctx.fillRect(0,0,WORLD.width,WORLD.height);ctx.restore();
    }
    if(stage.id==='wineCellar'&&cellarBarrel){
      ctx.save();ctx.imageSmoothingEnabled=false;
      ctx.filter=fighter.clockActive?'grayscale(1)':'none';
      // The foreground rack follows the actual barrel rows exactly.
      ctx.fillStyle='#291b1c';
      ctx.fillRect(314,116,16,544);ctx.fillRect(1590,116,16,544);
      [300,480,660].forEach(y=>{
        ctx.fillStyle='#291b1c';ctx.fillRect(314,y-4,1292,8);
        ctx.fillStyle='#45302a';ctx.fillRect(314,y-4,1292,2);
      });
      (WORLD.objects||[]).forEach(object=>ctx.drawImage(cellarBarrel,object.x,object.y==null?WORLD.floorY-object.h:object.y,object.w,object.h));
      ctx.restore();
    }
    if(stage.id==='wineCellar')Game.drawCellarWine(ctx,WORLD,encounter.tick,'stream');
    ctx.save();
    ctx.filter = fighter.clockActive && !encounter.def.timeStopImmune ? "grayscale(1)" : "none";
    encounter.draw(ctx);
    ctx.restore();
  }

  function drawScene(effects) {
    ctx.save();ctx.translate(-Math.round(camera.x),0);
    drawWorld();
    fighter.draw(ctx);
    if(stage.id==='wineCellar')Game.drawCellarWine(ctx,WORLD,encounter.tick,'puddle');
    if(effects){Game.drawHitEffects(ctx);drawClockPulse();}
    ctx.restore();
  }
  function drawClockPulse() {
    if (fighter.clockPulse <= 0) return;
    const progress = (36 - fighter.clockPulse) / 36;
    ctx.save();
    ctx.strokeStyle = "rgba(210,235,255," + (1 - progress) + ")";
    ctx.lineWidth = 4;
    const cx = fighter.x + fighter.w / 2;
    const cy = fighter.y + fighter.h / 2;
    for (let i = 0; i < 3; i++) {
      const radius = progress * 1000 - i * 65;
      if (radius <= 0) continue;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBossHud() {
    Game.Hud.boss(ctx,stage.id==='wineCellar'?Game.cellarBossLabel(fighter):slimeDef.name,encounter.totalHp(),slimeDef.maxHp,VIEW_WIDTH,WORLD.height,encounter.hpFeedback);
  }
  function drawHp(actor) { Game.Hud.player(ctx, actor); }

  function drawTimer() {
    const scale=Game.mobileHudScale?Game.mobileHudScale():1;
    const seconds = Math.ceil(WORLD.timer.remainingFrames / 60);
    const label = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    if(Game.drawMobileTimer && Game.drawMobileTimer(WORLD,label))return;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#111018';
    const timerWidth=scale>1?96*scale:176;
    ctx.fillRect(VIEW_WIDTH / 2 - timerWidth/2, 12, timerWidth, 56*scale);
    ctx.fillStyle = WORLD.timer.expired ? '#ed7465' : WORLD.timeStopped ? '#9fc9df' : '#e3d8c5';
    ctx.font = 26*scale+'px monospace';
    ctx.fillText(label, VIEW_WIDTH / 2, 12+27*scale);
    ctx.font = 12*scale+'px sans-serif';
    ctx.fillText(WORLD.timer.expired ? '적 공격력 ×2' : WORLD.timeStopped ? '시간 정지' : '제한 시간', VIEW_WIDTH / 2, 12+46*scale);
    ctx.restore();
  }

  let last = 0;
  let feedbackLast = null;
  let acc = 0;
  let playFrames = 0;
  let recorded = false;
  function showDeath() {
    const canRetry = Game.consumeLife(fighter);
    const checkpoint=Game.shop&&Game.shop.checkpoint;
    if(stage.id==='wineCellar'&&checkpoint)checkpoint.deaths++;
    const canReturnShop=!!(canRetry&&stage.id==='wineCellar'&&checkpoint&&checkpoint.lives>checkpoint.deaths);
    Game.deathState = { canRetry: canRetry,canReturnShop };
    document.getElementById('death-screen').hidden = false;
    document.getElementById('death-title').textContent = canRetry ? '쓰러졌습니다' : 'GAME OVER';
    document.getElementById('death-message').textContent = canRetry ? '남은 잔기 ' + fighter.lives + ' · 같은 스테이지에서 다시 시작합니다.' : '모든 잔기를 소모했습니다.';
    document.getElementById('retry-stage').hidden = !canRetry;
    document.getElementById('return-shop').hidden = !canReturnShop;
    document.getElementById('new-game').hidden = canRetry;
    document.getElementById(canRetry ? 'retry-stage' : 'new-game').focus();
  }
  document.getElementById('retry-stage').addEventListener('click', function () {
    if (!Game.deathState || !Game.deathState.canRetry) return;
    const preserved = { sheets: fighter.sheets, lives: fighter.lives, ownedSubweapons: fighter.ownedSubweapons,
      healPurchases: fighter.healPurchases, weaponPurchases: fighter.weaponPurchases, subweapon: fighter.subweapon, knowsCellarBoss: fighter.knowsCellarBoss };
    Object.assign(fighter, new Game.Fighter(fighter.def, {x:80+WORLD.arenaOrigin,y:WORLD.floorY-fighter.def.stats.standH}), preserved);
    const image=encounter.image, reactionsImage=encounter.reactionsImage,animations=encounter.animations;
    if(stage.id==='wineCellar')WORLD.objects=Game.Stages.wineCellar.objects.map(object=>({...object}));
    else WORLD.solids=WORLD.solids.filter(s=>!s.crumbling).concat(Game.createOuterWallPlatform());
    encounter=stage.id==='wineCellar'?new Game.CellarEncounter(WORLD):new Game.SlimeEncounter(WORLD);encounter.image=image;encounter.reactionsImage=reactionsImage;encounter.animations=animations;
    camera.x=WORLD.arenaOrigin;Game.screenShake=null;WORLD.enemies=encounter.slimes;WORLD.timeStopped=false;WORLD.timer=Game.createStageTimer(120);WORLD.enemyDamageMultiplier=1;
    Object.assign(input,new Game.Input());Game.hitEffects=[];Game.deathState=null;
    document.getElementById('death-screen').hidden=true;
    playFrames=0;recorded=false;acc=0;
  });
  document.getElementById('new-game').addEventListener('click', function () { window.location.reload(); });
  document.getElementById('return-shop').addEventListener('click',function(){
    if(!Game.deathState||!Game.deathState.canReturnShop)return;
    const checkpoint=Game.shop.checkpoint;
    Game.restoreShopCheckpoint(fighter,checkpoint);Game.shop.learned=new Set(checkpoint.learned);
    Game.deathState=null;Game.clearSequence=null;Game.hitEffects=[];Game.screenShake=null;WORLD.timeStopped=false;
    document.getElementById('death-screen').hidden=true;
    Game.shop.onNext=enterCellar;Game.shop.open(checkpoint.points,fighter,true);acc=0;
  });
  function drawClearScore() {
    const sequence = Game.clearSequence;
    const elapsed = sequence.elapsed;
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.65)';
    ctx.fillRect(0, 0, VIEW_WIDTH, WORLD.height);
    ctx.fillStyle = '#17151e';
    ctx.fillRect(350, 175, 580, 370);
    ctx.strokeStyle = '#726679';
    ctx.strokeRect(350, 175, 580, 370);
    ctx.textAlign = 'center';
    ctx.font = '30px serif';
    ctx.fillStyle = '#e3d8c5';
    ctx.fillText('스테이지 클리어', 640, 230);
    let subtotal = 0;
    sequence.result.rows.forEach(function (row, i) {
      const progress = Game.clamp((elapsed - 500 - i * 700) / 600, 0, 1);
      const amount = Math.floor(row.score * progress);
      subtotal += amount;
      if (elapsed < 500 + i * 700) return;
      ctx.globalAlpha = Math.min(1, progress * 4);
      ctx.textAlign = 'left';
      ctx.font = '20px sans-serif';
      ctx.fillStyle = i === 2 && row.score ? '#e7c985' : '#c6bec4';
      ctx.fillText(row.label, 390, 295 + i * 45);
      ctx.textAlign = 'right';
      ctx.fillText(amount.toLocaleString() + ' 점', 890, 295 + i * 45);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = 'center';
    ctx.font = '24px sans-serif';
    ctx.fillStyle = '#e3d8c5';
    ctx.fillText('합계  ' + subtotal.toLocaleString() + ' 점', 640, 510);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,' + sequence.darkness + ')';
    ctx.fillRect(0, 0, VIEW_WIDTH, WORLD.height);
    ctx.restore();
  }
  function loop(t) {
    if(Game.paused){last=t;feedbackLast=t;acc=0;requestAnimationFrame(loop);return;}
    const feedbackTicks=feedbackLast==null?0:Math.min(100,Math.max(0,t-feedbackLast))*60/1000;
    feedbackLast=t;
    Game.Hud.updateDamage(fighter,feedbackTicks,camera.x);
    Game.Hud.updateBossDamage(encounter,feedbackTicks);
    if (Game.deathState) {
      last=t;acc=0;drawScene(false);drawHp(fighter);Game.Hud.drawDamage(ctx,fighter,camera.x);
      requestAnimationFrame(loop);return;
    }
    if (Game.shop && Game.shop.active) {
      Game.shop.drawPortrait(t);
      last = t; acc = 0;
      requestAnimationFrame(loop);
      return;
    }
    if (Game.menu && Game.menu.active) {
      last = t;
      acc = 0;
      requestAnimationFrame(loop);
      return;
    }
    if (Game.clearSequence) {
      Game.advanceClearSequence(Math.max(0, Math.min(100, last ? t - last : 0)));
      last = t;
      acc = 0;
      drawScene(false);
      drawBossHud();
      drawClearScore();
      if (Game.clearSequence.darkness >= 1 && Game.shop){Game.shop.clearedStage=stage.id;Game.shop.open(Game.clearSequence.result.total, fighter);}
      requestAnimationFrame(loop);
      return;
    }
    if (Game.stageIntro) {
      Game.advanceStageIntro(Math.max(0, Math.min(100, last ? t - last : 0)));
      last = t;
      acc = 0;
      drawScene(false);
      drawStageIntro();
      requestAnimationFrame(loop);
      return;
    }
    if (!last) last = t;
    acc += t - last;
    last = t;
    const step = 1000 / 60;
    while (acc >= step) {
      if ((fighter.hp > 0 || fighter.allowZeroHp) && encounter.totalHp() > 0) playFrames++;
      Game.updateHitEffects();
      if(Game.screenShake&&--Game.screenShake.ticks<=0)Game.screenShake=null;
      fighter.update(input, WORLD);
      Game.updateCamera(camera,fighter,WORLD.width);
      if ((fighter.hp > 0 || fighter.allowZeroHp) && encounter.totalHp() <= 0) {
        Game.beginClearSequence(fighter.hp, fighter.maxHp, WORLD.timer.remainingFrames);
        fighter.mp = fighter.maxMp;
        fighter.clockActive = false;
        WORLD.timeStopped = false;
        if (!recorded && Game.menu) Game.menu.record(playFrames / 60, fighter.hp);
        recorded = true;
        acc = 0;
        break;
      }
      Game.updateStageTimer(WORLD, (fighter.hp > 0 || fighter.allowZeroHp) && encounter.totalHp() > 0);
      encounter.update(fighter);
      if(stage.id==='outerWall')Game.updateOuterWallPlatforms(WORLD,fighter,encounter.slimes);
      encounter.resolveContact(fighter);
      if (fighter.hp <= 0 && !fighter.allowZeroHp) { showDeath(); acc = 0; break; }
      acc -= step;
    }
    Game.Hud.updateBossDamage(encounter,0);
    ctx.save();
    if(Game.screenShake){
      const shake=Game.screenShake,force=shake.strength*shake.ticks/shake.maxTicks;
      ctx.translate(Math.sin(shake.ticks*2.3)*force,Math.cos(shake.ticks*1.7)*force);
    }
    drawScene(true);
    ctx.restore();
    drawHp(fighter);
    drawTimer();
    Game.Hud.drawDamage(ctx,fighter,camera.x);
    drawBossHud();
    ctx.fillStyle = "#eee";
    ctx.font = "12px sans-serif";
    if (encounter.totalHp() <= 0) {
      if (!recorded && fighter.hp > 0 && Game.menu) {
        Game.menu.record(playFrames / 60, fighter.hp);
        recorded = true;
      }
      ctx.fillText((stage.id==='wineCellar'?Game.cellarBossLabel(fighter):slimeDef.name) + ' 처치!', VIEW_WIDTH / 2 - 60, 100);
    }
    requestAnimationFrame(loop);
  }

  Promise.all([
    Game.loadImage('sprites/stages/wine_cellar.png').then(img=>{cellarBackground=img;}),
    Game.loadImage('sprites/objects/oak_barrel.png').then(img=>{cellarBarrel=img;}),
    fighter.load(),
    Game.loadCellarAnimations ? Game.loadCellarAnimations().then(function(frames){cellarAnimations=frames;}) : Promise.resolve(),
    Game.Bosses.cellar ? Game.loadImage(Game.Bosses.cellar.sprite).then(function(img){cellarImage=img;}) : Promise.resolve(),
    Game.loadImage(stage.sprite).then(function (img) { stageImage = img; }),
    Game.loadImage(slimeDef.sprite).then(function (img) { encounter.image = img; }),
    Game.loadImage(slimeDef.reactions.sprite).then(function (img) { encounter.reactionsImage = img; })
  ]).then(function () {
    if (Game.menu) Game.menu.ready();
    requestAnimationFrame(loop);
  });
})();

