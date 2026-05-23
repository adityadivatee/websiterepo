import * as THREE from 'three';

// ==========================================
// ULTIMATE PBR MATERIALS (ZOMBIE MODE)
// ==========================================
const gunMetal = new THREE.MeshStandardMaterial({ color: 0x4a5054, roughness: 0.3, metalness: 0.8 }); // Blued Steel
const gunDark = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 }); // Matte Polymer
const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2e15, roughness: 0.9, metalness: 0.0 }); // Rich Wood
const accentMat = new THREE.MeshStandardMaterial({ color: 0xff0000, roughness: 0.2, emissive: 0xaa0000 }); // Glowing Red Lasers
const neonBlue = new THREE.MeshStandardMaterial({ color: 0x00ffff, roughness: 0.1, emissive: 0x00aaaa }); // Plasma Blue
const neonOrange = new THREE.MeshStandardMaterial({ color: 0xff6600, roughness: 0.1, emissive: 0xcc4400 }); // Railgun Heat
const goldMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.3, metalness: 0.9 }); // Brass Bullets
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.4, roughness: 0.1 }); // Scope Lenses

function setupGun(group) {
    group.traverse((child) => {
        if (child.isMesh) { 
            child.castShadow = true; 
            child.receiveShadow = true; 
        }
    });
    return group;
}

// 1. TACTICAL PISTOL
export function createPistol() {
    const g = new THREE.Group();
    // Slide (Silver)
    const slide = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.45), gunMetal); 
    slide.position.set(0, 0.06, 0); g.add(slide);
    // Frame (Polymer)
    const frame = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.06, 0.45), gunDark); g.add(frame);
    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.25, 0.15), gunDark); 
    grip.position.set(0, -0.15, -0.12); grip.rotation.x = 0.15; g.add(grip);
    // Extended Mag Base
    const magBase = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.05, 0.16), gunMetal); 
    magBase.position.set(0, -0.28, -0.1); magBase.rotation.x = 0.15; g.add(magBase);
    // Underbarrel Laser Sight
    const laserMod = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.15), gunDark); 
    laserMod.position.set(0, -0.05, 0.15); g.add(laserMod);
    const laserLens = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), accentMat); 
    laserLens.position.set(0, -0.05, 0.23); g.add(laserLens);

    return setupGun(g);
}

// 2. SILENCED SMG (Vector Style)
export function createSMG() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.5), gunDark); g.add(body);
    // Suppressor
    const suppressor = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 12), gunMetal); 
    suppressor.rotation.x = Math.PI/2; suppressor.position.set(0, 0.05, 0.45); g.add(suppressor);
    // Vector angled Mag well
    const magWell = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.15), gunDark); 
    magWell.position.set(0, -0.2, 0.1); magWell.rotation.x = -0.3; g.add(magWell);
    // Extended Mag
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.4, 0.1), gunMetal); 
    mag.position.set(0, -0.35, 0.12); mag.rotation.x = -0.3; g.add(mag);
    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.15), gunDark); 
    grip.position.set(0, -0.15, -0.2); grip.rotation.x = 0.1; g.add(grip);
    // Red Dot Sight
    const sightBase = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.1), gunMetal); 
    sightBase.position.set(0, 0.16, -0.05); g.add(sightBase);
    const sightGlass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.06, 0.02), glassMat); 
    sightGlass.position.set(0, 0.2, -0.05); g.add(sightGlass);
    const redDot = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.01, 0.01), accentMat); 
    redDot.position.set(0, 0.2, -0.04); g.add(redDot);
    // Folding Stock
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.4), gunMetal); 
    stock.position.set(0, 0.05, -0.4); g.add(stock);

    return setupGun(g);
}

