// Fixed Figma artwork: one PNG per stage. Animated artwork: separate transparent PNGs.
const stageBackgroundCanvas = document.createElement('canvas');
stageBackgroundCanvas.width = 180;
stageBackgroundCanvas.height = 390;
const stageBackgroundContext = stageBackgroundCanvas.getContext('2d', {alpha:false});
stageBackgroundContext.imageSmoothingEnabled = false;
// Legacy renderer uses dt=1 at 60 FPS and a 360px-wide canvas.
// Positions here are on the 180px native grid: divide movement by two.
const BACKGROUND_TIMING = Object.freeze({
  starBlink: 45, // mean of (0.02..0.07) radians/ms, converted to seconds
  fireworkRate: 0.12*60,
  fireworkLifetime: 1/(0.025*60),
  planetFallDuration: 2.6,
  planetCycle: 3.3,
  moonRiseDuration: 3,
  moonSetDuration: 4,
  emberRise: (8-0.22/(2*0.03))*60/2,
  streakFall: (12+10/2)*1.4*60/2,
  blackholeInfall: (0.8+1.6/2)*1.5*60/2,
  blackholeOrbit: 0.2
});
let backgroundMotionTime = 0;
let backgroundMotionStage = 0;
let backgroundStageTime = 0;
let moonSetStart = 34;
function moonEaseInOut(progress) {
  const p=Math.max(0,Math.min(1,progress));
  return (1-Math.cos(Math.PI*p))/2;
}
function moonRiseY(age) {
  return Math.round(246-212*moonEaseInOut(age/BACKGROUND_TIMING.moonRiseDuration));
}
let fireworkBursts = [];
let nextFireworkIn = 0.08;
let backgroundMeteors = [];
let nextMeteorIn = 0;
let meteorShowerStarted = false;
let stageBackgroundAssets = [];
function spawnBackgroundMeteor(age=0) {
  const size=18+Math.floor(Math.random()*35);
  const fromLeft=Math.random()<.45;
  backgroundMeteors.push({
    born:backgroundMotionTime-age,size,
    x:fromLeft?-size-8:-35+Math.random()*115,
    y:fromLeft?15+Math.random()*140:-size-12,
    speed:70+Math.random()*35,
    lifetime:4
  });
}
function loadBackgroundImage(file) {
  return new Promise((resolve,reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Cannot load background: '+file));
    image.src = 'assets/backgrounds/'+file+'?v=effects8';
  });
}
const stageBackgroundsReady = fetch('assets/backgrounds/manifest.json?v=effects8')
  .then(response => { if(!response.ok) throw new Error('Background manifest unavailable'); return response.json(); })
  .then(async manifest => {
    stageBackgroundAssets = await Promise.all(manifest.map(async config => {
      if(!config) return null;
      return {
        background: await loadBackgroundImage(config.background),
        effects: await Promise.all(config.effects.map(async effect => ({...effect,image:await loadBackgroundImage(effect.file)})))
      };
    }));
    return stageBackgroundAssets;
  }).catch(error => { console.error(error); throw error; });
