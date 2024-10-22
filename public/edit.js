import { db, storage } from "./firebase.js";  // auth 제거
import { getDoc, doc, getDocs, setDoc, updateDoc, deleteDoc,collection , where , query } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-storage.js";

let existingMedia = [];  // 기존 미디어를 저장할 배열
let selectedThumbnail = null;  // 선택된 썸네일


// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const postId = urlParams.get('postId');  // postId 파라미터 가져오기

// posts 컬렉션의 총 문서 수를 가져오는 함수
async function getPostsCount(db) {
    const postsSnapshot = await getDocs(collection(db, "posts"));
    return postsSnapshot.size;
}


// 게시물 상세 정보 불러오기
async function loadPostDetail() {
    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const postData = docSnap.data();
            // 폼 필드에 값 설정
            document.getElementById('category').value = postData.category;
            document.getElementById('groupId').value = postData.groupId;            
            document.getElementById('companyName').value = postData.companyName;
            const OrdersInput = document.getElementById('orders');
            OrdersInput.value = postData.orders; 
            const postsCount = await getPostsCount(db);  
            OrdersInput.max = postsCount;                                                                           

            document.getElementById('oldOrders').value = postData.orders;                           
            document.getElementById('productNumber').value = postData.productNumber;
            document.getElementById('type').value = postData.type;
            //console.log(postData);
            //console.log(postData.size);
            document.getElementById('size').value = postData.size ? postData.size.split(' ')[0] : '';
            document.getElementById('sizeUnit').value = postData.size ? postData.size.split(' ')[1] : 'cm';
            document.getElementById('weight').value = postData.weight.replace('g', ''); 
            document.getElementById('additionalContent').value = postData.additionalContent;


            // 기존 미디어 미리보기
            existingMedia = postData.media || [];
            // 미디어를 index 순서대로 정렬
            existingMedia.sort((a, b) => a.index - b.index); // 'index' 속성을 기준으로 정렬

            displayMediaPreview(existingMedia,postData.thumbnail);
        } else {
            alert('게시물을 찾을 수 없습니다.');
        }
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 미디어 미리보기 표시 함수
function displayMediaPreview(mediaFiles,thumbnailUrl) {
    const mediaPreview = document.getElementById('mediaPreview');
    mediaPreview.innerHTML = '';  // 기존 미디어 초기화

    mediaFiles.forEach((media, index) => {        
        const mediaElement = document.createElement(media.type.includes('video') ? 'video' : 'img');
        mediaElement.src = media.url;
        //mediaElement.controls = media.type.includes('video');  // 동영상이면 컨트롤 추가
        mediaElement.classList.add('media-item');

        if (media.type.includes('video')) {
            mediaElement.setAttribute('muted', true);
            mediaElement.setAttribute('autoplay', true);
            mediaElement.setAttribute('loop', true);
            
            
        } 
        mediaElement.addEventListener('touch', (e) => {
            
            document.querySelectorAll('.media-list').forEach(p => p.classList.remove('selected'));
            // mediaElement의 부모 요소인 .media-list에 selected 클래스 추가
            mediaElement.parentElement.classList.add('selected');
            selectedThumbnail = media;  // 썸네일 선택
            console.log('미디어터치썸네일');
            //alert('미디어터치썸네일');
            e.preventDefault(); 
        });
        mediaElement.addEventListener('click', (e) => {
            
            document.querySelectorAll('.media-list').forEach(p => p.classList.remove('selected'));
            // mediaElement의 부모 요소인 .media-list에 selected 클래스 추가
            mediaElement.parentElement.classList.add('selected');
            selectedThumbnail = media;  // 썸네일 선택
            console.log('미디어클릭썸네일');
            //alert('미디어클릭썸네일');
            e.preventDefault(); 
        });


        // 미디어 삭제 버튼
        const mediadeleteBtn = document.createElement('button');
        mediadeleteBtn.textContent = '삭제';
        mediadeleteBtn.classList.add('media-delete-btn');        
        // 미디어 삭제 버튼
        mediadeleteBtn.addEventListener('click', (e) => {
            console.log('삭제클릭');
            e.preventDefault(); 
            e.stopPropagation();  // 이벤트 전파 중단 (form 제출 방지)
            deleteMediaFile(media, index);  // 삭제 처리 함수 호출
        });
        mediadeleteBtn.addEventListener('touch', () => {
            console.log('삭제터치');
            e.preventDefault(); 
            //e.stopPropagation();  // 이벤트 전파 중단 (form 제출 방지)            
            deleteMediaFile(media, index);
        });             

        const mediaContainer = document.createElement('div');
        mediaContainer.draggable = true;  // 드래그 가능하게 설정
        mediaContainer.classList.add('media-list');
        console.log('미디어주소',media.url);
        if (media.url == thumbnailUrl) {
            console.log('미디어주소일치');
            selectedThumbnail = media;
            mediaContainer.classList.add('selected');
        }
        mediaContainer.setAttribute('data-index', index);  // 인덱스 속성 추가
        mediaContainer.setAttribute('data-filename', media.fileName);  // 파일이름 속성 추가
        mediaContainer.appendChild(mediaElement);
        mediaContainer.appendChild(mediadeleteBtn);

        mediaPreview.appendChild(mediaContainer);
    });    
}


