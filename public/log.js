import { db } from "./firebase.js"; // Authentication 없이 Firestore만 사용
import { getDoc, doc, getDocs,  addDoc, deleteDoc,  updateDoc, collection, query, orderBy ,where, limit, startAt , startAfter} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// 게시물 ID 가져오기
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const page = parseInt(urlParams.get('page')) || 1;  // page가 없으면 기본값 1

const userId = sessionStorage.getItem('userId'); // 세션에서 로그인 정보 가져오기


let logsData = []; 
// 검색 입력 필드의 입력 변화 감지
document.getElementById('searchInput').addEventListener('input', (e) => {
    const searchTerm = e.target.value.trim();  // 입력된 검색어
    console.log('검색어',searchTerm);
    filterLogs(searchTerm);  // 검색어에 따라 게시물 필터링
});

// 게시물 필터링 함수 (검색어에 따라 필터링)
function filterLogs(searchTerm) {
    const filteredLogs =  logsData.filter(log => log.ip.includes(searchTerm));
    console.log('검색데이타',logsData);
    renderLogs(filteredLogs);  // 필터링된 게시물만 렌더링
}

// 로그인된 사용자의 역할 확인 (관리자면 업로드 및 회원가입 버튼 보이기)
document.addEventListener('DOMContentLoaded', async () => {
    
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
                    // 관리자에게만 업로드 버튼 표시
                    const uploadBtn = document.getElementById('uploadBtn'); if (uploadBtn) uploadBtn.style.display = 'block';

                    // 관리자에게만 회원가입 버튼 표시
                    const signupBtn = document.getElementById('signupBtn'); if (signupBtn) signupBtn.style.display = 'block';

                    // 관리자에게만 주문 초기화 버튼 표시
                    const resetOrdersBtn = document.getElementById('resetOdersBtn'); if (resetOrdersBtn) resetOrdersBtn.style.display = 'block';

                    // 관리자에게만 로그 버튼 표시
                    const logsBtn = document.getElementById('logsBtn'); if (logsBtn) logsBtn.style.display = 'block';                 
                }
            } else {
                console.error('사용자를 찾을 수 없습니다.');
            }
        } catch (error) {
            console.error("역할 확인 오류:", error);
        }
    }
    loadLogs(); // 게시물 불러오기
});

let currentPage = 1; // 현재 페이지 번호
const limitNum = 60;  // 페이지당 게시물 수
let lastVisible = null; // 마지막으로 조회한 문서
let totalLogs = 0; // 총 게시물 수



async function loadLogs(category = 'logins', page = 1) {
    const logList = document.getElementById('logList');
    logList.innerHTML = '';  // 게시물 목록 초기화
    currentPage = page; // 현재 페이지 업데이트

    try {
        // 총 게시물 수를 가져오기 위한 쿼리
        const countQuery = query(collection(db, 'loginlogs'));       
        const countSnapshot = await getDocs(countQuery);
        totalLogs = countSnapshot.size; // 총 게시물 수 설정
        console.log('총 로그 수:', totalLogs); // 총 로그 수 출력

        let querySnapshot;

        // 게시물 쿼리 생성
        let queryRef = query(
            collection(db, 'loginlogs'),
            orderBy('viewedAt', 'desc'),
            limit(limitNum)
        );

        // 페이지 수에 따라 쿼리 조정
        if (page > 1 && lastVisible) {
            // currentPage가 1보다 클 때 마지막 문서로 쿼리 조정
            queryRef = query(
                collection(db, 'loginlogs'),
                orderBy('viewedAt', 'desc'),
                startAfter(lastVisible), // 이전 페이지의 마지막 문서 이후로 시작
                limit(limitNum)
            );
        }

        querySnapshot = await getDocs(queryRef);

        // 마지막 문서 업데이트
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        if (querySnapshot.empty) {
            console.log('조회된 결과가 없습니다.');
            return;
        }

        logsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));
 
        renderLogs(logsData);  // 모든 게시물 초기 렌더링
        updatePagination(currentPage);  // 페이지네이션 업데이트
    } catch (error) {
        console.error('게시물 불러오기 오류:', error);
    }
}

