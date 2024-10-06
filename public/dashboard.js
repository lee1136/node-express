import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
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

// 게시물 업로드 모달 열기
document.getElementById('uploadBtn').addEventListener('click', () => {
    document.getElementById('uploadModal').style.display = 'block';
});

// 파일 업로드 및 Firestore에 게시물 저장
document.getElementById('uploadForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const files = document.getElementById('fileInput').files;
    const uploadPromises = [];

    Array.from(files).forEach(file => {
        const storageRef = ref(storage, 'uploads/' + file.name);
        const uploadTask = uploadBytes(storageRef, file).then(snapshot => {
            return getDownloadURL(snapshot.ref).then(downloadURL => {
                return { fileName: file.name, url: downloadURL, type: file.type };
            });
        });
        uploadPromises.push(uploadTask);
    });

    // 모든 파일 업로드 완료 후 Firestore에 저장
    Promise.all(uploadPromises).then(mediaFiles => {
        const postId = `post_${Date.now()}`;
        setDoc(doc(db, "posts", postId), {
            media: mediaFiles,
            createdAt: new Date(),
            createdBy: auth.currentUser.uid
        }).then(() => {
            console.log("게시물이 저장되었습니다.");
            document.getElementById('uploadModal').style.display = 'none';
            loadPosts(); // 업로드 후 게시물 다시 불러오기
        }).catch(error => {
            console.error("게시물 저장 중 오류:", error);
        });
    }).catch(error => {
        console.error("파일 업로드 오류:", error);
    });
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
