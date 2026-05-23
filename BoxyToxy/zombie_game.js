import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createPistol, createSMG, createShotgun, createAssaultRifle, createSniperRifle, createMachineGun, createGrenadeLauncher, createRPG, createLaserGun, createRailgun } from './ZombieWeapons.js';
import { createZombieMap } from './ZombieMap.js';
import { createZombie } from './ZombieCharacter.js';
import { updateZombieAnimation } from './ZombieAnimation.js'; 
import { inventory, spawnItemDrop, useExplosive, updateItems, detonateC4 } from './ZombieItems.js';
import { setupMobileControls } from './MobileControls.js';
import { WaveState, spawnZombie, checkWaves } from './ZombieSpawner.js';

let audioCtx = null; let musicInterval = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function startHorrorMusic() {
    if (!audioCtx || musicInterval) return;
    const musicGain = audioCtx.createGain(); musicGain.gain.value = 0.4; musicGain.connect(audioCtx.destination);
    const drone = audioCtx.createOscillator(); const droneGain = audioCtx.createGain();
    drone.type = 'sine'; drone.frequency.value = 220.0; droneGain.gain.value = 0.5; 
    drone.connect(droneGain); droneGain.connect(musicGain); drone.start();

    let step = 0;
    musicInterval = setInterval(() => {
        if (!isGameRunning) return; const now = audioCtx.currentTime;
        const kick = audioCtx.createOscillator(); const kGain = audioCtx.createGain();
        kick.frequency.setValueAtTime(120, now); kick.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
        kGain.gain.setValueAtTime(0.8, now); kGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        kick.connect(kGain); kGain.connect(musicGain); kick.start(now); kick.stop(now + 0.5);

        if (step % 4 === 0) {
            const metal = audioCtx.createOscillator(); const mGain = audioCtx.createGain();
            metal.type = 'triangle'; metal.frequency.setValueAtTime(600 + Math.random() * 300, now);  
            mGain.gain.setValueAtTime(0.3, now); mGain.gain.exponentialRampToValueAtTime(0.01, now + 2.5);
            metal.connect(mGain); mGain.connect(musicGain); metal.start(now); metal.stop(now + 2.5);
        }
        step++;
    }, 800); 
}

function playGunSound(weaponName) {
    if (!audioCtx) return;
    const now = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
    if (weaponName === 'RPG' || weaponName === 'Explosion') {
        osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.8);
        gain.gain.setValueAtTime(1.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
    } else {
        osc.type = 'square';
        if (weaponName === 'Sniper' || weaponName === 'Railgun') osc.frequency.setValueAtTime(200, now);
        else if (weaponName === 'Shotgun' || weaponName === 'Auto Shot') osc.frequency.setValueAtTime(300, now);
        else if (weaponName === 'Machine Gun' || weaponName === 'Minigun') osc.frequency.setValueAtTime(500, now);
        else if (weaponName === 'Laser Gun') { osc.type = 'sine'; osc.frequency.setValueAtTime(1500, now); }
        else osc.frequency.setValueAtTime(800, now); 
        osc.frequency.exponentialRampToValueAtTime(0.01, now + 0.1);
        gain.gain.setValueAtTime(weaponName==='Laser Gun' ? 0.1 : 0.5, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    }
    osc.connect(gain); gain.connect(audioCtx.destination); osc.start(now); osc.stop(now + 0.8);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 4, 0); 
scene.add(camera);

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);

const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || ('ontouchstart' in window);

renderer.setPixelRatio(isMobile ? Math.min(window.devicePixelRatio, 1.5) : window.devicePixelRatio);
renderer.shadowMap.enabled = !isMobile; 

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight; camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

const gameMap = createZombieMap(scene); 
scene.add(gameMap); scene.updateMatrixWorld(true);
const staticColliders = [];
if (gameMap.userData.colliders) {
    gameMap.userData.colliders.forEach(c => { c.updateMatrixWorld(true); const box = new THREE.Box3().setFromObject(c); if (box.max.y - box.min.y > 0.5) staticColliders.push(box); });
}

const gunLight = new THREE.PointLight(0xffffff, 2.0, 5); gunLight.position.set(0.5, -0.5, -1); camera.add(gunLight);
const damageFlash = document.createElement('div');
damageFlash.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; background-color:#ff0000; opacity:0; pointer-events:none; z-index:5;';
document.body.appendChild(damageFlash); let damageAlpha = 0;

const radarUI = document.createElement('div');
radarUI.style.cssText = 'position:absolute; top:20px; left:20px; width:120px; height:120px; border-radius:50%; background-color:rgba(0,20,0,0.7); border:2px solid #00ff00; overflow:hidden; z-index:10; pointer-events:none;';
document.body.appendChild(radarUI);
const radarCenter = document.createElement('div');
radarCenter.style.cssText = 'position:absolute; top:50%; left:50%; width:6px; height:6px; background-color:#ffffff; border-radius:50%; transform:translate(-50%, -50%);';
radarUI.appendChild(radarCenter);
const radarDots = [];

const playerStats = { hp: 100, coins: 0, speedActive: false, invisActive: false, refillAmmo: false, hudNeedsUpdate: true };
let isGameRunning = false, isPlayerDead = false;
let totalKills = 0; let zombies = []; 
const moveState = { forward: false, backward: false, left: false, right: false };
const velocity = new THREE.Vector3(); let prevTime = performance.now();

let isShooting = false, isAiming = false, isReloading = false; let playerLastFired = 0;
let isMobileMode = false;
let fpsControls = new PointerLockControls(camera, document.body); window.fpsControls = fpsControls; 

const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0); 
let canJump = false; let touchLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let reloadTimeout = null; let spawnTimer = 0; let bulletTracers = []; const activeProjectiles = []; const activeAcid = []; const acidPuddles = []; 

const tracerGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 4); tracerGeo.rotateX(Math.PI / 2);
// THE FIX: Removed Transparency on Tracers. This stops major GPU lag on mobile during rapid fire!
const tracerMat = new THREE.MeshBasicMaterial({ color: 0xffffaa }); 
const projGeo = new THREE.SphereGeometry(0.15, 8, 8); const projMat = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xff5500, emissiveIntensity: 0.5 });
const acidGeo = new THREE.SphereGeometry(0.5, 8, 8); const acidMat = new THREE.MeshBasicMaterial({ color: 0x88ff00 });
const puddleGeo = new THREE.CylinderGeometry(2.5, 2.5, 0.1, 16); const puddleMat = new THREE.MeshBasicMaterial({ color: 0x88ff00, transparent: true, opacity: 0.7 });
const flashGeo = new THREE.SphereGeometry(1.0, 8, 8); const flashMat = new THREE.MeshBasicMaterial({ color: 0xff5500, transparent: true, opacity: 0.8 });

function createTracer(startPoint, direction, distance) {
    const length = Math.min(distance, 100); const tracer = new THREE.Mesh(tracerGeo, tracerMat);
    tracer.scale.set(1, 1, length); tracer.name = "Tracer";
    const midPoint = startPoint.clone().addScaledVector(direction, length / 2);
    tracer.position.copy(midPoint); tracer.lookAt(startPoint.clone().add(direction));
    scene.add(tracer); bulletTracers.push({ mesh: tracer, life: 1.0 }); 
}

