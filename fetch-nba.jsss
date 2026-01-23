// fetch-nba.js
const fs = require('fs');
const path = require('path');

async function updateNBAData() {
    try {
        // 1. 오늘 경기 목록(Scoreboard) 가져오기
        const sbUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
        const sbRes = await fetch(sbUrl);
        const sbData = await sbRes.json();
        const games = sbData.scoreboard.games;

        const enrichedGames = [];

        for (const game of games) {
            const gameId = game.gameId;
            // 2. 각 경기의 박스스코어(선수 효율성용)와 플레이바이플레이(경기 양상용) 추가 수집
            const boxUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`;
            const pbpUrl = `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

            const [boxRes, pbpRes] = await Promise.all([fetch(boxUrl), fetch(pbpUrl)]);
            const boxData = await boxRes.json();
            const pbpData = await pbpRes.json();

            enrichedGames.push({
                summary: game,           // 기본 점수 정보
                boxscore: boxData.game,  // 선수별 상세 기록
                pbp: pbpData.game        // 경기 흐름 기록
            });
        }

        // 3. data 폴더에 '내러티브용 통합 데이터' 저장
        const dataPath = path.join(__dirname, 'data', 'nba_data.json');
        fs.writeFileSync(dataPath, JSON.stringify(enrichedGames, null, 2));
        console.log("데이터 업데이트 완료!");

    } catch (error) {
        console.error("데이터 수집 중 오류:", error);
    }
}

updateNBAData();
