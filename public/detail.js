import { auth, db } from "./firebase.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
document.getElementById('backBtn').addEventListener('click', () => {
    window.history.back();  // 이전 페이지로 이동
});

// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const postId = urlParams.get('postId');  // postId 파라미터 가져오기

// 게시물 상세 정보 불러오기
async function loadPostDetail() {
    const postDetail = document.getElementById('postDetail');

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();
            // 상세 정보 표시
            postDetail.innerHTML = `
                <h2>${postData.productNumber}</h2>
                <img src="${postData.thumbnail}" alt="${postData.productNumber}">
                <p>종류: ${postData.type}</p>
                <p>사이즈: ${postData.size}</p>
                <p>중량: ${postData.weight}</p>
                <p>추가 내용: ${postData.additionalContent}</p>
            `;
        } else {
            postDetail.innerHTML = '<p>게시물을 찾을 수 없습니다.</p>';
        }
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
        postDetail.innerHTML = '<p>게시물 정보를 불러오는 데 오류가 발생했습니다.</p>';
    }
}

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);
