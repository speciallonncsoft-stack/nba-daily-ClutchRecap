document.addEventListener('DOMContentLoaded', () => {
    const heroGrid = document.getElementById('heroGrid');
    const matchGrid = document.getElementById('matchGrid');
    const dateDisplay = document.getElementById('dateDisplay');

    // [핵심]: 깃허브 액션이 생성한 JSON 파일을 가져옵니다.
    async function loadDashboardData() {
        try {
            // 외부 API가 아닌 내 저장소의 파일을 읽음 (CORS 문제 없음)
            const response = await fetch('data/latest.json'); 
            if (!response.ok) throw new Error("Data not found");
            
            const data = await response.json();
            
            dateDisplay.textContent = data.date || "2026-01-21";
            renderUI(data);
        } catch (error) {
            console.error("Failed to load data, using fallback.", error);
            // 데이터가 아직 없을 경우를 대비한 Mock 데이터 처리 로직 필요
        }
    }

    function renderUI(data) {
        // MVP 히어로 렌더링
        heroGrid.innerHTML = data.heroes.map(h => `
            <div class="player-card clutch-card">
                <div class="clutch-badge">CLUTCH</div>
                <h3>${h.name}</h3>
                <div class="player-stats">
                    <span>${h.pts} PTS</span> • <span>${h.reb} REB</span> • <span>${h.ast} AST</span>
                </div>
            </div>
        `).join('');

        // 경기 결과 렌더링
        matchGrid.innerHTML = data.games.map(g => `
            <div class="match-card">
                <div class="match-header">${g.gameStatusText}</div>
                <div class="match-content">
                    <strong>${g.awayTeam.teamTricode} ${g.awayTeam.score}</strong> vs 
                    <strong>${g.homeTeam.teamTricode} ${g.homeTeam.score}</strong>
                </div>
            </div>
        `).join('');
    }

    loadDashboardData();
});
