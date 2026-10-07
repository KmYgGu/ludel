window.Game = window.Game || {};
Game.Bosses = Game.Bosses || {};

Game.Bosses.slime = {
  id: "slime",
  name: "거대 슬라임",
  timeStopImmune: false,
  sprite: "sprites/bosses/stage1/slime_idle_sheet.png",
  idle: { columns: 4, rows: 2, frames: 8, frameTime: 8, padding: 32, contentW: 128, contentH: 155 },
  reactions: { sprite: 'sprites/bosses/stage1/slime_reactions_sheet.png', columns: 4, rows: 2,
    frames: 4, frameTime: 3, padding: 32, contentW: 128, contentH: 155,
    wallRightEdges: [127, 110, 100, 122] },
  spriteW: 399,
  spriteH: 340,
  maxHp: 500,
  damage: 18,
  chaseSpeed: 0.45,
  chaseSpeeds: [0.45, 3.2, 6.0],
  lowHpSpeedBoost: 0.8,
  wallHopHeight: 180,
  ceilingHopChance: [0, 0.25, 0.65],
  gravity: 0.38,
  splitRatios: [2 / 3, 1 / 3],
  maxSlimes: 4,
  ceiling: { crawlSpeeds: [1.4, 2.6, 3.6], warningTime: 18, damage: 24, recovery: 30 },
  press: { windup: 48, recovery: 60, cooldown: 240, damage: 28,
    waveDamage: 16, waveSpeed: 6, waveLife: 90 },
  hurt: { x: 0.18, y: 0.14, w: 0.64, h: 0.78 },
  attack: { x: 0.14, y: 0.10, w: 0.72, h: 0.84 }
};

Game.SlimeEncounter = function (world) {
  this.world = world;
  this.def = Game.Bosses.slime;
  this.image = null;
  this.reactionsImage = null;
  this.random = Math.random;
  this.pressCooldown = this.def.press.cooldown;
  this.pressTurn = 0;
  this.waves = [];
  this.floorY = world.floorY == null ? (world.height == null ? 480 : world.height - 60) : world.floorY;
  this.slimes = [this.create((world.arenaOrigin || 0)+(world.viewportWidth || world.width) * 0.76, this.floorY, this.def.maxHp, this.def.maxHp, 0)];
};

Game.SlimeEncounter.prototype.create = function (cx, feet, hp, maxHp, generation) {
  const encounter = this;
  const slime = { cx: cx, feet: feet, hp: hp, maxHp: maxHp, generation: generation,
    defense: Math.pow(2, generation),
    vx: 0, vy: 0, bouncing: false, bouncesLeft: 0, idleTick: 0 };
  slime.takeDamage = function (amount, attacker) {
    slime.hp = Math.max(0, slime.hp - amount / slime.defense);
    if (slime.hp <= 0) return;
    if (encounter.world.timeStopped && !encounter.def.timeStopImmune) return;
    encounter.sync(slime);
    const from = attacker ? attacker.x + attacker.w / 2 : slime.cx - 1;
    encounter.react(slime, 'hit', slime.cx >= from ? 1 : -1);
    if (slime.ceilingState === 'crawl' || slime.ceilingState === 'ready') {
      slime.ceilingState = 'knocked';
      slime.vx = 0;
      slime.vy = 1;
      return;
    }
    encounter.recoil(slime, attacker);
  };
  this.sync(slime);
  return slime;
};

Game.SlimeEncounter.prototype.react = function (slime, kind, direction) {
  slime.reaction = kind;
  slime.reactionDirection = direction;
  slime.reactionTimer = this.def.reactions.frames * this.def.reactions.frameTime;
};

Game.SlimeEncounter.prototype.hopHeight = function (slime, base) {
  if (slime.generation === 0) return base;
  const normal = base * (slime.generation === 1 ? 1.8 : 2.8);
  if (this.random() >= this.def.ceilingHopChance[slime.generation]) return normal;
  const ceiling = this.world.ceilingY == null ? 20 : this.world.ceilingY;
  // Extra height compensates for fixed-step gravity so the hop reaches the ceiling.
  return Math.max(normal, slime.feet - slime.spriteH - ceiling + 24);
};

