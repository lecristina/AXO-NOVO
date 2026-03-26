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
            var theta = lon        * Math.PI / 180;
            return new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
        }

        // ── Background stars ──────────────────────────────────────────────────
        (function () {
            var pos = new Float32Array(1800 * 3);
            for (var i = 0; i < 1800; i++) {
                pos[i*3]   = (Math.random() - 0.5) * 20;
                pos[i*3+1] = (Math.random() - 0.5) * 20;
                pos[i*3+2] = (Math.random() - 0.5) * 20 - 5;
            }
            var g = new THREE.BufferGeometry();
            g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
            scene.add(new THREE.Points(g, new THREE.PointsMaterial({
                color: 0xffffff, size: 0.011, transparent: true, opacity: 0.50, sizeAttenuation: true
            })));
        })();

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

        // ── Load Earth texture, build sphere + dot overlay ────────────────────
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

                // — Sample texture on a canvas to detect land vs ocean ——————————
                var img = texture.image;
                var CW  = 720, CH = 360;
                var cv  = document.createElement('canvas');
                cv.width = CW; cv.height = CH;
                cv.getContext('2d').drawImage(img, 0, 0, CW, CH);
                var px = cv.getContext('2d').getImageData(0, 0, CW, CH).data;

                function isLand(lon, lat) {
                    var x = Math.min(CW - 1, Math.max(0, Math.round((lon + 180) * CW / 360)));
                    var y = Math.min(CH - 1, Math.max(0, Math.round((90  - lat)  * CH / 180)));
                    var k = (y * CW + x) * 4;
                    var r = px[k], g = px[k+1], b = px[k+2];
                    // Ocean pixels are dark blue: low red, blue dominant
                    return !(r < 70 && b > g * 1.1 && b > 60);
                }

                // — Build dot cloud only on land ————————————————————————————————
                var pos = [], cols = [];
                var rDot = R * 1.004;
                var step = 0.9;  // ~100 km

                for (var lat = -90; lat <= 90; lat += step) {
                    var cosLat  = Math.cos(lat * Math.PI / 180);
                    var lonStep = cosLat < 0.02 ? 360 : step / cosLat;
                    lonStep = Math.max(step, Math.min(lonStep, 5));

                    for (var lon = -180; lon <= 180; lon += lonStep) {
                        if (!isLand(lon, lat)) continue;
                        var v = ll(lat, lon, rDot);
                        pos.push(v.x, v.y, v.z);
                        var t = Math.random();
                        if      (t < 0.50) cols.push(0.70, 0.10, 1.00);  // bright purple
                        else if (t < 0.80) cols.push(0.00, 0.90, 1.00);  // teal
                        else               cols.push(1.00, 1.00, 1.00);  // white
                    }
                }

                var geo = new THREE.BufferGeometry();
                geo.setAttribute('position', new THREE.Float32BufferAttribute(pos,  3));
                geo.setAttribute('color',    new THREE.Float32BufferAttribute(cols, 3));
                globeGroup.add(new THREE.Points(geo, new THREE.PointsMaterial({
                    size: 0.010, vertexColors: true,
                    transparent: true, opacity: 0.85, sizeAttenuation: true
                })));
            },
            undefined,
            function () {
                // Fallback: dark sphere + dots everywhere if texture CDN fails
                globeGroup.add(new THREE.Mesh(
                    new THREE.SphereGeometry(R, 64, 64),
                    new THREE.MeshPhongMaterial({ color: 0x030712, emissive: 0x03050f })
                ));
                var pos = [], cols = [];
                for (var lat2 = -90; lat2 <= 90; lat2 += 0.9) {
                    for (var lon2 = -180; lon2 <= 180; lon2 += 0.9) {
                        var v2 = ll(lat2, lon2, R * 1.004);
                        pos.push(v2.x, v2.y, v2.z);
                        var t2 = Math.random();
                        cols.push(t2 < 0.5 ? 0.7 : 0, t2 < 0.5 ? 0.1 : 0.9, t2 < 0.5 ? 1 : 1);
                    }
                }
                var g2 = new THREE.BufferGeometry();
                g2.setAttribute('position', new THREE.Float32BufferAttribute(pos,  3));
                g2.setAttribute('color',    new THREE.Float32BufferAttribute(cols, 3));
                globeGroup.add(new THREE.Points(g2, new THREE.PointsMaterial({
                    size: 0.010, vertexColors: true, transparent: true, opacity: 0.80, sizeAttenuation: true
                })));
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

