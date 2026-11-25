import { json, newsEvent, sessionUser } from '../_auth.js';

export async function onRequestGet({ request, env }) {
    if (!env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const admin = await sessionUser(request, env);
    const canEdit = Boolean(admin && (admin.role === 'admin' || admin.role === 'owner'));
    const result = await env.DB.prepare(
        'SELECT id, content, created_at FROM news ORDER BY id DESC LIMIT 50'
    ).all();

    return json({ news: result.results || [], can_edit: canEdit });
}

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

    const content = String(body.content || '').trim();
    if (!content || content.length > 500) {
        return json({ error: 'Введите текст новости (до 500 символов)' }, 400);
    }

    await newsEvent(env, content);
    return json({ ok: true });
}