function updatePagination(currentPage, category = 'logins', userId = null, ip = null) {
    const pagination = document.getElementById('pagination');
    pagination.innerHTML = ''; // 기존 페이지네이션 초기화

    const totalPages = Math.ceil(totalLogs / limitNum); // 총 페이지 수 계산
    console.log('총 페이지 수:', totalPages); // 총 페이지 수 출력

    // 페이지 번호 버튼 추가
    for (let i = 1; i <= totalPages; i++) {
        const pageButton = document.createElement('button');
        pageButton.innerText = i;
        pageButton.classList.add('page-btn');
        pageButton.onclick = () => {
            console.log(`현재 페이지: ${currentPage}, 버튼 클릭 페이지: ${i}`);
            
            // userId가 있으면 userId 필터로, ip가 있으면 ip 필터로, 그렇지 않으면 기본 카테고리로 페이지 로드
            if (userId) {
                loadLogsByUserId(userId, i); // 해당 페이지의 userId 필터 로그 로드
            } else if (ip) {
                loadLogsByIp(ip, i); // 해당 페이지의 ip 필터 로그 로드
            } else {
                loadLogs(category, i); // 해당 페이지의 일반 로그 로드
            }
        };

        // 현재 페이지와 일치하는 경우 스타일 추가
        if (i === currentPage) {
            pageButton.classList.add('active');
        }

        pagination.appendChild(pageButton); // 버튼 추가
    }
}



// 탭 클릭 이벤트 처리
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', async () => {
        const category = tab.getAttribute('data-category');

        // 클릭한 탭에 active 클래스 추가하고 나머지 탭에서 제거
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        await loadLogs(category); // 선택된 카테고리로 게시물 로드
    });
});



// 게시물 목록을 렌더링하는 함수
function renderLogs(logs) {
    const logList = document.getElementById('logList');
    logList.innerHTML = '';  // 기존 게시물 목록 초기화

    // 테이블 헤더 추가
    const headerRow = document.createElement('tr');
    headerRow.innerHTML = `
        <th>아이디</th>
        <th>아이피</th>
        <th>날짜</th>
    `;
    logList.appendChild(headerRow);  // 헤더를 테이블에 추가    
    logs.forEach(logData => {
        const logElement = createPostElement(logData);
        logList.appendChild(logElement);
    });
}

// 게시물 요소 생성 함수
function createPostElement(logData) {
    const logDiv = document.createElement('tr');
    logDiv.classList.add('logLine');
    // viewedAt 값을 Date 객체로 변환하고 포맷팅
    const viewedAtDate = logData.viewedAt.toDate(); 
    const formattedDate = `${viewedAtDate.getFullYear()}-${String(viewedAtDate.getMonth() + 1).padStart(2, '0')}-${String(viewedAtDate.getDate()).padStart(2, '0')} ${String(viewedAtDate.getHours()).padStart(2, '0')}:${String(viewedAtDate.getMinutes()).padStart(2, '0')}`;

   
    logDiv.innerHTML = `
    <td class="loginId" data-id="${logData.userId}"><span>${logData.userId}</span></td>
    <td class="loginIp" data-ip="${logData.ip}"><span>${logData.ip}</span></td>
    <td class="loginDate"><span>${formattedDate}</span></td>
  
    `;
    // userId 클릭 이벤트
    logDiv.querySelector('.loginId').addEventListener('click', async function() {
        const clickedUserId = this.getAttribute('data-id');
        console.log(`userId 클릭됨: ${clickedUserId}`);
        await loadLogsByUserId(clickedUserId);  // 클릭된 userId로 필터링된 로그 로드
    });

    // ip 클릭 이벤트
    logDiv.querySelector('.loginIp').addEventListener('click', async function() {
        const clickedIp = this.getAttribute('data-ip');
        console.log(`IP 클릭됨: ${clickedIp}`);
        await loadLogsByIp(clickedIp);  // 클릭된 ip로 필터링된 로그 로드
    });    

    return logDiv;
}



// 업로드 버튼 클릭 시 업로드 페이지로 이동
document.getElementById('uploadBtn').addEventListener('click', () => {
    window.location.href = '/upload';  // 업로드 페이지로 이동
});

