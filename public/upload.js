import { auth, db, storage } from "./firebase.js";
import { ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";
import { setDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let selectedThumbnail = null;  // 썸네일로 선택된 미디어

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
document.getElementById('backBtn').addEventListener('click', () => {
    window.location.href = '/dashboard.html';
});

// 미디어 파일 선택 시 미리보기 생성
document.getElementById('fileInput').addEventListener('change', (e) => {
    const files = e.target.files;
    const previewContainer = document.getElementById('mediaPreview');
    previewContainer.innerHTML = '';  // 미리보기 초기화

    Array.from(files).forEach((file, index) => {
        const previewDiv = document.createElement('div');
        previewDiv.classList.add('preview');

        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewDiv.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.autoplay = true;
            video.loop = true;
            video.muted = true;
            previewDiv.appendChild(video);
        }

        previewDiv.addEventListener('click', () => {
            document.querySelectorAll('.preview').forEach(p => p.classList.remove('selected'));
            previewDiv.classList.add('selected');
            selectedThumbnail = file;  // 선택된 파일을 썸네일로 지정
        });

        previewContainer.appendChild(previewDiv);

        // 첫 번째 미디어는 기본으로 선택
        if (index === 0) {
            previewDiv.classList.add('selected');
            selectedThumbnail = file;
        }
    });
});

// 파일 업로드 및 Firestore에 게시물 저장
document.getElementById('uploadForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const productNumber = document.getElementById('productNumber').value;
    const type = document.getElementById('type').value;
    const size = document.getElementById('size').value;
    const sizeUnit = document.getElementById('sizeUnit').value;
    const weight = document.getElementById('weight').value;
    const additionalContent = document.getElementById('additionalContent').value;
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
        const thumbnailURL = mediaFiles.find(media => media.fileName === selectedThumbnail.name)?.url || mediaFiles[0].url;
        const postId = `post_${Date.now()}`;
        setDoc(doc(db, "posts", postId), {
            productNumber,
            type,
            size: `${size} ${sizeUnit}`,
            weight: `${weight}g`,
            additionalContent,
            media: mediaFiles,  // 미디어 파일 배열
            thumbnail: thumbnailURL,  // 선택한 썸네일 URL 저장
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