// 3. TACTICAL SHOTGUN (SPAS-12 Style)
export function createShotgun() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.7), gunMetal); g.add(body);
    // Double Tube (Barrel + Mag Tube)
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 12), gunDark); 
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.05, 0.75); g.add(barrel);
    const magTube = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.7, 12), gunMetal); 
    magTube.rotation.x = Math.PI/2; magTube.position.set(0, -0.05, 0.7); g.add(magTube);
    // Ribbed Pump
    const pump = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.3), gunDark); 
    pump.position.set(0, -0.05, 0.5); g.add(pump);
    // Top Folded Stock (SPAS style)
    const topStock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.6), gunDark); 
    topStock.position.set(0, 0.12, -0.05); g.add(topStock);
    // Grip
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.12), gunDark); 
    grip.position.set(0, -0.15, -0.25); grip.rotation.x = 0.2; g.add(grip);
    // Shell Holder on side
    const shell1 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), accentMat); 
    shell1.rotation.x = Math.PI/2; shell1.position.set(0.07, 0, 0.1); g.add(shell1);
    const shell2 = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), accentMat); 
    shell2.rotation.x = Math.PI/2; shell2.position.set(0.07, 0, 0); g.add(shell2);

    return setupGun(g);
}

// 4. ASSAULT RIFLE (Heavy M4 Style)
export function createAssaultRifle() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.6), gunMetal); g.add(body);
    // Barrel with Heat Shield
    const heatShield = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), gunDark); 
    heatShield.rotation.x = Math.PI/2; heatShield.position.set(0, 0.05, 0.5); g.add(heatShield);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), gunMetal); 
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.05, 0.9); g.add(barrel);
    // Muzzle Brake
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), gunDark); 
    brake.rotation.x = Math.PI/2; brake.position.set(0, 0.05, 1.15); g.add(brake);
    // Mag with ridges
    const mag = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.35, 0.15), gunMetal); 
    mag.position.set(0, -0.25, 0.15); mag.rotation.x = -0.15; g.add(mag);
    // Grips
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.12), gunDark); 
    grip.position.set(0, -0.2, -0.2); grip.rotation.x = 0.15; g.add(grip);
    const foreGrip = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8), gunDark); 
    foreGrip.position.set(0, -0.15, 0.6); g.add(foreGrip);
    // Stock
    const stockTube = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 8), gunMetal); 
    stockTube.rotation.x = Math.PI/2; stockTube.position.set(0, 0.05, -0.5); g.add(stockTube);
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.1), gunDark); 
    stockPad.position.set(0, 0, -0.7); g.add(stockPad);
    // ACOG Scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.25, 12), gunDark); 
    scope.rotation.x = Math.PI/2; scope.position.set(0, 0.2, -0.05); g.add(scope);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.02, 12), glassMat); 
    lens.rotation.x = Math.PI/2; lens.position.set(0, 0.2, 0.08); g.add(lens);

    return setupGun(g);
}

// 5. SNIPER RIFLE (Heavy Barret .50 Cal Style)
export function createSniperRifle() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.25, 0.9), gunMetal); g.add(body);
    // Massive Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.4, 12), gunDark); 
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.05, 1.1); g.add(barrel);
    // Gigantic Muzzle Brake
    const brake = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 0.25), gunDark); 
    brake.position.set(0, 0.05, 1.9); g.add(brake);
    // Giant Scope
    const scopeTube = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 16), gunDark); 
    scopeTube.rotation.x = Math.PI/2; scopeTube.position.set(0, 0.22, 0.1); g.add(scopeTube);
    const scopeFront = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.07, 0.15, 16), gunDark); 
    scopeFront.rotation.x = Math.PI/2; scopeFront.position.set(0, 0.22, 0.45); g.add(scopeFront);
    const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 16), glassMat); 
    lens.rotation.x = Math.PI/2; lens.position.set(0, 0.22, 0.53); g.add(lens);
    const scopeGlare = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.01, 16), accentMat); 
    scopeGlare.rotation.x = Math.PI/2; scopeGlare.position.set(0, 0.22, 0.54); g.add(scopeGlare);
    // Scope Mounts
    const mount1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), gunMetal); mount1.position.set(0, 0.15, -0.05); g.add(mount1);
    const mount2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.1, 0.06), gunMetal); mount2.position.set(0, 0.15, 0.25); g.add(mount2);
    // Bipod
    const bipodL = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), gunMetal); 
    bipodL.position.set(0.15, -0.15, 1.2); bipodL.rotation.z = -0.4; bipodL.rotation.x = 0.2; g.add(bipodL);
    const bipodR = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8), gunMetal); 
    bipodR.position.set(-0.15, -0.15, 1.2); bipodR.rotation.z = 0.4; bipodR.rotation.x = 0.2; g.add(bipodR);
    // Grip & Heavy Stock
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.15), gunDark); 
    grip.position.set(0, -0.15, -0.3); grip.rotation.x = 0.15; g.add(grip);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.6), gunDark); 
    stock.position.set(0, -0.05, -0.7); g.add(stock);

    return setupGun(g);
}

