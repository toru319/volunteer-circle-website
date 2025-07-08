const GAS_API_URL = 'https://script.google.com/macros/s/AKfycbxD2PIACuhmL6jMOsFyZewUHBKMHjUJ2xyf900yJvZSayn1veK76JCMu0s9I3WWP9rSVg/exec'; 

// GAS APIと通信するためのヘルパー関数（GETリクエスト）
async function fetchData(sheetName, action, params = {}) {
    const urlParams = new URLSearchParams(params);
    urlParams.append('sheet', sheetName);
    urlParams.append('action', action);
    const url = `${GAS_API_URL}?${urlParams.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (data && data.error) { // GASからのエラーレスポンスを検出
            throw new Error(data.error);
        }
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        alert('データの取得中にエラーが発生しました: ' + error.message);
        return null;
    }
}

// GAS APIと通信するためのヘルパー関数（POSTリクエスト）
async function postData(sheetName, action, data = {}, id = null) {
    const payload = {
        sheet: sheetName,
        action: action,
        data: data,
        id: id // 更新・削除時に使用
    };

    try {
        const response = await fetch(GAS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (result && result.error) { // GASからのエラーレスポンスを検出
            throw new Error(result.error);
        }
        return result;
    } catch (error) {
        console.error('Post error:', error);
        alert('操作中にエラーが発生しました: ' + error.message);
        return null;
    }
}

// ログイン状態に応じてナビゲーションやウェルカムメッセージを更新する関数
function updateNavigationAndWelcomeMessage() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const loginLink = document.querySelector('a[data-page="login"]');
    const myPageLink = document.querySelector('a[data-page="my-page"]');
    const welcomeMessage = document.querySelector('#my-page .welcome-message');
    const hamburgerNavLinks = document.querySelector('.nav-links');

    if (loggedInUser) {
        // ログイン状態の場合
        if (loginLink) loginLink.textContent = 'ログアウト';
        if (loginLink) loginLink.setAttribute('data-page', 'logout');

        if (myPageLink) myPageLink.style.display = 'block';
        if (welcomeMessage) welcomeMessage.textContent = `ようこそ、${loggedInUser.name}さん`;

        // ログアウト処理のイベントリスナーを動的に追加
        const logoutLink = document.querySelector('a[data-page="logout"]');
        if (logoutLink) {
            logoutLink.removeEventListener('click', handleLogout); // 多重登録防止
            logoutLink.addEventListener('click', handleLogout);
        }

    } else {
        // 未ログイン状態の場合
        if (loginLink) loginLink.textContent = 'ログイン';
        if (loginLink) loginLink.setAttribute('data-page', 'login');
        if (myPageLink) myPageLink.style.display = 'none';
        if (welcomeMessage) welcomeMessage.textContent = 'ようこそ、ゲストさん';
    }

    // ハンバーガーメニュー内の表示も更新
    if (hamburgerNavLinks) {
        const mobileLoginLink = hamburgerNavLinks.querySelector('a[data-page="login"]');
        const mobileMyPageLink = hamburgerNavLinks.querySelector('a[data-page="my-page"]');
        if (loggedInUser) {
            if (mobileLoginLink) mobileLoginLink.textContent = 'ログアウト';
            if (mobileLoginLink) mobileLoginLink.setAttribute('data-page', 'logout');
            if (mobileMyPageLink) mobileMyPageLink.style.display = 'block';
        } else {
            if (mobileLoginLink) mobileLoginLink.textContent = 'ログイン';
            if (mobileLoginLink) mobileLoginLink.setAttribute('data-page', 'login');
            if (mobileMyPageLink) mobileMyPageLink.style.display = 'none';
        }
    }
}

// ログアウト処理
function handleLogout(e) {
    e.preventDefault();
    if (confirm('ログアウトしますか？')) {
        localStorage.removeItem('loggedInUser'); // localStorageからユーザー情報を削除
        alert('ログアウトしました。');
        updateNavigationAndWelcomeMessage(); // ナビゲーションを更新
        showPage('home'); // ホームページに戻る
    }
}

// 活動カードを生成するヘルパー関数
function createActivityCard(activity) {
    const card = document.createElement('div');
    card.classList.add('card');
    
    let statusSpan = '';
    if (activity.status === '募集中') {
        statusSpan = `<span class="status-open">募集中</span>`;
    } else if (activity.status === '募集終了') {
        statusSpan = `<span class="status-full">募集終了</span>`;
    } else if (activity.status === '募集前') {
         statusSpan = `<span class="status-before">募集前</span>`;
    }

    card.innerHTML = `
        <h3>${activity.title}</h3>
        <p><strong>日時:</strong> ${activity.date} ${activity.time}</p>
        <p><strong>場所:</strong> ${activity.location}</p>
        <p><strong>募集状況:</strong> ${statusSpan}</p>
        <p>概要: ${activity.details ? activity.details.substring(0, 50) + '...' : ''}</p>
        <a href="#" class="card-link" data-page="activity-detail" data-activity-id="${activity.activityID}">詳細を見る</a>
    `;
    return card;
}

// 活動データを取得してHTMLに描画する関数
async function loadActivities(containerId, limit = null) {
    const activitiesContainer = document.querySelector(`#${containerId} .card-container`);
    if (!activitiesContainer) return;

    activitiesContainer.innerHTML = '読み込み中...';

    const activities = await fetchData('Activities', 'getAll');

    activitiesContainer.innerHTML = '';

    if (activities && Array.isArray(activities)) {
        activities.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time));

        const displayActivities = limit ? activities.slice(0, limit) : activities;

        if (displayActivities.length === 0) {
            activitiesContainer.innerHTML = '<p>現在、募集中の活動はありません。</p>';
            return;
        }

        displayActivities.forEach(activity => {
            const card = createActivityCard(activity);
            activitiesContainer.appendChild(card);
        });

        activitiesContainer.querySelectorAll('a[data-page="activity-detail"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const activityId = link.getAttribute('data-activity-id');
                loadActivityDetail(activityId); 
            });
        });

    } else {
        activitiesContainer.innerHTML = '<p>活動情報の取得に失敗しました。</p>';
    }
}

