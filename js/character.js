window.Game = window.Game || {};

Game.Fighter = function (def, spawn) {
  this.def = def;
  this.sheets = { hit: {} };
  this.x = spawn.x;
  this.y = spawn.y;
  this.w = def.stats.bodyW;
  this.h = def.stats.standH;
  this.vx = 0;
  this.vy = 0;
  this.facing = 1;
  this.runDir = 1;
  this.grounded = false;
  this.anim = 0;
  this.crouching = false;
  this.running = false;
  this.backstepT = 0;
  this.slideT = 0;
  this.slideRecoverT = 0;
  this.slideHit = null;
  this.hp = def.stats.maxHp;
  this.maxHp = def.stats.maxHp;
  this.hitT = 0;
  this.hitKey = "SF";
  this.jumping = false;
  this.jumpsLeft = def.stats.maxJumps || 1;
  this.kicking = false;
  this.kickDir = 0;
  this.kickHit = null;
  this.kickInvuln = 0;
  this.kickBounceDir = 0;
  this.counterLaunch = null;
  this.damageFeedback = [];this.damageWhiteSegments = [];
  this.invuln = 0;
  this.attackT = 0;
  this.attackSerial = 0;
  this.attackKind = "stand";
  this.attackHit = null;
  this.mp = def.stats.maxMp || 0;
  this.maxMp = def.stats.maxMp || 0;
  this.knives = [];
  this.crosses = [];
  this.axes = [];
  this.holies = [];
  this.subweapon = "knife";
  this.lives = 3;
  this.ownedSubweapons = new Set(['knife']);
  this.healPurchases = 0;
  this.weaponPurchases = 0;
  this.clockActive = false;
  this.clockTick = 0;
  this.clockPulse = 0;
};

Game.Fighter.prototype.load = function () {
  const def = this.def;
  const root = def.spriteRoot;
  const anims = def.anims;
  const self = this;
  const jobs = [];
  const order = [];

  Object.keys(anims).forEach(function (name) {
    if (name === "hit") return;
    const spec = anims[name];
    order.push(name);
    if (spec.sheet) {
      jobs.push(Game.loadSheet(root + "/" + spec.sheet, spec.frameW, spec.frameH).then(function (frames) {
        const extras = spec.extra || [];
        if (!extras.length) return frames;
        return Promise.all(extras.map(function (file) {
          return Game.loadImage(root + "/" + file).then(function (img) {
            const frame = Game.asFrame(img);
            if (frame) frame.extra = true;
            return frame;
          });
        })).then(function (more) {
          return frames.concat(more.filter(Boolean));
        });
      }));
    } else if (spec.file) {
      jobs.push(Game.loadImage(root + "/" + spec.file).then(function (img) {
        const frame = Game.asFrame(img);
        return frame ? [frame] : [];
      }));
    } else {
      jobs.push(Game.loadFrameSequence(root + "/" + spec.folder, spec.count));
    }
  });

  const hitKeys = Object.keys(anims.hit || {});
  hitKeys.forEach(function (key) {
    jobs.push(Game.loadImage(root + "/" + anims.hit[key]));
  });

  return Promise.all(jobs).then(function (loaded) {
    order.forEach(function (name, i) {
      self.sheets[name] = loaded[i];
    });
    hitKeys.forEach(function (key, i) {
      self.sheets.hit[key] = Game.asFrame(loaded[order.length + i]);
    });
    Game.applySpriteFit(self.sheets, def.stats);
  });
};

Game.Fighter.prototype.setHeight = function (h) {
  const feet = this.y + this.h;
  this.h = h;
  this.y = feet - this.h;
};

Game.Fighter.prototype.inAir = function () {
  return !this.grounded;
};

Game.Fighter.prototype.hasMove = function (name) {
  return !!this.def.moves[name];
};

Game.Fighter.prototype.busy = function () {
  return this.hitT > 0 || this.slideT > 0 || this.slideRecoverT > 0 || this.backstepT > 0 || this.kicking || this.attackT > 0;
};

Game.Fighter.prototype.canStartRun = function () {
  return this.grounded && !this.crouching && !this.busy();
};

Game.Fighter.prototype.startRun = function (dir) {
  this.running = true;
  this.runDir = dir;
};

Game.Fighter.prototype.drawSize = function (frame) {
  const scale = this.def.spriteScale || 1;
  return { w: frame.sw * scale, h: frame.sh * scale };
};

Game.Fighter.prototype.hurtBox = function () {
  return { x: this.x, y: this.y, w: this.w, h: this.h };
};

Game.Fighter.prototype.kickAttackBox = function () {
  const cx = this.x + this.w / 2;
  const feet = this.y + this.h;
  const box = this.def.kickHit;
  const reach = box.reach || 0;
  const y = feet - box.h + reach;
  if (this.kickDir === 0) return { x: cx - box.w / 2, y: y, w: box.w, h: box.h };
  if (this.kickDir > 0) return { x: this.x + this.w - box.w / 2 + reach, y: y, w: box.w, h: box.h };
  return { x: this.x - box.w / 2 - reach, y: y, w: box.w, h: box.h };
};

