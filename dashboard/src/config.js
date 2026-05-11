// Configuration for API endpoints
// If VITE_API_URL is set (e.g. in production), use it.
// Otherwise, default to empty string which means relative paths (proxied in dev).

const _rawApiUrl = import.meta.env.VITE_API_URL || '';

// Extract credentials from URL if present (e.g. https://user:pass@host)
let API_BASE_URL = _rawApiUrl;
let _authHeader = null;

try {
    if (_rawApiUrl && _rawApiUrl.includes('@')) {
        const parsed = new URL(_rawApiUrl);
        if (parsed.username) {
            _authHeader = 'Basic ' + btoa(`${parsed.username}:${parsed.password}`);
            parsed.username = '';
            parsed.password = '';
            API_BASE_URL = parsed.origin + parsed.pathname.replace(/\/$/, '');
        }
    }
} catch (e) {
    // ignore parse errors
}

export { API_BASE_URL };

export const getApiUrl = (path) => {
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};

// Wrapper around fetch that injects auth header for tunnel deployments
const _origFetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => {
    if (_authHeader) {
        const url = typeof input === 'string' ? input : input.url;
        if (url.startsWith(API_BASE_URL) || url.startsWith('/')) {
            init.headers = init.headers || {};
            if (init.headers instanceof Headers) {
                init.headers.set('Authorization', _authHeader);
            } else {
                init.headers['Authorization'] = _authHeader;
            }
        }
    }
    return _origFetch(input, init);
};
