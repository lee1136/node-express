import { auth, db } from "./firebase.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

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
    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();
            // 폼 필드에 값 설정
            document.getElementById('productNumber').value = postData.productNumber;
            document.getElementById('type').value = postData.type;
            document.getElementById('size').value = postData.size.split(' ')[0];
            document.getElementById('sizeUnit').value = postData.size.split(' ')[1];
            document.getElementById('weight').value = postData.weight.replace('g', '');
            document.getElementById('additionalContent').value = postData.additionalContent;
        } else {
            alert('게시물을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 수정 완료 버튼 클릭 시 수정된 데이터 저장
document.getElementById('editForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const productNumber = document.getElementById('productNumber').value;
    const type = document.getElementById('type').value;
    const size = `${document.getElementById('size').value} ${document.getElementById('sizeUnit').value}`;
    const weight = `${document.getElementById('weight').value}g`;
    const additionalContent = document.getElementById('additionalContent').value;

    // Firestore에 수정된 데이터 저장
    setDoc(doc(db, "posts", postId), {
        productNumber,
        type,
        size,
        weight,
        additionalContent,
    }).then(() => {
        alert('게시물이 수정되었습니다.');
        window.location.href = '/detail.html?postId=' + postId; // 수정 완료 후 상세 페이지로 이동
    }).catch(error => {
        console.error("게시물 수정 중 오류:", error);
    });
});

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);
