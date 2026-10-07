const fs = require('fs'), vm = require('vm'), assert = require('assert');
global.window = global;
for (const file of ['js/core.js', 'js/character.js', 'js/characters/rubania.js']) {
  vm.runInThisContext(fs.readFileSync(file, 'utf8'));
}
for (const facing of [-1, 1]) {
  const fighter = new Game.Fighter(Game.Characters.rubania, {x: 1000, y: 700});
  fighter.facing = facing;
  fighter.throwAxe(fighter.def.stats);
  const axe = fighter.axes[0], samples = [];
  for (let tick = 0; tick < 82; tick++) {
    fighter.updateAxes({width: 4000, height: 2000});
    assert.equal(Math.sign(axe.vx), facing, 'forward direction stays unchanged');
    samples.push(Math.hypot(axe.vx, axe.vy));
  }
  const apex = samples.indexOf(Math.min(...samples));
  assert(apex > 0 && apex < samples.length - 1);
  for (let i = 1; i <= apex; i++) assert(samples[i] < samples[i - 1], 'slows approaching apex');
  for (let i = apex + 1; i < samples.length; i++) assert(samples[i] >= samples[i - 1], 'accelerates falling until terminal speed');
  assert(samples[samples.length - 1] > samples[apex] * 10);
  assert(samples[apex] < samples[0] * 0.1, 'apex visibly slows the entire movement');
}
function riseHeight(velocity, gravity) {
  let y = 0, top = 0;
  while (velocity < 0) {
    velocity += gravity;
    y += velocity;
    top = Math.min(top, y);
  }
  return -top;
}
const stats = Game.Characters.rubania.stats;
assert(Math.abs(riseHeight(stats.axeV, stats.axeGravity) - riseHeight(-14.5, 0.34)) < 0.01,
  'faster launch retains original apex height');
console.log('PASS: axe slows toward apex and accelerates falling in both directions.');
