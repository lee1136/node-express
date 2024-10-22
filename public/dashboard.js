import { db } from "./firebase.js"; // Authentication 없이 Firestore만 사용
import { getDoc, doc, getDocs,  addDoc, deleteDoc,  updateDoc, collection, query, orderBy ,where} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

let postsData = [];  // 전체 게시물 데이터를 저장할 배열
let cartItems = [];
let showItem = false;
const userId = sessionStorage.getItem('userId'); // 세션에서 로그인 정보 가져오기

// 로그인된 사용자의 역할 확인 (관리자면 업로드 및 회원가입 버튼 보이기)
document.addEventListener('DOMContentLoaded', async () => {
    let role = '';
    if (!userId) {
        window.location.href = '/login.html';  // 로그인되지 않은 경우 로그인 페이지로 이동
    } else {
        // Firestore에서 사용자 역할 가져오기
        const docRef = doc(db, "users", userId);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const userRole = docSnap.data().role;
                if (userRole === 'admin') {
                    showItem  = true;
                    // 관리자에게만 업로드 버튼 표시
                    const uploadBtn = document.getElementById('uploadBtn'); if (uploadBtn) uploadBtn.style.display = 'block';

                    // 관리자에게만 회원가입 버튼 표시
                    const signupBtn = document.getElementById('signupBtn'); if (signupBtn) signupBtn.style.display = 'block';

                    // 관리자에게만 주문 초기화 버튼 표시
                    const resetOrdersBtn = document.getElementById('resetOdersBtn'); if (resetOrdersBtn) resetOrdersBtn.style.display = 'block';

                    // 관리자에게만 로그 버튼 표시
                    const logsBtn = document.getElementById('logsBtn'); if (logsBtn) logsBtn.style.display = 'block';



                    initDragAndDrop();//드래그순서변경
                }
            } else {
                console.error('사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error("역할 확인 오류:", error);
        }
        loadPosts(); // 게시물 불러오기        

        
    }
    
    
});

// 검색 입력 필드의 입력 변화 감지
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();  // 입력된 검색어
    console.log('검색어',searchTerm);
    filterPosts(searchTerm);  // 검색어에 따라 게시물 필터링
});

// 게시물 필터링 함수 (검색어에 따라 필터링)
function filterPosts(searchTerm) {
    const filteredPosts = postsData.filter(post => post.productNumber.includes(searchTerm));
    console.log('검색데이타',postsData);
    renderPosts(filteredPosts,cartItems);  // 필터링된 게시물만 렌더링
}