// 活動詳細ページにデータを描画する関数
async function loadActivityDetail(activityID) {
    const detailPage = document.getElementById('activity-detail');
    const detailContainer = detailPage.querySelector('.container');
    detailContainer.innerHTML = '活動詳細を読み込み中...';
    showPage('activity-detail'); 

    const activity = await fetchData('Activities', 'getById', { id: activityID });
    if (!activity) {
        detailContainer.innerHTML = '<p>活動情報が見つかりませんでした。</p>';
        return;
    }

    const participants = await fetchData('Registrations', 'getParticipantsByActivityId', { activityID: activityID });

    let participantListHtml = '<ul class="participant-list">';
    if (participants && Array.isArray(participants) && participants.length > 0) {
        participants.forEach(p => {
            participantListHtml += `<li>${p.name} (${p.grade})</li>`;
        });
    } else {
        participantListHtml += '<li>まだ参加者はいません。</li>';
    }
    participantListHtml += '</ul>';

    const currentParticipantsCount = participants ? participants.length : 0;
    const capacity = activity.capacity || '未定';

    let registerButtonHtml = '';
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    if (!loggedInUser) {
        registerButtonHtml = `<button class="btn btn-primary" data-action="login-to-register">ログインして参加登録</button>`;
    } else {
        const userRegistrations = await fetchData('Registrations', 'getUserRegistrations', { userID: loggedInUser.userID });
        const isRegistered = userRegistrations && userRegistrations.some(reg => reg.activityID === activityID && reg.status !== 'キャンセル済み');

        if (activity.status === '募集中' && !isRegistered && (capacity === '未定' || currentParticipantsCount < capacity)) {
            registerButtonHtml = `<button class="btn btn-primary" data-action="register" data-activity-id="${activity.activityID}">参加登録する</button>`;
        } else if (isRegistered) {
            registerButtonHtml = `<button class="btn btn-secondary" disabled>登録済み</button><br><small>マイページから変更・キャンセルしてください。</small>`;
        } else if (activity.status === '募集終了' || (capacity !== '未定' && currentParticipantsCount >= capacity)) {
            registerButtonHtml = `<button class="btn btn-secondary" disabled>募集終了</button>`;
        } else if (activity.status === '募集前') {
            registerButtonHtml = `<button class="btn btn-secondary" disabled>募集前</button>`;
        }
    }


    detailContainer.innerHTML = `
        <h2>${activity.title}</h2>
        <p><strong>日時:</strong> ${activity.date} ${activity.time}</p>
        <p><strong>場所:</strong> ${activity.location}</p>
        <p><strong>集合場所:</strong> ${activity.meetingPlace || '別途連絡'}</p>
        <p><strong>持ち物:</strong> ${activity.belongings || '特になし'}</p>
        <p><strong>服装:</strong> ${activity.dressCode || '動きやすい服装'}</p>
        <p><strong>担当者:</strong> ${activity.contactPerson}</p>
        <p><strong>詳細説明:</strong> ${activity.details}</p>
        <p><strong>注意点:</strong> ${activity.notes || '特になし'}</p>
        
        <h3>現在の参加者 (${currentParticipantsCount}/${capacity}名)</h3>
        ${participantListHtml}

        ${registerButtonHtml}
    `;

    const registerBtn = detailContainer.querySelector('button[data-action="register"]');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            if (!loggedInUser) {
                alert('参加登録にはログインが必要です。');
                showPage('login');
                return;
            }
            const confirmRegister = confirm(`「${activity.title}」に参加登録しますか？`);
            if (confirmRegister) {
                const registrationResult = await postData('Registrations', 'addRegistration', {
                    userID: loggedInUser.userID,
                    activityID: activity.activityID,
                    status: '参加確定',
                    registeredAt: new Date().toISOString()
                });
                if (registrationResult && registrationResult.success) {
                    alert('参加登録が完了しました！マイページでご確認ください。');
                    loadActivityDetail(activityID); // ページを再読み込みして参加者リストを更新
                    showPage('my-page');
                } else {
                    alert('参加登録に失敗しました: ' + (registrationResult ? registrationResult.message || registrationResult.error : '不明なエラー'));
                }
            }
        });
    }
    const loginToRegisterBtn = detailContainer.querySelector('button[data-action="login-to-register"]');
    if (loginToRegisterBtn) {
        loginToRegisterBtn.addEventListener('click', () => {
            alert('参加登録にはログインが必要です。');
            showPage('login');
        });
    }
}

