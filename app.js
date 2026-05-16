const STORAGE_KEY = 'wedream.v1';

const state = {
    me: '',
    partner: '',
    dreams: [],
    activeTab: 'all',
    editingId: null,
};

const CATEGORIES = ['travel', 'home', 'adventure', 'career', 'family', 'other'];

function load() {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('ourdreams.v1');
    if (!raw) return false;
    try {
        const data = JSON.parse(raw);
        state.me = data.me || '';
        state.partner = data.partner || '';
        state.dreams = Array.isArray(data.dreams) ? data.dreams : [];
        return !!(state.me && state.partner);
    } catch {
        return false;
    }
}

function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        me: state.me,
        partner: state.partner,
        dreams: state.dreams,
    }));
}

function populateCategorySelect() {
    const sel = document.getElementById('dream-category');
    const current = sel.value;
    sel.innerHTML = CATEGORIES
        .map(c => `<option value="${c}">${t('cat_' + c)}</option>`)
        .join('');
    if (current) sel.value = current;
}

function showApp() {
    document.getElementById('setup').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    document.getElementById('name-me').textContent = state.me;
    document.getElementById('name-partner').textContent = state.partner;
    populateCategorySelect();
    render();
}

function showSetup() {
    document.getElementById('app').classList.add('hidden');
    document.getElementById('setup').classList.remove('hidden');
}

function ownerLabel(owner) {
    if (owner === 'me') return state.me;
    if (owner === 'partner') return state.partner;
    return t('shared_label', { me: state.me, partner: state.partner });
}

function filteredDreams() {
    if (state.activeTab === 'all') return state.dreams;
    const map = { mine: 'me', theirs: 'partner', shared: 'shared' };
    const target = map[state.activeTab];
    return state.dreams.filter(d => d.owner === target);
}

function render() {
    const list = document.getElementById('dreams-list');
    const dreams = filteredDreams();

    if (dreams.length === 0) {
        const key = state.activeTab === 'all' ? 'empty_all' : 'empty_filtered';
        list.innerHTML = `<div class="empty-state"><p>${escapeHtml(t(key))}</p></div>`;
        return;
    }

    list.innerHTML = dreams
        .slice()
        .sort((a, b) => b.createdAt - a.createdAt)
        .map(d => `
            <article class="dream-card owner-${d.owner}">
                <div class="dream-meta">
                    <span class="dream-tag">${escapeHtml(t('cat_' + d.category))}</span>
                    <span>${escapeHtml(ownerLabel(d.owner))}</span>
                </div>
                <h3 class="dream-title">${escapeHtml(d.title)}</h3>
                ${d.details ? `<p class="dream-details">${escapeHtml(d.details)}</p>` : ''}
                <div class="dream-actions">
                    <button data-action="edit" data-id="${d.id}">${escapeHtml(t('edit'))}</button>
                    <button data-action="delete" data-id="${d.id}">${escapeHtml(t('delete'))}</button>
                </div>
            </article>
        `).join('');
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function openModal(dream = null) {
    state.editingId = dream ? dream.id : null;
    document.getElementById('modal-title').textContent = t(dream ? 'edit_dream' : 'new_dream');
    document.getElementById('dream-title').value = dream ? dream.title : '';
    document.getElementById('dream-details').value = dream ? dream.details : '';
    document.getElementById('dream-category').value = dream ? dream.category : 'travel';
    document.getElementById('dream-owner').value = dream ? dream.owner : 'me';
    document.getElementById('dream-modal').classList.remove('hidden');
    setTimeout(() => document.getElementById('dream-title').focus(), 50);
}

function closeModal() {
    document.getElementById('dream-modal').classList.add('hidden');
    state.editingId = null;
}

function saveDream() {
    const title = document.getElementById('dream-title').value.trim();
    if (!title) {
        document.getElementById('dream-title').focus();
        return;
    }
    const details = document.getElementById('dream-details').value.trim();
    const category = document.getElementById('dream-category').value;
    const owner = document.getElementById('dream-owner').value;

    if (state.editingId) {
        const idx = state.dreams.findIndex(d => d.id === state.editingId);
        if (idx >= 0) {
            state.dreams[idx] = { ...state.dreams[idx], title, details, category, owner };
        }
    } else {
        state.dreams.push({
            id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
            title, details, category, owner,
            createdAt: Date.now(),
        });
    }
    save();
    closeModal();
    render();
}

function deleteDream(id) {
    if (!confirm(t('confirm_delete'))) return;
    state.dreams = state.dreams.filter(d => d.id !== id);
    save();
    render();
}

function startSetup() {
    const me = document.getElementById('setup-me').value.trim();
    const partner = document.getElementById('setup-partner').value.trim();
    if (!me || !partner) {
        alert(t('names_required'));
        return;
    }
    state.me = me;
    state.partner = partner;
    save();
    showApp();
}

function onLangChange() {
    populateCategorySelect();
    if (!document.getElementById('app').classList.contains('hidden')) {
        render();
    }
}

function attachListeners() {
    document.getElementById('setup-start').addEventListener('click', startSetup);
    document.getElementById('add-btn').addEventListener('click', () => openModal());
    document.getElementById('modal-cancel').addEventListener('click', closeModal);
    document.getElementById('modal-save').addEventListener('click', saveDream);

    document.getElementById('dream-modal').addEventListener('click', (e) => {
        if (e.target.id === 'dream-modal') closeModal();
    });

    document.querySelectorAll('.tab').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.activeTab = btn.dataset.tab;
            render();
        });
    });

    document.getElementById('dreams-list').addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;
        const id = btn.dataset.id;
        if (btn.dataset.action === 'delete') deleteDream(id);
        if (btn.dataset.action === 'edit') {
            const dream = state.dreams.find(d => d.id === id);
            if (dream) openModal(dream);
        }
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        if (confirm(t('confirm_reset'))) {
            showSetup();
            document.getElementById('setup-me').value = state.me;
            document.getElementById('setup-partner').value = state.partner;
        }
    });

    document.querySelectorAll('.lang-switcher .lang-btn').forEach(btn => {
        btn.addEventListener('click', () => setLang(btn.dataset.lang));
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

applyTranslations();
document.documentElement.lang = currentLang;

if (load()) {
    showApp();
} else {
    showSetup();
}
attachListeners();