// Firestore에서 장바구니 아이템 가져오기
async function loadCartItems(userId) {
    cartItems = [];
    const cartRef = collection(db, 'carts');  // carts 컬렉션 참조
    const cartQuery = query(cartRef, where('userId', '==', userId));  // userId로 필터링

    try {
        const cartSnapshot = await getDocs(cartQuery);  // Firestore 쿼리 실행
        cartSnapshot.forEach(doc => {
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


// Firestore에서 게시물 가져오기 (최신순으로 정렬)
async function loadPosts(category = 'all') {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 게시물 목록 초기화

    try {
        // 장바구니 데이터를 미리 가져옴
        const userId = sessionStorage.getItem('userId'); // 세션에서 로그인 정보 가져오기
   
        cartItems = []; // cartItems를 빈 배열로 초기화

        try {
            cartItems = await loadCartItems(userId); // cartItems를 가져옴
        } catch (cartError) {
            console.error('장바구니 데이터를 불러오는 중 오류 발생:', cartError);
        }


        // 게시물 쿼리 생성
        let querySnapshot;
        
        // category가 'cart'일 때는 cartItems에 있는 postId만 가져옴
        if (category === 'cart') {
          
            if (cartItems.length > 0) {
                const postIdsQuery = query(
                    collection(db, 'posts'),
                    where('postId', 'in', cartItems)  // postId가 cartItems에 포함된 게시물만 가져옴
                );  
                try {
                    querySnapshot = await getDocs(postIdsQuery);
                } catch (queryError) {
                    console.error('게시물 쿼리 실행 중 오류 발생:', queryError);
                }
            } else {
                console.warn('장바구니에 아이템이 없습니다.'); // 장바구니에 아이템이 없는 경우
                return; // 장바구니가 비어있다면 더 이상 진행하지 않음
            }
        } else if (category === 'all') {// category가 'all'일 때는 모든 게시물을 가져오고, 특정 카테고리일 때는 해당 카테고리의 게시물만 가져옴
            querySnapshot = await getDocs(query(collection(db, 'posts'), orderBy('orders', 'desc'))); //'createdAt', 'desc')
        } else if (category === 'group') {//태그로변경예정
            // 그룹별로 게시물을 가져온 후 최신순으로 정렬
            querySnapshot = await getDocs(query(collection(db, 'posts'), orderBy('createdAt', 'desc')));

            // 게시물 데이터를 배열에 저장
            let postsData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // groupId별로 게시물 그룹화
            let groupedPosts = {};
            postsData.forEach(post => {
                const groupId = post.groupId || 'no-group'; // groupId가 없을 경우 'no-group'으로 처리
                if (!groupedPosts[groupId]) {
                    groupedPosts[groupId] = [];
                }
                groupedPosts[groupId].push(post);
            });

            // 각 그룹 내부의 게시물들을 최신순으로 정렬
            for (const groupId in groupedPosts) {
                groupedPosts[groupId].sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
            }

            // 그룹 자체를 최신 게시물을 기준으로 정렬
            let sortedGroups = Object.values(groupedPosts).sort((a, b) => b[0].createdAt.toDate() - a[0].createdAt.toDate());

            // 정렬된 그룹의 모든 게시물을 합침
            let allPosts = [];
            sortedGroups.forEach(group => {
                allPosts = allPosts.concat(group); // 그룹에 속하는 게시물들을 순서대로 합침
            });

            // 정렬된 모든 게시물 렌더링
            renderPosts(allPosts, cartItems);

            return; // 그룹 정렬이 완료되었으므로 함수 종료
        } else {
            querySnapshot = await getDocs(query(collection(db, 'posts'), where('category', '==', category), orderBy('createdAt', 'desc')));
        }
        postsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));  // 게시물 데이터를 배열에 저장
        renderPosts(postsData, cartItems);  // 모든 게시물 초기 렌더링
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

// 탭 클릭 이벤트 처리
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async () => {
        const category = tab.getAttribute('data-category');

        // 클릭한 탭에 active 클래스 추가하고 나머지 탭에서 제거
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        await loadPosts(category); // 선택된 카테고리로 게시물 로드
    });
});


// 게시물 목록을 렌더링하는 함수
function renderPosts(posts, cartItems) {
    const postList = document.getElementById('postList');
    postList.innerHTML = '';  // 기존 게시물 목록 초기화

    posts.forEach((postData, index) => {
        const postElement = createPostElement(postData, cartItems,index);
        postList.appendChild(postElement);
    });
}

let draggedPost = null; // 전역 변수로 draggedPost 선언
let draggedTargetPost = null; // 전역 변수로 draggedTargetPost 선언

// 게시물 요소 생성 함수
function createPostElement(postData, cartItems,index) {
    const postDiv = document.createElement('div');
    postDiv.classList.add('post');
    postDiv.draggable = true;  // 드래그 가능하게 설정
    postDiv.setAttribute('data-orders', postData.orders); // data-orders 속성 추가
    postDiv.setAttribute('data-oldorders', index); // data-index 속성 추가
    postDiv.setAttribute('data-postid', postData.postId); // data-orders 속성 추가
    

    let mediatype ;    // 썸네일이 MP4인지 확인
    const cleanUrl = postData.thumbnail.split('?')[0]; 
    const fileName = cleanUrl.split('/').pop();    
    const fileExtension = fileName.split('.').pop().toLowerCase();      

    if (fileExtension == 'mp4') {
        mediatype = 'video';
    } else {
        mediatype = 'img';        
    }      
    const mediaElement = document.createElement(mediatype); // 'img' 대신 .
    mediaElement.classList.add('post-media-item');
    mediaElement.src = postData.thumbnail || postData.media[0].url;  // 썸네일이 있으면 썸네일 사용, 없으면 첫 번째 미디어 사용

    if (mediatype === 'video') {
        mediaElement.setAttribute('autoplay', true);
        mediaElement.setAttribute('loop', true);
        mediaElement.setAttribute('muted', true);
    } else {
        mediaElement.alt = postData.productNumber;
    }
  
    

    // 조회수 표시를 위한 요소 생성
    const viewsElement = document.createElement('div');
    viewsElement.classList.add('view-counter'); // 클래스 추가 (스타일링을 위해)   
    viewsElement.innerHTML = `<span class="view-number">${postData.views}</span>`;
    

    // cart추가를 위한 요소 생성
    const CartElement = document.createElement('div');
    CartElement.classList.add('addCart'); // 클래스 추가 (스타일링을 위해)
    // 장바구니에 해당 postId가 있는지 확인 후 'exist' 클래스 추가
    const isInCart = cartItems.includes(postData.id); // postData.id가 cartItems에 포함되어 있는지 검사
    if (isInCart) {
        CartElement.classList.add('exist');
    }

    // addCart 클릭 시 장바구니에 추가/제거 처리
    CartElement.addEventListener('click', (event) => {
        event.stopPropagation(); // 이벤트 전파 중지
        handleCartClick(postData.id, CartElement); // 장바구니 처리 함수 호출
    });

    // 게시물 클릭 시 상세 페이지로 이동
    postDiv.addEventListener('click', (e) => {       
        // 드래그 중이면 클릭 이벤트를 무시
        //if (!postDiv.classList.contains('dragging')) {
            window.location.href = `/detail.html?postId=${postData.id}`;
       // }
    });
    
    // 게시물 요소에 미디어 및 조회수 추가
    postDiv.appendChild(mediaElement);
    postDiv.appendChild(CartElement); // addcart 요소 추가
    if(showItem) postDiv.appendChild(viewsElement); // 조회수 요소 추가

    return postDiv;
}


// 업로드 버튼 클릭 시 업로드 페이지로 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload';  // 업로드 페이지로 이동
});

