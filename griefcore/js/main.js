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