const arsenal = [
    { name: 'Pistol', type: 'hitscan', dmg: 35, spread: 0.02, fireRate: 0.3, isAuto: false, mag: 12, ammo: 12, reload: 1.5, unlock: 0, pos: {x: 0.2, y: -0.2, z: -0.4}, fn: createPistol },
    { name: 'Magnum', type: 'hitscan', dmg: 75, spread: 0.04, fireRate: 0.6, isAuto: false, mag: 7, ammo: 7, reload: 1.8, unlock: 5, pos: {x: 0.2, y: -0.2, z: -0.4}, fn: createPistol },
    { name: 'SMG', type: 'hitscan', dmg: 22, spread: 0.04, fireRate: 0.08, isAuto: true, mag: 40, ammo: 40, reload: 1.8, unlock: 10, pos: {x: 0.2, y: -0.2, z: -0.4}, fn: createSMG },
    { name: 'Burst SMG', type: 'hitscan', dmg: 28, spread: 0.02, fireRate: 0.15, isAuto: true, mag: 24, ammo: 24, reload: 1.5, unlock: 15, pos: {x: 0.2, y: -0.2, z: -0.4}, fn: createSMG },
    { name: 'Shotgun', type: 'hitscan', dmg: 25, spread: 0.12, fireRate: 1.0, isAuto: false, mag: 6, ammo: 6, reload: 2.5, pellets: 8, unlock: 20, pos: {x: 0.2, y: -0.2, z: -0.45}, fn: createShotgun },
    { name: 'Auto Shot', type: 'hitscan', dmg: 18, spread: 0.15, fireRate: 0.35, isAuto: true, mag: 10, ammo: 10, reload: 3.0, pellets: 6, unlock: 25, pos: {x: 0.2, y: -0.2, z: -0.45}, fn: createShotgun },
    { name: 'Assault Rifle', type: 'hitscan', dmg: 40, spread: 0.03, fireRate: 0.11, isAuto: true, mag: 30, ammo: 30, reload: 2.2, unlock: 30, pos: {x: 0.2, y: -0.2, z: -0.45}, fn: createAssaultRifle },
    { name: 'Heavy AR', type: 'hitscan', dmg: 55, spread: 0.05, fireRate: 0.18, isAuto: true, mag: 20, ammo: 20, reload: 2.5, unlock: 35, pos: {x: 0.2, y: -0.2, z: -0.45}, fn: createAssaultRifle },
    { name: 'Sniper', type: 'hitscan', dmg: 250, spread: 0.0, fireRate: 1.5, isAuto: false, mag: 5, ammo: 5, reload: 3.5, unlock: 40, pos: {x: 0.25, y: -0.25, z: -0.5}, fn: createSniperRifle },
    { name: 'Machine Gun', type: 'hitscan', dmg: 45, spread: 0.06, fireRate: 0.09, isAuto: true, mag: 100, ammo: 100, reload: 4.5, unlock: 50, pos: {x: 0.25, y: -0.25, z: -0.5}, fn: createMachineGun },
    { name: 'Minigun', type: 'hitscan', dmg: 28, spread: 0.1, fireRate: 0.04, isAuto: true, mag: 200, ammo: 200, reload: 5.5, unlock: 60, pos: {x: 0.25, y: -0.25, z: -0.5}, fn: createMachineGun },
    { name: 'Grenade Launcher', type: 'proj', dmg: 250, spread: 0.05, fireRate: 1.0, isAuto: false, mag: 4, ammo: 4, reload: 3.0, unlock: 70, pos: {x: 0.25, y: -0.2, z: -0.45}, fn: createGrenadeLauncher },
    { name: 'RPG', type: 'proj', dmg: 600, spread: 0.0, fireRate: 2.0, isAuto: false, mag: 1, ammo: 1, reload: 4.0, unlock: 80, pos: {x: 0.3, y: -0.25, z: -0.5}, fn: createRPG },
    { name: 'Laser Gun', type: 'laser', dmg: 10, spread: 0.0, fireRate: 0.0, isAuto: true, mag: 100, ammo: 100, reload: 5.0, unlock: 90, pos: {x: 0.25, y: -0.2, z: -0.4}, fn: createLaserGun },
    { name: 'Railgun', type: 'hitscan', dmg: 1000, spread: 0.0, fireRate: 2.5, isAuto: false, mag: 3, ammo: 3, reload: 4.0, unlock: 100, pos: {x: 0.25, y: -0.2, z: -0.5}, fn: createRailgun }
];
const weaponIcons = ['🔫', '🔫', '💨', '💨', '💥', '💥', '🔫', '🔫', '🔭', '🔥', '🔥', '💣', '🚀', '🔦', '⚡'];

let currentWeaponIndex = 0; let playerWeaponGroup = new THREE.Group(); camera.add(playerWeaponGroup);
let currentRecoilSpread = 0.0;
const muzzleFlash = new THREE.PointLight(0xffdd55, 0, 10); playerWeaponGroup.add(muzzleFlash);
const laserBeamGeo = new THREE.CylinderGeometry(0.02, 0.02, 100, 8); laserBeamGeo.translate(0, 50, 0); laserBeamGeo.rotateX(-Math.PI / 2);
const laserBeam = new THREE.Mesh(laserBeamGeo, new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 }));
laserBeam.visible = false; playerWeaponGroup.add(laserBeam);

function updateHUD() {
    const rScore = document.getElementById('red-score'); const bScore = document.getElementById('blue-score');
    if(rScore) rScore.innerText = "WAVE " + WaveState.currentWave;
    if(bScore) bScore.innerText = totalKills + " KILLS";
    const hpFill = document.getElementById('hp-bar-fill');
    if(hpFill) { hpFill.style.width = Math.max(0, playerStats.hp) + '%'; hpFill.style.background = playerStats.hp < 30 ? '#ff0000' : '#00ff00'; }

    const invNade = document.getElementById('inv-nade'); if(invNade) invNade.innerText = inventory.grenades;
    const invC4 = document.getElementById('inv-c4'); if(invC4) invC4.innerText = inventory.c4;
    const invMine = document.getElementById('inv-mine'); if(invMine) invMine.innerText = inventory.mines;
    const invCoin = document.getElementById('inv-coin'); if(invCoin) invCoin.innerText = playerStats.coins;
    
    const speedUI = document.getElementById('inv-speed');
    if(speedUI) { speedUI.innerText = Math.ceil(inventory.speedTime) + "s (Q)"; speedUI.style.color = playerStats.speedActive ? '#00ff00' : '#aa00ff'; }
    const invisUI = document.getElementById('inv-invis');
    if(invisUI) { invisUI.innerText = Math.ceil(inventory.invisTime) + "s (E)"; invisUI.style.color = playerStats.invisActive ? '#00ff00' : '#00ffff'; }

    const c4Label = document.querySelector('#inv-c4');
    if (c4Label && c4Label.previousElementSibling && c4Label.previousElementSibling.innerText.includes('C4')) { c4Label.previousElementSibling.innerText = "C4 (C) / DETONATE (X)"; }

    playerStats.hudNeedsUpdate = false;
    
    const wBar = document.getElementById('weapon-bar');
    if(wBar) {
        wBar.style.flexWrap = 'nowrap'; wBar.style.justifyContent = 'flex-start'; 
        wBar.style.overflowX = 'auto';
        let html = "";
        arsenal.forEach((w, i) => {
            const isUnlocked = totalKills >= w.unlock;
            const activeCls = (i === currentWeaponIndex) ? 'active unlocked' : (isUnlocked ? 'unlocked' : '');
            const key = i < 9 ? i + 1 : (i === 9 ? 0 : '-'); const icon = weaponIcons[i] || '🔫';
            html += `<div class="weapon-slot ${activeCls}" ${isUnlocked ? `onclick="window.gameSwitchWeapon(${i})"` : ''}>
                        <div class="slot-key">${key}</div><div style="font-size: 18px; line-height: 1;">${icon}</div><div class="slot-name">${w.name.substring(0,4).toUpperCase()}</div>
                     </div>`;
        });
        wBar.innerHTML = html;
    }
}

