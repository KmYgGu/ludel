window.Game = window.Game || {};
Game.Stages = Game.Stages || {};

Game.Stages.outerWall = {
  "id": "outerWall",
  "name": "외벽 회랑",
  "sprite": "sprites/stages/outer_wall.png",
  "palette": [
    "#20242b",
    "#232b38",
    "#292f3b",
    "#29313e",
    "#293347",
    "#2a303b",
    "#2a303c",
    "#2b323f",
    "#2b3445",
    "#2d3544",
    "#2f3542",
    "#303743",
    "#303a4e",
    "#313844",
    "#333a45",
    "#333c4e",
    "#373f4d",
    "#3f4858",
    "#10151d",
    "#343e4c",
    "#586678",
    "#8b9bab",
    "#b1bbc5",
    "#242e3f"
  ],
  "stone": {
    "shadow": "#10151d",
    "face": "#343e4c",
    "edge": "#586678",
    "platform": "#8b9bab",
    "highlight": "#b1bbc5"
  }
};

Game.createOuterWallPlatform = function () {
  return {x:550,y:550,w:180,h:20,oneWay:true,crumbling:true,
    homeY:550,state:'ready',ticks:0,angle:0,vy:0,disabled:false};
};

Game.updateOuterWallPlatforms = function (world, fighter, slimes) {
  if (world.timeStopped) return;
  world.solids.filter(s=>s.crumbling).forEach(function (platform) {
    if (platform.state === 'ready') {
      const occupied = [fighter].concat(slimes || []).some(function (body) {
        const feet = body.feet == null ? body.y + body.h : body.feet;
        return body.hp > 0 && body.x + body.w > platform.x && body.x < platform.x + platform.w
          && Math.abs(feet - platform.y) < 2 && Math.abs(body.vy) < 0.01;
      });
      if (occupied) { platform.state='warning'; platform.ticks=0; }
    } else if (platform.state === 'warning') {
      platform.ticks++;
      platform.angle=Math.sin(platform.ticks*0.3)*(0.025+0.095*platform.ticks/90);
      if (platform.ticks >= 90) { platform.state='falling'; platform.disabled=true; platform.vy=2; }
    } else if (platform.state === 'falling') {
      platform.vy+=0.6;
      platform.y+=platform.vy;
      platform.angle+=0.035;
      if (platform.y > world.height+platform.w) { platform.state='waiting'; platform.ticks=120; }
    } else if (platform.state === 'waiting') {
      if (--platform.ticks <= 0) { platform.state='rising'; platform.y=world.height+platform.h; platform.angle=0; }
    } else if (platform.state === 'rising') {
      platform.y=Math.max(platform.homeY,platform.y-4);
      if (platform.y === platform.homeY) { platform.state='ready'; platform.disabled=false; platform.vy=0; }
    }
  });
};
