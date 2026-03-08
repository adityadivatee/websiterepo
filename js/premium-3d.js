// Premium Three.js 3D Interactive Models for Aditya Divte Production

function initPremium3D(containerId, type, colorHex) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Clear any previous vanta or canvas
    container.innerHTML = '';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // optimize performance
    container.appendChild(renderer.domElement);

    let geometry;
    // Different premium 3D shapes for different pages
    if (type === 'torus') {
        geometry = new THREE.TorusKnotGeometry(9, 2.5, 150, 20); // Complex, twisting, premium
    } else if (type === 'icosahedron') {
        geometry = new THREE.IcosahedronGeometry(12, 2); // Modern tech globe
    } else if (type === 'ring') {
        geometry = new THREE.TorusGeometry(12, 3, 16, 100); // Sleek ring
    } else if (type === 'cone') {
        geometry = new THREE.ConeGeometry(10, 20, 32); // Sharp 3D cone
    } else if (type === 'sphere') {
        geometry = new THREE.SphereGeometry(12, 32, 32); // Smooth perfect sphere
    } else {
        geometry = new THREE.TorusKnotGeometry(10, 3, 100, 16);
    }

    // Professional wireframe material + glowing particles
    const material = new THREE.MeshBasicMaterial({
        color: colorHex,
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });

    const pointsMaterial = new THREE.PointsMaterial({
        color: colorHex,
        size: 0.15,
        transparent: true,
        opacity: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    const points = new THREE.Points(geometry, pointsMaterial);

    // Group them so we can rotate them together cleanly
    const group = new THREE.Group();
    group.add(mesh);
    group.add(points);
    scene.add(group);

    camera.position.z = 35;

    // Interactive Variables
    let mouseX = 0;
    let mouseY = 0;
    let scrollY = window.scrollY;

    // Mouse Interactive (Smooth tracking)
    document.addEventListener('mousemove', (e) => {
        // Normalize mouse coordinates from -1 to 1
        mouseX = (e.clientX / window.innerWidth) * 2 - 1;
        mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    });

    // Scroll Interactive
    window.addEventListener('scroll', () => {
        scrollY = window.scrollY;
    });

    // Handle Window Resize perfectly
    window.addEventListener('resize', () => {
        if (!container.clientWidth) return;
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    });

    // Animation Loop
    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);
        const elapsedTime = clock.getElapsedTime();

        // 1. Constant Slow Premium Rotation
        group.rotation.y += 0.002;
        group.rotation.x += 0.001;

        // 2. Mouse Interaction (Tilt towards mouse heavily)
        const targetRotationX = mouseY * 0.5;
        const targetRotationY = mouseX * 0.5;
        group.rotation.x += 0.05 * (targetRotationX - group.rotation.x);
        group.rotation.y += 0.05 * (targetRotationY - group.rotation.y);

        // 3. Scroll Interaction (Parallax and spin boost)
        // Move the group slightly up/down based on scroll
        group.position.y = Math.sin(elapsedTime * 0.5) * 1.5 + (scrollY * 0.015);
        // Spin faster based on scroll position
        group.rotation.y += scrollY * 0.00005;
        group.rotation.z = scrollY * 0.001;

        renderer.render(scene, camera);
    }

    animate();
}
