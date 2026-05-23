import * as THREE from 'three';

// ==========================================
// THE FIX: GEOMETRY CACHE (Fixes Spawn Lag!)
// ==========================================
const geoCache = {};

function getBox(w, h, d) {
    const key = `b_${w}_${h}_${d}`;
    if (!geoCache[key]) geoCache[key] = new THREE.BoxGeometry(w, h, d);
    return geoCache[key];
}
function getCyl(rt, rb, h, rs) {
    const key = `c_${rt}_${rb}_${h}_${rs}`;
    if (!geoCache[key]) geoCache[key] = new THREE.CylinderGeometry(rt, rb, h, rs);
    return geoCache[key];
}
function getSph(r, ws, hs) {
    const key = `s_${r}_${ws}_${hs}`;
    if (!geoCache[key]) geoCache[key] = new THREE.SphereGeometry(r, ws, hs);
    return geoCache[key];
}

// --- THE 9 UNIQUE MATERIALS ---
const materials = {
    standard: new THREE.MeshStandardMaterial({ color: 0x3b511a, roughness: 0.9 }),
    sprinter: new THREE.MeshStandardMaterial({ color: 0x881111, roughness: 0.9 }), 
    tank: new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 }),    
    crawler: new THREE.MeshStandardMaterial({ color: 0x442211, roughness: 0.9 }),  
    boomer: new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5, emissive: 0x003300 }), 
    phantom: new THREE.MeshStandardMaterial({ color: 0x050505, transparent: true, opacity: 0.4 }),
    mutant: new THREE.MeshStandardMaterial({ color: 0x4a235a, roughness: 0.8 }), 
    spitter: new THREE.MeshStandardMaterial({ color: 0x7a6b4a, roughness: 1.0 }), 
    tentacleSkin: new THREE.MeshStandardMaterial({ color: 0x003366, roughness: 0.7 }) 
};

const shirtMat = new THREE.MeshStandardMaterial({ color: 0x3b3a36, roughness: 1.0 }); 
const pantsMat = new THREE.MeshStandardMaterial({ color: 0x1f1f24, roughness: 1.0 }); 
const bloodMat = new THREE.MeshStandardMaterial({ color: 0x440000, roughness: 0.7 });
const eyeMat = new THREE.MeshBasicMaterial({ color: 0xff0000 }); 
const mouthMat = new THREE.MeshBasicMaterial({ color: 0x000000 }); 

