window.Game = window.Game || {};
Game.debug = false;
Game.debugTools = true;
Game.deathState = null;
Game.consumeLife = function (actor) {
  actor.lives = Math.max(0, actor.lives - 1);
  return actor.lives > 0;
};
Game.clearSequence = null;
Game.calculateClearScore = function (hp, maxHp, remainingFrames) {
  const perfect = hp >= maxHp;
  const rows = [
    { label: '스테이지 클리어', score: 1000 },
    { label: '남은 체력', score: Math.floor(Game.clamp(hp / maxHp, 0, 1) * 1000) },
    { label: perfect ? '퍼펙트 보너스' : '퍼펙트 보너스 — 없음', score: perfect ? 1000 : 0 },
    { label: '남은 시간', score: Math.floor(Math.max(0, remainingFrames) / 60) * 10 }
  ];
  return { rows: rows, total: rows.reduce(function (sum, row) { return sum + row.score; }, 0) };
};
Game.beginClearSequence = function (hp, maxHp, remainingFrames) {
  Game.clearSequence = { result: Game.calculateClearScore(hp, maxHp, remainingFrames), elapsed: 0, darkness: 0 };
};
Game.advanceClearSequence = function (milliseconds) {
  const sequence = Game.clearSequence;
  if (!sequence) return;
  sequence.elapsed = Math.min(6800, sequence.elapsed + milliseconds);
  sequence.darkness = Game.clamp((sequence.elapsed - 5300) / 1500, 0, 1);
};
Game.createStageTimer = function (seconds) {
  return { remainingFrames: seconds * 60, expired: false };
};
Game.updateStageTimer = function (world, active) {
  if (!world.timer || !active || world.timeStopped) return;
  world.timer.remainingFrames = Math.max(0, world.timer.remainingFrames - 1);
  world.timer.expired = world.timer.remainingFrames === 0;
  world.enemyDamageMultiplier = world.timer.expired ? 2 : 1;
};
Game.stageIntroductions = new Set();
Game.stageIntro = null;
Game.beginStageIntro = function (id, location, enemyName) {
  if (Game.stageIntroductions.has(id)) return false;
  Game.stageIntroductions.add(id);
  Game.stageIntro = { location: location, enemyName: enemyName, elapsed: 0, opacity: 0 };
  return true;
};
Game.advanceStageIntro = function (milliseconds) {
  const intro = Game.stageIntro;
  if (!intro) return;
  intro.elapsed += milliseconds;
  if (intro.elapsed >= 4500) { Game.stageIntro = null; return; }
  intro.opacity = intro.elapsed < 1000 ? intro.elapsed / 1000 :
    intro.elapsed > 3500 ? (4500 - intro.elapsed) / 1000 : 1;
};
Game.hitEffects = [];

Game.updateHitEffects = function () {
  Game.hitEffects = Game.hitEffects.filter(function (effect) { return --effect.life > 0; });
};

Game.drawHitEffects = function (ctx) {
  ctx.save();
  Game.hitEffects.forEach(function (effect) {
    const age = 14 - effect.life;
    const x = Math.round(effect.x), y = Math.round(effect.y);
    ctx.globalAlpha = Math.min(1, effect.life / 6);
    if (age < 5) {
      const reach = 18 - age * 2;
      ctx.fillStyle = "#ffc76b";
      ctx.fillRect(x - reach, y - 3, reach * 2, 6);
      ctx.fillRect(x - 3, y - reach, 6, reach * 2);
      ctx.fillStyle = "#fff4cf";
      ctx.fillRect(x - 5, y - 5, 10, 10);
    }
    for (let i = 0; i < 8; i++) {
      const angle = i * Math.PI / 4 + effect.angle;
      const distance = 5 + age * (1.4 + i % 3 * 0.35);
      const size = age < 6 ? 4 : 2;
      ctx.fillStyle = i % 2 ? "#ffe8a8" : "#d99c52";
      ctx.fillRect(Math.round(x + Math.cos(angle) * distance), Math.round(y + Math.sin(angle) * distance + age * age * 0.035), size, size);
    }
  });
  ctx.restore();
};