// 회원가입 버튼 클릭 시 회원가입 페이지로 이동
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/register';  // 회원가입 페이지로 이동
});


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


function initDragAndDrop() {
    const postList = document.getElementById('postList');

    // PC 환경에서만 드래그 앤 드롭 활성화
    if (window.innerWidth >= 768) { // 768px 이상일 때 PC로 간주
        const sortable = new Sortable(postList, {
            animation: 150,  // 애니메이션 효과
            onStart: function (evt) {
                //console.log('드래그 시작:', evt.item);
            },
            onEnd: function (evt) {
                //console.log('드래그 종료:', evt.item);
                updatePostOrders();  // 드래그 후 전체 순서 업데이트
            },
        });
    }
}

// 순서 업데이트 함수
function updatePostOrders() {
    const orderedPosts  = document.querySelectorAll('.post');
    const totalPosts = orderedPosts.length; // 요소의 총 갯수
    //console.log('정렬된 게시물:', orderedPosts);

    // data-orders 속성 값을 순서에 맞게 업데이트
    orderedPosts.forEach((post, index) => {
        post.setAttribute('data-orders', totalPosts - index ); // 새로운 순서대로 data-orders 재설정
        //console.log(`게시물 ID: ${post.getAttribute('data-postid')} - 새로운 순서: ${totalPosts - index}`);
    });

    // 변경된 순서를 서버에 저장하는 함수 호출
    savePostOrder(orderedPosts);
}
// 게시물 순서 업데이트 함수
async function savePostOrder(orderedPosts) {
    const postsRef = collection(db, 'posts'); // Firestore의 posts 컬렉션 참조

    // NodeList를 배열로 변환
    const orderedPostsArray = Array.from(orderedPosts);

    // 각 게시물의 orders 값을 업데이트
    const updates = orderedPostsArray.map(async (post) => {
        const postId = post.getAttribute('data-postid'); // 게시물 ID
        const newOrder = parseInt(post.getAttribute('data-orders')); // 새로운 순서

        // Firestore에서 해당 게시물 문서 참조
        const postRef = doc(postsRef, postId);

        try {
            // Firestore의 orders 값 업데이트
            await updateDoc(postRef, { orders: newOrder });
            //console.log(`게시물 ID: ${postId} - 새로운 orders 값: ${newOrder}`);
        } catch (error) {
            //console.error(`게시물 ID: ${postId} 업데이트 중 오류 발생:`, error);
        }
    });

    // 모든 업데이트가 완료될 때까지 기다림
    await Promise.all(updates);
}


// 사용 예시
// updatePostOrders(); // 이 함수를 호출하여 게시물 순서 업데이트를 시작합니다.


