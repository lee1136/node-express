import { db } from "./firebase.js";
import { getDoc,  updateDoc, setDoc , addDoc, deleteDoc, query, where, getDocs , collection , doc , increment } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";


// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const postId = urlParams.get('postId');  // postId 파라미터 가져오기

// Firestore에서 장바구니 아이템 가져오기
async function loadCartItems(userId,postId) {
    const cartItems = [];
    const cartRef = collection(db, 'carts');  // carts 컬렉션 참조
    const cartQuery = query(cartRef, where('userId', '==', userId));  // userId로 필터링

    try {
        const cartSnapshot = await getDocs(cartQuery);  // Firestore 쿼리 실행
        cartSnapshot.forEach(doc => {
            console.log('데이타:',doc.data());
            const data = doc.data();  // 문서 데이터 가져오기
            if (data && data.postId) {  // postId가 존재하는지 확인
                cartItems.push(data.postId);  // postId를 cartItems에 추가
            } else {
                console.warn(`문서에 postId가 없습니다: ${doc.id}`);
            }
        });
    } catch (error) {
        console.error("장바구니 불러오기 오류:", error);  // 에러 메시지 출력
    }

    return cartItems;  // 결과 반환
}

// 페이지 조회 정보를 저장하는 함수
async function savePageView(userId, postId) {
    try {
        // 서버에 IP 주소 요청
        const ipResponse = await fetch('/api/handle-request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ action: 'getClientIp' }) // action에 getClientIp 지정
        });

       
        const ipData = await ipResponse.json();
        const userIp = ipData.ip; // 사용자의 IP 주소
        //console.log(userIp);
        // Firestore에 저장할 데이터 구성
        const viewsData = {
            postId: postId,
            userId: userId,            
            viewedAt: new Date(), // 현재 시간
            ip: ipData.ip
        };
        //console.log(viewsData );
        //await setDoc(doc(db, 'pageViews', `${postId}-${userId}-${Date.now()}`), viewsData);
        await addDoc(collection(db, 'pageViews'), viewsData);
        console.log('페이지 조회 정보가 저장되었습니다.');
    } catch (error) {
        console.error('페이지 조회 정보 저장 오류:', error);
    }
}


