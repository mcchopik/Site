const ALLOWED_ORIGINS = [
    'https://mcchopik.pp.ua',
    'https://www.mcchopik.pp.ua',
    'https://griefcore.lt',
    'https://www.griefcore.lt',
    'https://griefcore-site.pages.dev',
    'http://localhost:8788',
];

function isAllowedOrigin(origin) {
    if (!origin) return false;
    if (ALLOWED_ORIGINS.includes(origin)) return true;
    return /^https?:\/\/[a-z0-9-]+\.griefcore-site\.pages\.dev$/i.test(origin);
}

export async function onRequest({ request, next }) {
    const path = new URL(request.url).pathname;
    const origin = request.headers.get('Origin');

    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': isAllowedOrigin(origin) ? origin : 'https://mcchopik.pp.ua',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
        });
    }

    const response = await next();
    if (isAllowedOrigin(origin)) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Access-Control-Allow-Credentials', 'true');
        response.headers.set('Vary', 'Origin');
    }
    return response;
}
