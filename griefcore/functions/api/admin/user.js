import { blindIndex, encrypt, json, newsEvent, sessionUser } from '../_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const admin = await sessionUser(request, env);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) {
        return json({ error: 'Недостаточно прав' }, 403);
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ error: 'Некорректный запрос' }, 400);
    }

    const id = Number(body.id);
    if (!id) {
        return json({ error: 'Пользователь не найден' }, 400);
    }

    if (body.action === 'delete') {
        if (id === admin.id) {
            return json({ error: 'Нельзя удалить свой аккаунт' }, 400);
        }
        const sessions = await env.DB.prepare('SELECT token_hash FROM sessions WHERE user_id = ?')
            .bind(id)
            .all();
        for (const session of sessions.results || []) {
            await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
                .bind(session.token_hash)
                .run();
        }
        await env.DB.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
        await newsEvent(env, 'Удалён аккаунт пользователя #' + id);
        return json({ ok: true });
    }

    if (body.action === 'username') {
        const username = String(body.username || '').trim();
        if (!/^[A-Za-z0-9_-]{3,24}$/.test(username)) {
            return json({ error: 'Логин: от 3 до 24 символов (латиница, цифры, _ или -)' }, 400);
        }
        const index = await blindIndex(env.AUTH_SECRET, username);
        const existing = await env.DB.prepare('SELECT id FROM users WHERE username_index = ?')
            .bind(index)
            .first();
        if (existing && existing.id !== id) {
            return json({ error: 'Такой логин уже занят' }, 409);
        }
        await env.DB.prepare('UPDATE users SET username = ?, username_index = ? WHERE id = ?')
            .bind(await encrypt(env.AUTH_SECRET, username), index, id)
            .run();
        await newsEvent(env, 'Изменён логин пользователя #' + id + ': ' + username);
        return json({ ok: true, username });
    }

    if (body.action === 'ban') {
        const banned = body.banned === true ? 1 : 0;
        await env.DB.prepare('UPDATE users SET banned = ? WHERE id = ?')
            .bind(banned, id)
            .run();
        await newsEvent(env, (banned ? 'Заблокирован' : 'Разблокирован') + ' пользователь #' + id);
        return json({ ok: true, banned: Boolean(banned) });
    }

    if (body.action === 'avatar') {
        const avatar = String(body.avatar || '').trim();
        if (avatar && !/^https:\/\/[^\s]+\.(png|jpg|jpeg|webp|gif)$/i.test(avatar)) {
            return json({ error: 'Нужна ссылка https:// на PNG, JPG, WEBP или GIF' }, 400);
        }
        await env.DB.prepare('UPDATE users SET avatar = ? WHERE id = ?')
            .bind(avatar || null, id)
            .run();
        await newsEvent(env, 'Обновлён аватар пользователя #' + id);
        return json({ ok: true, avatar });
    }

    return json({ error: 'Неизвестное действие' }, 400);
}
