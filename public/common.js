// 우클릭 방지
document.addEventListener('contextmenu', function (e) {
    e.preventDefault();
});


// PrintScreen, Ctrl+S, Ctrl+P 등의 단축키 방지
document.addEventListener('keydown', function (e) {
    // PrintScreen 방지
    if (e.key === 'PrintScreen') {
        alert("캡처는 허용되지 않습니다!");
        e.preventDefault();
    }
    
    // Ctrl+S (저장 방지)
    if ((e.ctrlKey && e.key === 's') || (e.ctrlKey && e.key === 'S')) {
        alert("페이지 저장이 허용되지 않습니다.");
        e.preventDefault();
    }

    // Ctrl+P (인쇄 방지)
    if ((e.ctrlKey && e.key === 'p') || (e.ctrlKey && e.key === 'P')) {
        alert("페이지 인쇄가 허용되지 않습니다.");
        e.preventDefault();
    }
});


// 로그아웃 처리
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('userId');  // 세션에서 로그인 정보 제거
            // 서버에 userId를 POST 요청으로 전송
            fetch('/api/handle-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'logout', // action에 logout지정                               
                })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';  // 로그인 후 대시보드로 이동
                } else {
                    console.error('Failed to set userId on server.');
                }
            })
            .catch(error => console.error('Error:', error));    
        window.location.href = '/';  // 로그아웃 후 메인 페이지로 이동
    });
}

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
if (document.getElementById('backBtn')) {
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/dashboard.html';  // 홈(dashboard.html)으로 이동
    });
}
