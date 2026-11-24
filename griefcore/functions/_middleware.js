export async function onRequest({ request, next }) {
    const path = new URL(request.url).pathname;

    if (request.method === 'OPTIONS' && path.startsWith('/api/')) {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': request.headers.get('Origin') || '*',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            },
        });
    }

    const response = await next();
    const origin = request.headers.get('Origin');
    if (origin && response.headers.get('Access-Control-Allow-Origin')) {
        response.headers.set('Access-Control-Allow-Origin', origin);
        response.headers.set('Vary', 'Origin');
    }
    return response;
}