Game.SlimeEncounter.prototype.recoil = function (slime, other) {
  // Telegraph, jump and recovery remain readable even under repeated weapon hits.
  if (slime.press || slime.ceilingState) return;
  const from = other ? other.x + other.w / 2 : slime.cx - 1;
  const away = slime.cx >= from ? 1 : -1;
  const distanceFactor = 0.7 + this.random() * 1.1;
  const heightFactor = 0.65 + this.random() * 1.35;
  slime.vx = away * (2.6 + slime.scale * 2) * distanceFactor;
  const height = this.hopHeight(slime, 90 * slime.scale * heightFactor);
  slime.vy = -Math.sqrt(2 * this.def.gravity * height);
  slime.bouncing = true;
  slime.bouncesLeft = 1;
};

Game.SlimeEncounter.prototype.sync = function (slime) {
  const d = this.def;
  slime.scale = Math.sqrt(slime.maxHp / d.maxHp) * (0.65 + 0.35 * slime.hp / slime.maxHp);
  slime.spriteW = d.spriteW * slime.scale;
  slime.spriteH = d.spriteH * slime.scale * (slime.press === 'windup' ? 0.62 : slime.press === 'recover' ? 0.82 : 1);
  const attached = slime.ceilingState === 'crawl' || slime.ceilingState === 'ready';
  if (attached) slime.feet = (this.world.ceilingY == null ? 20 : this.world.ceilingY) + slime.spriteH;
  // Wall collision uses the full visible sprite and preserves its feet on resize.
  slime.cx = Game.clamp(slime.cx, slime.spriteW / 2, this.world.width - slime.spriteW / 2);
  slime.spriteX = slime.cx - slime.spriteW / 2;
  slime.spriteY = slime.feet - slime.spriteH;
  function box(rel) {
    const ry = attached ? 1 - rel.y - rel.h : rel.y;
    return { x: slime.spriteX + rel.x * slime.spriteW, y: slime.spriteY + ry * slime.spriteH,
      w: rel.w * slime.spriteW, h: rel.h * slime.spriteH };
  }
  Object.assign(slime, box(d.hurt));
  slime.attack = box(d.attack);
  slime.attack.damage = d.damage;
  slime.attack.invuln = true;
};

Game.SlimeEncounter.prototype.totalHp = function () {
  return this.slimes.reduce(function (sum, slime) { return sum + slime.hp; }, 0);
};

Game.SlimeEncounter.prototype.startPress = function (slime, fighter) {
  slime.press = 'windup';
  slime.pressTimer = this.def.press.windup;
  slime.pressTarget = Game.clamp(fighter.x + fighter.w / 2, slime.spriteW / 2, this.world.width - slime.spriteW / 2);
  slime.vx = 0;
  slime.vy = 0;
  slime.bouncing = false;
  this.sync(slime);
};

Game.SlimeEncounter.prototype.attachCeiling = function (slime) {
  slime.ceilingState = 'crawl';
  slime.vx = 0;
  slime.vy = 0;
  slime.bouncing = false;
  slime.bouncesLeft = 0;
  this.sync(slime);
};

Game.SlimeEncounter.prototype.landingSurface = function (slime, previousFeet) {
  let surface = this.floorY;
  if (slime.vy < 0) return surface;
  (this.world.solids || []).forEach(function (platform) {
    if (!platform.oneWay || platform.disabled) return;
    if (slime.cx + slime.spriteW / 2 <= platform.x || slime.cx - slime.spriteW / 2 >= platform.x + platform.w) return;
    if (previousFeet <= platform.y + 1 && slime.feet >= platform.y) surface=Math.min(surface,platform.y);
  });
  return surface;
};

Game.SlimeEncounter.prototype.updateCeiling = function (slime, fighter) {
  const d = this.def;
  if (slime.ceilingState === 'crawl') {
    const target = Game.clamp(fighter.x + fighter.w / 2, slime.spriteW / 2, this.world.width - slime.spriteW / 2);
    const delta = target - slime.cx;
    const speed = d.ceiling.crawlSpeeds[slime.generation];
    if (Math.abs(delta) <= speed) {
      slime.cx = target;
      slime.vx = 0;
      slime.ceilingState = 'ready';
      slime.ceilingTimer = d.ceiling.warningTime;
    } else {
      slime.vx = Math.sign(delta) * speed;
      slime.cx += slime.vx;
    }
  } else if (slime.ceilingState === 'ready') {
    if (--slime.ceilingTimer <= 0) {
      slime.ceilingState = 'fall';
      slime.vx = 0;
      slime.vy = 3;
    }
  } else if (slime.ceilingState === 'recover') {
    if (--slime.ceilingTimer <= 0) slime.ceilingState = null;
  } else {
    slime.vy = Math.min(slime.vy + d.gravity, 16);
    const previousFeet = slime.feet;
    slime.feet += slime.vy;
    const surface = this.landingSurface(slime, previousFeet);
    if (slime.feet >= surface) {
      slime.feet = surface;
      slime.vy = 0;
      slime.vx = 0;
      slime.ceilingState = 'recover';
      slime.ceilingTimer = d.ceiling.recovery;
    }
  }
  this.sync(slime);
};

