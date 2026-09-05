'use strict';

// A finite entrance, then a direct-manipulation bow. The static composition
// stays available when scripts cannot run; idle and hidden scenes do no work.
(() => {
  const section = document.querySelector('#essencia');
  const P = globalThis.EssencePhysics;
  const F = globalThis.EssenceFlight;
  if (!section || !P || !F) return;
  const $ = selector => section.querySelector(selector);
  const surface = $('.essence-inner');
  const svg = $('.essence-motion');
  const emblem = $('.essence-emblem');
  const atmosphere = $('.essence-atmosphere');
  const optics = $('.essence-optics');
  const morph = $('.essence-morph');
  const limb = $('.essence-limb');
  const material = $('.essence-limb-material');
  const shadow = $('.essence-limb-shadow');
  const detail = $('.essence-limb-detail');
  const string = $('.essence-string');
  const iris = $('.essence-iris');
  const grip = $('.essence-grip');
  const arrow = $('.essence-flying-arrow');
  const indicator = $('.essence-nock-indicator');
  const arrival = $('.essence-arrival-arrow');
  const flightScene = $('.essence-flight-scene');
  const flightWorld = $('.essence-flight-world');
  const flightFar = $('.essence-flight-far');
  const flightNear = $('.essence-flight-near');
  const target = $('.essence-flight-target');
  const wound = $('.essence-target-wound');
  const fragments = $('.essence-impact-fragments');
  const dust = $('.essence-dust');
  const launchAt = 1.6;
  const flightDuration = .82;
  const impactAt = launchAt + flightDuration;
  const revealAt = impactAt + .22;
  const revealDuration = .85;
  const revealStagger = .085;
  const projectileLayer = $('.essence-projectiles');
  const rippleLayer = $('.essence-ripples');
  const control = $('.essence-bow-control');
  const status = $('.essence-shot-status');
  const pieces = [...section.querySelectorAll('.essence-line, .essence-body, .essence-copy>.text-link')];
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const NS = 'http://www.w3.org/2000/svg';
  const eyeTop = [-168,0,-118,-18,-112,-65,-65,-72,-38,-83,-20,-84,0,-84,20,-84,38,-83,65,-72,112,-65,118,-18,168,0];
  const eyeBottom = eyeTop.map((n,i) => i % 2 ? -n : n);
  const tension = P.createSpring();
  const flex = P.createSpring();
  const aim = P.createSpring();
  let geometry;
  let frame = 0;
  let lastTime = 0;
  let watchdog = 0;
  let intro = null;
  let played = false;
  let held = null;
  let pullTarget = 0;
  let aimTarget = 0;
  let reloadAt = 0;
  let lastShot = -Infinity;
  let shotCount = 0;
  const shots = [];
  const ripples = [];
  const cuts = new Map();
  // Keep real text in the accessibility tree; the two ink layers are visual only.
  const words = [];
  section.querySelectorAll('.essence-line, .essence-body p').forEach(line => {
    const text = line.textContent;
    line.replaceChildren();
    text.split(/(\s+)/).forEach(part => {
      if (!part.trim()) { line.append(document.createTextNode(part)); return; }
      const word = document.createElement('span');
      word.className = 'essence-cut-word';
      const original = document.createElement('span');
      original.className = 'essence-word-original';
      original.textContent = part;
      word.append(original);
      for (const side of ['top', 'bottom']) {
        const layer = document.createElement('span');
        layer.className = `essence-word-half essence-word-${side}`;
        layer.setAttribute('aria-hidden', 'true');
        layer.textContent = part;
        word.append(layer);
      }
      line.append(word);
      words.push(word);
    });
  });
  const clamp = (n, min=0, max=1) => Math.max(min, Math.min(max,n));
  const ramp = (t,start,duration) => clamp((t-start)/duration);
  const smooth = n => n*n*(3-2*n);
  const out = n => 1-(1-n)**3;
  const mix = (a,b,p) => a+(b-a)*p;
  const path = a => `M${a[0]} ${a[1]}C${a.slice(2).join(' ')}`;
  const blend = (a,b,p) => a.map((n,i) => mix(n,b[i],p));

  // A tapered ribbon follows the same flexible spine as the string anchors.
  // Its inset follows the contour instead of offsetting a second whole bow.
  function limbProfile(points) {
    const edges=[[],[]], inset=[];
    for(let segment=0;segment<4;segment++) {
      const i=segment*6;
      for(let step=segment?1:0;step<=16;step++) {
        const t=step/16, u=1-t;
        const x=u*u*u*points[i]+3*u*u*t*points[i+2]+3*u*t*t*points[i+4]+t*t*t*points[i+6];
        const y=u*u*u*points[i+1]+3*u*u*t*points[i+3]+3*u*t*t*points[i+5]+t*t*t*points[i+7];
        const dx=3*u*u*(points[i+2]-points[i])+6*u*t*(points[i+4]-points[i+2])+3*t*t*(points[i+6]-points[i+4]);
        const dy=3*u*u*(points[i+3]-points[i+1])+6*u*t*(points[i+5]-points[i+3])+3*t*t*(points[i+7]-points[i+5]);
        const length=Math.hypot(dx,dy)||1, nx=-dy/length, ny=dx/length;
        const width=.35+2.45*Math.sin(Math.PI*(segment+t)/4)**1.1;
        const point=offset=>`${(x+nx*offset).toFixed(2)} ${(y+ny*offset).toFixed(2)}`;
        edges[0].push(point(width)); edges[1].push(point(-width));
        inset.push(point(-width*.42));
      }
    }
    return {outline:`M${edges[0].join('L')}L${edges[1].reverse().join('L')}Z`,inlay:`M${inset.join('L')}`};
  }
  const active = () => document.body.dataset.section === 'essencia' && !document.hidden;
  const color = (a,b,p) => `rgb(${a.map((n,i) => Math.round(mix(n,b[i],p))).join(' ')})`;

  function node(tag, attrs, parent) {
    const element = document.createElementNS(NS,tag);
    for (const [key,value] of Object.entries(attrs)) element.setAttribute(key,String(value));
    parent.append(element);
    return element;
  }
  // Optical registration lines, with a quieter final field behind the bow.
  [156,235,335,475].forEach((r,i) => {
    node('circle',{r,fill:'none','stroke-width':i===1?'.8':'.55'},optics);
    node('path',{d:`M${-r-8} 0h16M${r-8} 0h16M0 ${-r-8}v16M0 ${r-8}v16`,'stroke-width':'.8'},optics);
  });
  for (let i=0;i<48;i++) {
    const a=i*Math.PI/24, r=i%4===0?226:231;
    node('path',{d:`M${Math.cos(a)*r} ${Math.sin(a)*r}L${Math.cos(a)*235} ${Math.sin(a)*235}`,'stroke-width':'.6'},optics);
  }
  $('.essence-iris-fibers').setAttribute('d',Array.from({length:48},(_,i) => {
    const a=i*Math.PI/24, inner=24+(i%3)*2, outer=37+(i%2)*7;
    return `M${Math.cos(a)*inner} ${Math.sin(a)*inner}L${Math.cos(a+.022)*outer} ${Math.sin(a+.022)*outer}`;
  }).join(''));

  function measure() {
    const bounds=surface.getBoundingClientRect(), art=emblem.getBoundingClientRect();
    const scale=Math.min(art.width/440,art.height/460);
    geometry={width:bounds.width,height:bounds.height,scale,
      x:art.left-bounds.left+art.width/2-45*scale,
      y:art.top-bounds.top+art.height/2-10*scale,
      startX:innerWidth<=850?bounds.width/2:(bounds.width+70)/2,
      startY:innerWidth<=850?art.top-bounds.top+art.height/2:Math.min(bounds.height,innerHeight)/2,
      startScale:innerWidth<=850?.66:Math.min(1.08,bounds.width/1100)};
    svg.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    atmosphere.setAttribute('viewBox',`0 0 ${bounds.width} ${bounds.height}`);
    dust.replaceChildren();
    let seed=71;
    for(let i=0;i<68;i++) {
      seed=(seed*16807)%2147483647; const x=seed/2147483647*bounds.width;
      seed=(seed*16807)%2147483647; const y=seed/2147483647*bounds.height;
      node('circle',{cx:x,cy:y,r:i%9===0?1.2:.55,fill:'currentColor',stroke:'none',opacity:i%3===0?'.55':'.25'},dust);
    }
  }

  function setPalette(progress=1) {
    surface.style.setProperty('--essence-scene-ink',color([221,229,219],[228,224,201],progress));
    surface.style.setProperty('--essence-field',color([25,44,49],[9,44,37],progress));
    document.body.style.setProperty('--essence-chrome-ink',color([226,230,219],[238,231,216],progress));
    $('.essence-eye-highlight').setAttribute('fill',color([25,44,49],[9,44,37],progress));
    if (intro && progress<.5) document.body.dataset.essencePhase='eye';
    else delete document.body.dataset.essencePhase;
  }
  function setReady(ready) {
    control.disabled=!ready;
  }
  function clearReveal() {
    section.classList.remove('is-unfolding');
    pieces.forEach(piece=>piece.style.removeProperty('--essence-reveal'));
    flightScene.style.opacity='0';
    dust.style.removeProperty('opacity');
    surface.style.removeProperty('--essence-figure-reveal');
    surface.style.removeProperty('--essence-mask-fade');
    surface.style.removeProperty('--essence-mask-edge');
    indicator.style.removeProperty('opacity');
    delete document.body.dataset.essenceTransition;
    delete section.dataset.essencePhase;
    setPalette(1);
    setReady(true);
  }
  function endIntro() {
    if (!intro) return;
    intro=null;
    clearTimeout(watchdog);
    clearReveal();
    pullTarget=0;
    renderBow();
    wake();
  }
  function releaseCapture() {
    if (held?.id !== undefined && control.hasPointerCapture(held.id)) control.releasePointerCapture(held.id);
  }
  function cancelHold() {
    const previous=held;
    held=null;
    if (previous?.id !== undefined && control.hasPointerCapture(previous.id)) control.releasePointerCapture(previous.id);
    pullTarget=0;
    section.classList.remove('is-aiming');
  }
  function resetDynamics() {
    cancelHold();
    for(const state of [tension,flex,aim]) { state.value=0; state.velocity=0; }
    aimTarget=0; reloadAt=0;
    shots.length=0; ripples.length=0;
    for (const word of cuts.keys()) word.classList.remove('is-cut');
    cuts.clear();
    projectileLayer.replaceChildren(); rippleLayer.replaceChildren();
  }
  function suspend() {
    if(intro) endIntro();
    cancelAnimationFrame(frame); frame=0; lastTime=0;
    clearTimeout(watchdog);
    resetDynamics();
    section.dataset.bowState='idle';
    clearReveal();
    renderBow();
  }

  function drawShape(shape,turn=1,opening=1,x=geometry.x,y=geometry.y,scale=geometry.scale) {
    const top=turn===1?shape.limb:blend(eyeTop,shape.limb,turn);
    const bottom=turn===1?shape.string:blend(eyeBottom,shape.string,turn);
    const d=path(top);
    if(turn===1) {
      morph.setAttribute('transform',`translate(${x+79*scale} ${y}) rotate(${aim.value*180/Math.PI}) scale(${scale}) translate(-79 0) rotate(90)`);
    } else morph.setAttribute('transform',`translate(${x} ${y}) scale(${scale}) rotate(${turn*90}) scale(1 ${opening})`);
    limb.setAttribute('d',d);
    const profile=limbProfile(top);
    limb.setAttribute('stroke-width','1.8');
    limb.style.opacity=String(1-turn);
    shadow.setAttribute('d',d); shadow.setAttribute('transform','translate(1 1)'); shadow.style.opacity=String(turn*.35);
    material.setAttribute('d',profile.outline); material.style.opacity=String(turn);
    detail.setAttribute('d',profile.inlay); detail.style.opacity=String(turn*.85);
    string.setAttribute('d',path(bottom)); string.style.opacity=String(1-turn*.22);
    grip.style.opacity=String(smooth(ramp(turn,.65,.35)));
  }
  function nockPosition(draw=tension.value, angle=aim.value) {
    const distance=(-79-draw)*geometry.scale;
    return {x:geometry.x+79*geometry.scale+Math.cos(angle)*distance,y:geometry.y+Math.sin(angle)*distance};
  }
  function renderBow(now=performance.now()) {
    if (!geometry) return;
    const vibration=preference.matches?0:flex.velocity*.003;
    drawShape(P.bowState(tension.value,flex.value,vibration));
    morph.style.opacity='1'; iris.style.opacity='0';
    const nock=nockPosition();
    arrow.setAttribute('transform',`translate(${nock.x} ${nock.y}) rotate(${aim.value*180/Math.PI}) scale(${geometry.scale})`);
    arrow.style.opacity=String(reloadAt?out(clamp((now-reloadAt)/180)):.86);
    indicator.setAttribute('cx',nock.x); indicator.setAttribute('cy',nock.y);
    indicator.setAttribute('r',Math.max(10,13*geometry.scale));
    optics.setAttribute('transform',`translate(${geometry.x+45*geometry.scale} ${geometry.y}) scale(${Math.max(.65,geometry.scale)})`);
    optics.style.opacity=String(.075+clamp(tension.value/105)*.045);
  }
  function addRipple(power,now) {
    const ring=node('circle',{cx:geometry.x+79*geometry.scale,cy:geometry.y,r:0,fill:'none',stroke:'#c1cda0','stroke-width':'.7'},rippleLayer);
    ripples.push({element:ring,start:now,power});
    if(ripples.length>4) ripples.shift().element.remove();
  }
  function fire(draw,now=performance.now()) {
    if(!active() || now-lastShot<180) return;
    const strength=clamp(draw,15,105);
    lastShot=now; pullTarget=0;
    shotCount++;
    status.textContent=`Flecha ${shotCount} lançada.`;
    if(preference.matches) {
      tension.value=0; tension.velocity=0; flex.value=0; flex.velocity=0;
      renderBow(); return;
    }
    const pos=nockPosition(strength), velocity=P.launch(strength,aim.value,geometry.scale);
    const group=node('g',{'stroke':'url(#essence-arrow-ink)',fill:'none'},projectileLayer);
    const dart=node('g',{},group); node('use',{href:'#essence-arrow-shape'},dart);
    shots.push({element:group,dart,x:pos.x,y:pos.y,vx:velocity.vx,vy:velocity.vy,scale:geometry.scale,age:0,hit:new Set()});
    if(shots.length>6) shots.shift().element.remove();
    tension.value=strength;
    tension.velocity=-strength*8.5;
    flex.velocity-=strength*3;
    reloadAt=now+260;
    addRipple(strength/105,now);
    wake();
  }
  function arrowTip(shot) {
    const angle=Math.atan2(shot.vy,shot.vx);
    return {x:shot.x+230*shot.scale*Math.cos(angle),y:shot.y+230*shot.scale*Math.sin(angle)};
  }
  function cutWords(shot,from,to,now,bounds) {
    for(const word of words) {
      if(shot.hit.has(word)) continue;
      const box=word.getBoundingClientRect();
      const left=box.left-bounds.left, top=box.top-bounds.top;
      // Swept tip/box intersection avoids tunnelling during fast shots.
      let enter=0, exit=1;
      for(const [origin,delta,min,max] of [[from.x,to.x-from.x,left,left+box.width],[from.y,to.y-from.y,top,top+box.height]]) {
        if(Math.abs(delta)<.0001) {if(origin<min || origin>max) {exit=-1;break;}}
        else {
          const a=(min-origin)/delta, b=(max-origin)/delta;
          enter=Math.max(enter,Math.min(a,b)); exit=Math.min(exit,Math.max(a,b));
        }
      }
      if(enter>exit) continue;
      shot.hit.add(word);
      if(cuts.has(word)) continue;
      const slope=(to.y-from.y)/Math.max(.001,to.x-from.x);
      const edge=x=>clamp((from.y+slope*(x-from.x)-top)/box.height*100,12,88);
      const l=edge(left), r=edge(left+box.width);
      word.style.setProperty('--cut-left',`${l}%`);
      word.style.setProperty('--cut-right',`${r}%`);
      word.classList.add('is-cut'); cuts.set(word,now);
      status.textContent=`Flecha ${shotCount}: corte em ${word.firstChild.textContent}.`;
    }
  }
  function updateFlights(dt,now) {
    const bounds=shots.length?surface.getBoundingClientRect():null;
    for(let i=shots.length-1;i>=0;i--) {
      const shot=shots[i];
      // Small exact ballistic steps also sample the rotating tip for collision.
      const steps=Math.max(1,Math.ceil(dt/(1/120))), h=dt/steps;
      const gravity=820*shot.scale;
      for(let step=0;step<steps;step++) {
        const previous=arrowTip(shot);
        shot.x+=shot.vx*h; shot.y+=shot.vy*h+.5*gravity*h*h;
        shot.vy+=gravity*h; shot.age+=h;
        const tip=arrowTip(shot);
        cutWords(shot,previous,tip,now,bounds);
      }
      shot.dart.setAttribute('transform',`translate(${shot.x} ${shot.y}) rotate(${Math.atan2(shot.vy,shot.vx)*180/Math.PI}) scale(${shot.scale})`);
      if(shot.x>geometry.width+300 || shot.y>geometry.height+300 || shot.age>5) {shot.element.remove(); shots.splice(i,1);}
    }
    for(const [word,start] of cuts) {
      if(now-start>=1050) {word.classList.remove('is-cut');cuts.delete(word);}
    }
    for(let i=ripples.length-1;i>=0;i--) {
      const ripple=ripples[i], t=(now-ripple.start)/800;
      ripple.element.setAttribute('r',String(out(clamp(t))*(180+100*ripple.power)*geometry.scale));
      ripple.element.style.opacity=String((1-clamp(t))**2*.34);
      if(t>=1) {ripple.element.remove();ripples.splice(i,1);}
    }
  }

  function beginIntro({initial=false}={}) {
    if(!active()) return;
    if(preference.matches || played || section.contains(document.activeElement)) { played=true; renderBow(); return; }
    resetDynamics(); played=true;
    const mobile=innerWidth<=850;
    const pose=mobile?{x:geometry.width*.23,y:geometry.height*.46,
      scale:Math.min(.68,(geometry.width-64)/380,(geometry.height-170)/430)}:
      {x:geometry.x,y:geometry.y,scale:geometry.scale};
    // A shared world is 1,000 units wide, regardless of the viewport.
    const unit=geometry.width/1000;
    const gravity=Math.min(380,Math.max(100,(pose.y-110)/unit/0.3583));
    const trip=F.create({gravity});
    intro={start:performance.now()+(initial?40:120),fired:false,flight:null,pose,unit,trip};
    buildFlightWorld();
    for(const key of ['distance','camera','flightTime']) delete flightScene.dataset[key];
    setReady(false);
    section.classList.add('is-unfolding');
    document.body.dataset.essenceTransition='true';
    pieces.forEach(piece=>piece.style.setProperty('--essence-reveal','0'));
    setPalette(0);
    flightScene.style.opacity='0';
    dust.style.removeProperty('opacity');
    surface.style.setProperty('--essence-figure-reveal','0');
    surface.style.setProperty('--essence-mask-fade','1');
    surface.style.setProperty('--essence-mask-edge','1');
    watchdog=setTimeout(endIntro,5500);
    wake();
  }
  function poseNock(draw,angle,pose) {
    const distance=(-79-draw)*pose.scale;
    return {x:pose.x+79*pose.scale+Math.cos(angle)*distance,y:pose.y+Math.sin(angle)*distance};
  }
  function buildFlightWorld() {
    flightFar.replaceChildren(); flightNear.replaceChildren(); fragments.replaceChildren();
    const width=geometry.width, height=geometry.height, reach=intro.trip.range*intro.unit;
    let seed=941;
    const random=()=>{seed=seed*16807%2147483647;return seed/2147483647;};
    // Fixed references in the world make camera travel visible. The two depths
    // pass at different speeds; nothing loops or respawns around the arrow.
    for(let i=0;i<56;i++) {
      const x=random()*(reach*.28+width), y=88+random()*(height-130);
      node('circle',{cx:x,cy:y,r:i%8===0?1.3:.65,fill:'#b6c5a5',stroke:'none',opacity:i%3===0?.28:.12},flightFar);
    }
    for(let i=0;i<66;i++) {
      const x=random()*(reach*.88+width), y=92+random()*(height-135);
      const length=i%5===0?24+random()*36:3+random()*9;
      node('path',{d:`M${x} ${y}h${length}`,stroke:'#c1cba7','stroke-width':i%4===0?1.2:.65,opacity:i%5===0?.2:.12},flightNear);
    }
    for(let i=0;i<3;i++) {
      const y=height*(.65+i*.17), span=reach*.28+width;
      node('path',{d:`M0 ${y}C${span*.3} ${y-height*.13} ${span*.55} ${y+height*.1} ${span} ${y-height*.16}`,fill:'none',stroke:'#bdc7a4','stroke-width':'.65',opacity:'.09'},flightFar);
    }
    for(let i=0;i<7;i++) node('path',{'stroke-width':i%2?'.8':'1.1'},fragments);
  }
  function launchFlight() {
    const {pose,trip,unit}=intro;
    tension.value=105;
    const angle=trip.launchAngle, nock=poseNock(105,angle,pose);
    const origin={x:nock.x+230*pose.scale*Math.cos(angle),y:nock.y+230*pose.scale*Math.sin(angle)};
    const end=F.sample(trip,trip.duration);
    const targetPoint={x:origin.x+end.x*unit,y:origin.y+end.y*unit};
    intro.flight={origin,target:targetPoint,scale:pose.scale,
      targetScale:Math.min(1.15,geometry.width*.18/132,geometry.height*.21/132),
      cameraMax:targetPoint.x-geometry.width*.78};
    intro.fired=true;
    tension.velocity=-105*8.5; flex.velocity=-105*3;
    pullTarget=0;
  }
  function cameraPosition(tipX,maximum) {
    const k=geometry.width*.08;
    const soft=x=>x<=0?0:x<k?x*x/(2*k):x-k/2;
    const q=tipX-geometry.width*.58;
    return soft(q)-soft(q-maximum);
  }
  function drawFlight(t) {
    const flight=intro.flight;
    if(!flight) return {x:0,y:0};
    // Play the same physical path faster, preserving its curve and distance.
    const age=Math.max(0,t-launchAt)*intro.trip.duration/flightDuration, contact=Math.max(0,t-impactAt);
    const state=F.sample(intro.trip,age);
    const tip={x:flight.origin.x+state.x*intro.unit,y:flight.origin.y+state.y*intro.unit};
    const landed=age>=intro.trip.duration;
    const direction=Math.atan2(state.vy,state.vx);
    const angle=age===0?intro.trip.launchAngle:direction;
    const cameraX=cameraPosition(tip.x,flight.cameraMax);
    const fade=1-smooth(ramp(t,revealAt,.6));
    flightScene.style.opacity=String(fade);
    flightFar.setAttribute('transform',`translate(${-cameraX*.28} 0)`);
    flightNear.setAttribute('transform',`translate(${-cameraX*.88} 0)`);
    flightWorld.setAttribute('transform',`translate(${-cameraX} 0)`);
    const kick=landed?Math.sin(contact*36)*Math.exp(-contact*15)*6:0;
    target.setAttribute('transform',`translate(${flight.target.x+kick} ${flight.target.y}) scale(${flight.targetScale})`);
    const penetration=landed?out(ramp(contact,0,.055))*7*flight.targetScale:0;
    const vibration=landed?Math.sin(contact*65)*Math.exp(-contact*11)*1.9:0;
    arrival.setAttribute('transform',`translate(${tip.x+kick+penetration} ${tip.y}) rotate(${angle*180/Math.PI+vibration}) scale(${flight.scale}) translate(-230 0)`);
    arrival.style.opacity='1';
    wound.setAttribute('transform',`translate(${flight.target.x+kick} ${flight.target.y}) scale(${flight.targetScale})`);
    wound.style.opacity=landed?'1':'0';
    fragments.style.opacity=landed?String((1-ramp(contact,0,.28))*.7):'0';
    [...fragments.children].forEach((piece,i)=>{
      const spread=(i-3)*.24, speed=(90+i%3*55)*flight.targetScale;
      const x=flight.target.x+Math.cos(angle+spread)*speed*contact;
      const y=flight.target.y+Math.sin(angle+spread)*speed*contact+90*contact*contact;
      piece.setAttribute('d',`M${x} ${y}l${Math.cos(spread)*4} ${Math.sin(spread)*5}`);
    });
    // Read-only observations for diagnosing the authored sequence in the DOM.
    section.dataset.essencePhase=landed?'impact':'flight';
    flightScene.dataset.distance=String(state.x);
    flightScene.dataset.camera=String(cameraX);
    flightScene.dataset.flightTime=String(age);
    return {x:cameraX,y:0};
  }
  function drawIntro(now,dt) {
    if(section.contains(document.activeElement) && document.activeElement!==control) {endIntro();return;}
    const t=Math.max(0,(now-intro.start)/1000), {pose}=intro;
    const preparation=t*2.28/launchAt;
    const turn=smooth(ramp(preparation,.74,.78)), move=smooth(ramp(preparation,1.03,.65));
    const opening=out(ramp(preparation,0,.36))*(1-Math.sin(ramp(preparation,.49,.22)*Math.PI)*.84);
    const startY=innerWidth<=850?geometry.height*.46:geometry.startY;
    const x=mix(geometry.startX,pose.x,move), y=mix(startY,pose.y,move), scale=mix(geometry.startScale,pose.scale,move);
    if(t<launchAt) {
      section.dataset.essencePhase=preparation<.74?'eye':'bow';
      aim.value=intro.trip.launchAngle*smooth(ramp(preparation,1.54,.3));
      tension.value=smooth(ramp(preparation,1.83,.39))*105; tension.velocity=0;
    } else {
      if(!intro.fired) launchFlight();
      P.stepSpring(tension,0,dt,{stiffness:480,damping:17});
      P.stepSpring(flex,tension.value*.15,dt,{stiffness:200,damping:12});
    }
    const camera=drawFlight(t);
    const reveal=smooth(ramp(t,revealAt,revealDuration));
    if(t>=revealAt) {
      section.dataset.essencePhase='reveal';
      aim.value=0;
      renderBow(now);
      morph.style.opacity=String(reveal);
      arrow.style.opacity=String(smooth(ramp(t,revealAt+.12,.65))*.86);
      optics.style.opacity=String(.075*reveal);
    } else {
      drawShape(P.bowState(tension.value,flex.value,flex.velocity*.002),turn,mix(opening,1,turn),x-camera.x,y-camera.y,scale);
      morph.style.opacity=String(out(ramp(preparation,0,.22)));
      iris.style.opacity=String(1-smooth(ramp(preparation,.75,.36)));
      iris.setAttribute('transform',`translate(${Math.sin(ramp(preparation,.1,.6)*Math.PI)*6} 0)`);
      const nock=poseNock(tension.value,aim.value,pose);
      arrow.setAttribute('transform',`translate(${nock.x} ${nock.y}) rotate(${aim.value*180/Math.PI}) scale(${pose.scale})`);
      arrow.style.opacity=String(intro.fired?0:ramp(preparation,1.65,.2)*.95);
      optics.setAttribute('transform',`translate(${mix(geometry.startX,pose.x+45*pose.scale,move)-camera.x*.9} ${y}) scale(${mix(geometry.startScale,Math.max(.65,pose.scale),move)})`);
      optics.style.opacity=String(mix(.1,.075,move));
    }
    setPalette(smooth(ramp(preparation,.75,1.02)));
    dust.style.opacity=String(.2*(1-out(ramp(t,launchAt,.22)))+.2*reveal);
    surface.style.setProperty('--essence-mask-fade',String(mix(1,.13,reveal)));
    surface.style.setProperty('--essence-mask-edge',String(1-reveal));
    indicator.style.opacity='0';
    pieces.forEach((piece,i)=>piece.style.setProperty('--essence-reveal',String(smooth(ramp(t,revealAt+.04+i*revealStagger,revealDuration)))));
    surface.style.setProperty('--essence-figure-reveal',String(reveal));
    if(t>=revealAt+.04+(pieces.length-1)*revealStagger+revealDuration+.06) endIntro();
  }
  function tick(now) {
    frame=0;
    if(!active()) {suspend();return;}
    const dt=lastTime?clamp((now-lastTime)/1000,0,.05):1/60;
    lastTime=now;
    try {
      if(intro) drawIntro(now,dt);
      else {
        if(held?.kind==='keyboard') pullTarget=clamp((now-held.start)/650)*105;
        if(preference.matches) {tension.value=pullTarget;aim.value=aimTarget;}
        else {
          P.stepSpring(tension,pullTarget,dt,held?{stiffness:330,damping:32}:{stiffness:480,damping:17});
          P.stepSpring(flex,tension.value*.15,dt,{stiffness:200,damping:12});
          P.stepSpring(aim,aimTarget,dt,{stiffness:180,damping:24});
        }
        renderBow(now);
      }
      updateFlights(dt,now);
      if(reloadAt && now>reloadAt+200) reloadAt=0;
      const moving=[tension,flex,aim].some(s=>Math.abs(s.velocity)>.02) || Math.abs(tension.value-pullTarget)>.015 || Math.abs(flex.value-tension.value*.15)>.015 || Math.abs(aim.value-aimTarget)>.001;
      if(intro || held || shots.length || cuts.size || ripples.length || reloadAt || (!preference.matches && moving)) wake();
      else {lastTime=0;section.dataset.bowState='idle';}
    } catch {suspend();section.classList.remove('has-bow');control.hidden=true;}
  }
  function wake() { if(!frame && active()) {section.dataset.bowState=intro?'intro':held?'drawing':'settling';frame=requestAnimationFrame(tick);} }

  control.addEventListener('pointerdown',event=>{
    if(event.button!==0 || held || intro) return;
    event.preventDefault();
    control.focus({preventScroll:true});
    held={kind:'pointer',id:event.pointerId,x:event.clientX,y:event.clientY,start:performance.now(),distance:0};
    control.setPointerCapture(event.pointerId);
    pullTarget=12;
    section.classList.add('is-aiming');
    wake();
  });
  control.addEventListener('pointermove',event=>{
    if(held?.kind!=='pointer' || held.id!==event.pointerId) return;
    const dx=held.x-event.clientX, dy=held.y-event.clientY;
    held.distance=Math.max(held.distance,Math.hypot(dx,dy));
    pullTarget=clamp(12+dx/geometry.scale,0,105);
    aimTarget=clamp(dy/(220*geometry.scale),-.85,innerWidth<=850?1.3:.85);
    wake();
  });
  control.addEventListener('pointerup',event=>{
    if(held?.kind!=='pointer' || held.id!==event.pointerId) return;
    const draw=held.distance<8?50:Math.max(tension.value,pullTarget*.85);
    releaseCapture();cancelHold();
    if(draw>=15) fire(draw); else wake();
  });
  control.addEventListener('pointercancel',()=>{cancelHold();wake();});
  control.addEventListener('lostpointercapture',()=>{if(held?.kind==='pointer'){cancelHold();wake();}});
  control.addEventListener('keydown',event=>{
    if([' ','Enter'].includes(event.key)) {
      event.preventDefault();
      if(!held && !event.repeat && !intro) {held={kind:'keyboard',key:event.key,start:performance.now()};section.classList.add('is-aiming');wake();}
    } else if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.key)) {
      event.preventDefault();aimTarget=clamp(aimTarget+(['ArrowUp','ArrowLeft'].includes(event.key)?-.07:.07),-.85,innerWidth<=850?1.3:.85);wake();
    } else if(event.key==='Escape') {event.preventDefault();cancelHold();wake();}
  });
  control.addEventListener('keyup',event=>{
    if(held?.kind!=='keyboard' || event.key!==held.key) return;
    event.preventDefault();const draw=Math.max(35,tension.value);cancelHold();fire(draw);
  });
  control.addEventListener('click',event=>{
    // Assistive-technology activation has no preceding pointer/key gesture.
    if(event.detail===0 && !held && performance.now()-lastShot>220 && !intro) fire(55);
  });
  control.addEventListener('blur',()=>{cancelHold();wake();});
  section.addEventListener('focusin',event=>{if(intro && event.target!==control)endIntro();});
  section.addEventListener('pointerdown',event=>{if(intro)endIntro();},{passive:true});
  $('.scene-scroll').addEventListener('scroll',()=>{if(intro)endIntro();if(held){cancelHold();wake();}},{passive:true});
  document.addEventListener('portfolio:sectionchange',event=>{
    if(event.detail.id!=='essencia') suspend();
    else {measure();renderBow();beginIntro(event.detail);}
  });
  window.addEventListener('resize',()=>{suspend();measure();renderBow();},{passive:true});
  window.addEventListener('blur',()=>{if(held){cancelHold();wake();}});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();else if(active()){measure();renderBow();}});
  preference.addEventListener('change',()=>{suspend();measure();renderBow();});

  measure();
  section.classList.add('has-bow');
  control.hidden=false;
  renderBow();
  document.fonts?.ready.then(()=>{measure();if(!intro)renderBow();});
  beginIntro({initial:true});
})();
