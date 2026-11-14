(function () {
    'use strict';

    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('reduced-motion', reduceMotion);

    var aosTargets = [
        '.mc-hero',
        '.mod',
        '.discord-btn',
        '.section-title',
        'ul.points',
        '.row',
        '.total-card',
        '.nodes',
        'footer'
    ];

    document.querySelectorAll(aosTargets.join(',')).forEach(function (element, index) {
        var hiddenLanguageBlock = element.closest('[data-lang]:not(.shown)');
        if (hiddenLanguageBlock || element.hasAttribute('data-aos')) return;
        element.setAttribute('data-aos', 'fade-up');
        element.setAttribute('data-aos-delay', String(Math.min((index % 3) * 55, 110)));
    });

    if (window.AOS) {
        document.documentElement.classList.add('aos-ready');
        window.AOS.init({
            duration: 680,
            easing: 'ease-out-cubic',
            offset: 28,
            once: true,
            mirror: false,
            disable: reduceMotion
        });
    }

    if (reduceMotion) {
        if (window.customElements) {
            window.customElements.whenDefined('lottie-player').then(function () {
                document.querySelectorAll('lottie-player').forEach(function (player) {
                    if (typeof player.stop === 'function') player.stop();
                });
            }).catch(function () {});
        }
        return;
    }

    if (window.customElements) {
        window.customElements.whenDefined('lottie-player').then(function () {
            document.querySelectorAll('lottie-player').forEach(function (player) {
                if (typeof player.play === 'function') player.play();
            });
        }).catch(function () {});
    }

    if (!window.gsap) return;

    var gsap = window.gsap;
    var card = document.querySelector('.card');

    if (card) {
        var intro = gsap.timeline({ defaults: { ease: 'power3.out' } });
        intro.fromTo(card, {
            autoAlpha: 0,
            y: 26,
            scale: 0.985
        }, {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.82,
            clearProps: 'transform,opacity,visibility'
        });

        var introItems = card.querySelectorAll('[data-gsap-intro]');
        if (introItems.length) {
            intro.fromTo(introItems, {
                autoAlpha: 0,
                y: 12
            }, {
                autoAlpha: 1,
                y: 0,
                duration: 0.48,
                stagger: 0.075,
                clearProps: 'transform,opacity,visibility'
            }, '-=0.48');
        } else {
            var pageTitle = card.querySelector('.page-title');
            if (pageTitle) {
                intro.fromTo(pageTitle, {
                    autoAlpha: 0,
                    x: -16
                }, {
                    autoAlpha: 1,
                    x: 0,
                    duration: 0.5,
                    clearProps: 'transform,opacity,visibility'
                }, '-=0.5');
            }
        }
    }

    var tiltCard = document.querySelector('.card[data-tilt]');
    var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (tiltCard && finePointer) {
        gsap.set(tiltCard, { transformPerspective: 1200, transformOrigin: 'center center' });
        var rotateX = gsap.quickTo(tiltCard, 'rotationX', { duration: 0.45, ease: 'power3.out' });
        var rotateY = gsap.quickTo(tiltCard, 'rotationY', { duration: 0.45, ease: 'power3.out' });

        tiltCard.addEventListener('pointermove', function (event) {
            var bounds = tiltCard.getBoundingClientRect();
            var x = (event.clientX - bounds.left) / bounds.width;
            var y = (event.clientY - bounds.top) / bounds.height;
            tiltCard.style.setProperty('--pointer-x', (x * 100).toFixed(1) + '%');
            tiltCard.style.setProperty('--pointer-y', (y * 100).toFixed(1) + '%');
            rotateX((0.5 - y) * 2.2);
            rotateY((x - 0.5) * 2.2);
            tiltCard.classList.add('is-interactive');
        });

        tiltCard.addEventListener('pointerleave', function () {
            rotateX(0);
            rotateY(0);
            tiltCard.classList.remove('is-interactive');
        });
    }

    var floatingButton = document.querySelector('.floating-btn');
    if (floatingButton) {
        gsap.to(floatingButton, {
            boxShadow: '0 10px 34px rgba(155, 92, 255, 0.62)',
            duration: 1.7,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut'
        });
    }
}());
