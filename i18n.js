const TRANSLATIONS = {
    en: {
        app_title: 'weDream',
        tagline: 'A little place for the two of you ♡',

        // Auth
        auth_signin_tab: 'Sign in',
        auth_signup_tab: 'Sign up',
        auth_email: 'Email',
        auth_email_ph: 'you@example.com',
        auth_password: 'Password',
        auth_password_ph: 'At least 6 characters',
        auth_signin_btn: 'Sign in',
        auth_signup_btn: 'Create account',
        auth_err_invalid: 'Invalid email or password.',
        auth_err_in_use: 'Email already in use.',
        auth_err_weak: 'Password must be at least 6 characters.',
        auth_err_required: 'Please enter email and password.',
        auth_err_generic: 'Something went wrong. Please try again.',
        signout: 'Sign out',

        // Couple setup
        couple_setup_title: 'Set up your space',
        couple_tab_create: 'Create new',
        couple_tab_join: 'Join partner',
        couple_create_desc: 'Make an invite code to share with your partner.',
        couple_join_desc: 'Enter the code your partner shared with you.',
        couple_your_name: 'Your name',
        couple_your_name_ph: 'e.g. Alex',
        couple_invite_code: 'Invite code',
        couple_invite_code_ph: 'ABC123',
        couple_create_btn: 'Create',
        couple_join_btn: 'Join',
        couple_share_code: 'Share this code with your partner:',
        copy_code: 'Copy',
        copied: 'Copied!',
        couple_waiting: 'Waiting for your partner to join…',
        couple_err_required: 'Please fill in all fields.',
        couple_err_name_required: 'Please enter your name.',
        couple_err_invalid_code: 'Invite code not found.',
        couple_err_full: 'This space is already full (2 members).',
        couple_err_generic: 'Something went wrong. Please try again.',

        // App
        tab_all: 'All',
        tab_mine: 'Mine',
        tab_theirs: 'Theirs',
        tab_shared: 'Shared',
        empty_all: 'No dreams yet — tap + to add the first one.',
        empty_filtered: 'Nothing here yet — try another tab or add a dream.',

        // Dream modal
        new_dream: 'New dream',
        edit_dream: 'Edit dream',
        field_title: 'Title',
        field_title_ph: 'Visit Kyoto in spring',
        field_details: 'Details',
        field_details_ph: 'Walk under the cherry blossoms together…',
        field_category: 'Category',
        field_owner: 'Whose dream?',
        owner_mine: 'Mine',
        owner_theirs: 'Theirs',
        owner_shared: 'Shared',
        shared_label: '{me} & {partner}',
        cancel: 'Cancel',
        save: 'Save',
        edit: 'Edit',
        delete: 'Delete',
        confirm_delete: 'Delete this dream?',
        confirm_signout: 'Sign out?',

        // Categories
        cat_travel: '✈ Travel',
        cat_home: '🏠 Home',
        cat_adventure: '🌄 Adventure',
        cat_career: '💼 Career',
        cat_family: '👨‍👩‍👧 Family',
        cat_other: '✨ Other',

        // Sample dreams (shown on the auth screen as examples)
        sample_dreams_title: '✨ Some little dreams ✨',
        sample_ex1_title: 'Visit Kyoto in spring',
        sample_ex1_details: 'Walk under the cherry blossoms together.',
        sample_ex2_title: 'Adopt a tiny cat',
        sample_ex2_details: 'A little tabby that follows us around the house.',
        sample_ex3_title: 'See the northern lights',
        sample_ex3_details: 'A green sky over the snow, just the two of us.',
        sample_ex4_title: 'Open a little café together',
        sample_ex4_details: 'Latte art lessons every Sunday morning.',
    },
    ja: {
        app_title: 'weDream',
        tagline: 'ふたりだけの、夢のおきば ♡',

        // Auth
        auth_signin_tab: 'ログイン',
        auth_signup_tab: '新規登録',
        auth_email: 'メールアドレス',
        auth_email_ph: 'you@example.com',
        auth_password: 'パスワード',
        auth_password_ph: '6文字以上',
        auth_signin_btn: 'ログイン',
        auth_signup_btn: 'アカウントを作成',
        auth_err_invalid: 'メールアドレスまたはパスワードが違います。',
        auth_err_in_use: 'このメールアドレスはすでに使われています。',
        auth_err_weak: 'パスワードは6文字以上にしてください。',
        auth_err_required: 'メールアドレスとパスワードを入力してください。',
        auth_err_generic: 'エラーが発生しました。もう一度お試しください。',
        signout: 'ログアウト',

        // Couple setup
        couple_setup_title: 'ふたりの空間を作る',
        couple_tab_create: '新しく作る',
        couple_tab_join: 'パートナーと合流',
        couple_create_desc: '招待コードを作ってパートナーに共有しましょう。',
        couple_join_desc: 'パートナーから受け取った招待コードを入力してください。',
        couple_your_name: 'あなたの名前',
        couple_your_name_ph: '例：あきら',
        couple_invite_code: '招待コード',
        couple_invite_code_ph: 'ABC123',
        couple_create_btn: '作成',
        couple_join_btn: '合流',
        couple_share_code: 'このコードをパートナーに送りましょう：',
        copy_code: 'コピー',
        copied: 'コピーしました！',
        couple_waiting: 'パートナーの参加を待っています…',
        couple_err_required: 'すべての項目を入力してください。',
        couple_err_name_required: 'お名前を入力してください。',
        couple_err_invalid_code: '招待コードが見つかりません。',
        couple_err_full: 'この空間はすでに2人埋まっています。',
        couple_err_generic: 'エラーが発生しました。もう一度お試しください。',

        // App
        tab_all: 'すべて',
        tab_mine: 'わたしの',
        tab_theirs: '相手の',
        tab_shared: 'ふたりの',
        empty_all: 'まだ夢はありません。＋ボタンで追加しましょう。',
        empty_filtered: 'ここにはまだ何もありません。',

        // Dream modal
        new_dream: '新しい夢',
        edit_dream: '夢を編集',
        field_title: 'タイトル',
        field_title_ph: '春に京都へ行く',
        field_details: '詳細',
        field_details_ph: '桜の下をふたりで歩きたい…',
        field_category: 'カテゴリー',
        field_owner: '誰の夢？',
        owner_mine: 'わたしの',
        owner_theirs: '相手の',
        owner_shared: 'ふたりの',
        shared_label: '{me}と{partner}',
        cancel: 'キャンセル',
        save: '保存',
        edit: '編集',
        delete: '削除',
        confirm_delete: 'この夢を削除しますか？',
        confirm_signout: 'ログアウトしますか？',

        // Categories
        cat_travel: '✈ 旅行',
        cat_home: '🏠 おうち',
        cat_adventure: '🌄 冒険',
        cat_career: '💼 しごと',
        cat_family: '👨‍👩‍👧 家族',
        cat_other: '✨ その他',

        // Sample dreams
        sample_dreams_title: '✨ ちいさな夢たち ✨',
        sample_ex1_title: '春に京都へ',
        sample_ex1_details: '桜の下を、ふたりで歩く。',
        sample_ex2_title: '子猫を迎える',
        sample_ex2_details: '家の中をついてくる、小さなトラ猫を。',
        sample_ex3_title: 'オーロラを見に行く',
        sample_ex3_details: '雪の上に、緑色の空。ふたりだけで。',
        sample_ex4_title: 'ふたりで小さなカフェを',
        sample_ex4_details: '毎週日曜の朝はラテアートのレッスン。',
    },
};

