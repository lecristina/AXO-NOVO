/* data.js – DataManager via Supabase REST API (no SDK — saves ~300 KB) */
(function () {
    'use strict';

    var BASE = 'https://ecgjhahdceocsikbhsot.supabase.co';
    var KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2poYWhkY2VvY3Npa2Joc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjczNjEsImV4cCI6MjA5MDA0MzM2MX0.yGWwjOkR4Wy-BAfKMweM68sPIZBSiSoXiZSZup62x0s';
    var BASE_HDR = { 'apikey': KEY, 'Authorization': 'Bearer ' + KEY };

    /* ── Multi-layer cache ──────────────────────────────────────────────────── */
    var _mem      = {};
    var _inflight = {};
    var CACHE_TTL = 90 * 1000;

    function _cacheGet(key) {
        var k = 'axo_' + key;
        if (_mem[k] && Date.now() - _mem[k].ts < CACHE_TTL) return _mem[k].data;
        delete _mem[k];
        try {
            var raw = localStorage.getItem(k);
            if (raw) {
                var p = JSON.parse(raw);
                if (Date.now() - p.ts < CACHE_TTL) { _mem[k] = p; return p.data; }
                localStorage.removeItem(k);
            }
        } catch (e) {}
        return null;
    }

    var _SLIM_STRIP = {
        projects: ['content', 'gallery', 'cover', 'gif'],
        posts:    ['content']
    };

    function _slimItem(table, item) {
        var strip = _SLIM_STRIP[table];
        if (!strip) return item;
        var s = Object.assign({}, item);
        for (var i = 0; i < strip.length; i++) delete s[strip[i]];
        return s;
    }

    function _cacheSet(key, data) {
        var k = 'axo_' + key;
        var entry = { data: data, ts: Date.now() };
        _mem[k] = entry;
        if (!data || !data.length) return;
        var table = key.replace(/_list$/, '');
        try {
            var slim = data.map(function (item) { return _slimItem(table, item); });
            var slimEntry = JSON.stringify({ data: slim, ts: entry.ts });
            if (slimEntry.length < 1024 * 1024) localStorage.setItem(k, slimEntry);
            else localStorage.removeItem(k);
        } catch (e) {}
    }

    function _cacheInvalidate(table) {
        ['axo_' + table, 'axo_' + table + '_list'].forEach(function (k) {
            delete _mem[k];
            delete _inflight[k];
            try { localStorage.removeItem(k); } catch (e) {}
        });
    }

    /* ── Row mapping (same logic as before) ────────────────────────────────── */
    function toRow(table, obj) {
        var row = Object.assign({}, obj);
        delete row.id;
        delete row.created_at;
        if (table === 'posts' && 'ogImage' in row) { row.og_image = row.ogImage; delete row.ogImage; }
        return row;
    }

    function fromRow(table, row) {
        if (!row) return null;
        var obj = Object.assign({}, row);
        if (table === 'posts' && 'og_image' in obj) { obj.ogImage = obj.og_image; delete obj.og_image; }
        if (table === 'projects') {
            if (!Array.isArray(obj.techs))   obj.techs   = obj.techs   || [];
            if (!Array.isArray(obj.gallery)) obj.gallery = obj.gallery || [];
        }
        return obj;
    }

    /* ── REST helpers ───────────────────────────────────────────────────────── */
    function _get(path) {
        return fetch(BASE + '/rest/v1/' + path, { headers: BASE_HDR })
            .then(function (r) { return r.ok ? r.json() : []; })
            .catch(function () { return []; });
    }

    function _mutate(method, path, body, prefer) {
        var hdrs = Object.assign({ 'Content-Type': 'application/json' }, BASE_HDR);
        if (prefer) hdrs['Prefer'] = prefer;
        var opts = { method: method, headers: hdrs };
        if (body !== undefined && body !== null) opts.body = JSON.stringify(body);
        return fetch(BASE + '/rest/v1/' + path, opts)
            .then(function (r) {
                if (!r.ok) return r.json().then(function (e) { throw new Error(e.message || r.status); });
                var ct = r.headers.get('content-type') || '';
                return ct.indexOf('json') !== -1 ? r.json() : null;
            });
    }

    /* ── Public API ─────────────────────────────────────────────────────────── */
    window.DataManager = {
        keys: {
            POSTS: 'posts', PROJECTS: 'projects', TEAM: 'team',
            TESTIMONIALS: 'testimonials', SETTINGS: 'settings', COMPANIES: 'companies'
        },

        getStale: function (tableOrKey) {
            var k = 'axo_' + tableOrKey;
            if (_mem[k]) return _mem[k].data;
            try {
                var raw = localStorage.getItem(k);
                if (raw) return JSON.parse(raw).data || null;
            } catch (e) {}
            return null;
        },

        /* Fetch only specific columns (list pages — skip heavy fields) */
        getDataSelect: function (table, cols) {
            var cacheKey = table + '_list';
            var cached = _cacheGet(cacheKey);
            if (cached && cached.length) return Promise.resolve(cached);
            var ik = 'axo_' + cacheKey;
            if (_inflight[ik]) return _inflight[ik];
            var order = cols.indexOf('position') !== -1 ? 'position.asc,created_at.asc' : 'created_at.desc';
            _inflight[ik] = _get(table + '?select=' + encodeURIComponent(cols) + '&order=' + order)
                .then(function (data) {
                    delete _inflight[ik];
                    var results = (Array.isArray(data) ? data : []).map(function (row) { return fromRow(table, row); });
                    _cacheSet(cacheKey, results);
                    return results;
                });
            return _inflight[ik];
        },

        getData: function (table) {
            var cached = _cacheGet(table);
            if (cached && cached.length) return Promise.resolve(cached);
            var ik = 'axo_' + table;
            if (_inflight[ik]) return _inflight[ik];
            _inflight[ik] = _get(table + '?select=*&order=created_at.desc')
                .then(function (data) {
                    delete _inflight[ik];
                    var results = (Array.isArray(data) ? data : []).map(function (row) { return fromRow(table, row); });
                    _cacheSet(table, results);
                    return results;
                });
            return _inflight[ik];
        },

        getItem: function (table, id) {
            var cached = _cacheGet(table);
            if (cached) {
                var sid = String(id);
                for (var i = 0; i < cached.length; i++) {
                    if (String(cached[i].id) === sid) return Promise.resolve(cached[i]);
                }
            }
            return _get(table + '?id=eq.' + encodeURIComponent(id) + '&select=*&limit=1')
                .then(function (data) {
                    var row = Array.isArray(data) ? data[0] : null;
                    return fromRow(table, row);
                });
        },

        addItem: function (table, item) {
            return _mutate('POST', table, toRow(table, item), 'return=representation')
                .then(function (data) {
                    _cacheInvalidate(table);
                    var row = Array.isArray(data) ? data[0] : data;
                    return fromRow(table, row);
                }).catch(function (e) { console.error('[DataManager] addItem:', e.message); return null; });
        },

        updateItem: function (table, id, updates) {
            return _mutate('PATCH', table + '?id=eq.' + encodeURIComponent(id), toRow(table, updates), 'return=minimal')
                .then(function () { _cacheInvalidate(table); return true; })
                .catch(function (e) { console.error('[DataManager] updateItem:', e.message); return false; });
        },

        deleteItem: function (table, id) {
            return _mutate('DELETE', table + '?id=eq.' + encodeURIComponent(id), undefined, 'return=minimal')
                .then(function () { _cacheInvalidate(table); })
                .catch(function (e) { console.error('[DataManager] deleteItem:', e.message); });
        },

        getSettings: function () {
            return _get('settings?select=data&limit=1')
                .then(function (data) {
                    var row = Array.isArray(data) ? data[0] : null;
                    return (row && row.data) ? row.data : {};
                });
        },

        saveSettings: function (data) {
            return _get('settings?select=id&limit=1')
                .then(function (rows) {
                    _cacheInvalidate('settings');
                    var existing = Array.isArray(rows) ? rows[0] : null;
                    if (existing) {
                        return _mutate('PATCH', 'settings?id=eq.' + existing.id,
                            { data: data, updated_at: new Date().toISOString() }, 'return=minimal');
                    }
                    return _mutate('POST', 'settings', { data: data }, 'return=minimal');
                });
        },

        deleteAll: function (table) {
            _cacheInvalidate(table);
            return fetch(BASE + '/rest/v1/' + table + '?created_at=gt.1970-01-01T00%3A00%3A00Z', {
                method: 'DELETE',
                headers: BASE_HDR
            }).then(function () {}).catch(function (e) { console.error('[DataManager] deleteAll:', e.message); });
        },

        uploadFile: function (file, path) {
            return fetch(BASE + '/storage/v1/object/agent/' + path, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + KEY,
                    'x-upsert': 'true',
                    'Content-Type': file.type || 'application/octet-stream'
                },
                body: file
            }).then(function (r) {
                if (!r.ok) { console.error('[DataManager] uploadFile:', r.status); return null; }
                return BASE + '/storage/v1/object/public/agent/' + path;
            }).catch(function (e) { console.error('[DataManager] uploadFile:', e.message); return null; });
        },

        init: function () {}
    };
})();
