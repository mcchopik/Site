import { blindIndex, decrypt, json, sessionUser } from './_auth.js';

export async function onRequestGet({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const username = String(new URL(request.url).searchParams.get('user') || '').trim();
    if (!username || username.length > 24) {
        return json({ error: 'Укажите ник игрока' }, 400);
    }

    const index = await blindIndex(env.AUTH_SECRET, username);
    const row = await env.DB.prepare(
        'SELECT id, username, email, role, avatar, banned, created_at FROM users WHERE username_index = ?'
    )
        .bind(index)
        .first();

    if (!row) {
        return json({ error: 'Профиль не найден' }, 404);
    }

    const viewer = await sessionUser(request, env);
    const viewerRole = viewer ? viewer.role || 'user' : null;
    const privileged = viewerRole === 'admin' || viewerRole === 'owner';

    return json({
        profile: {
            username: await decrypt(env.AUTH_SECRET, row.username),
            role: row.role || 'user',
            avatar: row.avatar || '',
            banned: Boolean(row.banned),
            created_at: row.created_at,
            ...(privileged ? {
                id: row.id,
                email: await decrypt(env.AUTH_SECRET, row.email),
            } : {}),
        },
        viewer_role: viewerRole,
    });
}
