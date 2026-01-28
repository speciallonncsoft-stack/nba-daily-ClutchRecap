// 1. 더미 데이터 (Dummy Data)
const gamesData = [
    {
        gameId: "0022500659",
        homeTeam: "ATL", awayTeam: "IND",
        homeScore: 110, awayScore: 112,
        status: "Final"
    },
    {
        gameId: "0022500660",
        homeTeam: "BOS", awayTeam: "MIA",
        homeScore: 98, awayScore: 95,
        status: "Final"
    },
    {
        gameId: "0022500661",
        homeTeam: "LAL", awayTeam: "GSW",
        homeScore: 120, awayScore: 125,
        status: "OT"
    }
];

// 2. 날짜 표시
document.addEventListener('DOMContentLoaded', () => {
    const dateEl = document.getElementById('dateDisplay');
    if (dateEl) {
        dateEl.textContent = new Date().toLocaleDateString('en-US', { 
            weekday: 'short', month: 'long', day: 'numeric' 
        });
    }

    renderGameList();
    renderHeroList(); // Hero 섹션용 (비어있음)
});

// 3. 경기 리스트 렌더링
function renderGameList() {
    const grid = document.getElementById('matchGrid');
    if (!grid) return;

    grid.innerHTML = '';

    gamesData.forEach(game => {
        const card = document.createElement('div');
        card.className = 'game-card';

        card.innerHTML = `
            <div class="match-info">
                <span class="status">${game.status}</span>
                <span class="time">Today</span>
            </div>
            <div class="teams-container">
                <div class="team">
                    <span class="name">${game.awayTeam}</span>
                    <span class="score">${game.awayScore}</span>
                </div>
                <div class="vs-divider">@</div>
                <div class="team">
                    <span class="name">${game.homeTeam}</span>
                    <span class="score">${game.homeScore}</span>
                </div>
            </div>
        `;

        // (옵션) 기존 모달 열기 로직 자리
        card.addEventListener('click', () => {
            console.log(`Clicked game: ${game.gameId}`);
            // 여기에 나중에 기능을 연결합니다.
        });

        grid.appendChild(card);
    });
}

// 4. Hero 리스트 렌더링 (플레이스홀더)
function renderHeroList() {
    const grid = document.getElementById('heroGrid');
    if(!grid) return;
    grid.innerHTML = '<div style="color:#999; padding:10px;">No Hero data yet...</div>';
}
