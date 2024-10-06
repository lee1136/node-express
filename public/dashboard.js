import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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