// SortableJS로 드래그 앤 드롭 활성화
const mediaContainer = document.getElementById('mediaPreview');

// PC 환경에서만 드래그 앤 드롭 활성화
if (window.innerWidth >= 768) { // 768px 이상일 때 PC로 간주
    const sortable = new Sortable(mediaContainer, {
        animation: 150,  // 드래그 시 애니메이션 효과
        ghostClass: 'dragging',  // 드래그 중인 항목에 클래스 추가
        onStart: function (evt) {
            console.log(evt.item);
            //alert('드래그 시작:'+ evt.item.outerHTML);
            console.log('드래그 시작:', evt.item);
        },
        onEnd: function (evt) {

            // 드래그 완료 시의 처리
            const movedItem = evt.item;
            const newIndex = evt.newIndex;

            console.log(`Moved item to new index: ${newIndex}`);
            updateMediaIndexes();  // 순서 업데이트 함수 호출
        },
    });
};

// 순서를 바꾸고 나서 인덱스를 재설정
function updateMediaIndexes() {
    const mediaItems = mediaContainer.querySelectorAll('.media-list');
    mediaItems.forEach((item, index) => {
        item.setAttribute('data-index', index); // 새로운 인덱스 적용
        console.log(`Updated item at index: ${index}`);
    });
    saveMediaOrder();  // 변경된 순서를 저장하는 함수 호출
}

// 미디어 순서 저장 
async function saveMediaOrder() {
    const mediaOrder = [];
    const mediaItems = mediaContainer.querySelectorAll('.media-list');
    mediaItems.forEach(item => {
        const index = item.getAttribute('data-index');
        const mediaFileName = item.getAttribute('data-filename');
        mediaOrder.push({ index, mediaFileName });
    });
    //console.log('미디어 순서:', mediaOrder);
     // 기존 미디어에서 URL이 일치하는 항목의 인덱스 업데이트
    existingMedia.forEach((media, index) => {
        console.log(media.fileName);
        const match = mediaOrder.find(item => item.mediaFileName === media.fileName);
        if (match) {
            media.index = match.index; // 해당 media의 인덱스를 업데이트
        }
    });
    //console.log('미디어 변경순서:',existingMedia);

    // Firestore에 업데이트
    const postRef = doc(db, 'posts', postId);
    try {
        await updateDoc(postRef, {
            media: existingMedia // 업데이트할 필드
        });
        console.log('미디어 순서가 업데이트되었습니다.');
    } catch (error) {
        console.error('Firestore 업데이트 중 오류:', error);
    }    

}


