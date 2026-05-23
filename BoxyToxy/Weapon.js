import * as THREE from 'three';

// 1. UPGRADED PBR MATERIALS (Shiny metal, matte grips)
const gunMetal = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.4, metalness: 0.7 });
const gunDark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.7, metalness: 0.4 });
const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c4033, roughness: 0.9, metalness: 0.1 }); 
const accentMat = new THREE.MeshStandardMaterial({ color: 0xaa3333, roughness: 0.5, metalness: 0.6 }); // Cool red accent

// Helper function to apply shadows to all parts of a gun
function setupGun(group) {
    group.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });
    return group;
}

// 1. PISTOL
export function createPistol() {
    const gunGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.4), gunMetal);
    gunGroup.add(body);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.15), gunDark);
    grip.position.set(0, -0.15, -0.1);
    grip.rotation.x = 0.1;
    gunGroup.add(grip);

    // Added a small barrel detail
    const barrelHole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.05), gunDark);
    barrelHole.position.set(0, 0.02, 0.21);
    gunGroup.add(barrelHole);

    return setupGun(gunGroup);
}

// 2. ASSAULT RIFLE
export function createAssaultRifle() {
    const gunGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.25, 0.8), gunMetal);
    gunGroup.add(body);
    
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), gunDark);
    barrel.position.set(0, 0.05, 0.7); 
    gunGroup.add(barrel);
    
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.4, 0.2), gunDark);
    mag.position.set(0, -0.25, 0.1); 
    mag.rotation.x = -0.15;
    gunGroup.add(mag);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.15), gunDark);
    grip.position.set(0, -0.2, -0.25);
    grip.rotation.x = 0.15;
    gunGroup.add(grip);
    
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.4), gunDark);
    stock.position.set(0, -0.05, -0.5);
    gunGroup.add(stock);

    return setupGun(gunGroup);
}

// 3. SHOTGUN
export function createShotgun() {
    const gunGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.9), gunMetal);
    gunGroup.add(body);
    
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.8), gunDark);
    barrel.position.set(0, 0.05, 0.8);
    gunGroup.add(barrel);
    
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.4), woodMat); 
    pump.position.set(0, -0.05, 0.6);
    gunGroup.add(pump);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.15), gunDark);
    grip.position.set(0, -0.15, -0.3);
    grip.rotation.x = 0.2;
    gunGroup.add(grip);
    
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.4), woodMat); 
    stock.position.set(0, -0.05, -0.6);
    gunGroup.add(stock);

    return setupGun(gunGroup);
}

// 4. SNIPER RIFLE
export function createSniperRifle() {
    const gunGroup = new THREE.Group();
    
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.8), gunMetal);
    gunGroup.add(body);
    
    const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 1.2), gunDark); 
    barrel.position.set(0, 0.05, 1.0);
    gunGroup.add(barrel);
    
    // Upgraded Scope Design
    const scopeTube = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), gunDark); 
    scopeTube.position.set(0, 0.18, 0);
    const scopeLens = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.09, 0.1), accentMat); // Red glare on lens
    scopeLens.position.set(0, 0.18, 0.25);
    gunGroup.add(scopeTube, scopeLens);
    
    const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), gunDark);
    mount1.position.set(0, 0.12, 0.15);
    const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.04), gunDark);
    mount2.position.set(0, 0.12, -0.15);
    gunGroup.add(mount1, mount2);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.15), gunDark);
    grip.position.set(0, -0.15, -0.2);
    grip.rotation.x = 0.15;
    gunGroup.add(grip);
    
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.5), gunMetal);
    stock.position.set(0, -0.05, -0.55);
    gunGroup.add(stock);

    return setupGun(gunGroup);
}