document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.sand-bg')) {
        return;
    }

    const layer = document.createElement('div');
    layer.className = 'sand-bg';
    layer.setAttribute('aria-hidden', 'true');

    const fragment = document.createDocumentFragment();

    for (let index = 0; index < 9; index += 1) {
        const blob = document.createElement('span');
        const size = 180 + Math.floor(Math.random() * 220);
        blob.style.width = `${size}px`;
        blob.style.height = `${size}px`;
        blob.style.left = `${Math.floor(Math.random() * 90)}%`;
        blob.style.top = `${Math.floor(Math.random() * 90)}%`;
        blob.style.setProperty('--dx', `${Math.floor(Math.random() * 160) - 80}px`);
        blob.style.setProperty('--dy', `${Math.floor(Math.random() * 160) - 80}px`);
        blob.style.setProperty('--duration', `${24 + Math.floor(Math.random() * 18)}s`);
        blob.style.setProperty('--delay', `-${Math.floor(Math.random() * 20)}s`);
        fragment.appendChild(blob);
    }

    layer.appendChild(fragment);
    document.body.prepend(layer);
});