// マイページの登録済み活動を読み込む関数
async function loadMyActivities() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const myActivitiesContainer = document.querySelector('#my-page .my-activities .card-container');
    const pastActivitiesContainer = document.querySelector('#my-page .past-activities .card-container');

    if (!loggedInUser) {
        if (myActivitiesContainer) myActivitiesContainer.innerHTML = '<p>ログインすると、登録済みの活動を確認できます。</p>';
        if (pastActivitiesContainer) pastActivitiesContainer.innerHTML = '';
        return;
    }

    if (myActivitiesContainer) myActivitiesContainer.innerHTML = '登録中の活動を読み込み中...';
    if (pastActivitiesContainer) pastActivitiesContainer.innerHTML = '過去の参加履歴を読み込み中...';

    const userRegistrations = await fetchData('Registrations', 'getUserRegistrations', { userID: loggedInUser.userID });
    
    if (userRegistrations && Array.isArray(userRegistrations)) {
        const allActivities = await fetchData('Activities', 'getAll');
        if (!allActivities) {
            if (myActivitiesContainer) myActivitiesContainer.innerHTML = '<p>活動情報の取得に失敗しました。</p>';
            if (pastActivitiesContainer) pastActivitiesContainer.innerHTML = '';
            return;
        }

        const now = new Date();
        const currentActivities = [];
        const pastActivities = [];

        userRegistrations.forEach(reg => {
            const activity = allActivities.find(act => act.activityID === reg.activityID);
            if (activity) {
                const activityEndTime = new Date(activity.date + ' ' + activity.time);
                if (activityEndTime > now && reg.status !== 'キャンセル済み') {
                    currentActivities.push({ ...activity, registrationStatus: reg.status, registrationID: reg.registrationID });
                } else {
                    pastActivities.push({ ...activity, registrationStatus: reg.status, registrationID: reg.registrationID });
                }
            }
        });

        // 現在登録中の活動の表示
        if (myActivitiesContainer) {
            myActivitiesContainer.innerHTML = '';
            if (currentActivities.length === 0) {
                myActivitiesContainer.innerHTML = '<p>現在、登録中の活動はありません。</p>';
            } else {
                currentActivities.forEach(activity => {
                    const card = document.createElement('div');
                    card.classList.add('card');
                    card.innerHTML = `
                        <h4>${activity.title}</h4>
                        <p><strong>日時:</strong> ${activity.date} ${activity.time}</p>
                        <p><strong>参加状況:</strong> <span class="status-confirmed">${activity.registrationStatus}</span></p>
                        <div class="my-activity-actions">
                            <button class="btn btn-secondary" data-action="edit-registration" data-registration-id="${activity.registrationID}">修正</button>
                            <button class="btn btn-danger" data-action="cancel-registration" data-registration-id="${activity.registrationID}" data-activity-title="${activity.title}">キャンセル</button>
                        </div>
                    `;
                    myActivitiesContainer.appendChild(card);
                });

                myActivitiesContainer.querySelectorAll('button[data-action="cancel-registration"]').forEach(button => {
                    button.addEventListener('click', async (e) => {
                        const registrationID = e.target.getAttribute('data-registration-id');
                        const activityTitle = e.target.getAttribute('data-activity-title');
                        if (confirm(`「${activityTitle}」への参加をキャンセルしますか？`)) {
                            const cancelResult = await postData('Registrations', 'update', { status: 'キャンセル済み' }, registrationID);
                            if (cancelResult && cancelResult.success) {
                                alert('参加をキャンセルしました。');
                                loadMyActivities();
                            } else {
                                alert('キャンセルに失敗しました: ' + (cancelResult ? cancelResult.message || cancelResult.error : '不明なエラー'));
                            }
                        }
                    });
                });
            }
        }

        // 過去の参加履歴の表示
        if (pastActivitiesContainer) {
            pastActivitiesContainer.innerHTML = '';
            if (pastActivities.length === 0) {
                pastActivitiesContainer.innerHTML = '<p>過去の参加履歴はありません。</p>';
            } else {
                pastActivities.forEach(activity => {
                    const card = document.createElement('div');
                    card.classList.add('card', 'card-past');
                    card.innerHTML = `
                        <h4>${activity.title}</h4>
                        <p><strong>日時:</strong> ${activity.date}</p>
                        <p>${activity.registrationStatus === 'キャンセル済み' ? 'キャンセル済み' : '無事終了しました'}</p>
                    `;
                    pastActivitiesContainer.appendChild(card);
                });
            }
        }

    } else {
        if (myActivitiesContainer) myActivitiesContainer.innerHTML = '<p>登録済みの活動を取得できませんでした。</p>';
        if (pastActivitiesContainer) pastActivitiesContainer.innerHTML = '';
    }
}


