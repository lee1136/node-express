import { auth, db, storage } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

// 사용자의 역할에 따라 버튼 표시
onAuthStateChanged(auth, (user) => {
    if (user) {
        const uid = user.uid;
        const docRef = doc(db, "users", uid);
        getDoc(docRef).then((docSnap) => {
            if (docSnap.exists() && docSnap.data().role === 'admin') {
                document.getElementById('uploadBtn').style.display = 'block'; // 관리자만 업로드 버튼 표시
            }
        }).catch((error) => {
            console.error("역할 확인 오류:", error);
        });
    } else {
        window.location.href = '/login.html';
    }
});

// 게시물 업로드 기능 예시
document.getElementById('uploadBtn').addEventListener('click', () => {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        const storageRef = ref(storage, 'uploads/' + file.name);
        
        uploadBytes(storageRef, file).then((snapshot) => {
            console.log('파일 업로드 완료:', snapshot);
            return getDownloadURL(snapshot.ref);
        }).then((downloadURL) => {
            console.log('파일 다운로드 URL:', downloadURL);
        }).catch((error) => {
            console.error('파일 업로드 오류:', error);
        });
    };
    fileInput.click();
});
