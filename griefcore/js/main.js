document.addEventListener('DOMContentLoaded', () => {
    if (window.AOS) {
        AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
    }

    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');

    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            menuToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target) && navMenu.classList.contains('active')) {
                menuToggle.classList.remove('active');
                navMenu.classList.remove('active');
            }
        });
    }

    const copyIp = document.getElementById('copyIp');
    const serverIp = document.getElementById('serverIp');
    if (copyIp && serverIp) {
        copyIp.addEventListener('click', async () => {
            try {
                await navigator.clipboard.writeText(serverIp.textContent.trim());
                copyIp.textContent = 'Скопировано';
            } catch (error) {
                copyIp.textContent = serverIp.textContent.trim();
            }
            setTimeout(() => {
                copyIp.textContent = 'Скопировать IP';
            }, 2000);
        });
    }

    const tabs = document.querySelectorAll('.auth-tab');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const authMessage = document.getElementById('authMessage');

    tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
            tabs.forEach((item) => item.classList.toggle('active', item === tab));
            const register = tab.dataset.tab === 'register';
            if (loginForm) loginForm.classList.toggle('hidden', register);
            if (registerForm) registerForm.classList.toggle('hidden', !register);
            if (authMessage) {
                authMessage.textContent = '';
                authMessage.classList.remove('error');
            }
        });
    });

    const apiBase = 'https://griefcore-site.pages.dev';

    async function sendAuth(url, body) {
        const path = url.startsWith('/') ? url : '/' + url;
        const token = localStorage.getItem('gc_session');
        const response = await fetch(apiBase + path, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
            body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(data.error || 'Ошибка запроса');
        }
        return data;
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(loginForm);
            try {
                const result = await sendAuth('/api/login', {
                    identifier: data.get('identifier').trim(),
                    password: data.get('password'),
                });
                localStorage.setItem('gc_session', result.token);
                window.location.href = 'account.html';
            } catch (error) {
                authMessage.textContent = error.message;
                authMessage.classList.add('error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(registerForm);
            try {
                const result = await sendAuth('/api/register', {
                    username: data.get('username').trim(),
                    email: data.get('email').trim(),
                    password: data.get('password'),
                    accept: document.querySelector('#registerForm [name="accept"]').checked,
                });
                localStorage.setItem('gc_session', result.token);
                window.location.href = 'account.html';
            } catch (error) {
                authMessage.textContent = error.message;
                authMessage.classList.add('error');
            }
        });
    }

    document.querySelectorAll('.buy-btn').forEach((button) => {
        button.addEventListener('click', () => {
            const nickname = document.getElementById('playerNick');
            if (!nickname || !nickname.value.trim()) {
                window.alert('Введите ваш ник на сервере');
                return;
            }
            window.alert('Сервер не открыт, поэтому это недоступно');
        });
    });

    const authLink = document.querySelector('.nav-menu .auth-btn');
    if (authLink) {
        const savedToken = localStorage.getItem('gc_session');
        fetch(apiBase + '/api/me', {
            headers: savedToken ? { Authorization: `Bearer ${savedToken}` } : {},
        })
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (!data || !data.user) return;
                authLink.textContent = data.user.username;
                authLink.href = 'account.html';
            })
            .catch(() => {});
    }

    const rulesList = document.getElementById('rulesList');
    if (rulesList) {
        const rulesMessage = document.getElementById('rulesMessage');
        let isAdmin = false;

        const escapeHtml = (value) => String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');

        async function loadRules() {
            try {
                const response = await fetch(apiBase + '/api/rules');
                const data = await response.json();
                const rules = data.rules || [];
                rulesList.innerHTML = rules.length
                    ? rules.map((rule) => `
                        <div class="card-item" data-aos="fade-up">
                            <h3>${escapeHtml(rule.title)}</h3>
                            <p>${escapeHtml(rule.body).replace(/\n/g, '<br>')}</p>
                            ${isAdmin ? `<button type="button" class="link-btn rule-delete" data-id="${rule.id}">Удалить</button>` : ''}
                        </div>`).join('')
                    : '<p class="subtitle">Правил пока нет.</p>';
                rulesList.querySelectorAll('.rule-delete').forEach((button) => {
                    button.addEventListener('click', async () => {
                        try {
                            await sendAuth('/api/rules', { action: 'delete', id: Number(button.dataset.id) });
                            await loadRules();
                        } catch (error) {
                            rulesMessage.textContent = error.message;
                            rulesMessage.classList.add('error');
                        }
                    });
                });
            } catch (error) {
                rulesMessage.textContent = error.message;
                rulesMessage.classList.add('error');
            }
        }

        const savedToken = localStorage.getItem('gc_session');
        if (savedToken) {
            fetch(apiBase + '/api/me', { headers: { Authorization: `Bearer ${savedToken}` } })
                .then((response) => (response.ok ? response.json() : null))
                .then((data) => {
                    if (data && data.user && data.user.role === 'admin') {
                        isAdmin = true;
                        document.getElementById('adminRules').classList.remove('hidden');
                    }
                    return loadRules();
                })
                .catch(() => loadRules());
        } else {
            loadRules();
        }

        const ruleForm = document.getElementById('ruleForm');
        if (ruleForm) {
            ruleForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = new FormData(ruleForm);
                try {
                    const result = await sendAuth('/api/rules', {
                        title: data.get('title').trim(),
                        body: data.get('body').trim(),
                    });
                    if (result.ok) {
                        rulesMessage.textContent = 'Правило добавлено';
                        rulesMessage.classList.remove('error');
                        ruleForm.reset();
                        await loadRules();
                    }
                } catch (error) {
                    rulesMessage.textContent = error.message;
                    rulesMessage.classList.add('error');
                }
            });
        }
    }

    const adminPanel = document.getElementById('adminPanel');
    const adminResults = document.getElementById('adminResults');
    const adminMessage = document.getElementById('adminMessage');
    const roleNames = { user: 'Игрок', helper: 'Помощник', mod: 'Модератор', admin: 'Админ', owner: 'Владелец' };

    function escapeText(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    async function loadUsers(query) {
        if (!adminResults) return;
        try {
            const token = localStorage.getItem('gc_session');
            const response = await fetch(
                apiBase + '/api/admin/users?q=' + encodeURIComponent(query || ''),
                { headers: token ? { Authorization: `Bearer ${token}` } : {} }
            );
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
            const users = data.users || [];
            adminResults.innerHTML = users.length
                ? users.map((user) => `
                    <div class="card-item admin-user" data-id="${user.id}">
                        <h3><a href="profile.html?user=${encodeURIComponent(user.username)}">${escapeText(user.username)}</a></h3>
                        <p class="subtitle">${escapeText(user.email)}</p>
                        <div class="admin-user-row">
                            <select class="role-select">
                                ${Object.entries(roleNames).map(([value, label]) => `<option value="${value}"${user.role === value ? ' selected' : ''}>${label}</option>`).join('')}
                            </select>
                            <button type="button" class="auth-submit role-save">Сохранить</button>
                        </div>
                    </div>`).join('')
                : '<p class="subtitle">Аккаунты не найдены.</p>';

            adminResults.querySelectorAll('.admin-user').forEach((card) => {
                card.querySelector('.role-save').addEventListener('click', async () => {
                    try {
                        const result = await sendAuth('/api/admin/role', {
                            id: Number(card.dataset.id),
                            role: card.querySelector('.role-select').value,
                        });
                        if (!result.ok) return;
                        adminMessage.textContent = 'Роль обновлена';
                        adminMessage.classList.remove('error');
                    } catch (error) {
                        adminMessage.textContent = error.message;
                        adminMessage.classList.add('error');
                    }
                });
            });
        } catch (error) {
            adminMessage.textContent = error.message;
            adminMessage.classList.add('error');
        }
    }

    const userSearchForm = document.getElementById('userSearchForm');
    if (userSearchForm) {
        userSearchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const data = new FormData(userSearchForm);
            loadUsers(data.get('q').trim());
        });
    }

    const profileBox = document.getElementById('profileBox');
    if (profileBox) {
        const profileParams = new URLSearchParams(window.location.search);
        const profileName = profileParams.get('user') || '';
        const profileMessage = document.getElementById('profileAdminMessage');
        let profileId = null;

        async function loadProfile() {
            try {
                const token = localStorage.getItem('gc_session');
                const response = await fetch(
                    apiBase + '/api/profile?user=' + encodeURIComponent(profileName),
                    { headers: token ? { Authorization: `Bearer ${token}` } : {} }
                );
                const data = await response.json();
                if (!response.ok) {
                    profileBox.textContent = data.error || 'Профиль не найден';
                    return;
                }
                const profile = data.profile;
                profileId = profile.id || null;
                const avatar = profile.avatar || 'https://i.ibb.co/spppKJRL/logo.png';
                profileBox.innerHTML = `
                    <img src="${escapeText(avatar)}" alt="${escapeText(profile.username)}" class="profile-avatar">
                    <h3>${escapeText(profile.username)}</h3>
                    <p class="subtitle">Роль: ${escapeText(roleNames[profile.role] || profile.role)}</p>
                    <p class="subtitle">Статус: ${profile.banned ? 'Заблокирован' : 'Активен'}</p>
                    <p class="subtitle">На сайте с ${escapeText(profile.created_at || '')}</p>
                    ${profile.email ? `<p class="subtitle">${escapeText(profile.email)}</p>` : ''}`;
                if (data.viewer_role === 'admin' || data.viewer_role === 'owner') {
                    document.getElementById('profileAdmin').classList.remove('hidden');
                    const banButton = document.getElementById('profileBan');
                    banButton.dataset.banned = profile.banned ? '1' : '0';
                    banButton.textContent = profile.banned ? 'Разблокировать' : 'Заблокировать';
                }
            } catch (error) {
                profileBox.textContent = error.message;
            }
        }

        const profileUsernameForm = document.getElementById('profileUsernameForm');
        if (profileUsernameForm) {
            profileUsernameForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = new FormData(profileUsernameForm);
                try {
                    const result = await sendAuth('/api/admin/user', {
                        action: 'username',
                        id: profileId,
                        username: data.get('username').trim(),
                    });
                    if (!result.ok) return;
                    profileMessage.textContent = 'Логин изменён';
                    profileMessage.classList.remove('error');
                    window.location.href = 'profile.html?user=' + encodeURIComponent(result.username);
                } catch (error) {
                    profileMessage.textContent = error.message;
                    profileMessage.classList.add('error');
                }
            });
        }

        const profileAvatarForm = document.getElementById('profileAvatarForm');
        if (profileAvatarForm) {
            profileAvatarForm.addEventListener('submit', async (event) => {
                event.preventDefault();
                const data = new FormData(profileAvatarForm);
                try {
                    const result = await sendAuth('/api/admin/user', {
                        action: 'avatar',
                        id: profileId,
                        avatar: data.get('avatar').trim(),
                    });
                    if (!result.ok) return;
                    profileMessage.textContent = 'Аватар сохранён';
                    profileMessage.classList.remove('error');
                    await loadProfile();
                } catch (error) {
                    profileMessage.textContent = error.message;
                    profileMessage.classList.add('error');
                }
            });
        }

        const profileBan = document.getElementById('profileBan');
        if (profileBan) {
            profileBan.addEventListener('click', async () => {
                try {
                    const result = await sendAuth('/api/admin/user', {
                        action: 'ban',
                        id: profileId,
                        banned: profileBan.dataset.banned !== '1',
                    });
                    if (!result.ok) return;
                    profileMessage.textContent = result.banned ? 'Игрок заблокирован' : 'Игрок разблокирован';
                    profileMessage.classList.remove('error');
                    await loadProfile();
                } catch (error) {
                    profileMessage.textContent = error.message;
                    profileMessage.classList.add('error');
                }
            });
        }

        const profileDelete = document.getElementById('profileDelete');
        if (profileDelete) {
            profileDelete.addEventListener('click', async () => {
                if (!window.confirm('Удалить аккаунт игрока?')) return;
                try {
                    const result = await sendAuth('/api/admin/user', { action: 'delete', id: profileId });
                    if (!result.ok) return;
                    window.location.href = 'index.html';
                } catch (error) {
                    profileMessage.textContent = error.message;
                    profileMessage.classList.add('error');
                }
            });
        }

        loadProfile();
    }

    const newsList = document.getElementById('newsList');
    if (newsList) {
        const newsAdmin = document.getElementById('newsAdmin');
        const newsEditor = document.getElementById('newsEditor');
        const newsMessage = document.getElementById('newsMessage');

        async function loadNews() {
            try {
                const token = localStorage.getItem('gc_session');
                const response = await fetch(apiBase + '/api/news', {
                    headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.error || 'Ошибка запроса');
                if (data.can_edit) {
                    newsAdmin.classList.remove('hidden');
                    newsEditor.focus();
                }
                const items = data.news || [];
                newsList.innerHTML = items.length
                    ? items.map((item) => `
                        <div class="card-item news-item" data-aos="fade-up">
                            <p class="news-date">${escapeText(item.created_at)}</p>
                            <p>${escapeText(item.content).replace(/\n/g, '<br>')}</p>
                        </div>`).join('')
                    : '<p class="subtitle">Новостей пока нет.</p>';
            } catch (error) {
                newsMessage.textContent = error.message;
                newsMessage.classList.add('error');
            }
        }

        const newsSave = document.getElementById('newsSave');
        if (newsSave) {
            newsSave.addEventListener('click', async () => {
                try {
                    const result = await sendAuth('/api/news', { content: newsEditor.value.trim() });
                    if (!result.ok) return;
                    newsEditor.value = '';
                    newsMessage.textContent = 'Новость опубликована';
                    newsMessage.classList.remove('error');
                    await loadNews();
                } catch (error) {
                    newsMessage.textContent = error.message;
                    newsMessage.classList.add('error');
                }
            });
        }

        loadNews();
    }

    const accountInfo = document.getElementById('accountInfo');
    const accountMessage = document.getElementById('accountMessage');

    if (accountInfo) {
        const token = localStorage.getItem('gc_session');
        if (!token) {
            window.location.href = 'login.html';
        } else {
            fetch(apiBase + '/api/me', { headers: { Authorization: `Bearer ${token}` } })
                .then((response) => (response.ok ? response.json() : null))
                .then((data) => {
                    if (!data || !data.user) {
                        window.location.href = 'login.html';
                        return;
                    }
                    accountInfo.textContent = `Вы вошли как ${data.user.username} (${data.user.email})`;
                    if (data.user.role === 'admin' || data.user.role === 'owner') {
                        adminPanel.classList.remove('hidden');
                        loadUsers('');
                    }
                })
                .catch(() => {
                    accountInfo.textContent = 'Не удалось загрузить аккаунт';
                });
        }
    }

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(passwordForm);
            try {
                const result = await sendAuth('/api/account/password', {
                    current: data.get('current'),
                    password: data.get('password'),
                });
                if (result.ok) {
                    accountMessage.textContent = 'Пароль изменён';
                    accountMessage.classList.remove('error');
                    passwordForm.reset();
                }
            } catch (error) {
                accountMessage.textContent = error.message;
                accountMessage.classList.add('error');
            }
        });
    }

    const emailForm = document.getElementById('emailForm');
    if (emailForm) {
        emailForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(emailForm);
            try {
                const result = await sendAuth('/api/account/email', {
                    email: data.get('email').trim(),
                    password: data.get('password'),
                });
                if (result.ok) {
                    accountMessage.textContent = 'Email изменён';
                    accountMessage.classList.remove('error');
                    emailForm.reset();
                    accountInfo.textContent = `Вы вошли как ${result.email}`;
                }
            } catch (error) {
                accountMessage.textContent = error.message;
                accountMessage.classList.add('error');
            }
        });
    }

    const accountLogout = document.getElementById('accountLogout');
    if (accountLogout) {
        accountLogout.addEventListener('click', async () => {
            const token = localStorage.getItem('gc_session');
            await fetch(apiBase + '/api/logout', {
                method: 'POST',
                headers: token ? { Authorization: `Bearer ${token}` } : {},
            });
            localStorage.removeItem('gc_session');
            window.location.href = 'index.html';
        });
    }
});
