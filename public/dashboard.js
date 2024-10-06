import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 페이지에 표시할 게시물 수와 현재 페이지 번호
const postsPerPage = 2; // 한 페이지에 표시할 게시물 수
let currentPage = 1;

// 로그인된 사용자의 역할 확인 (관리자면 업로드 및 회원가입 버튼 보이기)
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        getDoc(docRef).then((docSnap) => {
            if (docSnap.exists()) {
                const userRole = docSnap.data().role;
                if (userRole === 'admin') {
                    document.getElementById('uploadBtn').style.display = 'block'; // 관리자에게만 업로드 버튼 표시
                    document.getElementById('signupBtn').style.display = 'block'; // 관리자에게만 회원가입 버튼 표시
                }
            }
        }).catch((error) => {
            console.error("역할 확인 오류:", error);
        });
    } else {
        window.location.href = '/login.html';  // 로그인되지 않은 경우 로그인 페이지로 이동
    }
});

// Firestore에서 게시물 가져오기
async function loadPosts(page) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));
        const totalPosts = querySnapshot.size; // 전체 게시물 수
        const startIndex = (page - 1) * postsPerPage; // 현재 페이지의 시작 인덱스
        const endIndex = Math.min(startIndex + postsPerPage, totalPosts); // 현재 페이지의 끝 인덱스

        // 게시물 목록을 페이지에 맞게 추가
        querySnapshot.forEach((doc, index) => {
            if (index >= startIndex && index < endIndex) {
                const postData = doc.data();
                const postElement = createPostElement(postData, doc.id);
                postList.appendChild(postElement);
            }
        });

        // 페이지 버튼 표시
        document.getElementById('prevBtn').style.display = page > 1 ? 'block' : 'none'; // 이전 버튼
        document.getElementById('nextBtn').style.display = endIndex < totalPosts ? 'block' : 'none'; // 다음 버튼
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 게시물 요소 생성 함수
function createPostElement(postData, postId) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');

    const img = document.createElement('img');
    img.src = postData.thumbnail || postData.media[0].url; // 썸네일이 있으면 썸네일 사용, 없으면 첫 번째 미디어 사용

    // 게시물 클릭 시 상세 페이지로 이동
    postDiv.addEventListener('click', () => {
        window.location.href = `/detail.html?postId=${postId}`; // 상세 페이지로 이동
    });

    postDiv.appendChild(img);

    return postDiv;
}

// 페이지 로드 시 게시물 불러오기
document.addEventListener('DOMContentLoaded', () => {
    loadPosts(currentPage);

    // 페이지 버튼 클릭 이벤트
    document.getElementById('prevBtn').addEventListener('click', () => {
        currentPage--;
        loadPosts(currentPage);
    });

    document.getElementById('nextBtn').addEventListener('click', () => {
        currentPage++;
        loadPosts(currentPage);
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

// 버튼 클릭 시 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload.html';  // 업로드 페이지로 이동
});

document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/signup.html';  // 회원가입 페이지로 이동
});
