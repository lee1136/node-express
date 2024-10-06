import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// 문서가 완전히 로드된 후 실행
document.addEventListener('DOMContentLoaded', () => {
    // 로그인 처리
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            
            signInWithEmailAndPassword(auth, userId, password)
                .then((userCredential) => {
                    window.location.href = '/dashboard.html';
                })
                .catch((error) => {
                    console.error("로그인 오류:", error.message);
                });
        });
    }

    document.addEventListener('DOMContentLoaded', () => {
    // 회원가입 처리
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            let userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;

            // 유효한 이메일 형식으로 변환 (ID를 이메일처럼 사용)
            if (!userId.includes('@')) {
                userId += '@example.com'; // ID에 기본 도메인 추가
            }

            createUserWithEmailAndPassword(auth, userId, password)
                .then((userCredential) => {
                    window.location.href = '/dashboard.html';
                })
                .catch((error) => {
                    console.error("회원가입 오류:", error.message);
                });
        });
    }
});

    
    // 로그아웃 처리
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = '/login.html';
            }).catch((error) => {
                console.error("로그아웃 오류:", error.message);
            });
        });
    }
});