Game.Fighter.prototype.startAttack = function () {
  if (!this.hasMove("attack") || this.attackT > 0) return;
  const s = this.def.stats;
  this.attackSerial++;
  this.attackKind = this.crouching ? "crouch" : this.inAir() ? "air" : "stand";
  this.attackT = (s.attackTime || 16) + (s.attackRecoverTime || 0);
  this.whipHits = new Set();
  this.anim = 0;
  this.running = false;
  if (this.attackKind !== "air") this.vx = 0;
};

Game.Fighter.prototype.startJump = function () {
  const s = this.def.stats;
  this.vy = s.jumpV;
  this.grounded = false;
  this.jumping = true;
  this.jumpsLeft = Math.max(0, this.jumpsLeft - 1);
};

Game.Fighter.prototype.startKick = function (dir) {
  const s = this.def.stats;
  this.kicking = true;
  this.kickDir = dir;
  this.anim = 0;
  this.jumping = false;
  if (dir !== 0) this.facing = dir;
  this.vx = dir * s.kickDiagSpd;
  this.vy = s.kickFall;
  this.kickHit = this.kickAttackBox();
};

Game.Fighter.prototype.whipAttackBox = function () {
  const spec = this.def.attackHit && this.def.attackHit[this.attackKind];
  if (!spec) return null;
  const y = this.y + this.h - spec.lift - spec.h;
  const cx = this.x + this.w / 2;
  if (this.facing > 0) return { x: cx + spec.forward, y: y, w: spec.w, h: spec.h };
  return { x: cx - spec.forward - spec.w, y: y, w: spec.w, h: spec.h };
};

Game.Fighter.prototype.onKickConnect = function () {
  const s = this.def.stats;
  this.kickBounceDir = this.kickDir;
  this.kicking = false;
  this.kickHit = null;
  this.kickDir = 0;
  this.vy = s.jumpV;
  this.jumping = true;
  this.grounded = false;
  this.kickInvuln = s.kickBounceInvuln || 24;
};

Game.Fighter.prototype.drawnSpriteRect = function (frame) {
  const scale = (frame.fit || 1) * (this.def.spriteScale || 1);
  const ox = frame.originX != null ? frame.originX : frame.sw / 2;
  const oy = frame.originY != null ? frame.originY : frame.sh;
  const ax = this.x + this.w / 2;
  const ay = this.y + this.h;
  const w = frame.sw * scale;
  const h = frame.sh * scale;
  const x = this.facing < 0 ? ax + ox * scale - w : ax - ox * scale;
  return { x: x, y: ay - oy * scale, w: w, h: h };
};

Game.Fighter.prototype.slideAttackBox = function () {
  const box = this.def.slideHit;
  const y = this.y + this.h - box.h;
  const cx = this.x + this.w / 2;
  const slide = (this.sheets.slide && this.sheets.slide[0]) || null;
  const vis = slide ? this.drawnSpriteRect(slide) : null;
  const front = vis ? (this.facing > 0 ? vis.x + vis.w : vis.x) : cx;
  if (this.facing > 0) return { x: front - box.w, y: y, w: box.w, h: box.h };
  return { x: front, y: y, w: box.w, h: box.h };
};

Game.Fighter.prototype.endSlide = function (input) {
  const s = this.def.stats;
  this.slideT = 0;
  this.slideRecoverT = 0;
  this.slideHit = null;
  this.vx = 0;
  if (input.down && this.grounded) {
    this.crouching = true;
    this.setHeight(s.crouchH);
  } else {
    this.crouching = false;
    this.setHeight(s.standH);
  }
  this.anim = 0;
};

Game.Fighter.prototype.takeHit = function (hit) {
  if ((!hit.rapidFire && this.invuln > 0) || this.kickInvuln > 0 || (this.hp <= 0 && !this.allowZeroHp)) return false;
  const s = this.def.stats;
  const dmg = hit.damage;
  const ratio = dmg / Math.max(1, this.hp);
  const kind = ratio < s.hitRatioM ? "S" : "M";
  const cx = this.x + this.w / 2;
  const hx = hit.x + hit.w / 2;
  const front = (hx - cx) * this.facing > 0;
  const side = hit.rapidFire ? (this.rapidHitSide === "F" ? "B" : "F") : (front ? "F" : "B");
  if (hit.rapidFire) this.rapidHitSide = side;
  const knock = hx > cx ? -1 : 1;
  const beforeHp=this.hp;
  this.hp = Math.max(0, this.hp - dmg);
  Game.addPlayerDamageFeedback(this,beforeHp-this.hp,beforeHp);
  this.hitKey = kind + side;
  this.hitT = s.hitStun[kind];
  // false: this hit deals damage but does not grant mercy frames.
  if (hit.invuln === false) this.invuln = 0;
  else if (typeof hit.invuln === "number") this.invuln = hit.invuln;
  else this.invuln = s.hitInvuln || 0;
  this.slideT = 0;
  this.slideRecoverT = 0;
  this.slideHit = null;
  this.backstepT = 0;
  this.kicking = false;
  this.kickHit = null;
  this.attackT = 0;
  this.attackHit = null;
  this.running = false;
  this.crouching = false;
  this.jumping = false;
  this.setHeight(s.standH);
  this.vx = knock * s.hitKnock[kind];
  this.anim = 0;
  return true;
};