// 미디어 파일 삭제
async function deleteMediaFile(media, index) {
    //console.log('삭제 요청된 미디어:', media);  // 미디어 정보 출력
    const confirmDelete = confirm('이 미디어 파일을 삭제하시겠습니까?\n썸네일 삭제시 다른 썸네일을 지정해야합니다.');
    if (confirmDelete) {
        try {
            const mediaRef = ref(storage, `uploads/${postId}/${media.fileName}`);  // Firebase Storage 참조
            console.log(`Firebase Storage 경로: uploads/${postId}/${media.fileName}`);  // 경로 출력

            // Firebase Storage에서 삭제
            await deleteObject(mediaRef);
            console.log('Firebase Storage에서 미디어 삭제 성공');  // 성공 로그 출력

            

            // Firestore에서 media 필드 업데이트
            const postRef = doc(db, 'posts', postId);
            console.log('섬네일 주소 삭제',selectedThumbnail.url );
            // 썸네일 파일이 삭제된 경우 처리
            if (selectedThumbnail && selectedThumbnail.url === media.url) { // 여기서 "media.url"은 삭제된 미디어의 URL로 대체되어야 합니다.
                
                selectedThumbnail = null;
                console.log('섬네일 주소 삭제');

                // Firestore에서 thumbnail 필드를 빈 문자열로 업데이트
                await updateDoc(postRef, {
                    thumbnail: ""  // thumbnail을 빈 문자열로 설정
                });
                console.log('Firestore에서 thumbnail 업데이트: 빈 값으로 설정');
            }

            existingMedia.splice(index, 1);  // 배열에서 미디어 제거
            console.log('existingMedia 배열에서 미디어 제거 후:', existingMedia);  // 제거 후 배열 출력



            // Firestore 업데이트
            await updateDoc(postRef, {
                media: existingMedia  // 업데이트할 필드
            });
            console.log('Firestore에서 미디어 업데이트 성공');  // 성공 로그 출력



            // 미리보기 갱신
            displayMediaPreview(existingMedia);  // 미리보기 갱신
            //console.log('미리보기 갱신 완료');  // 갱신 완료 로그 출력

            alert('미디어 파일이 삭제되었습니다. 계속 수정할 수 있습니다.');
        } catch (error) {
            console.error('미디어 파일 삭제 중 오류:', error);  // 오류 로그 출력
        }

        console.log('미디어가 Firestore에서 삭제되었습니다.');
    }
}


// 새 파일을 업로드할 때 실시간 미리보기 추가
document.getElementById('fileInput').addEventListener('change', (event) => {
    const files = event.target.files;
    const mediaPreview = document.getElementById('mediaPreview');

    Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const newMediaElement = document.createElement(file.type.includes('video') ? 'video' : 'img');
            newMediaElement.src = e.target.result;
            newMediaElement.controls = file.type.includes('video');
            newMediaElement.classList.add('media-item');
            mediaPreview.appendChild(newMediaElement);
        };
        reader.readAsDataURL(file);
    });
});

// 게시물 삭제 버튼 클릭 시 게시물 삭제
document.getElementById('deleteBtn').addEventListener('click', async () => {
    const confirmDelete = confirm('정말로 이 게시물을 삭제하시겠습니까?');
    if (confirmDelete) {
        try {     
        
            const draggedOrder = parseInt(document.getElementById('oldOrders').value);
            const dropTargetOrder = parseInt(document.getElementById('orders').max);
            await savePostOrder(postId, draggedOrder, dropTargetOrder) ;

            

            // Firestore에서 게시물 삭제
            await deleteDoc(doc(db, 'posts', postId));

            // Firebase Storage에서 관련 미디어 폴더 삭제
            const folderRef = ref(storage, 'uploads/' + postId);  // 삭제할 폴더 경로

            // 폴더 내 모든 파일을 가져오기
            const listResponse = await listAll(folderRef);
            const deletePromises = listResponse.items.map(item => {
                return deleteObject(item);  // 파일 삭제
            });

            await Promise.all(deletePromises);  // 모든 파일 삭제 대기

            await deletePostRelatedData(postId);
            alert('게시물이 삭제되었습니다.');
            window.location.href = '/';  // 삭제 후 대시보드로 이동
        } catch (error) {
            console.error('게시물 삭제 중 오류:', error);
        }
    }
});