// 6. MACHINE GUN (LMG with Ammo Belt) 
export function createMachineGun() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.9), gunMetal); g.add(body);
    // Vented Heat Shield Barrel
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 12), gunDark); 
    barrel.rotation.x = Math.PI/2; barrel.position.set(0, 0.05, 0.85); g.add(barrel);
    const innerBarrel = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 8), gunMetal); 
    innerBarrel.rotation.x = Math.PI/2; innerBarrel.position.set(0, 0.05, 0.9); g.add(innerBarrel);
    // Box Mag & Ammo Belt!
    const drumMag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.35), gunDark); 
    drumMag.position.set(-0.1, -0.2, 0.2); g.add(drumMag); // Offset to the left
    
    // Golden Bullets feeding in
    for(let i=0; i<4; i++) {
        const bullet = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 8), goldMat);
        bullet.position.set(0.05, 0.05 + (i*0.04), 0.2);
        g.add(bullet);
    }
    
    // Carry Handle
    const handle1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), gunDark); handle1.position.set(0, 0.2, 0.2); g.add(handle1);
    const handle2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.15, 0.04), gunDark); handle2.position.set(0, 0.2, 0.5); g.add(handle2);
    const handleTop = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.34), gunDark); handleTop.position.set(0, 0.25, 0.35); g.add(handleTop);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.2, 0.15), gunDark); 
    grip.position.set(0, -0.2, -0.3); grip.rotation.x = 0.1; g.add(grip);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.25, 0.5), gunDark); 
    stock.position.set(0, -0.05, -0.7); g.add(stock);

    return setupGun(g);
}

// 7. GRENADE LAUNCHER (M32 Rotary Style)
export function createGrenadeLauncher() {
    const g = new THREE.Group();
    // Huge Main Tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.8, 16), gunMetal); 
    tube.rotation.x = Math.PI/2; tube.position.set(0, 0, 0.5); g.add(tube);
    
    // Rotary Cylinder (The 6 chambers)
    const cylinderGroup = new THREE.Group();
    cylinderGroup.position.set(0, 0, -0.1);
    const cylinderCore = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.4, 16), gunDark); 
    cylinderCore.rotation.x = Math.PI/2; cylinderGroup.add(cylinderCore);
    
    // Hollow chambers around cylinder
    for(let i=0; i<6; i++) {
        const angle = (Math.PI * 2 / 6) * i;
        const chamber = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.42, 8), gunMetal);
        chamber.rotation.x = Math.PI/2;
        chamber.position.set(Math.cos(angle)*0.14, Math.sin(angle)*0.14, 0);
        cylinderGroup.add(chamber);
    }
    g.add(cylinderGroup);

    // Frame connecting it all
    const upperFrame = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 1.0), gunMetal);
    upperFrame.position.set(0, 0.25, 0.2); g.add(upperFrame);
    
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.15), gunDark); 
    grip.position.set(0, -0.25, -0.4); grip.rotation.x = 0.15; g.add(grip);
    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.5), gunMetal); 
    stock.position.set(0, -0.1, -0.7); g.add(stock);
    const stockPad = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.25, 0.08), gunDark); 
    stockPad.position.set(0, -0.1, -0.95); g.add(stockPad);

    return setupGun(g);
}