Game.Fighter.prototype.launchFromCounter = function (hit, direction) {
  if (!this.takeHit(hit)) return false;
  this.counterLaunch = { direction, wallHit:false };
  this.y -= 40; this.vy = -3; this.grounded = false;
  return true;
};
Game.Fighter.prototype.updateCounterLaunch = function (world) {
  const launch = this.counterLaunch, s = this.def.stats;
  this.hitT = 1;
  if (this.invuln > 0) this.invuln--;
  if (!launch.wallHit) {
    this.vx = launch.direction * 28;
    this.x = Game.clamp(this.x + this.vx, 0, world.width - this.w);
    this.vy += s.gravity;
    this.y = Math.max(world.ceilingY || 0, Math.min(world.floorY - this.h - 40, this.y + this.vy));
    if (this.x === 0 || this.x === world.width - this.w) {
      launch.wallHit = true; this.vx = 0; this.vy = 1;
      Game.screenShake = { ticks:18, maxTicks:18, strength:9 };
    }
  } else {
    this.vx = 0;
    Game.applyGravity(this,s.gravity,s.maxFall);
    Game.moveAndCollide(this,world.solids,world);
    if (this.grounded) { this.counterLaunch = null; this.hitT = 12; }
  }
};
Game.Fighter.prototype.update = function (input, world) {
  const s = this.def.stats;
  const moves = this.def.moves;
  input.frame++;
  if (this.counterLaunch) {
    this.updateCounterLaunch(world);
    this.updateSubweapon({},world);
    return;
  }

  const hitting = this.hitT > 0;
  const sliding = this.slideT > 0;
  const backing = this.backstepT > 0;
  const kicking = this.kicking;
  if (this.kickInvuln > 0) this.kickInvuln--;
  if (this.invuln > 0) this.invuln--;

  if (hitting) {
    this.hitT--;
    this.vx *= s.hitFriction;
    this.slideHit = null;
    this.kickHit = null;
  } else if (kicking) {
    this.vx = this.kickDir * s.kickDiagSpd;
    this.vy = s.kickFall;
    this.anim = 0;
    this.kickHit = this.kickAttackBox();
  } else if (sliding) {
    this.anim = 0;
  } else if (this.slideRecoverT > 0) {
    this.vx = 0;
    this.slideHit = null;
    this.anim = 0;
    this.slideRecoverT--;
    if (this.slideRecoverT <= 0) this.endSlide(input);
  } else {
    this.slideHit = null;

    if (
      moves.backstep &&
      input.backstepPressed &&
      this.grounded &&
      !this.crouching &&
      !backing
    ) {
      this.attackT = 0;
      this.backstepT = s.backstepTime;
      this.anim = 0;
      this.crouching = false;
      this.running = false;
      this.setHeight(s.standH);
    }

    if (input.attackPressed && this.attackT <= 0 && this.backstepT <= 0) {
      this.startAttack();
    }

    if (this.attackT > 0) {
      // attack windup: no jump / kick
    } else if (input.jumpPressed && this.grounded) {
      const platform = input.down && (world.solids || []).find(s=>s.oneWay && !s.disabled
        && this.x+this.w>s.x && this.x<s.x+s.w && Math.abs(this.y+this.h-s.y)<2);
      if (platform) {
        this.y += platform.h + 8;
        this.vy = 2;
        this.grounded = false;
        this.jumping = false;
        this.backstepT = 0;
        this.running = false;
      } else if (moves.slide && this.crouching) {
        this.slideT = s.slideTime;
        this.slideHits = new Set();
        this.running = false;
        this.backstepT = 0;
        this.anim = 0;
        this.setHeight(s.crouchH);
        this.vx = this.facing * s.slideSpd;
        this.slideHit = this.slideAttackBox();
      } else {
        if (this.backstepT > 0) this.backstepT = 0;
        this.startJump();
      }
    } else if (
      input.jumpPressed &&
      !this.grounded &&
      moves.dropKick &&
      this.jumpsLeft <= 0 &&
      input.down
    ) {
      this.startKick(input.axisX());
    } else if (input.jumpPressed && !this.grounded && this.jumpsLeft > 0) {
      this.startJump();
    }
  }
  input.backstepPressed = false;

  if (moves.variableJump && !input.jump && this.jumping && this.vy < s.jumpCutBelow) {
    this.vy *= s.jumpCut;
    this.jumping = false;
  }
  if (this.grounded && !this.kicking) this.jumping = false;

  if (hitting) {
    // locked
  } else if (this.kicking) {
    // locked: fall already set
  } else if (this.slideT > 0) {
    const duration=s.slideTime,remaining=this.slideT/duration,next=(this.slideT-1)/duration;
    this.vx=this.facing*s.slideSpd*duration*(remaining**3-next**3);
    this.slideT--;
    if(this.slideT===0){
      this.slideHit=null;this.slideRecoverT=s.slideRecoverTime||0;
      if(this.slideRecoverT===0)this.endSlide(input);
    }
  } else if (this.slideRecoverT > 0) {
    // locked
  } else if (this.backstepT > 0) {
    const duration = s.backstepTime;
    const remaining = this.backstepT / duration;
    const nextRemaining = (this.backstepT - 1) / duration;
    // Cubic ease-out increments sum to the original speed × duration distance.
    const distance = s.backstepSpd * duration;
    this.vx = -this.facing * distance * (remaining ** 3 - nextRemaining ** 3);
    this.backstepT--;
    const frames = this.sheets.backstep || [];
    this.anim += frames.length / s.backstepTime;
  } else if (this.attackT > 0) {
    this.attackT--;
    const atkFrames = this.currentAttackFrames();
    const last = Math.max(0, atkFrames.length - 1);
    const recover = s.attackRecoverTime || 0;
    const swing = s.attackTime || 16;
    const elapsed = swing + recover - this.attackT;
    if (elapsed < swing) this.anim = last * (elapsed / Math.max(1, swing));
    else this.anim = last;
    if (this.attackKind === "air") {
      this.vx = input.axisX() * s.walkSpd;
    } else this.vx = 0;
    if (this.attackT <= 0) {
      this.anim = 0;
      if (this.attackKind === "crouch" && input.down && this.grounded) {
        this.crouching = true;
        this.setHeight(s.crouchH);
      }
    }
  } else {
    const wantCrouch = moves.crouch && input.down && this.grounded;
    if (wantCrouch && !this.crouching) {
      this.crouching = true;
      this.running = false;
      this.setHeight(s.crouchH);
      this.anim = 0;
    } else if (!wantCrouch && this.crouching && this.grounded) {
      this.crouching = false;
      this.setHeight(s.standH);
      this.anim = 0;
    }

    const ax = input.axisX();
    if (this.grounded) {
      if (ax === 0 || ax !== this.runDir) this.running = false;
      if (ax !== 0) {
        this.facing = ax;
        this.runDir = ax;
      }
    }

    if (this.crouching) {
      this.vx = 0;
    } else if (this.running) {
      if (ax === 0) this.vx = this.runDir * s.runSpd;
      else if (ax === this.runDir) this.vx = ax * s.runSpd;
      else {
        this.running = false;
        this.facing = ax;
        this.vx = ax * s.walkSpd;
      }
    } else {
      if (ax !== 0) this.facing = ax;
      this.vx = ax * s.walkSpd;
    }

    if (this.crouching) {
      this.anim = 0;
    } else if (this.running && this.grounded) {
      this.anim += s.animRun;
    } else if (ax !== 0 && this.grounded) {
      this.anim += s.animWalk;
    } else if (this.grounded) {
      this.anim += s.animIdle;
    } else {
      this.anim += s.animAir;
    }
  }

  if (this.kicking) {
    this.vy = s.kickFall;
    this.vx = this.kickDir * s.kickDiagSpd;
  } else {
    Game.applyGravity(this, s.gravity, s.maxFall);
  }
  if (!hitting && !this.kicking && Game.cellarWineSlow) this.vx *= Game.cellarWineSlow(world,this);
  Game.moveAndCollide(this, world.solids, world);

  if (this.grounded) {
    this.jumpsLeft = s.maxJumps || 1;
    if (this.kicking) {
      this.kicking = false;
      this.kickHit = null;
      this.kickDir = 0;
    }
    if (this.attackKind === "air" && this.attackT > 0) {
      this.attackT = 0;
      this.anim = 0;
    }
  }

  if (!this.grounded && this.slideT <= 0) this.crouching = false;
  if (this.slideT > 0) this.slideHit = this.slideAttackBox();
  else if (!sliding) this.slideHit = null;
  if (this.kicking) this.kickHit = this.kickAttackBox();
  else this.kickHit = null;
  const recover = s.attackRecoverTime || 0;
  if (this.attackT > 0 && this.attackT <= recover) this.attackHit = this.whipAttackBox();
  else this.attackHit = null;

  this.updateSubweapon(input, world);
  this.applyWeaponDamage(world);
  input.clearEdges();
};

