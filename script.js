document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');
    
    // 네비게이션 버튼 (HTML 클래스 기반 선택)
    const prevBtn = document.querySelector('.date-nav-btn.prev');
    const nextBtn = document.querySelector('.date-nav-btn.next');

    // 현재 보고 있는 날짜 (초기값: 오늘)
    let currentDate = new Date();

    // [Helper] 날짜를 YYYY-MM-DD 문자열로 변환
    function formatDateStr(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // [Core] 데이터 로드 함수
    async function loadDashboardData(dateStr) {
        try {
            // 로딩 표시
            dateDisplay.textContent = "Loading...";
            heroGrid.innerHTML = '<div style="grid-column: 1/-1; text-align:center;">데이터를 불러오는 중...</div>';
            matchGrid.innerHTML = '';

            // 1. 해당 날짜 파일 요청 (예: data/2026-01-27.json)
            const response = await fetch(`data/${dateStr}.json`);
            
            if (!response.ok) {
                throw new Error("No data");
            }
            
            const games = await response.json();
            
            // UI 업데이트
            dateDisplay.textContent = dateStr; // 상단 날짜 갱신
            renderUI(games);

        } catch (error) {
            console.warn(error);
            dateDisplay.textContent = dateStr;
            heroGrid.innerHTML = `<div style="grid-column: 1/-1; text-align:center; padding: 20px; color: #718096;">
                해당 날짜(${dateStr})의 경기 데이터가 없습니다.<br>
                (아직 경기가 없거나 데이터가 수집되지 않았습니다.)
            </div>`;
            matchGrid.innerHTML = '';
        }
    }

    // [Logic] 내러티브 및 렌더링 (기존 유지 + 보완)
    function generateNarrative(game) {
        const tags = [];
        const summary = game.summary;
        const margin = Math.abs(summary.homeTeam.score - summary.awayTeam.score);

        if (summary.gameStatus === 3) { // 종료된 경기
            if (margin <= 5) tags.push("#심장쫄깃_접전");
            else if (margin >= 20) tags.push("#일방적_완승");
        }
        
        // 역전승 로직 등 추가 가능
        return tags;
    }

    function getPlayerHighlight(player) {
        const s = player.statistics;
        const pts = s.points;
        // 간단한 로직 예시
        if (pts >= 30) return "#득점머신";
        if (pts >= 20 && s.assists >= 10) return "#더블더블";
        return "";
    }

    function renderUI(games) {
        // 1. 경기 결과 렌더링
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
                        <span style="color:#cbd5e0;">vs</span>
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

    // [Event] 버튼 클릭 리스너
    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    nextBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 1);
        loadDashboardData(formatDateStr(currentDate));
    });

    // [Init] 초기 실행: 최신 데이터 날짜 확인 후 로드
    async function init() {
        try {
            // latest.json을 먼저 읽어 가장 최신 데이터 날짜를 파악
            const res = await fetch('data/latest.json');
            if (res.ok) {
                const data = await res.json();
                // latest.json에 기록된 날짜로 currentDate 설정
                currentDate = new Date(data.date);
                loadDashboardData(data.date);
            } else {
                // fallback: 오늘 날짜로 시도
                loadDashboardData(formatDateStr(currentDate));
            }
        } catch (e) {
            loadDashboardData(formatDateStr(currentDate));
        }
    }

    init();
});
