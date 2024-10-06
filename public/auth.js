import { auth, db } from "./firebase.js";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { setDoc, doc, getDocs, collection, updateDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 페이지가 로드되면 모든 회원 정보를 가져옴
document.addEventListener('DOMContentLoaded', async () => {
    const allUsersInfoDiv = document.getElementById('allUsersInfo');

    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        let userInfoHTML = '<h3>모든 회원 정보 (역할 수정 가능)</h3>';

        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            userInfoHTML += `
                <div>
                    <p>아이디: ${userData.email}</p>
                    <label for="role-${doc.id}">역할:</label>
                    <select id="role-${doc.id}">
                        <option value="member" ${userData.role === 'member' ? 'selected' : ''}>일반회원</option>
                        <option value="admin" ${userData.role === 'admin' ? 'selected' : ''}>관리자</option>
                    </select>
                    <button class="updateRoleBtn" data-user-id="${doc.id}">역할 수정</button>
                    <hr>
                </div>
            `;
        });

        allUsersInfoDiv.innerHTML = userInfoHTML;

        // 역할 수정 버튼 클릭 이벤트
        document.querySelectorAll('.updateRoleBtn').forEach(button => {
            button.addEventListener('click', async (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const newRole = document.getElementById(`role-${userId}`).value;

                try {
                    await updateDoc(doc(db, 'users', userId), {
                        role: newRole
                    });
                    alert('역할이 성공적으로 수정되었습니다.');
                } catch (error) {
                    console.error('역할 수정 오류:', error);
                    alert('역할 수정 중 오류가 발생했습니다.');
                }
            });
        });

    } catch (error) {
        console.error('회원 정보 불러오기 오류:', error);
        allUsersInfoDiv.innerHTML = '<p>회원 정보를 불러오는 중 오류가 발생했습니다.</p>';
    }

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

    // 로그인 처리
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userId = document.getElementById('userId').value;
            const password = document.getElementById('password').value;

            let email = convertToEmailFormat(userId);  // ID를 이메일 형식으로 변환

            try {
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                window.location.href = '/dashboard.html';  // 로그인 성공 후 대시보드로 이동
            } catch (error) {
                console.error('로그인 오류:', error);
                alert('로그인 실패: ' + error.message);
            }
        });
    }

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