// postId와 관련된 모든 데이터를 삭제하는 함수(조회로그의 해당제품, 장바구니, orders재정렬)
async function deletePostRelatedData(postId) {
    // pageViews에서 postId와 관련된 데이터를 삭제
    const viewsRef = collection(db, 'pageViews');
    const querySnapshot = await getDocs(viewsRef);

    const deleteViewPromises = querySnapshot.docs.map(async (doc) => {
        if (doc.data().postId === postId) {
            console.log(doc.data().postId );
            return deleteDoc(doc.ref);  // pageViews에서 삭제
        }
    });

    await Promise.all(deleteViewPromises);

    // cart에서 postId와 관련된 데이터를 삭제
    const cartRef = collection(db, 'carts');
    const cartSnapshot = await getDocs(cartRef);

    const deleteCartPromises = cartSnapshot.docs.map(async (doc) => {
        if (doc.data().postId === postId) {
            return deleteDoc(doc.ref);  // cart에서 삭제
        }
    });

   
    await Promise.all(deleteCartPromises);



    console.log('postId와 관련된 모든 데이터를 삭제했습니다.');
}


// 수정 완료 버튼 클릭 시 수정된 데이터 저장
document.getElementById('editForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const category = document.getElementById('category').value;
    const companyName = document.getElementById('companyName').value || '';  // 회사명 생략 가능
    const productNumber = document.getElementById('productNumber').value;
    const groupId = document.getElementById('groupId').value;
    const type = document.getElementById('type').value;
    const size = `${document.getElementById('size').value} ${document.getElementById('sizeUnit').value}`;
    //const sizeUnit = document.getElementById('sizeUnit').value;    
    const weight = `${document.getElementById('weight').value}g`;
    const additionalContent = document.getElementById('additionalContent').value;
    const files = document.getElementById('fileInput').files;
    const uploadPromises = [];

    
    const draggedOrder =  parseInt(document.getElementById('oldOrders').value);
    const dropTargetOrder =  parseInt(document.getElementById('orders').value);

    if(draggedOrder !== dropTargetOrder ) {//업로드가 변경되었을때만 처리)
        savePostOrder(postId,draggedOrder,dropTargetOrder);
    }

    // 파일 업로드가 있는 경우에만 처리
    if (files.length > 0) {
        Array.from(files).forEach(file => {
            const storageRef = ref(storage, `uploads/${postId}/${file.name}`);
            const uploadTask = uploadBytes(storageRef, file).then(snapshot => {
                return getDownloadURL(snapshot.ref).then(downloadURL => {
                    return { fileName: file.name, url: downloadURL, type: file.type };
                });
            });
            uploadPromises.push(uploadTask);
        });
    }

    const newMediaFiles = await Promise.all(uploadPromises);
    existingMedia = [...existingMedia, ...newMediaFiles];  // 기존 미디어에 새 미디어 추가
        
    //썸네일 우선순위 . 기존에 가져온 썸네일이 그대로, 변경, 둘다 아니라면 새로추가.
    const thumbnailURL = 
    (selectedThumbnail && typeof selectedThumbnail === 'object' && selectedThumbnail.url) ? 
        selectedThumbnail.url : 
        existingMedia[0]?.url;
       

    
    // Firestore에 수정된 데이터 저장
    updateDoc(doc(db, "posts", postId), {
        category,
        companyName,
        productNumber,
        groupId,
        type,
        size,
        weight,
        additionalContent,
        media: existingMedia,
        thumbnail: thumbnailURL,  // 썸네일 업데이트
        updatedAt: new Date()
    }).then(() => {
        alert('게시물이 수정되었습니다.');
        window.location.href = '/detail.html?postId=' + postId;  // 수정 완료 후 상세 페이지로 이동
    }).catch(error => {
        console.error("게시물 수정 중 오류:", error);
    });
});

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);

