import { hashPassword, json, sessionUser, verifyPassword } from '../_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.DB) {
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

    const current = String(body.current || '');
    const password = String(body.password || '');

    if (!(await verifyPassword(current, user.password_hash))) {
        return json({ error: 'Неверный текущий пароль' }, 401);
    }
    if (password.length < 8 || password.length > 128) {
        return json({ error: 'Новый пароль должен быть не короче 8 символов' }, 400);
    }

    await env.DB.prepare('UPDATE users SET password_hash = ? WHERE id = ?')
        .bind(await hashPassword(password), user.id)
        .run();

    return json({ ok: true });
}