Game.Fighter.prototype.applyWeaponDamage = function (world) {
  const enemies = (world && world.enemies) || [];
  const s = this.def.stats;
  const attacker = this;
  function damage(enemy, amount) {
    Game.damageEnemy(enemy, amount, attacker);
  }
  if (this.slideHit) {
    if (!this.slideHits) this.slideHits = new Set();
    enemies.forEach(function (enemy) {
      if (enemy.hp > 0 && Game.aabb(this.slideHit, enemy) && !this.slideHits.has(enemy)) {
        damage(enemy, s.slideDamage);
        this.slideHits.add(enemy);
      }
    }, this);
  }
  if (this.attackHit) {
    if (!this.whipHits) this.whipHits = new Set();
    enemies.forEach(function (enemy) {
      if (enemy.hp > 0 && Game.aabb(this.attackHit, enemy) && !this.whipHits.has(enemy)) {
        damage(enemy, s.whipDamage);
        this.whipHits.add(enemy);
      }
    }, this);
  }
  this.knives = this.knives.filter(function (knife) {
    const enemy = enemies.find(function (enemy) { return enemy.hp > 0 && Game.aabb(knife, enemy); });
    if (!enemy) return true;
    damage(enemy, s.knifeDamage);
    return false;
  });
  this.crosses.forEach(function (cross) {
    if (!cross.hitTimers) cross.hitTimers = new Map();
    cross.hitTimers.forEach(function (time, enemy) {
      cross.hitTimers.set(enemy, Math.max(0, time - 1));
    });
    enemies.forEach(function (enemy) {
      if (enemy.hp > 0 && Game.aabb(cross, enemy) && !(cross.hitTimers.get(enemy) > 0)) {
        damage(enemy, s.crossDamage);
        cross.hitTimers.set(enemy, s.crossTick);
      }
    });
  });
  this.axes.forEach(function (axe) {
    if (!axe.hitPhases) axe.hitPhases = new Map();
    // One hit while rising and one while falling, even during continuous overlap.
    const phase = axe.vy < 0 ? 1 : 2;
    enemies.forEach(function (enemy) {
      const phases = axe.hitPhases.get(enemy) || 0;
      if (enemy.hp > 0 && Game.aabb(axe, enemy) && !(phases & phase)) {
        damage(enemy, s.axeDamage);
        axe.hitPhases.set(enemy, phases | phase);
      }
    });
  });
};

