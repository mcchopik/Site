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
                window.location.href = 'index.html';
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
                window.location.href = 'index.html';
            } catch (error) {
                authMessage.textContent = error.message;
                authMessage.classList.add('error');
            }
        });
    }

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
                authLink.href = '#';
                authLink.addEventListener('click', async (event) => {
                    event.preventDefault();
                    const token = localStorage.getItem('gc_session');
                    await fetch(apiBase + '/api/logout', {
                        method: 'POST',
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                    });
                    localStorage.removeItem('gc_session');
                    window.location.reload();
                });
            })
            .catch(() => {});
    }
});