Game.damageEnemy = function (enemy, amount, attacker) {
  if (enemy.hp <= 0 || amount <= 0) return;
  const hp = enemy.hp;
  // Capture the contact area before damage changes the enemy's size.
  const candidates = attacker ? [attacker.attackHit, attacker.slideHit, attacker.kickHit].concat(attacker.knives || [], attacker.crosses || [], attacker.axes || [], attacker.holies || []) : [];
  const box = candidates.find(function (candidate) { return candidate && Game.aabb(candidate, enemy); });
  const left = box ? Math.max(box.x, enemy.x) : enemy.x;
  const right = box ? Math.min(box.x + box.w, enemy.x + enemy.w) : enemy.x + enemy.w;
  const top = box ? Math.max(box.y, enemy.y) : enemy.y;
  const bottom = box ? Math.min(box.y + box.h, enemy.y + enemy.h) : enemy.y + enemy.h;
  if (enemy.takeDamage) enemy.takeDamage(amount, attacker);
  else enemy.hp = Math.max(0, enemy.hp - amount);
  if (enemy.hp < hp && Number.isFinite(left + right + top + bottom)) {
    Game.hitEffects.push({ x: (left + right) / 2, y: (top + bottom) / 2,
      life: 14, angle: Math.random() * Math.PI / 4 });
    if (Game.hitEffects.length > 80) Game.hitEffects.shift();
  }
};

Game.aabb = function (a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
};

Game.clamp = function (v, min, max) {
  return v < min ? min : v > max ? max : v;
};

Game.loadImage = function (src) {
  return new Promise(function (resolve) {
    const img = new Image();
    img.onload = function () { resolve(img); };
    img.onerror = function () { resolve(null); };
    img.src = src;
  });
};

Game.asFrame = function (img) {
  if (!img) return null;
  return { source: img, sx: 0, sy: 0, sw: img.width, sh: img.height };
};

Game.loadFrameSequence = function (folder, count) {
  const jobs = [];
  for (let i = 0; i < count; i++) {
    const n = String(i).padStart(2, "0");
    jobs.push(Game.loadImage(folder + "/" + n + ".png"));
  }
  return Promise.all(jobs).then(function (frames) {
    return frames.filter(Boolean).map(Game.asFrame);
  });
};

Game.loadSheet = function (src, frameW, frameH) {
  return Game.loadImage(src).then(function (img) {
    if (!img) return [];
    const frames = [];
    const cols = Math.floor(img.width / frameW);
    const rows = Math.max(1, Math.floor(img.height / frameH));
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        frames.push({
          source: img,
          sx: c * frameW,
          sy: r * frameH,
          sw: frameW,
          sh: frameH
        });
      }
    }
    return frames;
  });
};

Game.isSpriteBg = function (r, g, b, a) {
  if (a < 8) return true;
  const mn = Math.min(r, g, b);
  const mx = Math.max(r, g, b);
  if (mn > 232) return true;
  if (mn > 210 && mx - mn < 16) return true;
  return false;
};

Game.readFramePixels = function (frame) {
  const c = document.createElement("canvas");
  c.width = frame.sw;
  c.height = frame.sh;
  const ctx = c.getContext("2d");
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(frame.source, frame.sx, frame.sy, frame.sw, frame.sh, 0, 0, frame.sw, frame.sh);
  return { canvas: c, ctx: ctx, data: ctx.getImageData(0, 0, frame.sw, frame.sh) };
};

Game.spriteBBox = function (imageData) {
  const d = imageData.data;
  const w = imageData.width;
  const h = imageData.height;
  let x0 = w;
  let y0 = h;
  let x1 = -1;
  let y1 = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      if (Game.isSpriteBg(d[i], d[i + 1], d[i + 2], d[i + 3])) continue;
      if (x < x0) x0 = x;
      if (y < y0) y0 = y;
      if (x > x1) x1 = x;
      if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return null;
  return { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
};

Game.measureFrame = function (frame) {
  try {
    const pix = Game.readFramePixels(frame);
    return Game.spriteBBox(pix.data);
  } catch (err) {
    return null;
  }
};

Game.measureAnchor = function (frame) {
  let pix;
  try {
    pix = Game.readFramePixels(frame);
  } catch (err) {
    return null;
  }
  const image = pix.data;
  const w = image.width;
  const h = image.height;
  const d = image.data;
  const col = new Uint16Array(w);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] >= 8) col[x]++;
    }
  }
  let peak = 0;
  let peakX = 0;
  for (let x = 0; x < w; x++) {
    if (col[x] > peak) {
      peak = col[x];
      peakX = x;
    }
  }
  if (peak < 8) return null;
  const minCol = peak * 0.45;
  let x0 = -1;
  let run0 = -1;
  for (let x = 0; x <= w; x++) {
    const inside = x < w && col[x] >= minCol;
    if (inside && run0 < 0) run0 = x;
    if (!inside && run0 >= 0) {
      if (peakX >= run0 && peakX <= x - 1) x0 = run0;
      run0 = -1;
    }
  }
  if (x0 < 0) return null;
  let x1 = x0;
  while (x1 + 1 < w && col[x1 + 1] >= minCol) x1++;
  let top = h;
  let bot = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (col[x] < 12) continue;
      if (d[(y * w + x) * 4 + 3] < 8) continue;
      if (y < top) top = y;
      if (y > bot) bot = y;
    }
  }
  if (bot < 0) return null;
  return { x: Math.floor((x0 + x1) / 2), y: bot + 1, h: bot - top + 1 };
};