Game.Fighter.prototype.updateSubweapon = function (input, world) {
  const s = this.def.stats;
  const moves = this.def.moves;
  const clockCanStart = this.mp >= (s.clockMinMp || 20);
  if (input.knifePressed && moves.subweapon && (Game.debugTools || this.ownedSubweapons.has('knife'))) this.subweapon = 'knife';
  if (input.crossPressed && moves.subweapon && (Game.debugTools || this.ownedSubweapons.has('cross'))) this.subweapon = "cross";
  if (input.axePressed && moves.subweapon && (Game.debugTools || this.ownedSubweapons.has('axe'))) this.subweapon = "axe";
  if (input.holyPressed && moves.subweapon && (Game.debugTools || this.ownedSubweapons.has('holy'))) this.subweapon = "holy";
  if (input.clockPressed && moves.subweapon && (Game.debugTools || this.ownedSubweapons.has('clock'))) this.subweapon = "clock";
  if (this.clockPulse > 0) this.clockPulse--;
  if (this.clockActive) {
    this.clockTick++;
    if (this.clockTick % (s.clockDrainInterval || 6) === 0) {
      this.mp = Math.max(0, this.mp - (s.clockDrain || 1));
    }
    if (this.mp <= 0) this.clockActive = false;
  } else if (this.mp < this.maxMp && !(moves.subweapon && input.subweaponPressed && this.subweapon === "clock" && clockCanStart && this.hitT <= 0)) {
    this.mp = Math.min(this.maxMp, this.mp + (s.mpRegen || 0));
  }
  if (moves.subweapon && input.subweaponPressed && this.hitT <= 0 && !this.clockActive) {
    if (this.subweapon === "clock") {
      if (clockCanStart) {
        this.clockActive = true;
        this.clockTick = 0;
        this.clockPulse = 36;
      }
    }
    else if (this.subweapon === "cross") this.throwCross(s);
    else if (this.subweapon === "axe") this.throwAxe(s);
    else if (this.subweapon === "holy") this.throwHoly(s);
    else this.throwKnife(s);
  }
  this.updateKnives(world);
  this.updateCrosses(world);
  this.updateAxes(world);
  this.updateHolies(world);
  if (world) world.timeStopped = this.clockActive;
};

