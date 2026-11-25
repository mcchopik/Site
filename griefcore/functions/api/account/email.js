import { blindIndex, encrypt, json, sessionUser, verifyPassword } from '../_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const user = await sessionUser(request, env);
    if (!user) {
        return json({ error: 'Не авторизован' }, 401);
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ error: 'Некорректный запрос' }, 400);
    }

    const password = String(body.password || '');
    const email = String(body.email || '').trim().toLowerCase();

    if (!(await verifyPassword(password, user.password_hash))) {
        return json({ error: 'Неверный пароль' }, 401);
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Некорректный email' }, 400);
    }

    const index = await blindIndex(env.AUTH_SECRET, email);
    if (index !== user.email_index) {
        const existing = await env.DB.prepare('SELECT id FROM users WHERE email_index = ?')
            .bind(index)
            .first();
        if (existing) {
            return json({ error: 'Этот email уже занят' }, 409);
        }
    }

    await env.DB.prepare('UPDATE users SET email = ?, email_index = ? WHERE id = ?')
        .bind(await encrypt(env.AUTH_SECRET, email), index, user.id)
        .run();

    return json({ ok: true, email });
}
