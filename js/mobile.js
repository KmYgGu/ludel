(function () {
  const media=window.matchMedia('(pointer:coarse) and (max-width:900px)');
  const root=document.getElementById('mobile-controls');
  const setting=document.getElementById('reverse-mobile-controls');
  let reversed=false;
  try { reversed=localStorage.getItem('rubania-mobile-reversed')==='true'; } catch (_) {}
  function applyLayout(){document.querySelector('.screen').classList.toggle('mobile-reversed',reversed);setting.checked=reversed;}
  applyLayout();
  setting.addEventListener('change',function(){reversed=setting.checked;applyLayout();try{localStorage.setItem('rubania-mobile-reversed',String(reversed));}catch(_){} });
  Game.bindMobileInput=function(input,fighter){
    const stick=document.getElementById('mobile-stick'),knob=document.getElementById('mobile-stick-knob');
    let stickPointer=null,enabled=false;
    const held=new Map();
    function playable(){return media.matches && !(Game.menu&&Game.menu.active) && !Game.stageIntro && !Game.clearSequence && !Game.deathState && !(Game.shop&&Game.shop.active);}
    function direction(x,y){
      const old=input.axisX();
      input.left=x < -0.25;input.right=x > 0.25;input.up=y < -0.25;input.down=y > 0.25;
      const next=input.axisX();
      if(next!==old){input.tap.released=true;if(next)input.tryRunTap(next,fighter);}
    }
    function moveStick(event){
      const box=stick.getBoundingClientRect(),radius=box.width*0.35;
      let x=(event.clientX-box.left-box.width/2)/radius,y=(event.clientY-box.top-box.height/2)/radius;
      const length=Math.hypot(x,y);if(length>1){x/=length;y/=length;}
      direction(x,y);knob.style.transform='translate('+x*radius+'px,'+y*radius+'px)';
    }
    stick.addEventListener('pointerdown',function(e){if(!playable()||stickPointer!==null)return;e.preventDefault();stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e);});
    stick.addEventListener('pointermove',function(e){if(e.pointerId===stickPointer){e.preventDefault();moveStick(e);}});
    function releaseStick(e){if(e&&e.pointerId!==stickPointer)return;stickPointer=null;direction(0,0);knob.style.transform='';}
    ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stick.addEventListener(type,releaseStick));
    function action(id,key,edge){
      const button=document.getElementById(id);
      button.addEventListener('pointerdown',function(e){if(!playable())return;e.preventDefault();button.setPointerCapture(e.pointerId);held.set(e.pointerId,{button,key});if(key)input[key]=true;input[edge]=true;button.classList.add('pressed');});
      function release(e){const item=held.get(e.pointerId);if(!item||item.button!==button)return;held.delete(e.pointerId);if(key)input[key]=Array.from(held.values()).some(h=>h.key===key);if(!Array.from(held.values()).some(h=>h.button===button))button.classList.remove('pressed');}
      ['pointerup','pointercancel','lostpointercapture'].forEach(type=>button.addEventListener(type,release));
      button.addEventListener('contextmenu',e=>e.preventDefault());
    }
    action('mobile-attack','attack','attackPressed');
    action('mobile-jump','jump','jumpPressed');
    action('mobile-subweapon',null,'subweaponPressed');
    document.getElementById('mobile-dodge').addEventListener('pointerdown',function(e){if(!playable())return;e.preventDefault();input.backstepPressed=true;});
    function reset(){releaseStick();held.forEach(h=>h.button.classList.remove('pressed'));held.clear();input.jump=false;input.attack=false;input.clearEdges();}
    window.addEventListener('blur',reset);
    document.addEventListener('visibilitychange',function(){if(document.hidden)reset();});
    setting.addEventListener('change',reset);
    function refresh(){const active=playable();root.hidden=!active;if(enabled&&!active)reset();enabled=active;requestAnimationFrame(refresh);}
    refresh();
  };
})();
