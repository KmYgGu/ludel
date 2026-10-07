from pathlib import Path
p=Path('js/character.js');s=p.read_text();start=s.index('Game.Fighter.prototype.crouchWhipBoxes');end=s.index('Game.Fighter.prototype.onKickConnect',start);s=s[:start]+s[end:];p.write_text(s)
p=Path('tests/crouch-whip.test.js');s=p.read_text();s=s[:s.index('f.sheets.attackCrouch')]+'''f.facing=1;
const right=f.whipAttackBox();
assert.equal(right.w,420);assert.equal(right.h,64);
const cx=f.x+f.w/2;
f.facing=-1;const left=f.whipAttackBox();
assert.equal(left.x,2*cx-right.x-right.w);assert.equal(left.y,right.y);
f.facing=1;f.attackHit=right;
const hit={x:right.x+right.w-5,y:right.y+10,w:5,h:5,hp:100};
const miss={x:right.x,y:right.y-20,w:5,h:5,hp:100};
f.applyWeaponDamage({enemies:[hit,miss]});assert.equal(hit.hp,80);assert.equal(miss.hp,100);
f.applyWeaponDamage({enemies:[hit,miss]});assert.equal(hit.hp,80);
console.log('PASS: generous rectangle, left/right mirror, inside/outside hits and once-per-swing damage.');
''';p.write_text(s)
