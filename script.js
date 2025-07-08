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


    // --- ログインページ ---
    // TODO: ログインフォームの送信処理
    const loginForm = document.querySelector('#login form');
    if(loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Login form submitted');
            // ここにログイン認証のロジックを記述
            // 成功したらマイページへ
            showPage('my-page');
        });
    }


    // --- 新規登録ページ ---
    // TODO: 新規登録フォームの送信処理
    const signupForm = document.querySelector('#signup form');
    if(signupForm) {
        signupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log('Signup form submitted');
            // ここに新規ユーザー登録のロジックを記述
            // 成功したらログインページへ
            showPage('login');
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