function equipPlayerWeapon(index) {
    currentWeaponIndex = index;
    for(let i=playerWeaponGroup.children.length-1; i>=0; i--) {
        const c = playerWeaponGroup.children[i]; if (c !== muzzleFlash && c !== laserBeam) playerWeaponGroup.remove(c);
    }
    clearTimeout(reloadTimeout); isReloading = false; laserBeam.visible = false; isAiming = false; 
    const w = arsenal[index]; const wMesh = w.fn();
    wMesh.scale.set(0.6, 0.6, 0.6); wMesh.rotation.y = Math.PI; wMesh.position.set(0, 0, 0); 
    playerWeaponGroup.add(wMesh);
    muzzleFlash.position.set(0, 0.05, -0.4); laserBeam.position.set(0, 0.05, -0.4);
    if(document.getElementById('weapon-name')) document.getElementById('weapon-name').innerText = w.name;
    if(document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = `${Math.floor(w.ammo)} / ${w.mag} AMMO`;
    updateHUD();

    setTimeout(() => {
        const activeSlot = document.querySelector('.weapon-slot.active');
        const wBar = document.getElementById('weapon-bar');
        if (activeSlot && wBar) {
            const scrollLeft = activeSlot.offsetLeft - (wBar.offsetWidth / 2) + (activeSlot.offsetWidth / 2);
            wBar.scrollTo({ left: scrollLeft, behavior: 'smooth' });
        }
    }, 50);
}

function startReload() {
    const w = arsenal[currentWeaponIndex];
    if (isReloading || w.ammo === w.mag) return;
    isReloading = true; if(document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = "RELOADING..."; 
    clearTimeout(reloadTimeout);
    reloadTimeout = setTimeout(() => { 
        if (!isGameRunning || isPlayerDead) return; w.ammo = w.mag; isReloading = false; 
        if (arsenal[currentWeaponIndex] === w && document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = `${w.ammo} / ${w.mag} AMMO`; 
    }, w.reload * 1000);
}

function attemptShoot() {
    const w = arsenal[currentWeaponIndex]; const timeNow = performance.now() / 1000;
    if (w.type === 'laser') return; 
    if (timeNow - playerLastFired < w.fireRate || w.ammo <= 0) return; 
    if (timeNow - playerLastFired > w.fireRate + 0.25) currentRecoilSpread = 0.0; 

    w.ammo--; playerLastFired = timeNow; playGunSound(w.name);
    if(document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = `${w.ammo} / ${w.mag} AMMO`;

    muzzleFlash.intensity = 5.0; 
    playerWeaponGroup.position.z += 0.08; playerWeaponGroup.position.y += 0.02; playerWeaponGroup.rotation.x += 0.08;

    const euler = new THREE.Euler(0, 0, 0, 'YXZ'); euler.setFromQuaternion(camera.quaternion);
    euler.x += 0.02; euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x)); euler.y += (Math.random() - 0.5) * 0.02;   
    camera.quaternion.setFromEuler(euler);

    let landedHit = false; let pellets = w.pellets || 1;

    const muzzleWorldPos = new THREE.Vector3();
    muzzleFlash.getWorldPosition(muzzleWorldPos);

    // THE FIX: Create the target array exactly ONCE per shot, NOT per pellet!
    const targetObjects = [gameMap];
    zombies.forEach(z => {
        if (!z.dead) {
            targetObjects.push(z.mesh);
            // Tag the mesh hierarchy with O(1) direct reference!
            if (!z.mesh.userData.isTagged) {
                z.mesh.traverse(child => { child.userData.zombieRef = z; });
                z.mesh.userData.isTagged = true;
            }
        }
    });

    if (w.type === 'proj') {
        const pMesh = new THREE.Mesh(projGeo, projMat); 
        raycaster.setFromCamera(screenCenter, camera); const pDir = raycaster.ray.direction.clone().normalize();
        pMesh.position.copy(muzzleWorldPos);
        scene.add(pMesh);
        activeProjectiles.push({ mesh: pMesh, velocity: pDir.multiplyScalar(w.name === 'RPG' ? 60 : 30), damage: w.dmg, radius: w.name === 'RPG' ? 15 : 8, gravity: w.name === 'RPG' ? 0 : -20 });
    } else {
        for(let p = 0; p < pellets; p++) {
            let actualSpread = w.name.includes('Shotgun') ? w.spread : currentRecoilSpread;
            if (isAiming) actualSpread *= 0.5;
            raycaster.setFromCamera(screenCenter, camera); const shootDir = raycaster.ray.direction.clone();
            shootDir.x += (Math.random() - 0.5) * actualSpread; shootDir.y += (Math.random() - 0.5) * actualSpread; shootDir.z += (Math.random() - 0.5) * actualSpread; shootDir.normalize();
            raycaster.set(camera.position, shootDir);

            let hitDistance = 100;
            const intersects = raycaster.intersectObjects(targetObjects, true);

            for (let i = 0; i < intersects.length; i++) {
                let hitObj = intersects[i].object;
                if (hitObj === laserBeam || hitObj === muzzleFlash || hitObj.name === "Tracer") continue;
                
                // THE FIX: O(1) Instant Hit Detection! No more tree-traversal looping!
                let targetZ = hitObj.userData.zombieRef;

                if (targetZ && !targetZ.dead) {
                    hitDistance = intersects[i].distance;
                    const hitHeight = intersects[i].point.y - targetZ.mesh.position.y;
                    const isHeadshot = (hitObj.name === 'BotHead') || (hitHeight > 1.2); 
                    let dmg = isHeadshot ? w.dmg * 2.5 : w.dmg; targetZ.hp -= dmg; landedHit = true;

                    if (targetZ.hp <= 0) {
                        if (Math.random() < 0.20) spawnItemDrop(targetZ.mesh.position.clone(), scene, playerStats);
                        targetZ.dead = true; targetZ.state = "falling"; updateZombieAnimation(targetZ, timeNow, 0, 0); totalKills++; 
                        const nextGunIndex = arsenal.findIndex(gn => gn.unlock === totalKills);
                        if (nextGunIndex !== -1) equipPlayerWeapon(nextGunIndex); else updateHUD();
                        setTimeout(() => { scene.remove(targetZ.mesh); zombies = zombies.filter(zo => zo !== targetZ); }, 3000);
                    } else if (w.name.includes('Shotgun') || w.name === 'Sniper' || w.name === 'Railgun') {
                        if (targetZ.state === "running" && targetZ.type !== 2 && targetZ.type !== 7) { targetZ.state = "falling"; targetZ.stateTimer = 0; targetZ.velocity.addScaledVector(shootDir, 30.0); }
                    }
                    break; 
                } else if (!targetZ) { 
                    // Hit the map
                    hitDistance = intersects[i].distance; 
                    break; 
                }
            }
            createTracer(muzzleWorldPos.clone(), shootDir, hitDistance);
        }
    }
    if (landedHit) { const crosshairUI = document.getElementById('crosshair'); if(crosshairUI) { crosshairUI.style.color = '#ff0000'; crosshairUI.innerText = 'X'; setTimeout(() => { crosshairUI.style.color = '#00ff00'; crosshairUI.innerText = '+'; }, 150); } }
    if (w.ammo <= 0) startReload();
    currentRecoilSpread = Math.min(w.spread, currentRecoilSpread + (w.spread / 3)); 
}

function explodeAt(pos, radius, damage) {
    const flash = new THREE.Mesh(flashGeo, flashMat); flash.scale.set(radius * 0.8, radius * 0.8, radius * 0.8);
    flash.position.copy(pos); scene.add(flash); setTimeout(() => scene.remove(flash), 150); playGunSound('RPG'); 
    zombies.forEach(z => {
        if (z.dead) return;
        const dist = z.mesh.position.distanceTo(pos);
        if (dist <= radius) {
            z.hp -= damage;
            const push = new THREE.Vector3().subVectors(z.mesh.position, pos);
            push.y = 0; if (push.lengthSq() > 0.001) push.normalize(); else push.set(1, 0, 0);
            z.velocity.x += push.x * 50; z.velocity.z += push.z * 50; z.velocityY += 15; z.stateTimer = 0; z.isDiving = false;
            if (z.hp <= 0) {
                if (Math.random() < 0.20) spawnItemDrop(z.mesh.position.clone(), scene, playerStats);
                z.state = "blasted"; z.dead = true; totalKills++; 
                const nextGunIndex = arsenal.findIndex(gn => gn.unlock === totalKills);
                if (nextGunIndex !== -1) equipPlayerWeapon(nextGunIndex); else updateHUD();
                setTimeout(() => { scene.remove(z.mesh); zombies = zombies.filter(zo => zo !== z); }, 3000);
            } else { z.state = "falling"; }
        }
    });
}

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('mousedown', (e) => { 
    initAudio(); if (!isGameRunning || isPlayerDead || isMobileMode) return; 
    if (!fpsControls.isLocked) { fpsControls.lock(); return; } 
    if (e.button === 0) { isShooting = true; if (!arsenal[currentWeaponIndex].isAuto) attemptShoot(); } else if (e.button === 2) isAiming = true;
});
document.addEventListener('mouseup', (e) => { if (!isMobileMode) { if (e.button === 0) isShooting = false; if (e.button === 2) isAiming = false; } });
document.addEventListener('wheel', (e) => {
    if (!isGameRunning || isPlayerDead || isMobileMode) return; let nextIdx = currentWeaponIndex; let found = false;
    if (e.deltaY > 0) { for (let i = 1; i < arsenal.length; i++) { let checkIdx = (currentWeaponIndex + i) % arsenal.length; if (totalKills >= arsenal[checkIdx].unlock) { nextIdx = checkIdx; found = true; break; } } } 
    else { for (let i = 1; i < arsenal.length; i++) { let checkIdx = (currentWeaponIndex - i + arsenal.length) % arsenal.length; if (totalKills >= arsenal[checkIdx].unlock) { nextIdx = checkIdx; found = true; break; } } }
    if (found && nextIdx !== currentWeaponIndex) window.switchWeaponFromJS(nextIdx);
});
document.addEventListener('keydown', (e) => {
    if (isPlayerDead || isMobileMode) return;
    if (e.code === 'KeyW') moveState.forward = true; if (e.code === 'KeyS') moveState.backward = true;
    if (e.code === 'KeyA') moveState.left = true; if (e.code === 'KeyD') moveState.right = true;
    if (e.code === 'Space' && canJump) { velocity.y += 30; canJump = false; }
    if (e.code === 'KeyR') startReload();
    const keyMap = { 'Digit1':0, 'Digit2':1, 'Digit3':2, 'Digit4':3, 'Digit5':4, 'Digit6':5, 'Digit7':6, 'Digit8':7, 'Digit9':8, 'Digit0':9 };
    if (keyMap[e.code] !== undefined) { const idx = keyMap[e.code]; if (idx < arsenal.length && totalKills >= arsenal[idx].unlock) window.switchWeaponFromJS(idx); }
    if (e.code === 'KeyG') { useExplosive('grenade', camera, scene); playerStats.hudNeedsUpdate = true; }
    if (e.code === 'KeyC') { useExplosive('c4', camera, scene); playerStats.hudNeedsUpdate = true; }
    if (e.code === 'KeyV') { useExplosive('mine', camera, scene); playerStats.hudNeedsUpdate = true; }
    if (e.code === 'KeyX') { detonateC4(); playerStats.hudNeedsUpdate = true; }
    if (e.code === 'KeyQ') { playerStats.speedActive = !playerStats.speedActive; playerStats.hudNeedsUpdate = true; }
    if (e.code === 'KeyE') { playerStats.invisActive = !playerStats.invisActive; playerStats.hudNeedsUpdate = true; }
});
document.addEventListener('keyup', (e) => {
    if (isMobileMode) return;
    if (e.code === 'KeyW') moveState.forward = false; if (e.code === 'KeyS') moveState.backward = false;
    if (e.code === 'KeyA') moveState.left = false; if (e.code === 'KeyD') moveState.right = false;
});

window.switchWeaponFromJS = function(index) { if (!isPlayerDead && currentWeaponIndex !== index && index < arsenal.length) equipPlayerWeapon(index); };

export function bootMatch(isMobile, diffMode) {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    isMobileMode = isMobile || isTouchDevice; 

    initAudio(); isGameRunning = true; 
    arsenal.forEach(w => w.ammo = w.mag);
    equipPlayerWeapon(0); startHorrorMusic(); updateHUD(); 
    
    if(isMobileMode) {
        
        radarUI.style.width = '75px';
        radarUI.style.height = '75px';
        radarUI.style.top = '10px';
        radarUI.style.left = '10px';

        setupMobileControls(camera, moveState, touchLookEuler,
            { isRunning: () => isGameRunning, isDead: () => isPlayerDead }, 
            {
                initAudio: initAudio, setShooting: (val) => { isShooting = val; },
                attemptShoot: () => { if (!arsenal[currentWeaponIndex].isAuto && !isReloading) attemptShoot(); },
                toggleAim: () => { isAiming = !isAiming; }, jump: () => { if(canJump) { velocity.y += 30; canJump = false; } },
                reload: startReload, throwNade: () => { useExplosive('grenade', camera, scene); playerStats.hudNeedsUpdate = true; },
                detonateC4: () => { detonateC4(); playerStats.hudNeedsUpdate = true; }
            }
        );

        const btnC4 = document.getElementById('btn-c4');
        if (btnC4) btnC4.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); useExplosive('c4', camera, scene); playerStats.hudNeedsUpdate = true; }, {passive: false});

        const btnDet = document.getElementById('btn-det');
        if (btnDet) btnDet.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); detonateC4(); playerStats.hudNeedsUpdate = true; }, {passive: false});

        const btnMine = document.getElementById('btn-mine');
        if (btnMine) btnMine.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); useExplosive('mine', camera, scene); playerStats.hudNeedsUpdate = true; }, {passive: false});

        const btnSpd = document.getElementById('btn-spd');
        if (btnSpd) btnSpd.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); playerStats.speedActive = !playerStats.speedActive; playerStats.hudNeedsUpdate = true; }, {passive: false});

        const btnInv = document.getElementById('btn-inv');
        if (btnInv) btnInv.addEventListener('touchstart', (e) => { e.preventDefault(); initAudio(); playerStats.invisActive = !playerStats.invisActive; playerStats.hudNeedsUpdate = true; }, {passive: false});
    }

    camera.position.set(0, 4, 0); camera.rotation.set(0, 0, 0); velocity.set(0, 0, 0);

    let hackDone = false;
    function renderHack() {
        if (!hackDone) {
            const dummies = [];
            for(let i=1; i<=8; i++) { const dummy = createZombie(i); dummy.position.set(0, -100, 0); scene.add(dummy); dummies.push(dummy); }
            renderer.render(scene, camera); dummies.forEach(d => scene.remove(d)); prevTime = performance.now(); 
            hackDone = true;
            animate();
        }
    }
    setTimeout(renderHack, 50);
}