Game.Fighter.prototype.throwKnife = function (s) {
  if (this.mp < s.knifeCost) return;
  this.mp -= s.knifeCost;
  const w = s.knifeW;
  const h = s.knifeH;
  this.knives.push({
    x: this.facing > 0 ? this.x + this.w : this.x - w,
    y: this.y + Math.round(this.h * 0.42 - h / 2),
    w: w,
    h: h,
    vx: this.facing * s.knifeSpeed,
    life: s.knifeLife,
    facing: this.facing
  });
};

Game.Fighter.prototype.throwCross = function (s) {
  if (this.crosses.length >= (s.crossMax || 1) || this.mp < s.crossCost) return;
  this.mp -= s.crossCost;
  const size = s.crossSize;
  this.crosses.push({
    x: this.facing > 0 ? this.x + this.w : this.x - size,
    y: this.y + Math.round(this.h * 0.42 - size / 2),
    w: size,
    h: size,
    facing: this.facing,
    phase: "out",
    t: 0,
    angle: 0,
    cost: s.crossCost
  });
};

Game.Fighter.prototype.throwAxe = function (s) {
  if (this.mp < s.axeCost) return;
  this.mp -= s.axeCost;
  const w = s.axeW;
  const h = s.axeH;
  this.axes.push({
    x: this.facing > 0 ? this.x + this.w : this.x - w,
    y: this.y + Math.round(this.h * 0.42 - h / 2),
    w: w,
    h: h,
    vx: this.facing * s.axeSpeed,
    vy: s.axeV,
    facing: this.facing,
    angle: 0
  });
};

Game.Fighter.prototype.updateAxes = function (world) {
  const s = this.def.stats;
  const kept = [];
  const width = world && world.width ? world.width : 960;
  const height = world && world.height ? world.height : 540;
  for (let i = 0; i < this.axes.length; i++) {
    const axe = this.axes[i];
    const gravity = axe.vy >= 0 ? (s.axeFallGravity || s.axeGravity) : s.axeGravity;
    axe.vy = Math.min(axe.vy + gravity, s.axeMaxFall || 12);
    // Ease forward travel near the apex, then regain speed during the fall.
    const verticalSpeedRatio = Math.min(1, Math.abs(axe.vy) / Math.abs(s.axeV));
    axe.vx = axe.facing * s.axeSpeed * (0.2 + 0.8 * verticalSpeedRatio);
    axe.x += axe.vx;
    axe.y += axe.vy;
    axe.angle += s.axeSpin || 0;
    if (axe.y > height) continue;
    if (axe.x + axe.w < 0 || axe.x > width) continue;
    kept.push(axe);
  }
  this.axes = kept;
};

Game.Fighter.prototype.throwHoly = function (s) {
  if (this.mp < s.holyCost) return;
  this.mp -= s.holyCost;
  const w = s.holyW;
  const h = s.holyH;
  this.holies.push({
    x: this.facing > 0 ? this.x + this.w : this.x - w,
    y: this.y + Math.round(this.h * 0.42 - h / 2),
    w: w,
    h: h,
    vx: this.facing * s.holySpeed,
    vy: s.holyV,
    facing: this.facing,
    phase: "fly",
    angle: 0,
    t: 0,
    tick: 0
  });
};

Game.Fighter.prototype.igniteHoly = function (bottle, s) {
  const cx = bottle.x + bottle.w / 2;
  const feet = bottle.y + bottle.h;
  bottle.phase = "flame";
  bottle.vx = 0;
  bottle.vy = 0;
  bottle.w = s.holyFlameW;
  bottle.h = s.holyFlameH;
  bottle.x = cx - bottle.w / 2;
  bottle.y = feet - bottle.h;
  bottle.t = s.holyFlameTime;
  bottle.tick = 0;
};

Game.Fighter.prototype.updateHolies = function (world) {
  const s = this.def.stats;
  const kept = [];
  const enemies = (world && world.enemies) || [];
  const height = world && world.height ? world.height : 540;
  for (let i = 0; i < this.holies.length; i++) {
    const holy = this.holies[i];
    if (holy.phase === "flame") {
      if (holy.tick > 0) holy.tick--;
      else {
        for (let e = 0; e < enemies.length; e++) {
          const enemy = enemies[e];
          if (enemy.hp == null || enemy.hp <= 0) continue;
          if (!Game.aabb(holy, enemy)) continue;
          Game.damageEnemy(enemy, s.holyDamage || 0, this);
        }
        holy.tick = s.holyTick || 8;
      }
      holy.t--;
      if (holy.t <= 0) continue;
      kept.push(holy);
      continue;
    }
    holy.vy = Math.min(holy.vy + s.holyGravity, s.holyMaxFall || 12);
    if (holy.phase === "fall") holy.vx = 0;
    holy.angle += (holy.facing || 1) * (s.holySpin || 0);
    Game.moveAndCollide(holy, world.solids, world);
    if (holy.phase === "fly") {
      let hitEnemy = false;
      for (let e = 0; e < enemies.length; e++) {
        if (enemies[e].hp > 0 && Game.aabb(holy, enemies[e])) hitEnemy = true;
      }
      if (hitEnemy) {
        holy.phase = "fall";
        holy.vx = 0;
        if (holy.grounded) this.igniteHoly(holy, s);
      } else if (holy.grounded) {
        this.igniteHoly(holy, s);
      }
    } else if (holy.grounded) {
      this.igniteHoly(holy, s);
    }
    if (holy.y > height) continue;
    kept.push(holy);
  }
  this.holies = kept;
};