export function createZombie(type = 0) {
    const group = new THREE.Group();
    const innerGroup = new THREE.Group(); 
    group.add(innerGroup);

    let skinMat = materials.standard;
    if (type === 1) skinMat = materials.sprinter;
    if (type === 2) skinMat = materials.tank;
    if (type === 3) skinMat = materials.crawler;
    if (type === 4) skinMat = materials.boomer;
    if (type === 5) skinMat = materials.phantom;
    if (type === 6) skinMat = materials.mutant;
    if (type === 7) skinMat = materials.spitter;
    if (type === 8) skinMat = materials.tentacleSkin;

    // ==========================================
    // 1. CREEPY HEAD(S)
    // ==========================================
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.6, 0);
    headGroup.rotation.z = (Math.random() - 0.5) * 0.4;
    headGroup.rotation.x = (Math.random() - 0.5) * 0.2;
    headGroup.userData.basePos = headGroup.position.clone(); 

    const addHead = (x, y, z, scale, rotZ, rotX) => {
        const h = new THREE.Mesh(getBox(0.8, 0.8, 0.8), skinMat);
        h.position.set(x, y, z);
        h.rotation.set(rotX, 0, rotZ);
        h.scale.set(scale, scale, scale); // Scale the shared geometry!
        h.name = "BotHead"; 
        
        if (Math.random() > 0.2) {
            const leftEye = new THREE.Mesh(getBox(0.15, 0.1, 0.05), eyeMat);
            leftEye.position.set(-0.2, 0.1, 0.41); leftEye.name = "BotHead"; h.add(leftEye);
        }
        if (Math.random() > 0.2) {
            const rightEye = new THREE.Mesh(getBox(0.15, 0.1, 0.05), eyeMat);
            rightEye.position.set(0.2, 0.1, 0.41); rightEye.name = "BotHead"; h.add(rightEye);
        }

        const mouth = new THREE.Mesh(getBox(0.4, 0.15, 0.05), mouthMat);
        mouth.position.set(0, -0.2, 0.41); mouth.rotation.z = (Math.random() - 0.5) * 0.3; 
        mouth.name = "BotHead"; h.add(mouth);
        
        headGroup.add(h);
        return h;
    };

    const heads = [];
    if (type === 7) {
        heads.push(addHead(0, 0, 0, 1.1, 0.2, 0.1)); 
        heads.push(addHead(-0.5, -0.2, 0.1, 0.8, -0.5, -0.2)); 
        heads.push(addHead(0.4, -0.3, -0.1, 0.9, 0.6, 0.2));  
    } else {
        heads.push(addHead(0, 0, 0, 1.0, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.2));
    }
    
    innerGroup.add(headGroup);

    // ==========================================
    // 2. DEFORMED BODY & INFECTION LUMPS
    // ==========================================
    const bodyGroup = new THREE.Group();
    bodyGroup.position.set(0, 0.6, 0);
    bodyGroup.userData.basePos = bodyGroup.position.clone();

    const usesShirt = (type !== 4 && type !== 7 && type !== 8);
    const bodyMesh = new THREE.Mesh(getBox(0.8, 1.2, 0.4), usesShirt ? shirtMat : skinMat);
    bodyGroup.add(bodyMesh);

    if (type === 4 || type === 7) {
        const bellyScale = type === 7 ? 1.6 : 0.9; 
        const belly = new THREE.Mesh(getBox(bellyScale, 1.0, 0.8), skinMat);
        belly.position.set(0, -0.1, 0.4); 
        bodyGroup.add(belly);

        for(let i=0; i<6; i++) {
            const lump = new THREE.Mesh(getSph(0.15, 4, 4), bloodMat);
            // Random scaling prevents geometry duplication!
            const rScale = 1.0 + (Math.random() * 0.6);
            lump.scale.set(rScale, rScale, rScale);
            lump.position.set((Math.random()-0.5) * bellyScale, (Math.random()-0.5), 0.4 + (Math.random()*0.2));
            belly.add(lump);
        }
    }
    
    if (type === 3) {
        const guts = new THREE.Mesh(getBox(0.6, 0.4, 0.8), bloodMat);
        guts.position.set(0, -0.5, -0.2); bodyGroup.add(guts);
    }

    innerGroup.add(bodyGroup);

    // ==========================================
    // 3. MUTATED ARMS & TENTACLES
    // ==========================================
    const shoulderWidth = type === 7 ? 0.9 : (type === 2 ? 0.7 : (type === 1 ? 0.45 : 0.5));
    const armThickness = type === 7 ? 0.5 : (type === 2 ? 0.45 : (type === 1 ? 0.2 : 0.3));
    const armLength = type === 1 ? 1.6 : 1.2; 

    let leftArmGroup, rightArmGroup;
    let extraLeftArm, extraRightArm;
    let tentacles = [];

    if (type === 8) {
        for(let i=0; i<4; i++) {
            const tentacleGroup = new THREE.Group();
            tentacleGroup.position.set((i%2===0?-0.3:0.3), 1.0, -0.2); 
            tentacleGroup.userData.basePos = tentacleGroup.position.clone();
            
            const tentacleMesh = new THREE.Mesh(getCyl(0.1, 0.02, 2.5, 8), skinMat);
            tentacleMesh.position.y = -1.25;
            tentacleGroup.add(tentacleMesh);
            innerGroup.add(tentacleGroup);
            tentacles.push(tentacleGroup);
        }
    } else {
        leftArmGroup = new THREE.Group();
        leftArmGroup.position.set(-shoulderWidth, 1.0, 0); 
        leftArmGroup.userData.basePos = leftArmGroup.position.clone();
        const leftArm = new THREE.Mesh(getBox(armThickness, armLength, armThickness), skinMat);
        leftArm.position.y = -(armLength / 2) + 0.2; 
        leftArmGroup.add(leftArm);
        innerGroup.add(leftArmGroup);

        rightArmGroup = new THREE.Group();
        rightArmGroup.position.set(shoulderWidth, 1.0, 0);
        rightArmGroup.userData.basePos = rightArmGroup.position.clone();
        const rightArm = new THREE.Mesh(getBox(armThickness, armLength, armThickness), skinMat);
        rightArm.position.y = -(armLength / 2) + 0.2;
        rightArmGroup.add(rightArm);
        innerGroup.add(rightArmGroup);

        if (type === 6) {
            extraLeftArm = new THREE.Group();
            extraLeftArm.position.set(-shoulderWidth + 0.1, 0.3, 0);
            extraLeftArm.userData.basePos = extraLeftArm.position.clone();
            const elMesh = new THREE.Mesh(getBox(0.2, 1.0, 0.2), skinMat);
            elMesh.position.y = -0.5; extraLeftArm.add(elMesh);
            innerGroup.add(extraLeftArm);

            extraRightArm = new THREE.Group();
            extraRightArm.position.set(shoulderWidth - 0.1, 0.3, 0);
            extraRightArm.userData.basePos = extraRightArm.position.clone();
            const erMesh = new THREE.Mesh(getBox(0.2, 1.0, 0.2), skinMat);
            erMesh.position.y = -0.5; extraRightArm.add(erMesh);
            innerGroup.add(extraRightArm);
        }
    }

    // ==========================================
    // 4. LEGS
    // ==========================================
    let leftLegGroup, rightLegGroup;

    if (type !== 3) { 
        const legThickness = type === 2 || type === 7 ? 0.45 : 0.38; 
        
        leftLegGroup = new THREE.Group();
        leftLegGroup.position.set(-0.25, 0, 0);
        leftLegGroup.userData.basePos = leftLegGroup.position.clone();
        const leftLeg = new THREE.Mesh(getBox(legThickness, 1.5, legThickness), pantsMat);
        leftLeg.position.y = -0.75; leftLegGroup.add(leftLeg);
        innerGroup.add(leftLegGroup);

        rightLegGroup = new THREE.Group();
        rightLegGroup.position.set(0.25, 0, 0);
        rightLegGroup.userData.basePos = rightLegGroup.position.clone();
        const rightLeg = new THREE.Mesh(getBox(legThickness, 1.5, legThickness), pantsMat);
        rightLeg.position.y = -0.75; rightLegGroup.add(rightLeg);
        innerGroup.add(rightLegGroup);
    }

    // ==========================================
    // 5. DYNAMIC MONSTER LIGHTING (GLOW)
    // ==========================================
    if (type === 4) { 
        const glow = new THREE.PointLight(0x00ff00, 1.5, 6);
        glow.position.set(0, 1, 0); innerGroup.add(glow);
    } else if (type === 5) { 
        const glow = new THREE.PointLight(0xff0000, 1.5, 5);
        glow.position.set(0, 1.6, 0.5); innerGroup.add(glow);
    } else if (type === 7) { 
        const glow = new THREE.PointLight(0x55ff00, 3.0, 12);
        glow.position.set(0, 2, 1); innerGroup.add(glow);
    } else if (type === 8) { 
        const glow = new THREE.PointLight(0x0044ff, 2.0, 6);
        glow.position.set(0, 1.5, -0.5); innerGroup.add(glow);
    }

    group.traverse(child => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }});

    if (type === 1) innerGroup.scale.set(0.8, 1.0, 0.8); 
    if (type === 2) innerGroup.scale.set(1.4, 1.4, 1.4); 
    if (type === 3) innerGroup.position.y = -1.0;        
    if (type === 4) innerGroup.scale.set(1.3, 1.0, 1.3); 
    if (type === 5) innerGroup.scale.set(1.0, 1.2, 1.0); 
    if (type === 6) innerGroup.scale.set(1.1, 1.1, 1.1); 
    if (type === 7) innerGroup.scale.set(3.0, 3.0, 3.0); 
    if (type === 8) innerGroup.scale.set(0.9, 1.3, 0.9); 

    group.userData = { 
        innerGroup: innerGroup, head: headGroup, body: bodyGroup, leftArm: leftArmGroup, 
        rightArm: rightArmGroup, extraLeftArm: extraLeftArm, extraRightArm: extraRightArm,
        tentacles: tentacles, leftLeg: leftLegGroup, rightLeg: rightLegGroup, type: type 
    };

    return group;
}