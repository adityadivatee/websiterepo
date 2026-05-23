import * as THREE from 'three';

export function createZombieMap(scene) {
    const mapGroup = new THREE.Group();
    const colliders = [];

    // --- 1. CINEMATIC ATMOSPHERE ---
    const fogColor = new THREE.Color(0x081116); 
    scene.fog = new THREE.FogExp2(fogColor, 0.015);
    scene.background = fogColor;

    // --- 2. THE GROUND (THE FIX: Made it a thick box!) ---
    const groundMat = new THREE.MeshStandardMaterial({ color: 0x1a241c, roughness: 0.9, metalness: 0.05 }); 
    // Changed from PlaneGeometry to a thick BoxGeometry so the physics engine can see it!
    const ground = new THREE.Mesh(new THREE.BoxGeometry(300, 2, 300), groundMat);
    ground.position.y = -1; // Pushes the bottom down so the surface is perfectly at Y = 0
    ground.receiveShadow = true;
    mapGroup.add(ground);
    colliders.push(ground);

    // --- 3. BORDER WALLS ---
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x0d1214, roughness: 1.0 });
    const wallGeo = new THREE.BoxGeometry(300, 40, 5); 
    const walls = [
        { x: 0, z: -150, rot: 0 }, { x: 0, z: 150, rot: 0 },
        { x: -150, z: 0, rot: Math.PI / 2 }, { x: 150, z: 0, rot: Math.PI / 2 }
    ];
    walls.forEach(w => {
        const wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(w.x, 20, w.z); wall.rotation.y = w.rot;
        wall.castShadow = true; wall.receiveShadow = true;
        mapGroup.add(wall); colliders.push(wall);
    });

    // --- 4. THE WIGGLY ZIG-ZAG RIVER ---
    const riverMat = new THREE.MeshStandardMaterial({ color: 0x091c1c, transparent: true, opacity: 0.85, roughness: 0.1 });
    const riverGroup = new THREE.Group();
    
    for (let x = -160; x <= 160; x += 15) {
        const rSeg = new THREE.Mesh(new THREE.PlaneGeometry(18, 30), riverMat);
        rSeg.rotation.x = -Math.PI / 2;
        const zWave = Math.sin(x * 0.04) * 20; 
        rSeg.position.set(x, 0.1, 55 + zWave);
        rSeg.rotation.z = Math.cos(x * 0.04) * 0.4; 
        riverGroup.add(rSeg);
    }
    mapGroup.add(riverGroup);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x3d2817, roughness: 1.0 });
    const bridgeMain = new THREE.Mesh(new THREE.BoxGeometry(14, 1, 35), woodMat);
    bridgeMain.position.set(0, 0.6, 55);
    bridgeMain.castShadow = true; bridgeMain.receiveShadow = true;
    mapGroup.add(bridgeMain); colliders.push(bridgeMain);
    
    for(let i=0; i<4; i++) {
        const plank = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 2), woodMat);
        plank.position.set(-2 + (Math.random()*4), 0.5, 35 + (i*9));
        plank.rotation.y = (Math.random() - 0.5) * 0.5; plank.rotation.z = (Math.random() - 0.5) * 0.2;
        plank.castShadow = true; plank.receiveShadow = true;
        mapGroup.add(plank);
    }

    // --- 5. CRASHED HELICOPTER ---
    const heliGroup = new THREE.Group();
    const hMetal = new THREE.MeshStandardMaterial({ color: 0x2a3028, roughness: 0.6 });
    const hBody = new THREE.Mesh(new THREE.BoxGeometry(6, 6, 14), hMetal); hBody.position.set(0, 3, 0);
    const hTail = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2.0, 12), hMetal); hTail.position.set(0, 4, -12); hTail.rotation.x = -0.15;
    const hRotor = new THREE.Mesh(new THREE.BoxGeometry(22, 0.3, 2), new THREE.MeshStandardMaterial({color:0x111111}));
    hRotor.position.set(0, 6.5, 0); hRotor.rotation.z = 0.4; 
    
    heliGroup.add(hBody, hTail, hRotor);
    heliGroup.position.set(-60, 0, 40); 
    heliGroup.rotation.y = Math.PI / 3; heliGroup.rotation.z = 0.2; 
    heliGroup.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; colliders.push(c); }});
    mapGroup.add(heliGroup);

    // --- 6. SHIPPING CONTAINERS ---
    const contMatRed = new THREE.MeshStandardMaterial({ color: 0x882222, roughness: 0.8 });
    const contMatBlue = new THREE.MeshStandardMaterial({ color: 0x224488, roughness: 0.8 });
    const contGeo = new THREE.BoxGeometry(6, 6, 16);
    
    const cont1 = new THREE.Mesh(contGeo, contMatRed); cont1.position.set(45, 3, 10); cont1.rotation.y = 0.4;
    const cont2 = new THREE.Mesh(contGeo, contMatBlue); cont2.position.set(48, 3, -5); cont2.rotation.y = -0.1;
    const cont3 = new THREE.Mesh(contGeo, contMatRed); cont3.position.set(46, 9, 2); cont3.rotation.y = 0.1; 
    
    [cont1, cont2, cont3].forEach(c => { c.castShadow = true; c.receiveShadow = true; mapGroup.add(c); colliders.push(c); });

    // --- 7. WATCHTOWER ---
    const towerGroup = new THREE.Group();
    const legGeo = new THREE.CylinderGeometry(0.3, 0.3, 15);
    const l1 = new THREE.Mesh(legGeo, woodMat); l1.position.set(-3, 7.5, -3);
    const l2 = new THREE.Mesh(legGeo, woodMat); l2.position.set(3, 7.5, -3);
    const l3 = new THREE.Mesh(legGeo, woodMat); l3.position.set(-3, 7.5, 3);
    const l4 = new THREE.Mesh(legGeo, woodMat); l4.position.set(3, 7.5, 3);
    const platform = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 8), woodMat); platform.position.set(0, 15, 0);
    
    towerGroup.add(l1, l2, l3, l4, platform);
    towerGroup.position.set(-25, 0, -15);
    towerGroup.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; colliders.push(c); }});
    mapGroup.add(towerGroup);

    // --- 8. MILITARY BARRICADES & TRUCK ---
    const barricadeMat = new THREE.MeshStandardMaterial({ color: 0x6b5e4f, roughness: 1.0 });
    const barricadeGeo = new THREE.BoxGeometry(8, 2.5, 2);
    const barricadePositions = [
        { x: 15, z: -15, rot: -Math.PI / 4 }, { x: 8, z: -10, rot: -Math.PI / 6 },
        { x: 0, z: -8, rot: 0 }, { x: -8, z: -10, rot: Math.PI / 6 }
    ];
    barricadePositions.forEach(pos => {
        const wall = new THREE.Mesh(barricadeGeo, barricadeMat);
        wall.position.set(pos.x, 1.25, pos.z); wall.rotation.y = pos.rot;
        wall.castShadow = true; wall.receiveShadow = true;
        mapGroup.add(wall); colliders.push(wall);
    });

    const truckGroup = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x223322, roughness: 0.7 });
    const tireMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9 });
    const bed = new THREE.Mesh(new THREE.BoxGeometry(6, 2, 10), metalMat); bed.position.set(0, 2, -2);
    const cab = new THREE.Mesh(new THREE.BoxGeometry(6, 4, 4), metalMat); cab.position.set(0, 3, 5);
    const tireGeo = new THREE.CylinderGeometry(1.5, 1.5, 7, 8);
    const frontTires = new THREE.Mesh(tireGeo, tireMat); frontTires.rotation.z = Math.PI/2; frontTires.position.set(0, 1.5, 5);
    const backTires = new THREE.Mesh(tireGeo, tireMat); backTires.rotation.z = Math.PI/2; backTires.position.set(0, 1.5, -4);
    truckGroup.add(bed, cab, frontTires, backTires);
    truckGroup.position.set(20, 0, -25); truckGroup.rotation.y = -Math.PI / 5; 
    truckGroup.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; colliders.push(c); }});
    mapGroup.add(truckGroup);

    // --- 9. TENTS, CAMPFIRE, AND BARRELS ---
    const tentMat = new THREE.MeshStandardMaterial({ color: 0x4a5a2a, roughness: 0.9 });
    for(let i = 0; i < 3; i++) {
        const tent = new THREE.Mesh(new THREE.ConeGeometry(4, 6, 4), tentMat);
        tent.position.set(-40 + (i * 10), 3, -50 + (Math.random() * 5)); 
        tent.rotation.y = Math.PI / 4 + (Math.random() * 0.5);
        tent.castShadow = true; tent.receiveShadow = true;
        mapGroup.add(tent); colliders.push(tent);
    }

    const fireLight = new THREE.PointLight(0xff5500, 3.0, 30); fireLight.position.set(-30, 2, -40);
    mapGroup.add(fireLight);

    const barrelMat = new THREE.MeshStandardMaterial({ color: 0x11aa11, roughness: 0.4, emissive: 0x003300 });
    const barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 8);
    [{x: 12, y: 0.9, z: -12}, {x: 13.5, y: 0.9, z: -12.5}, {x: 12.75, y: 2.7, z: -12.25}, {x: -10, y: 0.9, z: -13}].forEach(pos => {
        const barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(pos.x, pos.y, pos.z); barrel.rotation.y = Math.random();
        barrel.castShadow = true; barrel.receiveShadow = true;
        mapGroup.add(barrel); colliders.push(barrel);
    });

    // --- 10. CREEPY GRAVEYARD ---
    const graveMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
    for (let i = 0; i < 8; i++) {
        const tombstone = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.0, 0.3), graveMat);
        tombstone.position.set(-80 + (Math.random() * 30), 1.0, -80 + (Math.random() * 25));
        tombstone.rotation.y = (Math.random() - 0.5) * 0.4; tombstone.rotation.z = (Math.random() - 0.5) * 0.2;
        tombstone.castShadow = true; tombstone.receiveShadow = true;
        mapGroup.add(tombstone); colliders.push(tombstone);
    }

    // --- 11. EMERGENCY FLOODLIGHTS ---
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
    function createFloodLight(x, z, rotY) {
        const lightGroup = new THREE.Group();
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 15), poleMat); pole.position.y = 7.5;
        const lamp = new THREE.Mesh(new THREE.BoxGeometry(1, 0.5, 1), poleMat); lamp.position.set(0, 15, 0.5);
        const spotLight = new THREE.SpotLight(0xffddaa, 4.0, 60, Math.PI / 4, 0.5, 1);
        spotLight.position.set(0, 15, 0.5); spotLight.target.position.set(0, 0, 10);
        spotLight.castShadow = true;
        lightGroup.add(pole, lamp, spotLight, spotLight.target);
        lightGroup.position.set(x, 0, z); lightGroup.rotation.y = rotY;
        mapGroup.add(lightGroup); colliders.push(pole);
    }
    createFloodLight(20, -5, Math.PI / 1.5);
    createFloodLight(-15, -2, -Math.PI / 1.5);

    // --- 12. DEAD SURVIVORS ---
    function createCorpse(x, z, rot) {
        const deadGroup = new THREE.Group();
        const dBody = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 0.4), new THREE.MeshStandardMaterial({ color: 0x334455 }));
        dBody.position.set(0, 0.2, 0); dBody.rotation.x = -Math.PI / 2; dBody.castShadow = true;
        const dHead = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffccaa }));
        dHead.position.set(0, 0.4, 0.9); dHead.rotation.set(-0.2, 0, Math.PI/3); dHead.castShadow = true;
        deadGroup.add(dBody, dHead);
        deadGroup.position.set(x, 0, z); deadGroup.rotation.y = rot;
        mapGroup.add(deadGroup);
    }
    createCorpse(-25, -42, 0); createCorpse(25, -15, Math.PI/4); createCorpse(0, -4, -Math.PI/2);

    // --- 13. SMART DENSE FOREST GENERATION (Trees & Rocks) ---
    const rockGeo = new THREE.DodecahedronGeometry(1.5);
    const rockMat2 = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
    const trunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 6, 6);
    const leavesGeo = new THREE.ConeGeometry(3.5, 10, 6);
    const leavesMat = new THREE.MeshStandardMaterial({ color: 0x0f1f12, roughness: 0.9 });

    function isAreaClear(x, z) {
        if (x > -35 && x < 35 && z > -35 && z < 35) return false;
        const zRiverCurrent = 55 + Math.sin(x * 0.04) * 20;
        if (Math.abs(z - zRiverCurrent) < 18) return false;
        if (x > 35 && x < 60 && z > -15 && z < 15) return false;
        if (x > -75 && x < -45 && z > 25 && z < 55) return false;
        if (x > -90 && x < -50 && z > -90 && z < -50) return false;
        if (x > -35 && x < 35 && z > -35 && z < -5) return false;
        if (x > -55 && x < -15 && z > -60 && z < -30) return false;
        return true; 
    }

    let propsPlaced = 0;
    let attempts = 0;
    
    while (propsPlaced < 150 && attempts < 1000) {
        attempts++;
        const x = (Math.random() - 0.5) * 280;
        const z = (Math.random() - 0.5) * 280;

        if (!isAreaClear(x, z)) continue;

        if (Math.random() > 0.5) {
            const rock = new THREE.Mesh(rockGeo, rockMat2);
            const scale = 0.5 + Math.random() * 2.0;
            rock.scale.set(scale, scale, scale); rock.position.set(x, scale, z);
            rock.rotation.set(Math.random(), Math.random(), Math.random());
            rock.castShadow = true; rock.receiveShadow = true;
            mapGroup.add(rock); colliders.push(rock);
        } else {
            const trunk = new THREE.Mesh(trunkGeo, woodMat);
            trunk.position.set(x, 3, z); trunk.castShadow = true; trunk.receiveShadow = true;
            mapGroup.add(trunk); colliders.push(trunk); 

            if (Math.random() > 0.2) {
                const leaves = new THREE.Mesh(leavesGeo, leavesMat);
                leaves.position.set(x, 9, z); leaves.castShadow = true; leaves.receiveShadow = true;
                mapGroup.add(leaves);
            }
        }
        propsPlaced++;
    }

    // --- 14. LIGHTING ---
    const ambientLight = new THREE.AmbientLight(0x2a3a4a, 0.8); 
    mapGroup.add(ambientLight);
    
    const moonLight = new THREE.DirectionalLight(0x7799bb, 3.0);
    moonLight.position.set(-50, 80, 50);
    moonLight.castShadow = true;
    moonLight.shadow.mapSize.width = 2048; moonLight.shadow.mapSize.height = 2048;
    moonLight.shadow.camera.near = 0.5; moonLight.shadow.camera.far = 300;
    moonLight.shadow.camera.left = -100; moonLight.shadow.camera.right = 100;
    moonLight.shadow.camera.top = 100; moonLight.shadow.camera.bottom = -100;
    mapGroup.add(moonLight);

    mapGroup.userData.colliders = colliders;
    
    return mapGroup;
}