document.addEventListener('DOMContentLoaded', () => {

    // --- SPAページ切り替えの基本ロジック ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('a[data-page]');

    // hamburgerとmobileNavの宣言をここへ移動
    const hamburger = document.getElementById('hamburger-menu');
    const mobileNav = document.querySelector('.nav-links');

    // showPage関数はDOMContentLoadedスコープの直下に定義されているため、他の関数からアクセス可能
    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            document.getElementById('home').classList.add('active');
        }
        window.scrollTo(0, 0);
        closeMobileMenu(); 
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            const activityId = link.getAttribute('data-activity-id');

            if (pageId === 'activity-detail' && activityId) {
                loadActivityDetail(activityId);
            } else if (pageId === 'home') {
                showPage(pageId);
                loadActivities('home', 3);
            } else if (pageId === 'activity-list') {
                showPage(pageId);
                loadActivities('activity-list');
            } else if (pageId === 'logout') {
                 handleLogout(e);
            } else if (pageId === 'my-page') {
                showPage(pageId);
                loadMyActivities();
            } else if (pageId === 'login' && localStorage.getItem('loggedInUser')) {
                handleLogout(e);
            }
            else {
                showPage(pageId);
            }
        });
    });

    // 初期ページ表示とナビゲーション更新
    showPage('home');
    updateNavigationAndWelcomeMessage();
    loadActivities('home', 3);
    loadActivities('activity-list');
    loadMyActivities();


    // --- ハンバーガーメニュー ---
    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
    });
    
    function closeMobileMenu() {
        if (mobileNav) { // mobileNavが存在するか確認するガードを追加
            mobileNav.classList.remove('active');
        }
    }

    // --- 各ページのDOM操作やイベントハンドリング ---

    // ★新規登録ページは削除または非表示にするため、関連コードをコメントアウトまたは削除
    // const signupForm = document.querySelector('#signup form');
    // if(signupForm) {
    //     signupForm.addEventListener('submit', async (e) => {
    //         e.preventDefault();

    //         const name = document.getElementById('signup-name').value;
    //         const grade = document.getElementById('signup-grade').value;
    //         const email = document.getElementById('signup-email').value;
    //         const password = document.getElementById('signup-password').value;

    //         if (!name || !grade || !email || !password) {
    //             alert('すべての項目を入力してください。');
    //             return;
    //         }

    //         const userData = {
    //             name: name,
    //             grade: grade,
    //             email: email,
    //             password: password,
    //             role: 'user',
    //             createdAt: new Date().toISOString()
    //         };

    //         const result = await postData('Users', 'addUser', userData);
            
    //         if (result && result.success) {
    //             alert('新規登録が完了しました！ログインしてください。');
    //             signupForm.reset();
    //             showPage('login');
    //         } else {
    //             alert('登録に失敗しました: ' + (result ? result.message || result.error : '不明なエラー'));
    //         }
    //     });
    // }

    // --- ログインページ ---
    const loginForm = document.querySelector('#login form');
    if(loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const loginID = document.getElementById('login-id').value; // ★メールアドレスの代わりにIDを取得★
            const password = document.getElementById('login-password').value; // 生パスワードをそのまま送る

            if (!loginID || !password) {
                alert('IDとパスワードを入力してください。');
                return;
            }

            const loginData = {
                loginID: loginID, // ★loginIDを送る★
                password: password
            };

            const result = await postData('Users', 'login', loginData);

            if (result && result.success) {
                alert('ログイン成功！');
                localStorage.setItem('loggedInUser', JSON.stringify(result.user));
                loginForm.reset();
                updateNavigationAndWelcomeMessage();
                showPage('my-page');
            } else {
                alert('ログインに失敗しました: ' + (result ? result.message || result.error : '不明なエラー'));
            }
        });
    }

    // --- 活動一覧ページ ---
    const filterButton = document.querySelector('#activity-list .btn-secondary');
    if(filterButton) {
        filterButton.addEventListener('click', async () => {
            const keyword = document.querySelector('.filter-keyword').value;
            const category = document.querySelector('.filter-category').value;
            const date = document.querySelector('.filter-date').value;
            
            const filteredActivities = await fetchData('Activities', 'getAll', {
                keyword: keyword,
                category: category,
                date: date
            });

            const activitiesContainer = document.querySelector('#activity-list .card-container');
            activitiesContainer.innerHTML = '';

            if (filteredActivities && Array.isArray(filteredActivities) && filteredActivities.length > 0) {
                 filteredActivities.forEach(activity => {
                    const card = createActivityCard(activity);
                    activitiesContainer.appendChild(card);
                });
                activitiesContainer.querySelectorAll('a[data-page="activity-detail"]').forEach(link => {
                    link.addEventListener('click', (e) => {
                        e.preventDefault();
                        const activityId = link.getAttribute('data-activity-id');
                        loadActivityDetail(activityId); 
                    });
                });
            } else {
                activitiesContainer.innerHTML = '<p>該当する活動は見つかりませんでした。</p>';
            }
        });
    }
});