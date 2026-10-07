window.Game = window.Game || {};

Game.applyGravity = function (body, gravity, maxFall) {
  body.vy += gravity;
  if (body.vy > maxFall) body.vy = maxFall;
};

Game.moveAndCollide = function (body, solids, world) {
  body.x += body.vx;
  solids.forEach(function (s) {
    if (s.disabled) return;
    if (s.oneWay) return;
    if (!Game.aabb(body, s)) return;
    if (body.vx > 0) body.x = s.x - body.w;
    else if (body.vx < 0) body.x = s.x + s.w;
  });

  const prevBottom = body.y + body.h;
  body.y += body.vy;
  body.grounded = false;
  solids.forEach(function (s) {
    if (s.disabled) return;
    if (!Game.aabb(body, s)) return;
    if (body.vy >= 0 && prevBottom <= s.y + 6) {
      body.y = s.y - body.h;
      body.vy = 0;
      body.grounded = true;
    } else if (!s.oneWay && body.vy < 0) {
      body.y = s.y + s.h;
      body.vy = 0;
    }
  });

  body.x = Game.clamp(body.x, 0, world.width - body.w);
};
