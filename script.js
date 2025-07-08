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

// script.js のどこか（DOMContentLoaded の外側が良いでしょう）

// ログイン状態に応じてナビゲーションやウェルカムメッセージを更新する関数
function updateNavigationAndWelcomeMessage() {
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const loginLink = document.querySelector('a[data-page="login"]');
    const myPageLink = document.querySelector('a[data-page="my-page"]');
    const welcomeMessage = document.querySelector('#my-page .welcome-message');
    const hamburgerNavLinks = document.querySelector('.nav-links'); // ハンバーガーメニュー内のナビゲーション

    if (loggedInUser) {
        // ログイン状態の場合
        if (loginLink) loginLink.textContent = 'ログアウト';
        if (loginLink) loginLink.setAttribute('data-page', 'logout'); // ログアウトアクションに変更

        if (myPageLink) myPageLink.style.display = 'block'; // マイページを表示
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
        if (myPageLink) myPageLink.style.display = 'none'; // マイページを非表示
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


// document.addEventListener('DOMContentLoaded', () => の中、初期ページ表示の後に呼び出す
    showPage('home'); // 初期ページ表示
    updateNavigationAndWelcomeMessage(); // ログイン状態をチェックし、UIを更新

document.addEventListener('DOMContentLoaded', () => {

    // --- SPAページ切り替えの基本ロジック ---
    const pages = document.querySelectorAll('.page');
    const navLinks = document.querySelectorAll('a[data-page]');

    function showPage(pageId) {
        pages.forEach(page => {
            page.classList.remove('active');
        });
        const targetPage = document.getElementById(pageId);
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            // デフォルトでホームページを表示
            document.getElementById('home').classList.add('active');
        }
        // ページ切り替え時にウィンドウのトップにスクロール
        window.scrollTo(0, 0);
        // モバイルメニューが開いていれば閉じる
        closeMobileMenu();
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = link.getAttribute('data-page');
            showPage(pageId);
        });
    });

    // 初期ページ表示
    showPage('home');

    // --- ハンバーガーメニュー ---
    const hamburger = document.getElementById('hamburger-menu');
    const mobileNav = document.querySelector('.nav-links');

    hamburger.addEventListener('click', () => {
        mobileNav.classList.toggle('active');
    });
    
    function closeMobileMenu() {
        mobileNav.classList.remove('active');
    }

    // --- 各ページのDOM操作やイベントハンドリングのひな形 ---

    // --- ホームページ ---
    // 新着活動の詳細を見るリンクにイベントリスナーを追加
    // (実際の動作は上位のnavLinksの処理でカバーされる)

    // --- 活動一覧ページ ---
    // TODO: フィルタリング機能の実装
    const filterButton = document.querySelector('#activity-list .btn-secondary');
    if(filterButton) {
        filterButton.addEventListener('click', () => {
            console.log('Filtering activities...');
            // ここにキーワード、カテゴリ、日付に基づいた絞り込みロジックを記述
        });
    }


    // --- 活動詳細ページ ---
    // TODO: 参加登録ボタンのイベントリスナー
    const registerButton = document.querySelector('#activity-detail .btn-primary');
    if(registerButton) {
        registerButton.addEventListener('click', () => {
            alert('参加登録が完了しました！ (これは仮のメッセージです)');
            // ここに参加登録のロジックを記述
            // 例: ログイン状態を確認し、未ログインならログインページへ誘導
            showPage('my-page');
        });
    }


// TODO: ログインフォームの送信処理
// --- ログインページ ---
const loginForm = document.querySelector('#login form');
if(loginForm) {
    loginForm.addEventListener('submit', async (e) => { // asyncを追加
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            alert('メールアドレスとパスワードを入力してください。');
            return;
        }

        const loginData = {
            email: email,
            password: password
        };

        const result = await postData('Users', 'login', loginData); // 'login' アクションを定義

        if (result && result.success) {
            alert('ログイン成功！');
            // ログイン成功後、ユーザー情報をlocalStorageに保存してセッションを管理
            localStorage.setItem('loggedInUser', JSON.stringify(result.user));
            loginForm.reset(); // フォームをクリア
            updateNavigationAndWelcomeMessage(); // ナビゲーションやウェルカムメッセージを更新する関数を呼び出す
            showPage('my-page'); // 成功したらマイページへ
        } else {
            alert('ログインに失敗しました: ' + (result ? result.message || result.error : '不明なエラー'));
        }
    });
}


// --- 新規登録ページ ---
const signupForm = document.querySelector('#signup form');
if(signupForm) {
    signupForm.addEventListener('submit', async (e) => { // asyncを追加
        e.preventDefault();

        const name = document.getElementById('signup-name').value;
        const grade = document.getElementById('signup-grade').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;

        if (!name || !grade || !email || !password) {
            alert('すべての項目を入力してください。');
            return;
        }

        const userData = {
            name: name,
            grade: grade,
            email: email,
            password: password, // GAS側でハッシュ化される
            role: 'user', // デフォルトは一般ユーザー
            createdAt: new Date().toISOString()
        };

        const result = await postData('Users', 'addUser', userData); // 'addUser' アクションを新しく定義

        if (result && result.success) {
            alert('新規登録が完了しました！ログインしてください。');
            signupForm.reset(); // フォームをクリア
            showPage('login'); // 成功したらログインページへ
        } else {
            alert('登録に失敗しました: ' + (result ? result.message || result.error : '不明なエラー'));
        }
    });
}


    // --- マイページ ---
    // TODO: 登録済み活動のキャンセル・修正ボタンのイベントリスナー
    const cancelButtons = document.querySelectorAll('#my-page .btn-danger');
    cancelButtons.forEach(button => {
        button.addEventListener('click', () => {
            if(confirm('この活動への参加をキャンセルしますか？')) {
                console.log('Activity cancelled');
                // ここにキャンセル処理を記述
                // 例: 対象のカードを非表示にする
                button.closest('.card').remove();
            }
        });
    });

});
