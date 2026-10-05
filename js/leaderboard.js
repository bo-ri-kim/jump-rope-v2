// Persistence and ranking; storage keys, endpoint, and requests are unchanged.
    const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbzzz6f4UESAi0W_HwUrp7iQPVc_uCRmHQa9S6JnUVLX6girkGEngRKGvgJ2pUcpMo2d/exec";
    async function submitScoreToLeaderboard() {
      const nick = nicknameInput.value.trim() || '익명냥이';
      localStorage.setItem('jump_rope_cat_last_nick', nick);
      const submitBtn = document.getElementById('submitScoreBtn');
      submitBtn.innerText = '저장 중...';
      submitBtn.disabled = true;

      const record = {
        nickname: nick,
        score: score,
        stage: stageLevel,
        combo: maxCombo
      };

      try {
        if (GOOGLE_SHEET_API_URL && !GOOGLE_SHEET_API_URL.includes("여기에_")) {
          await fetch(GOOGLE_SHEET_API_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(record)
          });
        }
      } catch (err) {
        console.warn('Online sync failed:', err);
      }

      saveLocalRecord(record);
      submitBtn.innerText = '기록 등록';
      submitBtn.disabled = false;
      resultModal.style.display = 'none';
      openLeaderboardModal();
    }

    function saveLocalRecord(record) {
      let records = [];
      try {
        records = JSON.parse(localStorage.getItem('jump_rope_cat_scores')) || [];
      } catch (e) { records = []; }
      records.push(record);
      records.sort((a, b) => b.score - a.score);
      localStorage.setItem('jump_rope_cat_scores', JSON.stringify(records.slice(0, 15)));
    }

    function getLocalRecords() {
      try {
        return JSON.parse(localStorage.getItem('jump_rope_cat_scores')) || [];
      } catch (e) { return []; }
    }

    async function openLeaderboardModal() {
      if (isGameStarted && !isGameOver) {
        if (isCountingDown) {
          if (countdownIntervalId) clearInterval(countdownIntervalId);
          isCountingDown = false;
        }
        setPauseState(true);
      }

      leaderboardModal.style.display = 'flex';
      leaderboardList.innerHTML = '<li class="leaderboard-item" style="justify-content: center;">불러오는 중...</li>';
      syncStatus.innerText = '';
      setActionButtonState('LOCKED');

      let records = [];
      let isOnline = false;

      if (GOOGLE_SHEET_API_URL && !GOOGLE_SHEET_API_URL.includes("여기에_")) {
        try {
          const res = await fetch(GOOGLE_SHEET_API_URL);
          if (res.ok) {
            records = await res.json();
            isOnline = true;
          }
        } catch (e) {
          console.warn('Sheets fetch error, fallback to local:', e);
        }
      }

      if (!isOnline || records.length === 0) {
        records = getLocalRecords();
        syncStatus.innerText = isOnline ? '등록된 기록 없음' : '동기화 실패 (로컬 기록 표시)';
      } else {
        syncStatus.innerText = '⚡ 구글 시트 실시간 연동 완료';
      }

      if (records.length === 0) {
        leaderboardList.innerHTML = '<li class="leaderboard-item" style="justify-content: center;">기록이 없습니다.</li>';
        return;
      }

      leaderboardList.innerHTML = '';
      records.slice(0, 15).forEach((r, idx) => {
        const li = document.createElement('li');
        li.className = `leaderboard-item ${idx === 0 ? 'rank-1' : ''}`;
        const medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : `${idx + 1}위`));
        li.innerHTML = `
          <div><span style="font-weight:bold; width:34px; display:inline-block;">${medal}</span> ${escapeHtml(r.nickname || '익명')}</div>
          <div><span style="color:#ffee00; font-weight:bold; font-size:13px;">${r.score}점</span> <span style="font-size:10px; color:#66ffcc;">STAGE ${r.stage || 1} / ${r.combo || 0}콤보</span></div>
        `;
        leaderboardList.appendChild(li);
      });
    }

    function closeLeaderboardModal() {
      leaderboardModal.style.display = 'none';
      if (isGameOver) {
        isWaitingRestart = true;
        setActionButtonState('RETRY');
      } else if (isGameStarted) {
        setPauseState(true);
        setActionButtonState('JUMP');
      } else {
        setActionButtonState('JUMP');
      }
    }

    function escapeHtml(str) {
      return str.replace(/[&<>'"]/g, tag => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
      }[tag] || tag));
    }


    function initializeBestRecord() {
    bestScore = parseInt(localStorage.getItem('jump_rope_cat_hiscore') || '0', 10);
    bestText.innerText = `(BEST: ${bestScore})`;
    }

    function saveBestRecord() {
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('jump_rope_cat_hiscore', bestScore);
        bestText.innerText = `(BEST: ${bestScore})`;
      }
    }

    function restoreNickname() {
      nicknameInput.value = localStorage.getItem('jump_rope_cat_last_nick') || '';
    }
