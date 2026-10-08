# Boss combat and Arena

When adding or changing a boss or attack, support both campaign combat and spectator Arena combat.

- Use the target passed into `update(target)` / `resolveContact(target)`. Never obtain the player through a global variable or read human input to decide a boss response.
- Test attack overlap with `Game.combatOverlap(target, attackBox)` before calling `target.takeHit(hit)` or `target.launchFromCounter(hit, direction)`. This collects every intersecting body when a boss splits. Aim selection must not restrict damage to one body. Penetrating projectiles keep a per-projectile `hitBodies` Set so each body is damaged once. Only continuous contact/fire uses `continuous:true` damage protection; separate shots must each cause damage and the original recoil.
- Preserve the campaign encounter factory, HP, damage, ammo, defenses, and animation assets in Arena; do not create a second set of balance values.
- Register a new boss with `Game.registerArenaBoss` in `arena.js`: supply its stage, name, encounter factory, asset attachment, spawn positioning, and visible combat state. Encounter bodies currently use the `slimes` collection (including the humanoid boss); each has `x,y,w,h,hp,takeDamage`. Encounters expose `totalHp`, `update`, `resolveContact`, and `draw`.
- Extend the combat-state adapter when adding patterns. State reports phase, attacking, grounded, low posture, attack kind, facing, reach, hitbox, and projectiles. Responses must use observable movement/attack cues, not future random decisions.
- Record first encounters through `Game.arena.encounterStage(stageId)`. Different-stage pairs are generated from the registry. Add arena terrain construction/rendering when introducing a new stage; the existing two-stage layout must not silently become the new stage's layout.
- Validate new attacks against a player, a humanoid opponent, and a split slime. Keep spectator controls separate from player controls and campaign rewards. Run `tests/arena.test.js` and affected campaign tests.
