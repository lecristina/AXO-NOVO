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

        // ── 30 hardcoded country pins (lat, lon) ────────────────────────────────
        // Brazil gets 8 pins (bright purple), rest of world gets 22 (teal)
        var PINS = [
            // Brazil (8)
            [-23.55, -46.63], [-22.91, -43.17], [-15.78, -47.93], [-12.97, -38.50],
            [-8.05,  -34.88], [-3.10,  -60.02], [-30.03, -51.23], [-1.46,  -48.50],
            // South America
            [-34.61, -58.38], [-33.45, -70.67], [-12.05, -77.04], [4.71, -74.07],
            // North America
            [40.71, -74.01], [34.05, -118.24], [41.88, -87.63], [43.65, -79.38], [19.43, -99.13],
            // Europe
            [51.51, -0.13], [48.86, 2.35], [52.52, 13.40], [38.72, -9.14],
            // Africa
            [30.06, 31.25], [6.52, 3.38], [-1.29, 36.82], [-26.20, 28.04],
            // Asia
            [55.75, 37.62], [28.61, 77.21], [19.08, 72.88], [31.23, 121.47], [35.69, 139.69],
            // Oceania
            [-33.87, 151.21]
        ];

        function buildPins() {
            var pPos = [], pCols = [], rPin = R * 1.012;
            for (var pi = 0; pi < PINS.length; pi++) {
                var vp = ll(PINS[pi][0], PINS[pi][1], rPin);
                pPos.push(vp.x, vp.y, vp.z);
                if (pi < 8) { pCols.push(0.82, 0.12, 1.00); } // Brazil: bright purple
                else        { pCols.push(0.00, 0.85, 1.00); } // world: teal
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

