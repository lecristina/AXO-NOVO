/* data.js – DataManager backed by Supabase */
(function () {
    var SUPABASE_URL     = 'https://ecgjhahdceocsikbhsot.supabase.co';
    var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjZ2poYWhkY2VvY3Npa2Joc290Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NjczNjEsImV4cCI6MjA5MDA0MzM2MX0.yGWwjOkR4Wy-BAfKMweM68sPIZBSiSoXiZSZup62x0s';

    var _db  = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    /* ── Multi-layer cache: memory + sessionStorage(posts/projects) + localStorage(others) ──
       posts/projects use sessionStorage because base64 images can exceed 5MB localStorage quota.
       sessionStorage survives same-tab page navigation (blog → post) and has the same quota
       but doesn't share data across tabs, avoiding silent save failures for large payloads. */
    var _mem = {};               // in-memory for same-page re-renders
    var _inflight = {};          // in-flight promise deduplication
    var CACHE_TTL = 5 * 60 * 1000;  // 5 minutes

    /* Tables with potentially large images → use sessionStorage */
    var _SESSION_TABLES = { posts: 1, projects: 1 };
    function _storeFor(table) { return _SESSION_TABLES[table] ? sessionStorage : localStorage; }

    function _cacheGet(table) {
        var k = 'axo_' + table;
        // 1. memory
        if (_mem[k] && Date.now() - _mem[k].ts < CACHE_TTL) return _mem[k].data;
        delete _mem[k];
        // 2. sessionStorage or localStorage
        try {
            var raw = _storeFor(table).getItem(k);
            if (raw) {
                var p = JSON.parse(raw);
                if (Date.now() - p.ts < CACHE_TTL) { _mem[k] = p; return p.data; }
                _storeFor(table).removeItem(k);
            }
        } catch (e) {}
        return null;
    }

    function _cacheSet(table, data) {
        var k = 'axo_' + table;
        var entry = { data: data, ts: Date.now() };
        _mem[k] = entry;
        try { _storeFor(table).setItem(k, JSON.stringify(entry)); } catch (e) {}
    }

    function _cacheInvalidate(table) {
        delete _mem['axo_' + table];
        delete _inflight['axo_' + table];
        try { localStorage.removeItem('axo_' + table); } catch (e) {}
        try { sessionStorage.removeItem('axo_' + table); } catch (e) {}
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
        if (table === 'posts') {
            if (typeof obj.featured === 'undefined' || obj.featured === null) obj.featured = false;
        }
        if (table === 'projects') {
            if (!Array.isArray(obj.techs))   obj.techs   = obj.techs   ? obj.techs   : [];
            if (!Array.isArray(obj.gallery)) obj.gallery = obj.gallery ? obj.gallery : [];
            if (!obj.cover) obj.cover = '';
            if (!obj.gif)   obj.gif   = '';
        }
        return obj;
    }

    window.DataManager = {
        keys: {
            POSTS:        'posts',
            PROJECTS:     'projects',
            TEAM:         'team',
            TESTIMONIALS: 'testimonials',
            SETTINGS:     'settings'
        },

        /* Returns cached Array synchronously, or null if cache cold */
        getDataSync: function(table) { return _cacheGet(table); },

        /* Returns Promise<Array> */
        getData: function (table) {
            var cached = _cacheGet(table);
            if (cached) return Promise.resolve(cached);
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
            /* Check collection cache first */
            var cached = _cacheGet(table);
            if (cached) {
                var sid = String(id);
                for (var i = 0; i < cached.length; i++) {
                    if (String(cached[i].id) === sid) return Promise.resolve(cached[i]);
                }
            }
            /* Cache miss — fetch the full table (populates cache for siblings) */
            var self = this;
            return self.getData(table).then(function (all) {
                var sid = String(id);
                for (var i = 0; i < all.length; i++) {
                    if (String(all[i].id) === sid) return all[i];
                }
                return null;
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

        /* No-op – kept for backward-compat */
        init: function () {}
    };
})();