// 8. RPG-7 LAUNCHER
export function createRPG() {
    const g = new THREE.Group();
    // Long main tube
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.8, 16), gunMetal); 
    tube.rotation.x = Math.PI/2; tube.position.set(0, 0, 0); g.add(tube);
    
    // Wooden Heat Shields (Classic RPG look)
    const woodShield1 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.4, 12), woodMat);
    woodShield1.rotation.x = Math.PI/2; woodShield1.position.set(0, 0, 0.2); g.add(woodShield1);
    const woodShield2 = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.3, 12), woodMat);
    woodShield2.rotation.x = Math.PI/2; woodShield2.position.set(0, 0, -0.4); g.add(woodShield2);

    // The Warhead (Spike + Bulb)
    const warheadBase = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.2, 0.2, 16), gunDark); 
    warheadBase.rotation.x = Math.PI/2; warheadBase.position.set(0, 0, 0.95); g.add(warheadBase);
    const warheadCone = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.4, 16), gunMetal); 
    warheadCone.rotation.x = Math.PI/2; warheadCone.position.set(0, 0, 1.25); g.add(warheadCone);
    const warheadTip = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8), gunDark); 
    warheadTip.rotation.x = Math.PI/2; warheadTip.position.set(0, 0, 1.55); g.add(warheadTip);

    // Rear Exhaust Cone
    const exhaust = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.3, 12), gunDark); 
    exhaust.rotation.x = Math.PI/2; exhaust.position.set(0, 0, -1.0); g.add(exhaust);

    // Grips & Optical Sight
    const grip1 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.1), woodMat); 
    grip1.position.set(0, -0.2, 0.4); grip1.rotation.x = 0.2; g.add(grip1);
    const grip2 = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.25, 0.1), woodMat); 
    grip2.position.set(0, -0.2, -0.1); grip2.rotation.x = 0.2; g.add(grip2);
    
    // Side mounted scope
    const scope = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), gunDark);
    scope.rotation.x = Math.PI/2; scope.position.set(-0.15, 0.1, -0.1); g.add(scope);
    const scopeMount = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.04, 0.1), gunMetal);
    scopeMount.position.set(-0.1, 0.05, -0.1); g.add(scopeMount);

    return setupGun(g);
}

// 9. LASER GUN (Sci-Fi Plasma Rifle)
export function createLaserGun() {
    const g = new THREE.Group();
    // Sleek White/Grey Body
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.25, 0.6), gunDark); g.add(body);
    
    // Floating Magnetic Barrel Rings
    for(let i=0; i<3; i++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.02, 8, 16), neonBlue);
        ring.position.set(0, 0.05, 0.4 + (i*0.15)); g.add(ring);
    }
    // Plasma Core
    const neonCore = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.6, 12), neonBlue); 
    neonCore.rotation.x = Math.PI/2; neonCore.position.set(0, 0.05, 0.5); g.add(neonCore);
    
    // Angled Sci-Fi Grips
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.25, 0.15), gunMetal); 
    grip.position.set(0, -0.2, -0.15); grip.rotation.x = 0.2; g.add(grip);
    const frontGrip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.25), gunMetal); 
    frontGrip.position.set(0, -0.15, 0.2); frontGrip.rotation.x = -0.4; g.add(frontGrip);
    
    // Battery Pack (Glowing)
    const battery = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.15, 0.15), neonBlue); 
    battery.position.set(0, -0.1, -0.35); g.add(battery);

    return setupGun(g);
}

// 10. HEAVY RAILGUN
export function createRailgun() {
    const g = new THREE.Group();
    // Massive Blocky Frame
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.3, 0.8), gunDark); g.add(body);
    
    // Exposed Glowing Heat Rails
    const rail1 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.2), neonOrange); 
    rail1.position.set(0.08, 0.05, 0.8); g.add(rail1);
    const rail2 = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 1.2), neonOrange); 
    rail2.position.set(-0.08, 0.05, 0.8); g.add(rail2);
    
    // Inner Magnetic Coils
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.0, 12), gunMetal); 
    coil.rotation.x = Math.PI/2; coil.position.set(0, 0.05, 0.7); g.add(coil);
    
    // Heat Vents
    for(let i=0; i<4; i++) {
        const vent = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.05), neonOrange);
        vent.position.set(0, 0.15, 0.1 + (i*0.1)); g.add(vent);
    }

    const stock = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.4), gunMetal); 
    stock.position.set(0, -0.05, -0.6); g.add(stock);
    const grip = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.25, 0.2), gunDark); 
    grip.position.set(0, -0.2, -0.2); grip.rotation.x = 0.1; g.add(grip);

    return setupGun(g);
}