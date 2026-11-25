import { json, newsEvent, sessionUser } from '../_auth.js';

const ROLE_VALUES = ['user', 'helper', 'mod', 'admin'];

export async function onRequestPost({ request, env }) {
    if (!env.DB) {
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
    const role = String(body.role || '');
    if (!id || !ROLE_VALUES.includes(role)) {
        return json({ error: 'Некорректные данные' }, 400);
    }

    await env.DB.prepare('UPDATE users SET role = ? WHERE id = ?')
        .bind(role, id)
        .run();
    await newsEvent(env, 'Изменена роль пользователя #' + id + ': ' + role);

    return json({ ok: true });
}
