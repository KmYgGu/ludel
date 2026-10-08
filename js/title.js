(function () {
  const title = document.getElementById('title-screen');
  const main = document.getElementById('main-menu');
  const settings = document.getElementById('settings-menu');
  const ranking = document.getElementById('ranking-menu');
  const arenaPanel=document.getElementById('arena-menu');
  const start = document.getElementById('start-game');
  const controls = document.querySelector('body > p');
  const debugStage = document.getElementById('debug-start-stage');
  const stages = [{ id: 'outerWall', name: Game.Stages.outerWall.name }, Game.Stages.wineCellar];
  let selectedStage = 0;
  function updateDebugStage() {
    debugStage.hidden = !Game.debugTools;
    debugStage.textContent = '디버그 · 시작: ' + (selectedStage + 1) + ' 스테이지 — ' + stages[selectedStage].name + ' (마우스 휠)';
  }
  updateDebugStage();
  title.addEventListener('wheel', function (event) {
    if (!Game.debugTools || !Game.menu.active || main.hidden || !event.deltaY) return;
    event.preventDefault();
    selectedStage = (selectedStage + (event.deltaY > 0 ? 1 : -1) + stages.length) % stages.length;
    Game.menu.startStage = stages[selectedStage].id;
    updateDebugStage();
  }, { passive: false });
  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }
  function show(panel) {
    [main, settings, ranking, arenaPanel].forEach(function (item) { if(item)item.hidden = item !== panel; });
    panel.querySelector('button').focus();
  }
  const preference = read('rubania-settings', { showControls: true });
  const checkbox = document.getElementById('show-controls');
  checkbox.checked = preference.showControls;
  controls.hidden = true;
  checkbox.addEventListener('change', function () {
    preference.showControls = checkbox.checked;
    write('rubania-settings', preference);
  });
  document.getElementById('open-settings').addEventListener('click', function () { show(settings); });
  document.getElementById('open-arena').addEventListener('click',function(){if(Game.arena&&Game.arena.unlocked())show(arenaPanel);});
  document.getElementById('open-ranking').addEventListener('click', function () {
    const list = document.getElementById('rank-list');
    list.replaceChildren();
    const records = read('rubania-ranking', []);
    if (!records.length) {
      const item = document.createElement('li'); item.textContent = '아직 클리어 기록이 없습니다.'; list.appendChild(item);
    }
    records.forEach(function (record) {
      const item = document.createElement('li');
      item.textContent = record.seconds.toFixed(1) + '초 · 남은 체력 ' + record.hp;
      list.appendChild(item);
    });
    show(ranking);
  });
  document.querySelectorAll('[data-back]').forEach(function (button) {
    button.addEventListener('click', function () { show(main); });
  });
  document.getElementById('fullscreen').addEventListener('click', function () {
    const action = document.fullscreenElement ? document.exitFullscreen() : document.querySelector('.screen').requestFullscreen();
    if (action && action.catch) action.catch(function () {});
  });
  start.addEventListener('click', function () {
    Game.menu.active = false;
    title.hidden = true;
    if (Game.menu.onStart) Game.menu.onStart();
    controls.hidden = !preference.showControls;
    document.getElementById('game').focus();
  });
  Game.menu = {
    active: true,
    startStage: stages[0].id,
    ready: function () { start.disabled = false; start.focus(); },
    record: function (seconds, hp) {
      const records = read('rubania-ranking', []);
      records.push({ seconds: seconds, hp: hp });
      records.sort(function (a, b) { return a.seconds - b.seconds || b.hp - a.hp; });
      write('rubania-ranking', records.slice(0, 10));
    }
  };
})();