Game.applySpriteFit = function (sheets, stats) {
  const shareGround = { idle: true, walk: true, run: true, backstep: true };
  const table = Game.spriteFit || {};

  function anchorsFor(name, frames) {
    return frames.map(function (frame, i) {
      const live = frame ? Game.measureAnchor(frame) : null;
      const baked = table[name] && table[name][i];
      return live || baked || null;
    });
  }

  let standH = 195;
  anchorsFor("idle", sheets.idle || []).forEach(function (a) {
    if (a && a.h > standH) standH = a.h;
  });
  const crouchA = anchorsFor("crouch", sheets.crouch || []);
  const crouchH = crouchA[0] && crouchA[0].h ? crouchA[0].h : 161;

  function targetOf(name) {
    if (name === "attackCrouch") return crouchH;
    if (name === "attackStand" || name === "attackAir") return standH;
    return 0;
  }

  function placeList(name, frames) {
    if (!frames || !frames.length) return;
    const got = anchorsFor(name, frames);
    let ref = 0;
    frames.forEach(function (frame, i) {
      if (!frame || frame.extra || !got[i] || ref) return;
      ref = got[i].h;
    });
    const target = targetOf(name);
    const sharedAnchor=shareGround[name]?got.find(function(a){return !!a;}):null;
    let ground = 0;
    if (shareGround[name]) {
      got.forEach(function (a) {
        if (a && a.y > ground) ground = a.y;
      });
    }
    frames.forEach(function (frame, i) {
      const a = got[i];
      if (!frame) return;
      if (!a) {
        frame.originX = frame.sw / 2;
        frame.originY = frame.sh;
        frame.fit = 1;
        return;
      }
      frame.originX = sharedAnchor ? sharedAnchor.x : a.x;
      frame.originY = shareGround[name] ? ground : a.y;
      if (name === "attackCrouch" || name === "crouch") frame.fit = 1;
      else if (!target || !ref) frame.fit = 1;
      else if (frame.extra) frame.fit = target / a.h;
      else frame.fit = target / ref;
    });
  }

  Object.keys(sheets).forEach(function (name) {
    if (name === "hit") {
      Object.keys(sheets.hit).forEach(function (key) {
        if (sheets.hit[key]) placeList(key, [sheets.hit[key]]);
      });
      return;
    }
    placeList(name, sheets[name]);
  });
};

Game.createCamera=function(viewWidth){return {x:0,width:viewWidth};};
Game.updateCamera=function(camera,actor,mapWidth){
  const center=actor.x+actor.w/2,screenX=center-camera.x;
  const left=camera.left==null?camera.width*0.35:camera.left,right=camera.width*0.65;
  if(screenX>right)camera.x=center-right;
  else if(screenX<left)camera.x=center-left;
  camera.x=Game.clamp(camera.x,0,Math.max(0,mapWidth-camera.width));
};

Game.addPlayerDamageFeedback=function(actor,amount,beforeHp){
  if(amount<=0)return;
  if(!actor.damageFeedback)actor.damageFeedback=[];
  const offsetX=(Math.random()-0.5)*80,offsetY=(Math.random()-0.5)*48;
  actor.damageFeedback.push({amount,beforeHp,afterHp:actor.hp,age:0,offsetX,offsetY,
    x:actor.x+actor.w/2+offsetX,y:actor.y+actor.h*0.3+offsetY});
};
