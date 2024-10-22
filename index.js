const express = require('express');
const path = require('path');


const session = require('express-session'); // 세션 미들웨어 추가

// Express 애플리케이션 생성
const app = express();

// 세션 설정
app.use(session({
    secret: 'H4n$33zTG3d@8hZ7q', // 비밀 키
    resave: false,
    saveUninitialized: true,
}));

app.use(express.json());// JSON 본문 파싱 미들웨어 추가
// 인증된 사용자인지 확인하는 미들웨어
const checkAuth = (req, res, next) => {
    if (!req.session.userId) { // 세션에 userId가 없으면
        return res.sendFile(path.join(__dirname, 'public', 'login.html'));; // 홈으로 리다이렉트
    }
    next(); // 인증된 경우 다음 미들웨어로 진행
};

// 사용자 역할에 따른 권한 체크 미들웨어
const checkRole = (role) => {
    return (req, res, next) => {
        if (req.session.role === role) { // 세션에 저장된 역할과 비교
            //console.log(role);
            //console.log(req.session.role);
            next(); // 권한이 있는 경우 다음 미들웨어로 진행
            
        } else {
            return res.status(403).send('권한이 없습니다.'); // 권한 없음을 알림
        }
       
    };
};

// 특정 경로에서 HTML 파일을 직접 접근하지 못하도록 하는 미들웨어
app.use((req, res, next) => {
    if (req.originalUrl.includes('.html')) {
        if (req.originalUrl.includes('register.html') || req.originalUrl.includes('edit.html') || req.originalUrl.includes('upload.html')) {
            return checkAuth(req, res, () => checkRole('admin')(req, res, next)); // 인증 확인 후 admin 체크
        }
        return checkAuth(req, res, next); // 인증 확인
    }
    next();
});

// 포트 설정 (환경 변수에서 가져오거나 기본값 3000 사용)
const PORT = process.env.PORT || 3000;

// 정적 파일 제공 (public 폴더에서 CSS, JS, 이미지, HTML 제공)
app.use(express.static(path.join(__dirname, 'public')));

app.post('/api/handle-request', (req, res) => {
    const { action, userId ,role } = req.body;
    if (action === 'login') {
        // userId를 세션에 저장하는 로직
        req.session.userId = userId; // 세션에 userId 저장
        req.session.role = role; // 세션에 userId 저장
        res.status(200).json({ message: 'userId has been saved in the session.' });
    } else if (action === 'getClientIp') {
        // 클라이언트 IP 주소 반환 로직
        const ip = req.clientIp || req.headers['x-forwarded-for'] || req.connection.remoteAddress; // IP 주소 가져오기
        res.status(200).json({ ip }); // JSON 형식으로 IP 주소 반환
    } else if (action === 'getClientAgent') {
        // 클라이언트의 User-Agent 정보 반환 로직
        const userAgent = req.headers['user-agent']; // User-Agent 가져오기
        res.status(200).json({ userAgent }); // JSON 형식으로 User-Agent 반환
    }else if (action === 'logout') {
        // userId를 세션에서 제거하는 로직
        req.session.userId = null; // 세션에서 userId 제거
        res.status(200).json({ message: 'User has been logged out.' });
    } else {
        // 유효하지 않은 action 처리
        res.status(400).json({ error: 'Invalid action specified.' });
    }
});


// 기본 경로 요청 시 login.html 제공
app.get('/', checkAuth, (req, res) => {   
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html')); // userId가 있으면 dashboard.html
});

// 회원가입 페이지 요청 시 register.html 제공
app.get('/register', checkAuth, checkRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html')); // userId가 있으면 dashboard.html
});

// 대시보드 페이지 요청 시 dashboard.html 제공
app.get('/dashboard', checkAuth, (req, res) => {         
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// 게시물 업로드 페이지 요청 시 upload.html 제공
app.get('/upload',  checkAuth, checkRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'upload.html'));
});

// 게시물 상세 페이지 요청 시 detail.html 제공
app.get('/detail', checkAuth, (req, res) => {  
    res.sendFile(path.join(__dirname, 'public', 'detail.html')); 
});

// 게시물 수정 페이지 요청 시 edit.html 제공
app.get('/edit', checkAuth, checkRole('admin'), (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

// 특정 사용자 장바구니 보기
app.get('/log',  checkAuth, checkRole('admin'), async (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'log.html'));
});


// 서버 구동
app.listen(PORT, '0.0.0.0',() => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
