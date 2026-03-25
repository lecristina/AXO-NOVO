/* globe.js - 3D Globe with world map texture using Three.js */
(function() {
    const container = document.getElementById('globe-container');
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.insertBefore(renderer.domElement, container.firstChild);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 3, 5);
    scene.add(directionalLight);
    const purpleLight = new THREE.PointLight(0x8f00cc, 0.6, 10);
    purpleLight.position.set(-3, 2, 3);
    scene.add(purpleLight);

    // Globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Globe — real Earth texture
    const globeRadius = 1;
    const segments = 64;

    // Load the real Earth texture from CDN
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin('anonymous');

    function buildGlobe(earthTexture) {
        // Earth sphere with real texture
        const geo = new THREE.SphereGeometry(globeRadius, segments, segments);
        const mat = new THREE.MeshPhongMaterial({
            map: earthTexture,
            specular: new THREE.Color(0x222244),
            shininess: 12
        });
        globeGroup.add(new THREE.Mesh(geo, mat));

        // Atmosphere glow (blue halo)
        const atmosGeo = new THREE.SphereGeometry(globeRadius * 1.06, segments, segments);
        const atmosMat = new THREE.ShaderMaterial({
            vertexShader: [
                'varying vec3 vNormal;',
                'void main() {',
                '  vNormal = normalize(normalMatrix * normal);',
                '  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);',
                '}'
            ].join('\n'),
            fragmentShader: [
                'varying vec3 vNormal;',
                'void main() {',
                '  float intensity = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);',
                '  gl_FragColor = vec4(0.28, 0.58, 1.0, 1.0) * intensity;',
                '}'
            ].join('\n'),
            blending: THREE.AdditiveBlending,
            side: THREE.BackSide,
            transparent: true
        });
        globeGroup.add(new THREE.Mesh(atmosGeo, atmosMat));

        // City markers
        const cities = [
            { lat: -23.55, lon: -46.63 }, { lat:  40.71, lon: -74.01 },
            { lat:  51.51, lon:  -0.13 }, { lat:  35.68, lon: 139.69 },
            { lat:  48.86, lon:   2.35 }, { lat: -33.87, lon: 151.21 },
            { lat:  55.76, lon:  37.62 }, { lat:   1.35, lon: 103.82 },
            { lat: -34.60, lon: -58.38 }, { lat:  25.20, lon:  55.27 }
        ];
        cities.forEach(function(city) {
            const latR = city.lat * Math.PI / 180;
            const lonR = city.lon * Math.PI / 180;
            const x = globeRadius * 1.018 * Math.cos(latR) * Math.cos(lonR);
            const y = globeRadius * 1.018 * Math.sin(latR);
            const z = globeRadius * 1.018 * Math.cos(latR) * Math.sin(lonR);
            const dot = new THREE.Mesh(
                new THREE.SphereGeometry(0.012, 8, 8),
                new THREE.MeshBasicMaterial({ color: 0xffffff })
            );
            dot.position.set(x, y, z);
            globeGroup.add(dot);
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(0.016, 0.027, 16),
                new THREE.MeshBasicMaterial({ color: 0xcc44ff, transparent: true, opacity: 0.5, side: THREE.DoubleSide })
            );
            ring.position.set(x, y, z);
            ring.lookAt(0, 0, 0);
            ring.userData.pulse = true;
            ring.userData.time = Math.random() * Math.PI * 2;
            globeGroup.add(ring);
        });
    }

    // Canvas fallback (drawn continents) if CDN is unavailable
    function makeFallbackTexture() {
        const cv = document.createElement('canvas');
        cv.width = 1024; cv.height = 512;
        const ctx = cv.getContext('2d');
        // Ocean
        ctx.fillStyle = '#1a5276'; ctx.fillRect(0, 0, 1024, 512);
        ctx.fillStyle = '#1f618d'; ctx.fillRect(0, 0, 1024, 512);
        // Continents (approximate)
        ctx.fillStyle = '#27ae60';
        // North America
        ctx.beginPath(); ctx.ellipse(200, 160, 90, 80, -0.2, 0, Math.PI*2); ctx.fill();
        // South America
        ctx.beginPath(); ctx.ellipse(255, 320, 52, 90, 0.1, 0, Math.PI*2); ctx.fill();
        // Europe + Africa
        ctx.beginPath(); ctx.ellipse(512, 175, 45, 55, 0, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(516, 320, 48, 90, 0, 0, Math.PI*2); ctx.fill();
        // Asia
        ctx.beginPath(); ctx.ellipse(700, 175, 150, 80, 0, 0, Math.PI*2); ctx.fill();
        // Australia
        ctx.beginPath(); ctx.ellipse(795, 360, 55, 35, 0, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#ecf0f1';
        // Antarctica
        ctx.fillRect(0, 470, 1024, 42);
        // Arctic
        ctx.beginPath(); ctx.arc(512, 0, 60, 0, Math.PI); ctx.fill();
        return new THREE.CanvasTexture(cv);
    }

    // Try loading from CDN; use fallback if unavailable
    textureLoader.load(
        'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
        buildGlobe,
        undefined,
        function() { buildGlobe(makeFallbackTexture()); }
    );

    // Background stars
    const starPos = new Float32Array(1000 * 3);
    for (let p = 0; p < 1000; p++) {
        starPos[p*3]   = (Math.random() - 0.5) * 14;
        starPos[p*3+1] = (Math.random() - 0.5) * 14;
        starPos[p*3+2] = (Math.random() - 0.5) * 14 - 5;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.Float32BufferAttribute(starPos, 3));
    scene.add(new THREE.Points(starGeo, new THREE.PointsMaterial({
        color: 0xffffff, size: 0.013, transparent: true, opacity: 0.4, sizeAttenuation: true
    })));

    // Interaction — drag to rotate
    let isDragging = false;
    let previousMouse = { x: 0, y: 0 };
    let rotationSpeed = { x: 0, y: 0 };
    const autoRotateSpeed = 0.0015;

    renderer.domElement.addEventListener('mousedown', function(e) {
        isDragging = true;
        previousMouse = { x: e.clientX, y: e.clientY };
        rotationSpeed = { x: 0, y: 0 };
    });
    window.addEventListener('mouseup', function() { isDragging = false; });
    window.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        const dx = e.clientX - previousMouse.x;
        const dy = e.clientY - previousMouse.y;
        rotationSpeed.x = dy * 0.005;
        rotationSpeed.y = dx * 0.005;
        globeGroup.rotation.x += rotationSpeed.x;
        globeGroup.rotation.y += rotationSpeed.y;
        previousMouse = { x: e.clientX, y: e.clientY };
    });
    renderer.domElement.addEventListener('touchstart', function(e) {
        isDragging = true;
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        rotationSpeed = { x: 0, y: 0 };
    }, { passive: true });
    window.addEventListener('touchend', function() { isDragging = false; });
    window.addEventListener('touchmove', function(e) {
        if (!isDragging) return;
        const dx = e.touches[0].clientX - previousMouse.x;
        const dy = e.touches[0].clientY - previousMouse.y;
        rotationSpeed.x = dy * 0.005;
        rotationSpeed.y = dx * 0.005;
        globeGroup.rotation.x += rotationSpeed.x;
        globeGroup.rotation.y += rotationSpeed.y;
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });

    // Animation loop
    const clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);

        if (!isDragging) {
            rotationSpeed.x *= 0.92;
            rotationSpeed.y *= 0.92;
            globeGroup.rotation.y += autoRotateSpeed;
        }
        globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

        // Pulse city rings
        globeGroup.children.forEach(function(child) {
            if (child.userData && child.userData.pulse) {
                child.userData.time += 0.03;
                const s = 1 + Math.abs(Math.sin(child.userData.time)) * 0.4;
                child.scale.set(s, s, s);
                child.material.opacity = 0.2 + Math.abs(Math.sin(child.userData.time)) * 0.35;
            }
        });

        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    window.addEventListener('resize', function() {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });
})();
