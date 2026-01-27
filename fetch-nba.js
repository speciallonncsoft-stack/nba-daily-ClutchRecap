// [최신 fetch-nba.js] 날짜별 파일 생성 로직
const fs = require('fs');
const path = require('path');

async function updateNBAData() {
    try {
        // 1. 데이터 가져오기
        const sbUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
        const sbRes = await fetch(sbUrl);
        const sbData = await sbRes.json();
        const games = sbData.scoreboard.games;

        if (!games || games.length === 0) {
            console.log("경기 없음");
            return;
        }

        const gameDate = games[0].gameDate; // 예: "2026-01-26"
        const enrichedGames = [];

        for (const game of games) {
            const gameId = game.gameId;
            const boxUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`;
            const pbpUrl = `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

            try {
                const [boxRes, pbpRes] = await Promise.all([fetch(boxUrl), fetch(pbpUrl)]);
                const boxData = await boxRes.json();
                const pbpData = await pbpRes.json();
                enrichedGames.push({ summary: game, boxscore: boxData.game, pbp: pbpData.game });
            } catch (e) {
                enrichedGames.push({ summary: game, boxscore: null, pbp: null });
            }
        }

        // 2. 저장 경로 설정
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        // [핵심] 날짜 이름으로 파일 저장
        const fileName = `${gameDate}.json`;
        fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(enrichedGames, null, 2));
        
        // [핵심] latest.json도 갱신
        fs.writeFileSync(path.join(dataDir, 'latest.json'), JSON.stringify({ date: gameDate }, null, 2));

        console.log(`저장 완료: ${fileName}`);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

updateNBAData();
