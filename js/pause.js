(function(){
  const panel=document.getElementById('pause-screen'),resume=document.getElementById('resume-game');
  Game.paused=false;
  Game.bindPause=function(isPlaying,clearInput){
    function pause(){
      if(Game.paused || !isPlaying())return;
      Game.paused=true;clearInput();panel.hidden=false;
      if(!document.hidden)resume.focus();
    }
    Game.pause=pause;
    window.addEventListener('blur',pause);
    window.addEventListener('pagehide',pause);
    document.addEventListener('visibilitychange',function(){
      if(document.hidden)pause();else if(Game.paused)resume.focus();
    });
    resume.addEventListener('click',function(){
      if(document.hidden || !Game.paused)return;
      clearInput();Game.paused=false;panel.hidden=true;document.getElementById('game').focus();
    });
  };
})();