// 회원가입 버튼 클릭 시 회원가입 페이지로 이동
document.getElementById('signupBtn').addEventListener('click', () => {
    window.location.href = '/register';  // 회원가입 페이지로 이동
});


// 버튼 클릭 시 resetPostOrders 함수 호출
document.getElementById('resetOdersBtn').addEventListener('click', function() {
    resetPostOrders();
    console.log('재정렬 버튼 클릭됨, updatePostOrders 함수 실행');
});

async function resetPostOrders() {
    const confirmReset = confirm('상품순서를 생성일 기준으로 초기화 하시겠습니까?');
    if(confirmReset){
        const postsRef = collection(db, 'posts');
        
        // Firestore에서 createAt을 기준으로 오름차순으로 정렬된 문서 가져오기
        const q = query(postsRef, orderBy("createdAt", "asc"));
        
        try {
            // 쿼리 실행
            const querySnapshot = await getDocs(q);
            console.log('총 문서 수:', querySnapshot.size);

            let order = 1; // orders 값을 1부터 시작
            const updates = querySnapshot.docs.map((doc) => {
                const postRef = doc.ref;
                console.log(`문서 ID: ${doc.id}, 현재 createAt: ${doc.data().createdAt}, 새로운 orders: ${order}`);
                
                // Firestore에서 orders 값 업데이트
                const updatePromise = updateDoc(postRef, { orders: order });
                order++; // 다음 문서를 위해 order 값을 증가
                return updatePromise;
            });

            // 모든 업데이트가 완료될 때까지 기다림
            await Promise.all(updates);
            console.log('모든 문서의 orders가 성공적으로 업데이트되었습니다.');
            window.location.href = '/';  // 삭제 후 대시보드로 이동
        } catch (error) {
            console.error('orders 업데이트 중 오류 발생:', error);
        }
        loadLogs();
    }
}


// userId로 로그를 로드하는 함수
async function loadLogsByUserId(userId, page = 1) {
    const logList = document.getElementById('logList');
    logList.innerHTML = '';  // 게시물 목록 초기화
    currentPage = page;

    try {
        const countQuery = query(collection(db, 'loginlogs'), where('userId', '==', userId));
        const countSnapshot = await getDocs(countQuery);
        totalLogs = countSnapshot.size;

        let querySnapshot;
        let queryRef = query(
            collection(db, 'loginlogs'),
            where('userId', '==', userId),
            orderBy('viewedAt', 'desc'),
            limit(limitNum)
        );

        if (page > 1 && lastVisible) {
            queryRef = query(
                collection(db, 'loginlogs'),
                where('userId', '==', userId),
                orderBy('viewedAt', 'desc'),
                startAfter(lastVisible),
                limit(limitNum)
            );
        }

        querySnapshot = await getDocs(queryRef);
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        logsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderLogs(logsData);
        updatePagination(currentPage, 'logins', userId);  // 페이지네이션 업데이트 (userId로 필터링)
    } catch (error) {
        console.error(`userId로 로그 불러오기 오류:`, error);
    }
}

// ip로 로그를 로드하는 함수
async function loadLogsByIp(ip, page = 1) {
    const logList = document.getElementById('logList');
    logList.innerHTML = '';  // 게시물 목록 초기화
    currentPage = page;

    try {
        const countQuery = query(collection(db, 'loginlogs'), where('ip', '==', ip));
        const countSnapshot = await getDocs(countQuery);
        totalLogs = countSnapshot.size;

        let querySnapshot;
        let queryRef = query(
            collection(db, 'loginlogs'),
            where('ip', '==', ip),
            orderBy('viewedAt', 'desc'),
            limit(limitNum)
        );

        if (page > 1 && lastVisible) {
            queryRef = query(
                collection(db, 'loginlogs'),
                where('ip', '==', ip),
                orderBy('viewedAt', 'desc'),
                startAfter(lastVisible),
                limit(limitNum)
            );
        }

        querySnapshot = await getDocs(queryRef);
        lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

        logsData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        renderLogs(logsData);
        updatePagination(currentPage, 'logins', null, ip);  // 페이지네이션 업데이트 (ip로 필터링)
    } catch (error) {
        console.error(`IP로 로그 불러오기 오류:`, error);
    }
}