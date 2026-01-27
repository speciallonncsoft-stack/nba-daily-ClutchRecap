const fs = require('fs');
const path = require('path');

async function updateNBAData() {
    try {
        // 1. 오늘 경기 목록 가져오기
        const sbUrl = 'https://cdn.nba.com/static/json/liveData/scoreboard/todaysScoreboard_00.json';
        const sbRes = await fetch(sbUrl);
        const sbData = await sbRes.json();
        const games = sbData.scoreboard.games;

        if (!games || games.length === 0) {
            console.log("오늘은 예정된 경기가 없습니다.");
            return;
        }

        // 2. 파일명 생성을 위한 날짜 추출 (첫 번째 경기의 날짜 기준)
        // NBA API 포맷은 "2026-01-27" 형태임
        const gameDate = games[0].gameDate; 
        
        const enrichedGames = [];

        for (const game of games) {
            const gameId = game.gameId;
            const boxUrl = `https://cdn.nba.com/static/json/liveData/boxscore/boxscore_${gameId}.json`;
            const pbpUrl = `https://cdn.nba.com/static/json/liveData/playbyplay/playbyplay_${gameId}.json`;

            try {
                const [boxRes, pbpRes] = await Promise.all([fetch(boxUrl), fetch(pbpUrl)]);
                const boxData = await boxRes.json();
                const pbpData = await pbpRes.json();

                enrichedGames.push({
                    summary: game,
                    boxscore: boxData.game,
                    pbp: pbpData.game
                });
            } catch (err) {
                console.error(`게임 ID ${gameId} 상세 데이터 수집 실패:`, err);
                // 상세 데이터 실패 시 기본 정보만이라도 저장
                enrichedGames.push({ summary: game, boxscore: null, pbp: null });
            }
        }

        // 3. [핵심 변경] 날짜별 JSON 파일 생성 (예: data/2026-01-27.json)
        // 폴더가 없으면 생성
        const dataDir = path.join(__dirname, 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir);
        }

        const fileName = `${gameDate}.json`;
        const filePath = path.join(dataDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(enrichedGames, null, 2));
        
        // 4. 최신 날짜를 가리키는 latest.json도 하나 생성 (초기 로딩용)
        fs.writeFileSync(path.join(dataDir, 'latest.json'), JSON.stringify({ date: gameDate }, null, 2));

        console.log(`[Success] ${fileName} 저장 완료!`);

    } catch (error) {
        console.error("데이터 업데이트 중 치명적 오류:", error);
        process.exit(1);
    }
}

updateNBAData();
