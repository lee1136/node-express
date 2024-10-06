import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let postsData = [];  // 전체 게시물 데이터를 저장할 배열

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

// 검색 입력 필드의 입력 변화 감지
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();  // 입력된 검색어
    filterPosts(searchTerm);  // 검색어에 따라 게시물 필터링
});

// 게시물 필터링 함수 (검색어에 따라 필터링)
function filterPosts(searchTerm) {
    const filteredPosts = postsData.filter(post => post.productNumber.includes(searchTerm));
    renderPosts(filteredPosts);  // 필터링된 게시물만 렌더링
}

// Firestore에서 게시물 가져오기
async function loadPosts() {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));
        postsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));  // 게시물 데이터를 배열에 저장
        renderPosts(postsData);  // 모든 게시물 초기 렌더링
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 게시물 목록을 렌더링하는 함수
function renderPosts(posts) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 기존 게시물 목록 초기화

    posts.forEach(postData => {
        const postElement = createPostElement(postData);
        postList.appendChild(postElement);
    });
}

// 게시물 요소 생성 함수
function createPostElement(postData) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');

    const img = document.createElement('img');
    img.src = postData.thumbnail || postData.media[0].url;  // 썸네일이 있으면 썸네일 사용, 없으면 첫 번째 미디어 사용
    img.alt = postData.productNumber;

    // 게시물 클릭 시 상세 페이지로 이동
    postDiv.addEventListener('click', () => {
        window.location.href = `/detail.html?postId=${postData.id}`;
    });

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

// 업로드 버튼 클릭 시 업로드 페이지로 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload.html';  // 업로드 페이지로 이동
});

// 회원가입 버튼 클릭 시 회원가입 페이지로 이동
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/signup.html';  // 회원가입 페이지로 이동
});
