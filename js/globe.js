/* globe.js – Earth globe: real Blue-Marble texture + dot overlay on continents */
(function () {

    // Wait until the container has real CSS dimensions (Tailwind CDN is async)
    function waitAndInit() {
        var container = document.getElementById('globe-container');
        if (!container) return;
        if (container.clientWidth === 0 || container.clientHeight === 0) {
            requestAnimationFrame(waitAndInit);
            return;
        }
        boot(container);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', waitAndInit);
    } else {
        waitAndInit();
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
            // São Paulo city & metro — dense cluster
            [-23.55, -46.63], [-23.50, -46.85], [-23.63, -46.52], [-23.48, -46.40],
            [-23.70, -46.72], [-23.37, -46.75], [-23.60, -46.48], [-23.44, -46.55],
            [-23.68, -46.88], [-23.54, -46.96], [-23.42, -46.68], [-23.58, -46.30],
            [-23.72, -46.60], [-23.46, -46.82], [-23.65, -46.40], [-23.52, -47.05],
            [-23.35, -46.90], [-23.78, -46.55], [-23.80, -46.42],
            // Rio de Janeiro city & metro — dense cluster
            [-22.91, -43.17], [-22.82, -43.10], [-23.00, -43.35], [-22.96, -43.40],
            [-22.75, -43.05], [-22.88, -43.28], [-22.94, -43.52], [-22.80, -43.22],
            [-22.72, -43.32], [-23.02, -43.18], [-22.86, -42.98], [-22.78, -43.15],
            [-23.08, -43.42], [-22.98, -43.60], [-22.70, -43.48],
            // Other Brazilian cities
            [-15.78, -47.93], // Brasília
            [-15.60, -47.81], [-15.88, -48.05], // Brasília metro
            [-12.97, -38.50], // Salvador
            [-8.05,  -34.88], // Recife
            [-8.12,  -35.02], [-7.98, -34.75], // Recife metro
            [-3.72,  -38.54], // Fortaleza
            [-3.80,  -38.45], [-3.65, -38.62], // Fortaleza metro
            [-3.10,  -60.02], // Manaus
            [-30.03, -51.23], // Porto Alegre
            [-29.90, -51.10], [-30.15, -51.35], // Porto Alegre metro
            [-1.46,  -48.50], // Belém
            [-19.92, -43.94], // Belo Horizonte
            [-19.80, -43.80], [-20.02, -44.05], [-19.75, -44.00], // BH metro
            [-8.76,  -63.90], // Porto Velho
            [-5.09,  -42.81], // Teresina
            [-25.43, -49.27], // Curitiba
            [-25.52, -49.18], [-25.38, -49.35], // Curitiba metro
            [-2.53,  -44.30], // São Luís
            [-16.68, -49.22], // Goiânia
            [-10.91, -37.05], // Aracaju
            [-9.66,  -35.73], // Maceió
            [-20.32, -40.34], // Vitória
            [-7.12,  -34.86]  // João Pessoa
        ];

        var PINS_WORLD = [
            // Argentina
            [-34.61, -58.38], [-34.72, -58.25], [-34.50, -58.50], [-34.90, -57.95],
            [-31.42, -64.19], [-32.89, -68.87],
            // Chile
            [-33.45, -70.67], [-33.28, -70.85], [-36.82, -73.05],
            // Peru
            [-12.05, -77.04], [-8.11, -79.03],
            // Colombia
            [4.71, -74.07], [6.25, -75.56], [3.86, -77.02],
            // Venezuela
            [10.49, -66.88], [10.07, -69.32],
            // Ecuador
            [-0.23, -78.52],
            // Bolivia
            [-16.50, -68.15],
            // Paraguay
            [-25.28, -57.58],
            // Uruguay
            [-34.90, -56.18],
            // Mexico
            [19.43, -99.13], [20.67, -103.35], [20.97, -89.62],
            [25.69, -100.32], [17.06, -96.72],
            // Central America
            [9.93, -84.08], [14.09, -87.21],
            // Caribbean
            [18.47, -69.90], [10.49, -61.31],
            // USA — East Coast
            [40.71, -74.01], [42.36, -71.06], [38.91, -77.04],
            [39.95, -75.17], [35.23, -80.84], [33.75, -84.39],
            [25.77, -80.19], [30.33, -81.66],
            // USA — Midwest
            [41.88, -87.63], [44.98, -93.27], [39.10, -84.51],
            [43.05, -76.15],
            // USA — South
            [29.76, -95.37], [30.27, -97.75], [32.78, -96.80],
            [29.95, -90.08], [36.17, -86.78],
            // USA — West
            [34.05, -118.24], [37.77, -122.42], [47.61, -122.33],
            [33.45, -112.07], [39.74, -104.98], [36.17, -115.14],
            [45.52, -122.68],
            // Canada
            [43.65, -79.38], [45.51, -73.55], [51.05, -114.07],
            [49.25, -123.12], [45.42, -75.69],
            // Europe — UK
            [51.51, -0.13], [53.48, -2.24], [55.86, -4.25],
            // Europe — France
            [48.86, 2.35], [43.30, 5.37], [45.75, 4.85],
            // Europe — Spain & Portugal
            [40.42, -3.70], [41.39, 2.16], [38.72, -9.14], [41.15, -8.61],
            // Europe — Italy
            [41.90, 12.48], [45.46, 9.19], [40.85, 14.27],
            // Europe — Netherlands & Belgium
            [52.37, 4.90], [50.85, 4.35],
            // Europe — Scandinavia
            [59.91, 10.75], [59.33, 18.07], [55.68, 12.57],
            // Europe — Switzerland & Austria
            [47.38, 8.54], [48.21, 16.37],
            // Europe — Poland & Czech
            [52.23, 21.01], [50.08, 14.44]
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
        function animate() {
            requestAnimationFrame(animate);
            if (!isDragging) {
                rotSpeed.x *= 0.92;
                rotSpeed.y *= 0.92;
                globeGroup.rotation.y += AUTO_SPD;
            }
            globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));
            renderer.render(scene, camera);
        }
        animate();

        // ── Window resize ─────────────────────────────────────────────────────
        window.addEventListener('resize', function () {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        });
    }

})();

