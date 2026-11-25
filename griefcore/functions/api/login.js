import {
    SESSION_TTL,
    blindIndex,
    decrypt,
    json,
    randomToken,
    tokenHash,
    verifyPassword,
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

    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');

    if (!identifier || !password) {
        return json({ error: 'Укажите логин/email и пароль' }, 400);
    }

    const secret = env.AUTH_SECRET;
    const index = await blindIndex(secret, identifier);

    const user = await env.DB.prepare(
        'SELECT id, username, email, password_hash, role, banned FROM users WHERE username_index = ? OR email_index = ?'
    )
        .bind(index, index)
        .first();

    if (!user || !(await verifyPassword(password, user.password_hash))) {
        return json({ error: 'Неверный логин или пароль' }, 401);
    }
    if (user.banned) {
        return json({ error: 'Аккаунт заблокирован администрацией' }, 403);
    }

    const token = randomToken();
    await env.DB.prepare(
        'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'
    )
        .bind(await tokenHash(token), user.id, Math.floor(Date.now() / 1000) + SESSION_TTL)
        .run();

    return json({
        ok: true,
        token,
        user: {
            username: await decrypt(secret, user.username),
            email: await decrypt(secret, user.email),
            role: user.role || 'user',
        },
    });
}
