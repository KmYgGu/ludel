(function(){
  const panel=document.getElementById('pause-screen'),resume=document.getElementById('resume-game');
  Game.paused=false;
  Game.bindPause=function(isPlaying,clearInput){
    let lastFrame=null,edgeTouch=null;
    const mobile=window.matchMedia?window.matchMedia('(pointer:coarse)'):null;
    function pause(){
      if(Game.paused || !isPlaying())return;
      Game.paused=true;clearInput();panel.hidden=false;
      if(!document.hidden)resume.focus();
    }
    Game.pause=pause;
    window.addEventListener('blur',pause);
    window.addEventListener('pagehide',pause);
    window.addEventListener('pageshow',function(event){if(event.persisted)pause();});
    document.addEventListener('freeze',pause);
    document.addEventListener('resume',pause);
    // OS gestures and phone interruptions can cancel a touch without hiding the page.
    document.addEventListener('pointercancel',function(){if(mobile&&mobile.matches)pause();});
    document.addEventListener('touchcancel',function(){if(mobile&&mobile.matches)pause();},{passive:true});
    document.addEventListener('pointerdown',function(event){
      if(mobile&&mobile.matches&&event.clientY<=28)edgeTouch={id:event.pointerId,y:event.clientY};
    },true);
    document.addEventListener('pointermove',function(event){
      if(edgeTouch&&event.pointerId===edgeTouch.id&&event.clientY-edgeTouch.y>45){edgeTouch=null;pause();}
    },true);
    function clearEdge(){edgeTouch=null;}
    document.addEventListener('pointerup',clearEdge,true);
    document.addEventListener('pointercancel',clearEdge,true);
    Game.checkPause=function(time){
      const interrupted=lastFrame!=null&&time-lastFrame>1000;
      lastFrame=time;
      if(Game.paused||!isPlaying())return;
      if(document.hidden || (document.hasFocus&&!document.hasFocus()) || interrupted)pause();
    };
    document.addEventListener('visibilitychange',function(){
      if(document.hidden)pause();else if(Game.paused)resume.focus();
    });
    resume.addEventListener('click',function(){
      if(document.hidden || !Game.paused)return;
      clearInput();lastFrame=null;edgeTouch=null;Game.paused=false;panel.hidden=true;document.getElementById('game').focus();
    });
  };
})();
