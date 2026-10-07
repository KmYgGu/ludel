from pathlib import Path
p=Path('js/game.js');s=p.read_text(encoding="utf-8");a=s.index('  function drawHp(actor)');b=s.index('  function drawTimer()',a);s=s[:a]+"  function drawHp(actor) { Game.Hud.player(ctx, actor); }\n\n"+s[b:];s=s.replace('ctx.fillText("슬라임 HP " + Math.ceil(encounter.totalHp()) + " / " + slimeDef.maxHp + "  " + encounter.slimes.length + "마리", WORLD.width - 260, 24);','Game.Hud.boss(ctx, slimeDef.name, encounter.totalHp(), slimeDef.maxHp, WORLD.width, WORLD.height);');p.write_text(s,encoding="utf-8")
p=Path('js/hud.js');s=p.read_text(encoding="utf-8").replace('生命','체력').replace('魔力','마력');p.write_text(s,encoding="utf-8")

