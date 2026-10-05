// Original shared state and initialization order are retained, including visual state
// and random initialization. Renderer and leaderboard helpers must load first.
    const canvas = document.getElementById('gameCanvas');
    canvas.height = Math.max(380, Math.round(document.getElementById("phone-frame").clientHeight * 360 / document.getElementById("phone-frame").clientWidth));
    const ctx = canvas.getContext('2d', { alpha: false });
    const scoreText = document.getElementById('score-text');
    const bestText = document.getElementById('best-text');
    const stageBadge = document.getElementById('stage-badge');
    const actionBtn = document.getElementById('actionBtn');
    const actionBtnTitle = document.getElementById('actionBtnTitle');
    const actionBtnSub = document.getElementById('actionBtnSub');
    const pauseBtn = document.getElementById('pauseBtn');
    const phoneFrame = document.getElementById('phone-frame');
    const pauseScreenOverlay = document.getElementById('pause-screen-overlay');

    const resultModal = document.getElementById('resultModal');
    const leaderboardModal = document.getElementById('leaderboardModal');
    const nicknameInput = document.getElementById('nicknameInput');
    const modalScoreVal = document.getElementById('modal-score-val');
    const modalSubVal = document.getElementById('modal-sub-val');
    const leaderboardList = document.getElementById('leaderboardList');
    const syncStatus = document.getElementById('sync-status');

    let isGameOver = false;
    let isGameStarted = false;
    let isPaused = false;
    let isWaitingRestart = false;
    let gameOverTimestamp = 0;

    let score = 0;
    let bestScore = 0;
    let combo = 0;
    let maxCombo = 0;
    let stageLevel = 1;
    let selectedMode = 'NORMAL';

    // 미세 상향된 템포 가중치 & BPM 설정 (STAGE 8: 중력 왜곡으로 속도를 낮추고 심리전에 집중)
    // 블랙홀의 모든 속도 패턴을 기존 대비 30% 감속 (1.20 × 0.70).
    const STAGE_SPEED_MULT = [0, 1.00, 1.09, 1.20, 1.32, 1.45, 1.58, 1.74, 0.84];
    const STAGE_BPMS = [0, 112, 122, 134, 146, 160, 174, 190, 136];

    let isCountingDown = false;
    let countdownValue = 3;
    let countdownScale = 2.5;
    let countdownIntervalId = null;

    const GROUND_Y = Math.round(canvas.height * 0.79);

    let player = {
      x: 180,
      y: GROUND_Y,
      vy: 0,
      scaleX: 1,
      scaleY: 1,
      isGrounded: true,
      gravity: 0.84,
      baseJumpForce: -8.8,
      isHoldingJump: false,
      jumpHoldFrames: 0,
      maxHoldFrames: 8
    };

    const LEFT_HAND = { x: 50, y: GROUND_Y - 26, z: 0 };
    const RIGHT_HAND = { x: 310, y: GROUND_Y - 26, z: 0 };

    let ropeAngle = 0;
    let ropeDirection = 1;
    let baseSpeed = 0.075;
    let currentSpeed = 0.075;
    let ropePassed = false;
    let hasWhipSoundPlayed = false;

    let currentPattern = 'NORMAL';
    let blackholeSpeedMult = 1.0;
    let blackholeTurnsRemaining = 3;

    let shakeAmount = 0;
    let floatingTexts = [];
    let particles = [];
    let fireworks = [];
    let backgroundStars = [];
    let magmaParticles = [];
    let warpStars = [];
    let blackholeInwardStars = [];
    let shockwaves = [];
    let astroAnimals = [];
    let spaceships = [];
    let crashingShip = null;
    let glassCracks = [];
    let blackholeAccretionAngle = 0;

    let comboPopup = { text: '', color: '#ffdd00', scale: 0, alpha: 0 };
    let stageAlert = { text: '', sub: '', alpha: 0, scale: 1 };

    const ROPE_SEGMENTS = 28;
    const ropePointsBuffer = Array.from({ length: ROPE_SEGMENTS + 1 }, () => ({ x: 0, y: 0, z: 0, scale: 1 }));

    // 땅 안쪽에 자연스럽게 심어진 3가닥 풀잎 (공중에 뜨는 능선 풀 완전 제거)
    const groundGrassTufts = [
      { x: 38,  y: GROUND_Y + 26, len: 5.5 },
      { x: 78,  y: GROUND_Y + 44, len: 6.5 },
      { x: 125, y: GROUND_Y + 30, len: 5.5 },
      { x: 172, y: GROUND_Y + 52, len: 6.0 },
      { x: 220, y: GROUND_Y + 32, len: 5.5 },
      { x: 268, y: GROUND_Y + 50, len: 6.0 },
      { x: 308, y: GROUND_Y + 28, len: 5.5 },
      { x: 335, y: GROUND_Y + 44, len: 6.0 }
    ];

    initializeBestRecord();

    for (let i = 0; i < 40; i++) {
      backgroundStars.push({
        x: Math.random() * 360,
        y: Math.random() * GROUND_Y,
        size: Math.random() * 2 + 1,
        blinkSpeed: Math.random() * 0.05 + 0.02
      });
    }

    for (let i = 0; i < 45; i++) {
      warpStars.push({
        x: Math.random() * 360,
        y: Math.random() * 380,
        length: Math.random() * 30 + 15,
        speed: Math.random() * 10 + 12,
        color: Math.random() < 0.33 ? '#00ffff' : (Math.random() < 0.66 ? '#ff00ff' : '#ffee00')
      });
    }

    for (let i = 0; i < 50; i++) {
      blackholeInwardStars.push({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random() * 160 + 20,
        speed: Math.random() * 1.6 + 0.8,
        size: Math.random() * 2 + 1,
        color: Math.random() < 0.5 ? '#ff00aa' : '#00ffff'
      });
    }

    const animalTypes = ['RABBIT', 'CAT', 'BEAR', 'DOG'];
    for (let i = 0; i < 6; i++) {
      astroAnimals.push({
        type: animalTypes[i % animalTypes.length],
        x: Math.random() * 300 + 30,
        y: Math.random() * 220 + 20,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 0.8,
        angle: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.03,
        scale: Math.random() * 0.4 + 0.85
      });
    }

    function triggerHaptic(pattern) {
      if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
        try { navigator.vibrate(pattern); } catch (e) {}
      }
    }

    let audioCtx = null;
    let bgmTimer = null;
    let bgmStep = 0;

    const bgmNotes = [
      261.63, 0, 329.63, 0, 392.00, 0, 523.25, 392.00,
      349.23, 0, 440.00, 0, 392.00, 0, 329.63, 0
    ];

    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        startBGM();
      }
    }

    function getBpmInterval() {
      const bpm = STAGE_BPMS[stageLevel] || 115;
      return (60 / bpm / 4) * 1000;
    }

    // 줄이 바닥을 가를 때의 쫄깃한 스냅 + 타격음
    function playWhipSnapSound() {
      if (!audioCtx) return;
      try {
        const t = audioCtx.currentTime;

        // 1. 채찍 스냅 노이즈
        const bufferSize = audioCtx.sampleRate * 0.04;
        const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }
        const noise = audioCtx.createBufferSource();
        noise.buffer = buffer;
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(stageLevel >= 7 ? 2200 : 1600, t);
        filter.Q.setValueAtTime(3.0, t);

        const noiseGain = audioCtx.createGain();
        noiseGain.gain.setValueAtTime(0.20, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

        noise.connect(filter);
        filter.connect(noiseGain);
        noiseGain.connect(audioCtx.destination);
        noise.start(t);

        // 2. 바닥 착지 찰진 타격 킥
        const osc = audioCtx.createOscillator();
        const thumpGain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(stageLevel >= 7 ? 280 : 200, t);
        osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

        thumpGain.gain.setValueAtTime(0.24, t);
        thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        osc.connect(thumpGain);
        thumpGain.connect(audioCtx.destination);
        osc.start(t);
        osc.stop(t + 0.045);
      } catch(e) {}
    }

    function startBGM() {
      if (bgmTimer) clearTimeout(bgmTimer);
      function stepBgm() {
        if (isGameStarted && !isGameOver && !isPaused && !isCountingDown && audioCtx) {
          const freq = bgmNotes[bgmStep % bgmNotes.length];
          if (freq > 0) {
            const pitchMult = stageLevel === 8 ? 0.85 : (stageLevel === 7 ? 0.75 : 0.5);
            playSynth(freq * pitchMult, 'triangle', 0.05, 0.035);
            if (bgmStep % 4 === 0) {
              playSynth(freq * (stageLevel >= 7 ? 1.5 : 1.0), 'square', 0.035, 0.03);
            }
          }
          bgmStep++;
        }
        bgmTimer = setTimeout(stepBgm, getBpmInterval());
      }
      stepBgm();
    }

    const scaleFreqs = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25, 587.33, 659.25, 783.99, 880.00];

    function playComboSound(c, isPerfect) {
      if (!audioCtx) return;
      const freq = scaleFreqs[c % scaleFreqs.length] * (1 + Math.floor(c / scaleFreqs.length) * 0.25);
      playSynth(freq, isPerfect ? 'square' : 'triangle', 0.12, isPerfect ? 0.18 : 0.12);
    }

    function playLevelUpFanfare() {
      if (!audioCtx) return;
      [523.25, 659.25, 783.99, 1046.50, 1318.51].forEach((f, idx) => {
        setTimeout(() => playSynth(f, 'square', 0.12, 0.2), idx * 50);
      });
    }

    function playCountSound(isFinal) {
      if (!audioCtx) return;
      playSynth(isFinal ? 880 : 440, 'square', 0.12, 0.2);
    }

    function playCrashBoom() {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(140, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, audioCtx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.28, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
      } catch(e) {}
    }

    function playSynth(freq, type, duration, vol = 0.12) {
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gain.gain.setValueAtTime(vol, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch(e) {}
    }

    function soundJump() { playSynth(460, 'square', 0.05, 0.08); }
    function soundFail() { playSynth(110, 'sawtooth', 0.35, 0.3); }

    function setPauseState(paused) {
      isPaused = paused;
      pauseBtn.innerText = isPaused ? "RESUME" : "PAUSE";
      pauseBtn.style.background = isPaused ? "#ffaa00" : "var(--pause-btn-bg)";
      pauseScreenOverlay.style.display = isPaused ? "flex" : "none";
    }

    function togglePause(e) {
      if (e) e.stopPropagation();
      if (!isGameStarted || isGameOver) return;

      if (isCountingDown) {
        if (countdownIntervalId) clearInterval(countdownIntervalId);
        isCountingDown = false;
        setPauseState(true);
        return;
      }

      if (isPaused) {
        setPauseState(false);
        startCountdown();
      } else {
        setPauseState(true);
      }
    }

    function resumeGameFromScreen(e) {
      if (e) e.stopPropagation();
      if (isPaused) {
        setPauseState(false);
        startCountdown();
      }
    }

    function selectGameMode(mode) {
      selectedMode = mode;
      document.getElementById('mode-normal').classList.toggle('active', mode === 'NORMAL');
      document.getElementById('mode-infinity').classList.toggle('active', mode === 'INFINITY');
      resetGame();
    }

    function setActionButtonState(state) {
      if (state === 'RETRY') {
        actionBtn.classList.add('retry-mode');
        actionBtnTitle.innerText = "🔄 다시 도전하기 (RETRY)";
        actionBtnSub.innerText = "탭하여 바로 재시작 / Space";
        actionBtn.style.pointerEvents = 'auto';
        actionBtn.style.opacity = '1';
      } else if (state === 'LOCKED') {
        actionBtn.classList.remove('retry-mode');
        actionBtn.style.pointerEvents = 'none';
        actionBtn.style.opacity = '0.5';
      } else {
        actionBtn.classList.remove('retry-mode');
        actionBtnTitle.innerText = "점프! (JUMP)";
        actionBtnSub.innerText = "탭: 소점프 / 롱홀드: 대점프 / Space";
        actionBtn.style.pointerEvents = 'auto';
        actionBtn.style.opacity = '1';
      }
    }

    function resetGame() {
      score = 0;
      combo = 0;
      maxCombo = 0;
      isGameOver = false;
      isWaitingRestart = false;
      gameOverTimestamp = 0;
      setPauseState(false);

      if (countdownIntervalId) clearInterval(countdownIntervalId);
      isCountingDown = false;

      resultModal.style.display = 'none';
      leaderboardModal.style.display = 'none';
      setActionButtonState('JUMP');

      phoneFrame.classList.remove('supernova-frame', 'infinity-frame', 'blackhole-frame');
      ropeAngle = 0;
      ropeDirection = 1;
      currentPattern = 'NORMAL';
      blackholeSpeedMult = 1.0;
      blackholeTurnsRemaining = 3;

      baseSpeed = 0.075;
      currentSpeed = baseSpeed;
      ropePassed = false;
      hasWhipSoundPlayed = false;
      player.y = GROUND_Y;
      player.vy = 0;
      player.scaleX = 1;
      player.scaleY = 1;
      player.isGrounded = true;
      player.isHoldingJump = false;
      player.jumpHoldFrames = 0;

      shakeAmount = 0;
      floatingTexts.length = 0;
      particles.length = 0;
      fireworks.length = 0;
      magmaParticles.length = 0;
      shockwaves.length = 0;
      spaceships.length = 0;
      crashingShip = null;
      glassCracks.length = 0;
      comboPopup.alpha = 0;
      stageAlert.alpha = 0;

      if (selectedMode === 'INFINITY') {
        stageLevel = 8;
        phoneFrame.classList.add('blackhole-frame');
        blackholeTurnsRemaining = 3;
        blackholeSpeedMult = 1.0;
      } else {
        stageLevel = 1;
      }

      updateUI();
      startCountdown();
    }

    function startCountdown() {
      if (countdownIntervalId) clearInterval(countdownIntervalId);
      isCountingDown = true;
      isGameStarted = true;
      countdownValue = 3;
      countdownScale = 2.8;

      initAudio();
      playCountSound(false);
      triggerHaptic(40);

      countdownIntervalId = setInterval(() => {
        countdownValue--;
        countdownScale = 2.8;

        if (countdownValue > 0) {
          playCountSound(false);
          triggerHaptic(40);
        } else if (countdownValue === 0) {
          playCountSound(true);
          triggerHaptic([60, 40, 80]);
        } else {
          clearInterval(countdownIntervalId);
          countdownIntervalId = null;
          isCountingDown = false;
        }
      }, 1000);
    }

    function isAnyModalOpen() {
      return resultModal.style.display === 'flex' || leaderboardModal.style.display === 'flex';
    }

    function isGameOverLocked() {
      return isGameOver && (Date.now() - gameOverTimestamp < 800);
    }

    function handleJumpStart(e) {
      if (isAnyModalOpen() || isGameOverLocked()) return;
      if (e && e.cancelable && e.type.startsWith('touch')) e.preventDefault();
      if (isPaused || isCountingDown) return;
      initAudio();

      if (!isGameStarted || isWaitingRestart) {
        resetGame();
        return;
      }

      if (isGameOver) return;

      if (player.isGrounded) {
        player.vy = player.baseJumpForce;
        player.isGrounded = false;
        player.isHoldingJump = true;
        player.jumpHoldFrames = 0;
        player.scaleX = 0.75;
        player.scaleY = 1.30;
        soundJump();
        triggerHaptic(15);
        createParticles(player.x, GROUND_Y, stageLevel >= 7 ? '#00ffff' : '#eee', 4);
      }
    }

    function handleJumpEnd(e) {
      if (isAnyModalOpen() || isGameOverLocked()) return;
      if (e && e.cancelable && e.type.startsWith('touch')) e.preventDefault();
      player.isHoldingJump = false;
      if (player.vy < -2.2) {
        player.vy *= 0.42;
      }
    }

    window.addEventListener('keydown', (e) => {
      if (isAnyModalOpen() || isGameOverLocked()) return;
      if (e.repeat) return;
      if (e.code === 'KeyP') togglePause();
      else if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpStart(e);
      }
    });

    window.addEventListener('keyup', (e) => {
      if (isAnyModalOpen() || isGameOverLocked()) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        handleJumpEnd(e);
      }
    });

    canvas.addEventListener('touchstart', handleJumpStart, { passive: false });
    canvas.addEventListener('touchend', handleJumpEnd, { passive: false });
    canvas.addEventListener('mousedown', handleJumpStart);
    canvas.addEventListener('mouseup', handleJumpEnd);

    actionBtn.addEventListener('touchstart', (e) => {
      if (!isGameOver && isGameStarted && !isWaitingRestart) handleJumpStart(e);
      else if (isWaitingRestart && !isAnyModalOpen()) resetGame();
    }, { passive: false });
    actionBtn.addEventListener('touchend', (e) => {
      if (!isGameOver && isGameStarted && !isWaitingRestart) handleJumpEnd(e);
    }, { passive: false });
    actionBtn.addEventListener('mousedown', (e) => {
      if (!isGameOver && isGameStarted && !isWaitingRestart) handleJumpStart(e);
      else if (isWaitingRestart && !isAnyModalOpen()) resetGame();
    });
    actionBtn.addEventListener('mouseup', (e) => {
      if (!isGameOver && isGameStarted && !isWaitingRestart) handleJumpEnd(e);
    });
    actionBtn.addEventListener('mouseleave', handleJumpEnd);

    function showGameOverScreen() {
      isGameOver = true;
      gameOverTimestamp = Date.now();
      player.isHoldingJump = false;
      shakeAmount = 0;
      phoneFrame.classList.remove('supernova-frame', 'infinity-frame', 'blackhole-frame');
      soundFail();
      triggerHaptic(280);
      addFloatingText("💥 MISS!!", player.x, player.y - 20, '#ff3333', 24);

      saveBestRecord();

      setActionButtonState('LOCKED');

      modalScoreVal.innerText = score;
      modalSubVal.innerText = `STAGE ${stageLevel} / ${maxCombo}콤보`;
      restoreNickname();
      resultModal.style.display = 'flex';
      setTimeout(() => nicknameInput.focus(), 50);
    }

    function skipAndReadyRestart() {
      resultModal.style.display = 'none';
      isWaitingRestart = true;
      setActionButtonState('RETRY');
    }

    function triggerGroundSnapEffect() {
      hasWhipSoundPlayed = true;
      playWhipSnapSound();
      triggerHaptic(12);

      // 바닥 충격파 링 생성
      shockwaves.push({
        x: canvas.width / 2,
        y: GROUND_Y - 2,
        radiusX: 4,
        radiusY: 2,
        maxRadiusX: 48,
        alpha: 1.0,
        color: (stageLevel === 8) ? '#ff00ff' : ((stageLevel === 7) ? '#00ffff' : '#ffffff')
      });

      // 바닥 파편 파티클
      const hitColor = stageLevel === 8 ? '#ff00aa' : (stageLevel === 7 ? '#00ffff' : (stageLevel === 6 ? '#ff4400' : '#eeddcc'));
      createParticles(canvas.width / 2, GROUND_Y - 2, hitColor, 6);
    }

    function update(dt) {
      if (!isGameStarted || isGameOver || isPaused || isCountingDown || isWaitingRestart) return;

      if (player.isHoldingJump && player.vy < 0 && player.jumpHoldFrames < player.maxHoldFrames) {
        player.vy -= 0.65 * dt;
        player.jumpHoldFrames++;
        player.scaleY = Math.min(1.48, 1.25 + (player.jumpHoldFrames * 0.022));
      }

      player.y += player.vy * dt;
      player.vy += player.gravity * dt;

      player.scaleX += (1 - player.scaleX) * 0.2 * dt;
      player.scaleY += (1 - player.scaleY) * 0.2 * dt;

      if (player.y >= GROUND_Y) {
        if (!player.isGrounded) {
          player.scaleX = 1.45;
          player.scaleY = 0.65;
          const dustColor = stageLevel >= 7 ? '#00ffff' : (stageLevel >= 4 ? '#bb66ff' : '#387320');
          createParticles(player.x, GROUND_Y, dustColor, 5);
        }
        player.y = GROUND_Y;
        player.vy = 0;
        player.isGrounded = true;
        player.isHoldingJump = false;
      }

      // 기본 속도 미세 상향 (0.070 -> 0.075 기준)
      baseSpeed = 0.075 + Math.min(0.038, (score * 0.0009));
      let whipMultiplier = 0.90 + (1 - Math.cos(ropeAngle)) * 0.28;
      const stageMultiplier = STAGE_SPEED_MULT[stageLevel] || 1.0;

      // STAGE 8 (블랙홀): 1바퀴 도는 동안 도중 가속 없이 완전 등속 회전
      let speedVarianceMult = 1.0;
      let effectiveWhip = whipMultiplier;
      if (stageLevel === 8) {
        blackholeAccretionAngle += 0.04 * dt;
        speedVarianceMult = blackholeSpeedMult;
        effectiveWhip = 1.0; // 회전 도중 속도 변화 방지 (완전 균일 등속 회전)
      }

      currentSpeed = baseSpeed * effectiveWhip * stageMultiplier * speedVarianceMult * ropeDirection;
      ropeAngle += currentSpeed * dt;

      if (ropeAngle >= Math.PI * 2 || ropeAngle < 0) {
        if (ropeAngle >= Math.PI * 2) {
          ropeAngle -= Math.PI * 2;
        } else {
          ropeAngle += Math.PI * 2;
        }
        ropePassed = false;
        hasWhipSoundPlayed = false;

        // STAGE 8: 캐릭터가 줄을 넘은 뒤(회전 완료 시점)에만 체크하며, 2~4턴간 동일 속도 유지 후 변경
        if (stageLevel === 8) {
          ropeDirection = 1; // 정방향 고정
          blackholeTurnsRemaining--;

          if (blackholeTurnsRemaining <= 0) {
            // 한 번 정해진 속도를 2~4바퀴 동안 변함없이 유지
            blackholeTurnsRemaining = Math.floor(Math.random() * 3) + 2;
            const roll = Math.random();
            const prev = currentPattern;

            if (roll < 0.32) {
              currentPattern = 'SLOW';
              blackholeSpeedMult = 0.72; // 중력 슬로우 턴
              if (prev !== 'SLOW') addFloatingText("🪐 SLOW", 180, 140, '#66ccff', 16);
            } else if (roll < 0.68) {
              currentPattern = 'NORMAL';
              blackholeSpeedMult = 1.05; // 기본 속도 턴
              if (prev !== 'NORMAL') addFloatingText("🌀 NORMAL", 180, 140, '#aaccff', 15);
            } else if (roll < 0.88) {
              currentPattern = 'FAST';
              blackholeSpeedMult = 1.38; // 쾌속 턴
              if (prev !== 'FAST') addFloatingText("⚡ FAST!", 180, 140, '#ff00aa', 16);
            } else {
              currentPattern = 'HYPER';
              blackholeSpeedMult = 1.68; // 초광속 턴
              if (prev !== 'HYPER') addFloatingText("💥 WARP SPEED!", 180, 140, '#ffee00', 17);
              shakeAmount = 4;
              triggerHaptic(25);
            }
          }
        }
      }

      // 바닥 타격 스냅 사운드 및 이펙트 트리거
      if (ropeAngle > Math.PI - 0.28 && ropeAngle < Math.PI + 0.28 && !hasWhipSoundPlayed) {
        triggerGroundSnapEffect();
      }

      const isRopeAtBottom = (ropeAngle > Math.PI - 0.35 && ropeAngle < Math.PI + 0.35);

      if (isRopeAtBottom && !ropePassed) {
        const jumpHeight = GROUND_Y - player.y;

        if (jumpHeight < 14) {
          showGameOverScreen();
        } else {
          ropePassed = true;
          combo++;
          if (combo > maxCombo) maxCombo = combo;

          let earnedScore = 1;
          let judgmentText = "GOOD";
          let judgmentColor = "#ffffff";
          let isPerfect = false;

          if (jumpHeight <= 26) {
            earnedScore = 3;
            judgmentText = "PERFECT!!!";
            judgmentColor = "#ffee00";
            shakeAmount = 4;
            isPerfect = true;
            triggerHaptic([25, 30, 45]);
            createParticles(player.x, player.y, '#ffee00', 10);
          } else if (jumpHeight <= 48) {
            earnedScore = 2;
            judgmentText = "GREAT!!";
            judgmentColor = "#66ffcc";
            shakeAmount = 2;
            triggerHaptic(30);
            createParticles(player.x, player.y, '#66ffcc', 6);
          } else {
            earnedScore = 1;
            judgmentText = "GOOD";
            judgmentColor = "#ffffff";
            triggerHaptic(20);
            createParticles(player.x, player.y, '#ffffff', 4);
          }

          score += earnedScore;
          playComboSound(combo, isPerfect);
          addFloatingText(judgmentText, player.x, player.y - 30, judgmentColor, isPerfect ? 20 : 16);
          triggerComboPopup(combo, judgmentColor);

          if (selectedMode === 'NORMAL') {
            checkStageProgression();
          }
          updateUI();
        }
      }

      updateStageAmbience(dt);
      updateEffects(dt);
    }

    // 5점 단위 빠른 스테이지 승급 기준 (이전 텀 복원)
    function checkStageProgression() {
      let newStage = 1;
      if (score >= 35) newStage = 8;
      else if (score >= 30) newStage = 7;
      else if (score >= 25) newStage = 6;
      else if (score >= 20) newStage = 5;
      else if (score >= 15) newStage = 4;
      else if (score >= 10) newStage = 3;
      else if (score >= 5) newStage = 2;

      if (newStage > stageLevel) {
        stageLevel = newStage;
        shakeAmount = 10;
        playLevelUpFanfare();
        triggerHaptic([50, 40, 50, 40, 90]);

        phoneFrame.classList.remove('supernova-frame', 'infinity-frame', 'blackhole-frame');
        if (stageLevel === 6) phoneFrame.classList.add('supernova-frame');
        if (stageLevel === 7) phoneFrame.classList.add('infinity-frame');
        if (stageLevel === 8) {
          phoneFrame.classList.add('blackhole-frame');
          blackholeTurnsRemaining = 3;
          blackholeSpeedMult = 1.0;
          currentPattern = 'NORMAL';
        }

        const titles = ["", "STAGE 1: DAY", "STAGE 2: SUNSET", "STAGE 3: NIGHT", "STAGE 4: SPACE", "STAGE 5: FIREWORKS!", "STAGE 6: SUPERNOVA 🔥", "STAGE 7: HYPER SPEED ⚡", "STAGE 8: BLACK HOLE 🕳️"];
        const subs = ["", "맑은 하늘", "황혼의 노을", "별이 빛나는 밤", "우주 진입!", "축제 폭죽!", "초신성 폭발!", "광속 회전 오버드라이브!", "중력 왜곡 특이점!"];
        triggerStageAlert(titles[stageLevel], subs[stageLevel]);
      }
    }

    function updateUI() {
      scoreText.innerText = score;
      bestText.innerText = `(BEST: ${bestScore})`;
      const stageNames = ["", "STAGE 1: DAY", "STAGE 2: SUNSET", "STAGE 3: NIGHT", "STAGE 4: SPACE", "STAGE 5: FIREWORKS!", "STAGE 6: SUPERNOVA 🔥", "STAGE 7: HYPER SPEED ⚡", "STAGE 8: BLACK HOLE 🕳️"];
      stageBadge.innerText = stageNames[stageLevel];

      if (stageLevel === 8) stageBadge.style.color = '#bf00ff';
      else if (stageLevel === 7) stageBadge.style.color = '#00ffff';
      else if (stageLevel === 6) stageBadge.style.color = '#ff4400';
      else if (stageLevel >= 4) stageBadge.style.color = '#ff99ff';
      else if (stageLevel === 2) stageBadge.style.color = '#ffbb44';
      else stageBadge.style.color = '#66ffcc';
    }

    let lastFrameTime = performance.now();
    function gameLoop(currentTime) {
      const deltaMs = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      const dt = Math.min(1.5, Math.max(0.5, deltaMs / 16.667));

      update(dt);
      draw();
      requestAnimationFrame(gameLoop);
    }

    window.onload = function() {
      requestAnimationFrame(gameLoop);
    };
