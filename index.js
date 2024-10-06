const express = require('express');
const path = require('path');
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json'); // Firebase 서비스 계정 키 경로

// Firebase Admin SDK 초기화
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://your-database-name.firebaseio.com"  // Firebase 실시간 DB 또는 Firestore URL
});

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

// 사용자 삭제 API (관리자가 사용자 삭제 요청 시 호출)
app.delete('/deleteUser/:uid', async (req, res) => {
    const uid = req.params.uid;

    try {
        // Firebase Authentication에서 사용자 삭제
        await admin.auth().deleteUser(uid);
        res.status(200).send({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
        res.status(500).send({ message: '사용자 삭제 중 오류가 발생했습니다.', error });
    }
});

// 서버 구동
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