Game.SlimeEncounter.prototype.updatePress = function (slime) {
  const d = this.def;
  if (slime.press === 'windup') {
    if (--slime.pressTimer <= 0) {
      slime.press = 'flight';
      this.sync(slime);
      const ceiling = this.world.ceilingY == null ? 20 : this.world.ceilingY;
      const height = Math.max(12, Math.min(210 * slime.scale, this.floorY - slime.spriteH - ceiling - 8));
      const duration = Math.ceil(2 * Math.sqrt(2 * height / d.gravity));
      slime.vy = -d.gravity * (duration + 1) / 2;
      slime.vx = (slime.pressTarget - slime.cx) / duration;
    }
  } else if (slime.press === 'flight') {
    slime.cx += slime.vx;
    slime.vy += d.gravity;
    const previousFeet = slime.feet;
    slime.feet += slime.vy;
    if (slime.vy > 0) {
      (this.world.solids || []).forEach(function (platform) {
        if (!platform.crumbling || platform.disabled) return;
        if (slime.cx+slime.spriteW/2<=platform.x || slime.cx-slime.spriteW/2>=platform.x+platform.w) return;
        if (previousFeet <= platform.y+1 && slime.feet >= platform.y) {
          platform.state='falling'; platform.disabled=true; platform.vy=2;
        }
      });
    }
    const surface = this.landingSurface(slime, previousFeet);
    if (slime.feet >= surface && slime.vy > 0) {
      slime.cx = slime.pressTarget;
      slime.feet = surface;
      slime.vx = 0;
      slime.vy = 0;
      slime.press = 'recover';
      slime.pressTimer = d.press.recovery;
      slime.pressImpact = true;
      this.sync(slime);
      for (const direction of [-1, 1]) {
        this.waves.push({x: slime.cx + direction * slime.spriteW * 0.35 - 32,
          y: surface - 28, w: 64, h: 28, vx: direction * d.press.waveSpeed,
          life: d.press.waveLife, hit: false, damage: d.press.waveDamage, invuln: true});
      }
    }
  } else if (--slime.pressTimer <= 0) {
    slime.press = null;
  }
  this.sync(slime);
};

