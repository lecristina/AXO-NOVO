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
        var codes = [65,100,109,65,54,55,64];
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
        if (!this.quill) {
            this.quill = new Quill('#blog-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'blockquote'],
                        [{ color: [] }, { background: [] }],
                        ['clean']
                    ]
                },
                placeholder: 'Escreva o conteudo do post...'
            });
        }
        if (!this.projQuill) {
            this.projQuill = new Quill('#proj-editor', {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ list: 'ordered' }, { list: 'bullet' }],
                        ['link', 'image', 'blockquote', 'code-block'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ['clean']
                    ]
                },
                placeholder: 'Escreva o conteudo completo da pagina do projeto...'
            });
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
    handleImageUpload: function(inputId, previewId, dataId) {
        var input = document.getElementById(inputId);
        if (!input || !input.files || !input.files[0]) return;
        var file = input.files[0];
        if (file.size > 2 * 1024 * 1024) {
            alert('Imagem deve ter no maximo 2MB');
            input.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function(e) {
            document.getElementById(dataId).value = e.target.result;
            var preview = document.getElementById(previewId);
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        };
        reader.readAsDataURL(file);
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
        }
    },

    escapeHtml: function(str) {
        if (!str) return '';
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str));
        return div.innerHTML;
    },

    /* ===== BLOG CRUD ===== */
    saveBlog: function() {
        var title = document.getElementById('blog-title').value.trim();
        if (!title) { alert('Titulo e obrigatorio'); return; }
        var editId = document.getElementById('blog-edit-id').value;
        var data = {
            title: title,
            excerpt: document.getElementById('blog-excerpt').value.trim(),
            content: this.quill ? this.quill.root.innerHTML : '',
            category: document.getElementById('blog-category').value.trim(),
            date: document.getElementById('blog-date').value,
            image: document.getElementById('blog-image-data').value,
            ogImage: document.getElementById('blog-og-image-data').value
        };
        if (editId) {
            DataManager.updateItem(DataManager.keys.POSTS, editId, data);
        } else {
            DataManager.addItem(DataManager.keys.POSTS, data);
        }
        this.cancelForm('blog');
        this.renderBlog();
    },

    editBlog: function(id) {
        var item = DataManager.getItem(DataManager.keys.POSTS, id);
        if (!item) return;
        this.showForm('blog');
        document.getElementById('blog-edit-id').value = id;
        document.getElementById('blog-title').value = item.title || '';
        document.getElementById('blog-excerpt').value = item.excerpt || '';
        document.getElementById('blog-category').value = item.category || '';
        document.getElementById('blog-date').value = item.date || '';
        document.getElementById('blog-form-title').textContent = 'Editar Post';
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

    deleteBlog: function(id) {
        if (!confirm('Tem certeza que deseja excluir este post?')) return;
        DataManager.deleteItem(DataManager.keys.POSTS, id);
        this.renderBlog();
    },

    renderBlog: function() {
        var posts = DataManager.getData(DataManager.keys.POSTS);
        var container = document.getElementById('blog-list');
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
    },

    /* ===== PROJECTS CRUD ===== */
    saveProject: function() {
        var title = document.getElementById('proj-title').value.trim();
        if (!title) { alert('Titulo e obrigatorio'); return; }
        var editId = document.getElementById('proj-edit-id').value;
        var techsRaw = document.getElementById('proj-techs').value;
        var techs = techsRaw ? techsRaw.split(',').map(function(t) { return t.trim(); }).filter(Boolean) : [];
        var data = {
            title: title,
            description: document.getElementById('proj-description').value.trim(),
            category: document.getElementById('proj-category').value.trim(),
            techs: techs,
            image: document.getElementById('proj-image-data').value,
            link: document.getElementById('proj-link').value.trim(),
            client: document.getElementById('proj-client').value.trim(),
            date: document.getElementById('proj-date').value,
            status: document.getElementById('proj-status').value,
            content: this.projQuill ? this.projQuill.root.innerHTML : '',
            gallery: this.projGallery.slice()
        };
        if (editId) {
            DataManager.updateItem(DataManager.keys.PROJECTS, editId, data);
        } else {
            DataManager.addItem(DataManager.keys.PROJECTS, data);
        }
        this.cancelForm('projects');
        this.renderProjects();
    },

    editProject: function(id) {
        var item = DataManager.getItem(DataManager.keys.PROJECTS, id);
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
        if (this.projQuill) this.projQuill.root.innerHTML = item.content || '';
        this.projGallery = Array.isArray(item.gallery) ? item.gallery.slice() : [];
        this.renderGalleryPreview();
    },

    deleteProject: function(id) {
        if (!confirm('Tem certeza que deseja excluir este projeto?')) return;
        DataManager.deleteItem(DataManager.keys.PROJECTS, id);
        this.renderProjects();
    },

    renderProjects: function() {
        var projects = DataManager.getData(DataManager.keys.PROJECTS);
        var container = document.getElementById('projects-list');
        if (!projects.length) {
            container.innerHTML = '<div class="bg-white rounded-xl p-8 text-center text-gray-500 border border-gray-200">Nenhum projeto encontrado</div>';
            return;
        }
        var self = this;
        var html = '';
        projects.forEach(function(proj) {
            var safeTitle = self.escapeHtml(proj.title);
            var safeCat = self.escapeHtml(proj.category);
            var safeClient = self.escapeHtml(proj.client);
            var techsStr = Array.isArray(proj.techs) ? proj.techs.map(function(t) { return self.escapeHtml(t); }).join(', ') : '';
            var isDraft = proj.status === 'draft';
            var statusBadge = isDraft
                ? '<span class="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 font-medium">Rascunho</span>'
                : '<span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">Publicado</span>';
            var hasContent = proj.content && proj.content !== '<p><br></p>';
            html += '<div class="item-card bg-white rounded-xl p-4 shadow-sm border border-gray-200 flex items-center gap-4' + (isDraft ? ' opacity-75' : '') + '">';
            if (proj.image) {
                html += '<img src="' + proj.image + '" class="w-16 h-16 rounded-lg object-cover shrink-0" alt="">';
            } else {
                html += '<div class="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><svg class="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"/></svg></div>';
            }
            html += '<div class="flex-1 min-w-0">';
            html += '<div class="flex items-center gap-2 mb-0.5"><h3 class="font-semibold text-gray-900 truncate">' + safeTitle + '</h3>' + statusBadge + '</div>';
            html += '<p class="text-sm text-gray-500">' + safeCat + (safeClient ? ' &bull; ' + safeClient : '') + (proj.date ? ' &bull; ' + proj.date : '') + '</p>';
            if (techsStr) html += '<p class="text-xs text-primary mt-0.5">' + techsStr + '</p>';
            if (hasContent) html += '<p class="text-xs text-gray-400 mt-0.5">&#9998; Pagina com conteudo</p>';
            html += '</div>';
            html += '<div class="flex gap-1 shrink-0">';
            html += '<button onclick="Admin.editProject(\'' + proj.id + '\')" class="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition" title="Editar"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>';
            html += '<button onclick="Admin.deleteProject(\'' + proj.id + '\')" class="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" title="Excluir"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>';
            html += '</div></div>';
        });
        container.innerHTML = html;
    },

    /* ===== TEAM CRUD ===== */
    saveTeam: function() {
        var name = document.getElementById('team-name').value.trim();
        if (!name) { alert('Nome e obrigatorio'); return; }
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
            DataManager.updateItem(DataManager.keys.TEAM, editId, data);
        } else {
            DataManager.addItem(DataManager.keys.TEAM, data);
        }
        this.cancelForm('team');
        this.renderTeam();
    },

    editTeam: function(id) {
        var item = DataManager.getItem(DataManager.keys.TEAM, id);
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

    deleteTeam: function(id) {
        if (!confirm('Tem certeza que deseja excluir este membro?')) return;
        DataManager.deleteItem(DataManager.keys.TEAM, id);
        this.renderTeam();
    },

    renderTeam: function() {
        var team = DataManager.getData(DataManager.keys.TEAM);
        var container = document.getElementById('team-list');
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
    saveTestimonial: function() {
        var name = document.getElementById('test-name').value.trim();
        if (!name) { alert('Nome e obrigatorio'); return; }
        var editId = document.getElementById('test-edit-id').value;
        var data = {
            name: name,
            role: document.getElementById('test-role').value.trim(),
            text: document.getElementById('test-text').value.trim(),
            rating: parseInt(document.getElementById('test-rating').value) || 5,
            image: document.getElementById('test-image-data').value
        };
        if (editId) {
            DataManager.updateItem(DataManager.keys.TESTIMONIALS, editId, data);
        } else {
            DataManager.addItem(DataManager.keys.TESTIMONIALS, data);
        }
        this.cancelForm('testimonials');
        this.renderTestimonials();
    },

    editTestimonial: function(id) {
        var item = DataManager.getItem(DataManager.keys.TESTIMONIALS, id);
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

    deleteTestimonial: function(id) {
        if (!confirm('Tem certeza que deseja excluir este depoimento?')) return;
        DataManager.deleteItem(DataManager.keys.TESTIMONIALS, id);
        this.renderTestimonials();
    },

    renderTestimonials: function() {
        var testimonials = DataManager.getData(DataManager.keys.TESTIMONIALS);
        var container = document.getElementById('testimonials-list');
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
    loadSettings: function() {
        var s = DataManager.getSettings();
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

    saveSettings: function() {
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
        DataManager.saveSettings(data);
        var msg = document.getElementById('settings-saved-msg');
        if (msg) {
            msg.classList.remove('hidden');
            setTimeout(function() { msg.classList.add('hidden'); }, 3000);
        }
    },

    /* ===== RENDER ALL ===== */
    renderAll: function() {
        this.renderBlog();
        this.renderProjects();
        this.renderTeam();
        this.renderTestimonials();
        this.loadSettings();
    },

    /* ===== RESET DATA ===== */
    resetData: function() {
        if (!confirm('Tem certeza? Todos os dados serao restaurados para os valores padrao.')) return;
        localStorage.removeItem(DataManager.keys.POSTS);
        localStorage.removeItem(DataManager.keys.PROJECTS);
        localStorage.removeItem(DataManager.keys.TEAM);
        localStorage.removeItem(DataManager.keys.TESTIMONIALS);
        localStorage.removeItem(DataManager.keys.SETTINGS);
        localStorage.removeItem(DataManager.keys.INIT);
        location.reload();
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
                if (file.size > 2 * 1024 * 1024) {
                    alert('Imagem deve ter no maximo 2MB');
                    galleryInput.value = '';
                    return;
                }
                var reader = new FileReader();
                reader.onload = function(e) {
                    self.addGalleryImage(e.target.result);
                    galleryInput.value = '';
                };
                reader.readAsDataURL(file);
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    Admin.init();
});
