document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');
    
    // 네비게이션 버튼
    const prevBtn = document.querySelector('.date-nav-btn.prev');
    const nextBtn = document.querySelector('.date-nav-btn.next');

    // [핵심 수정] 안전한 날짜 초기화 (기본값: 오늘)
    let currentDate = new Date();

    // [Helper] 날짜를 YYYY-MM-DD 문자열로 변환 (NaN 방지 로직 추가)
    function formatDateStr(date) {
        if (!date || isNaN(date.getTime())) {
            // 날짜가 깨졌다면 오늘 날짜로 강제 복구
            date = new Date();
        }
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // [Helper] 문자열(YYYY-MM-DD)을 Date 객체로 안전하게 변환
    function parseDate(str) {
        if (!str) return new Date();
        const parts = str.split('-');
        if (parts.length !== 3) return new Date();
        // 월(Month)은 0부터 시작하므로 -1 해줌
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }

    // [Core] 데이터 로드 함수
    async function loadDashboardData(dateStr) {
        // 날짜 문자열 검증
        if (dateStr.includes('NaN')) {
            dateStr = formatDateStr(new Date()); // 오늘 날짜로 리셋
            currentDate = new Date();
        }

        try {
            // 로딩 표시
            dateDisplay.textContent = dateStr;
            heroGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px;">데이터를 불러오는 중...</div>';
            matchGrid.innerHTML = '';

            // 해당 날짜 파일 요청
            const response = await fetch(`data/${dateStr}.json`);
            
            if (!response.ok) {
                throw new Error("No data file");
            }
            
            const games = await response.json();
            renderUI(games);

        } catch (error) {
            console.warn(`[Data Load Error] ${dateStr}:`, error);
            heroGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #718096; background: white; border-radius: 12px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🏀</div>
                <h3>해당 날짜(${dateStr})의 경기가 없습니다</h3>
                <p>아직 경기가 시작되지 않았거나 데이터가 없습니다.</p>
            </div>`;
            matchGrid.innerHTML = '';
        }
    }

    // [Logic] UI 렌더링
    function generateNarrative(game) {
        const tags = [];
        const summary = game.summary;
        // 경기 종료(3) 상태일 때만 점수차 계산
        if (summary.gameStatus === 3) {
            const margin = Math.abs(summary.homeTeam.score - summary.awayTeam.score);
            if (margin <= 5) tags.push("#심장쫄깃_접전");
            else if (margin >= 20) tags.push("#일방적_완승");
            // 추가 로직: 역전승 등 (play-by-play 데이터 필요)
        }
        return tags;
    }

    function getPlayerHighlight(player) {
        const s = player.statistics;
        if (!s) return "";
        
        const pts = s.points;
        const ast = s.assists;
        const reb = s.reboundsTotal;

        if (pts >= 30) return "#득점머신";
        if (pts >= 20 && ast >= 10) return "#더블더블";
        if (pts >= 20 && reb >= 10) return "#골밑지배자";
        if (pts >= 20 && (s.threePointersMade / s.threePointersAttempted) >= 0.5) return "#고효율슈터";
        
        return "";
    }

    function renderUI(games) {
        // 1. 경기 결과 렌더링
        if (!games || games.length === 0) {
            matchGrid.innerHTML = '<div style="padding:20px;">경기 정보가 없습니다.</div>';
            return;
        }

        matchGrid.innerHTML = games.map(g => {
            const tags = generateNarrative(g);
            return `
                <div class="match-card">
                    <div class="match-header">
                        <span>${g.summary.gameStatusText}</span>
                        <div>${tags.map(t => `<span class="tag-sm">${t}</span>`).join('')}</div>
                    </div>
                    <div class="match-content">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span>${g.summary.awayTeam.teamTricode}</span>
                            <span style="font-size:1.4rem;">${g.summary.awayTeam.score}</span>
                        </div>
                        <span style="color:#cbd5e0; font-size: 0.9rem;">vs</span>
                        <div style="display:flex; align-items:center; gap:10px;">
                            <span style="font-size:1.4rem;">${g.summary.homeTeam.score}</span>
                            <span>${g.summary.homeTeam.teamTricode}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 2. 히어로 렌더링
        const allPlayers = games.flatMap(g => 
            (g.boxscore?.homeTeam?.players || []).concat(g.boxscore?.awayTeam?.players || [])
        ).filter(p => p && p.statistics && p.statistics.minutesPlayed !== "PT00M00.00S");

        const topHeroes = allPlayers
            .sort((a, b) => b.statistics.points - a.statistics.points)
            .slice(0, 3);

        heroGrid.innerHTML = topHeroes.map(h => {
            const highlightTag = getPlayerHighlight(h);
            return `
                <div class="player-card clutch-card">
                    <div class="clutch-badge">${highlightTag || 'MVP'}</div>
                    <h3>${h.familyName}</h3>
                    <div class="player-stats">
                        <span>${h.statistics.points} PTS</span> • 
                        <span>${h.statistics.reboundsTotal} REB</span> • 
                        <span>${h.statistics.assists} AST</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    // [Event] 날짜 이동 버튼
    prevBtn.addEventListener('click', () => {
        // 하루 전으로 이동
        currentDate.setDate(currentDate.getDate() - 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    nextBtn.addEventListener('click', () => {
        // 하루 후로 이동
        currentDate.setDate(currentDate.getDate() + 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    // [Init] 초기 실행
    async function init() {
        try {
            // 최신 데이터 날짜 확인
            const res = await fetch('data/latest.json');
            if (res.ok) {
                const data = await res.json();
                if (data.date) {
                    currentDate = parseDate(data.date); // 안전한 파싱 사용
                }
            }
        } catch (e) {
            console.log("Latest file not found, using today.");
        }
        // 에러가 나든 말든, currentDate(오늘 or 최신)로 로딩 시작
        loadDashboardData(formatDateStr(currentDate));
    }

    init();
});
