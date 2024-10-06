import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 로그인된 사용자의 역할 확인 (관리자면 업로드 버튼 보이기)
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        getDoc(docRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userRole = docSnap.data().role;
                if (userRole === 'admin') {
                    document.getElementById('uploadBtn').style.display = 'block'; // 관리자에게만 업로드 버튼 표시
                }
            }
        }).catch((error) => {
            console.error("역할 확인 오류:", error);
        });
    } else {
        window.location.href = '/login.html';  // 로그인되지 않은 경우 로그인 페이지로 이동
    }
});

// 업로드 버튼 클릭 시 업로드 페이지로 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload.html';  // 업로드 페이지로 이동
});

// Firestore에서 게시물 가져오기
async function loadPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));
        querySnapshot.forEach((doc) => {
            const postData = doc.data();
            const postElement = createPostElement(postData);
            postList.appendChild(postElement);
        });
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 게시물 요소 생성 함수
function createPostElement(postData) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');

    const img = document.createElement('img');
    img.src = postData.media[0].url;  // 첫 번째 미디어 파일을 게시물 썸네일로 사용
    img.alt = postData.media[0].fileName;

    postDiv.appendChild(img);

    return postDiv;
}

// 페이지 로드 시 게시물 불러오기
document.addEventListener('DOMContentLoaded', loadPosts);

// 로그아웃 처리
document.getElementById('logoutBtn').addEventListener('click', () => {
    signOut(auth).then(() => {
        window.location.href = '/login.html';
    }).catch((error) => {
        console.error("로그아웃 오류:", error.message);
    });
});
