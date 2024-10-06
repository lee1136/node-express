const express = require('express');
const path = require('path');
// Express 애플리케이션 생성
const app = express();
// 포트 설정 (환경 변수에서 가져오거나 기본값 3000 사용)
const PORT = process.env.PORT || 3000;
// 정적 파일 제공 (public 폴더에서 CSS, JS, 이미지, HTML 제공)
app.use(express.static(path.join(__dirname, 'public')));
// 기본 경로 요청 시 login.html 제공
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});
// 회원가입 페이지
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});
// 대시보드 페이지
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});
// 서버 구동
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
