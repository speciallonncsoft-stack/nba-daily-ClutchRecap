// 1. 더미 데이터 (추후 API 연동 시 이 구조를 유지하거나 매핑 필요)
const gamesData = [
    { id: "0022500659", home: "ATL", away: "IND", hScore: 110, aScore: 112, status: "Final" },
    { id: "0022500660", home: "BOS", away: "MIA", hScore: 98, aScore: 95, status: "Final" },
    { id: "0022500661", home: "LAL", away: "GSW", hScore: 120, aScore: 125, status: "OT" },
    { id: "0022500662", home: "NYK", away: "BKN", hScore: 105, aScore: 100, status: "Final" }
];

// 2. [기능] NBA 박스스코어 새 창 열기
function openNbaBoxScore(gameId, homeTeam, awayTeam) {
    if (!gameId || !homeTeam || !awayTeam) return;

    const h = homeTeam.toLowerCase();
    const a = awayTeam.toLowerCase();
    // URL 생성 규칙 준수
    const url = `https://www.nba.com/game/${a}-vs-${h}-${gameId}/box-score`;

    // 팝업 옵션 (화면 중앙 정렬)
    const w = 1280;
    const hg = 900;
    const left = (window.screen.width - w) / 2;
    const top = (window.screen.height - hg) / 2;
    
    window.open(url, `nba_win_${gameId}`, `width=${w},height=${hg},top=${top},left=${left},scrollbars=yes,resizable=yes`);
}

// 3. [렌더링] 게임 리스트 생성 및 이벤트 바인딩
function renderGames() {
    const grid = document.getElementById('matchGrid');
    if (!grid) return; // HTML에 해당 ID가 없으면 중단

    grid.innerHTML = ''; // 초기화

    gamesData.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        // 카드 내부 HTML 구조 (CSS 클래스와 매칭)
        card.innerHTML = `
            <div class="match-header">
                <span class="status">${game.status}</span>
                <span class="game-id">ID: ${game.id.slice(-4)}</span>
            </div>
            <div class="match-content">
                <div class="team-group">
                    <span class="team-name">${game.away}</span>
                    <span class="team-score">${game.aScore}</span>
                </div>
                <span class="vs-badge">VS</span>
                <div class="team-group">
                    <span class="team-name">${game.home}</span>
                    <span class="team-score">${game.hScore}</span>
                </div>
            </div>
        `;

        // 클릭 이벤트 리스너 추가 (팝업 함수 호출)
        card.addEventListener('click', () => {
            openNbaBoxScore(game.id, game.home, game.away);
        });

        grid.appendChild(card);
    });
}

// 4. 실행 (DOM 로드 후)
document.addEventListener('DOMContentLoaded', () => {
    renderGames();
    
    // 날짜 표시 (헤더 부분)
    const dateEl = document.getElementById('dateDisplay');
    if(dateEl) dateEl.textContent = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
});
