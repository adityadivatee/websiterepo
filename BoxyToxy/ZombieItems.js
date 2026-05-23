import * as THREE from 'three';

// THE FIX: Inventory now tracks real numbers, and Potions track "Time Pools"
export const inventory = {
    grenades: 3,
    c4: 1,
    mines: 2,
    speedTime: 15.0, // Start with 15 seconds of speed energy
    invisTime: 10.0  // Start with 10 seconds of invis energy
};

export const activeDrops = [];
export const activeExplosives = [];
export const activeC4List = []; 

const medMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
const crossMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x550000 });
const ammoMat = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.8 });
const glassMat = new THREE.MeshStandardMaterial({ color: 0x88ccff, transparent: true, opacity: 0.6, roughness: 0.1 });
const speedLiquid = new THREE.MeshStandardMaterial({ color: 0xaa00ff, emissive: 0xaa00ff, emissiveIntensity: 0.5 });
const invisLiquid = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.8 });
const coinMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, metalness: 0.8, roughness: 0.2 });

const nadeMat = new THREE.MeshStandardMaterial({ color: 0x224422, roughness: 0.8 });
const c4Mat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
const c4Light = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000 });
const mineMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.7 });
const mineLight = new THREE.MeshStandardMaterial({ color: 0xff5500, emissive: 0xff5500 });

function buildHealthKit() {
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.5), medMat); group.add(box);
    const cross1 = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.52), crossMat); group.add(cross1);
    const cross2 = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.3, 0.52), crossMat); group.add(cross2);
    const light = new THREE.PointLight(0x00ff00, 2.0, 6); group.add(light); 
    return group;
}

function buildAmmoCrate() {
    const group = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.3, 0.4), ammoMat); group.add(box);
    const strap1 = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.32, 0.1), new THREE.MeshStandardMaterial({color:0x111111})); group.add(strap1);
    const light = new THREE.PointLight(0x0088ff, 2.0, 6); group.add(light); 
    return group;
}

function buildPotion(mat, lightColor) {
    const group = new THREE.Group();
    const flask = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.4, 8), glassMat); group.add(flask);
    const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.18, 0.3, 8), mat); liquid.position.y = -0.04; group.add(liquid);
    const cork = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 8), new THREE.MeshStandardMaterial({color:0x5c4033})); cork.position.y = 0.25; group.add(cork);
    const light = new THREE.PointLight(lightColor, 2.0, 6); group.add(light);
    return group;
}

function buildCoin() {
    const group = new THREE.Group();
    const coin = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16), coinMat);
    coin.rotation.x = Math.PI / 2; group.add(coin);
    const light = new THREE.PointLight(0xffaa00, 2.0, 6); group.add(light);
    return group;
}

function buildGrenade() {
    const group = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 8), nadeMat); group.add(body);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.1, 8), new THREE.MeshStandardMaterial({color:0x555555})); pin.position.y = 0.15; group.add(pin);
    return group;
}

function buildC4() {
    const group = new THREE.Group();
    const brick1 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.1), c4Mat); brick1.position.set(-0.11, 0, 0); group.add(brick1);
    const brick2 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.4, 0.1), c4Mat); brick2.position.set(0.11, 0, 0); group.add(brick2);
    const tape = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.1, 0.12), new THREE.MeshStandardMaterial({color:0xdddddd})); group.add(tape);
    const detonator = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.05), new THREE.MeshStandardMaterial({color:0x111111})); detonator.position.set(0, 0, 0.08); group.add(detonator);
    const lightBox = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.02), c4Light); lightBox.position.set(0, 0.05, 0.1); group.add(lightBox);
    const light = new THREE.PointLight(0xff0000, 1.5, 4); light.position.set(0, 0.05, 0.1); group.add(light);
    return group;
}

function buildMine() {
    const group = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 0.1, 16), mineMat); group.add(base);
    const button = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.12, 16), mineLight); group.add(button);
    const light = new THREE.PointLight(0xff5500, 2.0, 5); light.position.set(0, 0.2, 0); group.add(light);
    return group;
}

export function spawnItemDrop(pos, scene, playerStats) {
    const roll = Math.random();
    let type, mesh;
    
    if (playerStats && playerStats.hp < 40 && Math.random() < 0.6) {
        type = 'health'; mesh = buildHealthKit();
    } else {
        if (roll < 0.1) { type = 'health'; mesh = buildHealthKit(); }
        else if (roll < 0.35) { type = 'ammo'; mesh = buildAmmoCrate(); } 
        else if (roll < 0.45) { type = 'speed'; mesh = buildPotion(speedLiquid, 0xaa00ff); }
        else if (roll < 0.55) { type = 'invis'; mesh = buildPotion(invisLiquid, 0xffffff); }
        else if (roll < 0.65) { type = 'coin'; mesh = buildCoin(); }
        else if (roll < 0.80) { type = 'grenade'; mesh = buildGrenade(); } 
        else if (roll < 0.90) { type = 'c4'; mesh = buildC4(); }      
        else { type = 'mine'; mesh = buildMine(); } 
    }                    

    mesh.position.copy(pos);
    mesh.position.y = 1.2; 
    mesh.scale.set(2.0, 2.0, 2.0);
    mesh.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; }});
    
    scene.add(mesh);
    activeDrops.push({ mesh: mesh, type: type, life: 15.0, baseHeight: 1.2 });
}

