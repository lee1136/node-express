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
                    window.location.href = '/dashboard.html';  // 로그인 성공 후 대시보드로 이동
                })
                .catch((error) => {
                    console.error("로그인 오류:", error.message);
                    alert('로그인 실패: ' + error.message);
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
            const role = document.getElementById('role').value;  // 관리자 또는 일반회원 선택

            let email = convertToEmailFormat(userId);  // ID를 이메일 형식으로 변환

            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    const user = userCredential.user;
                    // Firestore에 사용자 정보 저장 (선택된 역할 저장)
                    return setDoc(doc(db, "users", user.uid), {
                        email: user.email,
                        role: role  // 선택한 역할에 따라 관리자 또는 사용자로 설정
                    });
                })
                .then(() => {
                    window.location.href = '/dashboard.html';  // 회원가입 후 대시보드로 이동
                })
                .catch((error) => {
                    console.error("회원가입 오류:", error.message);
                    alert('회원가입 실패: ' + error.message);
                });
        });
    }

    // 페이지가 로드되면 기존 회원 정보를 가져옴
document.addEventListener('DOMContentLoaded', () => {
    const userInfoDiv = document.getElementById('userInfo');

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            try {
                const docRef = doc(db, "users", user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    userInfoDiv.innerHTML = `
                        <p>로그인된 사용자: ${userData.email}</p>
                        <p>역할: ${userData.role}</p>
                        <button id="logoutBtn">로그아웃</button>
                    `;
                    setupLogout();
                } else {
                    userInfoDiv.innerHTML = '<p>사용자 정보를 가져올 수 없습니다.</p>';
                }
            } catch (error) {
                console.error('회원 정보 불러오기 오류:', error);
                userInfoDiv.innerHTML = '<p>회원 정보를 불러오는 중 오류가 발생했습니다.</p>';
            }
        } else {
            userInfoDiv.innerHTML = '<p>로그인된 사용자가 없습니다.</p>';
        }
    });
});

    
    // 로그아웃 처리
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            signOut(auth).then(() => {
                window.location.href = '/login.html';  // 로그아웃 후 로그인 페이지로 이동
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
