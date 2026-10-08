(function () {
  const media=window.matchMedia('(pointer:coarse) and (max-width:900px), (pointer:coarse) and (orientation:landscape) and (max-height:600px)');
  const root=document.getElementById('mobile-controls');
  const setting=document.getElementById('reverse-mobile-controls');
  let lastHaptic=-Infinity;
  Game.mobileHaptic=function(){
    if(!media.matches || !window.navigator || typeof window.navigator.vibrate!=='function')return;
    const now=Date.now();
    if(now-lastHaptic<45)return;
    try { window.navigator.vibrate(8); lastHaptic=now; } catch (_) {}
  };
  document.addEventListener('pointerdown',function(event){
    const control=event.target.closest && event.target.closest('button, input[type="checkbox"]');
    if(control && !control.id.startsWith('mobile-'))Game.mobileHaptic();
  },true);
  const screenRoot=document.querySelector('.screen');
  function syncOrientation(){
    const angle=window.screen && window.screen.orientation ? window.screen.orientation.angle : window.orientation;
    screenRoot.style.setProperty('--portrait-rotation',(angle===270?90:-90)+'deg');
  }
  window.addEventListener('resize',syncOrientation);
  window.addEventListener('orientationchange',syncOrientation);
  syncOrientation();
  Game.lockMobilePortrait=async function(){
    if(!media.matches)return;
    const orientation=window.screen && window.screen.orientation;
    if(!orientation || !orientation.lock)return;
    try { await orientation.lock('portrait-primary'); return; } catch (_) {}
    try {
      if(!document.fullscreenElement && screenRoot.requestFullscreen)await screenRoot.requestFullscreen();
      await orientation.lock('portrait-primary');
    } catch (_) { /* CSS keeps a portrait layout when browser locking is unavailable. */ }
  };
  document.getElementById('start-game').addEventListener('click',Game.lockMobilePortrait);
  document.addEventListener('fullscreenchange',function(){if(document.fullscreenElement)Game.lockMobilePortrait();});
  let reversed=false;
  try { reversed=localStorage.getItem('rubania-mobile-reversed')==='true'; } catch (_) {}
  function applyLayout(){document.querySelector('.screen').classList.toggle('mobile-reversed',reversed);setting.checked=reversed;}
  applyLayout();
  setting.addEventListener('change',function(){reversed=setting.checked;applyLayout();try{localStorage.setItem('rubania-mobile-reversed',String(reversed));}catch(_){} });
  Game.bindMobileInput=function(input,fighter){
    const stick=document.getElementById('mobile-stick'),knob=document.getElementById('mobile-stick-knob');
    let stickPointer=null,enabled=false;
    const held=new Map();
    function playable(){return media.matches && !Game.paused && !(Game.menu&&Game.menu.active) && !Game.stageIntro && !Game.clearSequence && !Game.deathState && !(Game.shop&&Game.shop.active);}
    function direction(x,y,feedback){
      const old=input.axisX();
      const oldY=(input.down?1:0)-(input.up?1:0);
      input.left=x < -0.25;input.right=x > 0.25;input.up=y < -0.25;input.down=y > 0.25;
      const next=input.axisX();
      const nextY=(input.down?1:0)-(input.up?1:0);
      if(feedback && (next!==old || nextY!==oldY) && (next || nextY))Game.mobileHaptic();
      if(next!==old){input.tap.released=true;if(next)input.tryRunTap(next,fighter);}
    }
    function moveStick(event){
      const box=stick.getBoundingClientRect(),radius=(stick.offsetWidth||box.width)*0.35;
      const dx=event.clientX-box.left-box.width/2,dy=event.clientY-box.top-box.height/2;
      const angle=window.screen && window.screen.orientation ? window.screen.orientation.angle : window.orientation;
      const rotated=window.innerWidth>window.innerHeight;
      const rotation=rotated?(angle===270?Math.PI/2:-Math.PI/2):0;
      let x=(dx*Math.cos(rotation)+dy*Math.sin(rotation))/radius,y=(-dx*Math.sin(rotation)+dy*Math.cos(rotation))/radius;
      const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
      direction(x,y,true);knob.style.transform='translate('+x*radius+'px,'+y*radius+'px)';
    }
    stick.addEventListener('pointerdown',function(e){if(!playable()||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
    stick.addEventListener('pointermove',function(e){if(e.pointerId===stickPointer){e.preventDefault();moveStick(e);}});
    function releaseStick(e){if(e&&e.pointerId!==stickPointer)return;stickPointer=null;direction(0,0);knob.style.transform='';}
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stick.addEventListener(type,releaseStick));
    function action(id,key,edge){
      const button=document.getElementById(id);
      button.addEventListener('pointerdown',function(e){if(!playable())return;e.preventDefault();Game.mobileHaptic();button.setPointerCapture(e.pointerId);held.set(e.pointerId,{button,key});if(key)input[key]=true;input[edge]=true;button.classList.add('pressed');});
      function release(e){const item=held.get(e.pointerId);if(!item||item.button!==button)return;held.delete(e.pointerId);if(key)input[key]=Array.from(held.values()).some(h=>h.key===key);if(!Array.from(held.values()).some(h=>h.button===button))button.classList.remove('pressed');}
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>button.addEventListener(type,release));
      button.addEventListener('contextmenu',e=>e.preventDefault());
    }
    action('mobile-attack','attack','attackPressed');
    action('mobile-jump','jump','jumpPressed');
    action('mobile-subweapon',null,'subweaponPressed');
    action('mobile-dodge',null,'backstepPressed');
    function reset(){releaseStick();held.forEach(h=>h.button.classList.remove('pressed'));held.clear();input.jump=false;input.attack=false;input.clearEdges();}
    Game.resetMobileInput=reset;
    window.addEventListener('blur',reset);
    document.addEventListener('visibilitychange',function(){if(document.hidden)reset();});
    setting.addEventListener('change',reset);
    function refresh(){const active=playable();root.hidden=!active;if(enabled&&!active)reset();enabled=active;requestAnimationFrame(refresh);}
    refresh();
  };
  Game.mobileHudScale=function(){
    const canvas=document.getElementById('game');
    return media.matches ? canvas.width/Math.max(1,canvas.offsetWidth||canvas.getBoundingClientRect().width) : 1;
  };
  Game.drawMobileTimer=function(world,label){
    if(!media.matches)return false;
    document.getElementById('mobile-timer-value').textContent=label;
    document.getElementById('mobile-timer-label').textContent=world.timer.expired?'적 공격력 ×2':world.timeStopped?'시간 정지':'제한 시간';
    document.getElementById('mobile-timer').style.color=world.timer.expired?'#ed7465':world.timeStopped?'#9fc9df':'#e3d8c5';
    return true;
  };
})();
