document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');
    
    const prevBtn = document.querySelector('.date-nav-btn.prev');
    const nextBtn = document.querySelector('.date-nav-btn.next');

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

    // [Core] 스마트 데이터 로드 함수 (자동 보정 기능 포함)
    async function loadDashboardData(dateStr, isRetry = false) {
        try {
            // UI 초기화
            if (!isRetry) {
                dateDisplay.textContent = dateStr;
                heroGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center; padding:20px;">데이터 스캔 중...</div>';
                matchGrid.innerHTML = '';
            }

            // 파일 요청
            const response = await fetch(`data/${dateStr}.json`);
            
            if (!response.ok) {
                throw new Error("404 Not Found");
            }
            
            const games = await response.json();
            
            // 성공 시 날짜 확정 및 렌더링
            currentDate = parseDate(dateStr); 
            dateDisplay.textContent = dateStr; 
            renderUI(games);

        } catch (error) {
            // [핵심] 실패 시 하루 전 날짜로 딱 한 번 자동 재시도
            if (!isRetry) {
                console.log(`[Smart Retry] ${dateStr} 데이터 없음. 하루 전 데이터 검색...`);
                const yesterday = parseDate(dateStr);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = formatDateStr(yesterday);
                
                // 재귀 호출 (isRetry = true)
                await loadDashboardData(yesterdayStr, true);
                return;
            }

            // 재시도조차 실패했을 때 에러 표시
            console.warn("데이터 로드 최종 실패");
            heroGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 40px; color: #718096; background: white; border-radius: 12px;">
                <div style="font-size: 2rem; margin-bottom: 10px;">🏀</div>
                <h3>경기 데이터가 없습니다</h3>
                <p>${dateStr} 및 이전 날짜의 데이터를 찾을 수 없습니다.</p>
            </div>`;
            matchGrid.innerHTML = '';
        }
    }

    // [UI] 렌더링 로직 (이전과 동일)
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

// [UI] 렌더링 로직 (팀 엠블럼 + 승패 + 순위 추가)
    function renderUI(games) {
        // 1. 경기 결과 렌더링
        if (!games || games.length === 0) {
            matchGrid.innerHTML = '<div style="padding:20px;">경기 정보가 없습니다.</div>';
            return;
        }

        matchGrid.innerHTML = games.map(g => {
            const tags = generateNarrative(g);
            
            // 데이터 추출 (없을 경우를 대비해 안전하게 || 사용)
            const home = g.summary.homeTeam;
            const away = g.summary.awayTeam;

            // 로고 URL (NBA 공식 CDN)
            const homeLogo = `https://cdn.nba.com/logos/nba/${home.teamId}/global/L/logo.svg`;
            const awayLogo = `https://cdn.nba.com/logos/nba/${away.teamId}/global/L/logo.svg`;

            // 기록 (예: 35-10)
            const homeRec = home.wins !== undefined ? `${home.wins}승 ${home.losses}패` : '';
            const awayRec = away.wins !== undefined ? `${away.wins}승 ${away.losses}패` : '';

            // 순위 (데이터가 있으면 표시) - seed 정보가 없을 수도 있음
            // const homeRank = home.seed ? `<span class="rank-badge">#${home.seed}</span>` : '';
            // const awayRank = away.seed ? `<span class="rank-badge">#${away.seed}</span>` : '';

            return `
                <div class="match-card">
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

                        <div class="vs-divider">
                            <span>vs</span>
                        </div>

                        <div class="team-block">
                            <span class="score">${home.score}</span>
                            <div class="team-info" style="align-items: flex-end;">
                                <span class="team-code">${home.teamTricode}</span>
                                <span class="team-record">${homeRec}</span>
                            </div>
                            <img src="${homeLogo}" class="team-logo" alt="${home.teamTricode}">
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // 2. 히어로 렌더링 (이전 단계 2번 코드 유지)
        const allPlayers = games.flatMap(g => 
            (g.boxscore?.homeTeam?.players || []).concat(g.boxscore?.awayTeam?.players || [])
        ).filter(p => p && p.statistics && p.statistics.minutesPlayed !== "PT00M00.00S");

        const topHeroes = allPlayers
            .sort((a, b) => b.statistics.points - a.statistics.points)
            .slice(0, 3);

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

    // [Event] 버튼 핸들러
    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    // [Init] 초기 실행
    async function init() {
        // 1. latest.json 확인 시도
        try {
            const res = await fetch('data/latest.json');
            if (res.ok) {
                const data = await res.json();
                if (data.date) {
                    currentDate = parseDate(data.date);
                    loadDashboardData(data.date);
                    return;
                }
            }
        } catch (e) {
            console.log("Latest file not found");
        }
        
        // 2. 실패 시 오늘 날짜로 시도 (실패하면 loadDashboardData 내부에서 자동으로 어제로 넘어감)
        loadDashboardData(formatDateStr(new Date()));
    }

    init();
});
