(function () {
    'use strict';

    var translations = {
        en: {
            role: 'Minecraft player · mod creator',
            ageLabel: 'Age',
            ageValue: '14 years old',
            birthday: 'Birthday',
            game: 'Favorite Game',
            gameTitle: 'Minecraft',
            languagesLabel: 'Languages',
            languagesValue: 'UA (native), RU/BY',
            server: 'Discord',
            launcher: 'Launcher',
            minecraftPage: 'Go to Mine card Page →',
            modsPage: 'Mods →',
            channels: 'Channels & Links',
            mainChannel: 'Main Channel',
            lifeChannel: 'Real Life Channel (Face)',
            fame: 'Hall of Fame'
        },
        ua: {
            role: 'Гравець Minecraft · автор модів',
            ageLabel: 'Вік',
            ageValue: '14 років',
            birthday: 'День народження',
            game: 'Улюблена гра',
            gameTitle: 'Minecraft',
            languagesLabel: 'Мови',
            languagesValue: 'UA (рідна), RU/BY',
            server: 'Discord',
            launcher: 'Лаунчер',
            minecraftPage: 'Перейти на сторінку Майн карточки →',
            modsPage: 'Моди →',
            channels: 'Канали та посилання',
            mainChannel: 'Основний канал',
            lifeChannel: 'Лайф канал (з обличчям)',
            fame: 'Дошка слави'
        },
        ru: {
            role: 'Игрок Minecraft · автор модов',
            ageLabel: 'Возраст',
            ageValue: '14 лет',
            birthday: 'День рождения',
            game: 'Любимая игра',
            gameTitle: 'Minecraft',
            languagesLabel: 'Языки',
            languagesValue: 'UA (родной), RU/BY',
            server: 'Discord',
            launcher: 'Лаунчер',
            minecraftPage: 'Перейти на страницу Майн карти →',
            modsPage: 'Моды →',
            channels: 'Каналы и ссылки',
            mainChannel: 'Основной канал',
            lifeChannel: 'Лайф канал (с лицом)',
            fame: 'Доска славы'
        }
    };

    var textBindings = {
        'profile-role': 'role',
        'lbl-age': 'ageLabel',
        'val-age': 'ageValue',
        'lbl-bday': 'birthday',
        'lbl-game': 'game',
        'val-game-title': 'gameTitle',
        'lbl-langs': 'languagesLabel',
        'val-langs': 'languagesValue',
        'lbl-mc-server': 'server',
        'lbl-mc-launcher': 'launcher',
        'lbl-mc-page': 'minecraftPage',
        'lbl-mods-page': 'modsPage',
        'lbl-channels': 'channels',
        'btn-main-channel': 'mainChannel',
        'btn-life-channel': 'lifeChannel',
        'lbl-fame': 'fame'
    };

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var languageButtons = document.querySelectorAll('[data-language]');
    var gameToggle = document.getElementById('game-toggle');
    var gamePanel = document.getElementById('mc-panel');
    var activeAnimation;

    function storageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (error) {
            return null;
        }
    }

    function storageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (error) {}
    }

    function animateGamePanel(open) {
        if (activeAnimation) activeAnimation.cancel();
        if (open) gamePanel.hidden = false;

        if (reducedMotion || typeof gamePanel.animate !== 'function') {
            gamePanel.hidden = !open;
            return;
        }

        var closed = {
            height: '0px',
            opacity: 0,
            transform: 'translateY(-6px)'
        };
        var opened = {
            height: gamePanel.scrollHeight + 'px',
            opacity: 1,
            transform: 'translateY(0)'
        };
        var animation = gamePanel.animate(open ? [closed, opened] : [opened, closed], {
            duration: open ? 220 : 180,
            easing: open ? 'cubic-bezier(0.22, 1, 0.36, 1)' : 'ease-in'
        });

        activeAnimation = animation;
        animation.finished.then(function () {
            if (activeAnimation !== animation) return;
            if (!open) gamePanel.hidden = true;
            activeAnimation = null;
        }).catch(function () {});
    }

    function setLanguage(language) {
        var selected = translations[language] || translations.en;

        Object.keys(textBindings).forEach(function (id) {
            var element = document.getElementById(id);
            if (element) element.textContent = selected[textBindings[id]];
        });

        languageButtons.forEach(function (button) {
            var active = button.dataset.language === language;
            button.classList.toggle('active', active);
            button.setAttribute('aria-pressed', String(active));
        });

        document.documentElement.lang = language === 'ua' ? 'uk' : language;
        storageSet('profile_language', language);
    }

    function toggleGamePanel() {
        var open = gameToggle.getAttribute('aria-expanded') !== 'true';
        gameToggle.setAttribute('aria-expanded', String(open));
        gameToggle.classList.toggle('expanded', open);
        animateGamePanel(open);
    }

    languageButtons.forEach(function (button) {
        button.addEventListener('click', function () {
            setLanguage(button.dataset.language);
        });
    });

    gameToggle.addEventListener('click', toggleGamePanel);
    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && gameToggle.getAttribute('aria-expanded') === 'true') {
            toggleGamePanel();
        }
    });

    setLanguage(storageGet('profile_language') || 'en');
}());
