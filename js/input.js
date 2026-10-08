window.Game = window.Game || {};

Game.Input = function () {
  this.left = false;
  this.right = false;
  this.down = false;
  this.up = false;
  this.jump = false;
  this.jumpPressed = false;
  this.attack = false;
  this.attackPressed = false;
  this.backstepPressed = false;
  this.subweaponPressed = false;
  this.knifePressed = false;
  this.crossPressed = false;
  this.axePressed = false;
  this.holyPressed = false;
  this.clockPressed = false;
  this.frame = 0;
  this.tap = { dir: 0, frame: -999, released: true };
};

Game.Input.prototype.axisX = function () {
  return (this.right ? 1 : 0) - (this.left ? 1 : 0);
};

Game.Input.prototype.clearEdges = function () {
  this.knifePressed = false;
  this.clockPressed = false;
  this.jumpPressed = false;
  this.attackPressed = false;
  this.backstepPressed = false;
  this.subweaponPressed = false;
  this.crossPressed = false;
  this.axePressed = false;
  this.holyPressed = false;
};

Game.Input.prototype.tryRunTap = function (dir, fighter) {
  const tap = this.tap;
  const s = fighter.def.stats;
  if (
    dir === tap.dir &&
    tap.released &&
    this.frame - tap.frame <= s.tapWindow &&
    fighter.canStartRun()
  ) {
    fighter.startRun(dir);
  }
  tap.dir = dir;
  tap.frame = this.frame;
  tap.released = false;
};

Game.Input.prototype.bind = function (fighter) {
  const input = this;
  if (Game.bindMobileInput) Game.bindMobileInput(input, fighter);
  window.addEventListener("keydown", function (e) {
    if ((Game.arena&&Game.arena.active) || Game.paused || (Game.menu && Game.menu.active) || Game.stageIntro || Game.clearSequence || Game.deathState || (Game.shop && Game.shop.active)) return;
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      if (!input.left) input.tryRunTap(-1, fighter);
      input.left = true;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      if (!input.right) input.tryRunTap(1, fighter);
      input.right = true;
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") {
      input.down = true;
      e.preventDefault();
    }
    if (e.code === "KeyX" && !e.repeat) input.backstepPressed = true;
    if (e.code === "KeyC" && !e.repeat) input.subweaponPressed = true;
    if ((e.code === "Digit1" || e.code === "Numpad1") && !e.repeat) input.knifePressed = true;
    if ((e.code === "Digit2" || e.code === "Numpad2") && !e.repeat) input.crossPressed = true;
    if ((e.code === "Digit3" || e.code === "Numpad3") && !e.repeat) input.axePressed = true;
    if ((e.code === "Digit4" || e.code === "Numpad4") && !e.repeat) input.holyPressed = true;
    if ((e.code === "Digit5" || e.code === "Numpad5") && !e.repeat) input.clockPressed = true;
    if (e.code === "KeyZ") {
      if (!input.jump) input.jumpPressed = true;
      input.jump = true;
      e.preventDefault();
    }
    if (e.code === "Space") {
      if (!input.attack) input.attackPressed = true;
      input.attack = true;
      e.preventDefault();
    }
    if (e.code === "ArrowUp" || e.code === "KeyW") {
      input.up = true;
      e.preventDefault();
    }
    if ((e.code === "Digit0" || e.code === "Numpad0") && !e.repeat) {
      Game.debug = !Game.debug;
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.code === "ArrowLeft" || e.code === "KeyA") {
      input.left = false;
      input.tap.released = true;
    }
    if (e.code === "ArrowRight" || e.code === "KeyD") {
      input.right = false;
      input.tap.released = true;
    }
    if (e.code === "ArrowDown" || e.code === "KeyS") input.down = false;
    if (e.code === "ArrowUp" || e.code === "KeyW") input.up = false;
    if (e.code === "KeyZ") input.jump = false;
    if (e.code === "Space") input.attack = false;
  });
};
