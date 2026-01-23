document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');

    // [Step 1]: 내러티브 생성 함수 (Raw Data -> Tag)
    function generateNarrative(game) {
        const tags = [];
        const summary = game.summary;
        
        // 1. 경기 양상 해석: 접전(Clutch) 판별
        const finalMargin = Math.abs(summary.homeTeam.score - summary.awayTeam.score);
        if (finalMargin <= 5) {
            tags.push("#심장쫄깃_접전");
        } else if (finalMargin >= 20) {
            tags.push("#일방적_완승");
        }

        // 2. 특이 기록 해석 (예: 역전극)
        // Note: pbp 데이터가 있을 경우 상세 로직 추가 가능
        return tags;
    }

    // [Step 2]: 선수 효율성(TS%) 계산 및 태그 생성
    function getPlayerHighlight(player) {
        const s = player.statistics;
        const ts = (s.points / (2 * (s.fieldGoalsAttempted + 0.44 * s.freeThrowsAttempted))) * 100;
        
        if (ts >= 75 && s.points >= 20) return "#효율끝판왕";
        if (s.points >= 30) return "#득점머신";
        return "";
    }

    // [Step 3]: 데이터 로드 및 렌더링
    async function loadDashboardData() {
        try {
            // fetch-nba.js가 생성하는 파일명으로 맞춤
            const response = await fetch('data/nba_data.json'); 
            if (!response.ok) throw new Error("Data not found");
            
            const data = await response.json();
            
            // 데이터 구조에 따른 날짜 표시 (첫 번째 경기의 날짜 활용)
            dateDisplay.textContent = new Date().toLocaleDateString();
            renderUI(data);
        } catch (error) {
            console.error("데이터 로드 실패:", error);
        }
    }

    function renderUI(games) {
        // 1. 경기 결과 내러티브 렌더링
        matchGrid.innerHTML = games.map(g => {
            const tags = generateNarrative(g);
            return `
                <div class="match-card">
                    <div class="match-header">
                        ${g.summary.gameStatusText} 
                        ${tags.map(t => `<span class="tag-sm">${t}</span>`).join('')}
                    </div>
                    <div class="match-content">
                        <strong>${g.summary.awayTeam.teamTricode} ${g.summary.awayTeam.score}</strong> vs 
                        <strong>${g.summary.homeTeam.teamTricode} ${g.summary.homeTeam.score}</strong>
                    </div>
                </div>
            `;
        }).join('');

        // 2. 주요 선수(Heroes) 추출 및 내러티브 렌더링
        // 각 팀의 최고 득점자 혹은 효율 상위자를 Hero로 선정
        const allPlayers = games.flatMap(g => 
            g.boxscore.homeTeam.players.concat(g.boxscore.awayTeam.players)
        ).filter(p => p.statistics.minutesPlayed !== "PT00M00.00S");

        const topHeroes = allPlayers
            .sort((a, b) => b.statistics.points - a.statistics.points)
            .slice(0, 3); // 상위 3명 추출

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

    loadDashboardData();
});