Game.SlimeEncounter.prototype.update = function (fighter) {
  if (this.world.timeStopped && !this.def.timeStopImmune) return;
  const d = this.def;
  this.slimes = this.slimes.filter(function (slime) { return slime.hp > 0; });
  let splitAgain = true;
  while (splitAgain) {
    splitAgain = false;
    const next = [];
    let available = d.maxSlimes - this.slimes.length;
    this.slimes.forEach(function (parent) {
      const ratio = d.splitRatios[parent.generation];
      if (parent.press || parent.ceilingState || available <= 0 || ratio == null || parent.hp / parent.maxHp > ratio) {
        next.push(parent); return;
      }
      available--;
      splitAgain = true;
      for (let side = -1; side <= 1; side += 2) {
        const child = this.create(parent.cx + side * parent.spriteW * 0.18,
          parent.feet, parent.hp / 2, parent.maxHp / 2, parent.generation + 1);
        child.vx = side * (2 + child.scale * 2);
        child.vy = -Math.sqrt(2 * d.gravity * this.hopHeight(child, 65 * child.scale));
        child.bouncing = true;
        next.push(child);
      }
    }, this);
    this.slimes = next;
  }
  this.waves = this.waves.filter(function (wave) {
    wave.x += wave.vx;
    return --wave.life > 0 && wave.x + wave.w >= 0 && wave.x <= this.world.width;
  }, this);
  if (this.totalHp() <= 0) this.waves = [];
  if (this.pressCooldown > 0) this.pressCooldown--;
  if (this.pressCooldown <= 0 && !this.slimes.some(function (slime) { return !!slime.press; })) {
    const candidates = this.slimes.filter(function (slime) {
      return slime.generation < 2 && !slime.ceilingState && !slime.bouncing && slime.feet >= this.floorY;
    }, this);
    if (candidates.length) {
      this.startPress(candidates[this.pressTurn++ % candidates.length], fighter);
      this.pressCooldown = d.press.cooldown;
    }
  }
  this.slimes.forEach(function (slime) {
    if (slime.reactionTimer > 0) slime.reactionTimer--;
    slime.pressImpact = false;
    this.sync(slime);
    slime.idleTick = (slime.idleTick + 1) % (d.idle.frames * d.idle.frameTime);
    // Recovery poses must also fall when their supporting platform disappears.
    if (slime.press === 'recover' || slime.ceilingState === 'recover') {
      const previousFeet = slime.feet;
      slime.vy = Math.min(slime.vy + d.gravity, 16);
      slime.feet += slime.vy;
      const surface = this.landingSurface(slime, previousFeet);
      if (slime.feet >= surface) { slime.feet=surface; slime.vy=0; }
    }
    if (slime.press) { this.updatePress(slime); return; }
    if (slime.ceilingState) { this.updateCeiling(slime, fighter); return; }
    if (!slime.bouncing) {
      const delta = fighter.x + fighter.w / 2 - slime.cx;
      const speed = d.chaseSpeeds[slime.generation]
        + (1 - slime.hp / slime.maxHp) * d.lowHpSpeedBoost;
      slime.vx = Math.abs(delta) < speed ? delta : Math.sign(delta) * speed;
    }
    slime.cx += slime.vx;
    const half = slime.spriteW / 2;
    if (slime.cx < half || slime.cx > this.world.width - half) {
      this.react(slime, 'wall', slime.cx < half ? -1 : 1);
      slime.cx = Game.clamp(slime.cx, half, this.world.width - half);
      slime.vx = -slime.vx;
      const hopHeight = this.hopHeight(slime, d.wallHopHeight * slime.scale);
      slime.vy = -Math.sqrt(2 * d.gravity * hopHeight);
      slime.bouncing = true;
      slime.bouncesLeft = 1;
    }
    slime.vy += d.gravity;
    const previousFeet = slime.feet;
    slime.feet += slime.vy;
    const ceiling = this.world.ceilingY == null ? 20 : this.world.ceilingY;
    if (slime.feet - slime.spriteH < ceiling) {
      this.attachCeiling(slime);
      return;
    }
    const surface = this.landingSurface(slime, previousFeet);
    if (slime.feet >= surface) {
      slime.feet = surface;
      if (slime.bouncing && slime.bouncesLeft > 0) {
        slime.bouncesLeft--;
        slime.vy = -Math.sqrt(2 * d.gravity * this.hopHeight(slime, 30 * slime.scale));
        slime.vx *= 0.7;
      } else {
        slime.vy = 0;
        if (slime.bouncing) slime.vx = 0;
        slime.bouncing = false;
      }
    }
    this.sync(slime);
  }, this);
  this.world.enemies = this.slimes;
};

Game.SlimeEncounter.prototype.resolveContact = function (fighter) {
  const damageMultiplier = this.world.enemyDamageMultiplier || 1;
  const target = this.slimes.find(function (slime) {
    return slime.hp > 0 && fighter.kickHit && Game.aabb(fighter.kickHit, slime);
  });
  if (target) {
    Game.damageEnemy(target, fighter.def.stats.kickDamage, fighter);
    fighter.onKickConnect();
  }
  this.slimes.forEach(function (slime) {
    if (slime.hp > 0 && slime.pressImpact && fighter.kickInvuln <= 0 && Game.aabb(fighter.hurtBox(), slime.attack)) {
      fighter.takeHit(Object.assign({}, slime.attack, {damage: this.def.press.damage * damageMultiplier}));
    }
    if (slime.hp > 0 && fighter.kickInvuln <= 0 && Game.aabb(fighter.hurtBox(), slime.attack)) {
      const hpBefore = fighter.hp;
      const damage = slime.ceilingState === 'fall' ? this.def.ceiling.damage
        : slime.press === 'flight' && slime.vy > 0 ? this.def.press.damage : slime.attack.damage;
      fighter.takeHit(Object.assign({}, slime.attack, {damage: damage * damageMultiplier}));
      if (fighter.hp < hpBefore) {
        if (slime.ceilingState === 'fall' || slime.ceilingState === 'knocked') slime.ceilingState = null;
        this.recoil(slime, fighter);
      }
    }
  }, this);
  this.waves.forEach(function (wave) {
    if (!wave.hit && Game.aabb(fighter.hurtBox(), wave)) {
      const hpBefore = fighter.hp;
      fighter.takeHit(Object.assign({}, wave, {damage: wave.damage * damageMultiplier}));
      if (fighter.hp < hpBefore) wave.hit = true;
    }
  });
};

