Game.captureShopCheckpoint=function(actor,points,learned){
  return {points,deaths:0,def:JSON.parse(JSON.stringify(actor.def)),hp:actor.hp,mp:actor.mp,maxHp:actor.maxHp,maxMp:actor.maxMp,
    lives:actor.lives,ownedSubweapons:[...actor.ownedSubweapons],subweapon:actor.subweapon,
    healPurchases:actor.healPurchases||0,weaponPurchases:actor.weaponPurchases||0,knowsCellarBoss:actor.knowsCellarBoss,
    learned:[...(learned||[])]};
};
Game.restoreShopCheckpoint=function(actor,checkpoint){
  const sheets=actor.sheets,def=JSON.parse(JSON.stringify(checkpoint.def));
  Object.assign(actor,new Game.Fighter(def,{x:80,y:660-def.stats.standH}),{
    sheets,hp:checkpoint.hp,mp:checkpoint.mp,maxHp:checkpoint.maxHp,maxMp:checkpoint.maxMp,
    lives:Math.max(0,checkpoint.lives-checkpoint.deaths),ownedSubweapons:new Set(checkpoint.ownedSubweapons),
    subweapon:checkpoint.subweapon,healPurchases:checkpoint.healPurchases,weaponPurchases:checkpoint.weaponPurchases,knowsCellarBoss:checkpoint.knowsCellarBoss
  });
};
Game.ShopSession = function (actor, points, clearedStage='outerWall') {
  this.actor = actor; this.points = points; this.learned = new Set();
  this.clearedStage=clearedStage;
  if (!actor.ownedSubweapons) actor.ownedSubweapons = new Set(['knife']);
  actor.healPurchases = actor.healPurchases || 0;
  actor.weaponPurchases = actor.weaponPurchases || 0;
};
Game.ShopSession.prototype.price = function (id) {
  if (id === 'heal') return Math.round(50 * Math.pow(1.45, this.actor.healPurchases));
  if (['knife','cross','axe','holy','clock'].includes(id)) return 300 + 100 * this.actor.weaponPurchases;
  return { whipPower:500, whipSpeed:500, maxHp:500, maxMp:500, subPower:500, info:150, life:1000 }[id];
};
Game.ShopSession.prototype.buy = function (id) {
  const price = this.price(id);
  const hints = [
    '회중시계가 멈추는 것은 적뿐이 아니야. 제한 시간도 함께 멈춘단다.',
    '체력이 가득한 채로 클리어하면 퍼펙트 보너스를 받을 수 있어.',
    '시간이 다 되어도 끝은 아니야. 대신 적의 공격이 두 배로 위험해져.',
    '발차기를 맞히면 잠깐 보호받으며 다시 뛰어오를 수 있어. 빗나갈 때는 조심해.',
    '십자가는 돌아오는 길에도 적을 맞혀. 움직임이 적은 적을 노려 봐.',
    '와인 저장고에서 기다리는 그녀의 이름은 미츄헨 데슈타프. 성주의 재물로 움직이는 자라고 불리지.',
    '이 성의 주인은 루델리안 블러드 체펴슈. 뱀파이어야. 만나면 이름 정도는 기억해 둬.',
    '성주는 달콤한 걸 좋아해. 무서운 얼굴만 상상했다면, 잼을 바른 빵을 먹는 모습은 좀 뜻밖이겠네.',
    '여기에 사는 사람들은 갈 곳이 없어서 모였어. 성주는 그런 사람들을 받아들였지. 나머지는 직접 만나 보고 판단해.',
    '성에 있는 책 중에는 내가 쓴 것도 있어. 오래 살면서 보고 겪은 일들을 적어 뒀지. 읽게 되면 책장은 조심해서 넘겨.',
    '나는 피를 마신 생명체의 모습으로 변할 수 있어. 오래 살았으니 기억해 둔 모습도 많지. 넓은 성을 관리할 때 꽤 도움이 돼.',
    '라미아는 인간 마법사야. 마법서를 읽고 나면 다른 사람이 못 읽게 망가뜨려. 덕분에 책을 돌보는 일이 늘었지.',
    '깃발을 든 아이는 베르제브트야. 이 성의 경비지. 마력을 넣으면 그 깃발을 낫처럼 쓰니까, 평범한 깃발로 생각하지 마.',
    '이 성에는 인간도 살아. 와인 저장고의 총잡이도 인간이지. 밖에서 우리에게 필요한 물자를 구해 오는 일을 맡고 있어.',
    '그 총잡이에게 가까이 붙는다고 안전하진 않아. 코앞에서도 속사를 해. 느낌표가 뜨면 조준된 자리에서 빠르게 벗어나렴.',
    '그녀의 리볼버에는 여섯 발만 들어가. 장전할 때 맞으면 움찔한 뒤 장전을 그만두지. 그 틈을 노려 봐.',
    '반격 자세를 잡으면 공격을 서두르지 마. 그때는 피해도 절반만 받고, 맞는 순간 발차기로 응수해. 몸 뒤에 붙어도 안전하지 않아.',
    '서서 채찍을 휘두르면 그녀가 숙이거나 뒤로 뛸 수 있어. 같은 공격만 반복하지 말고 높이와 거리를 바꿔 보렴.',
    '체력이 줄면 그녀도 다급해져. 공격 간격이 짧아지고 회피도 빨라지지. 거의 쓰러졌다고 방심하지 마.',
    '그녀는 일정한 거리로 크게 도약해. 점프 사격은 도약할 때 네가 있던 자리를 기억하고 최고점에서 쏘니, 그 자리에서 움직여.',
    '속사가 오크통 근처에 맞으면 와인이 흘러나와 발을 붙잡아. 점프 사격이 그 와인에 닿으면 곧바로 불이 붙으니, 바닥을 잘 보고 뛰어넘으렴.'
  ];
  const actor=this.actor, s=actor.def.stats;
  if (!price) return '이 품목은 아직 판매 준비 중이야.';
  const weapon = ['knife','cross','axe','holy','clock'].includes(id);
  if (weapon && actor.ownedSubweapons.has(id)) return '그 무기는 이미 가지고 있잖니. 다시 살 필요는 없어.';
  if (id==='heal' && actor.hp>=actor.maxHp) return '이미 건강한걸. 지금은 필요 없겠네.';
  const nextBoss=this.clearedStage==='outerWall'?'wineCellar':null;
  const bossHints={5:'wineCellar',6:'castleLord',7:'castleLord',11:'lamia',12:'berzebt',13:'wineCellar'};
  const available=hints.map((text,i)=>({text,i,boss:i>=14?'wineCellar':bossHints[i],pattern:i>=14}))
    .filter(h=>!this.learned.has(h.i)&&(!h.boss||h.boss===nextBoss));
  if (id==='info' && !available.length) return '지금 알려줄 새로운 정보는 모두 전해 줬어.';
  if (this.points<price) return '점수가 조금 부족하네.';
  this.points-=price;
  if(id==='heal') {actor.hp=Math.min(actor.maxHp,actor.hp+actor.maxHp*.3);actor.healPurchases++;}
  if(weapon) {actor.ownedSubweapons.add(id);actor.weaponPurchases++;actor.subweapon=id;}
  if(id==='life') actor.lives=(actor.lives == null ? 3 : actor.lives)+1;
  if(id==='whipPower') s.whipDamage+=5;
  if(id==='whipSpeed') {s.attackTime=Math.max(6,s.attackTime-2);s.attackRecoverTime=Math.max(6,s.attackRecoverTime-2);}
  if(id==='maxHp') {actor.maxHp+=20;s.maxHp=actor.maxHp;}
  if(id==='maxMp') {actor.maxMp+=20;s.maxMp=actor.maxMp;}
  if(id==='subPower') ['knifeDamage','crossDamage','axeDamage','holyDamage'].forEach(key=>{s[key]=Math.round(s[key]*1.2*10)/10;});
  if(id==='info') {
    const patterns=available.filter(h=>h.pattern),pool=patterns.length?patterns:available;
    const hint=pool[Math.floor(Math.random()*pool.length)];this.learned.add(hint.i);if(hint.i===5)actor.knowsCellarBoss=true;return hint.text;
  }
  return id==='heal'?'체력을 조금 회복했어. 무리하지 마렴.':'좋아. 준비가 한층 든든해졌네.';
};
