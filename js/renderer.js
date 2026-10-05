// Canvas drawing and visual effects; shares the original game globals.
    function triggerStageAlert(text, sub) {
      stageAlert.text = text;
      stageAlert.sub = sub;
      stageAlert.scale = 2.2;
      stageAlert.alpha = 1.0;
    }

    function triggerComboPopup(c, color) {
      comboPopup.text = `${c} COMBO!`;
      comboPopup.color = color;
      comboPopup.scale = 2.2;
      comboPopup.alpha = 1.0;
    }

    function updateStageAmbience(dt) {
      updateBackgroundMotion(dt);
      if (stageLevel === 8) {
        for (let i = 0; i < astroAnimals.length; i++) {
          const a = astroAnimals[i];
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          a.angle += a.vRot * dt;
          if (a.x < -40) a.x = 400;
          if (a.x > 400) a.x = -40;
          if (a.y < -40) a.y = 350;
          if (a.y > 350) a.y = -40;
        }

        if (!isCountingDown && Math.random() < 0.035 && spaceships.length < 3) {
          const fromLeft = Math.random() < 0.5;
          spaceships.push({
            x: fromLeft ? -50 : 410,
            y: Math.random() * 200 + 30,
            vx: (fromLeft ? 1 : -1) * (Math.random() * 5 + 5),
            vy: (Math.random() - 0.5) * 1.5,
            type: Math.random() < 0.5 ? 'ROCKET' : 'UFO',
            color: Math.random() < 0.5 ? '#00ffff' : '#ff00ff'
          });
        }

        for (let i = spaceships.length - 1; i >= 0; i--) {
          const s = spaceships[i];
          s.x += s.vx * dt;
          s.y += s.vy * dt;
          if (s.x < -60 || s.x > 420) spaceships.splice(i, 1);
        }

        if (!isCountingDown && !crashingShip && Math.random() < 0.012) {
          crashingShip = {
            x: Math.random() * 200 + 80,
            y: Math.random() * 160 + 60,
            scale: 0.1,
            maxScale: 3.2,
            growSpeed: 0.06,
            rot: 0
          };
        }

        if (crashingShip) {
          crashingShip.scale += crashingShip.growSpeed * dt;
          crashingShip.rot += 0.04 * dt;

          if (crashingShip.scale >= crashingShip.maxScale) {
            shakeAmount = 16;
            playCrashBoom();
            triggerHaptic([90, 35, 100]);

            glassCracks.push({
              x: crashingShip.x,
              y: crashingShip.y,
              alpha: 1.0,
              branches: generateCrackBranches()
            });

            createParticles(crashingShip.x, crashingShip.y, '#ff3300', 14);
            createParticles(crashingShip.x, crashingShip.y, '#00ffff', 12);
            addFloatingText("💥 CRASH!!", crashingShip.x, crashingShip.y, '#ff0055', 22);

            crashingShip = null;
          }
        }

        for (let i = glassCracks.length - 1; i >= 0; i--) {
          glassCracks[i].alpha -= 0.012 * dt;
          if (glassCracks[i].alpha <= 0) glassCracks.splice(i, 1);
        }
      }

      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        sw.radiusX += 3.5 * dt;
        sw.radiusY += 1.4 * dt;
        sw.alpha -= 0.08 * dt;
        if (sw.alpha <= 0 || sw.radiusX >= sw.maxRadiusX) shockwaves.splice(i, 1);
      }

      for (let i = fireworks.length - 1; i >= 0; i--) {
        const f = fireworks[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;
        f.vy += 0.08 * dt;
        f.alpha -= 0.025 * dt;
        if (f.alpha <= 0) fireworks.splice(i, 1);
      }

      for (let i = magmaParticles.length - 1; i >= 0; i--) {
        const m = magmaParticles[i];
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        m.vy += 0.22 * dt;
        m.alpha -= 0.03 * dt;
        if (m.alpha <= 0) magmaParticles.splice(i, 1);
      }
    }

    function generateCrackBranches() {
      const branches = [];
      const numLines = Math.floor(Math.random() * 4) + 6;
      for (let i = 0; i < numLines; i++) {
        const ang = (Math.PI * 2 / numLines) * i + (Math.random() - 0.5) * 0.4;
        const len = Math.random() * 50 + 35;
        branches.push({ dx: Math.cos(ang) * len, dy: Math.sin(ang) * len });
      }
      return branches;
    }

    function spawnFirework(x, y) {
      const colors = ['#ff3366', '#33ffcc', '#ffee00', '#ff99ff', '#33ccff'];
      const col = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 16; i++) {
        const ang = (Math.PI * 2 / 16) * i;
        const spd = Math.random() * 3.5 + 2;
        fireworks.push({
          x, y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          color: col,
          alpha: 1,
          size: Math.random() * 3 + 2
        });
      }
    }

    function updateEffects(dt) {
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const t = floatingTexts[i];
        t.y += t.vy * dt;
        t.alpha -= 0.025 * dt;
        if (t.alpha <= 0) floatingTexts.splice(i, 1);
      }

      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.alpha -= 0.035 * dt;
        if (p.alpha <= 0) particles.splice(i, 1);
      }

      if (comboPopup.alpha > 0) {
        comboPopup.scale += (1.0 - comboPopup.scale) * 0.25 * dt;
        comboPopup.alpha -= 0.022 * dt;
      }

      if (stageAlert.alpha > 0) {
        stageAlert.scale += (1.0 - stageAlert.scale) * 0.18 * dt;
        stageAlert.alpha -= 0.015 * dt;
      }

      if (shakeAmount > 0) shakeAmount *= Math.pow(0.85, dt);
      if (shakeAmount < 0.5) shakeAmount = 0;
    }

    function addFloatingText(text, x, y, color, size = 16) {
      floatingTexts.push({ text, x, y, vy: -2.4, alpha: 1, color, size });
    }

    function createParticles(x, y, color, count) {
      for (let i = 0; i < count; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.8) * 6,
          color,
          alpha: 1,
          size: Math.random() * 4 + 3
        });
      }
    }

    function update3DRopePoints() {
      const rotY = Math.cos(ropeAngle - Math.PI);
      const rotZ = -Math.sin(ropeAngle - Math.PI);
      const topRadius = Math.round(Math.min(160, canvas.height * 0.21));
      // 바닥을 파고드는 가상 충돌 반경(바닥 충돌 탄성 계산용)
      const theoreticalBottomRadius = (GROUND_Y - LEFT_HAND.y) + 16;

      const angleDiff = Math.abs((ropeAngle % (Math.PI * 2)) - Math.PI);
      const isNearFloor = angleDiff < 0.52;

      for (let i = 0; i <= ROPE_SEGMENTS; i++) {
        const t = i / ROPE_SEGMENTS;
        const curveWeight = Math.sin(t * Math.PI);
        let wx = LEFT_HAND.x + (RIGHT_HAND.x - LEFT_HAND.x) * t;

        let radiusY = (rotY > 0) ? theoreticalBottomRadius : topRadius;
        let wy = LEFT_HAND.y + (rotY * radiusY * curveWeight);

        // 줄이 바닥에 닿을 때의 물리적 충돌 변형 (바닥 밀착 + 납작해짐 + 양옆 반발 S-커브)
        if (rotY > 0 && wy >= GROUND_Y - 3) {
          const penetration = wy - (GROUND_Y - 3);
          wy = GROUND_Y - 3; // 바닥 라인에 밀착(Flatten)

          // 중앙부 줄이 바닥에 짓눌려 좌우로 살짝 퍼지는 스쿼시 효과
          const centerDist = (t - 0.5);
          wx += centerDist * penetration * 0.40;

          // 바닥과 닿는 경계 지점(t: 0.2~0.35, 0.65~0.8)에서 줄이 위로 튕겨 올라가는 충격 반발파
          if (t > 0.18 && t < 0.36) {
            wy -= Math.sin((t - 0.18) / 0.18 * Math.PI) * (penetration * 0.38);
          } else if (t > 0.64 && t < 0.82) {
            wy -= Math.sin((t - 0.64) / 0.18 * Math.PI) * (penetration * 0.38);
          }
        }

        const maxZDepth = 88;
        const wz = rotZ * maxZDepth * curveWeight;
        const scale = 1.0 + (wz / 210);

        const centerX = 180;
        const centerY = GROUND_Y - 45;

        const p = ropePointsBuffer[i];
        p.x = centerX + (wx - centerX) * scale;
        p.y = centerY + (wy - centerY) * scale;
        p.z = wz;
        p.scale = scale;
      }
      return ropePointsBuffer;
    }

    function draw() {
      ctx.save();

      let totalShake = isGameOver ? 0 : shakeAmount;
      if (!isGameOver && stageLevel === 8 && isGameStarted && !isPaused && !isCountingDown) {
        totalShake = Math.max(totalShake, 2.8);
      } else if (!isGameOver && stageLevel === 7 && isGameStarted && !isPaused && !isCountingDown) {
        totalShake = Math.max(totalShake, 2.2);
      }
      if (stageLevel === 6 && isGameStarted && !isGameOver && !isPaused && !isCountingDown) {
        const quake=getStageQuake(backgroundMotionTime);ctx.translate(quake.x*2,quake.y*2);
      }

      if (totalShake > 0) {
        const sx = (Math.random() - 0.5) * totalShake;
        const sy = (Math.random() - 0.5) * totalShake;
        ctx.translate(sx, sy);
      }

      // STAGE 8 블랙홀 중력 왜곡(꿀렁임)
      if (stageLevel === 8 && isGameStarted && !isGameOver && !isPaused) {
        const wobbleX = Math.sin(Date.now() * 0.004) * 2.5;
        const wobbleY = Math.cos(Date.now() * 0.003) * 2.0;
        ctx.translate(wobbleX, wobbleY);
      }

      drawDynamicBackground();

      if (stageLevel === 8) {
        for (let i = 0; i < astroAnimals.length; i++) drawAstroAnimal(astroAnimals[i]);
        for (let i = 0; i < spaceships.length; i++) drawSpaceship(spaceships[i]);
      }

      if (crashingShip && !isGameOver) {
        drawCrashingSpaceship(crashingShip);
      }

      if (stageLevel === 6 && isGameStarted && !isGameOver && !isPaused) {
        const redPulse = 0.12 + 0.1 * Math.sin(Date.now() * 0.015);
        ctx.fillStyle = `rgba(255, 30, 0, ${redPulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (stageLevel === 7 && isGameStarted && !isGameOver && !isPaused && !isCountingDown) {
        const neonPulse = 0.08 + 0.06 * Math.sin(Date.now() * 0.025);
        ctx.fillStyle = `rgba(0, 255, 255, ${neonPulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else if (stageLevel === 8 && isGameStarted && !isGameOver && !isPaused && !isCountingDown) {
        const purplePulse = 0.12 + 0.08 * Math.sin(Date.now() * 0.018);
        ctx.fillStyle = `rgba(180, 0, 255, ${purplePulse})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      drawTurner(LEFT_HAND.x, GROUND_Y, true);
      drawTurner(RIGHT_HAND.x, GROUND_Y, false);

      const ropePoints = update3DRopePoints();
      const centerZ = ropePoints[Math.floor(ROPE_SEGMENTS / 2)].z;
      const ropeBehind = centerZ < 0;

      if (ropeBehind) render3DRope(ropePoints);
      drawGroundedShadows();
      drawJuicyPlayer(player.x, player.y, player.scaleX, player.scaleY);
      if (!ropeBehind) render3DRope(ropePoints);

      for (let i = 0; i < shockwaves.length; i++) {
        const sw = shockwaves[i];
        ctx.save();
        ctx.globalAlpha = sw.alpha;
        ctx.strokeStyle = sw.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.ellipse(sw.x, sw.y, sw.radiusX, sw.radiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      if (glassCracks.length > 0) {
        for (let i = 0; i < glassCracks.length; i++) {
          const g = glassCracks[i];
          ctx.strokeStyle = `rgba(255, 255, 255, ${g.alpha})`;
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          for (let j = 0; j < g.branches.length; j++) {
            const b = g.branches[j];
            ctx.moveTo(g.x, g.y);
            ctx.lineTo(g.x + b.dx, g.y + b.dy);
          }
          ctx.stroke();
        }
      }

      for (let i = 0; i < fireworks.length; i++) {
        const f = fireworks[i];
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.alpha;
        ctx.fillRect(f.x, f.y, f.size, f.size);
      }
      for (let i = 0; i < magmaParticles.length; i++) {
        const m = magmaParticles[i];
        ctx.fillStyle = m.color;
        ctx.globalAlpha = m.alpha;
        ctx.fillRect(m.x, m.y, m.size, m.size);
      }
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      }
      ctx.globalAlpha = 1;

      if (comboPopup.alpha > 0 && combo > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, 110);
        ctx.scale(comboPopup.scale, comboPopup.scale);
        ctx.globalAlpha = comboPopup.alpha;
        ctx.font = '900 28px Courier New';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#000';
        ctx.fillText(comboPopup.text, 2, 2);
        ctx.fillStyle = comboPopup.color;
        ctx.fillText(comboPopup.text, 0, 0);
        ctx.restore();
      }

      if (stageAlert.alpha > 0) {
        ctx.save();
        ctx.translate(canvas.width / 2, 70);
        ctx.scale(stageAlert.scale, stageAlert.scale);
        ctx.globalAlpha = stageAlert.alpha;
        ctx.font = '900 24px Courier New';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(stageAlert.text, 2, 2);
        ctx.fillStyle = (stageLevel === 8) ? '#bf00ff' : ((stageLevel === 7) ? '#00ffff' : '#ffee00');
        ctx.fillText(stageAlert.text, 0, 0);
        ctx.font = 'bold 13px Courier New';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(stageAlert.sub, 0, 24);
        ctx.restore();
      }

      for (let i = 0; i < floatingTexts.length; i++) {
        const t = floatingTexts[i];
        ctx.save();
        ctx.globalAlpha = t.alpha;
        ctx.font = `900 ${t.size}px Courier New`;
        ctx.textAlign = 'center';
        ctx.fillStyle = '#000';
        ctx.fillText(t.text, t.x + 1, t.y + 1);
        ctx.fillStyle = t.color;
        ctx.fillText(t.text, t.x, t.y);
        ctx.restore();
      }

      if (isCountingDown) {
        drawCountdownOverlay();
      } else if (!isGameStarted) {
        drawOverlay("넘어넘어: CAT JUMP", "하단 점프 버튼 또는 화면 터치로 시작!");
      }

      ctx.restore();
    }

    function getRopePalette(stage,scale,time) {
      if(stage<=2)return {stroke:'#4b2c1c',core:'#765035'};
      if(stage<=5)return {stroke:'#ad792c',core:'#e4ba60'};
      if(stage===6)return {stroke:scale>=1?'#ffee00':'#bb7700',core:'#ff2200'};
      if(stage===7)return {stroke:'#ff00d9',core:'#ff9bf0'};
      // Alternate blue/pink light, with a brief bright peak on each switch.
      // Back-facing segments keep the same brightness as front-facing segments.
      const phase=(time%0.8)/0.8;
      const blue=phase<.5;
      const flash=phase%.5<.08;
      return {stroke:blue?'#429dff':'#ff63dc',core:flash?'#f5f4ff':(blue?'#bde8ff':'#ffc5ed')};
    }
    function render3DRope(points) {
      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const avgScale = (p1.scale + p2.scale) / 2;
        const lineWidth = Math.max(1.4, 3.2 * avgScale);
        const palette=getRopePalette(stageLevel,avgScale,backgroundMotionTime);
        const strokeColor=palette.stroke,coreColor=palette.core;

        const steps=Math.max(1,Math.ceil(Math.max(Math.abs(p2.x-p1.x),Math.abs(p2.y-p1.y))));
        const outer=Math.max(2,Math.round(lineWidth)),inner=Math.max(1,Math.round(lineWidth*0.42));
        for(let k=0;k<=steps;k++){
          const x=Math.round(p1.x+(p2.x-p1.x)*k/steps),y=Math.round(p1.y+(p2.y-p1.y)*k/steps);
          ctx.fillStyle=strokeColor;ctx.fillRect(x-Math.floor(outer/2),y-Math.floor(outer/2),outer,outer);
          ctx.fillStyle=coreColor;ctx.fillRect(x-Math.floor(inner/2),y-Math.floor(inner/2),inner,inner);
        }
      }
    }

    const pixelCatAssets = {"colors":[[23,23,21],[191,102,54],[213,119,64],[216,140,112],[98,51,23],[168,87,44],[254,254,254],[204,119,111],[226,148,88]],"frames":[{"id":"1:2","name":"Cat / IDLE / Reference matched / 32\u00d732","rows":["................................","................................","................................","................................","..AAAA........AAAA..............","..AAAA........AAAA..............","..AABBAA....AACCAA..............","..AABBAA....AACCAA..............","..AADDEEAAAACCDDAA..........AA..","..AADDEEAAAACCDDAA..........AA..","AACCCCCCCCCCCCBBCCAA......AACCAA","AACCCCCCCCCCCCBBCCAA......AACCAA","AACCCCCCCCCCCCCCCCAA......AACCAA","AACCCCCCCCCCCCCCCCAA......AACCAA","AACCEECCCCEECCCCCCAA....AAFFCCAA","AACCEECCCCEECCCCCCAA....AAFFCCAA","AACCGGHHGGBBCCCCCCAAAAAAFFCCAA..","AACCGGHHGGGGCCCCCCAAAAAAFFCCAA..","..AAGGGGGGGGCCCCBBCCCCBBCCAA....","..AAGGGGGGGGCCCCBBCCCCBBCCAA....","....AAAABBBBBBBBCCCCCCBBAA......","....AAAABBBBBBBBCCCCCCBBAA......","......AACCCCCCCCCCCCCCCCAA......","......AACCCCCCCCCCCCCCCCAA......","......AACCAACCCCAAAAAACCAA......","......AACCAACCCCAAAAAACCAA......","......AAAA..AAAAAA..AAAAAA......","......AAAA..AAAAAA..AAAAAA......","................................","................................","................................","................................"]},{"id":"1:1012","name":"Cat / TAKE OFF / 32\u00d732","rows":["..AAAA........AAAA..............","..AAAA........AAAA..............","..AABBAA....AABBAA..............","..AABBAA....AABBAA..............","..AADDEEAAAABBDDAA..............","..AADDEEAAAABBDDAA..............","AACCCCCCCCCCCCBBCCAA......AAAA..","AACCCCCCCCCCCCBBCCAA......AAAA..","AACCEECCCCEECCCCCCAA....AABBCCAA","AACCEECCCCEECCCCCCAA....AABBCCAA","AACCGGHHGGCCCCCCCCAA....AACCCCAA","AACCGGHHGGCCCCCCCCAA....AACCCCAA","..AAGGGGGGGGCCCCCCAAAAAAEECCCCAA","..AAGGGGGGGGCCCCCCAAAAAAEECCCCAA","AACCAAAAAABBCCCCCCCCAAEECCCCAA..","AACCAAAAAABBCCCCCCCCAAEECCCCAA..","AACCBBCCCCBBIICCCCCCCCAABBCCAA..","AACCBBCCCCBBIICCCCCCCCAABBCCAA..","..AAAABBIIIIIIIICCCCCCCCAA......","..AAAABBIIIIIIIICCCCCCCCAA......","......AAAAIIIIIICCCCCCCCAA......","......AAAAIIIIIICCCCCCCCAA......","..........AAIIIIIIBBCCCCCCAA....","..........AAIIIIIIBBCCCCCCAA....","............AAAAIIAACCCCCCAA....","............AAAAIIAACCCCCCAA....","................AABBAACCCCBBAA..","................AABBAACCCCBBAA..","..................AABBAACCBBAA..","..................AABBAACCBBAA..","....................AA..AAAA....","....................AA..AAAA...."]},{"id":"2:2446","name":"LAND latest","rows":["........................AAAA....","........................AAAA....","......................AABBBBAA..","......................AABBBBAA..","........................AABBAA..","........................AABBAA..","......................AAFFBB....","......................AAFFBB....","..AAAA........AAAA..AACCCCAA....","..AAAA........AAAA..AACCCCAA....","..AABBAA....AACCAAAACCCCCCAA....","..AABBAA....AACCAAAACCCCCCAA....","..AADDEEAAAACCDDAACCCCCCCCCCAA..","..AADDEEAAAACCDDAACCCCCCCCCCAA..","AACCCCCCCCCCCCBBCCAACCCCCCCCAA..","AACCCCCCCCCCCCBBCCAACCCCCCCCAA..","AACCCCCCCCCCCCCCCCAACCBBCCCCAA..","AACCCCCCCCCCCCCCCCAACCBBCCCCAA..","AACCEECCCCEECCCCCCCCCCBBCCCCAA..","AACCEECCCCEECCCCCCCCCCBBCCCCAA..","AACCGGHHGGBBCCCCCCCCAABBCCAA....","AACCGGHHGGGGCCCCCCCCAABBCCAA....","..AAGGGGGGGGCCCCCCAA..AAAA......","..AAGGGGGGGGCCCCCCAA..AAAA......","....AABBBBBBBBCCAA..............","....AABBBBBBBBCCAA..............","....AACCAACCCCAA................","....AACCAACCCCAA................","....AACCAACCCCAA................","....AACCAACCCCAA................","....AAAA..AAAA..................","....AAAA..AAAA.................."]}]};
    const pixelCatSprites = pixelCatAssets.frames.map(frame => {
      const image = document.createElement('canvas');
      image.width = image.height = 32;
      const g = image.getContext('2d');
      let left = 31, right = 0, bottom = 0;
      frame.rows.forEach((row, y) => [...row].forEach((c, x) => {
        if (c === '.') return;
        g.fillStyle = 'rgb(' + pixelCatAssets.colors[c.charCodeAt(0)-65].join(',') + ')';
        g.fillRect(x, y, 1, 1);
        left = Math.min(left, x); right = Math.max(right, x+1); bottom = Math.max(bottom, y+1);
      }));
      return { image, center: (left+right)/2, bottom };
    });
    let pixelCatLandingUntil = 0;
    let pixelCatWasAirborne = false;
    function drawJuicyPlayer(x, y, sx, sy) {
      const now = performance.now();
      let frame = 0;
      if (!player.isGrounded) {
        pixelCatWasAirborne = true;
        pixelCatLandingUntil = 0;
        frame = player.vy < 0 ? 1 : 2;
      } else {
        if (pixelCatWasAirborne) pixelCatLandingUntil = now + 90;
        pixelCatWasAirborne = false;
        if (now < pixelCatLandingUntil) frame = 2;
      }
      const sprite = pixelCatSprites[frame];
      // Use an integer scale and baseline anchor to preserve every pixel.
      const size = 1.5;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(sprite.image, Math.round(x-sprite.center*size), Math.round(y-sprite.bottom*size),32*size,32*size);
      ctx.restore();
    }

    const ropeTurnerFrames = [{"name":"Cat / MACKEREL / ROPE TURNER / Hands up / Preview \u00d716","pixels":[{"x":6,"y":2,"color":"#171715"},{"x":7,"y":2,"color":"#171715"},{"x":8,"y":2,"color":"#171715"},{"x":9,"y":2,"color":"#171715"},{"x":18,"y":2,"color":"#171715"},{"x":19,"y":2,"color":"#171715"},{"x":20,"y":2,"color":"#171715"},{"x":21,"y":2,"color":"#171715"},{"x":6,"y":3,"color":"#171715"},{"x":7,"y":3,"color":"#171715"},{"x":8,"y":3,"color":"#171715"},{"x":9,"y":3,"color":"#171715"},{"x":18,"y":3,"color":"#171715"},{"x":19,"y":3,"color":"#171715"},{"x":20,"y":3,"color":"#171715"},{"x":21,"y":3,"color":"#171715"},{"x":6,"y":4,"color":"#171715"},{"x":7,"y":4,"color":"#171715"},{"x":8,"y":4,"color":"#7e8994"},{"x":9,"y":4,"color":"#7e8994"},{"x":10,"y":4,"color":"#171715"},{"x":11,"y":4,"color":"#171715"},{"x":16,"y":4,"color":"#171715"},{"x":17,"y":4,"color":"#171715"},{"x":18,"y":4,"color":"#b0b8bf"},{"x":19,"y":4,"color":"#b0b8bf"},{"x":20,"y":4,"color":"#171715"},{"x":21,"y":4,"color":"#171715"},{"x":6,"y":5,"color":"#171715"},{"x":7,"y":5,"color":"#171715"},{"x":8,"y":5,"color":"#7e8994"},{"x":9,"y":5,"color":"#7e8994"},{"x":10,"y":5,"color":"#171715"},{"x":11,"y":5,"color":"#171715"},{"x":16,"y":5,"color":"#171715"},{"x":17,"y":5,"color":"#171715"},{"x":18,"y":5,"color":"#b0b8bf"},{"x":19,"y":5,"color":"#b0b8bf"},{"x":20,"y":5,"color":"#171715"},{"x":21,"y":5,"color":"#171715"},{"x":6,"y":6,"color":"#171715"},{"x":7,"y":6,"color":"#171715"},{"x":8,"y":6,"color":"#d88c70"},{"x":9,"y":6,"color":"#d88c70"},{"x":10,"y":6,"color":"#7e8994"},{"x":11,"y":6,"color":"#7e8994"},{"x":12,"y":6,"color":"#171715"},{"x":13,"y":6,"color":"#171715"},{"x":14,"y":6,"color":"#171715"},{"x":15,"y":6,"color":"#171715"},{"x":16,"y":6,"color":"#b0b8bf"},{"x":17,"y":6,"color":"#b0b8bf"},{"x":18,"y":6,"color":"#d88c70"},{"x":19,"y":6,"color":"#d88c70"},{"x":20,"y":6,"color":"#171715"},{"x":21,"y":6,"color":"#171715"},{"x":6,"y":7,"color":"#171715"},{"x":7,"y":7,"color":"#171715"},{"x":8,"y":7,"color":"#d88c70"},{"x":9,"y":7,"color":"#d88c70"},{"x":10,"y":7,"color":"#7e8994"},{"x":11,"y":7,"color":"#7e8994"},{"x":12,"y":7,"color":"#171715"},{"x":13,"y":7,"color":"#171715"},{"x":14,"y":7,"color":"#171715"},{"x":15,"y":7,"color":"#171715"},{"x":16,"y":7,"color":"#b0b8bf"},{"x":17,"y":7,"color":"#b0b8bf"},{"x":18,"y":7,"color":"#d88c70"},{"x":19,"y":7,"color":"#d88c70"},{"x":20,"y":7,"color":"#171715"},{"x":21,"y":7,"color":"#171715"},{"x":4,"y":8,"color":"#171715"},{"x":5,"y":8,"color":"#171715"},{"x":6,"y":8,"color":"#b0b8bf"},{"x":7,"y":8,"color":"#b0b8bf"},{"x":8,"y":8,"color":"#b0b8bf"},{"x":9,"y":8,"color":"#b0b8bf"},{"x":10,"y":8,"color":"#b0b8bf"},{"x":11,"y":8,"color":"#b0b8bf"},{"x":12,"y":8,"color":"#b0b8bf"},{"x":13,"y":8,"color":"#b0b8bf"},{"x":14,"y":8,"color":"#b0b8bf"},{"x":15,"y":8,"color":"#b0b8bf"},{"x":16,"y":8,"color":"#b0b8bf"},{"x":17,"y":8,"color":"#b0b8bf"},{"x":18,"y":8,"color":"#7e8994"},{"x":19,"y":8,"color":"#7e8994"},{"x":20,"y":8,"color":"#b0b8bf"},{"x":21,"y":8,"color":"#b0b8bf"},{"x":22,"y":8,"color":"#171715"},{"x":23,"y":8,"color":"#171715"},{"x":4,"y":9,"color":"#171715"},{"x":5,"y":9,"color":"#171715"},{"x":6,"y":9,"color":"#b0b8bf"},{"x":7,"y":9,"color":"#b0b8bf"},{"x":8,"y":9,"color":"#b0b8bf"},{"x":9,"y":9,"color":"#b0b8bf"},{"x":10,"y":9,"color":"#b0b8bf"},{"x":11,"y":9,"color":"#b0b8bf"},{"x":12,"y":9,"color":"#b0b8bf"},{"x":13,"y":9,"color":"#b0b8bf"},{"x":14,"y":9,"color":"#b0b8bf"},{"x":15,"y":9,"color":"#b0b8bf"},{"x":16,"y":9,"color":"#b0b8bf"},{"x":17,"y":9,"color":"#b0b8bf"},{"x":18,"y":9,"color":"#7e8994"},{"x":19,"y":9,"color":"#7e8994"},{"x":20,"y":9,"color":"#b0b8bf"},{"x":21,"y":9,"color":"#b0b8bf"},{"x":22,"y":9,"color":"#171715"},{"x":23,"y":9,"color":"#171715"},{"x":4,"y":10,"color":"#171715"},{"x":5,"y":10,"color":"#171715"},{"x":6,"y":10,"color":"#b0b8bf"},{"x":7,"y":10,"color":"#b0b8bf"},{"x":8,"y":10,"color":"#322b27"},{"x":9,"y":10,"color":"#322b27"},{"x":10,"y":10,"color":"#b0b8bf"},{"x":11,"y":10,"color":"#b0b8bf"},{"x":12,"y":10,"color":"#b0b8bf"},{"x":13,"y":10,"color":"#b0b8bf"},{"x":14,"y":10,"color":"#322b27"},{"x":15,"y":10,"color":"#322b27"},{"x":16,"y":10,"color":"#b0b8bf"},{"x":17,"y":10,"color":"#b0b8bf"},{"x":18,"y":10,"color":"#b0b8bf"},{"x":19,"y":10,"color":"#b0b8bf"},{"x":20,"y":10,"color":"#b0b8bf"},{"x":21,"y":10,"color":"#b0b8bf"},{"x":22,"y":10,"color":"#171715"},{"x":23,"y":10,"color":"#171715"},{"x":4,"y":11,"color":"#171715"},{"x":5,"y":11,"color":"#171715"},{"x":6,"y":11,"color":"#b0b8bf"},{"x":7,"y":11,"color":"#b0b8bf"},{"x":8,"y":11,"color":"#322b27"},{"x":9,"y":11,"color":"#322b27"},{"x":10,"y":11,"color":"#b0b8bf"},{"x":11,"y":11,"color":"#b0b8bf"},{"x":12,"y":11,"color":"#b0b8bf"},{"x":13,"y":11,"color":"#b0b8bf"},{"x":14,"y":11,"color":"#322b27"},{"x":15,"y":11,"color":"#322b27"},{"x":16,"y":11,"color":"#b0b8bf"},{"x":17,"y":11,"color":"#b0b8bf"},{"x":18,"y":11,"color":"#b0b8bf"},{"x":19,"y":11,"color":"#b0b8bf"},{"x":20,"y":11,"color":"#b0b8bf"},{"x":21,"y":11,"color":"#b0b8bf"},{"x":22,"y":11,"color":"#171715"},{"x":23,"y":11,"color":"#171715"},{"x":4,"y":12,"color":"#171715"},{"x":5,"y":12,"color":"#171715"},{"x":6,"y":12,"color":"#b0b8bf"},{"x":7,"y":12,"color":"#b0b8bf"},{"x":8,"y":12,"color":"#fefefe"},{"x":9,"y":12,"color":"#fefefe"},{"x":10,"y":12,"color":"#cc776f"},{"x":11,"y":12,"color":"#cc776f"},{"x":12,"y":12,"color":"#fefefe"},{"x":13,"y":12,"color":"#fefefe"},{"x":14,"y":12,"color":"#b0b8bf"},{"x":15,"y":12,"color":"#b0b8bf"},{"x":16,"y":12,"color":"#b0b8bf"},{"x":17,"y":12,"color":"#b0b8bf"},{"x":18,"y":12,"color":"#b0b8bf"},{"x":19,"y":12,"color":"#b0b8bf"},{"x":20,"y":12,"color":"#b0b8bf"},{"x":21,"y":12,"color":"#b0b8bf"},{"x":22,"y":12,"color":"#171715"},{"x":23,"y":12,"color":"#171715"},{"x":4,"y":13,"color":"#171715"},{"x":5,"y":13,"color":"#171715"},{"x":6,"y":13,"color":"#b0b8bf"},{"x":7,"y":13,"color":"#b0b8bf"},{"x":8,"y":13,"color":"#fefefe"},{"x":9,"y":13,"color":"#fefefe"},{"x":10,"y":13,"color":"#cc776f"},{"x":11,"y":13,"color":"#cc776f"},{"x":12,"y":13,"color":"#fefefe"},{"x":13,"y":13,"color":"#fefefe"},{"x":14,"y":13,"color":"#b0b8bf"},{"x":15,"y":13,"color":"#b0b8bf"},{"x":16,"y":13,"color":"#b0b8bf"},{"x":17,"y":13,"color":"#b0b8bf"},{"x":18,"y":13,"color":"#b0b8bf"},{"x":19,"y":13,"color":"#b0b8bf"},{"x":20,"y":13,"color":"#b0b8bf"},{"x":21,"y":13,"color":"#b0b8bf"},{"x":22,"y":13,"color":"#171715"},{"x":23,"y":13,"color":"#171715"},{"x":6,"y":14,"color":"#171715"},{"x":7,"y":14,"color":"#171715"},{"x":8,"y":14,"color":"#171715"},{"x":9,"y":14,"color":"#171715"},{"x":10,"y":14,"color":"#171715"},{"x":11,"y":14,"color":"#171715"},{"x":12,"y":14,"color":"#171715"},{"x":13,"y":14,"color":"#171715"},{"x":14,"y":14,"color":"#171715"},{"x":15,"y":14,"color":"#171715"},{"x":16,"y":14,"color":"#171715"},{"x":17,"y":14,"color":"#171715"},{"x":18,"y":14,"color":"#b0b8bf"},{"x":19,"y":14,"color":"#b0b8bf"},{"x":20,"y":14,"color":"#b0b8bf"},{"x":21,"y":14,"color":"#b0b8bf"},{"x":22,"y":14,"color":"#171715"},{"x":23,"y":14,"color":"#171715"},{"x":6,"y":15,"color":"#171715"},{"x":7,"y":15,"color":"#171715"},{"x":8,"y":15,"color":"#171715"},{"x":9,"y":15,"color":"#171715"},{"x":10,"y":15,"color":"#171715"},{"x":11,"y":15,"color":"#171715"},{"x":12,"y":15,"color":"#171715"},{"x":13,"y":15,"color":"#171715"},{"x":14,"y":15,"color":"#171715"},{"x":15,"y":15,"color":"#171715"},{"x":16,"y":15,"color":"#171715"},{"x":17,"y":15,"color":"#171715"},{"x":18,"y":15,"color":"#b0b8bf"},{"x":19,"y":15,"color":"#b0b8bf"},{"x":20,"y":15,"color":"#b0b8bf"},{"x":21,"y":15,"color":"#b0b8bf"},{"x":22,"y":15,"color":"#171715"},{"x":23,"y":15,"color":"#171715"},{"x":6,"y":16,"color":"#171715"},{"x":7,"y":16,"color":"#171715"},{"x":8,"y":16,"color":"#b0b8bf"},{"x":9,"y":16,"color":"#b0b8bf"},{"x":10,"y":16,"color":"#171715"},{"x":11,"y":16,"color":"#171715"},{"x":12,"y":16,"color":"#b0b8bf"},{"x":13,"y":16,"color":"#b0b8bf"},{"x":14,"y":16,"color":"#b0b8bf"},{"x":15,"y":16,"color":"#b0b8bf"},{"x":16,"y":16,"color":"#171715"},{"x":17,"y":16,"color":"#171715"},{"x":18,"y":16,"color":"#b0b8bf"},{"x":19,"y":16,"color":"#b0b8bf"},{"x":20,"y":16,"color":"#b0b8bf"},{"x":21,"y":16,"color":"#b0b8bf"},{"x":22,"y":16,"color":"#171715"},{"x":23,"y":16,"color":"#171715"},{"x":6,"y":17,"color":"#171715"},{"x":7,"y":17,"color":"#171715"},{"x":8,"y":17,"color":"#b0b8bf"},{"x":9,"y":17,"color":"#b0b8bf"},{"x":10,"y":17,"color":"#171715"},{"x":11,"y":17,"color":"#171715"},{"x":12,"y":17,"color":"#b0b8bf"},{"x":13,"y":17,"color":"#b0b8bf"},{"x":14,"y":17,"color":"#b0b8bf"},{"x":15,"y":17,"color":"#b0b8bf"},{"x":16,"y":17,"color":"#171715"},{"x":17,"y":17,"color":"#171715"},{"x":18,"y":17,"color":"#b0b8bf"},{"x":19,"y":17,"color":"#b0b8bf"},{"x":20,"y":17,"color":"#b0b8bf"},{"x":21,"y":17,"color":"#b0b8bf"},{"x":22,"y":17,"color":"#171715"},{"x":23,"y":17,"color":"#171715"},{"x":6,"y":18,"color":"#171715"},{"x":7,"y":18,"color":"#171715"},{"x":8,"y":18,"color":"#171715"},{"x":9,"y":18,"color":"#171715"},{"x":10,"y":18,"color":"#171715"},{"x":11,"y":18,"color":"#171715"},{"x":12,"y":18,"color":"#171715"},{"x":13,"y":18,"color":"#171715"},{"x":14,"y":18,"color":"#171715"},{"x":15,"y":18,"color":"#171715"},{"x":16,"y":18,"color":"#171715"},{"x":17,"y":18,"color":"#171715"},{"x":18,"y":18,"color":"#4e5762"},{"x":19,"y":18,"color":"#4e5762"},{"x":20,"y":18,"color":"#4e5762"},{"x":21,"y":18,"color":"#4e5762"},{"x":22,"y":18,"color":"#171715"},{"x":23,"y":18,"color":"#171715"},{"x":6,"y":19,"color":"#171715"},{"x":7,"y":19,"color":"#171715"},{"x":8,"y":19,"color":"#171715"},{"x":9,"y":19,"color":"#171715"},{"x":10,"y":19,"color":"#171715"},{"x":11,"y":19,"color":"#171715"},{"x":12,"y":19,"color":"#171715"},{"x":13,"y":19,"color":"#171715"},{"x":14,"y":19,"color":"#171715"},{"x":15,"y":19,"color":"#171715"},{"x":16,"y":19,"color":"#171715"},{"x":17,"y":19,"color":"#171715"},{"x":18,"y":19,"color":"#4e5762"},{"x":19,"y":19,"color":"#4e5762"},{"x":20,"y":19,"color":"#4e5762"},{"x":21,"y":19,"color":"#4e5762"},{"x":22,"y":19,"color":"#171715"},{"x":23,"y":19,"color":"#171715"},{"x":8,"y":20,"color":"#171715"},{"x":9,"y":20,"color":"#171715"},{"x":10,"y":20,"color":"#b0b8bf"},{"x":11,"y":20,"color":"#b0b8bf"},{"x":12,"y":20,"color":"#b0b8bf"},{"x":13,"y":20,"color":"#b0b8bf"},{"x":14,"y":20,"color":"#b0b8bf"},{"x":15,"y":20,"color":"#b0b8bf"},{"x":16,"y":20,"color":"#b0b8bf"},{"x":17,"y":20,"color":"#b0b8bf"},{"x":18,"y":20,"color":"#b0b8bf"},{"x":19,"y":20,"color":"#b0b8bf"},{"x":20,"y":20,"color":"#b0b8bf"},{"x":21,"y":20,"color":"#b0b8bf"},{"x":22,"y":20,"color":"#171715"},{"x":23,"y":20,"color":"#171715"},{"x":26,"y":20,"color":"#171715"},{"x":27,"y":20,"color":"#171715"},{"x":8,"y":21,"color":"#171715"},{"x":9,"y":21,"color":"#171715"},{"x":10,"y":21,"color":"#b0b8bf"},{"x":11,"y":21,"color":"#b0b8bf"},{"x":12,"y":21,"color":"#b0b8bf"},{"x":13,"y":21,"color":"#b0b8bf"},{"x":14,"y":21,"color":"#b0b8bf"},{"x":15,"y":21,"color":"#b0b8bf"},{"x":16,"y":21,"color":"#b0b8bf"},{"x":17,"y":21,"color":"#b0b8bf"},{"x":18,"y":21,"color":"#b0b8bf"},{"x":19,"y":21,"color":"#b0b8bf"},{"x":20,"y":21,"color":"#b0b8bf"},{"x":21,"y":21,"color":"#b0b8bf"},{"x":22,"y":21,"color":"#171715"},{"x":23,"y":21,"color":"#171715"},{"x":26,"y":21,"color":"#171715"},{"x":27,"y":21,"color":"#171715"},{"x":8,"y":22,"color":"#171715"},{"x":9,"y":22,"color":"#171715"},{"x":10,"y":22,"color":"#b0b8bf"},{"x":11,"y":22,"color":"#b0b8bf"},{"x":12,"y":22,"color":"#b0b8bf"},{"x":13,"y":22,"color":"#b0b8bf"},{"x":14,"y":22,"color":"#b0b8bf"},{"x":15,"y":22,"color":"#b0b8bf"},{"x":16,"y":22,"color":"#b0b8bf"},{"x":17,"y":22,"color":"#b0b8bf"},{"x":18,"y":22,"color":"#b0b8bf"},{"x":19,"y":22,"color":"#b0b8bf"},{"x":20,"y":22,"color":"#b0b8bf"},{"x":21,"y":22,"color":"#b0b8bf"},{"x":22,"y":22,"color":"#b0b8bf"},{"x":23,"y":22,"color":"#b0b8bf"},{"x":24,"y":22,"color":"#171715"},{"x":25,"y":22,"color":"#171715"},{"x":26,"y":22,"color":"#b0b8bf"},{"x":27,"y":22,"color":"#b0b8bf"},{"x":28,"y":22,"color":"#171715"},{"x":29,"y":22,"color":"#171715"},{"x":8,"y":23,"color":"#171715"},{"x":9,"y":23,"color":"#171715"},{"x":10,"y":23,"color":"#b0b8bf"},{"x":11,"y":23,"color":"#b0b8bf"},{"x":12,"y":23,"color":"#b0b8bf"},{"x":13,"y":23,"color":"#b0b8bf"},{"x":14,"y":23,"color":"#b0b8bf"},{"x":15,"y":23,"color":"#b0b8bf"},{"x":16,"y":23,"color":"#b0b8bf"},{"x":17,"y":23,"color":"#b0b8bf"},{"x":18,"y":23,"color":"#b0b8bf"},{"x":19,"y":23,"color":"#b0b8bf"},{"x":20,"y":23,"color":"#b0b8bf"},{"x":21,"y":23,"color":"#b0b8bf"},{"x":22,"y":23,"color":"#b0b8bf"},{"x":23,"y":23,"color":"#b0b8bf"},{"x":24,"y":23,"color":"#171715"},{"x":25,"y":23,"color":"#171715"},{"x":26,"y":23,"color":"#b0b8bf"},{"x":27,"y":23,"color":"#b0b8bf"},{"x":28,"y":23,"color":"#171715"},{"x":29,"y":23,"color":"#171715"},{"x":8,"y":24,"color":"#171715"},{"x":9,"y":24,"color":"#171715"},{"x":10,"y":24,"color":"#b0b8bf"},{"x":11,"y":24,"color":"#b0b8bf"},{"x":12,"y":24,"color":"#b0b8bf"},{"x":13,"y":24,"color":"#b0b8bf"},{"x":14,"y":24,"color":"#b0b8bf"},{"x":15,"y":24,"color":"#b0b8bf"},{"x":16,"y":24,"color":"#4e5762"},{"x":17,"y":24,"color":"#4e5762"},{"x":18,"y":24,"color":"#4e5762"},{"x":19,"y":24,"color":"#4e5762"},{"x":20,"y":24,"color":"#4e5762"},{"x":21,"y":24,"color":"#4e5762"},{"x":22,"y":24,"color":"#4e5762"},{"x":23,"y":24,"color":"#4e5762"},{"x":24,"y":24,"color":"#b0b8bf"},{"x":25,"y":24,"color":"#b0b8bf"},{"x":26,"y":24,"color":"#b0b8bf"},{"x":27,"y":24,"color":"#b0b8bf"},{"x":28,"y":24,"color":"#171715"},{"x":29,"y":24,"color":"#171715"},{"x":8,"y":25,"color":"#171715"},{"x":9,"y":25,"color":"#171715"},{"x":10,"y":25,"color":"#b0b8bf"},{"x":11,"y":25,"color":"#b0b8bf"},{"x":12,"y":25,"color":"#b0b8bf"},{"x":13,"y":25,"color":"#b0b8bf"},{"x":14,"y":25,"color":"#b0b8bf"},{"x":15,"y":25,"color":"#b0b8bf"},{"x":16,"y":25,"color":"#4e5762"},{"x":17,"y":25,"color":"#4e5762"},{"x":18,"y":25,"color":"#4e5762"},{"x":19,"y":25,"color":"#4e5762"},{"x":20,"y":25,"color":"#4e5762"},{"x":21,"y":25,"color":"#4e5762"},{"x":22,"y":25,"color":"#4e5762"},{"x":23,"y":25,"color":"#4e5762"},{"x":24,"y":25,"color":"#b0b8bf"},{"x":25,"y":25,"color":"#b0b8bf"},{"x":26,"y":25,"color":"#b0b8bf"},{"x":27,"y":25,"color":"#b0b8bf"},{"x":28,"y":25,"color":"#171715"},{"x":29,"y":25,"color":"#171715"},{"x":8,"y":26,"color":"#171715"},{"x":9,"y":26,"color":"#171715"},{"x":10,"y":26,"color":"#b0b8bf"},{"x":11,"y":26,"color":"#b0b8bf"},{"x":12,"y":26,"color":"#171715"},{"x":13,"y":26,"color":"#171715"},{"x":14,"y":26,"color":"#171715"},{"x":15,"y":26,"color":"#171715"},{"x":16,"y":26,"color":"#b0b8bf"},{"x":17,"y":26,"color":"#b0b8bf"},{"x":18,"y":26,"color":"#b0b8bf"},{"x":19,"y":26,"color":"#b0b8bf"},{"x":20,"y":26,"color":"#171715"},{"x":21,"y":26,"color":"#171715"},{"x":22,"y":26,"color":"#171715"},{"x":23,"y":26,"color":"#171715"},{"x":24,"y":26,"color":"#171715"},{"x":25,"y":26,"color":"#171715"},{"x":26,"y":26,"color":"#171715"},{"x":27,"y":26,"color":"#171715"},{"x":8,"y":27,"color":"#171715"},{"x":9,"y":27,"color":"#171715"},{"x":10,"y":27,"color":"#b0b8bf"},{"x":11,"y":27,"color":"#b0b8bf"},{"x":12,"y":27,"color":"#171715"},{"x":13,"y":27,"color":"#171715"},{"x":14,"y":27,"color":"#171715"},{"x":15,"y":27,"color":"#171715"},{"x":16,"y":27,"color":"#b0b8bf"},{"x":17,"y":27,"color":"#b0b8bf"},{"x":18,"y":27,"color":"#b0b8bf"},{"x":19,"y":27,"color":"#b0b8bf"},{"x":20,"y":27,"color":"#171715"},{"x":21,"y":27,"color":"#171715"},{"x":22,"y":27,"color":"#171715"},{"x":23,"y":27,"color":"#171715"},{"x":24,"y":27,"color":"#171715"},{"x":25,"y":27,"color":"#171715"},{"x":26,"y":27,"color":"#171715"},{"x":27,"y":27,"color":"#171715"},{"x":8,"y":28,"color":"#171715"},{"x":9,"y":28,"color":"#171715"},{"x":10,"y":28,"color":"#171715"},{"x":11,"y":28,"color":"#171715"},{"x":16,"y":28,"color":"#171715"},{"x":17,"y":28,"color":"#171715"},{"x":18,"y":28,"color":"#171715"},{"x":19,"y":28,"color":"#171715"},{"x":8,"y":29,"color":"#171715"},{"x":9,"y":29,"color":"#171715"},{"x":10,"y":29,"color":"#171715"},{"x":11,"y":29,"color":"#171715"},{"x":16,"y":29,"color":"#171715"},{"x":17,"y":29,"color":"#171715"},{"x":18,"y":29,"color":"#171715"},{"x":19,"y":29,"color":"#171715"}]},{"name":"Cat / MACKEREL / ROPE TURNER / Hands down / Preview \u00d716","pixels":[{"x":6,"y":4,"color":"#171715"},{"x":7,"y":4,"color":"#171715"},{"x":8,"y":4,"color":"#171715"},{"x":9,"y":4,"color":"#171715"},{"x":18,"y":4,"color":"#171715"},{"x":19,"y":4,"color":"#171715"},{"x":20,"y":4,"color":"#171715"},{"x":21,"y":4,"color":"#171715"},{"x":6,"y":5,"color":"#171715"},{"x":7,"y":5,"color":"#171715"},{"x":8,"y":5,"color":"#171715"},{"x":9,"y":5,"color":"#171715"},{"x":18,"y":5,"color":"#171715"},{"x":19,"y":5,"color":"#171715"},{"x":20,"y":5,"color":"#171715"},{"x":21,"y":5,"color":"#171715"},{"x":6,"y":6,"color":"#171715"},{"x":7,"y":6,"color":"#171715"},{"x":8,"y":6,"color":"#7e8994"},{"x":9,"y":6,"color":"#7e8994"},{"x":10,"y":6,"color":"#171715"},{"x":11,"y":6,"color":"#171715"},{"x":16,"y":6,"color":"#171715"},{"x":17,"y":6,"color":"#171715"},{"x":18,"y":6,"color":"#b0b8bf"},{"x":19,"y":6,"color":"#b0b8bf"},{"x":20,"y":6,"color":"#171715"},{"x":21,"y":6,"color":"#171715"},{"x":6,"y":7,"color":"#171715"},{"x":7,"y":7,"color":"#171715"},{"x":8,"y":7,"color":"#7e8994"},{"x":9,"y":7,"color":"#7e8994"},{"x":10,"y":7,"color":"#171715"},{"x":11,"y":7,"color":"#171715"},{"x":16,"y":7,"color":"#171715"},{"x":17,"y":7,"color":"#171715"},{"x":18,"y":7,"color":"#b0b8bf"},{"x":19,"y":7,"color":"#b0b8bf"},{"x":20,"y":7,"color":"#171715"},{"x":21,"y":7,"color":"#171715"},{"x":6,"y":8,"color":"#171715"},{"x":7,"y":8,"color":"#171715"},{"x":8,"y":8,"color":"#d88c70"},{"x":9,"y":8,"color":"#d88c70"},{"x":10,"y":8,"color":"#7e8994"},{"x":11,"y":8,"color":"#7e8994"},{"x":12,"y":8,"color":"#171715"},{"x":13,"y":8,"color":"#171715"},{"x":14,"y":8,"color":"#171715"},{"x":15,"y":8,"color":"#171715"},{"x":16,"y":8,"color":"#b0b8bf"},{"x":17,"y":8,"color":"#b0b8bf"},{"x":18,"y":8,"color":"#d88c70"},{"x":19,"y":8,"color":"#d88c70"},{"x":20,"y":8,"color":"#171715"},{"x":21,"y":8,"color":"#171715"},{"x":6,"y":9,"color":"#171715"},{"x":7,"y":9,"color":"#171715"},{"x":8,"y":9,"color":"#d88c70"},{"x":9,"y":9,"color":"#d88c70"},{"x":10,"y":9,"color":"#7e8994"},{"x":11,"y":9,"color":"#7e8994"},{"x":12,"y":9,"color":"#171715"},{"x":13,"y":9,"color":"#171715"},{"x":14,"y":9,"color":"#171715"},{"x":15,"y":9,"color":"#171715"},{"x":16,"y":9,"color":"#b0b8bf"},{"x":17,"y":9,"color":"#b0b8bf"},{"x":18,"y":9,"color":"#d88c70"},{"x":19,"y":9,"color":"#d88c70"},{"x":20,"y":9,"color":"#171715"},{"x":21,"y":9,"color":"#171715"},{"x":4,"y":10,"color":"#171715"},{"x":5,"y":10,"color":"#171715"},{"x":6,"y":10,"color":"#b0b8bf"},{"x":7,"y":10,"color":"#b0b8bf"},{"x":8,"y":10,"color":"#b0b8bf"},{"x":9,"y":10,"color":"#b0b8bf"},{"x":10,"y":10,"color":"#b0b8bf"},{"x":11,"y":10,"color":"#b0b8bf"},{"x":12,"y":10,"color":"#b0b8bf"},{"x":13,"y":10,"color":"#b0b8bf"},{"x":14,"y":10,"color":"#b0b8bf"},{"x":15,"y":10,"color":"#b0b8bf"},{"x":16,"y":10,"color":"#b0b8bf"},{"x":17,"y":10,"color":"#b0b8bf"},{"x":18,"y":10,"color":"#7e8994"},{"x":19,"y":10,"color":"#7e8994"},{"x":20,"y":10,"color":"#b0b8bf"},{"x":21,"y":10,"color":"#b0b8bf"},{"x":22,"y":10,"color":"#171715"},{"x":23,"y":10,"color":"#171715"},{"x":4,"y":11,"color":"#171715"},{"x":5,"y":11,"color":"#171715"},{"x":6,"y":11,"color":"#b0b8bf"},{"x":7,"y":11,"color":"#b0b8bf"},{"x":8,"y":11,"color":"#b0b8bf"},{"x":9,"y":11,"color":"#b0b8bf"},{"x":10,"y":11,"color":"#b0b8bf"},{"x":11,"y":11,"color":"#b0b8bf"},{"x":12,"y":11,"color":"#b0b8bf"},{"x":13,"y":11,"color":"#b0b8bf"},{"x":14,"y":11,"color":"#b0b8bf"},{"x":15,"y":11,"color":"#b0b8bf"},{"x":16,"y":11,"color":"#b0b8bf"},{"x":17,"y":11,"color":"#b0b8bf"},{"x":18,"y":11,"color":"#7e8994"},{"x":19,"y":11,"color":"#7e8994"},{"x":20,"y":11,"color":"#b0b8bf"},{"x":21,"y":11,"color":"#b0b8bf"},{"x":22,"y":11,"color":"#171715"},{"x":23,"y":11,"color":"#171715"},{"x":4,"y":12,"color":"#171715"},{"x":5,"y":12,"color":"#171715"},{"x":6,"y":12,"color":"#b0b8bf"},{"x":7,"y":12,"color":"#b0b8bf"},{"x":8,"y":12,"color":"#322b27"},{"x":9,"y":12,"color":"#322b27"},{"x":10,"y":12,"color":"#b0b8bf"},{"x":11,"y":12,"color":"#b0b8bf"},{"x":12,"y":12,"color":"#b0b8bf"},{"x":13,"y":12,"color":"#b0b8bf"},{"x":14,"y":12,"color":"#322b27"},{"x":15,"y":12,"color":"#322b27"},{"x":16,"y":12,"color":"#b0b8bf"},{"x":17,"y":12,"color":"#b0b8bf"},{"x":18,"y":12,"color":"#b0b8bf"},{"x":19,"y":12,"color":"#b0b8bf"},{"x":20,"y":12,"color":"#b0b8bf"},{"x":21,"y":12,"color":"#b0b8bf"},{"x":22,"y":12,"color":"#171715"},{"x":23,"y":12,"color":"#171715"},{"x":4,"y":13,"color":"#171715"},{"x":5,"y":13,"color":"#171715"},{"x":6,"y":13,"color":"#b0b8bf"},{"x":7,"y":13,"color":"#b0b8bf"},{"x":8,"y":13,"color":"#322b27"},{"x":9,"y":13,"color":"#322b27"},{"x":10,"y":13,"color":"#b0b8bf"},{"x":11,"y":13,"color":"#b0b8bf"},{"x":12,"y":13,"color":"#b0b8bf"},{"x":13,"y":13,"color":"#b0b8bf"},{"x":14,"y":13,"color":"#322b27"},{"x":15,"y":13,"color":"#322b27"},{"x":16,"y":13,"color":"#b0b8bf"},{"x":17,"y":13,"color":"#b0b8bf"},{"x":18,"y":13,"color":"#b0b8bf"},{"x":19,"y":13,"color":"#b0b8bf"},{"x":20,"y":13,"color":"#b0b8bf"},{"x":21,"y":13,"color":"#b0b8bf"},{"x":22,"y":13,"color":"#171715"},{"x":23,"y":13,"color":"#171715"},{"x":4,"y":14,"color":"#171715"},{"x":5,"y":14,"color":"#171715"},{"x":6,"y":14,"color":"#b0b8bf"},{"x":7,"y":14,"color":"#b0b8bf"},{"x":8,"y":14,"color":"#fefefe"},{"x":9,"y":14,"color":"#fefefe"},{"x":10,"y":14,"color":"#cc776f"},{"x":11,"y":14,"color":"#cc776f"},{"x":12,"y":14,"color":"#fefefe"},{"x":13,"y":14,"color":"#fefefe"},{"x":14,"y":14,"color":"#b0b8bf"},{"x":15,"y":14,"color":"#b0b8bf"},{"x":16,"y":14,"color":"#b0b8bf"},{"x":17,"y":14,"color":"#b0b8bf"},{"x":18,"y":14,"color":"#b0b8bf"},{"x":19,"y":14,"color":"#b0b8bf"},{"x":20,"y":14,"color":"#b0b8bf"},{"x":21,"y":14,"color":"#b0b8bf"},{"x":22,"y":14,"color":"#171715"},{"x":23,"y":14,"color":"#171715"},{"x":4,"y":15,"color":"#171715"},{"x":5,"y":15,"color":"#171715"},{"x":6,"y":15,"color":"#b0b8bf"},{"x":7,"y":15,"color":"#b0b8bf"},{"x":8,"y":15,"color":"#fefefe"},{"x":9,"y":15,"color":"#fefefe"},{"x":10,"y":15,"color":"#cc776f"},{"x":11,"y":15,"color":"#cc776f"},{"x":12,"y":15,"color":"#fefefe"},{"x":13,"y":15,"color":"#fefefe"},{"x":14,"y":15,"color":"#b0b8bf"},{"x":15,"y":15,"color":"#b0b8bf"},{"x":16,"y":15,"color":"#b0b8bf"},{"x":17,"y":15,"color":"#b0b8bf"},{"x":18,"y":15,"color":"#b0b8bf"},{"x":19,"y":15,"color":"#b0b8bf"},{"x":20,"y":15,"color":"#b0b8bf"},{"x":21,"y":15,"color":"#b0b8bf"},{"x":22,"y":15,"color":"#171715"},{"x":23,"y":15,"color":"#171715"},{"x":6,"y":16,"color":"#171715"},{"x":7,"y":16,"color":"#171715"},{"x":8,"y":16,"color":"#fefefe"},{"x":9,"y":16,"color":"#fefefe"},{"x":10,"y":16,"color":"#fefefe"},{"x":11,"y":16,"color":"#fefefe"},{"x":12,"y":16,"color":"#fefefe"},{"x":13,"y":16,"color":"#fefefe"},{"x":14,"y":16,"color":"#fefefe"},{"x":15,"y":16,"color":"#fefefe"},{"x":16,"y":16,"color":"#b0b8bf"},{"x":17,"y":16,"color":"#b0b8bf"},{"x":18,"y":16,"color":"#b0b8bf"},{"x":19,"y":16,"color":"#b0b8bf"},{"x":20,"y":16,"color":"#b0b8bf"},{"x":21,"y":16,"color":"#b0b8bf"},{"x":22,"y":16,"color":"#171715"},{"x":23,"y":16,"color":"#171715"},{"x":6,"y":17,"color":"#171715"},{"x":7,"y":17,"color":"#171715"},{"x":8,"y":17,"color":"#fefefe"},{"x":9,"y":17,"color":"#fefefe"},{"x":10,"y":17,"color":"#fefefe"},{"x":11,"y":17,"color":"#fefefe"},{"x":12,"y":17,"color":"#fefefe"},{"x":13,"y":17,"color":"#fefefe"},{"x":14,"y":17,"color":"#fefefe"},{"x":15,"y":17,"color":"#fefefe"},{"x":16,"y":17,"color":"#b0b8bf"},{"x":17,"y":17,"color":"#b0b8bf"},{"x":18,"y":17,"color":"#b0b8bf"},{"x":19,"y":17,"color":"#b0b8bf"},{"x":20,"y":17,"color":"#b0b8bf"},{"x":21,"y":17,"color":"#b0b8bf"},{"x":22,"y":17,"color":"#171715"},{"x":23,"y":17,"color":"#171715"},{"x":6,"y":18,"color":"#171715"},{"x":7,"y":18,"color":"#171715"},{"x":8,"y":18,"color":"#171715"},{"x":9,"y":18,"color":"#171715"},{"x":10,"y":18,"color":"#171715"},{"x":11,"y":18,"color":"#171715"},{"x":12,"y":18,"color":"#171715"},{"x":13,"y":18,"color":"#171715"},{"x":14,"y":18,"color":"#171715"},{"x":15,"y":18,"color":"#171715"},{"x":16,"y":18,"color":"#171715"},{"x":17,"y":18,"color":"#171715"},{"x":18,"y":18,"color":"#4e5762"},{"x":19,"y":18,"color":"#4e5762"},{"x":20,"y":18,"color":"#4e5762"},{"x":21,"y":18,"color":"#4e5762"},{"x":22,"y":18,"color":"#171715"},{"x":23,"y":18,"color":"#171715"},{"x":6,"y":19,"color":"#171715"},{"x":7,"y":19,"color":"#171715"},{"x":8,"y":19,"color":"#171715"},{"x":9,"y":19,"color":"#171715"},{"x":10,"y":19,"color":"#171715"},{"x":11,"y":19,"color":"#171715"},{"x":12,"y":19,"color":"#171715"},{"x":13,"y":19,"color":"#171715"},{"x":14,"y":19,"color":"#171715"},{"x":15,"y":19,"color":"#171715"},{"x":16,"y":19,"color":"#171715"},{"x":17,"y":19,"color":"#171715"},{"x":18,"y":19,"color":"#4e5762"},{"x":19,"y":19,"color":"#4e5762"},{"x":20,"y":19,"color":"#4e5762"},{"x":21,"y":19,"color":"#4e5762"},{"x":22,"y":19,"color":"#171715"},{"x":23,"y":19,"color":"#171715"},{"x":6,"y":20,"color":"#171715"},{"x":7,"y":20,"color":"#171715"},{"x":8,"y":20,"color":"#b0b8bf"},{"x":9,"y":20,"color":"#b0b8bf"},{"x":10,"y":20,"color":"#171715"},{"x":11,"y":20,"color":"#171715"},{"x":12,"y":20,"color":"#b0b8bf"},{"x":13,"y":20,"color":"#b0b8bf"},{"x":14,"y":20,"color":"#b0b8bf"},{"x":15,"y":20,"color":"#b0b8bf"},{"x":16,"y":20,"color":"#171715"},{"x":17,"y":20,"color":"#171715"},{"x":18,"y":20,"color":"#b0b8bf"},{"x":19,"y":20,"color":"#b0b8bf"},{"x":20,"y":20,"color":"#b0b8bf"},{"x":21,"y":20,"color":"#b0b8bf"},{"x":22,"y":20,"color":"#171715"},{"x":23,"y":20,"color":"#171715"},{"x":26,"y":20,"color":"#171715"},{"x":27,"y":20,"color":"#171715"},{"x":6,"y":21,"color":"#171715"},{"x":7,"y":21,"color":"#171715"},{"x":8,"y":21,"color":"#b0b8bf"},{"x":9,"y":21,"color":"#b0b8bf"},{"x":10,"y":21,"color":"#171715"},{"x":11,"y":21,"color":"#171715"},{"x":12,"y":21,"color":"#b0b8bf"},{"x":13,"y":21,"color":"#b0b8bf"},{"x":14,"y":21,"color":"#b0b8bf"},{"x":15,"y":21,"color":"#b0b8bf"},{"x":16,"y":21,"color":"#171715"},{"x":17,"y":21,"color":"#171715"},{"x":18,"y":21,"color":"#b0b8bf"},{"x":19,"y":21,"color":"#b0b8bf"},{"x":20,"y":21,"color":"#b0b8bf"},{"x":21,"y":21,"color":"#b0b8bf"},{"x":22,"y":21,"color":"#171715"},{"x":23,"y":21,"color":"#171715"},{"x":26,"y":21,"color":"#171715"},{"x":27,"y":21,"color":"#171715"},{"x":6,"y":22,"color":"#171715"},{"x":7,"y":22,"color":"#171715"},{"x":8,"y":22,"color":"#171715"},{"x":9,"y":22,"color":"#171715"},{"x":10,"y":22,"color":"#171715"},{"x":11,"y":22,"color":"#171715"},{"x":12,"y":22,"color":"#171715"},{"x":13,"y":22,"color":"#171715"},{"x":14,"y":22,"color":"#171715"},{"x":15,"y":22,"color":"#171715"},{"x":16,"y":22,"color":"#171715"},{"x":17,"y":22,"color":"#171715"},{"x":18,"y":22,"color":"#b0b8bf"},{"x":19,"y":22,"color":"#b0b8bf"},{"x":20,"y":22,"color":"#b0b8bf"},{"x":21,"y":22,"color":"#b0b8bf"},{"x":22,"y":22,"color":"#b0b8bf"},{"x":23,"y":22,"color":"#b0b8bf"},{"x":24,"y":22,"color":"#171715"},{"x":25,"y":22,"color":"#171715"},{"x":26,"y":22,"color":"#b0b8bf"},{"x":27,"y":22,"color":"#b0b8bf"},{"x":28,"y":22,"color":"#171715"},{"x":29,"y":22,"color":"#171715"},{"x":6,"y":23,"color":"#171715"},{"x":7,"y":23,"color":"#171715"},{"x":8,"y":23,"color":"#171715"},{"x":9,"y":23,"color":"#171715"},{"x":10,"y":23,"color":"#171715"},{"x":11,"y":23,"color":"#171715"},{"x":12,"y":23,"color":"#171715"},{"x":13,"y":23,"color":"#171715"},{"x":14,"y":23,"color":"#171715"},{"x":15,"y":23,"color":"#171715"},{"x":16,"y":23,"color":"#171715"},{"x":17,"y":23,"color":"#171715"},{"x":18,"y":23,"color":"#b0b8bf"},{"x":19,"y":23,"color":"#b0b8bf"},{"x":20,"y":23,"color":"#b0b8bf"},{"x":21,"y":23,"color":"#b0b8bf"},{"x":22,"y":23,"color":"#b0b8bf"},{"x":23,"y":23,"color":"#b0b8bf"},{"x":24,"y":23,"color":"#171715"},{"x":25,"y":23,"color":"#171715"},{"x":26,"y":23,"color":"#b0b8bf"},{"x":27,"y":23,"color":"#b0b8bf"},{"x":28,"y":23,"color":"#171715"},{"x":29,"y":23,"color":"#171715"},{"x":8,"y":24,"color":"#171715"},{"x":9,"y":24,"color":"#171715"},{"x":10,"y":24,"color":"#b0b8bf"},{"x":11,"y":24,"color":"#b0b8bf"},{"x":12,"y":24,"color":"#b0b8bf"},{"x":13,"y":24,"color":"#b0b8bf"},{"x":14,"y":24,"color":"#b0b8bf"},{"x":15,"y":24,"color":"#b0b8bf"},{"x":16,"y":24,"color":"#4e5762"},{"x":17,"y":24,"color":"#4e5762"},{"x":18,"y":24,"color":"#4e5762"},{"x":19,"y":24,"color":"#4e5762"},{"x":20,"y":24,"color":"#4e5762"},{"x":21,"y":24,"color":"#4e5762"},{"x":22,"y":24,"color":"#4e5762"},{"x":23,"y":24,"color":"#4e5762"},{"x":24,"y":24,"color":"#b0b8bf"},{"x":25,"y":24,"color":"#b0b8bf"},{"x":26,"y":24,"color":"#b0b8bf"},{"x":27,"y":24,"color":"#b0b8bf"},{"x":28,"y":24,"color":"#171715"},{"x":29,"y":24,"color":"#171715"},{"x":8,"y":25,"color":"#171715"},{"x":9,"y":25,"color":"#171715"},{"x":10,"y":25,"color":"#b0b8bf"},{"x":11,"y":25,"color":"#b0b8bf"},{"x":12,"y":25,"color":"#b0b8bf"},{"x":13,"y":25,"color":"#b0b8bf"},{"x":14,"y":25,"color":"#b0b8bf"},{"x":15,"y":25,"color":"#b0b8bf"},{"x":16,"y":25,"color":"#4e5762"},{"x":17,"y":25,"color":"#4e5762"},{"x":18,"y":25,"color":"#4e5762"},{"x":19,"y":25,"color":"#4e5762"},{"x":20,"y":25,"color":"#4e5762"},{"x":21,"y":25,"color":"#4e5762"},{"x":22,"y":25,"color":"#4e5762"},{"x":23,"y":25,"color":"#4e5762"},{"x":24,"y":25,"color":"#b0b8bf"},{"x":25,"y":25,"color":"#b0b8bf"},{"x":26,"y":25,"color":"#b0b8bf"},{"x":27,"y":25,"color":"#b0b8bf"},{"x":28,"y":25,"color":"#171715"},{"x":29,"y":25,"color":"#171715"},{"x":8,"y":26,"color":"#171715"},{"x":9,"y":26,"color":"#171715"},{"x":10,"y":26,"color":"#b0b8bf"},{"x":11,"y":26,"color":"#b0b8bf"},{"x":12,"y":26,"color":"#171715"},{"x":13,"y":26,"color":"#171715"},{"x":14,"y":26,"color":"#171715"},{"x":15,"y":26,"color":"#171715"},{"x":16,"y":26,"color":"#b0b8bf"},{"x":17,"y":26,"color":"#b0b8bf"},{"x":18,"y":26,"color":"#b0b8bf"},{"x":19,"y":26,"color":"#b0b8bf"},{"x":20,"y":26,"color":"#171715"},{"x":21,"y":26,"color":"#171715"},{"x":22,"y":26,"color":"#171715"},{"x":23,"y":26,"color":"#171715"},{"x":24,"y":26,"color":"#171715"},{"x":25,"y":26,"color":"#171715"},{"x":26,"y":26,"color":"#171715"},{"x":27,"y":26,"color":"#171715"},{"x":8,"y":27,"color":"#171715"},{"x":9,"y":27,"color":"#171715"},{"x":10,"y":27,"color":"#b0b8bf"},{"x":11,"y":27,"color":"#b0b8bf"},{"x":12,"y":27,"color":"#171715"},{"x":13,"y":27,"color":"#171715"},{"x":14,"y":27,"color":"#171715"},{"x":15,"y":27,"color":"#171715"},{"x":16,"y":27,"color":"#b0b8bf"},{"x":17,"y":27,"color":"#b0b8bf"},{"x":18,"y":27,"color":"#b0b8bf"},{"x":19,"y":27,"color":"#b0b8bf"},{"x":20,"y":27,"color":"#171715"},{"x":21,"y":27,"color":"#171715"},{"x":22,"y":27,"color":"#171715"},{"x":23,"y":27,"color":"#171715"},{"x":24,"y":27,"color":"#171715"},{"x":25,"y":27,"color":"#171715"},{"x":26,"y":27,"color":"#171715"},{"x":27,"y":27,"color":"#171715"},{"x":8,"y":28,"color":"#171715"},{"x":9,"y":28,"color":"#171715"},{"x":10,"y":28,"color":"#171715"},{"x":11,"y":28,"color":"#171715"},{"x":16,"y":28,"color":"#171715"},{"x":17,"y":28,"color":"#171715"},{"x":18,"y":28,"color":"#171715"},{"x":19,"y":28,"color":"#171715"},{"x":8,"y":29,"color":"#171715"},{"x":9,"y":29,"color":"#171715"},{"x":10,"y":29,"color":"#171715"},{"x":11,"y":29,"color":"#171715"},{"x":16,"y":29,"color":"#171715"},{"x":17,"y":29,"color":"#171715"},{"x":18,"y":29,"color":"#171715"},{"x":19,"y":29,"color":"#171715"}]},{"name":"Cat / CALICO / ROPE TURNER / Hands up / Preview \u00d716","pixels":[{"x":6,"y":2,"color":"#171715"},{"x":7,"y":2,"color":"#171715"},{"x":8,"y":2,"color":"#171715"},{"x":9,"y":2,"color":"#171715"},{"x":18,"y":2,"color":"#171715"},{"x":19,"y":2,"color":"#171715"},{"x":20,"y":2,"color":"#171715"},{"x":21,"y":2,"color":"#171715"},{"x":6,"y":3,"color":"#171715"},{"x":7,"y":3,"color":"#171715"},{"x":8,"y":3,"color":"#171715"},{"x":9,"y":3,"color":"#171715"},{"x":18,"y":3,"color":"#171715"},{"x":19,"y":3,"color":"#171715"},{"x":20,"y":3,"color":"#171715"},{"x":21,"y":3,"color":"#171715"},{"x":6,"y":4,"color":"#171715"},{"x":7,"y":4,"color":"#171715"},{"x":8,"y":4,"color":"#b25f2c"},{"x":9,"y":4,"color":"#b25f2c"},{"x":10,"y":4,"color":"#171715"},{"x":11,"y":4,"color":"#171715"},{"x":16,"y":4,"color":"#171715"},{"x":17,"y":4,"color":"#171715"},{"x":18,"y":4,"color":"#efe9d8"},{"x":19,"y":4,"color":"#efe9d8"},{"x":20,"y":4,"color":"#171715"},{"x":21,"y":4,"color":"#171715"},{"x":6,"y":5,"color":"#171715"},{"x":7,"y":5,"color":"#171715"},{"x":8,"y":5,"color":"#b25f2c"},{"x":9,"y":5,"color":"#b25f2c"},{"x":10,"y":5,"color":"#171715"},{"x":11,"y":5,"color":"#171715"},{"x":16,"y":5,"color":"#171715"},{"x":17,"y":5,"color":"#171715"},{"x":18,"y":5,"color":"#efe9d8"},{"x":19,"y":5,"color":"#efe9d8"},{"x":20,"y":5,"color":"#171715"},{"x":21,"y":5,"color":"#171715"},{"x":6,"y":6,"color":"#171715"},{"x":7,"y":6,"color":"#171715"},{"x":8,"y":6,"color":"#d88c70"},{"x":9,"y":6,"color":"#d88c70"},{"x":10,"y":6,"color":"#623317"},{"x":11,"y":6,"color":"#623317"},{"x":12,"y":6,"color":"#171715"},{"x":13,"y":6,"color":"#171715"},{"x":14,"y":6,"color":"#171715"},{"x":15,"y":6,"color":"#171715"},{"x":16,"y":6,"color":"#efe9d8"},{"x":17,"y":6,"color":"#efe9d8"},{"x":18,"y":6,"color":"#d88c70"},{"x":19,"y":6,"color":"#d88c70"},{"x":20,"y":6,"color":"#171715"},{"x":21,"y":6,"color":"#171715"},{"x":6,"y":7,"color":"#171715"},{"x":7,"y":7,"color":"#171715"},{"x":8,"y":7,"color":"#d88c70"},{"x":9,"y":7,"color":"#d88c70"},{"x":10,"y":7,"color":"#623317"},{"x":11,"y":7,"color":"#623317"},{"x":12,"y":7,"color":"#171715"},{"x":13,"y":7,"color":"#171715"},{"x":14,"y":7,"color":"#171715"},{"x":15,"y":7,"color":"#171715"},{"x":16,"y":7,"color":"#efe9d8"},{"x":17,"y":7,"color":"#efe9d8"},{"x":18,"y":7,"color":"#d88c70"},{"x":19,"y":7,"color":"#d88c70"},{"x":20,"y":7,"color":"#171715"},{"x":21,"y":7,"color":"#171715"},{"x":4,"y":8,"color":"#171715"},{"x":5,"y":8,"color":"#171715"},{"x":6,"y":8,"color":"#d58142"},{"x":7,"y":8,"color":"#d58142"},{"x":8,"y":8,"color":"#d58142"},{"x":9,"y":8,"color":"#d58142"},{"x":10,"y":8,"color":"#d58142"},{"x":11,"y":8,"color":"#d58142"},{"x":12,"y":8,"color":"#d58142"},{"x":13,"y":8,"color":"#d58142"},{"x":14,"y":8,"color":"#efe9d8"},{"x":15,"y":8,"color":"#efe9d8"},{"x":16,"y":8,"color":"#efe9d8"},{"x":17,"y":8,"color":"#efe9d8"},{"x":18,"y":8,"color":"#cfc7b4"},{"x":19,"y":8,"color":"#cfc7b4"},{"x":20,"y":8,"color":"#efe9d8"},{"x":21,"y":8,"color":"#efe9d8"},{"x":22,"y":8,"color":"#171715"},{"x":23,"y":8,"color":"#171715"},{"x":4,"y":9,"color":"#171715"},{"x":5,"y":9,"color":"#171715"},{"x":6,"y":9,"color":"#d58142"},{"x":7,"y":9,"color":"#d58142"},{"x":8,"y":9,"color":"#d58142"},{"x":9,"y":9,"color":"#d58142"},{"x":10,"y":9,"color":"#d58142"},{"x":11,"y":9,"color":"#d58142"},{"x":12,"y":9,"color":"#d58142"},{"x":13,"y":9,"color":"#d58142"},{"x":14,"y":9,"color":"#efe9d8"},{"x":15,"y":9,"color":"#efe9d8"},{"x":16,"y":9,"color":"#efe9d8"},{"x":17,"y":9,"color":"#efe9d8"},{"x":18,"y":9,"color":"#cfc7b4"},{"x":19,"y":9,"color":"#cfc7b4"},{"x":20,"y":9,"color":"#efe9d8"},{"x":21,"y":9,"color":"#efe9d8"},{"x":22,"y":9,"color":"#171715"},{"x":23,"y":9,"color":"#171715"},{"x":4,"y":10,"color":"#171715"},{"x":5,"y":10,"color":"#171715"},{"x":6,"y":10,"color":"#efe9d8"},{"x":7,"y":10,"color":"#efe9d8"},{"x":8,"y":10,"color":"#623317"},{"x":9,"y":10,"color":"#623317"},{"x":10,"y":10,"color":"#efe9d8"},{"x":11,"y":10,"color":"#efe9d8"},{"x":12,"y":10,"color":"#efe9d8"},{"x":13,"y":10,"color":"#efe9d8"},{"x":14,"y":10,"color":"#623317"},{"x":15,"y":10,"color":"#623317"},{"x":16,"y":10,"color":"#efe9d8"},{"x":17,"y":10,"color":"#efe9d8"},{"x":18,"y":10,"color":"#efe9d8"},{"x":19,"y":10,"color":"#efe9d8"},{"x":20,"y":10,"color":"#efe9d8"},{"x":21,"y":10,"color":"#efe9d8"},{"x":22,"y":10,"color":"#171715"},{"x":23,"y":10,"color":"#171715"},{"x":4,"y":11,"color":"#171715"},{"x":5,"y":11,"color":"#171715"},{"x":6,"y":11,"color":"#efe9d8"},{"x":7,"y":11,"color":"#efe9d8"},{"x":8,"y":11,"color":"#623317"},{"x":9,"y":11,"color":"#623317"},{"x":10,"y":11,"color":"#efe9d8"},{"x":11,"y":11,"color":"#efe9d8"},{"x":12,"y":11,"color":"#efe9d8"},{"x":13,"y":11,"color":"#efe9d8"},{"x":14,"y":11,"color":"#623317"},{"x":15,"y":11,"color":"#623317"},{"x":16,"y":11,"color":"#efe9d8"},{"x":17,"y":11,"color":"#efe9d8"},{"x":18,"y":11,"color":"#efe9d8"},{"x":19,"y":11,"color":"#efe9d8"},{"x":20,"y":11,"color":"#efe9d8"},{"x":21,"y":11,"color":"#efe9d8"},{"x":22,"y":11,"color":"#171715"},{"x":23,"y":11,"color":"#171715"},{"x":4,"y":12,"color":"#171715"},{"x":5,"y":12,"color":"#171715"},{"x":6,"y":12,"color":"#efe9d8"},{"x":7,"y":12,"color":"#efe9d8"},{"x":8,"y":12,"color":"#fefefe"},{"x":9,"y":12,"color":"#fefefe"},{"x":10,"y":12,"color":"#cc776f"},{"x":11,"y":12,"color":"#cc776f"},{"x":12,"y":12,"color":"#fefefe"},{"x":13,"y":12,"color":"#fefefe"},{"x":14,"y":12,"color":"#efe9d8"},{"x":15,"y":12,"color":"#efe9d8"},{"x":16,"y":12,"color":"#efe9d8"},{"x":17,"y":12,"color":"#efe9d8"},{"x":18,"y":12,"color":"#efe9d8"},{"x":19,"y":12,"color":"#efe9d8"},{"x":20,"y":12,"color":"#efe9d8"},{"x":21,"y":12,"color":"#efe9d8"},{"x":22,"y":12,"color":"#171715"},{"x":23,"y":12,"color":"#171715"},{"x":4,"y":13,"color":"#171715"},{"x":5,"y":13,"color":"#171715"},{"x":6,"y":13,"color":"#efe9d8"},{"x":7,"y":13,"color":"#efe9d8"},{"x":8,"y":13,"color":"#fefefe"},{"x":9,"y":13,"color":"#fefefe"},{"x":10,"y":13,"color":"#cc776f"},{"x":11,"y":13,"color":"#cc776f"},{"x":12,"y":13,"color":"#fefefe"},{"x":13,"y":13,"color":"#fefefe"},{"x":14,"y":13,"color":"#efe9d8"},{"x":15,"y":13,"color":"#efe9d8"},{"x":16,"y":13,"color":"#efe9d8"},{"x":17,"y":13,"color":"#efe9d8"},{"x":18,"y":13,"color":"#efe9d8"},{"x":19,"y":13,"color":"#efe9d8"},{"x":20,"y":13,"color":"#efe9d8"},{"x":21,"y":13,"color":"#efe9d8"},{"x":22,"y":13,"color":"#171715"},{"x":23,"y":13,"color":"#171715"},{"x":6,"y":14,"color":"#171715"},{"x":7,"y":14,"color":"#171715"},{"x":8,"y":14,"color":"#171715"},{"x":9,"y":14,"color":"#171715"},{"x":10,"y":14,"color":"#171715"},{"x":11,"y":14,"color":"#171715"},{"x":12,"y":14,"color":"#171715"},{"x":13,"y":14,"color":"#171715"},{"x":14,"y":14,"color":"#171715"},{"x":15,"y":14,"color":"#171715"},{"x":16,"y":14,"color":"#171715"},{"x":17,"y":14,"color":"#171715"},{"x":18,"y":14,"color":"#efe9d8"},{"x":19,"y":14,"color":"#efe9d8"},{"x":20,"y":14,"color":"#efe9d8"},{"x":21,"y":14,"color":"#efe9d8"},{"x":22,"y":14,"color":"#171715"},{"x":23,"y":14,"color":"#171715"},{"x":6,"y":15,"color":"#171715"},{"x":7,"y":15,"color":"#171715"},{"x":8,"y":15,"color":"#171715"},{"x":9,"y":15,"color":"#171715"},{"x":10,"y":15,"color":"#171715"},{"x":11,"y":15,"color":"#171715"},{"x":12,"y":15,"color":"#171715"},{"x":13,"y":15,"color":"#171715"},{"x":14,"y":15,"color":"#171715"},{"x":15,"y":15,"color":"#171715"},{"x":16,"y":15,"color":"#171715"},{"x":17,"y":15,"color":"#171715"},{"x":18,"y":15,"color":"#efe9d8"},{"x":19,"y":15,"color":"#efe9d8"},{"x":20,"y":15,"color":"#efe9d8"},{"x":21,"y":15,"color":"#efe9d8"},{"x":22,"y":15,"color":"#171715"},{"x":23,"y":15,"color":"#171715"},{"x":6,"y":16,"color":"#171715"},{"x":7,"y":16,"color":"#171715"},{"x":8,"y":16,"color":"#efe9d8"},{"x":9,"y":16,"color":"#efe9d8"},{"x":10,"y":16,"color":"#171715"},{"x":11,"y":16,"color":"#171715"},{"x":12,"y":16,"color":"#efe9d8"},{"x":13,"y":16,"color":"#efe9d8"},{"x":14,"y":16,"color":"#efe9d8"},{"x":15,"y":16,"color":"#efe9d8"},{"x":16,"y":16,"color":"#171715"},{"x":17,"y":16,"color":"#171715"},{"x":18,"y":16,"color":"#efe9d8"},{"x":19,"y":16,"color":"#efe9d8"},{"x":20,"y":16,"color":"#efe9d8"},{"x":21,"y":16,"color":"#efe9d8"},{"x":22,"y":16,"color":"#171715"},{"x":23,"y":16,"color":"#171715"},{"x":6,"y":17,"color":"#171715"},{"x":7,"y":17,"color":"#171715"},{"x":8,"y":17,"color":"#efe9d8"},{"x":9,"y":17,"color":"#efe9d8"},{"x":10,"y":17,"color":"#171715"},{"x":11,"y":17,"color":"#171715"},{"x":12,"y":17,"color":"#efe9d8"},{"x":13,"y":17,"color":"#efe9d8"},{"x":14,"y":17,"color":"#efe9d8"},{"x":15,"y":17,"color":"#efe9d8"},{"x":16,"y":17,"color":"#171715"},{"x":17,"y":17,"color":"#171715"},{"x":18,"y":17,"color":"#efe9d8"},{"x":19,"y":17,"color":"#efe9d8"},{"x":20,"y":17,"color":"#efe9d8"},{"x":21,"y":17,"color":"#efe9d8"},{"x":22,"y":17,"color":"#171715"},{"x":23,"y":17,"color":"#171715"},{"x":6,"y":18,"color":"#171715"},{"x":7,"y":18,"color":"#171715"},{"x":8,"y":18,"color":"#171715"},{"x":9,"y":18,"color":"#171715"},{"x":10,"y":18,"color":"#171715"},{"x":11,"y":18,"color":"#171715"},{"x":12,"y":18,"color":"#171715"},{"x":13,"y":18,"color":"#171715"},{"x":14,"y":18,"color":"#171715"},{"x":15,"y":18,"color":"#171715"},{"x":16,"y":18,"color":"#171715"},{"x":17,"y":18,"color":"#171715"},{"x":18,"y":18,"color":"#efe9d8"},{"x":19,"y":18,"color":"#efe9d8"},{"x":20,"y":18,"color":"#efe9d8"},{"x":21,"y":18,"color":"#efe9d8"},{"x":22,"y":18,"color":"#171715"},{"x":23,"y":18,"color":"#171715"},{"x":6,"y":19,"color":"#171715"},{"x":7,"y":19,"color":"#171715"},{"x":8,"y":19,"color":"#171715"},{"x":9,"y":19,"color":"#171715"},{"x":10,"y":19,"color":"#171715"},{"x":11,"y":19,"color":"#171715"},{"x":12,"y":19,"color":"#171715"},{"x":13,"y":19,"color":"#171715"},{"x":14,"y":19,"color":"#171715"},{"x":15,"y":19,"color":"#171715"},{"x":16,"y":19,"color":"#171715"},{"x":17,"y":19,"color":"#171715"},{"x":18,"y":19,"color":"#efe9d8"},{"x":19,"y":19,"color":"#efe9d8"},{"x":20,"y":19,"color":"#efe9d8"},{"x":21,"y":19,"color":"#efe9d8"},{"x":22,"y":19,"color":"#171715"},{"x":23,"y":19,"color":"#171715"},{"x":8,"y":20,"color":"#171715"},{"x":9,"y":20,"color":"#171715"},{"x":10,"y":20,"color":"#efe9d8"},{"x":11,"y":20,"color":"#efe9d8"},{"x":12,"y":20,"color":"#efe9d8"},{"x":13,"y":20,"color":"#efe9d8"},{"x":14,"y":20,"color":"#efe9d8"},{"x":15,"y":20,"color":"#efe9d8"},{"x":16,"y":20,"color":"#efe9d8"},{"x":17,"y":20,"color":"#efe9d8"},{"x":18,"y":20,"color":"#efe9d8"},{"x":19,"y":20,"color":"#efe9d8"},{"x":20,"y":20,"color":"#efe9d8"},{"x":21,"y":20,"color":"#efe9d8"},{"x":22,"y":20,"color":"#171715"},{"x":23,"y":20,"color":"#171715"},{"x":26,"y":20,"color":"#171715"},{"x":27,"y":20,"color":"#171715"},{"x":8,"y":21,"color":"#171715"},{"x":9,"y":21,"color":"#171715"},{"x":10,"y":21,"color":"#efe9d8"},{"x":11,"y":21,"color":"#efe9d8"},{"x":12,"y":21,"color":"#efe9d8"},{"x":13,"y":21,"color":"#efe9d8"},{"x":14,"y":21,"color":"#efe9d8"},{"x":15,"y":21,"color":"#efe9d8"},{"x":16,"y":21,"color":"#efe9d8"},{"x":17,"y":21,"color":"#efe9d8"},{"x":18,"y":21,"color":"#efe9d8"},{"x":19,"y":21,"color":"#efe9d8"},{"x":20,"y":21,"color":"#efe9d8"},{"x":21,"y":21,"color":"#efe9d8"},{"x":22,"y":21,"color":"#171715"},{"x":23,"y":21,"color":"#171715"},{"x":26,"y":21,"color":"#171715"},{"x":27,"y":21,"color":"#171715"},{"x":8,"y":22,"color":"#171715"},{"x":9,"y":22,"color":"#171715"},{"x":10,"y":22,"color":"#efe9d8"},{"x":11,"y":22,"color":"#efe9d8"},{"x":12,"y":22,"color":"#efe9d8"},{"x":13,"y":22,"color":"#efe9d8"},{"x":14,"y":22,"color":"#efe9d8"},{"x":15,"y":22,"color":"#efe9d8"},{"x":16,"y":22,"color":"#efe9d8"},{"x":17,"y":22,"color":"#efe9d8"},{"x":18,"y":22,"color":"#434543"},{"x":19,"y":22,"color":"#434543"},{"x":20,"y":22,"color":"#434543"},{"x":21,"y":22,"color":"#434543"},{"x":22,"y":22,"color":"#434543"},{"x":23,"y":22,"color":"#434543"},{"x":24,"y":22,"color":"#171715"},{"x":25,"y":22,"color":"#171715"},{"x":26,"y":22,"color":"#434543"},{"x":27,"y":22,"color":"#434543"},{"x":28,"y":22,"color":"#171715"},{"x":29,"y":22,"color":"#171715"},{"x":8,"y":23,"color":"#171715"},{"x":9,"y":23,"color":"#171715"},{"x":10,"y":23,"color":"#efe9d8"},{"x":11,"y":23,"color":"#efe9d8"},{"x":12,"y":23,"color":"#efe9d8"},{"x":13,"y":23,"color":"#efe9d8"},{"x":14,"y":23,"color":"#efe9d8"},{"x":15,"y":23,"color":"#efe9d8"},{"x":16,"y":23,"color":"#efe9d8"},{"x":17,"y":23,"color":"#efe9d8"},{"x":18,"y":23,"color":"#434543"},{"x":19,"y":23,"color":"#434543"},{"x":20,"y":23,"color":"#434543"},{"x":21,"y":23,"color":"#434543"},{"x":22,"y":23,"color":"#434543"},{"x":23,"y":23,"color":"#434543"},{"x":24,"y":23,"color":"#171715"},{"x":25,"y":23,"color":"#171715"},{"x":26,"y":23,"color":"#434543"},{"x":27,"y":23,"color":"#434543"},{"x":28,"y":23,"color":"#171715"},{"x":29,"y":23,"color":"#171715"},{"x":8,"y":24,"color":"#171715"},{"x":9,"y":24,"color":"#171715"},{"x":10,"y":24,"color":"#efe9d8"},{"x":11,"y":24,"color":"#efe9d8"},{"x":12,"y":24,"color":"#d58142"},{"x":13,"y":24,"color":"#d58142"},{"x":14,"y":24,"color":"#d58142"},{"x":15,"y":24,"color":"#d58142"},{"x":16,"y":24,"color":"#d58142"},{"x":17,"y":24,"color":"#d58142"},{"x":18,"y":24,"color":"#434543"},{"x":19,"y":24,"color":"#434543"},{"x":20,"y":24,"color":"#434543"},{"x":21,"y":24,"color":"#434543"},{"x":22,"y":24,"color":"#434543"},{"x":23,"y":24,"color":"#434543"},{"x":24,"y":24,"color":"#efe9d8"},{"x":25,"y":24,"color":"#efe9d8"},{"x":26,"y":24,"color":"#434543"},{"x":27,"y":24,"color":"#434543"},{"x":28,"y":24,"color":"#171715"},{"x":29,"y":24,"color":"#171715"},{"x":8,"y":25,"color":"#171715"},{"x":9,"y":25,"color":"#171715"},{"x":10,"y":25,"color":"#efe9d8"},{"x":11,"y":25,"color":"#efe9d8"},{"x":12,"y":25,"color":"#d58142"},{"x":13,"y":25,"color":"#d58142"},{"x":14,"y":25,"color":"#d58142"},{"x":15,"y":25,"color":"#d58142"},{"x":16,"y":25,"color":"#d58142"},{"x":17,"y":25,"color":"#d58142"},{"x":18,"y":25,"color":"#434543"},{"x":19,"y":25,"color":"#434543"},{"x":20,"y":25,"color":"#434543"},{"x":21,"y":25,"color":"#434543"},{"x":22,"y":25,"color":"#434543"},{"x":23,"y":25,"color":"#434543"},{"x":24,"y":25,"color":"#efe9d8"},{"x":25,"y":25,"color":"#efe9d8"},{"x":26,"y":25,"color":"#434543"},{"x":27,"y":25,"color":"#434543"},{"x":28,"y":25,"color":"#171715"},{"x":29,"y":25,"color":"#171715"},{"x":8,"y":26,"color":"#171715"},{"x":9,"y":26,"color":"#171715"},{"x":10,"y":26,"color":"#efe9d8"},{"x":11,"y":26,"color":"#efe9d8"},{"x":12,"y":26,"color":"#171715"},{"x":13,"y":26,"color":"#171715"},{"x":14,"y":26,"color":"#171715"},{"x":15,"y":26,"color":"#171715"},{"x":16,"y":26,"color":"#d58142"},{"x":17,"y":26,"color":"#d58142"},{"x":18,"y":26,"color":"#434543"},{"x":19,"y":26,"color":"#434543"},{"x":20,"y":26,"color":"#171715"},{"x":21,"y":26,"color":"#171715"},{"x":22,"y":26,"color":"#171715"},{"x":23,"y":26,"color":"#171715"},{"x":24,"y":26,"color":"#171715"},{"x":25,"y":26,"color":"#171715"},{"x":26,"y":26,"color":"#171715"},{"x":27,"y":26,"color":"#171715"},{"x":8,"y":27,"color":"#171715"},{"x":9,"y":27,"color":"#171715"},{"x":10,"y":27,"color":"#efe9d8"},{"x":11,"y":27,"color":"#efe9d8"},{"x":12,"y":27,"color":"#171715"},{"x":13,"y":27,"color":"#171715"},{"x":14,"y":27,"color":"#171715"},{"x":15,"y":27,"color":"#171715"},{"x":16,"y":27,"color":"#d58142"},{"x":17,"y":27,"color":"#d58142"},{"x":18,"y":27,"color":"#434543"},{"x":19,"y":27,"color":"#434543"},{"x":20,"y":27,"color":"#171715"},{"x":21,"y":27,"color":"#171715"},{"x":22,"y":27,"color":"#171715"},{"x":23,"y":27,"color":"#171715"},{"x":24,"y":27,"color":"#171715"},{"x":25,"y":27,"color":"#171715"},{"x":26,"y":27,"color":"#171715"},{"x":27,"y":27,"color":"#171715"},{"x":8,"y":28,"color":"#171715"},{"x":9,"y":28,"color":"#171715"},{"x":10,"y":28,"color":"#171715"},{"x":11,"y":28,"color":"#171715"},{"x":16,"y":28,"color":"#171715"},{"x":17,"y":28,"color":"#171715"},{"x":18,"y":28,"color":"#171715"},{"x":19,"y":28,"color":"#171715"},{"x":8,"y":29,"color":"#171715"},{"x":9,"y":29,"color":"#171715"},{"x":10,"y":29,"color":"#171715"},{"x":11,"y":29,"color":"#171715"},{"x":16,"y":29,"color":"#171715"},{"x":17,"y":29,"color":"#171715"},{"x":18,"y":29,"color":"#171715"},{"x":19,"y":29,"color":"#171715"}]},{"name":"Cat / CALICO / ROPE TURNER / Hands down / Preview \u00d716","pixels":[{"x":6,"y":4,"color":"#171715"},{"x":7,"y":4,"color":"#171715"},{"x":8,"y":4,"color":"#171715"},{"x":9,"y":4,"color":"#171715"},{"x":18,"y":4,"color":"#171715"},{"x":19,"y":4,"color":"#171715"},{"x":20,"y":4,"color":"#171715"},{"x":21,"y":4,"color":"#171715"},{"x":6,"y":5,"color":"#171715"},{"x":7,"y":5,"color":"#171715"},{"x":8,"y":5,"color":"#171715"},{"x":9,"y":5,"color":"#171715"},{"x":18,"y":5,"color":"#171715"},{"x":19,"y":5,"color":"#171715"},{"x":20,"y":5,"color":"#171715"},{"x":21,"y":5,"color":"#171715"},{"x":6,"y":6,"color":"#171715"},{"x":7,"y":6,"color":"#171715"},{"x":8,"y":6,"color":"#b25f2c"},{"x":9,"y":6,"color":"#b25f2c"},{"x":10,"y":6,"color":"#171715"},{"x":11,"y":6,"color":"#171715"},{"x":16,"y":6,"color":"#171715"},{"x":17,"y":6,"color":"#171715"},{"x":18,"y":6,"color":"#efe9d8"},{"x":19,"y":6,"color":"#efe9d8"},{"x":20,"y":6,"color":"#171715"},{"x":21,"y":6,"color":"#171715"},{"x":6,"y":7,"color":"#171715"},{"x":7,"y":7,"color":"#171715"},{"x":8,"y":7,"color":"#b25f2c"},{"x":9,"y":7,"color":"#b25f2c"},{"x":10,"y":7,"color":"#171715"},{"x":11,"y":7,"color":"#171715"},{"x":16,"y":7,"color":"#171715"},{"x":17,"y":7,"color":"#171715"},{"x":18,"y":7,"color":"#efe9d8"},{"x":19,"y":7,"color":"#efe9d8"},{"x":20,"y":7,"color":"#171715"},{"x":21,"y":7,"color":"#171715"},{"x":6,"y":8,"color":"#171715"},{"x":7,"y":8,"color":"#171715"},{"x":8,"y":8,"color":"#d88c70"},{"x":9,"y":8,"color":"#d88c70"},{"x":10,"y":8,"color":"#623317"},{"x":11,"y":8,"color":"#623317"},{"x":12,"y":8,"color":"#171715"},{"x":13,"y":8,"color":"#171715"},{"x":14,"y":8,"color":"#171715"},{"x":15,"y":8,"color":"#171715"},{"x":16,"y":8,"color":"#efe9d8"},{"x":17,"y":8,"color":"#efe9d8"},{"x":18,"y":8,"color":"#d88c70"},{"x":19,"y":8,"color":"#d88c70"},{"x":20,"y":8,"color":"#171715"},{"x":21,"y":8,"color":"#171715"},{"x":6,"y":9,"color":"#171715"},{"x":7,"y":9,"color":"#171715"},{"x":8,"y":9,"color":"#d88c70"},{"x":9,"y":9,"color":"#d88c70"},{"x":10,"y":9,"color":"#623317"},{"x":11,"y":9,"color":"#623317"},{"x":12,"y":9,"color":"#171715"},{"x":13,"y":9,"color":"#171715"},{"x":14,"y":9,"color":"#171715"},{"x":15,"y":9,"color":"#171715"},{"x":16,"y":9,"color":"#efe9d8"},{"x":17,"y":9,"color":"#efe9d8"},{"x":18,"y":9,"color":"#d88c70"},{"x":19,"y":9,"color":"#d88c70"},{"x":20,"y":9,"color":"#171715"},{"x":21,"y":9,"color":"#171715"},{"x":4,"y":10,"color":"#171715"},{"x":5,"y":10,"color":"#171715"},{"x":6,"y":10,"color":"#d58142"},{"x":7,"y":10,"color":"#d58142"},{"x":8,"y":10,"color":"#d58142"},{"x":9,"y":10,"color":"#d58142"},{"x":10,"y":10,"color":"#d58142"},{"x":11,"y":10,"color":"#d58142"},{"x":12,"y":10,"color":"#d58142"},{"x":13,"y":10,"color":"#d58142"},{"x":14,"y":10,"color":"#efe9d8"},{"x":15,"y":10,"color":"#efe9d8"},{"x":16,"y":10,"color":"#efe9d8"},{"x":17,"y":10,"color":"#efe9d8"},{"x":18,"y":10,"color":"#cfc7b4"},{"x":19,"y":10,"color":"#cfc7b4"},{"x":20,"y":10,"color":"#efe9d8"},{"x":21,"y":10,"color":"#efe9d8"},{"x":22,"y":10,"color":"#171715"},{"x":23,"y":10,"color":"#171715"},{"x":4,"y":11,"color":"#171715"},{"x":5,"y":11,"color":"#171715"},{"x":6,"y":11,"color":"#d58142"},{"x":7,"y":11,"color":"#d58142"},{"x":8,"y":11,"color":"#d58142"},{"x":9,"y":11,"color":"#d58142"},{"x":10,"y":11,"color":"#d58142"},{"x":11,"y":11,"color":"#d58142"},{"x":12,"y":11,"color":"#d58142"},{"x":13,"y":11,"color":"#d58142"},{"x":14,"y":11,"color":"#efe9d8"},{"x":15,"y":11,"color":"#efe9d8"},{"x":16,"y":11,"color":"#efe9d8"},{"x":17,"y":11,"color":"#efe9d8"},{"x":18,"y":11,"color":"#cfc7b4"},{"x":19,"y":11,"color":"#cfc7b4"},{"x":20,"y":11,"color":"#efe9d8"},{"x":21,"y":11,"color":"#efe9d8"},{"x":22,"y":11,"color":"#171715"},{"x":23,"y":11,"color":"#171715"},{"x":4,"y":12,"color":"#171715"},{"x":5,"y":12,"color":"#171715"},{"x":6,"y":12,"color":"#efe9d8"},{"x":7,"y":12,"color":"#efe9d8"},{"x":8,"y":12,"color":"#623317"},{"x":9,"y":12,"color":"#623317"},{"x":10,"y":12,"color":"#efe9d8"},{"x":11,"y":12,"color":"#efe9d8"},{"x":12,"y":12,"color":"#efe9d8"},{"x":13,"y":12,"color":"#efe9d8"},{"x":14,"y":12,"color":"#623317"},{"x":15,"y":12,"color":"#623317"},{"x":16,"y":12,"color":"#efe9d8"},{"x":17,"y":12,"color":"#efe9d8"},{"x":18,"y":12,"color":"#efe9d8"},{"x":19,"y":12,"color":"#efe9d8"},{"x":20,"y":12,"color":"#efe9d8"},{"x":21,"y":12,"color":"#efe9d8"},{"x":22,"y":12,"color":"#171715"},{"x":23,"y":12,"color":"#171715"},{"x":4,"y":13,"color":"#171715"},{"x":5,"y":13,"color":"#171715"},{"x":6,"y":13,"color":"#efe9d8"},{"x":7,"y":13,"color":"#efe9d8"},{"x":8,"y":13,"color":"#623317"},{"x":9,"y":13,"color":"#623317"},{"x":10,"y":13,"color":"#efe9d8"},{"x":11,"y":13,"color":"#efe9d8"},{"x":12,"y":13,"color":"#efe9d8"},{"x":13,"y":13,"color":"#efe9d8"},{"x":14,"y":13,"color":"#623317"},{"x":15,"y":13,"color":"#623317"},{"x":16,"y":13,"color":"#efe9d8"},{"x":17,"y":13,"color":"#efe9d8"},{"x":18,"y":13,"color":"#efe9d8"},{"x":19,"y":13,"color":"#efe9d8"},{"x":20,"y":13,"color":"#efe9d8"},{"x":21,"y":13,"color":"#efe9d8"},{"x":22,"y":13,"color":"#171715"},{"x":23,"y":13,"color":"#171715"},{"x":4,"y":14,"color":"#171715"},{"x":5,"y":14,"color":"#171715"},{"x":6,"y":14,"color":"#efe9d8"},{"x":7,"y":14,"color":"#efe9d8"},{"x":8,"y":14,"color":"#fefefe"},{"x":9,"y":14,"color":"#fefefe"},{"x":10,"y":14,"color":"#cc776f"},{"x":11,"y":14,"color":"#cc776f"},{"x":12,"y":14,"color":"#fefefe"},{"x":13,"y":14,"color":"#fefefe"},{"x":14,"y":14,"color":"#efe9d8"},{"x":15,"y":14,"color":"#efe9d8"},{"x":16,"y":14,"color":"#efe9d8"},{"x":17,"y":14,"color":"#efe9d8"},{"x":18,"y":14,"color":"#efe9d8"},{"x":19,"y":14,"color":"#efe9d8"},{"x":20,"y":14,"color":"#efe9d8"},{"x":21,"y":14,"color":"#efe9d8"},{"x":22,"y":14,"color":"#171715"},{"x":23,"y":14,"color":"#171715"},{"x":4,"y":15,"color":"#171715"},{"x":5,"y":15,"color":"#171715"},{"x":6,"y":15,"color":"#efe9d8"},{"x":7,"y":15,"color":"#efe9d8"},{"x":8,"y":15,"color":"#fefefe"},{"x":9,"y":15,"color":"#fefefe"},{"x":10,"y":15,"color":"#cc776f"},{"x":11,"y":15,"color":"#cc776f"},{"x":12,"y":15,"color":"#fefefe"},{"x":13,"y":15,"color":"#fefefe"},{"x":14,"y":15,"color":"#efe9d8"},{"x":15,"y":15,"color":"#efe9d8"},{"x":16,"y":15,"color":"#efe9d8"},{"x":17,"y":15,"color":"#efe9d8"},{"x":18,"y":15,"color":"#efe9d8"},{"x":19,"y":15,"color":"#efe9d8"},{"x":20,"y":15,"color":"#efe9d8"},{"x":21,"y":15,"color":"#efe9d8"},{"x":22,"y":15,"color":"#171715"},{"x":23,"y":15,"color":"#171715"},{"x":6,"y":16,"color":"#171715"},{"x":7,"y":16,"color":"#171715"},{"x":8,"y":16,"color":"#fefefe"},{"x":9,"y":16,"color":"#fefefe"},{"x":10,"y":16,"color":"#fefefe"},{"x":11,"y":16,"color":"#fefefe"},{"x":12,"y":16,"color":"#fefefe"},{"x":13,"y":16,"color":"#fefefe"},{"x":14,"y":16,"color":"#fefefe"},{"x":15,"y":16,"color":"#fefefe"},{"x":16,"y":16,"color":"#efe9d8"},{"x":17,"y":16,"color":"#efe9d8"},{"x":18,"y":16,"color":"#efe9d8"},{"x":19,"y":16,"color":"#efe9d8"},{"x":20,"y":16,"color":"#efe9d8"},{"x":21,"y":16,"color":"#efe9d8"},{"x":22,"y":16,"color":"#171715"},{"x":23,"y":16,"color":"#171715"},{"x":6,"y":17,"color":"#171715"},{"x":7,"y":17,"color":"#171715"},{"x":8,"y":17,"color":"#fefefe"},{"x":9,"y":17,"color":"#fefefe"},{"x":10,"y":17,"color":"#fefefe"},{"x":11,"y":17,"color":"#fefefe"},{"x":12,"y":17,"color":"#fefefe"},{"x":13,"y":17,"color":"#fefefe"},{"x":14,"y":17,"color":"#fefefe"},{"x":15,"y":17,"color":"#fefefe"},{"x":16,"y":17,"color":"#efe9d8"},{"x":17,"y":17,"color":"#efe9d8"},{"x":18,"y":17,"color":"#efe9d8"},{"x":19,"y":17,"color":"#efe9d8"},{"x":20,"y":17,"color":"#efe9d8"},{"x":21,"y":17,"color":"#efe9d8"},{"x":22,"y":17,"color":"#171715"},{"x":23,"y":17,"color":"#171715"},{"x":6,"y":18,"color":"#171715"},{"x":7,"y":18,"color":"#171715"},{"x":8,"y":18,"color":"#171715"},{"x":9,"y":18,"color":"#171715"},{"x":10,"y":18,"color":"#171715"},{"x":11,"y":18,"color":"#171715"},{"x":12,"y":18,"color":"#171715"},{"x":13,"y":18,"color":"#171715"},{"x":14,"y":18,"color":"#171715"},{"x":15,"y":18,"color":"#171715"},{"x":16,"y":18,"color":"#171715"},{"x":17,"y":18,"color":"#171715"},{"x":18,"y":18,"color":"#efe9d8"},{"x":19,"y":18,"color":"#efe9d8"},{"x":20,"y":18,"color":"#efe9d8"},{"x":21,"y":18,"color":"#efe9d8"},{"x":22,"y":18,"color":"#171715"},{"x":23,"y":18,"color":"#171715"},{"x":6,"y":19,"color":"#171715"},{"x":7,"y":19,"color":"#171715"},{"x":8,"y":19,"color":"#171715"},{"x":9,"y":19,"color":"#171715"},{"x":10,"y":19,"color":"#171715"},{"x":11,"y":19,"color":"#171715"},{"x":12,"y":19,"color":"#171715"},{"x":13,"y":19,"color":"#171715"},{"x":14,"y":19,"color":"#171715"},{"x":15,"y":19,"color":"#171715"},{"x":16,"y":19,"color":"#171715"},{"x":17,"y":19,"color":"#171715"},{"x":18,"y":19,"color":"#efe9d8"},{"x":19,"y":19,"color":"#efe9d8"},{"x":20,"y":19,"color":"#efe9d8"},{"x":21,"y":19,"color":"#efe9d8"},{"x":22,"y":19,"color":"#171715"},{"x":23,"y":19,"color":"#171715"},{"x":6,"y":20,"color":"#171715"},{"x":7,"y":20,"color":"#171715"},{"x":8,"y":20,"color":"#efe9d8"},{"x":9,"y":20,"color":"#efe9d8"},{"x":10,"y":20,"color":"#171715"},{"x":11,"y":20,"color":"#171715"},{"x":12,"y":20,"color":"#d58142"},{"x":13,"y":20,"color":"#d58142"},{"x":14,"y":20,"color":"#d58142"},{"x":15,"y":20,"color":"#d58142"},{"x":16,"y":20,"color":"#171715"},{"x":17,"y":20,"color":"#171715"},{"x":18,"y":20,"color":"#efe9d8"},{"x":19,"y":20,"color":"#efe9d8"},{"x":20,"y":20,"color":"#efe9d8"},{"x":21,"y":20,"color":"#efe9d8"},{"x":22,"y":20,"color":"#171715"},{"x":23,"y":20,"color":"#171715"},{"x":26,"y":20,"color":"#171715"},{"x":27,"y":20,"color":"#171715"},{"x":6,"y":21,"color":"#171715"},{"x":7,"y":21,"color":"#171715"},{"x":8,"y":21,"color":"#efe9d8"},{"x":9,"y":21,"color":"#efe9d8"},{"x":10,"y":21,"color":"#171715"},{"x":11,"y":21,"color":"#171715"},{"x":12,"y":21,"color":"#d58142"},{"x":13,"y":21,"color":"#d58142"},{"x":14,"y":21,"color":"#d58142"},{"x":15,"y":21,"color":"#d58142"},{"x":16,"y":21,"color":"#171715"},{"x":17,"y":21,"color":"#171715"},{"x":18,"y":21,"color":"#efe9d8"},{"x":19,"y":21,"color":"#efe9d8"},{"x":20,"y":21,"color":"#efe9d8"},{"x":21,"y":21,"color":"#efe9d8"},{"x":22,"y":21,"color":"#171715"},{"x":23,"y":21,"color":"#171715"},{"x":26,"y":21,"color":"#171715"},{"x":27,"y":21,"color":"#171715"},{"x":6,"y":22,"color":"#171715"},{"x":7,"y":22,"color":"#171715"},{"x":8,"y":22,"color":"#171715"},{"x":9,"y":22,"color":"#171715"},{"x":10,"y":22,"color":"#171715"},{"x":11,"y":22,"color":"#171715"},{"x":12,"y":22,"color":"#171715"},{"x":13,"y":22,"color":"#171715"},{"x":14,"y":22,"color":"#171715"},{"x":15,"y":22,"color":"#171715"},{"x":16,"y":22,"color":"#171715"},{"x":17,"y":22,"color":"#171715"},{"x":18,"y":22,"color":"#434543"},{"x":19,"y":22,"color":"#434543"},{"x":20,"y":22,"color":"#434543"},{"x":21,"y":22,"color":"#434543"},{"x":22,"y":22,"color":"#434543"},{"x":23,"y":22,"color":"#434543"},{"x":24,"y":22,"color":"#171715"},{"x":25,"y":22,"color":"#171715"},{"x":26,"y":22,"color":"#434543"},{"x":27,"y":22,"color":"#434543"},{"x":28,"y":22,"color":"#171715"},{"x":29,"y":22,"color":"#171715"},{"x":6,"y":23,"color":"#171715"},{"x":7,"y":23,"color":"#171715"},{"x":8,"y":23,"color":"#171715"},{"x":9,"y":23,"color":"#171715"},{"x":10,"y":23,"color":"#171715"},{"x":11,"y":23,"color":"#171715"},{"x":12,"y":23,"color":"#171715"},{"x":13,"y":23,"color":"#171715"},{"x":14,"y":23,"color":"#171715"},{"x":15,"y":23,"color":"#171715"},{"x":16,"y":23,"color":"#171715"},{"x":17,"y":23,"color":"#171715"},{"x":18,"y":23,"color":"#434543"},{"x":19,"y":23,"color":"#434543"},{"x":20,"y":23,"color":"#434543"},{"x":21,"y":23,"color":"#434543"},{"x":22,"y":23,"color":"#434543"},{"x":23,"y":23,"color":"#434543"},{"x":24,"y":23,"color":"#171715"},{"x":25,"y":23,"color":"#171715"},{"x":26,"y":23,"color":"#434543"},{"x":27,"y":23,"color":"#434543"},{"x":28,"y":23,"color":"#171715"},{"x":29,"y":23,"color":"#171715"},{"x":8,"y":24,"color":"#171715"},{"x":9,"y":24,"color":"#171715"},{"x":10,"y":24,"color":"#efe9d8"},{"x":11,"y":24,"color":"#efe9d8"},{"x":12,"y":24,"color":"#d58142"},{"x":13,"y":24,"color":"#d58142"},{"x":14,"y":24,"color":"#d58142"},{"x":15,"y":24,"color":"#d58142"},{"x":16,"y":24,"color":"#d58142"},{"x":17,"y":24,"color":"#d58142"},{"x":18,"y":24,"color":"#434543"},{"x":19,"y":24,"color":"#434543"},{"x":20,"y":24,"color":"#434543"},{"x":21,"y":24,"color":"#434543"},{"x":22,"y":24,"color":"#434543"},{"x":23,"y":24,"color":"#434543"},{"x":24,"y":24,"color":"#efe9d8"},{"x":25,"y":24,"color":"#efe9d8"},{"x":26,"y":24,"color":"#434543"},{"x":27,"y":24,"color":"#434543"},{"x":28,"y":24,"color":"#171715"},{"x":29,"y":24,"color":"#171715"},{"x":8,"y":25,"color":"#171715"},{"x":9,"y":25,"color":"#171715"},{"x":10,"y":25,"color":"#efe9d8"},{"x":11,"y":25,"color":"#efe9d8"},{"x":12,"y":25,"color":"#d58142"},{"x":13,"y":25,"color":"#d58142"},{"x":14,"y":25,"color":"#d58142"},{"x":15,"y":25,"color":"#d58142"},{"x":16,"y":25,"color":"#d58142"},{"x":17,"y":25,"color":"#d58142"},{"x":18,"y":25,"color":"#434543"},{"x":19,"y":25,"color":"#434543"},{"x":20,"y":25,"color":"#434543"},{"x":21,"y":25,"color":"#434543"},{"x":22,"y":25,"color":"#434543"},{"x":23,"y":25,"color":"#434543"},{"x":24,"y":25,"color":"#efe9d8"},{"x":25,"y":25,"color":"#efe9d8"},{"x":26,"y":25,"color":"#434543"},{"x":27,"y":25,"color":"#434543"},{"x":28,"y":25,"color":"#171715"},{"x":29,"y":25,"color":"#171715"},{"x":8,"y":26,"color":"#171715"},{"x":9,"y":26,"color":"#171715"},{"x":10,"y":26,"color":"#efe9d8"},{"x":11,"y":26,"color":"#efe9d8"},{"x":12,"y":26,"color":"#171715"},{"x":13,"y":26,"color":"#171715"},{"x":14,"y":26,"color":"#171715"},{"x":15,"y":26,"color":"#171715"},{"x":16,"y":26,"color":"#d58142"},{"x":17,"y":26,"color":"#d58142"},{"x":18,"y":26,"color":"#434543"},{"x":19,"y":26,"color":"#434543"},{"x":20,"y":26,"color":"#171715"},{"x":21,"y":26,"color":"#171715"},{"x":22,"y":26,"color":"#171715"},{"x":23,"y":26,"color":"#171715"},{"x":24,"y":26,"color":"#171715"},{"x":25,"y":26,"color":"#171715"},{"x":26,"y":26,"color":"#171715"},{"x":27,"y":26,"color":"#171715"},{"x":8,"y":27,"color":"#171715"},{"x":9,"y":27,"color":"#171715"},{"x":10,"y":27,"color":"#efe9d8"},{"x":11,"y":27,"color":"#efe9d8"},{"x":12,"y":27,"color":"#171715"},{"x":13,"y":27,"color":"#171715"},{"x":14,"y":27,"color":"#171715"},{"x":15,"y":27,"color":"#171715"},{"x":16,"y":27,"color":"#d58142"},{"x":17,"y":27,"color":"#d58142"},{"x":18,"y":27,"color":"#434543"},{"x":19,"y":27,"color":"#434543"},{"x":20,"y":27,"color":"#171715"},{"x":21,"y":27,"color":"#171715"},{"x":22,"y":27,"color":"#171715"},{"x":23,"y":27,"color":"#171715"},{"x":24,"y":27,"color":"#171715"},{"x":25,"y":27,"color":"#171715"},{"x":26,"y":27,"color":"#171715"},{"x":27,"y":27,"color":"#171715"},{"x":8,"y":28,"color":"#171715"},{"x":9,"y":28,"color":"#171715"},{"x":10,"y":28,"color":"#171715"},{"x":11,"y":28,"color":"#171715"},{"x":16,"y":28,"color":"#171715"},{"x":17,"y":28,"color":"#171715"},{"x":18,"y":28,"color":"#171715"},{"x":19,"y":28,"color":"#171715"},{"x":8,"y":29,"color":"#171715"},{"x":9,"y":29,"color":"#171715"},{"x":10,"y":29,"color":"#171715"},{"x":11,"y":29,"color":"#171715"},{"x":16,"y":29,"color":"#171715"},{"x":17,"y":29,"color":"#171715"},{"x":18,"y":29,"color":"#171715"},{"x":19,"y":29,"color":"#171715"}]}];
    const ropeTurnerSprites = ropeTurnerFrames.map(frame => {
      const sprite = document.createElement('canvas');
      sprite.width = sprite.height = 32;
      const pixelContext = sprite.getContext('2d');
      for (const pixel of frame.pixels) {
        pixelContext.fillStyle = pixel.color;
        pixelContext.fillRect(pixel.x, pixel.y, 1, 1);
      }
      return sprite;
    });

    function drawTurner(x, y, isLeft) {
      // The game uses cos(angle - PI), so downward velocity is sin(angle).
      const down = Math.sin(ropeAngle) * ropeDirection > 0;
      const hand = isLeft ? LEFT_HAND : RIGHT_HAND;
      const top = y - 45;
      hand.y = top + (down ? 22 : 17) * 1.5;
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      if (isLeft) {
        ctx.translate(Math.round(x + 18), Math.round(top));
        ctx.scale(-1, 1);
        ctx.drawImage(ropeTurnerSprites[down ? 1 : 0], 0, 0, 48, 48);
      } else {
        ctx.drawImage(ropeTurnerSprites[down ? 3 : 2], Math.round(x - 18), Math.round(top), 48, 48);
      }
      ctx.fillStyle = '#795335';
      // Paint the grip at the exact rope attachment point.
      if (isLeft) ctx.fillRect(17, Math.round((down ? 22 : 17) * 1.5 - 1.5), 3, 5);
      else ctx.fillRect(Math.round(x - 1.5), Math.round(hand.y - 1.5), 3, 5);
      ctx.restore();
    }

    function drawSpaceship(s) {
      ctx.save();
      ctx.translate(s.x, s.y);
      if (s.vx < 0) ctx.scale(-1, 1);
      if (s.type === 'ROCKET') {
        ctx.fillStyle = '#e6e6e6';
        ctx.fillRect(-12, -6, 24, 12);
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.moveTo(-12, -10); ctx.lineTo(-4, -6); ctx.lineTo(-12, -6); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-12, 10); ctx.lineTo(-4, 6); ctx.lineTo(-12, 6); ctx.fill();
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(-18, -3, 6, 6);
      } else {
        ctx.fillStyle = '#00ffff';
        ctx.beginPath();
        ctx.arc(0, -3, 7, Math.PI, 0);
        ctx.fill();
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.ellipse(0, 2, 16, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawCrashingSpaceship(c) {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(c.rot);
      ctx.scale(c.scale, c.scale);
      ctx.fillStyle = '#ff0055';
      ctx.beginPath(); ctx.arc(0, -6, 12, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#ffff00'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#00ffcc';
      ctx.beginPath(); ctx.ellipse(0, 4, 26, 9, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffff00';
      ctx.beginPath(); ctx.arc(-14, 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 6, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(14, 4, 3, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }

    function drawAstroAnimal(a) {
      ctx.save();
      ctx.translate(a.x, a.y);
      ctx.rotate(a.angle);
      ctx.scale(a.scale, a.scale);
      ctx.fillStyle = '#e6e6e6';
      ctx.fillRect(-10, -8, 20, 20);
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-10, -8, 20, 20);

      if (a.type === 'RABBIT') {
        ctx.fillStyle = '#ffb3ba'; ctx.fillRect(-8, -24, 4, 10); ctx.fillRect(4, -24, 4, 10);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -14, 16, 14);
      } else if (a.type === 'CAT') {
        ctx.fillStyle = '#ffdfba'; ctx.fillRect(-9, -18, 5, 5); ctx.fillRect(4, -18, 5, 5);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -14, 16, 14);
      } else {
        ctx.fillStyle = '#baffc9'; ctx.fillRect(-8, -14, 16, 14);
      }

      ctx.fillStyle = '#000'; ctx.fillRect(-4, -9, 2, 3); ctx.fillRect(2, -9, 2, 3);
      ctx.fillStyle = 'rgba(120, 220, 255, 0.35)';
      ctx.beginPath(); ctx.arc(0, -7, 15, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#00ffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-8, -18, 4, 4);
      ctx.restore();
    }

    function drawOverlay(title, sub) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = '#ffee00';
      ctx.font = 'bold 22px Courier New';
      ctx.textAlign = 'center';
      ctx.fillText(title, canvas.width / 2, canvas.height / 2 - 25);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Courier New';
      const lines = sub.split('\n');
      lines.forEach((line, idx) => {
        ctx.fillText(line, canvas.width / 2, canvas.height / 2 + 15 + (idx * 22));
      });
    }

    function drawCountdownOverlay() {
      countdownScale += (1.0 - countdownScale) * 0.15;
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(countdownScale, countdownScale);
      ctx.font = '900 54px Courier New';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const displayText = countdownValue > 0 ? `${countdownValue}` : "START!!";
      const displayColor = (stageLevel === 8)
        ? (countdownValue > 0 ? "#bf00ff" : "#ff00aa")
        : (stageLevel === 7 ? (countdownValue > 0 ? "#00ffff" : "#ff00ff") : (countdownValue > 0 ? "#ffee00" : "#33ff66"));

      ctx.fillStyle = '#000';
      ctx.fillText(displayText, 3, 3);
      ctx.fillStyle = displayColor;
      ctx.fillText(displayText, 0, 0);
      ctx.restore();
    }

    // 은은하고 소프트한 미니멀 구름 렌더러
    // 캐릭터 및 줄돌림이들의 바닥 그림자 (체공 높이에 따라 동적 반응)
    function drawGroundedShadows() {
      if (stageLevel >= 7) return;

      ctx.save();
      // 1. 좌우 줄 돌리는 고양이들 바닥 그림자
      ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
      ctx.beginPath();
      ctx.ellipse(LEFT_HAND.x, GROUND_Y, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.ellipse(RIGHT_HAND.x, GROUND_Y, 14, 4.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // 2. 점프하는 주인공 고양이 바닥 그림자 (공중에 뜰수록 작고 옅어짐)
      const jumpHeight = Math.max(0, GROUND_Y - player.y);
      const shadowRadiusX = Math.max(7, (15 - jumpHeight * 0.08) * player.scaleX);
      const shadowRadiusY = Math.max(2.4, 4.8 - jumpHeight * 0.03);
      const shadowAlpha = Math.max(0.10, 0.36 - (jumpHeight * 0.0035));

      ctx.fillStyle = `rgba(0, 0, 0, ${shadowAlpha})`;
      ctx.beginPath();
      ctx.ellipse(player.x, GROUND_Y, shadowRadiusX, shadowRadiusY, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawDynamicBackground() {
      drawStageBackground(stageLevel);
    }