// 게시물 상세 정보 불러오기
async function loadPostDetail() {
    const postDetail = document.getElementById('postDetail');

    try {
        const docRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(docRef);
        // 세션에서 사용자 ID 가져오기
        const userId = sessionStorage.getItem('userId');   
        await savePageView(userId, postId); 
        // 조회수 업데이트 로직 추가

        if (docSnap.exists()) {
            const postData = docSnap.data();
            const companyName = postData.companyName ? postData.companyName + " " : ''; // 회사명이 있으면 추가


            // 사이즈가 없을 때 공백으로 처리
            const sizeText = postData.size ? postData.size : "";  // 사이즈가 없으면 빈 문자열 처리

            // 미디어 타입 확인
            // 기존 미디어 미리보기
            const existingMedia = postData.media || [];
            // 미디어를 MP4 파일을 우선적으로 정렬
            existingMedia.sort((a, b) => {
                const aIsVideo = a.url.includes('.mp4');
                const bIsVideo = b.url.includes('.mp4');

                // a가 비디오인 경우 -1, b가 비디오인 경우 1
                return (aIsVideo === bIsVideo) ? (a.index - b.index) : (aIsVideo ? -1 : 1);
            });

            const firstMedia = existingMedia[0]; // 첫 번째 미디어 가져오기
            const isVideo = firstMedia.url.includes('.mp4'); // MP4 파일인지 확인

            // 상세 정보 표시 (비디오 무한 반복 및 자동 재생)
            console.log(sizeText);
            postDetail.innerHTML = `
                ${isVideo ? 
                    `<video src="${firstMedia.url}" id="post-media"  class="post-media post-video" autoplay loop muted></video>` :
                    `<img src="${firstMedia.url}" alt="${firstMedia.fileName}" id="post-media" class="post-media post-image">`
                }
                <div class="media-gallery">
                ${postData.media.slice(1).map(media => 
                    media.type.includes('video') || media.url.endsWith('.mp4') ? 
                    `<video src="${media.url}" class="gallery-media gallery-video" autoplay loop muted></video>` : 
                    `<img src="${media.url}" alt="${media.fileName}" class="gallery-media gallery-image">`
                ).join('')}
                </div>
                <div class="post-info">
                    <h2>No. ${companyName}${postData.productNumber}</h2>
                    <div class="addCart"></div>
                    <div class="orders info-hidden">${postData.orders}</div>                       
                    <div class="view-counter info-hidden">
                        <span class="view-number">${postData.views}</span>
                    </div>                                       
                    <p>종류 : ${postData.type}</p>
                    ${postData.weight !== 'g' ? `<p>중량 : ${postData.weight}</p>` : ''} <!-- weight 값이 있으면 출력 -->
                    ${sizeText !== ' cm' ? `<p>사이즈 : ${sizeText}</p>` : ''} <!-- 사이즈가 'cm'가 아니면 출력 -->                                
                    <p>추가 내용: ${postData.additionalContent}</p>
                    ${postData.groupId ? `<p class="info-hidden">그룹 : ${postData.groupId}</p>` :''} <!-- 사이즈가 없으면 공백 처리 -->
                </div>
            `;

         
            if (userId) {
                await updateDoc(doc(db, 'posts', postId), {// 게시물 참조 가져오기
                    views: increment(1) // views 필드를 1 증가
                });

                const cartsRef = collection(db, 'carts');
                const cartQuery = query(cartsRef, where('userId', '==', userId), where('postId', '==', postId));
                const cartSnapshot = await getDocs(cartQuery);



                const userRef = doc(db, "users", userId);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const userRole = userSnap.data().role;
                    if (userRole === 'admin') {
                        //document.getElementById('editBtn').style.display = 'block'; // 관리자에게만 수정하기 버튼 표시
                        document.querySelectorAll('.info-hidden').forEach(el => el.classList.add('show-important'));// info-hidden 클래스가 있을 경우 show-important 클래스 추가

                    }
                } else {
                    console.error('사용자 정보를 찾을 수 없습니다.');
                }

      

                const addCartDiv = document.querySelector('.addCart');
                if (!cartSnapshot.empty ) {
                    addCartDiv.classList.add('exist');  // 장바구니에 존재하면 exist 클래스 추가
                }

                // addCart 클릭 시 장바구니에 추가/제거 처리
                addCartDiv.addEventListener('click', (event) => {
                    event.stopPropagation(); // 이벤트 전파 중지
                    handleCartClick(postId, addCartDiv); // 장바구니 처리 함수 호출
                });                

                

            } else {
                console.error('로그인된 사용자 정보가 없습니다.');
            }


            // 이미지 클릭 시 모달 열기 (이미지 저장 방지는 유지, 클릭은 가능하게)
            document.querySelectorAll('.gallery-media').forEach(image => {
                //image.style.pointerEvents = 'auto';  // 이미지 클릭 가능하게 설정
                image.style.touchAction  = 'none';

                image.addEventListener('touchstart', (event) => {
                    // 기본 이벤트 방지 (다운로드 방지)
                    event.preventDefault(); 
                    //console.log('터치 이벤트 처리');
                    openModal(image.src, `${companyName}${postData.productNumber}`);
                });
                image.addEventListener('click', (event) => {
                    // 기본 이벤트 방지 (다운로드 방지)
                    event.preventDefault(); 
                    //console.log('클릭 이벤트 처리');
                    openModal(image.src, `${companyName}${postData.productNumber}`);
                });      

                // 데스크탑에서 우클릭 방지
                image.addEventListener('contextmenu', function(e) {
                    e.preventDefault();  // 기본 동작 방지 (데스크탑)
                }); 

            });
        } else {
            postDetail.innerHTML = '<p>게시물을 찾을 수 없습니다.</p>';
        }
        const postMedia = document.getElementById('post-media');

        postMedia .addEventListener('touchstart', (event) => {
            // 기본 이벤트 방지 (다운로드 방지)
            event.preventDefault(); 
            //console.log('터치 이벤트 처리');
            //alert('메인터치');
        });
        postMedia .addEventListener('click', (event) => {
            // 기본 이벤트 방지 (다운로드 방지)
            event.preventDefault(); 
            //console.log('클릭 이벤트 처리');
            //alert('메인클릭');    
        });
        // 데스크탑에서 우클릭 방지
        postMedia.addEventListener('contextmenu', function(e) {
            e.preventDefault();  // 기본 동작 방지 (데스크탑)
        });         
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
        postDetail.innerHTML = '<p>게시물 정보를 불러오는 데 오류가 발생했습니다.</p>';
    }




}