const LANG_STORAGE_KEY = 'wedream.lang';

function detectLang() {
    const stored = localStorage.getItem(LANG_STORAGE_KEY);
    if (stored && TRANSLATIONS[stored]) return stored;
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('ja') ? 'ja' : 'en';
}

let currentLang = detectLang();

function t(key, vars = {}) {
    let str = (TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key]) || TRANSLATIONS.en[key] || key;
    for (const [k, v] of Object.entries(vars)) {
        str = str.replace(`{${k}}`, v);
    }
    return str;
}

function setLang(lang) {
    if (!TRANSLATIONS[lang]) return;
    currentLang = lang;
    localStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    applyTranslations();
    if (typeof onLangChange === 'function') onLangChange();
}

function setPlaceholder(id, key) {
    const el = document.getElementById(id);
    if (el) el.placeholder = t(key);
}

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        el.textContent = t(key);
    });

    setPlaceholder('auth-email', 'auth_email_ph');
    setPlaceholder('auth-password', 'auth_password_ph');
    setPlaceholder('couple-create-name', 'couple_your_name_ph');
    setPlaceholder('couple-join-name', 'couple_your_name_ph');
    setPlaceholder('couple-join-code', 'couple_invite_code_ph');
    setPlaceholder('dream-title', 'field_title_ph');
    setPlaceholder('dream-details', 'field_details_ph');

    document.querySelectorAll('.lang-switcher').forEach(sw => {
        sw.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    });
}

document.documentElement.lang = currentLang;
