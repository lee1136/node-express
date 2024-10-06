import { auth, db, storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/dashboard.html';
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
            window.location.href = '/dashboard.html';  // 업로드 완료 후 대시보드로 이동
        }).catch(error => {
            console.error("게시물 저장 중 오류:", error);
        });
    }).catch(error => {
        console.error("파일 업로드 오류:", error);
    });
});