// 모달 열기
function openModal(mediaSrc, productNumber) {
    const modal = document.getElementById('mediaModal');
    const modalContent = document.getElementById('modalContent'); // modalContent는 이미지나 비디오 태그가 들어갈 컨테이너
    const captionText = document.getElementById('caption');

    modal.style.display = "block"; // 모달 표시

    // 기존 태그 제거
    modalContent.innerHTML = ''; 

    // MP4 파일인지 확인
    const isVideo = mediaSrc.includes('.mp4'); // MP4 파일이 포함되는지 확인

    if (isVideo) {
        // 비디오 태그 생성 및 설정
        const modalVideo = document.createElement('video');
        modalVideo.src = mediaSrc;
        modalVideo.controls = true;
        modalVideo.autoplay = true;
        modalVideo.loop = true;
        modalVideo.classList.add('modal-item');
        modalContent.appendChild(modalVideo); // 비디오 태그 추가
    } else {
        // 이미지 태그 생성 및 설정
        const modalImage = document.createElement('img');
        modalImage.src = mediaSrc;
        modalImage.alt = productNumber;
        modalImage.classList.add('modal-item');
        modalImage.addEventListener('touchstart', (event) => {
            // 기본 이벤트 방지 (다운로드 방지)
            event.preventDefault(); 
            //console.log('모달터치 이벤트 처리');
             });
        modalImage.addEventListener('click', (event) => {
            // 기본 이벤트 방지 (다운로드 방지)
            event.preventDefault(); 
            //console.log('모달클릭 이벤트 처리');
        });           
        modalContent.appendChild(modalImage); // 이미지 태그 추가
    }

    captionText.innerHTML = productNumber; // 캡션 설정

    // 모달 창 바깥쪽을 클릭하면 모달 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });
}

// 모달 닫기 (X 버튼 클릭 시)
document.querySelector('.close').addEventListener('click', () => {
    document.getElementById('mediaModal').style.display = "none"; // 모달 숨기기
    
});

// 페이지 로드 시 게시물 상세 정보 불러오기
document.addEventListener('DOMContentLoaded', loadPostDetail);

// 장바구니 추가/제거 처리 함수
async function handleCartClick(postId, CartElement) {
    const userId = sessionStorage.getItem('userId');

    if (CartElement.classList.contains('exist')) {
        // exist 클래스가 있는 경우: 장바구니에서 데이터 제거
        try {
            const cartRef = collection(db, 'carts');
            const cartQuery = query(cartRef, where('userId', '==', userId), where('postId', '==', postId));

            const cartSnapshot = await getDocs(cartQuery);
            cartSnapshot.forEach(async (doc) => {
                await deleteDoc(doc.ref);
                console.log(`장바구니에서 제거됨.`);//${postId} 
            });

            CartElement.classList.remove('exist');
        } catch (error) {
            console.error('장바구니에서 제거 중 오류 발생:', error);
        }
    } else {
        // exist 클래스가 없는 경우: 장바구니에 데이터 추가
        try {
            const cartData = {
                userId: userId,
                postId: postId,
            };
            await addDoc(collection(db, 'carts'), cartData);
            console.log(`장바구니에 추가됨.`);//${postId} 

            CartElement.classList.add('exist');
        } catch (error) {
            console.error('장바구니에 추가 중 오류 발생:', error);
        }
    }
}

// 수정하기 버튼 클릭 시 수정 페이지로 이동
document.getElementById('editBtn').addEventListener('click', () => {
    window.location.href = `/edit.html?postId=${postId}`; // 수정 페이지로 이동, postId를 쿼리 파라미터로 전달
});
