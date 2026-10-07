(function () {
  const screen = document.getElementById('shop-screen');
  const items = document.getElementById('shop-items');
  const speech = document.getElementById('shop-speech');
  const categories = document.querySelectorAll('[data-category]');
  let selected = null;
  let session = null;
  const buyButton = document.getElementById('shop-buy');
  function refresh() {
    if (!session) return;
    document.getElementById('shop-score').textContent = '보유 점수 ' + session.points.toLocaleString();
    const canvas = document.getElementById('shop-player-hud');
    const context = canvas.getContext('2d');
    context.clearRect(0,0,300,125);
    Game.Hud.player(context, session.actor);
    if (selected && selected.id) buyButton.textContent = '구매 · ' + session.price(selected.id) + '점';
    items.querySelectorAll('button').forEach(function (button) {
      if (button.priceLabel) button.priceLabel.textContent = session.price(button.purchaseId) + '점';
    });
  }
  const portrait = document.getElementById('shop-portrait');
  const portraitContext = portrait.getContext('2d');
  const idle = new Image();
  const eyes = new Image();
  const closedEyes = new Image();
  const farewell = new Image();
  const fade = document.getElementById('shop-fade');
  let departure = null;
  let nextBlink = null;
  let blinkUntil = 0;
  const eyeOffsets = [0, 5, 8, 10, 10, 10, 9, 6];
  idle.src = 'sprites/shop/Schurpf/idle-transparent.png';
  eyes.src = 'sprites/shop/Schurpf/eyes%20only.png';
  closedEyes.src = 'sprites/shop/Schurpf/eyes%20close.png';
  farewell.src = 'sprites/shop/Schurpf/Farewell.png';
  function drawPortrait(time) {
    if (departure) {
      if (departure.start === null) departure.start = time;
      const elapsed = time - departure.start;
      const index = Game.shop.farewellFrame(elapsed);
      if (farewell.complete && farewell.naturalWidth) {
        portraitContext.clearRect(0,0,263,248);
        portraitContext.imageSmoothingEnabled=false;
        portraitContext.drawImage(farewell,index*263,0,263,248,0,0,263,248);
      }
      const darkness=Math.min(1,Math.max(0,(elapsed-1125)/1500));
      fade.style.opacity=String(darkness);
      if(darkness>=1){
        departure=null;Game.shop.active=false;screen.hidden=true;
        if(Game.shop.onNext)Game.shop.onNext();
      }
      return;
    }
    if (!idle.complete || !idle.naturalWidth || !eyes.complete || !eyes.naturalWidth) return;
    const frame = Math.floor(time / 125) % 8;
    if (nextBlink === null) nextBlink = time + 3000 + Math.random() * 3000;
    if (time >= nextBlink) {
      blinkUntil = time + 160;
      nextBlink = blinkUntil + 3000 + Math.random() * 3000;
    }
    const eyeSprite = time < blinkUntil && closedEyes.complete && closedEyes.naturalWidth ? closedEyes : eyes;
    portraitContext.clearRect(0, 0, 263, 248);
    portraitContext.imageSmoothingEnabled = false;
    portraitContext.drawImage(idle, frame * 247, 0, 247, 247, 16, 1, 247, 247);
    portraitContext.drawImage(eyeSprite, 18, 1 + eyeOffsets[frame]);
  }
  const stock = {
    support: [
      { id:'heal', price:200, name: '체력 회복', kind: '조금 회복', icon: '♥', speech: '체력을 조금 회복해 줄게. 다음 문을 열기 전에 몸부터 돌보는 게 어때?' },
      { id:'whipPower', price:500, name: '채찍 공격력 증가', kind: '공격력 강화', icon: '〰', speech: '채찍의 한 타를 더 묵직하게 만드는 강화야.' },
      { id:'whipSpeed', price:500, name: '채찍 공격속도 증가', kind: '공격속도 강화', icon: '»', speech: '채찍을 더 빠르게 휘두르고 공격 사이의 빈틈을 줄이는 강화야.' },
      { id:'maxHp', price:500, name: '최대 체력 강화', kind: '강화', icon: '✚', speech: '조금 더 버틸 힘이 필요하지 않겠니?' },
      { id:'maxMp', price:500, name: '최대 마력 강화', kind: '강화', icon: '◆', speech: '더 많은 마력을 담을 수 있게 해 줄게. 소진된 마력은 스테이지를 마치면 돌아온단다.' },
      { id:'subPower', price:500, name: '서브 웨폰 데미지 증가', kind: '강화', icon: '✦', speech: '나이프, 십자가, 도끼와 성수가 주는 피해를 높여 줄게.' },
      { id:'life', name:'잔기 구매', kind:'재도전 기회', icon:'✧', speech:'다시 일어설 기회를 하나 더 준비해 줄게.' },
      { id:'info', price:150, name: '정보 구매', kind: '새로운 정보', icon: '?', speech: '이 성에 관한 이야기를 하나 들려줄게. 이미 들은 이야기는 다시 팔지 않아.' }
    ],
    weapons: [
      { id:'knife', name: '나이프', kind: '빠른 단발 공격', icon: '↗', speech: '가볍고 빠르지. 한 발은 약해도, 빈틈을 놓치지 않는 손에는 잘 어울려.' },
      { id:'cross', name: '십자가', kind: '다단 히트', icon: '✝', speech: '돌아오는 길까지 잘 봐. 움직임이 적은 적에게는 여러 번 닿을 수 있어.' },
      { id:'axe', name: '도끼', kind: '묵직한 투척', icon: '⚒', speech: '높이 던져서 내리찍는 거야. 키가 큰 적이라면 올라갈 때도, 내려올 때도 맞겠지.' },
      { id:'holy', name: '성수', kind: '지속 피해', icon: '♨', speech: '바닥에 남은 불꽃도 무기란다. 그 자리에 머무는 적을 노려 봐.' },
      { id:'clock', name: '회중시계', kind: '시간 정지', icon: '◷', speech: '마력이 스무 칸은 있어야 해. 한번 멈춘 시간은 마력이 다할 때까지 네가 되돌릴 수 없어.' }
    ],
    skills: [
      { name: '백스텝', kind: '회피', icon: '«', speech: '빠르게 물러나고 부드럽게 멈추는 거지. 적의 빈틈을 볼 거리는 남겨 둬.' },
      { name: '슬라이딩', kind: '낮은 돌진', icon: '➜', speech: '몸을 낮춰 지나가 봐. 큰 피해보다는 자리를 바꾸는 데 어울리는 움직임이야.' },
      { name: '하강 발차기', kind: '공중 기술', icon: '↘', speech: '맞히면 다시 튀어 오르지만, 빗나가면 위험해. 발끝이 닿을 때를 잘 골라.' }
    ]
  };
  function select(button, item) {
    items.querySelectorAll('button').forEach(function (entry) { entry.setAttribute('aria-pressed', String(entry === button)); });
    speech.textContent = item.speech;
    selected = item;
    buyButton.disabled = !item.id;
    buyButton.textContent = item.id && session ? '구매 · ' + session.price(item.id) + '점' : '구매';
  }
  function showCategory(category) {
    items.replaceChildren();
    selected = null;
    buyButton.disabled = true;
    categories.forEach(function (button) { button.setAttribute('aria-pressed', String(button.dataset.category === category)); });
    stock[category].forEach(function (item) {
      const button = document.createElement('button');
      button.className = 'shop-item'; button.setAttribute('aria-pressed', 'false');
      const icon = document.createElement('span'); icon.className = 'shop-item-icon'; icon.textContent = item.icon; icon.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span'); name.className = 'shop-item-name'; name.textContent = item.name;
      const kind = document.createElement('span'); kind.className = 'shop-item-kind'; kind.textContent = item.kind;
      name.appendChild(kind); button.appendChild(icon); button.appendChild(name);
      if (item.id && session) {
        const price = document.createElement('span');price.className='shop-item-kind';price.textContent=session.price(item.id)+'점';name.appendChild(price);
        button.priceLabel=price;button.purchaseId=item.id;
      }
      button.addEventListener('click', function () { select(button, item); });
      items.appendChild(button);
    });
    speech.textContent = '마음에 드는 물건이 있니? 골라 주면 설명해 줄게.';
  }
  categories.forEach(function (button) { button.addEventListener('click', function () { showCategory(button.dataset.category); }); });
  buyButton.addEventListener('click', function () {
    if (!selected || !session) return;
    speech.textContent = session.buy(selected.id);
    refresh();
  });
  document.getElementById('shop-next').addEventListener('click', function () {
    if (departure) return;
    if (Game.shop.onNext) {
      departure={start:null};fade.hidden=false;fade.style.opacity='0';
      speech.textContent='조심해서 가렴. 또 만날 수 있기를.';
    }
    else speech.textContent = '다음 스테이지는 아직 준비 중이야. 조금만 기다려 주렴.';
  });
  Game.shop = {
    active: false,
    learned: new Set(),
    farewellFrame: function (elapsed) {
      const step=Math.floor(elapsed/125);
      return step<9?step:3+(step-9)%6;
    },
    drawPortrait: drawPortrait,
    open: function (score, actor, restoring) {
      if(actor&&!restoring){this.checkpoint=Game.captureShopCheckpoint(actor,score,this.learned);this.checkpoint.clearedStage=this.clearedStage;}
      if(restoring&&this.checkpoint)this.clearedStage=this.checkpoint.clearedStage;
      this.active = true; screen.hidden = false;
      nextBlink = null; blinkUntil = 0;
      departure=null;fade.hidden=true;
      if (actor) { session = new Game.ShopSession(actor, score,this.clearedStage); session.learned = this.learned; }
      document.getElementById('shop-score').textContent = '클리어 점수 ' + score.toLocaleString();
      showCategory('support');
      speech.textContent = restoring?'어머, 다시 왔네. 많이 놀랐지? 잠깐 숨을 고르렴. 이번엔 준비를 조금 바꿔 보는 건 어때?':'어서 와. 무사히 여기까지 왔구나. 다음 문을 열기 전에 천천히 둘러보렴.';
      document.querySelector('body > p').hidden = true;
      categories[0].focus();
      refresh();
    }
  };
})();
