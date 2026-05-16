const TRANSLATIONS = {
    en: {
        app_title: 'weDream',
        tagline: 'A little place for the two of you.',
        your_name: 'Your name',
        your_name_ph: 'e.g. Alex',
        partner_name: "Your partner's name",
        partner_name_ph: 'e.g. Sam',
        start_button: 'Start dreaming together',
        tab_all: 'All',
        tab_mine: 'Mine',
        tab_theirs: 'Theirs',
        tab_shared: 'Shared',
        empty_all: 'No dreams yet — tap + to add the first one.',
        empty_filtered: 'Nothing here yet — try another tab or add a dream.',
        new_dream: 'New dream',
        edit_dream: 'Edit dream',
        field_title: 'Title',
        field_title_ph: 'Visit Kyoto in spring',
        field_details: 'Details',
        field_details_ph: 'Walk under the cherry blossoms together...',
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
        confirm_reset: 'Change your names? Your dreams will be kept.',
        names_required: 'Please enter both names.',
        cat_travel: '✈ Travel',
        cat_home: '🏠 Home',
        cat_adventure: '🌄 Adventure',
        cat_career: '💼 Career',
        cat_family: '👨‍👩‍👧 Family',
        cat_other: '✨ Other',
    },
    ja: {
        app_title: 'weDream',
        tagline: 'ふたりだけの、夢のおきば。',
        your_name: 'あなたの名前',
        your_name_ph: '例：あきら',
        partner_name: 'パートナーの名前',
        partner_name_ph: '例：さくら',
        start_button: 'ふたりで夢を見はじめる',
        tab_all: 'すべて',
        tab_mine: 'わたしの',
        tab_theirs: '相手の',
        tab_shared: 'ふたりの',
        empty_all: 'まだ夢はありません。＋ボタンで追加しましょう。',
        empty_filtered: 'ここにはまだ何もありません。',
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
        confirm_reset: '名前を変更しますか？夢はそのまま残ります。',
        names_required: 'お名前を両方ご入力ください。',
        cat_travel: '✈ 旅行',
        cat_home: '🏠 おうち',
        cat_adventure: '🌄 冒険',
        cat_career: '💼 しごと',
        cat_family: '👨‍👩‍👧 家族',
        cat_other: '✨ その他',
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

function applyTranslations() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        const text = t(key);
        if (el.tagName === 'OPTION') {
            el.textContent = text;
        } else {
            el.textContent = text;
        }
    });

    document.getElementById('setup-me').placeholder = t('your_name_ph');
    document.getElementById('setup-partner').placeholder = t('partner_name_ph');
    document.getElementById('dream-title').placeholder = t('field_title_ph');
    document.getElementById('dream-details').placeholder = t('field_details_ph');

    document.querySelectorAll('.lang-switcher').forEach(sw => {
        sw.querySelectorAll('.lang-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.lang === currentLang);
        });
    });
}