function updateBackgroundMotion(dt) {
  const seconds=dt/60;
  if(typeof stageLevel==='number') {
    if(stageLevel!==backgroundMotionStage) {
      moonSetStart=stageLevel===4&&backgroundMotionStage===3?moonRiseY(backgroundStageTime):34;
      backgroundMotionStage=stageLevel;backgroundStageTime=0;
    }
    backgroundStageTime+=seconds;
  }
  backgroundMotionTime+=seconds;
  if(stageBackgroundAssets[6]?.effects.some(e=>e.kind==='meteor') &&
     (typeof stageLevel==='undefined'||stageLevel===6)) {
    if(!meteorShowerStarted) {
      meteorShowerStarted=true;
      [0.5,1.1,1.6].forEach(age=>spawnBackgroundMeteor(age));
    }
    backgroundMeteors=backgroundMeteors.filter(m=>backgroundMotionTime-m.born<m.lifetime);
    nextMeteorIn-=seconds;
    while(nextMeteorIn<=0) {
      spawnBackgroundMeteor();nextMeteorIn+=.4+Math.random()*.5;
    }
  } else if(meteorShowerStarted) {
    backgroundMeteors=[];nextMeteorIn=0;meteorShowerStarted=false;
  }
  fireworkBursts=fireworkBursts.filter(b=>backgroundMotionTime-b.born<b.lifetime);
  nextFireworkIn-=seconds;
  while(nextFireworkIn<=0) {
    fireworkBursts.push({born:backgroundMotionTime,x:25+Math.random()*130,y:40+Math.random()*150,design:Math.floor(Math.random()*3),lifetime:BACKGROUND_TIMING.fireworkLifetime});
    nextFireworkIn+=-Math.log(Math.max(0.001,1-Math.random()))/BACKGROUND_TIMING.fireworkRate;
  }
}
function getStageQuake(time) {
  return {x:Math.round(Math.sin(time*71)*2),y:Math.round(Math.sin(time*97+0.6)*1.5)};
}
function drawRandomFireworks(g,assets,time) {
  const sprites=assets.effects.filter(e=>e.kind.startsWith('firework'));
  if(sprites.length!==3)return;
  for(const burst of fireworkBursts) {
    const phase=(time-burst.born)/burst.lifetime;
    if(phase<0||phase>=1)continue;
    const e=sprites[burst.design],size=0.08+1.12*Math.min(1,phase*1.6);
    const w=Math.max(1,Math.round(e.w*size)),h=Math.max(1,Math.round(e.h*size));
    g.save();g.globalAlpha=phase<0.12?phase/0.12:(1-phase)/0.88;
    g.drawImage(e.image,Math.round(burst.x-w/2),Math.round(burst.y-h/2),w,h);g.restore();
  }
}
function drawBackgroundEffect(g,effect,time,index,stageTime=time,moonStart=34) {
  let x=effect.x,y=effect.y,w=effect.w,h=effect.h,alpha=1;
  if(effect.kind==='moon-rise') {
    y=moonRiseY(stageTime);
    alpha=moonEaseInOut(stageTime/(BACKGROUND_TIMING.moonRiseDuration*.7));
  }
  if(effect.kind==='moon-set') {
    const p=stageTime/BACKGROUND_TIMING.moonSetDuration;
    y=Math.round(moonStart+(246-moonStart)*moonEaseInOut(p));
    alpha=1-moonEaseInOut((p-.3)/.7);
  }
  if(effect.kind==='stars') alpha=0.3+0.7*Math.abs(Math.sin(time*BACKGROUND_TIMING.starBlink+index));
  if(effect.kind.startsWith('firework')) return;
  if(effect.kind==='planet') {
    const cycle=Math.floor(time/BACKGROUND_TIMING.planetCycle);
    const elapsed=time%BACKGROUND_TIMING.planetCycle;
    if(elapsed>BACKGROUND_TIMING.planetFallDuration)return;
    const progress=elapsed/BACKGROUND_TIMING.planetFallDuration;
    const lane=42+((cycle*47+39)%85);
    x=lane-w/2+Math.round(progress*12);
    y=-h+Math.round(progress*progress*345);
  }
  if(effect.kind==='meteor') {
    for(const meteor of backgroundMeteors) {
      const age=time-meteor.born;
      if(age<0||age>=meteor.lifetime)continue;
      const travel=meteor.speed*age+8*age*age;
      const mx=Math.round(meteor.x+travel),my=Math.round(meteor.y+travel*1.35);
      if(mx>180||my>390)continue;
      g.drawImage(effect.image,mx,my,meteor.size,meteor.size);
    }
    return;
  }
  g.save();g.globalAlpha=alpha;
  if(effect.kind==='streaks') {
    const offset=Math.floor(time*BACKGROUND_TIMING.streakFall)%390;
    g.drawImage(effect.image,x,y+offset,w,h);
    g.drawImage(effect.image,x,y+offset-390,w,h);
  } else if(effect.kind==='embers') {
    const offset=Math.floor(time*BACKGROUND_TIMING.emberRise)%h;
    g.beginPath();g.rect(0,effect.y,180,390-effect.y);g.clip();
    g.drawImage(effect.image,x,y-offset,w,h);
    g.drawImage(effect.image,x,y-offset+h,w,h);
  } else g.drawImage(effect.image,Math.round(x),Math.round(y),w,h);
  g.restore();
  if(effect.kind==='blackhole') {
    // The artwork stays fixed. Each dot spirals inward, enters the dark core, then disappears.
    for(let i=0;i<48;i++) {
      const speed=BACKGROUND_TIMING.blackholeInfall*(0.7+(i%7)/10);
      const radius=((i*23-time*speed)%122+122)%122;
      const angle=i*2.399963+time*BACKGROUND_TIMING.blackholeOrbit;
      const px=Math.round(90+Math.cos(angle)*radius),py=Math.round(102+Math.sin(angle)*radius*.65);
      g.save();g.globalAlpha=Math.min(1,radius/12);
      g.fillStyle=i%3===0?'#ddbec4':'#a87998';g.fillRect(px,py,i%5===0?2:1,1);g.restore();
    }
  }
}
function drawVolcanoEruptions(g,time) {
  // Two vents sit on the distant ridge. All smoke and lava use whole native pixels.
  const vents=[{x:45,y:217,offset:0},{x:139,y:219,offset:1.1}];
  vents.forEach((vent,index)=>{
    const elapsed=(time+vent.offset)%2.3;
    const cycle=Math.floor((time+vent.offset)/2.3);
    g.save();
    g.fillStyle='#b95035';g.fillRect(vent.x-2,vent.y,5,2);
    g.fillStyle='#f3aa5b';g.fillRect(vent.x-1,vent.y,3,1);
    // A plume expands above the summit, then disperses before the next burst.
    for(let i=0;i<7;i++) {
      const age=elapsed-i*.06;
      if(age<0||age>1.65)continue;
      const size=Math.round(3+age*5);
      const x=Math.round(vent.x+Math.sin(i*2.4+index)*age*7-size/2);
      const y=Math.round(vent.y-5-age*24-i*2);
      g.globalAlpha=(1-age/1.65)*.55;
      g.fillStyle=i%2?'#70575c':'#96746a';
      g.fillRect(x+1,y,size-2,size);g.fillRect(x,y+1,size,size-2);
    }
    // Ejected lava follows short arcs back towards the mountain.
    for(let i=0;i<22;i++) {
      const age=elapsed-(i%4)*.045;
      if(age<0||age>1.2)continue;
      const spread=Math.sin(i*2.399963+cycle*.8+index)*20;
      const rise=48+(i%5)*7;
      const x=Math.round(vent.x+spread*age);
      const y=Math.round(vent.y-rise*age+62*age*age);
      if(y>vent.y+13)continue;
      g.globalAlpha=Math.min(1,(1.2-age)*3);
      g.fillStyle=i%3?'#ed8150':'#ffd083';
      g.fillRect(x,y,i%5===0?2:1,2);
    }
    // Small moving highlights run down the lit slope without reaching the foreground.
    g.globalAlpha=.75;
    for(let i=0;i<5;i++) {
      const step=(time*13+i*3)%14;
      g.fillStyle=i%2?'#d96e43':'#efa064';
      g.fillRect(Math.round(vent.x+step),Math.round(vent.y+2+step*.7),2,1);
    }
    g.restore();
  });
}
function drawStageBackground(stage, targetContext=ctx, targetCanvas=canvas, time=backgroundMotionTime) {
  const assets=stageBackgroundAssets[stage],g=stageBackgroundContext;
  const inGame=typeof ctx!=='undefined'&&targetContext===ctx;
  const stageTime=inGame?backgroundStageTime:time%14;
  if(assets) {
    g.drawImage(assets.background,0,0,180,390);
    if(stage===6)drawVolcanoEruptions(g,time);
    assets.effects.forEach((effect,index)=>drawBackgroundEffect(g,effect,time,index,stageTime,inGame?moonSetStart:34));
    if(stage===5)drawRandomFireworks(g,assets,time);
  } else {
    g.fillStyle=stage<=2?'#90c9dd':'#142038';g.fillRect(0,0,180,390);
  }
  targetContext.save();targetContext.imageSmoothingEnabled=false;
  const quakeActive=stage===6&&(!inGame||(isGameStarted&&!isGameOver&&!isPaused&&!isCountingDown));
  if(quakeActive&&inGame) {
    // Fill the thin exposed edge before drawing through the shared game earthquake transform.
    const q=getStageQuake(time);targetContext.save();targetContext.translate(-q.x*2,-q.y*2);
    targetContext.drawImage(stageBackgroundCanvas,0,0,targetCanvas.width,targetCanvas.height);targetContext.restore();
  }
  targetContext.drawImage(stageBackgroundCanvas,0,0,targetCanvas.width,targetCanvas.height);
  if(quakeActive&&!inGame) {
    const q=getStageQuake(time);targetContext.drawImage(stageBackgroundCanvas,q.x,q.y,targetCanvas.width,targetCanvas.height);
  }
  targetContext.restore();
}