const waveWarningsSent = new Set();
const HORROR_TEXT = {
    "1": "THEY HAVE FOUND YOU",
    "2": "SPRINTERS INCOMING",
    "4": "ACID SPITTERS EMERGE",
    "6": "COIN SNATCHERS AWAKEN",
    "8": "DODGERS APPROACH",
    "10": "THE JUGGERS ARE NEAR",
    "12": "TANK ZOMBIES DETECTED",
    "15": "THE INFECTION PEAKS",
    "20": "GRAND INFECTION ARRIVE",
    "25": "APOCALYPSE NOW"
};

const _moveDir = new THREE.Vector3();
const _pushVec = new THREE.Vector3();
const _zBox = new THREE.Box3();
const _pBoxX = new THREE.Box3();
const _pBoxZ = new THREE.Box3();
const _prevCamX = new THREE.Vector3();
const _prevCamZ = new THREE.Vector3();
const _mathDirR = new THREE.Vector3();
const _mathDirF = new THREE.Vector3();
const _zeroVec = new THREE.Vector3(0, 0, 0);
const _pSize = new THREE.Vector3(0.6, 3.8, 0.6);
const _zCenterTemp = new THREE.Vector3();

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(); const timeSec = time / 1000; const delta = Math.min((time - prevTime) / 1000, 0.1);

    if (isGameRunning) {
        if (!isPlayerDead) {
            
            const w = arsenal[currentWeaponIndex];
            let targetFov = 75; if (isAiming) targetFov = w.name === 'Sniper' ? 20 : 45; 
            camera.fov += (targetFov - camera.fov) * 15 * delta; camera.updateProjectionMatrix();

            if (damageAlpha > 0) { damageAlpha = Math.max(0, damageAlpha - delta * 2); damageFlash.style.opacity = damageAlpha.toString(); }

            if (playerStats.speedActive) { if (inventory.speedTime > 0) { inventory.speedTime -= delta; playerStats.hudNeedsUpdate = true; } else { playerStats.speedActive = false; inventory.speedTime = 0; playerStats.hudNeedsUpdate = true; } }
            if (playerStats.invisActive) { if (inventory.invisTime > 0) { inventory.invisTime -= delta; playerStats.hudNeedsUpdate = true; } else { playerStats.invisActive = false; inventory.invisTime = 0; playerStats.hudNeedsUpdate = true; } }
            if (playerStats.refillAmmo) { arsenal.forEach(w => w.ammo = w.mag); if(document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = "MAX AMMO"; playerStats.refillAmmo = false; }
            if (playerStats.hudNeedsUpdate) updateHUD();

            velocity.y -= 98 * delta; camera.position.y += velocity.y * delta;
            let currentFloor = 0; const playerRadius = 0.3; 
            for(let box of staticColliders) { 
                if (Math.abs((box.max.x + box.min.x)/2 - camera.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - camera.position.z) > 10) continue;
                if (camera.position.x + playerRadius > box.min.x && camera.position.x - playerRadius < box.max.x && camera.position.z + playerRadius > box.min.z && camera.position.z - playerRadius < box.max.z) { 
                    if (box.max.y < camera.position.y) currentFloor = Math.max(currentFloor, box.max.y); 
                } 
            }
            if (camera.position.y - 4 <= currentFloor) { velocity.y = 0; camera.position.y = currentFloor + 4; canJump = true; }
            if (camera.position.y < 1.0) { camera.position.y = 4.0; velocity.y = 0; canJump = true; }

            velocity.x -= velocity.x * 10.0 * delta; velocity.z -= velocity.z * 10.0 * delta; 
            
            _moveDir.set(0,0,0);
            if (moveState.forward) _moveDir.z += 1; if (moveState.backward) _moveDir.z -= 1;
            if (moveState.left) _moveDir.x -= 1; if (moveState.right) _moveDir.x += 1;
            _moveDir.normalize();
            
            const speed = playerStats.speedActive ? 300.0 : 200.0;
            if (_moveDir.z !== 0) velocity.z += _moveDir.z * speed * delta;
            if (_moveDir.x !== 0) velocity.x += _moveDir.x * speed * delta;

            _prevCamX.copy(camera.position); 
            
            if (!isMobileMode) { fpsControls.moveRight(velocity.x * delta); } else {
                _mathDirR.set(1, 0, 0).applyQuaternion(camera.quaternion);
                _mathDirR.y = 0; if (_mathDirR.lengthSq() > 0.0001) _mathDirR.normalize(); else _mathDirR.set(1, 0, 0);
                camera.position.addScaledVector(_mathDirR, velocity.x * delta);
            }
            
            _zCenterTemp.set(camera.position.x, camera.position.y - 2.0, camera.position.z);
            _pBoxX.setFromCenterAndSize(_zCenterTemp, _pSize);
            for(let box of staticColliders) { 
                if (Math.abs((box.max.x + box.min.x)/2 - camera.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - camera.position.z) > 10) continue;
                if(_pBoxX.intersectsBox(box)) { camera.position.copy(_prevCamX); velocity.x = 0; break; } 
            }

            camera.position.x = Math.max(-145, Math.min(145, camera.position.x));

            _prevCamZ.copy(camera.position); 
            
            if (!isMobileMode) { fpsControls.moveForward(velocity.z * delta); } else {
                _mathDirF.set(0, 0, -1).applyQuaternion(camera.quaternion);
                _mathDirF.y = 0; if (_mathDirF.lengthSq() > 0.0001) _mathDirF.normalize(); else _mathDirF.set(0, 0, -1);
                camera.position.addScaledVector(_mathDirF, velocity.z * delta);
            }
            
            _zCenterTemp.set(camera.position.x, camera.position.y - 2.0, camera.position.z);
            _pBoxZ.setFromCenterAndSize(_zCenterTemp, _pSize);
            for(let box of staticColliders) { 
                if (Math.abs((box.max.x + box.min.x)/2 - camera.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - camera.position.z) > 10) continue;
                if(_pBoxZ.intersectsBox(box)) { camera.position.copy(_prevCamZ); velocity.z = 0; break; } 
            }
            
            camera.position.z = Math.max(-145, Math.min(145, camera.position.z));
            
            if (w.type !== 'laser') laserBeam.visible = false;
            
            if (w.type === 'laser') {
                if (isShooting && !isReloading && w.ammo > 0) {
                    laserBeam.visible = true; playGunSound(w.name); w.ammo -= delta * 20; 
                    if(document.getElementById('ammo-count')) document.getElementById('ammo-count').innerText = `${Math.floor(w.ammo)} / ${w.mag} AMMO`;
                    
                    const laserTargets = [gameMap];
                    zombies.forEach(z => { if (!z.dead) { laserTargets.push(z.mesh); if (!z.mesh.userData.isTagged) { z.mesh.traverse(c => c.userData.zombieRef = z); z.mesh.userData.isTagged = true; } } });

                    raycaster.setFromCamera(screenCenter, camera);
                    const intersects = raycaster.intersectObjects(laserTargets, true);
                    
                    if (intersects.length > 0) {
                        let hitObj = intersects[0].object;
                        let targetZ = hitObj.userData.zombieRef;
                        
                        if (targetZ && !targetZ.dead) {
                            targetZ.hp -= w.dmg * delta * 60; 
                            if (targetZ.hp <= 0) {
                                if (Math.random() < 0.20) spawnItemDrop(targetZ.mesh.position.clone(), scene, playerStats);
                                targetZ.dead = true; targetZ.state = "falling"; updateZombieAnimation(targetZ, timeSec, 0, 0); totalKills++; 
                                const nextGunIndex = arsenal.findIndex(gn => gn.unlock === totalKills);
                                if (nextGunIndex !== -1) equipPlayerWeapon(nextGunIndex); else updateHUD();
                                setTimeout(() => { scene.remove(targetZ.mesh); zombies = zombies.filter(zo => zo !== targetZ); }, 3000);
                            }
                        }
                    }
                    if (w.ammo <= 0) { laserBeam.visible = false; startReload(); }
                } else { laserBeam.visible = false; }
            } else { if (isShooting && w.isAuto && !isReloading) attemptShoot(); }

            updateItems(delta, camera, scene, zombies, playerStats, playGunSound);
            if (muzzleFlash.intensity > 0) muzzleFlash.intensity -= delta * 20;
            
            for(let i=bulletTracers.length-1; i>=0; i--) {
                bulletTracers[i].life -= delta * 5; 
                // THE FIX: Do not change opacity to avoid GPU overdraw lag! Just pop it out when it dies!
                if(bulletTracers[i].life <= 0) { scene.remove(bulletTracers[i].mesh); bulletTracers.splice(i,1); }
            }
            
            for(let i=activeProjectiles.length-1; i>=0; i--) {
                const p = activeProjectiles[i]; p.velocity.y += p.gravity * delta; p.mesh.position.addScaledVector(p.velocity, delta);
                let hitBox = false; 
                _zCenterTemp.copy(p.mesh.position);
                _zBox.setFromCenterAndSize(_zCenterTemp, new THREE.Vector3(0.5,0.5,0.5));
                for(let box of staticColliders) { 
                    if (Math.abs((box.max.x + box.min.x)/2 - p.mesh.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - p.mesh.position.z) > 10) continue;
                    if(_zBox.intersectsBox(box)) { hitBox = true; break; } 
                }
                if (hitBox || p.mesh.position.y <= 0) { explodeAt(p.mesh.position, p.radius, p.damage); scene.remove(p.mesh); activeProjectiles.splice(i, 1); } 
                else {
                    let hitZombie = false; zombies.forEach(z => { 
                        if(!z.dead && z.mesh.position.distanceToSquared(p.mesh.position) < 2.25) hitZombie = true; 
                    });
                    if(hitZombie) { explodeAt(p.mesh.position, p.radius, p.damage); scene.remove(p.mesh); activeProjectiles.splice(i, 1); }
                }
            }

            for (let i = activeAcid.length - 1; i >= 0; i--) {
                const acid = activeAcid[i]; acid.userData.velocity.y -= 20 * delta; acid.position.addScaledVector(acid.userData.velocity, delta);
                if (acid.position.y <= 0) { 
                    const puddle = new THREE.Mesh(puddleGeo, puddleMat); puddle.position.copy(acid.position); puddle.position.y = 0.05; 
                    scene.add(puddle); acidPuddles.push({ mesh: puddle, life: 6.0 }); 
                    scene.remove(acid); activeAcid.splice(i, 1); continue; 
                }
                if (acid.position.distanceToSquared(camera.position) < 4.0 && !playerStats.invisActive) {
                    damageAlpha = 0.6; playerStats.hp -= 25; playerStats.hudNeedsUpdate = true; document.getElementById('hp-bar-fill').style.background = '#ff0000';
                    scene.remove(acid); activeAcid.splice(i, 1);
                    if (playerStats.hp <= 0 && !isPlayerDead) {
                        isPlayerDead = true; if(!isMobileMode) fpsControls.unlock();
                        document.getElementById('respawnScreen').style.display = 'flex';
                        document.getElementById('respawnScreen').innerHTML = `<h1 style="font-size: clamp(30px, 8vw, 60px); text-transform: uppercase; color: #ff3333;">You Died</h1><p style="font-size: 20px;">SURVIVED ${WaveState.currentWave - 1} WAVES</p><button class="menu-btn primary" onclick="location.reload()" style="margin-top: 20px;">Try Again</button>`;
                    }
                }
            }

            for (let i = acidPuddles.length - 1; i >= 0; i--) {
                const p = acidPuddles[i]; p.life -= delta; if (p.life < 1.0) p.mesh.material.opacity = p.life * 0.7; 
                const flatDistSq = (camera.position.x - p.mesh.position.x)**2 + (camera.position.z - p.mesh.position.z)**2;
                if (flatDistSq < 6.25 && Math.abs(camera.position.y - 4) < 1.0 && !playerStats.invisActive) {
                    playerStats.hp -= 15 * delta; damageAlpha = Math.max(damageAlpha, 0.3); playerStats.hudNeedsUpdate = true; document.getElementById('hp-bar-fill').style.background = '#ff0000';
                    if (playerStats.hp <= 0 && !isPlayerDead) {
                        isPlayerDead = true; if(!isMobileMode) fpsControls.unlock();
                        document.getElementById('respawnScreen').style.display = 'flex';
                        document.getElementById('respawnScreen').innerHTML = `<h1 style="font-size: clamp(30px, 8vw, 60px); text-transform: uppercase; color: #ff3333;">You Melted</h1><p style="font-size: 20px;">SURVIVED ${WaveState.currentWave - 1} WAVES</p><button class="menu-btn primary" onclick="location.reload()" style="margin-top: 20px;">Try Again</button>`;
                    }
                }
                if (p.life <= 0) { scene.remove(p.mesh); acidPuddles.splice(i, 1); }
            }

            if (camera.position.y < -20 || camera.position.y > 100) {
                camera.position.set(0, 4, 0);
                velocity.set(0, 0, 0);
            }
        }

        if (!isReloading) {
            const basePos = arsenal[currentWeaponIndex].pos; const targetPos = isAiming ? { x: 0, y: -0.15, z: -0.3 } : basePos;
            playerWeaponGroup.position.x += (targetPos.x - playerWeaponGroup.position.x) * 15 * delta;
            playerWeaponGroup.position.y += (targetPos.y - playerWeaponGroup.position.y) * 15 * delta;
            playerWeaponGroup.position.z += (targetPos.z - playerWeaponGroup.position.z) * 15 * delta; 
            playerWeaponGroup.rotation.x += (0 - playerWeaponGroup.rotation.x) * 15 * delta;
            playerWeaponGroup.position.y += Math.sin(timeSec * 2.5) * 0.001; playerWeaponGroup.position.x += Math.cos(timeSec * 2.0) * 0.001;
            if (!isAiming && (moveState.forward || moveState.backward || moveState.left || moveState.right)) {
                playerWeaponGroup.position.y += Math.sin(timeSec * 15) * 0.005; playerWeaponGroup.position.x += Math.cos(timeSec * 7.5) * 0.005;
            }
        } else {
            playerWeaponGroup.position.y += (-0.5 - playerWeaponGroup.position.y) * 10 * delta;
            playerWeaponGroup.rotation.x += (-0.5 - playerWeaponGroup.rotation.x) * 10 * delta;
        }

        const waveCheck = checkWaves(zombies, updateHUD);
        
        const waveStr = WaveState.currentWave.toString();
        if (isGameRunning && !isPlayerDead && HORROR_TEXT[waveStr] && !waveWarningsSent.has(WaveState.currentWave)) {
            const warningEl = document.getElementById('boss-warning');
            if (warningEl) {
                warningEl.innerText = HORROR_TEXT[waveStr];
                warningEl.classList.remove('active');
                void warningEl.offsetWidth; 
                warningEl.classList.add('active');
            }
            waveWarningsSent.add(WaveState.currentWave);
        }

        spawnTimer -= delta;
        if (waveCheck.canSpawn && spawnTimer <= 0) { 
            let burstCount = Math.floor(Math.random() * 3) + 1;
            burstCount = Math.min(burstCount, WaveState.zombiesToSpawn);
            for(let i=0; i<burstCount; i++) {
                spawnZombie(scene, camera, staticColliders, zombies); 
                WaveState.zombiesToSpawn--;
            }
            spawnTimer = 0.5 + Math.random() * 1.0; 
        }

        const aliveZombies = zombies.filter(z => !z.dead);
        while(radarDots.length < aliveZombies.length) {
            const dot = document.createElement('div'); 
            dot.style.cssText = 'position:absolute; width:4px; height:4px; background-color:#ff0000; border-radius:50%; z-index:11; top:50%; left:50%; margin-top:-2px; margin-left:-2px;';
            radarUI.appendChild(dot); radarDots.push(dot);
        }
        while(radarDots.length > aliveZombies.length) { const dot = radarDots.pop(); radarUI.removeChild(dot); }

        _mathDirF.set(0, 0, -1).applyQuaternion(camera.quaternion); _mathDirF.y = 0; 
        if (_mathDirF.lengthSq() > 0.001) _mathDirF.normalize(); else _mathDirF.set(0, 0, -1);
        _mathDirR.set(1, 0, 0).applyQuaternion(camera.quaternion); _mathDirR.y = 0; 
        if (_mathDirR.lengthSq() > 0.001) _mathDirR.normalize(); else _mathDirR.set(1, 0, 0);
        
        const radarRadius = isMobileMode ? 33 : 56; 

        aliveZombies.forEach((z, i) => {
            _pushVec.subVectors(z.mesh.position, camera.position);
            let radarX = _pushVec.dot(_mathDirR);
            let radarZ = _pushVec.dot(_mathDirF);
            const dist = Math.hypot(radarX, radarZ);

            if (dist > radarRadius) {
                radarX = (radarX / dist) * radarRadius;
                radarZ = (radarZ / dist) * radarRadius;
            }

            radarDots[i].style.transform = `translate(${radarX}px, ${-radarZ}px)`;
        });
        
        zombies.forEach(z => {
            if (z.dead) {
                if (z.killedByExplosion) {
                    z.killedByExplosion = false; totalKills++; const nextGunIndex = arsenal.findIndex(gn => gn.unlock === totalKills);
                    if (nextGunIndex !== -1) equipPlayerWeapon(nextGunIndex); else updateHUD();
                    setTimeout(() => { scene.remove(z.mesh); zombies = zombies.filter(zo => zo !== z); }, 3000);
                }
                if (z.state === "blasted" || z.state === "falling") { z.stateTimer += delta; updateZombieAnimation(z, timeSec, delta, 0); }
                return;
            }
            if (z.mesh.position.y < -5 || Math.abs(z.mesh.position.x) > 145 || Math.abs(z.mesh.position.z) > 145) { z.hp = 0; }

            const isPlayerInvisible = playerStats.invisActive;
            zombies.forEach(otherZ => {
                if (otherZ !== z && !otherZ.dead && otherZ.state !== "falling" && otherZ.state !== "waking" && otherZ.state !== "tripping" && otherZ.state !== "blasted") {
                    
                    const distSq = z.mesh.position.distanceToSquared(otherZ.mesh.position);
                    if (distSq > 0 && distSq < 2.25) { 
                        _pushVec.subVectors(z.mesh.position, otherZ.mesh.position); _pushVec.y = 0; 
                        if (_pushVec.lengthSq() > 0.001) _pushVec.normalize(); else _pushVec.set(1, 0, 0);
                        if (Math.random() < 0.05 && z.state === "running") { z.state = "falling"; z.stateTimer = 0; z.velocity.x += _pushVec.x * 20.0; z.velocity.z += _pushVec.z * 20.0; } 
                        else if (z.state === "running") { z.velocity.x += _pushVec.x * 40.0 * delta; z.velocity.z += _pushVec.z * 40.0 * delta; }
                    }
                }
            });

            z.velocityY -= 40.0 * delta; z.mesh.position.y += z.velocityY * delta;
            const floorHeight = z.type === 3 ? 0.5 : 1.5; 
            if (z.mesh.position.y <= floorHeight) { z.mesh.position.y = floorHeight; z.velocityY = 0; z.isDiving = false; }

            const targetPos = isPlayerInvisible ? _zeroVec : camera.position;
            _moveDir.subVectors(targetPos, z.mesh.position); _moveDir.y = 0; _moveDir.normalize();
            const distToTargetSq = z.mesh.position.distanceToSquared(targetPos);

            if (z.state === "falling" || z.state === "tripping" || z.state === "blasted") {
                z.stateTimer += delta; if (z.state !== "blasted" && z.stateTimer > 1.5) { z.state = (z.state === "tripping") ? "waking_front" : "waking"; z.stateTimer = 0; } 
            } else if (z.state === "waking" || z.state === "waking_front") {
                z.stateTimer += delta; if (z.stateTimer > 1.0) { z.state = "running"; z.stateTimer = 0; } 
            } else if (z.state === "diving") {
                z.velocity.x += _moveDir.x * z.speed * 4.0 * delta; z.velocity.z += _moveDir.z * z.speed * 4.0 * delta;
                if (z.mesh.position.y <= floorHeight) { z.mesh.position.y = floorHeight; z.velocityY = 0; z.state = "running"; }
            } else { 
                z.diveCooldown -= delta;
                if (!isPlayerInvisible && z.type !== 2 && z.type !== 3 && z.type !== 7 && distToTargetSq < 64.0 && distToTargetSq > 16.0 && z.diveCooldown <= 0) {
                    if (Math.random() < 0.60) { z.state = "diving"; z.velocityY = 10.0; z.diveCooldown = 3.0; } else { z.diveCooldown = 1.0; }
                }
                if (z.type === 7 && !isPlayerInvisible && distToTargetSq < 625 && distToTargetSq > 16 && z.state === "running") {
                    z.spitCooldown = (z.spitCooldown || 0) - delta;
                    if (z.spitCooldown <= 0) {
                        z.spitCooldown = 3.0 + Math.random() * 2.0; const acid = new THREE.Mesh(acidGeo, acidMat); acid.position.copy(z.mesh.position); acid.position.y += 3.0; 
                        const spitDir = new THREE.Vector3().subVectors(camera.position, acid.position).normalize();
                        acid.userData = { velocity: spitDir.multiplyScalar(20).add(new THREE.Vector3(0, 5, 0)) };
                        scene.add(acid); activeAcid.push(acid);
                    }
                }
                let currentSpeed = z.isDiving ? z.speed * 2.5 : z.speed; if (isPlayerInvisible) currentSpeed *= 0.2; 
                z.velocity.x += _moveDir.x * currentSpeed * 4.0 * delta; z.velocity.z += _moveDir.z * currentSpeed * 4.0 * delta;
            }

            if (z.state !== "falling" && z.state !== "tripping" && z.state !== "waking" && z.state !== "waking_front" && z.state !== "blasted") { z.mesh.lookAt(targetPos.x, floorHeight, targetPos.z); }
            z.velocity.x -= z.velocity.x * 5.0 * delta; z.velocity.z -= z.velocity.z * 5.0 * delta;

            const zSize = z.type === 7 ? new THREE.Vector3(3.6, 6.0, 3.6) : new THREE.Vector3(1.2, 2.0, 1.2); 
            const zCenterY = z.type === 7 ? 4.0 : 2.5; 
            
            let tripped = false; const oldZx = z.mesh.position.x; z.mesh.position.x += z.velocity.x * delta;
            
            _zCenterTemp.set(z.mesh.position.x, zCenterY, z.mesh.position.z);
            _zBox.setFromCenterAndSize(_zCenterTemp, zSize);
            for(let box of staticColliders) { 
                if (Math.abs((box.max.x + box.min.x)/2 - z.mesh.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - z.mesh.position.z) > 10) continue;
                if(_zBox.intersectsBox(box)) { if (box.max.y <= 2.8) { if (z.state === "running") tripped = true; } else { z.mesh.position.x = oldZx; z.velocity.x *= -0.5; } break; } 
            }

            z.mesh.position.x = Math.max(-145, Math.min(145, z.mesh.position.x));

            const oldZz = z.mesh.position.z; z.mesh.position.z += z.velocity.z * delta;
            _zCenterTemp.set(z.mesh.position.x, zCenterY, z.mesh.position.z);
            _zBox.setFromCenterAndSize(_zCenterTemp, zSize);
            for(let box of staticColliders) { 
                if (Math.abs((box.max.x + box.min.x)/2 - z.mesh.position.x) > 10 || Math.abs((box.max.z + box.min.z)/2 - z.mesh.position.z) > 10) continue;
                if(_zBox.intersectsBox(box)) { if (box.max.y <= 2.8) { if (z.state === "running") tripped = true; } else { z.mesh.position.z = oldZz; z.velocity.z *= -0.5; } break; } 
            }

            z.mesh.position.z = Math.max(-145, Math.min(145, z.mesh.position.z));

            if (tripped) { z.state = "tripping"; z.stateTimer = 0; z.velocityY = 14.0; z.velocity.x += _moveDir.x * 15.0; z.velocity.z += _moveDir.z * 15.0; }
            z.walkCycle += delta * z.speed * (isPlayerInvisible ? 1.0 : 2.5); updateZombieAnimation(z, timeSec, delta, Math.sqrt(distToTargetSq));

            const heightDiff = Math.abs(camera.position.y - z.mesh.position.y);
            const attackRangeSq = z.type === 7 ? 20.25 : 6.25;

            if (!isPlayerInvisible && distToTargetSq < attackRangeSq && heightDiff < 5.0 && (z.state === "running" || z.state === "waking" || z.state === "waking_front")) {
                damageAlpha = 0.5; let dmgAmt = 20; if (z.type === 2) dmgAmt = 40; if (z.type === 7) dmgAmt = 50;
                playerStats.hp -= dmgAmt * delta; playerStats.hudNeedsUpdate = true; document.getElementById('hp-bar-fill').style.background = '#ff0000';
                if (playerStats.hp <= 0 && !isPlayerDead) {
                    isPlayerDead = true; if(!isMobileMode) fpsControls.unlock();
                    document.getElementById('respawnScreen').style.display = 'flex';
                    document.getElementById('respawnScreen').innerHTML = `<h1 style="font-size: clamp(30px, 8vw, 60px); text-transform: uppercase; color: #ff3333;">You Died</h1><p style="font-size: 20px;">SURVIVED ${WaveState.currentWave - 1} WAVES</p><button class="menu-btn primary" onclick="location.reload()" style="margin-top: 20px;">Try Again</button>`;
                }
            }
        });
    }
    prevTime = time; renderer.render(scene, camera);
}
