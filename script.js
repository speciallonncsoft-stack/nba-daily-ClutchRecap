document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');
    
    const prevBtn = document.querySelector('.date-nav-btn.prev');
    const nextBtn = document.querySelector('.date-nav-btn.next');

    // 현재 선택된 날짜
    let currentDate = new Date();

    // [Helper] 날짜 포맷 (YYYY-MM-DD)
    function formatDateStr(date) {
        if (!date || isNaN(date.getTime())) date = new Date();
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // [Helper] 문자열 -> Date 객체
    function parseDate(str) {
        if (!str) return new Date();
        const parts = str.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    // [New Feature] NBA 박스스코어 팝업 열기 함수
    function openNbaBoxScore(gameId, homeTeam, awayTeam) {
        if (!gameId || !homeTeam || !awayTeam) return;
        
        const h = homeTeam.toLowerCase();
        const a = awayTeam.toLowerCase();
        // NBA.com URL 패턴
        const url = `https://www.nba.com/game/${a}-vs-${h}-${gameId}/box-score`;

        // 팝업 중앙 정렬 옵션
        const w = 1200;
        const hg = 900;
        const left = (window.screen.width - w) / 2;
        const top = (window.screen.height - hg) / 2;

        window.open(url, `nba_popup_${gameId}`, `width=${w},height=${hg},top=${top},left=${left},resizable=yes,scrollbars=yes`);
    }

    // [Core] 데이터 로드 함수
    async function loadDashboardData(dateStr) {
        try {
            // UI 초기화: 날짜는 즉시 변경하여 반응성 향상
            dateDisplay.textContent = dateStr;
            currentDate = parseDate(dateStr); // 상태 동기화
            
            heroGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:40px;">데이터 불러오는 중...</div>';
            matchGrid.innerHTML = '';

            // 파일 요청
            const response = await fetch(`data/${dateStr}.json`);
            
            if (!response.ok) {
                throw new Error("Data not found");
            }
            
            const games = await response.json();
            renderUI(games);

        } catch (error) {
            console.log(`No data for ${dateStr}`);
            
            heroGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #718096; background: white; border-radius: 12px; border: 1px dashed #cbd5e0;">
                <div style="font-size: 2rem; margin-bottom: 10px;">📅</div>
                <h3>경기 데이터가 없습니다</h3>
                <p>${dateStr}에는 저장된 경기가 없습니다.</p>
            </div>`;
            matchGrid.innerHTML = '';
        }
    }

    // [UI] 렌더링 로직 (수정됨: 클릭 이벤트 추가를 위해 DOM 생성 방식으로 변경)
    function renderUI(games) {
        // 1. 경기 리스트 렌더링
        matchGrid.innerHTML = ''; // 초기화

        if (!games || games.length === 0) {
            matchGrid.innerHTML = '<div style="padding:20px;">경기 정보가 없습니다.</div>';
        } else {
            games.forEach(g => {
                // 데이터 추출
                const tags = generateNarrative(g);
                const home = g.summary.homeTeam;
                const away = g.summary.awayTeam;
                const homeLogo = `https://cdn.nba.com/logos/nba/${home.teamId}/global/L/logo.svg`;
                const awayLogo = `https://cdn.nba.com/logos/nba/${away.teamId}/global/L/logo.svg`;
                const homeRec = home.wins !== undefined ? `${home.wins}승 ${home.losses}패` : '';
                const awayRec = away.wins !== undefined ? `${away.wins}승 ${away.losses}패` : '';

                // 요소 생성 (클릭 이벤트를 달기 위해 createElement 사용)
                const card = document.createElement('div');
                card.className = 'match-card';
                // 커서 스타일 추가 (클릭 가능함을 시각적으로 표시)
                card.style.cursor = 'pointer'; 

                // 내부 HTML 구성 (기존 템플릿 유지)
                card.innerHTML = `
                    <div class="match-header">
                        <span style="font-weight:600; font-size: 0.8rem;">${g.summary.gameStatusText}</span>
                        <div style="display:flex; gap:5px;">${tags.map(t => `<span class="tag-sm">${t}</span>`).join('')}</div>
                    </div>
                    <div class="match-content-grid">
                        <div class="team-block">
                            <img src="${awayLogo}" class="team-logo" alt="${away.teamTricode}">
                            <div class="team-info">
                                <span class="team-code">${away.teamTricode}</span>
                                <span class="team-record">${awayRec}</span>
                            </div>
                            <span class="score">${away.score}</span>
                        </div>
                        <div class="vs-divider"><span>vs</span></div>
                        <div class="team-block">
                            <span class="score">${home.score}</span>
                            <div class="team-info" style="align-items: flex-end;">
                                <span class="team-code">${home.teamTricode}</span>
                                <span class="team-record">${homeRec}</span>
                            </div>
                            <img src="${homeLogo}" class="team-logo" alt="${home.teamTricode}">
                        </div>
                    </div>
                `;

                // [핵심] 클릭 이벤트 리스너 연결
                card.addEventListener('click', () => {
                    openNbaBoxScore(g.gameId, home.teamTricode, away.teamTricode);
                });

                matchGrid.appendChild(card);
            });
        }

        // 2. Hero 리스트 렌더링 (기존 로직 유지)
        const allPlayers = games.flatMap(g => 
            (g.boxscore?.homeTeam?.players || []).concat(g.boxscore?.awayTeam?.players || [])
        ).filter(p => p && p.statistics && p.statistics.minutesPlayed !== "PT00M00.00S");

        const topHeroes = allPlayers.sort((a, b) => b.statistics.points - a.statistics.points).slice(0, 3);

        heroGrid.innerHTML = topHeroes.map(h => {
            const highlightTag = getPlayerHighlight(h);
            const imgUrl = `https://cdn.nba.com/headshots/nba/latest/1040x760/${h.personId}.png`;
            return `
                <div class="player-card clutch-card">
                    <div class="clutch-badge">${highlightTag || 'MVP'}</div>
                    <div class="player-img-wrapper">
                        <img src="${imgUrl}" alt="${h.familyName}" onerror="this.style.display='none'">
                    </div>
                    <div class="player-info">
                        <h3>${h.familyName} <small>${h.firstName}</small></h3>
                        <div class="player-stats">
                            <span>${h.statistics.points} PTS</span> • 
                            <span>${h.statistics.reboundsTotal} REB</span> • 
                            <span>${h.statistics.assists} AST</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    function generateNarrative(game) {
        const tags = [];
        const summary = game.summary;
        if (summary.gameStatus === 3) {
            const margin = Math.abs(summary.homeTeam.score - summary.awayTeam.score);
            if (margin <= 5) tags.push("#심장쫄깃_접전");
            else if (margin >= 20) tags.push("#일방적_완승");
        }
        return tags;
    }

    function getPlayerHighlight(player) {
        if (!player || !player.statistics) return "";
        const s = player.statistics;
        const pts = s.points;
        const ast = s.assists;
        const reb = s.reboundsTotal;
        if (pts >= 30) return "#득점머신";
        if (pts >= 20 && ast >= 10) return "#더블더블";
        if (pts >= 20 && reb >= 10) return "#골밑지배자";
        if (pts >= 20 && (s.threePointersMade / s.threePointersAttempted) >= 0.5) return "#고효율슈터";
        return "";
    }

    // [Event] 버튼 핸들러
    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    // [Init] 초기 실행: Latest 파일 확인
    async function init() {
        try {
            const res = await fetch('data/latest.json');
            if (res.ok) {
                const data = await res.json();
                if (data.date) {
                    console.log(`Latest data found: ${data.date}`);
                    loadDashboardData(data.date);
                    return; // 성공 시 종료
                }
            }
        } catch (e) {
            console.warn("Latest file not found, defaulting to today.");
        }
        // 실패 시 오늘 날짜로 시도
        loadDashboardData(formatDateStr(new Date()));
    }

    init();
});
