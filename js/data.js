/* data.js – DataManager backed by Supabase */
(function () {
    var SUPABASE_URL     = 'https://ecgjhahdceocsikbhsot.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2poYWhkY2VvY3Npa2Joc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjczNjEsImV4cCI6MjA5MDA0MzM2MX0.yGWwjOkR4Wy-BAfKMweM68sPIZBSiSoXiZSZup62x0s';

    var _db  = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    /* ── Multi-layer cache: memory (current page) + localStorage (5 min, cross-tab) ── */
    var _mem = {};               // in-memory for same-page re-renders
    var _inflight = {};          // in-flight promise deduplication
    var CACHE_TTL = 90 * 1000;  // 90 seconds — fast updates without hammering the DB

    function _cacheGet(table) {
        var k = 'axo_' + table;
        // 1. memory
        if (_mem[k] && Date.now() - _mem[k].ts < CACHE_TTL) return _mem[k].data;
        delete _mem[k];
        // 2. localStorage (survives tab close, shared across tabs)
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

    /* Heavy fields to strip when persisting to localStorage.  
       Image thumbnails are kept — only bulk-text / binary-heavy fields are removed. */
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

    function _cacheSet(table, data) {
        var k = 'axo_' + table;
        var entry = { data: data, ts: Date.now() };
        _mem[k] = entry;  /* full data always in memory */
        if (!data || !data.length) return;  /* don't persist empty results to localStorage */
        /* Slim version for localStorage: strip heavy fields, keep images */
        try {
            var slim = data.map(function(item) { return _slimItem(table, item); });
            var slimEntry = JSON.stringify({ data: slim, ts: entry.ts });
            if (slimEntry.length < 1024 * 1024) {  /* 1 MB cap */
                localStorage.setItem(k, slimEntry);
            } else {
                localStorage.removeItem(k);
            }
        } catch (e) {}
    }

    function _cacheInvalidate(table) {
        delete _mem['axo_' + table];
        delete _inflight['axo_' + table];
        try { localStorage.removeItem('axo_' + table); } catch (e) {}
        // Also invalidate the lightweight list variant
        delete _mem['axo_' + table + '_list'];
        delete _inflight['axo_' + table + '_list'];
        try { localStorage.removeItem('axo_' + table + '_list'); } catch (e) {}
    }

    /* Convert JS object → DB row (remove client-only fields, map camelCase) */
    function toRow(table, obj) {
        var row = Object.assign({}, obj);
        delete row.id;
        delete row.created_at;
        if (table === 'posts' && 'ogImage' in row) {
            row.og_image = row.ogImage;
            delete row.ogImage;
        }
        return row;
    }

    /* Convert DB row → JS object (map snake_case back to camelCase) */
    function fromRow(table, row) {
        if (!row) return null;
        var obj = Object.assign({}, row);
        if (table === 'posts' && 'og_image' in obj) {
            obj.ogImage = obj.og_image;
            delete obj.og_image;
        }
        if (table === 'projects') {
            if (!Array.isArray(obj.techs))   obj.techs   = obj.techs   ? obj.techs   : [];
            if (!Array.isArray(obj.gallery)) obj.gallery = obj.gallery ? obj.gallery : [];
        }
        return obj;
    }

    window.DataManager = {
        keys: {
            POSTS:        'posts',
            PROJECTS:     'projects',
            TEAM:         'team',
            TESTIMONIALS: 'testimonials',
            SETTINGS:     'settings',
            COMPANIES:    'companies'
        },

        /* Returns cached data synchronously (ignores TTL) — null if never fetched.
           Pass optional cacheKey to read a specific cache slot (e.g. 'projects_list'). */
        getStale: function (tableOrKey) {
            var k = 'axo_' + tableOrKey;
            if (_mem[k]) return _mem[k].data;
            try {
                var raw = localStorage.getItem(k);
                if (raw) { var p = JSON.parse(raw); return p.data || null; }
            } catch (e) {}
            return null;
        },

        /* Fetch only specific columns — cached under table + '_list'.
           Use for list pages to avoid loading heavy fields (content, gallery, cover, gif). */
        getDataSelect: function (table, cols) {
            var cacheKey = table + '_list';
            var cached = _cacheGet(cacheKey);
            if (cached && cached.length) return Promise.resolve(cached);
            var ik = 'axo_' + cacheKey;
            if (_inflight[ik]) return _inflight[ik];
            var hasPosition = cols.indexOf('position') !== -1;
            var query = _db.from(table).select(cols);
            if (hasPosition) {
                query = query.order('position', { ascending: true }).order('created_at', { ascending: true });
            } else {
                query = query.order('created_at', { ascending: false });
            }
            _inflight[ik] = query
                .then(function (res) {
                    delete _inflight[ik];
                    if (res.error) { console.error('[DataManager] getDataSelect:', res.error.message); return []; }
                    var results = (res.data || []).map(function (row) { return fromRow(table, row); });
                    _cacheSet(cacheKey, results);
                    return results;
                });
            return _inflight[ik];
        },

        /* Returns Promise<Array> */
        getData: function (table) {
            var cached = _cacheGet(table);
            if (cached && cached.length) return Promise.resolve(cached);
            // Return the same in-flight promise if a fetch is already pending
            var ik = 'axo_' + table;
            if (_inflight[ik]) return _inflight[ik];
            var self = this;
            _inflight[ik] = _db.from(table).select('*').order('created_at', { ascending: false })
                .then(function (res) {
                    delete _inflight[ik];
                    if (res.error) { console.error('[DataManager] getData:', res.error.message); return []; }
                    var results = (res.data || []).map(function (row) { return fromRow(table, row); });
                    _cacheSet(table, results);
                    return results;
                });
            return _inflight[ik];
        },

        /* Returns Promise<Object|null> */
        getItem: function (table, id) {
            /* Only use the full-table cache — the _list cache is intentionally stripped of
               heavy fields (gallery, cover, gif, content) and must never be used for editing. */
            var cached = _cacheGet(table);
            if (cached) {
                var sid = String(id);
                for (var i = 0; i < cached.length; i++) {
                    if (String(cached[i].id) === sid) return Promise.resolve(cached[i]);
                }
            }
            /* Cache miss — fetch single row directly (avoids downloading entire table) */
            return _db.from(table).select('*').eq('id', id).single()
                .then(function (res) {
                    if (res.error) { console.error('[DataManager] getItem:', res.error.message); return null; }
                    return fromRow(table, res.data);
                });
        },

        /* Returns Promise<Object|null> */
        addItem: function (table, item) {
            var row = toRow(table, item);
            return _db.from(table).insert(row).select().single()
                .then(function (res) {
                    if (res.error) { console.error('[DataManager] addItem:', res.error.message); return null; }
                    _cacheInvalidate(table);
                    return fromRow(table, res.data);
                });
        },

        /* Returns Promise<boolean> */
        updateItem: function (table, id, updates) {
            var row = toRow(table, updates);
            return _db.from(table).update(row).eq('id', id)
                .then(function (res) {
                    if (res.error) { console.error('[DataManager] updateItem:', res.error.message); return false; }
                    _cacheInvalidate(table);
                    return true;
                });
        },

        /* Returns Promise<void> */
        deleteItem: function (table, id) {
            return _db.from(table).delete().eq('id', id)
                .then(function (res) {
                    if (res.error) { console.error('[DataManager] deleteItem:', res.error.message); }
                    _cacheInvalidate(table);
                });
        },

        /* Returns Promise<Object> */
        getSettings: function () {
            return _db.from('settings').select('data').limit(1).maybeSingle()
                .then(function (res) {
                    if (res.error || !res.data) return {};
                    return res.data.data || {};
                });
        },

        /* Returns Promise<void> */
        saveSettings: function (data) {
            return _db.from('settings').select('id').limit(1).maybeSingle()
                .then(function (res) {
                    _cacheInvalidate('settings');
                    if (res.data) {
                        return _db.from('settings').update({ data: data, updated_at: new Date().toISOString() }).eq('id', res.data.id);
                    }
                    return _db.from('settings').insert({ data: data });
                });
        },

        /* Delete all rows in a table – used by Admin.resetData() */
        deleteAll: function (table) {
            _cacheInvalidate(table);
            return _db.from(table).delete().gt('created_at', '1970-01-01T00:00:00Z');
        },

        /* Upload a File/Blob to Supabase Storage bucket "agent".
           Returns Promise<string> — the public URL, or null on error.
           path: e.g. "projects/abc123.jpg" */
        uploadFile: function (file, path) {
            return _db.storage.from('agent').upload(path, file, { upsert: true, contentType: file.type })
                .then(function (res) {
                    if (res.error) { console.error('[DataManager] uploadFile:', res.error.message); return null; }
                    var pub = _db.storage.from('agent').getPublicUrl(path);
                    return pub.data.publicUrl;
                });
        },

        /* No-op – kept for backward-compat */
        init: function () {}
    };
})();
