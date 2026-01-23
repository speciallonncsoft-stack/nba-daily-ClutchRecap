const fetch = require('node-fetch');
const fs = require('fs');

async function updateData() {
    const nbaUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
    try {
        const response = await fetch(nbaUrl);
        const data = await response.json();
        const games = data.scoreboard.games;
        const dateStr = new Date().toISOString().split('T')[0];

        const heroes = [];
        games.forEach(game => {
            const leaders = [game.gameLeaders.homeLeaders, game.gameLeaders.awayLeaders];
            leaders.forEach(l => {
                // [Clutch Algorithm]: PTS 40+ 또는 트리플더블 등
                if (l.points >= 40 || (l.points >= 10 && l.rebounds >= 10 && l.assists >= 10)) {
                    heroes.push({ name: `${l.firstName} ${l.lastName}`, pts: l.points, reb: l.rebounds, ast: l.assists });
                }
            });
        });

        const result = { date: dateStr, heroes, games };
        if (!fs.existsSync('data')) fs.mkdirSync('data');
        fs.writeFileSync(`data/${dateStr}.json`, JSON.stringify(result, null, 2));
        fs.writeFileSync('data/latest.json', JSON.stringify(result, null, 2));
    } catch (e) { console.error(e); }
}
updateData();