// 게시물 순서 저장 함수
async function savePostOrder(draggedPostId, draggedOrder, dropTargetOrder) {
    const postsRef = collection(db, 'posts');

    // dropTargetOrder가 null일 경우 총 게시물 수로 설정
    dropTargetOrder = dropTargetOrder === null ? (await (await getDocs(postsRef)).size) : dropTargetOrder;

    console.log('시작된 draggedOrder:', draggedOrder, '시작된 dropTargetOrder:', dropTargetOrder);

    if (draggedOrder < dropTargetOrder) {
        const q = query(postsRef, 
            where("orders", ">", draggedOrder), // draggedOrder보다 큰 값
            where("orders", "<=", dropTargetOrder) // dropTargetOrder보다 작거나 같은 값
        );

        console.log("쿼리 실행 중: draggedOrder < dropTargetOrder", draggedOrder, dropTargetOrder);

        try {
            // 쿼리 실행
            const querySnapshot = await getDocs(q);
            console.log('쿼리 성공:', querySnapshot.size, '개의 문서가 조건에 맞습니다.');

            // 조건에 맞는 각 문서의 orders 값을 -1로 업데이트
            const updates = querySnapshot.docs.map((doc) => {
                const postRef = doc.ref;
                const currentOrder = doc.data().orders;
                const newOrder = currentOrder - 1; // orders 값 -1로 업데이트
                console.log(`문서 ${doc.id}: currentOrder ${currentOrder} -> newOrder ${newOrder}`);

                // Firestore에서 orders 값 업데이트
                return updateDoc(postRef, { orders: newOrder });
            });

            // 드롭된 위치의 게시물 orders 업데이트
            const postRefForDropTarget = doc(db, 'posts', draggedPostId);
            const postUpdate = updateDoc(postRefForDropTarget, { orders: dropTargetOrder });
            console.log(`드래그된 게시물(${draggedPostId})의 orders를 ${dropTargetOrder}로 업데이트`);

            // 모든 업데이트가 완료될 때까지 기다림
            await Promise.all([...updates, postUpdate]);
            console.log('순서가 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('orders 업데이트 중 오류 발생:', error);
        }
    } else if(draggedOrder > dropTargetOrder + 1) {                
        const q = query(postsRef, 
            where("orders", "<=", draggedOrder), // draggedOrder보다 작은 값
            where("orders", ">", dropTargetOrder) // dropTargetOrder보다 큰 값
        );

        console.log("쿼리 실행 중: draggedOrder >= dropTargetOrder", draggedOrder, dropTargetOrder);

        try {
            // 쿼리 실행
            const querySnapshot = await getDocs(q);
            console.log('쿼리 성공:', querySnapshot.size, '개의 문서가 조건에 맞습니다.');

            // 조건에 맞는 각 문서의 orders 값을 +1로 업데이트
            const updates = querySnapshot.docs.map((doc) => {
                const postRef = doc.ref;
                const currentOrder = doc.data().orders;
                const newOrder = currentOrder + 1; // orders 값 +1로 업데이트
                console.log(`문서 ${doc.id}: currentOrder ${currentOrder} -> newOrder ${newOrder}`);

                // Firestore에서 orders 값 업데이트
                return updateDoc(postRef, { orders: newOrder });
            });

            // 드롭된 위치의 게시물 orders 업데이트
            const postRefForDropTarget = doc(db, 'posts', draggedPostId);
            const postUpdate = updateDoc(postRefForDropTarget, { orders: dropTargetOrder +1});
            console.log(`드래그된 게시물(${draggedPostId})의 orders를 ${dropTargetOrder+1}로 업데이트`);

            // 모든 업데이트가 완료될 때까지 기다림
            await Promise.all([...updates, postUpdate]);
            console.log('posts의 orders 값이 성공적으로 업데이트되었습니다.');
        } catch (error) {
            console.error('orders 업데이트 중 오류 발생:', error);
        }
    }
}





// 로그아웃 처리
if (document.getElementById('logoutBtn')) {
    document.getElementById('logoutBtn').addEventListener('click', () => {
        sessionStorage.removeItem('userId');  // 세션에서 로그인 정보 제거
            // 서버에 userId를 POST 요청으로 전송
            fetch('/api/handle-request', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    action: 'logout', // action에 logout지정                               
                })
            })
            .then(response => {
                if (response.ok) {
                    window.location.href = '/';  // 로그인 후 대시보드로 이동
                } else {
                    console.error('Failed to set userId on server.');
                }
            })
            .catch(error => console.error('Error:', error));    
        window.location.href = '/';  // 로그아웃 후 메인 페이지로 이동
    });
}

// 뒤로 가기 버튼 클릭 시 대시보드로 이동
if (document.getElementById('backBtn')) {
    document.getElementById('backBtn').addEventListener('click', () => {
        window.location.href = '/dashboard.html';  // 홈(dashboard.html)으로 이동
    });
}
