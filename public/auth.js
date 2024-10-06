import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Firestore에 사용자 정보 및 역할(role)을 저장
                    return setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: 'user'  // 기본적으로 일반 사용자로 설정
                    });
                })
                .then(() => {
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
