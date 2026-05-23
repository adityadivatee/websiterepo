import * as THREE from 'three';

// ==========================================
// THE AI NAVIGATION LAYER
// ==========================================
// These are safe coordinates the bots will use to navigate the map without hitting walls.
export const AI_WAYPOINTS = [
    {x: 0, z: 40}, {x: -12, z: 40}, {x: 12, z: 40}, // Red Base
    {x: 0, z: -40}, {x: -12, z: -40}, {x: 12, z: -40}, // Blue Base
    {x: 0, z: 20}, {x: 0, z: -20}, {x: -20, z: 0}, {x: 20, z: 0}, // Mid Lanes
    {x: 0, z: 0}, // Temple Center
    {x: -35, z: 0}, {x: -35, z: 12}, {x: -35, z: -12}, {x: -25, z: 0}, // House Area
    {x: 35, z: 0}, {x: 40, z: 15}, {x: 32, z: -15}, {x: 25, z: 0} // Container Area
];

export function createTDMMap() {
    const mapGroup = new THREE.Group();
    const colliders = []; 

    const registerSolid = (mesh, group) => {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.isSolid = true; 
        group.add(mesh);
        colliders.push(mesh); 
    };

    // 1. DUST-STYLE MATERIALS
    const groundMat = new THREE.MeshStandardMaterial({ color: 0xd2b48c, roughness: 1.0 }); 
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xc2a57c, roughness: 0.9 }); 
    const blockMat = new THREE.MeshStandardMaterial({ color: 0xa88f6a, roughness: 0.8 }); 
    const houseMat = new THREE.MeshStandardMaterial({ color: 0xddccbb, roughness: 1.0 }); 
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7, metalness: 0.2 }); 
    const containerRed = new THREE.MeshStandardMaterial({ color: 0x8b3a3a, roughness: 0.6, metalness: 0.3 }); 
    const containerBlue = new THREE.MeshStandardMaterial({ color: 0x4682b4, roughness: 0.6, metalness: 0.3 }); 
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x6b4423, roughness: 0.9 }); 

    // 2. THE GROUND & SKY DOME
    const ground = new THREE.Mesh(new THREE.BoxGeometry(100, 1, 100), groundMat);
    ground.position.y = -0.5;
    ground.receiveShadow = true;
    ground.userData.isFloor = true; 
    mapGroup.add(ground);

    const skyGeo = new THREE.SphereGeometry(120, 32, 32);
    const skyMat = new THREE.MeshBasicMaterial({ color: 0x87CEEB, side: THREE.BackSide }); 
    const skyDome = new THREE.Mesh(skyGeo, skyMat);
    mapGroup.add(skyDome);

    // 3. OUTER BOUNDARIES
    const createWall = (x, z, w, d) => {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, 16, d), wallMat); 
        wall.position.set(x, 8, z);
        registerSolid(wall, mapGroup);
    };
    createWall(0, 50, 100, 1);  createWall(0, -50, 100, 1);
    createWall(50, 0, 1, 100);  createWall(-50, 0, 1, 100);

    // 4. PROTECTED SPAWN BASES
    const createGatedWall = (x, zBase, zDir) => {
        const gateGroup = new THREE.Group();
        const p1 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 3), blockMat);
        p1.position.set(x, 4, zBase + (1.5 * zDir)); 
        const p2 = new THREE.Mesh(new THREE.BoxGeometry(2, 8, 3), blockMat);
        p2.position.set(x, 4, zBase + (8.5 * zDir)); 
        const beam = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), blockMat);
        beam.position.set(x, 7, zBase + (5 * zDir)); 
        [p1, p2, beam].forEach(m => registerSolid(m, gateGroup));
        mapGroup.add(gateGroup);
    };

    const t1SpawnFront = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 2), blockMat); 
    t1SpawnFront.position.set(0, 4, 40);
    registerSolid(t1SpawnFront, mapGroup);
    createGatedWall(-9, 40, 1); createGatedWall(9, 40, 1);  

    const t2SpawnFront = new THREE.Mesh(new THREE.BoxGeometry(20, 8, 2), blockMat); 
    t2SpawnFront.position.set(0, 4, -40);
    registerSolid(t2SpawnFront, mapGroup);
    createGatedWall(-9, -40, -1); createGatedWall(9, -40, -1);  

    // 5. STRUCTURAL DIVIDERS
    const createDivider = (x, z, w, d) => {
        const blocker = new THREE.Mesh(new THREE.BoxGeometry(w, 10, d), blockMat);
        blocker.position.set(x, 5, z);
        registerSolid(blocker, mapGroup);
    };
    createDivider(-20, 15, 4, 25); createDivider(-20, -15, 4, 25);
    createDivider(20, 15, 4, 25);  createDivider(20, -15, 4, 25);

    // 6. MID: THE TEMPLE 
    const templeGroup = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 16), stoneMat); base.position.y = 1;
    const step1 = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 2), stoneMat); step1.position.set(0, 0.5, 9);
    const step2 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2), stoneMat); step2.position.set(0, 1, 7);
    const step3 = new THREE.Mesh(new THREE.BoxGeometry(6, 1, 2), stoneMat); step3.position.set(0, 0.5, -9); 
    const step4 = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 2), stoneMat); step4.position.set(0, 1, -7);
    [base, step1, step2, step3, step4].forEach(m => registerSolid(m, templeGroup));

    const tRoof = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 14), stoneMat);
    tRoof.position.y = 13; 
    registerSolid(tRoof, templeGroup);
    
    const pillarGeo = new THREE.BoxGeometry(2, 12, 2); 
    [[5,7,5], [-5,7,5], [5,7,-5], [-5,7,-5]].forEach(p => { 
        const pillar = new THREE.Mesh(pillarGeo, stoneMat);
        pillar.position.set(p[0], p[1], p[2]); 
        registerSolid(pillar, templeGroup);
    });
    mapGroup.add(templeGroup); 

    // 7. SITE A: THE HOUSE 
    const house = new THREE.Group();
    const hWallL = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 14), houseMat); hWallL.position.set(-6, 3, 0);
    const hWallR = new THREE.Mesh(new THREE.BoxGeometry(1, 6, 14), houseMat); hWallR.position.set(6, 3, 0);
    const hWallB = new THREE.Mesh(new THREE.BoxGeometry(12, 6, 1), houseMat); hWallB.position.set(0, 3, -6.5);
    const hRoof = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 16), houseMat); hRoof.position.set(0, 6.5, 0);
    const balconyWall = new THREE.Mesh(new THREE.BoxGeometry(14, 3, 1), houseMat); balconyWall.position.set(0, 8.5, 7.5);
    const houseRamp = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 1), woodMat); 
    houseRamp.position.set(8, 3, -4); houseRamp.rotation.x = Math.PI / 4; houseRamp.rotation.y = Math.PI / 2;
    [hWallL, hWallR, hWallB, hRoof, balconyWall, houseRamp].forEach(mesh => registerSolid(mesh, house));
    house.position.set(-35, 0, 0);
    mapGroup.add(house);

    // 8. SITE B: CONTAINER MAZE
    const createC = (x, z, col, r=0) => {
        const c = new THREE.Mesh(new THREE.BoxGeometry(4, 4, 10), col);
        c.position.set(x, 2, z); c.rotation.y = r;
        registerSolid(c, mapGroup);
    };
    createC(30, 20, containerRed, 0); createC(40, 15, containerBlue, 0);
    createC(35, 5, containerRed, Math.PI/2); createC(32, -15, containerRed, 0);
    createC(40, -10, containerBlue, 0);

    // 9. STACKED CRATE SCATTER
    const createCrateStack = (x, z) => {
        const crateGeo = new THREE.BoxGeometry(2.5, 2.5, 2.5);
        const c1 = new THREE.Mesh(crateGeo, woodMat); c1.position.set(x, 1.25, z);
        const c2 = new THREE.Mesh(crateGeo, woodMat); c2.position.set(x+2.6, 1.25, z+0.5);
        const c3 = new THREE.Mesh(crateGeo, woodMat); c3.position.set(x+1.3, 3.75, z+0.25); 
        [c1, c2, c3].forEach(c => { c.rotation.y = Math.random(); registerSolid(c, mapGroup); });
    };
    createCrateStack(-10, 20); createCrateStack(10, -20); createCrateStack(-25, -25); 

    // 10. LIGHTING
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.4); 
    mapGroup.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(40, 80, 30); dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048; dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.left = -60; dirLight.shadow.camera.right = 60;
    dirLight.shadow.camera.top = 60; dirLight.shadow.camera.bottom = -60;
    dirLight.shadow.bias = -0.001; 
    mapGroup.add(dirLight);

    mapGroup.userData.colliders = colliders;

    return mapGroup;
}