const fs=require('fs'),vm=require('vm'),assert=require('assert');global.window=global;vm.runInThisContext(fs.readFileSync('js/core.js','utf8'));
const camera=Game.createCamera(1280),actor={x:80,w:74};Game.updateCamera(camera,actor,2560);assert.equal(camera.x,0);
actor.x=650;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,0);actor.x=950;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,155);
actor.x=1650;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,855);assert.equal(actor.x+actor.w/2-camera.x,832);
actor.x=2486;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,1280);actor.x=1500;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,1089);actor.x=0;Game.updateCamera(camera,actor,2560);assert.equal(camera.x,0);
Game.updateCamera(camera,actor,900);assert.equal(camera.x,0);
console.log('PASS: fixed viewport, left/right dead zone tracking and both map-end clamps.');
