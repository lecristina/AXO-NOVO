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

    // Create globe with procedural world map
    const globeRadius = 1;
    const segments = 80;

    // Base sphere - dark ocean
    const baseGeometry = new THREE.SphereGeometry(globeRadius, segments, segments);
    const baseMaterial = new THREE.MeshPhongMaterial({
        color: 0x0a0a2e,
        transparent: true,
        opacity: 0.95,
        shininess: 30
    });
    const baseSphere = new THREE.Mesh(baseGeometry, baseMaterial);
    globeGroup.add(baseSphere);

    // Atmosphere glow
    const atmosGeometry = new THREE.SphereGeometry(globeRadius * 1.02, segments, segments);
    const atmosMaterial = new THREE.ShaderMaterial({
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
            '  float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);',
            '  gl_FragColor = vec4(0.56, 0.0, 0.8, 1.0) * intensity;',
            '}'
        ].join('\n'),
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        transparent: true
    });
    const atmosSphere = new THREE.Mesh(atmosGeometry, atmosMaterial);
    globeGroup.add(atmosSphere);

    // Latitude/Longitude grid lines
    const gridMaterial = new THREE.LineBasicMaterial({ color: 0x8f00cc, transparent: true, opacity: 0.08 });
    for (var lat = -80; lat <= 80; lat += 20) {
        var latRad = lat * Math.PI / 180;
        var r = globeRadius * 1.002 * Math.cos(latRad);
        var y = globeRadius * 1.002 * Math.sin(latRad);
        var pts = [];
        for (var i = 0; i <= 64; i++) {
            var a = (i / 64) * Math.PI * 2;
            pts.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r));
        }
        var g = new THREE.BufferGeometry().setFromPoints(pts);
        globeGroup.add(new THREE.Line(g, gridMaterial));
    }
    for (var lon = 0; lon < 360; lon += 30) {
        var lonRad = lon * Math.PI / 180;
        var pts2 = [];
        for (var j = 0; j <= 64; j++) {
            var latA = (j / 64) * Math.PI - Math.PI / 2;
            pts2.push(new THREE.Vector3(
                Math.cos(latA) * Math.cos(lonRad) * globeRadius * 1.002,
                Math.sin(latA) * globeRadius * 1.002,
                Math.cos(latA) * Math.sin(lonRad) * globeRadius * 1.002
            ));
        }
        var g2 = new THREE.BufferGeometry().setFromPoints(pts2);
        globeGroup.add(new THREE.Line(g2, gridMaterial));
    }

    // CORRECTED continent polygons — [lat, lon] vertices
    var rle_unused = [
        // lat 90..81 (arctic - mostly ocean, some land edges)
        360,0, 360,0, 360,0, 360,0, 360,0,
        // lat 80
        0,25,335,0, 0,30,330,0, 0,28,332,0, 0,20,340,0,
        // lat 76..73 greenland peak
        0,8,22,0,270,5,55,0, 0,10,25,0,265,8,52,0,
        0,12,28,0,260,10,50,0, 0,15,30,0,255,15,45,0,
        // lat 72..69
        0,20,35,0,250,18,37,0, 0,22,30,0,252,20,36,0,
        0,18,25,0,258,15,44,0, 0,15,22,0,263,12,48,0,
        // lat 68..63 (alaska, canada, greenland, scandinavia, russia)
        0,30,8,0,5,18,14,0,230,20,35,0,
        0,32,6,0,4,22,12,0,228,22,33,0,
        0,35,4,0,3,25,10,0,225,25,31,0,
        0,38,2,0,2,28,8,0,222,28,28,0,
        0,40,55,0,215,32,18,0,
        0,38,60,0,212,35,15,0,
        // lat 62..57 (alaska+canada, iceland, scandinavia, russia)
        0,35,65,0,10,6,8,0,186,40,10,0,
        0,33,68,0,9,8,8,0,183,42,8,0,
        0,30,72,0,8,10,7,0,180,44,6,0,
        0,28,75,0,7,8,6,0,184,42,8,0,
        0,25,78,0,6,6,5,0,188,40,12,0,
        0,22,82,0,5,4,4,0,192,38,13,0,
        // lat 56..51 (canada, uk, europe, russia)
        0,19,85,0,15,16,0,5,16,204,35,10,0,
        0,17,88,0,13,18,0,4,18,200,37,8,0,
        0,14,90,0,12,20,0,3,20,196,39,6,0,
        0,12,92,0,11,22,0,2,22,192,41,4,0,
        0,10,95,0,8,26,0,1,24,190,42,3,0,
        0,8,98,0,5,30,196,43,2,0,
        // lat 50..45 (canada/usa, europe, central asia)
        0,5,100,0,3,34,194,44,0,
        0,3,102,0,2,36,192,45,0,
        0,1,104,0,1,38,190,46,0,
        0,105,0,40,188,47,0,
        0,106,0,42,186,48,0,
        0,107,0,44,184,49,0,
        // lat 44..39 (usa, mediterranean, china, japan)
        0,108,0,40,2,3,180,50,0,
        0,109,0,38,4,4,178,52,0,
        0,110,0,36,6,5,176,54,0,
        0,111,0,34,8,6,174,56,0,
        0,112,0,32,10,7,172,58,0,
        0,113,0,30,12,8,170,60,0,
        // lat 38..33 (usa, north africa, middle east, china)
        0,115,0,18,15,10,155,6,3,62,0,
        0,116,0,16,17,11,153,7,4,63,0,
        0,117,0,14,19,12,151,8,5,64,0,
        0,118,0,12,22,13,149,9,6,64,0,
        0,119,0,10,25,14,147,10,7,64,0,
        0,120,0,8,28,15,144,12,8,64,0,
        // lat 32..27 (usa/mexico, north africa, arabia, india, china)
        0,121,0,5,32,17,140,15,9,61,0,
        0,122,0,3,35,20,135,18,10,60,0,
        0,123,0,1,40,22,130,20,12,58,0,
        0,124,0,42,24,128,22,14,56,0,
        0,125,0,40,26,126,24,15,54,0,
        0,126,0,38,28,124,26,16,52,0,
        // lat 26..21 (mexico, sahara, arabia, india, sea/thailand)
        0,125,0,37,30,122,28,18,50,0,
        0,124,0,36,32,120,30,20,48,0,
        0,122,0,35,34,118,32,22,46,0,
        0,120,0,34,36,116,34,24,44,0,
        0,117,0,33,38,114,36,26,42,0,
        0,114,0,32,40,112,38,28,38,0,
        // lat 20..15 (mexico, sahara/subsahara, arabia, india tip, sea)
        0,110,0,30,42,110,40,6,3,20,34,0,
        0,109,0,28,44,108,42,5,4,19,33,0,
        0,108,0,26,46,106,43,4,5,18,32,0,
        0,107,0,24,48,104,44,3,6,17,31,0,
        0,106,0,22,50,102,45,2,7,16,30,0,
        0,105,0,20,52,100,46,1,8,15,29,0,
        // lat 14..9 (central america, sahel, africa, se asia)
        0,103,0,16,56,98,8,3,35,18,8,3,12,22,0,
        0,101,0,12,60,96,6,4,34,20,6,4,11,21,0,
        0,99,0,8,65,94,4,5,33,22,4,5,10,20,0,
        0,97,0,5,70,92,2,6,32,24,2,6,9,19,0,
        0,95,0,2,75,90,1,7,31,25,1,7,8,18,0,
        0,92,0,78,89,8,30,8,7,17,0,
        // lat 8..3 (central america, africa, madagascar start, se asia, borneo)
        0,89,0,80,87,9,30,9,6,3,14,16,3,3,0,
        0,87,0,82,85,10,30,10,5,4,13,15,4,4,0,
        0,85,0,84,83,11,30,12,4,5,12,14,5,5,0,
        0,83,0,86,81,12,30,14,3,6,11,13,6,6,0,
        0,81,0,88,79,13,30,16,2,7,10,12,7,7,0,
        0,79,0,90,77,14,30,18,1,8,9,11,8,8,0,
        // lat 2..-3 (south america, africa/congo, se asia/borneo)
        0,77,0,92,75,15,30,20,9,8,10,9,9,0,
        0,76,0,94,73,16,30,22,8,7,11,8,10,0,
        0,75,0,96,71,17,30,24,7,6,12,7,11,0,
        0,74,0,98,69,18,30,26,6,5,13,6,12,0,
        0,73,0,100,67,19,30,28,5,4,14,5,13,0,
        0,72,0,102,65,20,30,30,4,3,15,4,14,0,
        // lat -4..-9 (s.america, africa, madagascar, indonesia)
        0,71,0,104,62,22,30,32,3,2,16,3,15,0,
        0,70,0,106,59,24,30,34,2,1,17,2,16,0,
        0,69,0,108,56,26,30,36,1,18,1,17,0,
        0,68,0,110,52,28,30,38,20,18,0,
        0,67,0,112,48,30,30,40,22,17,0,
        0,66,0,114,44,32,30,42,24,16,0,
        // lat -10..-15 (s.america, angola, mozambique, madagascar, timor)
        0,65,0,116,40,34,30,44,26,15,0,
        0,64,0,118,36,36,30,46,28,14,0,
        0,63,0,120,32,38,30,48,30,13,0,
        0,62,0,122,28,40,30,50,32,12,0,
        0,61,0,124,24,42,30,52,34,11,0,
        0,60,0,126,20,44,30,54,36,10,0,
        // lat -16..-21 (s.america, africa, madagascar center, aus start)
        0,59,0,128,16,46,26,58,38,9,0,
        0,58,0,130,12,48,22,60,40,8,0,
        0,57,0,132,8,50,18,62,42,7,0,
        0,56,0,134,4,52,14,64,44,6,0,
        0,55,0,136,52,12,66,45,5,0,
        0,54,0,138,50,10,68,46,4,0,
        // lat -22..-27 (s.america, africa, madagascar end, australia)
        0,52,0,140,48,8,70,48,3,0,
        0,50,0,142,46,6,72,50,2,0,
        0,48,0,144,44,4,74,52,1,0,
        0,46,0,146,42,2,76,54,0,
        0,44,0,148,40,78,56,0,
        0,42,0,150,38,80,58,0,
        // lat -28..-33 (s.america, southern africa, australia)
        0,40,0,151,36,82,60,0,
        0,38,0,152,34,84,62,0,
        0,36,0,153,32,86,64,0,
        0,34,0,154,30,88,66,0,
        0,32,0,155,28,90,68,0,
        0,30,0,156,26,92,70,0,
        // lat -34..-39 (s.america tip, cape, australia south)
        0,28,0,157,22,94,72,0,
        0,24,0,158,18,96,74,0,
        0,20,0,159,14,98,76,0,
        0,16,0,160,10,100,78,0,
        0,12,0,162,6,102,80,0,
        0,8,0,164,2,104,82,0,
        // lat -40..-45 (chile/argentina, aus, nz)
        0,6,0,168,106,84,0,
        0,4,0,172,108,84,2,2,0,
        0,2,0,176,110,82,4,4,0,
        0,1,0,179,112,80,6,4,0,
        0,180,114,78,8,4,0,
        0,180,116,76,10,4,0,
        // lat -46..-51
        0,180,118,74,10,4,0,
        0,180,120,72,10,2,0,
        0,180,122,70,10,2,0,
        0,180,124,68,8,2,0,
        0,180,126,66,6,0,
        0,180,128,64,4,0,
        // lat -52..-57
        0,180,130,62,2,0,
        0,180,132,60,2,0,
        0,180,134,58,0,
        0,180,136,44,0,
        0,180,138,22,0,
        0,180,140,4,0,
        // lat -58..-90 (sub-antarctic, antarctic)
        360,0, 360,0, 360,0, 360,0,
        0,360, 0,360, 0,360, 0,360,
        0,360, 0,360, 0,360, 0,360,
        0,360, 0,360, 0,360, 0,360,
        0,360, 0,360, 0,360, 0,360,
        0,360, 0,360, 0,360, 0,360,
        0,360, 0,360, 0,360, 0,360,
        360,0, 360,0, 360,0, 360,0
    ]; // rle_unused end

    // CORRECTED continent polygons using verified lat/lon coordinates
    // Format: [lat, lon] — lat positive = north, lon positive = east
    var landPolygons = [
        // === NORTH AMERICA ===
        // Western Canada & Alaska
        [[71,-156],[70,-148],[68,-140],[65,-136],[62,-138],[60,-141],[58,-136],
         [56,-130],[54,-130],[52,-128],[50,-125],[48,-124],[46,-124],[44,-124],
         [42,-124],[40,-124],[38,-122],[36,-122],[34,-120],[32,-118],[30,-116],
         [30,-114],[26,-109],[22,-106],[20,-105],[18,-103],[16,-98],[14,-91],
         [15,-88],[16,-86],[18,-86],[20,-87],[22,-86],[24,-83],[26,-82],
         [28,-80],[30,-82],[30,-85],[29,-89],[29,-93],[28,-96],[30,-97],
         [32,-97],[34,-97],[36,-96],[38,-93],[40,-91],[42,-88],[44,-87],
         [46,-85],[44,-80],[43,-76],[42,-72],[44,-67],[46,-64],[47,-60],
         [48,-54],[50,-56],[52,-56],[55,-60],[58,-62],[60,-64],[62,-68],
         [62,-74],[60,-78],[58,-78],[55,-80],[55,-84],[57,-88],[60,-92],
         [62,-92],[65,-96],[67,-102],[68,-108],[70,-116],[71,-126],[72,-140],
         [72,-150],[71,-156]],
        // Baja California
        [[22,-106],[28,-114],[30,-116],[24,-110],[22,-106]],
        // Florida Peninsula  
        [[24,-82],[25,-80],[27,-80],[28,-82],[30,-84],[30,-81],[28,-80],[27,-82],[24,-82]],
        // Greenland
        [[60,-44],[62,-40],[65,-36],[68,-30],[70,-24],[72,-20],[74,-18],[76,-20],
         [78,-24],[80,-28],[82,-34],[83,-42],[82,-52],[80,-58],[78,-66],[76,-68],
         [74,-64],[72,-58],[70,-52],[68,-50],[66,-48],[64,-50],[62,-48],[60,-44]],
        // Cuba
        [[20,-74],[22,-80],[22,-82],[20,-82],[20,-80],[20,-74]],
        
        // === SOUTH AMERICA ===
        [[12,-72],[12,-68],[10,-64],[8,-62],[6,-58],[4,-54],[2,-52],[0,-50],
         [-2,-44],[-4,-38],[-6,-36],[-8,-35],[-10,-37],[-12,-38],[-14,-39],
         [-16,-39],[-18,-39],[-20,-40],[-22,-41],[-24,-46],[-26,-48],
         [-28,-49],[-30,-50],[-32,-52],[-34,-54],[-36,-56],[-38,-58],
         [-40,-62],[-42,-64],[-44,-66],[-46,-68],[-48,-70],[-50,-70],
         [-52,-70],[-54,-68],[-55,-66],[-54,-64],[-52,-68],[-50,-75],
         [-48,-76],[-46,-75],[-44,-74],[-42,-73],[-40,-72],[-38,-72],
         [-36,-71],[-34,-71],[-32,-71],[-30,-71],[-28,-71],[-26,-70],
         [-22,-70],[-20,-70],[-18,-70],[-16,-75],[-14,-76],[-12,-77],
         [-8,-79],[-4,-80],[-2,-80],[0,-78],[2,-78],[4,-77],[6,-77],
         [8,-77],[10,-75],[12,-72]],

        // === EUROPE ===
        // Iberian Peninsula
        [[36,-8],[36,-6],[37,-1],[38,0],[40,0],[42,2],[43,4],[44,8],
         [46,6],[47,2],[48,-2],[49,-4],[50,-6],[51,-4],[52,-4],[52,-2],
         [51,0],[50,2],[50,4],[50,8],[52,10],[54,12],[56,10],[57,8],
         [58,6],[61,6],[62,6],[63,8],[64,10],[65,12],[66,14],[68,14],
         [69,16],[70,18],[71,22],[70,26],[70,30],[68,28],[66,26],
         [62,28],[60,28],[58,24],[56,22],[54,18],[54,14],[52,14],
         [50,14],[48,16],[46,16],[46,20],[44,24],[44,28],[42,28],
         [42,30],[40,26],[38,22],[38,18],[40,18],[42,14],[42,12],
         [40,10],[40,6],[38,2],[38,0],[36,2],[36,-2],[36,-6],[36,-8]],
        // UK Great Britain
        [[50,-6],[50,-2],[51,0],[52,0],[53,-2],[54,-2],[55,-4],[56,-4],
         [57,-4],[58,-4],[58,-2],[57,0],[56,0],[55,0],[54,0],[53,0],
         [52,-2],[51,-2],[50,-4],[50,-6]],
        // Ireland
        [[52,-10],[52,-8],[54,-8],[54,-10],[52,-10]],
        // Iceland
        [[64,-24],[64,-22],[65,-18],[66,-14],[65,-12],[63,-14],
         [63,-18],[63,-22],[64,-24]],
        
        // === AFRICA ===
        [[36,-6],[36,2],[36,8],[35,10],[33,12],[32,22],[32,28],
         [31,32],[30,34],[28,36],[26,38],[24,38],[22,38],[20,38],
         [18,40],[16,42],[14,42],[12,44],[10,44],[8,44],[5,42],
         [2,40],[0,42],[-2,42],[-4,40],[-6,40],[-8,40],[-10,40],
         [-12,40],[-14,38],[-16,36],[-18,36],[-20,35],[-22,34],
         [-24,34],[-26,32],[-28,32],[-30,30],[-32,28],[-34,26],
         [-34,20],[-32,18],[-30,16],[-28,16],[-24,14],[-20,14],
         [-16,12],[-12,14],[-8,14],[-5,12],[-2,10],[0,10],[2,8],
         [4,6],[5,2],[5,0],[4,-2],[4,-6],[5,-8],[8,-10],[10,-14],
         [12,-16],[14,-18],[16,-18],[18,-18],[20,-18],[24,-16],
         [28,-14],[30,-10],[32,-8],[33,-5],[34,-4],[36,-6]],
        // Madagascar
        [[-12,48],[-14,50],[-16,50],[-18,49],[-20,46],[-22,44],
         [-24,44],[-24,46],[-22,48],[-18,50],[-14,50],[-12,48]],

        // === MIDDLE EAST ===
        // Arabian Peninsula
        [[29,35],[26,36],[24,38],[22,40],[20,42],[18,44],[16,46],
         [15,48],[14,48],[15,52],[16,54],[18,56],[20,58],[22,59],
         [24,58],[26,56],[27,50],[28,48],[30,48],[32,38],[29,35]],
        // Turkey + Caucasus
        [[36,26],[38,26],[40,26],[42,28],[42,32],[40,36],[38,44],
         [38,48],[40,48],[42,46],[42,42],[40,40],[40,38],[38,38],
         [36,38],[36,32],[36,28],[36,26]],

        // === ASIA ===
        // Indian Subcontinent
        [[30,70],[28,72],[26,70],[24,70],[22,70],[20,72],[18,76],
         [16,78],[14,78],[12,80],[10,80],[8,78],[8,76],[10,76],
         [8,78],[8,80],[10,80],[12,80],[14,80],[16,82],[18,84],
         [20,86],[22,88],[24,90],[26,90],[28,88],[30,82],[32,78],
         [34,74],[35,72],[30,70]],
        // Sri Lanka
        [[8,80],[6,80],[6,82],[8,82],[8,80]],
        // China + Mongolia + Korea
        [[22,100],[24,100],[26,100],[28,98],[30,96],[32,94],[34,96],
         [36,100],[38,96],[40,94],[42,94],[44,96],[46,98],[48,102],
         [50,104],[52,108],[52,112],[50,120],[48,128],[46,132],
         [44,132],[42,130],[40,128],[38,126],[36,122],[34,120],
         [32,122],[30,122],[28,122],[26,120],[24,118],[22,114],
         [20,110],[22,108],[22,106],[24,108],[26,110],[28,112],
         [30,112],[32,110],[34,108],[36,108],[38,106],[40,104],
         [42,104],[44,106],[46,108],[48,108],[50,110],[52,110],
         [54,116],[55,122],[55,128],[52,132],[50,136],[48,140],
         [46,136],[44,134],[42,132],[40,128],[38,126],[36,122],
         [34,118],[32,120],[30,120],[28,118],[26,118],[24,118],
         [22,114],[20,110],[18,104],[20,100],[22,100]],
        // Russia West (European Russia + Ural)
        [[50,32],[52,36],[54,38],[56,40],[58,42],[60,50],[60,56],
         [58,60],[56,60],[55,60],[55,68],[57,68],[58,72],[60,72],
         [62,68],[64,66],[66,62],[68,60],[70,58],[72,54],[73,52],
         [72,50],[70,48],[68,46],[66,42],[64,40],[62,36],[60,32],
         [58,30],[56,28],[54,28],[52,28],[50,30],[50,32]],
        // Russia Siberia
        [[55,60],[56,62],[58,64],[60,68],[60,74],[60,80],[60,86],
         [60,90],[60,96],[60,100],[62,104],[64,108],[65,112],
         [66,116],[67,120],[67,126],[68,130],[68,136],[67,140],
         [67,144],[66,148],[65,152],[64,156],[64,160],[64,164],
         [64,168],[63,170],[62,172],[60,170],[58,168],[56,166],
         [55,160],[55,152],[55,144],[55,138],[55,130],[55,122],
         [55,114],[55,108],[55,102],[55,92],[55,84],[55,78],
         [55,72],[55,66],[55,60]],
        // Russia Far North
        [[68,136],[69,140],[70,144],[70,148],[69,152],[68,156],
         [68,160],[68,164],[68,168],[70,170],[72,172],[74,168],
         [76,160],[78,152],[78,140],[76,128],[74,118],[72,110],
         [70,104],[70,98],[72,92],[74,88],[76,80],[76,72],
         [74,62],[72,54],[70,50],[70,44],[68,42],[68,48],
         [66,52],[66,58],[68,62],[70,66],[70,72],[70,80],
         [70,86],[70,94],[70,100],[70,108],[70,116],[70,122],
         [69,128],[68,132],[68,136]],
        // Japan (Honshu main)
        [[31,130],[32,130],[33,131],[34,132],[35,133],[36,136],
         [37,137],[38,140],[39,140],[40,141],[41,141],[42,143],
         [43,144],[44,144],[44,142],[43,141],[41,140],[39,140],
         [37,136],[35,132],[33,130],[31,130]],
        // Japan Hokkaido
        [[42,140],[43,140],[44,142],[45,142],[44,140],[43,140],[42,140]],
        // Korean Peninsula
        [[34,126],[35,126],[36,128],[37,130],[38,128],[40,128],
         [38,126],[36,126],[34,126]],
        // Southeast Asia (Thailand, Vietnam, Cambodia, Myanmar)
        [[20,98],[22,98],[24,98],[26,98],[28,97],[26,100],[24,102],
         [22,102],[20,102],[18,104],[16,108],[14,108],[12,108],
         [10,106],[9,106],[10,104],[12,102],[14,100],[16,100],
         [18,100],[20,100],[22,102],[20,102],[18,102],[18,100],
         [20,98]],
        // Malay Peninsula + Singapore
        [[8,98],[6,100],[4,102],[2,102],[1,104],[2,104],[4,102],
         [6,100],[8,100],[8,98]],
        // Indonesia Sumatra
        [[5,96],[4,96],[2,96],[0,98],[-2,100],[-3,104],[-4,104],
         [-4,106],[-5,106],[-6,106],[-5,104],[-4,102],[-2,102],
         [0,100],[2,100],[4,96],[5,96]],
        // Indonesia Java
        [[-6,106],[-6,108],[-7,110],[-7,112],[-8,114],[-8,114],
         [-7,112],[-6,110],[-6,108],[-6,106]],
        // Borneo (Kalimantan)
        [[7,116],[6,116],[4,118],[2,118],[0,118],[-2,116],[-3,116],
         [-4,114],[-3,112],[-2,110],[0,110],[2,112],[4,114],
         [6,114],[7,116]],
        // Philippines (Luzon)
        [[18,120],[16,120],[14,120],[13,122],[12,124],[10,124],
         [10,122],[12,120],[14,118],[16,120],[18,120]],
        // Philippines (Mindanao)
        [[8,124],[7,124],[6,124],[6,122],[7,122],[8,124]],
        // Papua New Guinea + Indonesia Irian
        [[-2,132],[-2,136],[-4,138],[-6,142],[-6,146],[-8,146],
         [-8,142],[-6,140],[-4,136],[-2,134],[-2,132]],
        // Australia
        [[-15,130],[-14,132],[-13,136],[-14,138],[-16,140],
         [-17,144],[-18,146],[-20,149],[-22,150],[-24,152],
         [-26,154],[-28,154],[-30,154],[-32,152],[-33,152],
         [-35,150],[-36,150],[-38,148],[-38,146],[-37,142],
         [-36,140],[-36,138],[-35,136],[-34,136],[-33,134],
         [-32,132],[-32,128],[-33,124],[-34,120],[-34,118],
         [-33,116],[-32,116],[-30,116],[-28,114],[-26,114],
         [-24,114],[-22,114],[-20,118],[-18,122],[-16,128],
         [-14,130],[-15,130]],
        // New Zealand North Island
        [[-37,174],[-38,176],[-40,176],[-41,174],[-40,172],[-38,174],[-37,174]],
        // New Zealand South Island
        [[-42,172],[-43,172],[-44,170],[-46,168],[-46,166],[-44,168],[-42,172]],
        // Taiwan
        [[25,122],[24,122],[23,120],[22,120],[23,122],[24,122],[25,122]]
    ];

    // Ray-casting point-in-polygon
    function pointInPoly(lat, lon, poly) {
        var inside = false;
        for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
            var yi = poly[i][0], xi = poly[i][1];
            var yj = poly[j][0], xj = poly[j][1];
            if (((yi > lat) !== (yj > lat)) && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
                inside = !inside;
            }
        }
        return inside;
    }

    // Bounding boxes for fast pre-rejection
    var polyBounds = landPolygons.map(function(poly) {
        var minLat=90, maxLat=-90, minLon=180, maxLon=-180;
        for (var k=0;k<poly.length;k++) {
            var lt=poly[k][0], ln=poly[k][1];
            // fix typos in polygon data (space in number)
            if (isNaN(lt)) continue;
            if (lt < minLat) minLat=lt; if (lt > maxLat) maxLat=lt;
            if (ln < minLon) minLon=ln; if (ln > maxLon) maxLon=ln;
        }
        return {minLat:minLat-0.5, maxLat:maxLat+0.5, minLon:minLon-0.5, maxLon:maxLon+0.5};
    });

    function isLand(lat, lon) {
        for (var i = 0; i < landPolygons.length; i++) {
            var b = polyBounds[i];
            if (lat < b.minLat || lat > b.maxLat || lon < b.minLon || lon > b.maxLon) continue;
            if (pointInPoly(lat, lon, landPolygons[i])) return true;
        }
        return false;
    }

    // Create dots for continents - dense grid for clear shapes
    var dotPositions = [];
    var dotColors = [];
    var step = 1.6;
    var purpleColor = new THREE.Color(0x9b20d1);
    var lightPurple = new THREE.Color(0xcc55ff);
    var brightPurple = new THREE.Color(0xb840f0);
    var whiteColor = new THREE.Color(0xffffff);

    for (var dlat = -60; dlat <= 80; dlat += step) {
        for (var dlon = -175; dlon <= 178; dlon += step) {
            if (isLand(dlat, dlon)) {
                var latR = dlat * Math.PI / 180;
                var lonR = dlon * Math.PI / 180;
                var x = globeRadius * 1.005 * Math.cos(latR) * Math.cos(lonR);
                var y = globeRadius * 1.005 * Math.sin(latR);
                var z = globeRadius * 1.005 * Math.cos(latR) * Math.sin(lonR);
                dotPositions.push(x, y, z);
                var t = Math.random();
                var c = t < 0.25 ? lightPurple : t < 0.55 ? brightPurple : t < 0.85 ? purpleColor : whiteColor.clone().multiplyScalar(0.8);
                dotColors.push(c.r, c.g, c.b);
            }
        }
    }

    var dotsGeometry = new THREE.BufferGeometry();
    dotsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(dotPositions, 3));
    dotsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(dotColors, 3));
    var dotsMaterial = new THREE.PointsMaterial({
        size: 0.028,
        vertexColors: true,
        transparent: true,
        opacity: 0.92,
        sizeAttenuation: true
    });
    var continentDots = new THREE.Points(dotsGeometry, dotsMaterial);
    globeGroup.add(continentDots);

    // City markers - major cities
    var cities = [
        { lat: -23.55, lon: -46.63, name: 'Sao Paulo' },
        { lat: 40.71, lon: -74.01, name: 'New York' },
        { lat: 51.51, lon: -0.13, name: 'London' },
        { lat: 35.68, lon: 139.69, name: 'Tokyo' },
        { lat: 48.86, lon: 2.35, name: 'Paris' },
        { lat: -33.87, lon: 151.21, name: 'Sydney' },
        { lat: 55.76, lon: 37.62, name: 'Moscow' },
        { lat: 1.35, lon: 103.82, name: 'Singapore' },
        { lat: 19.43, lon: -99.13, name: 'Mexico City' },
        { lat: -22.91, lon: -43.17, name: 'Rio de Janeiro' },
        { lat: 37.77, lon: -122.42, name: 'San Francisco' },
        { lat: 25.20, lon: 55.27, name: 'Dubai' },
        { lat: 39.90, lon: 116.40, name: 'Beijing' },
        { lat: -34.60, lon: -58.38, name: 'Buenos Aires' }
    ];

    cities.forEach(function(city) {
        var latR = city.lat * Math.PI / 180;
        var lonR = city.lon * Math.PI / 180;
        var x = globeRadius * 1.01 * Math.cos(latR) * Math.cos(lonR);
        var y = globeRadius * 1.01 * Math.sin(latR);
        var z = globeRadius * 1.01 * Math.cos(latR) * Math.sin(lonR);

        // City dot
        var dotGeo = new THREE.SphereGeometry(0.012, 8, 8);
        var dotMat = new THREE.MeshBasicMaterial({ color: 0xcc44ff });
        var dot = new THREE.Mesh(dotGeo, dotMat);
        dot.position.set(x, y, z);
        globeGroup.add(dot);

        // Pulse ring
        var ringGeo = new THREE.RingGeometry(0.015, 0.025, 16);
        var ringMat = new THREE.MeshBasicMaterial({ color: 0x8f00cc, transparent: true, opacity: 0.4, side: THREE.DoubleSide });
        var ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(x, y, z);
        ring.lookAt(0, 0, 0);
        ring.userData.pulse = true;
        ring.userData.time = Math.random() * Math.PI * 2;
        globeGroup.add(ring);
    });

    // Background particles
    var particleCount = 800;
    var pPositions = new Float32Array(particleCount * 3);
    var pSizes = new Float32Array(particleCount);
    for (var p = 0; p < particleCount; p++) {
        pPositions[p * 3] = (Math.random() - 0.5) * 10;
        pPositions[p * 3 + 1] = (Math.random() - 0.5) * 10;
        pPositions[p * 3 + 2] = (Math.random() - 0.5) * 10 - 3;
        pSizes[p] = Math.random() * 2 + 0.5;
    }
    var particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.Float32BufferAttribute(pPositions, 3));
    particleGeometry.setAttribute('size', new THREE.Float32BufferAttribute(pSizes, 1));
    var particleMaterial = new THREE.PointsMaterial({
        color: 0x8f00cc,
        size: 0.015,
        transparent: true,
        opacity: 0.3,
        sizeAttenuation: true
    });
    scene.add(new THREE.Points(particleGeometry, particleMaterial));

    // Interaction - drag to rotate
    var isDragging = false;
    var previousMouse = { x: 0, y: 0 };
    var rotationSpeed = { x: 0, y: 0 };
    var autoRotateSpeed = 0.002;

    container.addEventListener('mousedown', function(e) { isDragging = true; previousMouse = { x: e.clientX, y: e.clientY }; });
    container.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        rotationSpeed.y = (e.clientX - previousMouse.x) * 0.005;
        rotationSpeed.x = (e.clientY - previousMouse.y) * 0.005;
        previousMouse = { x: e.clientX, y: e.clientY };
    });
    container.addEventListener('mouseup', function() { isDragging = false; });
    container.addEventListener('mouseleave', function() { isDragging = false; });

    // Touch
    container.addEventListener('touchstart', function(e) { if (e.touches.length === 1) { isDragging = true; previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY }; } }, { passive: true });
    container.addEventListener('touchmove', function(e) {
        if (!isDragging || e.touches.length !== 1) return;
        rotationSpeed.y = (e.touches[0].clientX - previousMouse.x) * 0.005;
        rotationSpeed.x = (e.touches[0].clientY - previousMouse.y) * 0.005;
        previousMouse = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }, { passive: true });
    container.addEventListener('touchend', function() { isDragging = false; }, { passive: true });

    // Animation loop
    var clock = new THREE.Clock();
    function animate() {
        requestAnimationFrame(animate);
        var dt = clock.getDelta();
        var time = clock.getElapsedTime();

        if (!isDragging) {
            globeGroup.rotation.y += autoRotateSpeed;
            rotationSpeed.x *= 0.92;
            rotationSpeed.y *= 0.92;
        }
        globeGroup.rotation.y += rotationSpeed.y;
        globeGroup.rotation.x += rotationSpeed.x;
        globeGroup.rotation.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, globeGroup.rotation.x));

        // Pulse city rings
        globeGroup.children.forEach(function(child) {
            if (child.userData && child.userData.pulse) {
                child.userData.time += dt * 2;
                var s = 1 + Math.sin(child.userData.time) * 0.4;
                child.scale.set(s, s, s);
                child.material.opacity = 0.2 + Math.sin(child.userData.time) * 0.2;
            }
        });

        renderer.render(scene, camera);
    }
    animate();

    // Resize handler
    var resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }, 150);
    });
})();
