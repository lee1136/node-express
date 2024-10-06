import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDocs, collection } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 페이지에 표시할 게시물 수와 현재 페이지 번호
const postsPerPage = 10; // 한 페이지에 표시할 게시물 수
let currentPage = 1;

// Firestore에서 게시물 가져오기
async function loadPosts(page) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));

        // Firestore에서 게시물을 제대로 가져오지 못했을 때
        if (querySnapshot.empty) {
            console.log("게시물이 없습니다.");
            postList.innerHTML = "<p>게시물이 없습니다.</p>";
            return;
        }

        const totalPosts = querySnapshot.size; // 전체 게시물 수
        const startIndex = (page - 1) * postsPerPage; // 현재 페이지의 시작 인덱스
        const endIndex = Math.min(startIndex + postsPerPage, totalPosts); // 현재 페이지의 끝 인덱스

        // 게시물 목록을 페이지에 맞게 추가
        querySnapshot.forEach((doc, index) => {
            if (index >= startIndex && index < endIndex) {
                const postData = doc.data();
                console.log("게시물 데이터:", postData);  // 게시물 데이터를 출력하여 확인

                if (!postData.media || postData.media.length === 0) {
                    console.error("media 필드가 비어있습니다:", postData);
                } else {
                    console.log("media 필드 확인:", postData.media);
                }

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

    // 이미지 URL 설정
    const img = document.createElement('img');
    if (postData.media && postData.media.length > 0 && postData.media[0].url) {
        img.src = postData.media[0].url; // media 배열의 첫 번째 이미지 사용
        console.log("이미지 URL:", img.src);
    } else {
        img.src = 'path/to/default-image.jpg'; // 이미지가 없을 경우 기본 이미지
        console.log("이미지 URL이 없습니다. 기본 이미지로 대체합니다.");
    }

    img.alt = postData.title || '게시물 이미지'; // 이미지 대체 텍스트 추가
    postDiv.appendChild(img); // 이미지 추가

    // 게시물 클릭 시 상세 페이지로 이동
    postDiv.addEventListener('click', () => {
        window.location.href = `/detail.html?postId=${postId}`; // 상세 페이지로 이동
    });

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

// 업로드 및 회원가입 버튼 클릭 시 페이지 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload.html'; // 업로드 페이지로 이동
});

document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/register.html'; // 회원가입 페이지로 이동
});
