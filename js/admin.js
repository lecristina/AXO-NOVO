/* admin.js - Axolutions Admin Panel */
var Admin = {
    quill: null,
    projQuill: null,
    projGallery: [],
    currentSection: 'blog',

    init: function() {
        if (sessionStorage.getItem('axo_admin_logged') === 'true') {
            this.showPanel();
        }
        this.bindEvents();
    },

    login: function() {
        var input = document.getElementById('login-password').value;
        var codes = [65,100,109,49,50,51,64];
        var pass = '';
        for (var i = 0; i < codes.length; i++) pass += String.fromCharCode(codes[i]);
        if (input === pass) {
            sessionStorage.setItem('axo_admin_logged', 'true');
            document.getElementById('login-error').classList.add('hidden');
            this.showPanel();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    },

    logout: function() {
        sessionStorage.removeItem('axo_admin_logged');
        document.getElementById('admin-panel').classList.add('hidden');
        document.getElementById('login-screen').classList.remove('hidden');
        document.getElementById('login-password').value = '';
    },

    showPanel: function() {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('admin-panel').classList.remove('hidden');
        this.initQuill();
        this.renderAll();
    },

    initQuill: function() {
        /* ── Register style-based font & size once ── */
        if (!Admin._quillReady) {
            Admin._quillReady = true;
            var FontAttr = Quill.import('attributors/style/font');
            FontAttr.whitelist = ['Inter', 'Arial', 'Georgia', 'Verdana', 'Tahoma', 'serif', 'monospace'];
            Quill.register(FontAttr, true);
            var SizeAttr = Quill.import('attributors/style/size');
            SizeAttr.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'];
            Quill.register(SizeAttr, true);
            var AlignAttr = Quill.import('attributors/style/align');
            Quill.register(AlignAttr, true);
        }

        /* ── Creates a file-picker image handler for a Quill instance ── */
        function makeImgHandler(quillInst) {
            return function() {
                var fi = document.createElement('input');
                fi.type = 'file';
                fi.accept = 'image/*';
                fi.click();
                fi.onchange = function() {
                    var file = fi.files[0];
                    if (!file) return;
                    if (file.size > 3 * 1024 * 1024) { alert('Imagem deve ter no maximo 3MB'); return; }
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var sel = quillInst.getSelection(true);
                        var idx = sel ? sel.index : quillInst.getLength();
                        quillInst.insertEmbed(idx, 'image', e.target.result);
                        quillInst.setSelection(idx + 1);
                    };
                    reader.readAsDataURL(file);
                };
            };
        }

        /* ── Custom link handler: ensures URL has protocol ── */
        function makeLinkHandler(quillInst) {
            return function() {
                var range = quillInst.getSelection();
                if (!range) return;
                var existing = quillInst.getFormat(range).link || '';
                var url = prompt('Digite a URL do link:', existing);
                if (url === null) return;
                if (url === '') { quillInst.format('link', false); return; }
                if (url && !/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
                    url = 'https://' + url;
                }
                quillInst.format('link', url);
            };
        }

        /* ── Blog editor ── */
        if (!this.quill) {
            this.quill = new Quill('#blog-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ font: ['Inter', 'Arial', 'Georgia', 'Verdana', 'Tahoma', 'serif', 'monospace'] }],
                        [{ size: ['10px', '12px', '14px', false, '18px', '20px', '24px', '28px', '32px', '36px', '48px'] }],
                        [{ header: [1, 2, 3, 4, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['link', 'blockquote', 'code-block', 'image'],
                        ['clean']
                    ]
                },
                placeholder: 'Escreva o conteudo do post...'
            });
            this.quill.getModule('toolbar').addHandler('image', makeImgHandler(this.quill));
            this.quill.getModule('toolbar').addHandler('link', makeLinkHandler(this.quill));
        }

        /* ── Project page editor ── */
        if (!this.projQuill) {
            this.projQuill = new Quill('#proj-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ font: ['Inter', 'Arial', 'Georgia', 'Verdana', 'Tahoma', 'serif', 'monospace'] }],
                        [{ size: ['10px', '12px', '14px', false, '18px', '20px', '24px', '28px', '32px', '36px', '48px'] }],
                        [{ header: [1, 2, 3, 4, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        [{ indent: '-1' }, { indent: '+1' }],
                        ['link', 'blockquote', 'code-block', 'image'],
                        ['clean']
                    ]
                },
                placeholder: 'Escreva o conteudo completo da pagina do projeto...'
            });
            this.projQuill.getModule('toolbar').addHandler('image', makeImgHandler(this.projQuill));
            this.projQuill.getModule('toolbar').addHandler('link', makeLinkHandler(this.projQuill));
        }
    },

    showSection: function(section) {
        this.currentSection = section;
        var links = document.querySelectorAll('.sidebar-link');
        for (var i = 0; i < links.length; i++) links[i].classList.remove('active');
        var active = document.querySelector('.sidebar-link[data-section="' + section + '"]');
        if (active) active.classList.add('active');
        var sections = document.querySelectorAll('.admin-section');
        for (var j = 0; j < sections.length; j++) sections[j].classList.remove('active');
        var target = document.getElementById('section-' + section);
        if (target) target.classList.add('active');
        var sidebar = document.getElementById('sidebar');
        if (sidebar) sidebar.classList.add('-translate-x-full');
    },

    /* ===== IMAGE UPLOAD ===== */

    /* Compress/resize image via canvas before storing as base64.
       Max dimension 1200px, JPEG quality 0.55 → ~30-80KB instead of 1-5MB */
    /* Compress an image File → returns a Blob (JPEG, max 1200px, 80% quality) */
    _compressToBlob: function(file, maxSize, quality) {
        maxSize = maxSize || 1200;
        quality = quality || 0.80;
        return new Promise(function(resolve) {
            var url = URL.createObjectURL(file);
            var img = new Image();
            img.onload = function() {
                URL.revokeObjectURL(url);
                var w = img.width, h = img.height;
                if (w > maxSize || h > maxSize) {
                    if (w > h) { h = Math.round(h * maxSize / w); w = maxSize; }
                    else       { w = Math.round(w * maxSize / h); h = maxSize; }
                }
                var c = document.createElement('canvas');
                c.width = w; c.height = h;
                c.getContext('2d').drawImage(img, 0, 0, w, h);
                c.toBlob(function(blob) { resolve(blob || file); }, 'image/jpeg', quality);
            };
            img.onerror = function() { URL.revokeObjectURL(url); resolve(file); };
            img.src = url;
        });
    },

    /* Generate a unique storage path: folder/timestamp-random.ext */
    _storagePath: function(file, folder) {
        var ext = file.type === 'image/gif' ? 'gif' : 'jpg';
        return folder + '/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.' + ext;
    },

    handleImageUpload: function(inputId, previewId, dataId) {
        var self = this;
        var input = document.getElementById(inputId);
        if (!input || !input.files || !input.files[0]) return;
        var file = input.files[0];
        var isGif = file.type === 'image/gif';
        var folder = inputId.startsWith('proj') ? 'projects'
            : inputId.startsWith('team') ? 'team'
            : inputId.startsWith('comp') ? 'companies'
            : inputId.startsWith('test') ? 'testimonials'
            : inputId.startsWith('blog') ? 'blog'
            : inputId.startsWith('settings') ? 'settings'
            : 'misc';
        var preview = document.getElementById(previewId);
        var dataEl  = document.getElementById(dataId);
        /* Show local preview immediately while upload happens */
        var localUrl = URL.createObjectURL(file);
        preview.src = localUrl;
        preview.classList.remove('hidden');
        dataEl.value = '';
        dataEl.dataset.uploading = '1';
        var uploadPromise = isGif
            ? Promise.resolve(file)  /* GIFs: no compression, preserve animation */
            : self._compressToBlob(file);
        uploadPromise.then(function(blob) {
            var path = self._storagePath(file, folder);
            var uploadFile = new File([blob], path.split('/').pop(), { type: isGif ? 'image/gif' : 'image/jpeg' });
            return DataManager.uploadFile(uploadFile, path);
        }).then(function(publicUrl) {
            delete dataEl.dataset.uploading;
            if (!publicUrl) { alert('Erro ao fazer upload da imagem. Tente novamente.'); return; }
            dataEl.value = publicUrl;
            preview.src = publicUrl;
        }).catch(function(err) {
            delete dataEl.dataset.uploading;
            console.error('Upload error:', err);
            alert('Erro ao fazer upload da imagem.');
        });
    },

    /* ===== FORM HELPERS ===== */
    showForm: function(section) {
        this.resetForm(section);
        document.getElementById(section + '-form').classList.remove('hidden');
        document.getElementById(section + '-form').scrollIntoView({ behavior: 'smooth' });
    },

    cancelForm: function(section) {
        document.getElementById(section + '-form').classList.add('hidden');
        this.resetForm(section);
    },

    resetForm: function(section) {
        if (section === 'blog') {
            document.getElementById('blog-title').value = '';
            document.getElementById('blog-excerpt').value = '';
            document.getElementById('blog-category').value = '';
            document.getElementById('blog-date').value = '';
            document.getElementById('blog-image').value = '';
            document.getElementById('blog-image-data').value = '';
            document.getElementById('blog-image-preview').classList.add('hidden');
            document.getElementById('blog-og-image').value = '';
            document.getElementById('blog-og-image-data').value = '';
            document.getElementById('blog-og-image-preview').classList.add('hidden');
            document.getElementById('blog-edit-id').value = '';
            document.getElementById('blog-form-title').textContent = 'Novo Post';
            var featEl2 = document.getElementById('blog-featured');
            if (featEl2) featEl2.checked = false;
            if (this.quill) this.quill.setContents([]);
        } else if (section === 'projects') {
            document.getElementById('proj-title').value = '';
            document.getElementById('proj-description').value = '';
            document.getElementById('proj-category').value = '';
            document.getElementById('proj-techs').value = '';
            document.getElementById('proj-link').value = '';
            document.getElementById('proj-client').value = '';
            document.getElementById('proj-date').value = '';
            document.getElementById('proj-status').value = 'published';
            document.getElementById('proj-image').value = '';
            document.getElementById('proj-image-data').value = '';
            document.getElementById('proj-image-preview').classList.add('hidden');
            document.getElementById('proj-cover').value = '';
            document.getElementById('proj-cover-data').value = '';
            document.getElementById('proj-cover-preview').classList.add('hidden');
            document.getElementById('proj-gif').value = '';
            document.getElementById('proj-gif-data').value = '';
            document.getElementById('proj-gif-preview').classList.add('hidden');
            document.getElementById('proj-edit-id').value = '';
            document.getElementById('projects-form-title').textContent = 'Novo Projeto';
            if (this.projQuill) this.projQuill.setContents([]);
            this.projGallery = [];
            this.renderGalleryPreview();
        } else if (section === 'team') {
            document.getElementById('team-name').value = '';
            document.getElementById('team-role').value = '';
            document.getElementById('team-bio').value = '';
            document.getElementById('team-image').value = '';
            document.getElementById('team-image-data').value = '';
            document.getElementById('team-image-preview').classList.add('hidden');
            document.getElementById('team-banner').value = '';
            document.getElementById('team-banner-data').value = '';
            document.getElementById('team-banner-preview').classList.add('hidden');
            document.getElementById('team-linkedin').value = '';
            document.getElementById('team-github').value = '';
            document.getElementById('team-instagram').value = '';
            document.getElementById('team-edit-id').value = '';
            document.getElementById('team-form-title').textContent = 'Novo Membro';
        } else if (section === 'testimonials') {
            document.getElementById('test-name').value = '';
            document.getElementById('test-role').value = '';
            document.getElementById('test-text').value = '';
            document.getElementById('test-rating').value = '5';
            document.getElementById('test-image').value = '';
            document.getElementById('test-image-data').value = '';
            document.getElementById('test-image-preview').classList.add('hidden');
            document.getElementById('test-edit-id').value = '';
            document.getElementById('testimonials-form-title').textContent = 'Novo Depoimento';
        } else if (section === 'companies') {
            document.getElementById('comp-name').value = '';
            document.getElementById('comp-logo').value = '';
            document.getElementById('comp-logo-data').value = '';
            document.getElementById('comp-logo-preview').classList.add('hidden');
            document.getElementById('comp-edit-id').value = '';
            document.getElementById('companies-form-title').textContent = 'Nova Empresa';
        }
    },

    escapeHtml: function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /* ===== BLOG CRUD ===== */
    saveBlog: async function() {
        if (this._saving) return;
        var title = document.getElementById('blog-title').value.trim();
        if (!title) { alert('Titulo e obrigatorio'); return; }
        if (document.querySelectorAll('#blog-form [data-uploading="1"]').length) { alert('Aguarde o upload das imagens terminar.'); return; }
        this._saving = true;
        var btn = document.querySelector('#blog-form button[onclick="Admin.saveBlog()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        var editId = document.getElementById('blog-edit-id').value;
        var data = {
            title: title,
            excerpt: document.getElementById('blog-excerpt').value.trim(),
            content: this.quill ? this.quill.root.innerHTML : '',
            category: document.getElementById('blog-category').value.trim(),
            date: document.getElementById('blog-date').value,
            image: document.getElementById('blog-image-data').value,
            ogImage: document.getElementById('blog-og-image-data').value,
            featured: document.getElementById('blog-featured') ? document.getElementById('blog-featured').checked : false
        };
        if (editId) {
            await DataManager.updateItem(DataManager.keys.POSTS, editId, data);
        } else {
            await DataManager.addItem(DataManager.keys.POSTS, data);
        }
        this._saving = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
        this.cancelForm('blog');
        await this.renderBlog();
        var list = document.getElementById('blog-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    editBlog: async function(id) {
        var item = await DataManager.getItem(DataManager.keys.POSTS, id);
        if (!item) return;
        this.showForm('blog');
        document.getElementById('blog-edit-id').value = id;
        document.getElementById('blog-title').value = item.title || '';
        document.getElementById('blog-excerpt').value = item.excerpt || '';
        document.getElementById('blog-category').value = item.category || '';
        document.getElementById('blog-date').value = item.date || '';
        document.getElementById('blog-form-title').textContent = 'Editar Post';
        var featEl = document.getElementById('blog-featured');
        if (featEl) featEl.checked = !!item.featured;
        if (item.image) {
            document.getElementById('blog-image-data').value = item.image;
            document.getElementById('blog-image-preview').src = item.image;
            document.getElementById('blog-image-preview').classList.remove('hidden');
        }
        if (item.ogImage) {
            document.getElementById('blog-og-image-data').value = item.ogImage;
            document.getElementById('blog-og-image-preview').src = item.ogImage;
            document.getElementById('blog-og-image-preview').classList.remove('hidden');
        }
        if (this.quill) this.quill.root.innerHTML = item.content || '';
    },

    deleteBlog: async function(id) {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        await DataManager.deleteItem(DataManager.keys.POSTS, id);
        await this.renderBlog();
    },

    renderBlog: async function() {
        var container = document.getElementById('blog-list');
        if (container) container.innerHTML = this._listSkeleton();
        var posts = await DataManager.getData(DataManager.keys.POSTS);
        if (!posts.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhum post encontrado</div>';
            return;
        }
        var self = this;
        var html = '';
        posts.forEach(function(post) {
            var safeTitle = self.escapeHtml(post.title);
            var safeCat = self.escapeHtml(post.category);
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">';
            if (post.image) {
                html += '<img src="' + post.image + '" class="w-16 h-16 rounded-lg object-cover shrink-0" alt="">';
            } else {
                html += '<div class="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<h3 class="font-semibold text-gray-900 truncate">' + safeTitle + '</h3>';
            html += '<p class="text-sm text-gray-500">' + safeCat + ' &bull; ' + (post.date || '') + '</p>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editBlog(\'' + post.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteBlog(\'' + post.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
        // Populate blog category datalist
        var cats = [];
        posts.forEach(function(p) { if (p.category && cats.indexOf(p.category) === -1) cats.push(p.category); });
        var dl = document.getElementById('blog-category-list');
        if (dl) { dl.innerHTML = cats.map(function(c) { return '<option value="' + self.escapeHtml(c) + '">'; }).join(''); }
    },

    /* ===== PROJECTS CRUD ===== */
    saveProject: async function() {
        if (this._saving) return;
        var title = document.getElementById('proj-title').value.trim();
        if (!title) { alert('Titulo e obrigatorio'); return; }
        /* Block save if any image is still uploading */
        var uploading = document.querySelectorAll('#projects-form [data-uploading="1"]');
        if (uploading.length) { alert('Aguarde o upload das imagens terminar antes de salvar.'); return; }
        this._saving = true;
        var btn = document.querySelector('#projects-form button[onclick="Admin.saveProject()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        var editId = document.getElementById('proj-edit-id').value;
        var techsRaw = document.getElementById('proj-techs').value;
        var techs = techsRaw ? techsRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
        var data = {
            title: title,
            description: document.getElementById('proj-description').value.trim(),
            category: document.getElementById('proj-category').value.trim(),
            techs: techs,
            image: document.getElementById('proj-image-data').value,
            cover: document.getElementById('proj-cover-data').value,
            gif: document.getElementById('proj-gif-data').value,
            link: document.getElementById('proj-link').value.trim(),
            client: document.getElementById('proj-client').value.trim(),
            date: document.getElementById('proj-date').value,
            status: document.getElementById('proj-status').value,
            content: this.projQuill ? this.projQuill.root.innerHTML : '',
            gallery: this.projGallery.slice()
        };
        if (editId) {
            await DataManager.updateItem(DataManager.keys.PROJECTS, editId, data);
        } else {
            await DataManager.addItem(DataManager.keys.PROJECTS, data);
        }
        this._saving = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar Projeto'; }
        this.cancelForm('projects');
        await this.renderProjects();
        var list = document.getElementById('projects-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    editProject: async function(id) {
        var item = await DataManager.getItem(DataManager.keys.PROJECTS, id);
        if (!item) return;
        this.showForm('projects');
        document.getElementById('proj-edit-id').value = id;
        document.getElementById('proj-title').value = item.title || '';
        document.getElementById('proj-description').value = item.description || '';
        document.getElementById('proj-category').value = item.category || '';
        document.getElementById('proj-techs').value = Array.isArray(item.techs) ? item.techs.join(', ') : '';
        document.getElementById('proj-link').value = item.link || '';
        document.getElementById('proj-client').value = item.client || '';
        document.getElementById('proj-date').value = item.date || '';
        document.getElementById('proj-status').value = item.status || 'published';
        document.getElementById('projects-form-title').textContent = 'Editar Projeto';
        if (item.image) {
            document.getElementById('proj-image-data').value = item.image;
            document.getElementById('proj-image-preview').src = item.image;
            document.getElementById('proj-image-preview').classList.remove('hidden');
        }
        if (item.cover) {
            document.getElementById('proj-cover-data').value = item.cover;
            document.getElementById('proj-cover-preview').src = item.cover;
            document.getElementById('proj-cover-preview').classList.remove('hidden');
        }
        if (item.gif) {
            document.getElementById('proj-gif-data').value = item.gif;
            document.getElementById('proj-gif-preview').src = item.gif;
            document.getElementById('proj-gif-preview').classList.remove('hidden');
        }
        if (this.projQuill) this.projQuill.root.innerHTML = item.content || '';
        this.projGallery = Array.isArray(item.gallery) ? item.gallery.slice() : [];
        this.renderGalleryPreview();
    },

    deleteProject: async function(id) {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        await DataManager.deleteItem(DataManager.keys.PROJECTS, id);
        await this.renderProjects();
    },

    moveProject: async function(id, dir) {
        var projects = await DataManager.getDataSelect(DataManager.keys.PROJECTS, 'id,title,category,client,date,status,techs,image,position');
        /* Assign sequential positions if none set yet */
        projects.forEach(function(p, i) { if (p.position == null || isNaN(p.position)) p.position = i; });
        projects.sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
        var idx = projects.findIndex(function(p) { return p.id === id; });
        var swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= projects.length) return;
        var posA = projects[idx].position || 0;
        var posB = projects[swapIdx].position || 0;
        /* Ensure they are different to avoid a no-op swap */
        if (posA === posB) { posA = idx; posB = swapIdx; }
        await Promise.all([
            DataManager.updateItem(DataManager.keys.PROJECTS, projects[idx].id,    { position: posB }),
            DataManager.updateItem(DataManager.keys.PROJECTS, projects[swapIdx].id, { position: posA })
        ]);
        await this.renderProjects();
    },

    renderProjects: async function() {
        var container = document.getElementById('projects-list');
        if (container) container.innerHTML = this._listSkeleton();
        var projects = await DataManager.getDataSelect(DataManager.keys.PROJECTS, 'id,title,category,client,date,status,techs,image,position');
        if (!projects.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhum projeto encontrado</div>';
            return;
        }
        /* Sort by position so the list mirrors the public order */
        projects.sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
        var self = this;
        var html = '';
        projects.forEach(function(proj, idx) {
            var safeTitle = self.escapeHtml(proj.title);
            var safeCat = self.escapeHtml(proj.category);
            var safeClient = self.escapeHtml(proj.client);
            var techsStr = Array.isArray(proj.techs) ? proj.techs.map(function(t) { return self.escapeHtml(t); }).join(', ') : '';
            var isDraft = proj.status === 'draft';
            var statusBadge = isDraft
                ? '<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Rascunho</span>'
                : '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Publicado</span>';
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4' + (isDraft ? ' opacity-75' : '') + '">';
            /* Order handle */
            html += '<div class="flex flex-col gap-0.5 shrink-0 mr-1">';
            html += '<button onclick="Admin.moveProject(\'' + proj.id + '\',-1)" class="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition disabled:opacity-25" title="Mover para cima"' + (idx === 0 ? ' disabled' : '') + '><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg></button>';
            html += '<span class="text-center text-xs font-bold text-gray-300 leading-none">' + (idx + 1) + '</span>';
            html += '<button onclick="Admin.moveProject(\'' + proj.id + '\',1)" class="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition disabled:opacity-25" title="Mover para baixo"' + (idx === projects.length - 1 ? ' disabled' : '') + '><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg></button>';
            html += '</div>';
            if (proj.image) {
                html += '<img src="' + proj.image + '" class="w-16 h-16 rounded-lg object-cover shrink-0" alt="">';
            } else {
                html += '<div class="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 mb-0.5"><h3 class="font-semibold text-gray-900 truncate">' + safeTitle + '</h3>' + statusBadge + '</div>';
            html += '<p class="text-sm text-gray-500">' + safeCat + (safeClient ? ' &bull; ' + safeClient : '') + (proj.date ? ' &bull; ' + proj.date : '') + '</p>';
            if (techsStr) html += '<p class="text-xs text-primary mt-0.5">' + techsStr + '</p>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editProject(\'' + proj.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteProject(\'' + proj.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
        // Populate project category datalist
        var pcats = [];
        projects.forEach(function(p) { if (p.category && pcats.indexOf(p.category) === -1) pcats.push(p.category); });
        var pdl = document.getElementById('proj-category-list');
        if (pdl) { pdl.innerHTML = pcats.map(function(c) { return '<option value="' + self.escapeHtml(c) + '">'; }).join(''); }
    },

    /* ===== TEAM CRUD ===== */
    saveTeam: async function() {
        if (this._saving) return;
        var name = document.getElementById('team-name').value.trim();
        if (!name) { alert('Nome e obrigatorio'); return; }
        if (document.querySelectorAll('#team-form [data-uploading="1"]').length) { alert('Aguarde o upload das imagens terminar.'); return; }
        this._saving = true;
        var btn = document.querySelector('#team-form button[onclick="Admin.saveTeam()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        var editId = document.getElementById('team-edit-id').value;
        var data = {
            name: name,
            role: document.getElementById('team-role').value.trim(),
            bio: document.getElementById('team-bio').value.trim(),
            image: document.getElementById('team-image-data').value,
            banner: document.getElementById('team-banner-data').value,
            linkedin: document.getElementById('team-linkedin').value.trim(),
            github: document.getElementById('team-github').value.trim(),
            instagram: document.getElementById('team-instagram').value.trim()
        };
        if (editId) {
            await DataManager.updateItem(DataManager.keys.TEAM, editId, data);
        } else {
            await DataManager.addItem(DataManager.keys.TEAM, data);
        }
        this._saving = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar Membro'; }
        this.cancelForm('team');
        await this.renderTeam();
        var list = document.getElementById('team-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    editTeam: async function(id) {
        var item = await DataManager.getItem(DataManager.keys.TEAM, id);
        if (!item) return;
        this.showForm('team');
        document.getElementById('team-edit-id').value = id;
        document.getElementById('team-name').value = item.name || '';
        document.getElementById('team-role').value = item.role || '';
        document.getElementById('team-bio').value = item.bio || '';
        document.getElementById('team-form-title').textContent = 'Editar Membro';
        if (item.image) {
            document.getElementById('team-image-data').value = item.image;
            document.getElementById('team-image-preview').src = item.image;
            document.getElementById('team-image-preview').classList.remove('hidden');
        }
        if (item.banner) {
            document.getElementById('team-banner-data').value = item.banner;
            document.getElementById('team-banner-preview').src = item.banner;
            document.getElementById('team-banner-preview').classList.remove('hidden');
        }
        document.getElementById('team-linkedin').value = item.linkedin || '';
        document.getElementById('team-github').value = item.github || '';
        document.getElementById('team-instagram').value = item.instagram || '';
    },

    deleteTeam: async function(id) {
        if (!confirm('Tem certeza que deseja excluir este membro?')) return;
        await DataManager.deleteItem(DataManager.keys.TEAM, id);
        await this.renderTeam();
    },

    renderTeam: async function() {
        var container = document.getElementById('team-list');
        if (container) container.innerHTML = this._listSkeleton();
        var team = await DataManager.getData(DataManager.keys.TEAM);
        if (!team.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhum membro encontrado</div>';
            return;
        }
        var self = this;
        var html = '';
        team.forEach(function(member) {
            var safeName = self.escapeHtml(member.name);
            var safeRole = self.escapeHtml(member.role);
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">';
            if (member.image) {
                html += '<img src="' + member.image + '" class="w-14 h-14 rounded-full object-cover shrink-0" alt="">';
            } else {
                html += '<div class="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<h3 class="font-semibold text-gray-900">' + safeName + '</h3>';
            html += '<p class="text-sm text-primary">' + safeRole + '</p>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editTeam(\'' + member.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteTeam(\'' + member.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    },

    /* ===== TESTIMONIALS CRUD ===== */
    saveTestimonial: async function() {
        if (this._saving) return;
        var name = document.getElementById('test-name').value.trim();
        if (!name) { alert('Nome e obrigatorio'); return; }
        if (document.querySelectorAll('#testimonials-form [data-uploading="1"]').length) { alert('Aguarde o upload das imagens terminar.'); return; }
        this._saving = true;
        var btn = document.querySelector('#testimonials-form button[onclick="Admin.saveTestimonial()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        var editId = document.getElementById('test-edit-id').value;
        var data = {
            name: name,
            role: document.getElementById('test-role').value.trim(),
            text: document.getElementById('test-text').value.trim(),
            rating: parseInt(document.getElementById('test-rating').value) || 5,
            image: document.getElementById('test-image-data').value
        };
        if (editId) {
            await DataManager.updateItem(DataManager.keys.TESTIMONIALS, editId, data);
        } else {
            await DataManager.addItem(DataManager.keys.TESTIMONIALS, data);
        }
        this._saving = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar Depoimento'; }
        this.cancelForm('testimonials');
        await this.renderTestimonials();
        var list = document.getElementById('testimonials-list');
        if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },

    editTestimonial: async function(id) {
        var item = await DataManager.getItem(DataManager.keys.TESTIMONIALS, id);
        if (!item) return;
        this.showForm('testimonials');
        document.getElementById('test-edit-id').value = id;
        document.getElementById('test-name').value = item.name || '';
        document.getElementById('test-role').value = item.role || '';
        document.getElementById('test-text').value = item.text || '';
        document.getElementById('test-rating').value = (item.rating || 5).toString();
        document.getElementById('testimonials-form-title').textContent = 'Editar Depoimento';
        if (item.image) {
            document.getElementById('test-image-data').value = item.image;
            document.getElementById('test-image-preview').src = item.image;
            document.getElementById('test-image-preview').classList.remove('hidden');
        }
    },

    deleteTestimonial: async function(id) {
        if (!confirm('Tem certeza que deseja excluir este depoimento?')) return;
        await DataManager.deleteItem(DataManager.keys.TESTIMONIALS, id);
        await this.renderTestimonials();
    },

    renderTestimonials: async function() {
        var container = document.getElementById('testimonials-list');
        if (container) container.innerHTML = this._listSkeleton();
        var testimonials = await DataManager.getData(DataManager.keys.TESTIMONIALS);
        if (!testimonials.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhum depoimento encontrado</div>';
            return;
        }
        var self = this;
        var html = '';
        testimonials.forEach(function(t) {
            var safeName = self.escapeHtml(t.name);
            var safeRole = self.escapeHtml(t.role);
            var safeText = self.escapeHtml(t.text);
            var stars = '';
            for (var s = 0; s < 5; s++) {
                stars += s < (t.rating || 0)
                    ? '<svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>'
                    : '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>';
            }
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-start gap-4">';
            if (t.image) {
                html += '<img src="' + t.image + '" class="w-12 h-12 rounded-full object-cover shrink-0 mt-1" alt="">';
            } else {
                html += '<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-1"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 mb-1"><h3 class="font-semibold text-gray-900">' + safeName + '</h3><span class="text-sm text-gray-500">' + safeRole + '</span></div>';
            html += '<div class="flex gap-0.5 mb-2">' + stars + '</div>';
            html += '<p class="text-sm text-gray-600 line-clamp-2">' + safeText + '</p>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editTestimonial(\'' + t.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteTestimonial(\'' + t.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    },

    /* ===== COMPANIES CRUD ===== */
    saveCompany: async function() {
        if (this._saving) return;
        var name = document.getElementById('comp-name').value.trim();
        if (!name) { alert('Nome e obrigatorio'); return; }
        if (document.querySelectorAll('#companies-form [data-uploading="1"]').length) { alert('Aguarde o upload das imagens terminar.'); return; }
        this._saving = true;
        var btn = document.querySelector('#companies-form button[onclick="Admin.saveCompany()"]');
        if (btn) { btn.disabled = true; btn.textContent = 'Salvando...'; }
        var editId = document.getElementById('comp-edit-id').value;
        var data = {
            name: name,
            image: document.getElementById('comp-logo-data').value
        };
        if (editId) {
            await DataManager.updateItem(DataManager.keys.COMPANIES, editId, data);
        } else {
            await DataManager.addItem(DataManager.keys.COMPANIES, data);
        }
        this._saving = false;
        if (btn) { btn.disabled = false; btn.textContent = 'Salvar'; }
        this.cancelForm('companies');
        await this.renderCompanies();
    },

    editCompany: async function(id) {
        var item = await DataManager.getItem(DataManager.keys.COMPANIES, id);
        if (!item) return;
        this.showForm('companies');
        document.getElementById('comp-edit-id').value = id;
        document.getElementById('comp-name').value = item.name || '';
        document.getElementById('companies-form-title').textContent = 'Editar Empresa';
        if (item.image) {
            document.getElementById('comp-logo-data').value = item.image;
            document.getElementById('comp-logo-preview').src = item.image;
            document.getElementById('comp-logo-preview').classList.remove('hidden');
        }
    },

    deleteCompany: async function(id) {
        if (!confirm('Tem certeza que deseja excluir esta empresa?')) return;
        await DataManager.deleteItem(DataManager.keys.COMPANIES, id);
        await this.renderCompanies();
    },

    moveCompany: async function(id, dir) {
        var companies = await DataManager.getData(DataManager.keys.COMPANIES);
        /* Assign sequential positions if none set yet */
        companies.forEach(function(c, i) { if (c.position == null || isNaN(c.position)) c.position = i; });
        companies.sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
        var idx = companies.findIndex(function(c) { return c.id === id; });
        var swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= companies.length) return;
        var posA = companies[idx].position || 0;
        var posB = companies[swapIdx].position || 0;
        if (posA === posB) { posA = idx; posB = swapIdx; }
        await Promise.all([
            DataManager.updateItem(DataManager.keys.COMPANIES, companies[idx].id,     { position: posB }),
            DataManager.updateItem(DataManager.keys.COMPANIES, companies[swapIdx].id, { position: posA })
        ]);
        await this.renderCompanies();
    },

    renderCompanies: async function() {
        var container = document.getElementById('companies-list');
        if (!container) return;
        container.innerHTML = this._listSkeleton();
        var companies = await DataManager.getData(DataManager.keys.COMPANIES);
        if (!companies.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhuma empresa encontrada</div>';
            return;
        }
        /* Sort by position so the list mirrors the public order */
        companies.sort(function(a, b) { return (a.position || 0) - (b.position || 0); });
        var self = this;
        var html = '';
        companies.forEach(function(c, idx) {
            var safeName = self.escapeHtml(c.name);
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4">';
            /* Order handle */
            html += '<div class="flex flex-col gap-0.5 shrink-0 mr-1">';
            html += '<button onclick="Admin.moveCompany(\'' + c.id + '\',-1)" class="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition disabled:opacity-25" title="Mover para cima"' + (idx === 0 ? ' disabled' : '') + '><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 15l7-7 7 7"/></svg></button>';
            html += '<span class="text-center text-xs font-bold text-gray-300 leading-none">' + (idx + 1) + '</span>';
            html += '<button onclick="Admin.moveCompany(\'' + c.id + '\',1)" class="p-1 text-gray-400 hover:text-primary hover:bg-primary/10 rounded transition disabled:opacity-25" title="Mover para baixo"' + (idx === companies.length - 1 ? ' disabled' : '') + '><svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M19 9l-7 7-7-7"/></svg></button>';
            html += '</div>';
            if (c.image) {
                html += '<img src="' + c.image + '" class="w-16 h-12 rounded-lg object-contain shrink-0 bg-gray-50 p-1 border border-gray-100" alt="">';
            } else {
                html += '<div class="w-16 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><svg class="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<h3 class="font-semibold text-gray-900">' + safeName + '</h3>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editCompany(\'' + c.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteCompany(\'' + c.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    },

    /* ===== GALLERY ===== */
    addGalleryImage: function(dataUrl) {
        if (this.projGallery.length >= 10) {
            alert('Maximo de 10 imagens na galeria');
            return;
        }
        this.projGallery.push(dataUrl);
        this.renderGalleryPreview();
    },

    removeGalleryImage: function(index) {
        this.projGallery.splice(index, 1);
        this.renderGalleryPreview();
    },

    renderGalleryPreview: function() {
        var container = document.getElementById('proj-gallery-preview');
        if (!container) return;
        var self = this;
        if (!this.projGallery.length) {
            container.innerHTML = '';
            return;
        }
        var html = '';
        this.projGallery.forEach(function(img, i) {
            html += '<div class="gallery-thumb">';
            html += '<img src="' + img + '" alt="Galeria ' + (i + 1) + '">';
            html += '<button type="button" class="remove-btn" onclick="Admin.removeGalleryImage(' + i + ')">&times;</button>';
            html += '</div>';
        });
        container.innerHTML = html;
    },

    /* ===== SETTINGS ===== */
    loadSettings: async function() {
        var s = await DataManager.getSettings();
        if (!s) return;
        var fields = ['email','phone','address','tagline','instagram','linkedin','github','youtube'];
        fields.forEach(function(f) {
            var el = document.getElementById('settings-' + f);
            if (el && s[f]) el.value = s[f];
        });
        var imgFields = ['logo','favicon','hero-image','about-image','og-image','blog-banner'];
        imgFields.forEach(function(f) {
            var dataEl = document.getElementById('settings-' + f + '-data');
            if (dataEl && s[f.replace('-','_')]) {
                dataEl.value = s[f.replace('-','_')];
                var preview = document.getElementById('settings-' + f + '-preview');
                if (preview) {
                    preview.src = s[f.replace('-','_')];
                    preview.classList.remove('hidden');
                }
                var wrap = document.getElementById('settings-' + f + '-preview-wrap');
                if (wrap) wrap.classList.remove('hidden');
            }
        });
    },

    saveSettings: async function() {
        var fields = ['email','phone','address','tagline','instagram','linkedin','github','youtube'];
        var data = {};
        fields.forEach(function(f) {
            var el = document.getElementById('settings-' + f);
            if (el) data[f] = el.value.trim();
        });
        var imgFields = ['logo','favicon','hero_image','about_image','og_image','blog_banner'];
        imgFields.forEach(function(f) {
            var key = f.replace('_','-');
            var dataEl = document.getElementById('settings-' + key + '-data');
            if (dataEl) data[f] = dataEl.value;
        });
        await DataManager.saveSettings(data);
        var msg = document.getElementById('settings-saved-msg');
        if (msg) {
            msg.classList.remove('hidden');
            setTimeout(function() { msg.classList.add('hidden'); }, 3000);
        }
    },

    /* ===== RENDER ALL ===== */
    _listSkeleton: function() {
        var row = '<div class="animate-pulse bg-white rounded-xl p-4 border border-gray-200 flex items-center gap-4">' +
            '<div class="w-16 h-16 bg-gray-200 rounded-lg shrink-0"></div>' +
            '<div class="flex-1"><div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>' +
            '<div class="h-3 bg-gray-200 rounded w-1/2"></div></div>' +
            '<div class="w-8 h-8 bg-gray-200 rounded-lg"></div>' +
            '</div>';
        return row + row + row;
    },

    renderAll: async function() {
        await Promise.all([
            this.renderBlog(),
            this.renderProjects(),
            this.renderTeam(),
            this.renderTestimonials(),
            this.renderCompanies(),
            this.loadSettings()
        ]);
    },

    /* ===== RESET DATA ===== */
    resetData: async function() {
        if (!confirm('Tem certeza? Todos os dados serao deletados do Supabase.')) return;
        await Promise.all([
            DataManager.deleteAll(DataManager.keys.POSTS),
            DataManager.deleteAll(DataManager.keys.PROJECTS),
            DataManager.deleteAll(DataManager.keys.TEAM),
            DataManager.deleteAll(DataManager.keys.TESTIMONIALS),
            DataManager.deleteAll(DataManager.keys.COMPANIES),
            DataManager.deleteAll(DataManager.keys.SETTINGS)
        ]);
        await this.renderAll();
    },

    /* ===== EVENTS ===== */
    bindEvents: function() {
        var self = this;

        document.addEventListener('click', function(e) {
            var link = e.target.closest('.sidebar-link');
            if (link && link.dataset.section) {
                e.preventDefault();
                self.showSection(link.dataset.section);
            }
        });

        var imageConfigs = [
            { input: 'blog-image', preview: 'blog-image-preview', data: 'blog-image-data' },
            { input: 'blog-og-image', preview: 'blog-og-image-preview', data: 'blog-og-image-data' },
            { input: 'proj-image', preview: 'proj-image-preview', data: 'proj-image-data' },
            { input: 'proj-cover', preview: 'proj-cover-preview', data: 'proj-cover-data' },
            { input: 'proj-gif', preview: 'proj-gif-preview', data: 'proj-gif-data' },
            { input: 'comp-logo', preview: 'comp-logo-preview', data: 'comp-logo-data' },
            { input: 'team-image', preview: 'team-image-preview', data: 'team-image-data' },
            { input: 'team-banner', preview: 'team-banner-preview', data: 'team-banner-data' },
            { input: 'test-image', preview: 'test-image-preview', data: 'test-image-data' },
            { input: 'settings-logo', preview: 'settings-logo-preview', data: 'settings-logo-data', wrap: 'settings-logo-preview-wrap' },
            { input: 'settings-favicon', preview: 'settings-favicon-preview', data: 'settings-favicon-data' },
            { input: 'settings-hero-image', preview: 'settings-hero-image-preview', data: 'settings-hero-image-data' },
            { input: 'settings-about-image', preview: 'settings-about-image-preview', data: 'settings-about-image-data' },
            { input: 'settings-og-image', preview: 'settings-og-image-preview', data: 'settings-og-image-data' },
            { input: 'settings-blog-banner', preview: 'settings-blog-banner-preview', data: 'settings-blog-banner-data' }
        ];
        imageConfigs.forEach(function(cfg) {
            var el = document.getElementById(cfg.input);
            if (el) {
                el.addEventListener('change', function() {
                    self.handleImageUpload(cfg.input, cfg.preview, cfg.data);
                    if (cfg.wrap) {
                        var wrap = document.getElementById(cfg.wrap);
                        var dataEl = document.getElementById(cfg.data);
                        if (wrap && dataEl && dataEl.value) wrap.classList.remove('hidden');
                    }
                });
            }
        });

        // Gallery image input
        var galleryInput = document.getElementById('proj-gallery-input');
        if (galleryInput) {
            galleryInput.addEventListener('change', function() {
                if (!galleryInput.files || !galleryInput.files[0]) return;
                var file = galleryInput.files[0];
                var path = self._storagePath(file, 'projects/gallery');
                var isGif = file.type === 'image/gif';
                /* Show spinner thumb while uploading */
                var tempId = 'gal-' + Date.now();
                var container = document.getElementById('proj-gallery-preview');
                if (container) {
                    var div = document.createElement('div');
                    div.className = 'gallery-thumb';
                    div.id = tempId;
                    div.innerHTML = '<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f3f4f6"><svg class="animate-spin w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg></div>';
                    container.appendChild(div);
                }
                var uploadPromise = isGif ? Promise.resolve(file) : self._compressToBlob(file);
                uploadPromise.then(function(blob) {
                    var uploadFile = new File([blob], path.split('/').pop(), { type: isGif ? 'image/gif' : 'image/jpeg' });
                    return DataManager.uploadFile(uploadFile, path);
                }).then(function(publicUrl) {
                    var tmp = document.getElementById(tempId);
                    if (tmp) tmp.remove();
                    if (!publicUrl) { alert('Erro ao fazer upload da imagem de galeria.'); return; }
                    self.addGalleryImage(publicUrl);
                }).catch(function() {
                    var tmp = document.getElementById(tempId);
                    if (tmp) tmp.remove();
                    alert('Erro ao fazer upload da imagem de galeria.');
                });
                galleryInput.value = '';
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    Admin.init();
});
