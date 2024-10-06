import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDocs, collection, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";  // doc과 getDoc 추가

// 페이지에 표시할 게시물 수와 현재 페이지 번호
const postsPerPage = 10; // 한 페이지에 표시할 게시물 수
let currentPage = 1;

// Firestore에서 게시물 가져오기
async function loadPosts(page) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화
    console.log('Firestore에서 데이터 가져오기 시작...');

    try {
        const querySnapshot = await getDocs(collection(db, 'posts'));

        if (querySnapshot.empty) {
            console.log("게시물이 없습니다.");
            postList.innerHTML = "<p>게시물이 없습니다.</p>";
            return;
        }

        console.log(`총 ${querySnapshot.size}개의 게시물이 있습니다.`); // 데이터가 제대로 가져와지는지 확인
        const totalPosts = querySnapshot.size;
        const startIndex = (page - 1) * postsPerPage;
        const endIndex = Math.min(startIndex + postsPerPage, totalPosts);

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
                console.log("게시물 요소가 추가되었습니다."); // HTML 요소가 추가되었는지 확인
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
    console.log("페이지가 로드되었습니다.");
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
