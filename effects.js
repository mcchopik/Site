(function () {
    'use strict';

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var selectors = [
        '.card',
        '[data-reveal]',
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
    var elements = Array.from(document.querySelectorAll(selectors.join(','))).filter(function (element) {
        return !element.closest('[data-lang]:not(.shown)');
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
        elements.forEach(function (element) {
            element.classList.add('reveal-visible');
        });
        return;
    }

    document.documentElement.classList.add('motion-ready');

    var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('reveal-visible');
            observer.unobserve(entry.target);
        });
    }, {
        rootMargin: '0px 0px -24px',
        threshold: 0.06
    });

    elements.forEach(function (element, index) {
        element.classList.add('reveal');
        element.style.setProperty('--reveal-delay', String((index % 3) * 35) + 'ms');
        observer.observe(element);
    });
}());
