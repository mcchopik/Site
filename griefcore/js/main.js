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
        const response = await fetch(apiBase + url, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
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
                await sendAuth('api/login', {
                    identifier: data.get('identifier').trim(),
                    password: data.get('password'),
                });
                window.location.href = '/';
            } catch (error) {
                authMessage.textContent = error instanceof TypeError
                    ? 'Нет связи с сервером. Используйте https://griefcore-site.pages.dev/login.html'
                    : error.message;
                authMessage.classList.add('error');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const data = new FormData(registerForm);
            try {
                await sendAuth('api/register', {
                    username: data.get('username').trim(),
                    email: data.get('email').trim(),
                    password: data.get('password'),
                });
                window.location.href = '/';
            } catch (error) {
                authMessage.textContent = error instanceof TypeError
                    ? 'Нет связи с сервером. Используйте https://griefcore-site.pages.dev/login.html'
                    : error.message;
                authMessage.classList.add('error');
            }
        });
    }

    const authLink = document.querySelector('.nav-menu .auth-btn');
    if (authLink) {
        fetch(apiBase + '/api/me', { credentials: 'include' })
            .then((response) => (response.ok ? response.json() : null))
            .then((data) => {
                if (!data || !data.user) return;
                authLink.textContent = data.user.username;
                authLink.href = '#';
                authLink.addEventListener('click', async (event) => {
                    event.preventDefault();
                    await fetch(apiBase + '/api/logout', { method: 'POST', credentials: 'include' });
                    window.location.reload();
                });
            })
            .catch(() => {});
    }
});