export function useExplosive(type, camera, scene) {
    if (type === 'grenade' && inventory.grenades > 0) {
        inventory.grenades--;
        launchExplosive(type, camera, scene);
    } 
    else if (type === 'c4') {
        if (inventory.c4 > 0) {
            inventory.c4--;
            const exp = launchExplosive(type, camera, scene);
            activeC4List.push(exp); 
        }
    } 
    else if (type === 'mine' && inventory.mines > 0) {
        inventory.mines--;
        launchExplosive(type, camera, scene);
    }
}

export function detonateC4() {
    activeC4List.forEach(c4 => { c4.timer = 0; });
    activeC4List.length = 0; 
}

function launchExplosive(type, camera, scene) {
    let mesh;
    if (type === 'grenade') mesh = buildGrenade();
    else if (type === 'c4') mesh = buildC4();
    else mesh = buildMine();
    
    mesh.scale.set(1.5, 1.5, 1.5);
    mesh.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; }});

    const dir = new THREE.Vector3(0,0,-1).applyQuaternion(camera.quaternion).normalize();
    mesh.position.copy(camera.position).add(dir.clone().multiplyScalar(1.0));
    scene.add(mesh);

    let vel = dir.clone().multiplyScalar(type === 'mine' ? 5 : 18); 
    if (type === 'mine') vel.y = -2; 
    else vel.y += 6; 

    const exp = { 
        mesh: mesh, type: type, velocity: vel, timer: type === 'grenade' ? 3.0 : 999.0, active: true 
    };
    activeExplosives.push(exp);
    return exp;
}

function triggerExplosion(pos, radius, damage, zombies, scene) {
    const flashGeo = new THREE.SphereGeometry(radius * 0.8, 8, 8);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 });
    const flash = new THREE.Mesh(flashGeo, flashMat);
    flash.position.copy(pos);
    scene.add(flash);
    
    setTimeout(() => { scene.remove(flash); }, 150);

    zombies.forEach(z => {
        if (z.dead) return;
        const dist = z.mesh.position.distanceTo(pos);
        if (dist <= radius) {
            z.hp -= damage;
            
            const push = new THREE.Vector3().subVectors(z.mesh.position, pos).normalize();
            z.velocity.x += push.x * 50;
            z.velocity.z += push.z * 50;
            z.velocityY += 15; 
            
            z.stateTimer = 0;
            z.isDiving = false;

            if (z.hp <= 0) {
                z.state = "blasted";
                z.dead = true;
                z.killedByExplosion = true; 
            } else {
                z.state = "falling";
            }
        }
    });
}

export function updateItems(delta, camera, scene, zombies, playerStats, playSound) {
    for (let i = activeDrops.length - 1; i >= 0; i--) {
        const drop = activeDrops[i];
        drop.mesh.rotation.y += delta * 2.0; 
        drop.mesh.position.y = drop.baseHeight + Math.sin(Date.now() * 0.003) * 0.2;
        drop.life -= delta;
        
        const flatDist = Math.hypot(camera.position.x - drop.mesh.position.x, camera.position.z - drop.mesh.position.z);
        
        if (flatDist < 2.5) {
            if (drop.type === 'health') playerStats.hp = Math.min(100, playerStats.hp + 30);
            if (drop.type === 'ammo') playerStats.refillAmmo = true;
            
            // THE FIX: Collecting potions adds +10 Seconds to your energy pool!
            if (drop.type === 'speed') inventory.speedTime += 10.0;
            if (drop.type === 'invis') inventory.invisTime += 10.0;
            
            if (drop.type === 'coin') playerStats.coins += 10;
            
            // THE FIX: Actually updates inventory counts!
            if (drop.type === 'grenade') inventory.grenades++;
            if (drop.type === 'c4') inventory.c4++;
            if (drop.type === 'mine') inventory.mines++;
            
            scene.remove(drop.mesh);
            activeDrops.splice(i, 1);
            playerStats.hudNeedsUpdate = true;
        } else if (drop.life <= 0) {
            scene.remove(drop.mesh);
            activeDrops.splice(i, 1);
        }
    }

    for (let i = activeExplosives.length - 1; i >= 0; i--) {
        const exp = activeExplosives[i];
        if (!exp.active) continue;

        exp.velocity.y -= 30 * delta;
        exp.mesh.position.addScaledVector(exp.velocity, delta);
        
        if (exp.velocity.lengthSq() > 1) {
            exp.mesh.rotation.x += delta * 10;
            exp.mesh.rotation.z += delta * 5;
        }

        if (exp.mesh.position.y <= 0.2) {
            exp.mesh.position.y = 0.2;
            if (exp.type === 'grenade') {
                exp.velocity.y *= -0.5; exp.velocity.x *= 0.8; exp.velocity.z *= 0.8;
            } else {
                exp.velocity.set(0,0,0);
                if(exp.type === 'mine') exp.mesh.rotation.set(0,0,0); 
            }
        }

        exp.timer -= delta;
        let shouldExplode = false;
        let radius = 10, damage = 100;

        if (exp.type === 'grenade' && exp.timer <= 0) {
            shouldExplode = true; radius = 12; damage = 300;
        } 
        else if (exp.type === 'c4' && exp.timer <= 0) { 
            shouldExplode = true; radius = 25; damage = 600; 
        }
        else if (exp.type === 'mine' && exp.velocity.lengthSq() < 1) { 
            zombies.forEach(z => {
                if (!z.dead && z.mesh.position.distanceTo(exp.mesh.position) < 3.0) {
                    shouldExplode = true; radius = 10; damage = 400;
                }
            });
        }

        if (shouldExplode) {
            if (playSound) playSound('Explosion');
            triggerExplosion(exp.mesh.position, radius, damage, zombies, scene);
            scene.remove(exp.mesh);
            activeExplosives.splice(i, 1);
        }
    }
}