Game.SlimeEncounter.prototype.draw = function (ctx) {
  const idle = this.def.idle;
  this.slimes.forEach(function (slime) {
    if (slime.hp <= 0 || !this.image) return;
    const reacting = slime.reactionTimer > 0 && this.reactionsImage;
    const spec = reacting ? this.def.reactions : idle;
    const source = reacting ? this.reactionsImage : this.image;
    const elapsed = spec.frames * spec.frameTime - slime.reactionTimer;
    const frame = reacting ? Math.min(spec.frames - 1, Math.floor(elapsed / spec.frameTime))
      : Math.floor(slime.idleTick / idle.frameTime);
    const row = reacting ? (slime.reaction === 'wall' ? 0 : 1) : Math.floor(frame / idle.columns);
    const fw = source.width / spec.columns;
    const fh = source.height / spec.rows;
    ctx.save();
    if (slime.press === 'windup') {
      ctx.fillStyle = '#efff6a';
      ctx.fillText('바디프레스!', slime.cx - 36, slime.spriteY - 24);
      ctx.strokeStyle = '#efff6a';
      ctx.strokeRect(slime.pressTarget - slime.spriteW / 2, this.floorY - 6, slime.spriteW, 6);
      ctx.shadowColor = '#dfff38';
      ctx.shadowBlur = slime.pressTimer % 12 < 6 ? 18 : 6;
    }
    ctx.imageSmoothingEnabled = false;
    if (slime.ceilingState === 'crawl' || slime.ceilingState === 'ready') {
      ctx.translate(0, 2 * slime.spriteY + slime.spriteH);
      ctx.scale(1, -1);
    }
    if (reacting && slime.reactionDirection < 0) {
      ctx.translate(2 * slime.cx, 0);
      ctx.scale(-1, 1);
    }
    let drawX = slime.spriteX;
    if (reacting && slime.reaction === 'wall') {
      // Anchor the visible flat face to the collided side, including when mirrored.
      drawX += slime.spriteW * (1 - spec.wallRightEdges[frame] / spec.contentW);
    }
    ctx.drawImage(source, frame % spec.columns * fw + spec.padding,
      row * fh + spec.padding, spec.contentW, spec.contentH,
      Math.round(drawX), Math.round(slime.spriteY), Math.round(slime.spriteW), Math.round(slime.spriteH));
    ctx.restore();
    if (slime.ceilingState === 'ready') {
      ctx.fillStyle = '#efff6a';
      ctx.fillText('낙하!', slime.cx - 15, slime.feet + 32);
      ctx.strokeStyle = '#efff6a';
      ctx.strokeRect(slime.cx - slime.spriteW / 2, this.floorY - 6, slime.spriteW, 6);
    }
    ctx.fillStyle = '#eee';
    ctx.font = '12px sans-serif';
    const hpY = slime.ceilingState === 'crawl' || slime.ceilingState === 'ready' ? slime.feet + 12 : slime.spriteY - 8;
    ctx.fillText(Math.ceil(slime.hp) + ' / ' + Math.ceil(slime.maxHp), slime.cx - 28, hpY);
    if (Game.debug) {
      ctx.strokeStyle = '#3dff6a';
      ctx.strokeRect(slime.x, slime.y, slime.w, slime.h);
      ctx.strokeStyle = '#ff4040';
      ctx.strokeRect(slime.attack.x, slime.attack.y, slime.attack.w, slime.attack.h);
    }
  }, this);
  this.waves.forEach(function (wave) {
    ctx.fillStyle = '#a8cf18';
    ctx.fillRect(Math.round(wave.x), wave.y + 10, wave.w, 18);
    ctx.fillStyle = '#efff6a';
    ctx.fillRect(Math.round(wave.x + 12), wave.y, 28, 18);
  });
};
