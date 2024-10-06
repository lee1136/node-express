import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { setDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

    // 회원가입 처리
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;  // 관리자 또는 일반회원 선택

            let email = convertToEmailFormat(userId);  // ID를 이메일 형식으로 변환

            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;

                // Firestore에 사용자 정보 저장
                await setDoc(doc(db, 'users', user.uid), {
                    email: user.email,
                    role: role  // 선택한 역할 저장
                });

                alert('회원가입이 완료되었습니다.');
                window.location.href = '/dashboard.html';  // 회원가입 후 대시보드로 이동
            } catch (error) {
                console.error('회원가입 오류:', error);
                alert('회원가입 실패: ' + error.message);
            }
        });
    }
});

// 로그아웃 처리
function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    logoutBtn.addEventListener('click', () => {
        signOut(auth).then(() => {
            window.location.href = '/login.html';  // 로그아웃 후 로그인 페이지로 이동
        }).catch((error) => {
            console.error("로그아웃 오류:", error.message);
        });
    });
}

// ID를 이메일 형식으로 변환하는 함수
function convertToEmailFormat(userId) {
    if (!userId.includes('@')) {
        return userId + '@example.com';  // 기본 도메인을 추가
    }
    return userId;
}
