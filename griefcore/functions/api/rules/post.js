import { json, newsEvent, sessionUser } from '../_auth.js';

export async function onRequestPost({ request, env }) {
    if (!env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const user = await sessionUser(request, env);
    if (!user) {
        return json({ error: 'Не авторизован' }, 401);
    }
    if (user.role !== 'admin' && user.role !== 'owner') {
        return json({ error: 'Недостаточно прав' }, 403);
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return json({ error: 'Некорректный запрос' }, 400);
    }

    if (body.action === 'delete') {
        const id = Number(body.id);
        if (!id) {
            return json({ error: 'Правило не найдено' }, 400);
        }
        const removed = await env.DB.prepare('SELECT title FROM rules WHERE id = ?').bind(id).first();
        await env.DB.prepare('DELETE FROM rules WHERE id = ?').bind(id).run();
        await newsEvent(env, 'Удалено правило: ' + (removed ? removed.title : id));
        return json({ ok: true });
    }

    const title = String(body.title || '').trim();
    const text = String(body.body || '').trim();
    if (!title || !text || title.length > 200 || text.length > 5000) {
        return json({ error: 'Заполните заголовок и текст правила' }, 400);
    }

    await env.DB.prepare('INSERT INTO rules (title, body) VALUES (?, ?)')
        .bind(title, text)
        .run();
    await newsEvent(env, 'Добавлено правило: ' + title);

    return json({ ok: true });
}
