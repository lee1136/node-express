import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.addEventListener('DOMContentLoaded', () => {
    // 로그인 처리
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;

            let email = convertToEmailFormat(userId);  // ID를 이메일 형식으로 변환

            signInWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    window.location.href = '/dashboard.html';
                })
                .catch((error) => {
                    console.error("로그인 오류:", error.message);
                });
        });
    }

    // 회원가입 처리
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;

            let email = convertToEmailFormat(userId);  // ID를 이메일 형식으로 변환

            // 이메일 형식 확인 (유효성 검사)
            if (!validateEmail(email)) {
                console.error("유효하지 않은 이메일 형식입니다.");
                return;
            }

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    window.location.href = '/dashboard.html';
                })
                .catch((error) => {
                    console.error("회원가입 오류:", error.message);
                });
        });
    }

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

// ID를 이메일 형식으로 변환하는 함수
function convertToEmailFormat(userId) {
    if (!userId.includes('@')) {
        return userId + '@example.com';  // 기본 도메인을 추가
    }
    return userId;
}

// 이메일 유효성 검사 함수
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;  // 간단한 이메일 형식 유효성 검사 정규식
    return re.test(String(email).toLowerCase());
}
