import {
    SESSION_TTL,
    blindIndex,
    encrypt,
    hashPassword,
    json,
    randomToken,
    tokenHash,
} from './_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ error: 'Некорректный запрос' }, 400);
    }

    const username = String(body.username || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');

    if (!/^[A-Za-z0-9_-]{3,24}$/.test(username)) {
        return json({ error: 'Логин: от 3 до 24 символов (латиница, цифры, _ или -)' }, 400);
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: 'Некорректный email' }, 400);
    }
    if (password.length < 8 || password.length > 128) {
        return json({ error: 'Пароль должен быть не короче 8 символов' }, 400);
    }

    const secret = env.AUTH_SECRET;
    const usernameIndex = await blindIndex(secret, username);
    const emailIndex = await blindIndex(secret, email);

    const existing = await env.DB.prepare(
        'SELECT id FROM users WHERE username_index = ? OR email_index = ?'
    )
        .bind(usernameIndex, emailIndex)
        .first();

    if (existing) {
        return json({ error: 'Такой логин или email уже занят' }, 409);
    }

    const [encryptedUsername, encryptedEmail, passwordHash] = await Promise.all([
        encrypt(secret, username),
        encrypt(secret, email),
        hashPassword(password),
    ]);

    const role = email === 'griefcorelt@gmail.com' ? 'admin' : 'user';
    const inserted = await env.DB.prepare(
        'INSERT INTO users (username, username_index, email, email_index, password_hash, role) VALUES (?, ?, ?, ?, ?, ?)'
    )
        .bind(encryptedUsername, usernameIndex, encryptedEmail, emailIndex, passwordHash, role)
        .run();

    const userId = inserted.meta && inserted.meta.last_row_id;
    if (!userId) {
        return json({ error: 'Не удалось создать аккаунт' }, 500);
    }

    const token = randomToken();
    await env.DB.prepare(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    )
        .bind(await tokenHash(token), userId, Math.floor(Date.now() / 1000) + SESSION_TTL)
        .run();

    return json({ ok: true, token, user: { username, email, role } });
}
