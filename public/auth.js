import { auth } from "./firebase.js";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

// 로그인 처리
document.getElementById('loginForm').addEventListener('submit', (e) => {
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

// 회원가입 처리
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const userId = document.getElementById('userId').value;
    const password = document.getElementById('password').value;

    createUserWithEmailAndPassword(auth, userId, password)
        .then((userCredential) => {
            window.location.href = '/dashboard.html';
        })
        .catch((error) => {
            console.error("회원가입 오류:", error.message);
        });
});

// 로그아웃 처리
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = '/login.html';
    }).catch((error) => {
        console.error("로그아웃 오류:", error.message);
    });
});