Game.Fighter.prototype.updateKnives = function (world) {
  const kept = [];
  for (let i = 0; i < this.knives.length; i++) {
    const knife = this.knives[i];
    knife.x += knife.vx;
    knife.life--;
    if (knife.life <= 0) continue;
    if (knife.x + knife.w < 0 || knife.x > world.width) continue;
    kept.push(knife);
  }
  this.knives = kept;
};

Game.Fighter.prototype.updateCrosses = function (world) {
  const s = this.def.stats;
  const kept = [];
  const width = world && world.width ? world.width : 960;
  for (let i = 0; i < this.crosses.length; i++) {
    const cross = this.crosses[i];
    cross.t++;
    if (cross.phase === "out") {
      cross.x += cross.facing * s.crossSpeed;
      cross.angle += s.crossSpin;
      if (cross.t >= s.crossOutTime) {
        cross.phase = "hover";
        cross.t = 0;
      }
    } else if (cross.phase === "hover") {
      cross.angle += s.crossSpin * 0.35;
      if (cross.t >= s.crossHoverTime) {
        cross.phase = "back";
        cross.t = 0;
      }
    } else {
      cross.x -= cross.facing * s.crossSpeed;
      cross.angle -= s.crossSpin;
      if (Game.aabb(cross, this.hurtBox())) {
        if (!this.clockActive) this.mp = Math.min(this.maxMp, this.mp + cross.cost * 0.5);
        continue;
      }
      const past = cross.facing > 0 ? cross.x + cross.w < 0 : cross.x > width;
      if (past) continue;
    }
    kept.push(cross);
  }
  this.crosses = kept;
};

Game.Fighter.prototype.drawKnives = function (ctx) {
  for (let i = 0; i < this.knives.length; i++) {
    const knife = this.knives[i];
    const handleW = Math.max(6, Math.round(knife.w * 0.18));
    const inset = Math.max(2, Math.round(knife.h * 0.18));
    const handle = knife.facing > 0 ? knife.x : knife.x + knife.w - handleW;
    const bladeX = knife.facing > 0 ? knife.x + handleW : knife.x;
    ctx.fillStyle = "#c8c8d0";
    ctx.fillRect(bladeX, knife.y + inset, knife.w - handleW, knife.h - inset * 2);
    ctx.fillStyle = "#6a3a28";
    ctx.fillRect(handle, knife.y, handleW, knife.h);
  }
  for (let i = 0; i < this.crosses.length; i++) {
    const cross = this.crosses[i];
    const cx = cross.x + cross.w / 2;
    const cy = cross.y + cross.h / 2;
    const arm = Math.max(6, Math.round(cross.w * 0.22));
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(cross.angle);
    ctx.fillStyle = "#e6d37a";
    ctx.fillRect(-arm / 2, -cross.h / 2, arm, cross.h);
    ctx.fillRect(-cross.w / 2, -arm / 2, cross.w, arm);
    ctx.restore();
  }
  for (let i = 0; i < this.axes.length; i++) {
    const axe = this.axes[i];
    const cx = axe.x + axe.w / 2;
    const cy = axe.y + axe.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(axe.angle);
    ctx.fillStyle = "#6a3a28";
    ctx.fillRect(-axe.w * 0.1, -axe.h * 0.42, axe.w * 0.2, axe.h * 0.84);
    ctx.fillStyle = "#d5d8e0";
    ctx.fillRect(-axe.w * 0.5, -axe.h * 0.5, axe.w * 0.92, axe.h * 0.28);
    ctx.fillStyle = "#8e96a3";
    ctx.fillRect(-axe.w * 0.5, -axe.h * 0.24, axe.w * 0.92, axe.h * 0.08);
    ctx.restore();
  }
  for (let i = 0; i < this.holies.length; i++) {
    const holy = this.holies[i];
    if (holy.phase === "flame") {
      const tongues = 5;
      for (let n = 0; n < tongues; n++) {
        const flick = (holy.t + n * 3) % 8;
        const tw = holy.w / tongues;
        const rise = holy.h * (0.45 + ((flick % 5) * 0.1));
        ctx.fillStyle = n % 2 ? "#ffd56a" : "#ff6a22";
        ctx.fillRect(holy.x + n * tw + 2, holy.y + holy.h - rise, tw - 4, rise);
      }
      ctx.fillStyle = "#ffe7a0";
      ctx.fillRect(holy.x + holy.w * 0.28, holy.y + holy.h * 0.42, holy.w * 0.44, holy.h * 0.5);
      continue;
    }
    const cx = holy.x + holy.w / 2;
    const cy = holy.y + holy.h / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(holy.angle);
    ctx.fillStyle = "#d7b07a";
    ctx.fillRect(-holy.w * 0.12, -holy.h * 0.5, holy.w * 0.24, holy.h * 0.14);
    ctx.fillStyle = "#9fd7ea";
    ctx.fillRect(-holy.w * 0.1, -holy.h * 0.36, holy.w * 0.2, holy.h * 0.16);
    ctx.fillStyle = "#d5f2fb";
    ctx.fillRect(-holy.w * 0.34, -holy.h * 0.2, holy.w * 0.68, holy.h * 0.62);
    ctx.fillStyle = "#3f8fd0";
    ctx.fillRect(-holy.w * 0.26, holy.h * 0.02, holy.w * 0.52, holy.h * 0.32);
    ctx.restore();
  }
};

