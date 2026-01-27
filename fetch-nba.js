// [최신] fetch-nba.js (날짜 위치 수정판)
const fs = require('fs');
const path = require('path');

async function updateNBAData() {
    try {
        // 1. 데이터 가져오기
        const sbUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
        const sbRes = await fetch(sbUrl);
        const sbData = await sbRes.json();
        const games = sbData.scoreboard.games;

        // 경기가 없는 경우 처리
        if (!games || games.length === 0) {
            console.log("예정된 경기가 없습니다.");
            return;
        }

        // [핵심 수정] 날짜 정보 위치 변경 (games[0] 내부가 아니라 scoreboard 바로 아래에 있음)
        const gameDate = sbData.scoreboard.gameDate; 
        console.log(`감지된 경기 날짜: ${gameDate}`); // 로그로 날짜 확인

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
                console.warn(`상세 데이터 수집 실패 (${gameId}):`, e);
                enrichedGames.push({ summary: game, boxscore: null, pbp: null });
            }
        }

        // 2. 저장 경로 설정
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

        // [핵심] 올바른 날짜 이름으로 파일 저장
        const fileName = `${gameDate}.json`;
        fs.writeFileSync(path.join(dataDir, fileName), JSON.stringify(enrichedGames, null, 2));
        
        // [핵심] latest.json도 갱신
        fs.writeFileSync(path.join(dataDir, 'latest.json'), JSON.stringify({ date: gameDate }, null, 2));

        console.log(`[Success] 파일 저장 완료: ${fileName}`);

    } catch (error) {
        console.error("Error:", error);
        process.exit(1);
    }
}

updateNBAData();
