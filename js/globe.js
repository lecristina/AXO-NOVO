/* globe.js – Earth globe: real Blue-Marble texture + dot overlay on continents */
(function () {

    function init() {
        var container = document.getElementById('globe-container');
        if (!container) return;
        // If container has no dimensions yet (rare), wait one frame
        if (container.clientWidth === 0) {
            requestAnimationFrame(init);
            return;
        }
        boot(container);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ─────────────────────────────────────────────────────────────────────────
    function boot(container) {
        var R = 1;
        var W = container.clientWidth, H = container.clientHeight;

        var scene    = new THREE.Scene();
        var camera   = new THREE.PerspectiveCamera(45, W / H, 0.1, 1000);
        camera.position.z = 2.8;

        var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(W, H);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.insertBefore(renderer.domElement, container.firstChild);

        var globeGroup = new THREE.Group();
        scene.add(globeGroup);

        // ── Lighting ──────────────────────────────────────────────────────────
        scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        var sunLight = new THREE.DirectionalLight(0xffffff, 1.0);
        sunLight.position.set(5, 3, 5);
        scene.add(sunLight);

        // ── Helper: lat/lon → Vector3 ─────────────────────────────────────────
        function ll(lat, lon, r) {
            var phi   = (90 - lat) * Math.PI / 180;
            var theta = -lon       * Math.PI / 180;
            return new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
        }

        // ── Purple atmosphere rim ─────────────────────────────────────────────
        globeGroup.add(new THREE.Mesh(
            new THREE.SphereGeometry(R * 1.08, 64, 64),
            new THREE.ShaderMaterial({
                vertexShader: [
                    'varying vec3 vN;',
                    'void main(){vN=normalize(normalMatrix*normal);',
                    'gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}'
                ].join(''),
                fragmentShader: [
                    'varying vec3 vN;',
                    'void main(){',
                    'float i=pow(0.65-dot(vN,vec3(0,0,1)),3.0);',
                    'gl_FragColor=vec4(0.45,0.0,0.75,1.0)*i;}'
                ].join(''),
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide,
                transparent: true
            })
        ));

        // ── Country pins (lat, lon) ──────────────────────────────────────────
        // Brazil: bright purple | Rest (Americas + Europe): teal
        var PINS_BR = [
            // São Paulo city & metro — dense cluster (35)
            [-23.55, -46.63], [-23.50, -46.85], [-23.63, -46.52], [-23.48, -46.40],
            [-23.70, -46.72], [-23.37, -46.75], [-23.60, -46.48], [-23.44, -46.55],
            [-23.68, -46.88], [-23.54, -46.96], [-23.42, -46.68], [-23.58, -46.30],
            [-23.72, -46.60], [-23.46, -46.82], [-23.65, -46.40], [-23.52, -47.05],
            [-23.35, -46.90], [-23.78, -46.55], [-23.80, -46.42],
            [-23.56, -46.75], [-23.48, -46.62], [-23.61, -46.65], [-23.53, -46.45],
            [-23.67, -46.80], [-23.43, -46.50], [-23.57, -47.00], [-23.74, -46.68],
            [-23.40, -46.88], [-23.62, -46.38], [-23.71, -46.50], [-23.46, -47.10],
            [-23.33, -46.80], [-23.76, -46.78], [-23.82, -46.58], [-23.53, -47.15],
            // SP interior & coast (5)
            [-22.91, -47.06], [-23.96, -46.33], [-23.18, -45.88],
            [-21.17, -47.81], [-23.50, -47.45],
            // Rio de Janeiro city & metro — dense cluster (28)
            [-22.91, -43.17], [-22.82, -43.10], [-23.00, -43.35], [-22.96, -43.40],
            [-22.75, -43.05], [-22.88, -43.28], [-22.94, -43.52], [-22.80, -43.22],
            [-22.72, -43.32], [-23.02, -43.18], [-22.86, -42.98], [-22.78, -43.15],
            [-23.08, -43.42], [-22.98, -43.60], [-22.70, -43.48],
            [-22.85, -43.38], [-22.92, -43.08], [-22.76, -43.20], [-23.04, -43.25],
            [-22.89, -43.58], [-22.74, -43.45], [-22.96, -42.88], [-22.82, -43.55],
            [-23.06, -43.50], [-22.78, -43.00], [-22.93, -43.70], [-22.67, -43.35],
            [-23.10, -43.30],
            // RJ state (3)
            [-22.51, -43.18], [-21.75, -41.33], [-21.46, -41.00],
            // Belo Horizonte metro (8)
            [-19.92, -43.94], [-19.80, -43.80], [-20.02, -44.05], [-19.75, -44.00],
            [-19.95, -44.12], [-19.68, -43.88], [-19.88, -43.72], [-20.12, -44.18],
            // Brasília (6)
            [-15.78, -47.93], [-15.60, -47.81], [-15.88, -48.05],
            [-15.70, -47.70], [-16.00, -47.90], [-15.55, -48.10],
            // Curitiba (6)
            [-25.43, -49.27], [-25.52, -49.18], [-25.38, -49.35],
            [-25.48, -49.45], [-25.35, -49.28], [-25.55, -49.10],
            // Porto Alegre (6)
            [-30.03, -51.23], [-29.90, -51.10], [-30.15, -51.35],
            [-30.05, -51.28], [-29.95, -51.18], [-30.20, -51.42],
            // Salvador (4)
            [-12.97, -38.50], [-12.85, -38.42], [-13.02, -38.58], [-12.92, -38.36],
            // Recife (4)
            [-8.05, -34.88], [-8.12, -35.02], [-7.98, -34.75], [-8.18, -34.95],
            // Fortaleza (4)
            [-3.72, -38.54], [-3.80, -38.45], [-3.65, -38.62], [-3.88, -38.35],
            // Manaus (3)
            [-3.10, -60.02], [-3.15, -60.12], [-3.05, -59.92],
            // Belém (3)
            [-1.46, -48.50], [-1.52, -48.58], [-1.40, -48.42],
            // Goiânia (3)
            [-16.68, -49.22], [-16.75, -49.30], [-16.60, -49.15],
            // Natal (2)
            [-5.79, -35.21], [-5.88, -35.12],
            // Florianópolis (2)
            [-27.60, -48.55], [-27.65, -48.45],
            // Londrina (2)
            [-23.31, -51.16], [-23.38, -51.22],
            // Campo Grande (2)
            [-20.44, -54.65], [-20.50, -54.75],
            // Vitória (2)
            [-20.32, -40.34], [-20.40, -40.28],
            // São Luís (2)
            [-2.53, -44.30], [-2.60, -44.38],
            // Single cities
            [-5.09, -42.81],  // Teresina
            [-7.12, -34.86],  // João Pessoa
            [-10.91, -37.05], // Aracaju
            [-9.66, -35.73],  // Maceió
            [-8.76, -63.90],  // Porto Velho
            [-9.97, -67.81],  // Rio Branco
            [-10.18, -48.33], // Palmas
            [-15.60, -56.10], // Cuiabá
            [-23.43, -51.94], // Maringá
            [-26.30, -48.85], // Joinville
            [0.03, -51.05],   // Macapá
            [2.82, -60.67]    // Boa Vista
        ];

        var PINS_WORLD = [
            // Argentina
            [-34.61, -58.38], [-34.72, -58.25], [-34.50, -58.50], [-31.42, -64.19],
            // Chile
            [-33.45, -70.67], [-36.82, -73.05],
            // Peru
            [-12.05, -77.04],
            // Colombia
            [4.71, -74.07], [6.25, -75.56],
            // Venezuela
            [10.49, -66.88],
            // Ecuador
            [-0.23, -78.52],
            // Bolivia
            [-16.50, -68.15],
            // Paraguay
            [-25.28, -57.58],
            // Uruguay
            [-34.90, -56.18],
            // Mexico
            [19.43, -99.13], [20.67, -103.35], [25.69, -100.32],
            // Central America
            [9.93, -84.08],
            // Caribbean
            [18.47, -69.90],
            // USA — East
            [40.71, -74.01], [42.36, -71.06], [38.91, -77.04],
            [39.95, -75.17], [33.75, -84.39], [25.77, -80.19],
            // USA — Midwest & South
            [41.88, -87.63], [29.76, -95.37], [32.78, -96.80],
            // USA — West
            [34.05, -118.24], [37.77, -122.42], [47.61, -122.33], [39.74, -104.98],
            // Canada
            [43.65, -79.38], [45.51, -73.55], [49.25, -123.12],
            // Europe — UK
            [51.51, -0.13], [53.48, -2.24],
            // Europe — France
            [48.86, 2.35], [45.75, 4.85],
            // Europe — Spain & Portugal
            [40.42, -3.70], [41.39, 2.16], [38.72, -9.14],
            // Europe — Italy
            [41.90, 12.48], [45.46, 9.19],
            // Europe — Netherlands & Scandinavia
            [52.37, 4.90], [59.91, 10.75], [59.33, 18.07],
            // Europe — Other
            [47.38, 8.54], [52.23, 21.01]
        ];

        function buildPins() {
            var pPos = [], pCols = [], rPin = R * 1.012;
            for (var pi = 0; pi < PINS_BR.length; pi++) {
                var vp = ll(PINS_BR[pi][0], PINS_BR[pi][1], rPin);
                pPos.push(vp.x, vp.y, vp.z);
                pCols.push(0.82, 0.12, 1.00); // bright purple
            }
            for (var wi = 0; wi < PINS_WORLD.length; wi++) {
                var vw = ll(PINS_WORLD[wi][0], PINS_WORLD[wi][1], rPin);
                pPos.push(vw.x, vw.y, vw.z);
                pCols.push(0.00, 0.85, 1.00); // teal
            }
            var pg = new THREE.BufferGeometry();
            pg.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
            pg.setAttribute('color',    new THREE.Float32BufferAttribute(pCols, 3));
            globeGroup.add(new THREE.Points(pg, new THREE.PointsMaterial({
                size: 0.030, vertexColors: true, transparent: true, opacity: 0.95, sizeAttenuation: true
            })));
        }

        // ── Load Earth texture, build sphere ──────────────────────────────────
        var TEXTURE_URL = 'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg';

        var loader = new THREE.TextureLoader();
        loader.setCrossOrigin('anonymous');

        loader.load(
            TEXTURE_URL,
            function (texture) {

                // — Earth sphere with real texture ——————————————————————————————
                var sphereMat = new THREE.MeshPhongMaterial({
                    map:       texture,
                    specular:  new THREE.Color(0x111122),
                    shininess: 12,
                    // subtle dark tint so it integrates with the dark page
                    color:     new THREE.Color(0.70, 0.70, 0.70)
                });
                globeGroup.add(new THREE.Mesh(new THREE.SphereGeometry(R, 64, 64), sphereMat));

                // — Add 30 country pins ————————————————————————————————————————
                buildPins();
            },
            undefined,
            function () {
                // Fallback: dark sphere + pins if texture CDN fails
                globeGroup.add(new THREE.Mesh(
                    new THREE.SphereGeometry(R, 64, 64),
                    new THREE.MeshPhongMaterial({ color: 0x030712, emissive: 0x03050f })
                ));
                buildPins();
            }
        );

        // ── Drag / touch interaction ──────────────────────────────────────────
        var isDragging = false;
        var prevMouse  = { x: 0, y: 0 };
        var rotSpeed   = { x: 0, y: 0 };
        var AUTO_SPD   = 0.0015;

        renderer.domElement.addEventListener('mousedown', function (e) {
            isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; rotSpeed = { x: 0, y: 0 };
        });
        window.addEventListener('mouseup', function () { isDragging = false; });
        window.addEventListener('mousemove', function (e) {
            if (!isDragging) return;
            rotSpeed.x = (e.clientY - prevMouse.y) * 0.005;
            rotSpeed.y = (e.clientX - prevMouse.x) * 0.005;
            globeGroup.rotation.x += rotSpeed.x;
            globeGroup.rotation.y += rotSpeed.y;
            prevMouse = { x: e.clientX, y: e.clientY };
        });
        renderer.domElement.addEventListener('touchstart', function (e) {
            isDragging = true; prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; rotSpeed = { x: 0, y: 0 };
        }, { passive: true });
        window.addEventListener('touchend',  function () { isDragging = false; });
        window.addEventListener('touchmove', function (e) {
            if (!isDragging) return;
            rotSpeed.x = (e.touches[0].clientY - prevMouse.y) * 0.005;
            rotSpeed.y = (e.touches[0].clientX - prevMouse.x) * 0.005;
            globeGroup.rotation.x += rotSpeed.x;
            globeGroup.rotation.y += rotSpeed.y;
            prevMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }, { passive: true });

        // ── Animation loop ────────────────────────────────────────────────────
        var _globeRafId = null, _globeRunning = false;
        function animate() {
            if (!_globeRunning) return;
            _globeRafId = requestAnimationFrame(animate);
            if (!isDragging) {
                rotSpeed.x *= 0.92;
                rotSpeed.y *= 0.92;
                globeGroup.rotation.y += AUTO_SPD;
            }
            globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));
            renderer.render(scene, camera);
        }
        if ('IntersectionObserver' in window) {
            var globeObs = new IntersectionObserver(function(entries) {
                if (entries[0].isIntersecting) {
                    if (!_globeRunning) { _globeRunning = true; animate(); }
                } else {
                    _globeRunning = false;
                    if (_globeRafId) { cancelAnimationFrame(_globeRafId); _globeRafId = null; }
                }
            }, { threshold: 0.01 });
            globeObs.observe(container);
        } else {
            _globeRunning = true;
            animate();
        }

        // ── Window resize ─────────────────────────────────────────────────────
        window.addEventListener('resize', function () {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

})();

