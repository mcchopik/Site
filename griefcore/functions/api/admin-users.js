import { decrypt, json, sessionUser } from './_auth.js';

const ALLOWED_ROLES = ['user', 'helper', 'mod', 'admin', 'owner'];

export async function onRequestGet({ request, env }) {
    if (!env.AUTH_SECRET || !env.DB) {
        return json({ error: 'Сервер не настроен' }, 500);
    }

    const admin = await sessionUser(request, env);
    if (!admin || (admin.role !== 'admin' && admin.role !== 'owner')) {
        return json({ error: 'Недостаточно прав' }, 403);
    }

    const query = String(new URL(request.url).searchParams.get('q') || '').trim().toLowerCase();
    const result = await env.DB.prepare(
        'SELECT id, username, email, role FROM users ORDER BY id LIMIT 200'
    ).all();

    const users = [];
    for (const row of result.results || []) {
        const username = await decrypt(env.AUTH_SECRET, row.username);
        const email = await decrypt(env.AUTH_SECRET, row.email);
        if (query && !username.toLowerCase().includes(query) && !email.toLowerCase().includes(query)) {
            continue;
        }
        users.push({
            id: row.id,
            username,
            email,
            role: ALLOWED_ROLES.includes(row.role) ? row.role : 'user',
        });
    }

    return json({ users });
}