Game.Fighter.prototype.currentAttackFrames = function () {
  if (this.attackKind === "crouch") return this.sheets.attackCrouch || [];
  if (this.attackKind === "air") return this.sheets.attackAir || [];
  return this.sheets.attackStand || [];
};

Game.Fighter.prototype.currentFrames = function () {
  if (this.hitT > 0) {
    const frame = this.sheets.hit[this.hitKey];
    return frame ? [frame] : this.sheets.idle || [];
  }
  if (this.kickInvuln > 0) {
    if (this.kickBounceDir !== 0) return this.sheets.kickDiagonal || this.sheets.kickVertical || [];
    return this.sheets.kickVertical || [];
  }
  if (this.attackT > 0) return this.currentAttackFrames();
  if (this.kicking) {
    if (this.kickDir !== 0) return this.sheets.kickDiagonal || this.sheets.kickVertical || [];
    return this.sheets.kickVertical || [];
  }
  if (this.slideT > 0 || this.slideRecoverT > 0) return this.sheets.slide || [];
  if (this.backstepT > 0) return this.sheets.backstep || [];
  if (this.inAir()) return this.sheets.jump || [];
  if (this.crouching) return this.sheets.crouch || [];
  if (this.running && Math.abs(this.vx) > 0.1) return this.sheets.run || [];
  if (Math.abs(this.vx) > 0.1) return this.sheets.walk || [];
  return this.sheets.idle || [];
};

Game.Fighter.prototype.draw = function (ctx) {
  const frames = this.currentFrames();
  let idx = Math.floor(this.anim);
  if (this.slideT > 0 || this.slideRecoverT > 0 || this.backstepT > 0 || this.crouching || this.hitT > 0 || this.kicking || this.attackT > 0) {
    idx = Math.min(frames.length - 1, Math.max(0, idx));
  } else if (frames.length) {
    idx = idx % frames.length;
  }
  const frame = frames.length ? frames[idx] : null;
  if (frame) {
    const scale = (frame.fit || 1) * (this.def.spriteScale || 1);
    const ox = frame.originX != null ? frame.originX : frame.sw / 2;
    const oy = frame.originY != null ? frame.originY : frame.sh;
    ctx.save();
    ctx.imageSmoothingEnabled = false;
    ctx.translate(Math.round(this.x + this.w / 2), Math.round(this.y + this.h));
    if (this.facing < 0) ctx.scale(-1, 1);
    ctx.drawImage(
      frame.source, frame.sx, frame.sy, frame.sw, frame.sh,
      Math.round(-ox * scale),
      Math.round(-oy * scale),
      Math.round(frame.sw * scale),
      Math.round(frame.sh * scale)
    );
    ctx.restore();
  } else {
    ctx.fillStyle = "#c44";
    ctx.fillRect(this.x, this.y, this.w, this.h);
  }
  this.drawKnives(ctx);
  if (!Game.debug) return;
  ctx.save();
  ctx.lineWidth = 2;
  const hurt = this.hurtBox();
  ctx.strokeStyle = "#3dff6a";
  ctx.strokeRect(hurt.x + 1, hurt.y + 1, hurt.w - 2, hurt.h - 2);
  ctx.strokeStyle = "#ff4040";
  const boxes = [this.slideHit, this.kickHit, this.attackHit].concat(this.knives, this.crosses, this.axes, this.holies);
  boxes.forEach(function (box) {
    if (!box) return;
    ctx.strokeRect(box.x + 1, box.y + 1, box.w - 2, box.h - 2);
  });
  ctx.restore();
};
