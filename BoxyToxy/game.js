import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { createPistol, createAssaultRifle, createShotgun, createSniperRifle } from './Weapon.js';
import { createTDMMap } from './Map.js';
import { updatePlayerPhysics } from './Physics.js';
import { spawnBots, updateBots, killBot, getBots } from './BotAI.js'; 
import { setupMobileControls } from './MobileControls.js'; 

let audioCtx = null;
let musicInterval = null;

function initAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
}

function startActionMusic() {
    if (!audioCtx || musicInterval) return;
    const musicGain = audioCtx.createGain();
    musicGain.gain.value = 0.35; 
    musicGain.connect(audioCtx.destination);
    
    const notes = [82.41, 82.41, 97.99, 110.00, 82.41, 82.41, 123.47, 110.00];
    let step = 0;
    
    musicInterval = setInterval(() => {
        if (!isGameRunning) { clearInterval(musicInterval); musicInterval = null; return; }
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'square'; osc.frequency.value = notes[step % notes.length];
        osc.connect(gain); gain.connect(musicGain);
        gain.gain.setValueAtTime(0.6, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);

        if (step % 4 === 0) {
            const kick = audioCtx.createOscillator();
            const kickGain = audioCtx.createGain();
            kick.frequency.setValueAtTime(150, now); kick.frequency.exponentialRampToValueAtTime(0.01, now + 0.5);
            kick.connect(kickGain); kickGain.connect(musicGain);
            kickGain.gain.setValueAtTime(2.0, now); kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
            kick.start(now); kick.stop(now + 0.5);
        }
        step++;
    }, 200); 
}

export function playGunSound(weaponName, distance = 0) {
    if (!audioCtx) return;
    let volume = 1.0 - (distance / 120);
    if (volume <= 0) return; 

    const bufferSize = audioCtx.sampleRate * 0.5; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1; 
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass';
    const gain = audioCtx.createGain();
    
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    
    let baseVol = 0.8 * volume; let heavyVol = 1.6 * volume;

    if (weaponName === 'Pistol') { filter.frequency.value = 1000; gain.gain.setValueAtTime(baseVol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); noise.start(now); noise.stop(now + 0.1); } 
    else if (weaponName === 'Assault Rifle') { filter.frequency.value = 800; gain.gain.setValueAtTime(baseVol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15); noise.start(now); noise.stop(now + 0.15); } 
    else if (weaponName === 'Shotgun') { filter.frequency.value = 400; gain.gain.setValueAtTime(heavyVol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3); noise.start(now); noise.stop(now + 0.3); } 
    else if (weaponName === 'Sniper') { filter.frequency.value = 1500; gain.gain.setValueAtTime(heavyVol, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5); noise.start(now); noise.stop(now + 0.5); }
}

function playFootstepSound() {
    if (!audioCtx) return;
    const bufferSize = audioCtx.sampleRate * 0.1; 
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1; 
    const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
    const filter = audioCtx.createBiquadFilter(); filter.type = 'lowpass'; filter.frequency.value = 300; 
    const gain = audioCtx.createGain(); gain.gain.setValueAtTime(0.2, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
    noise.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    noise.start(audioCtx.currentTime); noise.stop(audioCtx.currentTime + 0.1);
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
camera.position.set(0, 4, 0); 
scene.add(camera);

const canvas = document.getElementById('gameCanvas');
const renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

window.addEventListener('resize', () => {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }
});

const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8); dirLight.position.set(10, 20, 10); dirLight.castShadow = true; scene.add(dirLight);

const gameMap = createTDMMap(); scene.add(gameMap);
const mapColliders = [...gameMap.userData.colliders];

let isGameRunning = false, isPlayerDead = false;
const moveState = { forward: false, backward: false, left: false, right: false };
let canJump = false;
const velocity = new THREE.Vector3(); let prevTime = performance.now();

const WINNING_KILLS = 50; 
let gameTimeRemaining = 10 * 60; 

let playerHP = 100;
const PLAYER_TEAM = 'blue'; 
let playerName = "GUEST"; 

let playerSpawnTime = 0; 
let lastDamageTime = 0; const REGEN_DELAY = 5.0; const REGEN_RATE = 25.0; 
let isShooting = false, isAiming = false, isReloading = false;
let playerLastFired = 0, gunRecoil = 0;
let lastFootstepTime = 0; 
let currentRecoilSpread = 0; 

const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
let isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || isTouchDevice;

let touchLookEuler = new THREE.Euler(0, 0, 0, 'YXZ');
let lastTouchX = 0, lastTouchY = 0;

const fpsControls = new PointerLockControls(camera, document.body);
window.fpsControls = fpsControls; 
const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0); 

const hpBarFill = document.getElementById('hp-bar-fill');
const weaponLabel = document.getElementById('weapon-name');
const ammoLabel = document.getElementById('ammo-count'); 
const timerUI = document.getElementById('timer');
const crosshairUI = document.getElementById('crosshair');

const damageFlash = document.createElement('div');
damageFlash.style.position = 'absolute'; damageFlash.style.top = '0'; damageFlash.style.left = '0'; damageFlash.style.width = '100%'; damageFlash.style.height = '100%'; damageFlash.style.backgroundColor = 'red'; damageFlash.style.opacity = '0'; damageFlash.style.pointerEvents = 'none'; damageFlash.style.transition = 'opacity 0.1s ease-out'; damageFlash.style.zIndex = '10'; document.body.appendChild(damageFlash);

const arsenal = [
    { name: 'Pistol', bodyDamage: 25, headDamage: 100, pellets: 1, spread: 0.02, fireRate: 0.3, isAuto: false, magSize: 12, currentAmmo: 12, reloadTime: 1.5, adsFOV: 65, zOffset: -0.3, recoilAmt: 0.05, modelFn: createPistol },
    { name: 'Assault Rifle', bodyDamage: 34, headDamage: 100, pellets: 1, spread: 0.05, fireRate: 0.1, isAuto: true, magSize: 30, currentAmmo: 30, reloadTime: 2.2, adsFOV: 55, zOffset: -0.4, recoilAmt: 0.03, modelFn: createAssaultRifle },
    { name: 'Shotgun', bodyDamage: 25, headDamage: 100, pellets: 5, spread: 0.15, fireRate: 1.0, isAuto: false, magSize: 6, currentAmmo: 6, reloadTime: 3.0, adsFOV: 70, zOffset: -0.4, recoilAmt: 0.15, modelFn: createShotgun },
    { name: 'Sniper', bodyDamage: 95, headDamage: 100, pellets: 1, spread: 0.0, fireRate: 1.5, isAuto: false, magSize: 5, currentAmmo: 5, reloadTime: 3.5, adsFOV: 20, zOffset: -0.5, recoilAmt: 0.2, modelFn: createSniperRifle }
];

let currentWeaponIndex = 1; let playerWeaponGroup = new THREE.Group(); camera.add(playerWeaponGroup);

function updateAmmoUI() {
    const w = arsenal[currentWeaponIndex];
    if (ammoLabel) ammoLabel.innerText = isReloading ? "RELOADING..." : `${w.currentAmmo} / ${w.magSize} AMMO`;
}

function equipPlayerWeapon(index) {
    playerWeaponGroup.clear(); const wData = arsenal[index]; const wMesh = wData.modelFn();
    wMesh.scale.set(0.25, 0.25, 0.25); wMesh.rotation.y = Math.PI; playerWeaponGroup.add(wMesh);
    if (weaponLabel) weaponLabel.innerText = wData.name;
    isReloading = false; updateAmmoUI(); if (window.updateWeaponUI) window.updateWeaponUI(index);
}
equipPlayerWeapon(currentWeaponIndex);
window.switchWeaponFromJS = (index) => { if(index !== currentWeaponIndex && !isPlayerDead) { currentWeaponIndex = index; equipPlayerWeapon(index); } };

let bulletTracers = [];
function createTracer(startPoint, direction, distance) {
    const length = Math.min(distance, 100); 
    const geo = new THREE.CylinderGeometry(0.02, 0.02, length, 4); geo.rotateX(Math.PI / 2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffaa, transparent: true, opacity: 1.0 });
    const tracer = new THREE.Mesh(geo, mat);
    const midPoint = startPoint.clone().addScaledVector(direction, length / 2);
    tracer.position.copy(midPoint); tracer.lookAt(startPoint.clone().add(direction));
    scene.add(tracer); bulletTracers.push({ mesh: tracer, life: 1.0 }); 
}

function showHitMarker() {
    if(!crosshairUI) return; crosshairUI.style.color = '#ff0000'; crosshairUI.innerText = 'X';
    setTimeout(() => { crosshairUI.style.color = '#00ff00'; crosshairUI.innerText = '+'; }, 150);
}

const ALL_NODES = [
    {x: 0, y: 4, z: 45}, {x: -12, y: 4, z: 40}, {x: 12, y: 4, z: 40}, {x: -25, y: 4, z: 30}, {x: 25, y: 4, z: 30},
    {x: 0, y: 4, z: -45}, {x: -12, y: 4, z: -40}, {x: 12, y: 4, z: -40}, {x: -25, y: 4, z: -30}, {x: 25, y: 4, z: -30},
    {x: 0, y: 4, z: 0}, {x: -35, y: 4, z: 0}, {x: 35, y: 4, z: 0}, 
    {x: -14, y: 4, z: 20}, {x: 14, y: 4, z: 20}, {x: -14, y: 4, z: -20}, {x: 14, y: 4, z: -20},
    {x: -26, y: 4, z: 20}, {x: 26, y: 4, z: 20}, {x: -26, y: 4, z: -20}, {x: 26, y: 4, z: -20},
    {x: -45, y: 4, z: -45}, {x: 45, y: 4, z: -45}, {x: -45, y: 4, z: 45}, {x: 45, y: 4, z: 45},
    {x: -45, y: 4, z: 0}, {x: 45, y: 4, z: 0}, {x: 0, y: 4, z: 25}, {x: 0, y: 4, z: -25}
];

function getBotSpawnPoint() {
    const currentBots = getBots();
    for (let attempt = 0; attempt < 10; attempt++) {
        const node = ALL_NODES[Math.floor(Math.random() * ALL_NODES.length)];
        let occupied = false;
        for (let b of currentBots) {
            if (!b.dead && Math.hypot(b.mesh.position.x - node.x, b.mesh.position.z - node.z) < 5) { occupied = true; break; }
        }
        if (!occupied && Math.hypot(camera.position.x - node.x, camera.position.z - node.z) > 5) return { x: node.x, y: node.y, z: node.z };
    }
    return ALL_NODES[Math.floor(Math.random() * ALL_NODES.length)];
}

const spawnRaycaster = new THREE.Raycaster();
function getPlayerSpawnPoint() {
    const currentBots = getBots(); let safeNodes = []; let maxDistNode = ALL_NODES[0]; let maxDist = -1;
    for (let i = 0; i < ALL_NODES.length; i++) {
        const node = ALL_NODES[i]; let isSafe = true; let closestThreatDist = Infinity;
        const nodeVec = new THREE.Vector3(node.x, node.y + 0.5, node.z);
        for (let b of currentBots) {
            if (b.dead) continue;
            const botPos = new THREE.Vector3(b.mesh.position.x, b.mesh.position.y + 0.5, b.mesh.position.z);
            const dist = nodeVec.distanceTo(botPos);
            if (dist < closestThreatDist) closestThreatDist = dist;
            if (dist < 15) { isSafe = false; break; }
            if (dist < 50) {
                const dirToNode = new THREE.Vector3().subVectors(botPos, nodeVec).normalize();
                spawnRaycaster.set(nodeVec, dirToNode);
                const hits = spawnRaycaster.intersectObjects(mapColliders, false);
                if (hits.length === 0 || hits[0].distance > dist) { isSafe = false; break; }
            }
        }
        if (closestThreatDist > maxDist) { maxDist = closestThreatDist; maxDistNode = node; }
        if (isSafe) safeNodes.push(node);
    }
    if (safeNodes.length > 0) { const pick = safeNodes[Math.floor(Math.random() * safeNodes.length)]; return { x: pick.x, y: pick.y, z: pick.z }; }
    return { x: maxDistNode.x, y: maxDistNode.y, z: maxDistNode.z };
}

export function updateLeaderboard() {
    const lbList = document.getElementById('lb-list'); if (!lbList) return;
    let players = [{ name: playerName, kills: window.currentKills || 0, isPlayer: true }];
    getBots().forEach(b => { players.push({ name: b.name, kills: b.kills, isPlayer: false }); });
    players.sort((a, b) => b.kills - a.kills);
    
    lbList.innerHTML = '';
    for(let i=0; i<4 && i<players.length; i++) {
        const p = players[i]; const color = p.isPlayer ? '#00ff00' : '#ffaa00';
        lbList.innerHTML += `<div class="lb-row"><span style="color:${color}">${i+1}. ${p.name}</span><span class="lb-kills">${p.kills}/${WINNING_KILLS}</span></div>`;
    }
    if (isGameRunning && players[0].kills >= WINNING_KILLS) { endGame(players); }
}
window.refreshLeaderboard = updateLeaderboard;

function killPlayer(killerName, killerTeam) {
    isPlayerDead = true; document.getElementById('respawnScreen').style.display = 'flex';
    if (window.addKillFeedEvent) window.addKillFeedEvent(killerName, killerTeam, playerName, PLAYER_TEAM, false);

    setTimeout(() => {
        if (!isGameRunning) return; 
        playerHP = 100; updatePlayerHPUI();
        const spawn = getPlayerSpawnPoint(); 
        
        velocity.set(0, 0, 0); camera.position.set(spawn.x, 10, spawn.z); 
        document.getElementById('respawnScreen').style.display = 'none';
        isPlayerDead = false; isReloading = false; 
        arsenal.forEach(w => w.currentAmmo = w.magSize); updateAmmoUI();
        camera.lookAt(0, 4, 0); 
        playerSpawnTime = performance.now() / 1000; 
    }, 3000); 
}

function damagePlayer(amt, killerName, killerTeam) {
    if (isPlayerDead) return;
    if ((performance.now() / 1000) - playerSpawnTime < 2.5) return; 
    playerHP -= amt; lastDamageTime = performance.now() / 1000; updatePlayerHPUI();
    damageFlash.style.opacity = '0.4'; setTimeout(() => { damageFlash.style.opacity = '0'; }, 100);
    if (playerHP <= 0) killPlayer(killerName, killerTeam);
}

function updatePlayerHPUI() {
    if(!hpBarFill) return; hpBarFill.style.width = Math.max(0, playerHP) + '%';
    if ((performance.now() / 1000) - playerSpawnTime < 2.5) { hpBarFill.style.background = '#00ffff'; } 
    else { hpBarFill.style.background = playerHP < 30 ? '#ff0000' : '#00ff00'; }
}

document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('mousedown', (e) => {
    initAudio(); if (!isGameRunning || isPlayerDead || isMobile) return; 
    if (!fpsControls.isLocked && !isMobile) { fpsControls.lock(); return; }
    if (e.button === 0) { isShooting = true; if (!arsenal[currentWeaponIndex].isAuto && !isReloading) attemptShoot(); }
    if (e.button === 2) isAiming = true; 
});
document.addEventListener('mouseup', (e) => {
    if (isMobile) return;
    if (e.button === 0) isShooting = false;
    if (e.button === 2) isAiming = false;
});

function attemptShoot() {
    const w = arsenal[currentWeaponIndex]; const timeNow = performance.now() / 1000;
    if (timeNow - playerLastFired < w.fireRate || w.currentAmmo <= 0) return; 

    if (timeNow - playerLastFired > w.fireRate + 0.15) { currentRecoilSpread = 0.0; }

    w.currentAmmo--; updateAmmoUI(); playerLastFired = timeNow; gunRecoil = w.recoilAmt; 
    playGunSound(w.name, 0); 

    const kickPitch = w.recoilAmt * 0.3; 
    const kickYaw = (Math.random() - 0.5) * w.recoilAmt * 0.3; 
    
    const euler = new THREE.Euler(0, 0, 0, 'YXZ');
    euler.setFromQuaternion(camera.quaternion);
    euler.x += kickPitch; euler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, euler.x)); euler.y += kickYaw;  
    camera.quaternion.setFromEuler(euler);
    if (isMobile) touchLookEuler.copy(euler); 

    let landedHit = false;
    for(let p = 0; p < w.pellets; p++) {
        let actualSpread = currentRecoilSpread; 
        if (w.name === 'Sniper') actualSpread = isAiming ? 0.0 : 0.2;
        if (w.name === 'Shotgun') actualSpread = w.spread; 

        raycaster.setFromCamera(screenCenter, camera); const shootDir = raycaster.ray.direction.clone();
        shootDir.x += (Math.random() - 0.5) * actualSpread; shootDir.y += (Math.random() - 0.5) * actualSpread; shootDir.z += (Math.random() - 0.5) * actualSpread; 
        shootDir.normalize();
        
        raycaster.set(camera.position, shootDir); const intersects = raycaster.intersectObjects(scene.children, true);
        let hitDistance = 100; 

        for (let i = 0; i < intersects.length; i++) {
            const hitData = intersects[i].object.userData;
            if (hitData && hitData.isBot) {
                const targetBot = getBots()[hitData.botId];
                if (targetBot && targetBot.team !== PLAYER_TEAM && !targetBot.dead) {
                    const isHeadshot = (intersects[i].object.name === 'BotHead');
                    let dmg = isHeadshot ? w.headDamage : w.bodyDamage;
                    if (w.name === 'Shotgun') dmg = (intersects[i].distance > 12) ? 5 : 25; 

                    targetBot.hp -= dmg; if(targetBot.ui) targetBot.ui.updateHealth(targetBot.hp);
                    hitDistance = intersects[i].distance; landedHit = true;

                    if (targetBot.hp <= 0) {
                        if (window.addKillFeedEvent) window.addKillFeedEvent(playerName, PLAYER_TEAM, targetBot.name, targetBot.team, isHeadshot);
                        killBot(targetBot, playerName, PLAYER_TEAM, true, getBotSpawnPoint);
                    }
                }
                break; 
            }
            if (mapColliders.includes(intersects[i].object)) { hitDistance = intersects[i].distance; break; }
        }
        createTracer(camera.position.clone().add(new THREE.Vector3(0, -0.2, 0)), raycaster.ray.direction, hitDistance);
    }
    if (landedHit) showHitMarker(); if (w.currentAmmo <= 0) startReload();
    currentRecoilSpread = Math.min(w.spread, currentRecoilSpread + (w.spread / 3));
}

function startReload() {
    const w = arsenal[currentWeaponIndex];
    if (isReloading || w.currentAmmo === w.magSize) return;
    isReloading = true; updateAmmoUI(); playerWeaponGroup.position.y = -0.5; 
    setTimeout(() => { if (!isGameRunning || isPlayerDead) return; w.currentAmmo = w.magSize; isReloading = false; updateAmmoUI(); }, w.reloadTime * 1000);
}

document.addEventListener('keydown', (e) => {
    if (isPlayerDead || isMobile) return;
    if (e.code === 'KeyW') moveState.forward = true; if (e.code === 'KeyS') moveState.backward = true;
    if (e.code === 'KeyA') moveState.left = true; if (e.code === 'KeyD') moveState.right = true;
    if (e.code === 'Space' && canJump && !e.repeat) { velocity.y += 30; canJump = false; }
    if (e.code === 'KeyR') startReload();
    if (e.code === 'Digit1') window.switchWeaponFromJS(0); if (e.code === 'Digit2') window.switchWeaponFromJS(1); 
    if (e.code === 'Digit3') window.switchWeaponFromJS(2); if (e.code === 'Digit4') window.switchWeaponFromJS(3); 
});

document.addEventListener('wheel', (e) => {
    if (isPlayerDead || !isGameRunning || isMobile) return;
    let nextIndex = currentWeaponIndex;
    if (e.deltaY > 0) { nextIndex = (currentWeaponIndex + 1) % arsenal.length; } 
    else if (e.deltaY < 0) { nextIndex = (currentWeaponIndex - 1 + arsenal.length) % arsenal.length; }
    window.switchWeaponFromJS(nextIndex);
});

document.addEventListener('keyup', (e) => {
    if (isMobile) return;
    if (e.code === 'KeyW') moveState.forward = false; if (e.code === 'KeyS') moveState.backward = false;
    if (e.code === 'KeyA') moveState.left = false; if (e.code === 'KeyD') moveState.right = false;
});

export function bootMatch(isMobileMode, diffMode) {
    initAudio(); 
    const nInput = document.getElementById('playerNameInput');
    if(nInput) { playerName = nInput.value.trim().toUpperCase() || 'GUEST'; }
    
    if(getBots().length === 0) {
        spawnBots(scene, mapColliders, arsenal, getBotSpawnPoint);
    }

    const btnNade = document.getElementById('btn-nade'); if (btnNade) btnNade.style.display = 'none';
    const btnDet = document.getElementById('btn-det'); if (btnDet) btnDet.style.display = 'none';

    const leaderboardUI = document.getElementById('leaderboard');
    if (leaderboardUI) {
        leaderboardUI.style.display = 'block';
        if (isMobile) {
            leaderboardUI.style.transform = 'scale(0.8)';
            leaderboardUI.style.transformOrigin = 'top left';
            leaderboardUI.style.top = '5px';
            leaderboardUI.style.left = '5px';
            leaderboardUI.style.zIndex = '99999';
        }
    }

    if(isMobile) {
        setupMobileControls(camera, moveState, touchLookEuler,
            { isRunning: () => isGameRunning, isDead: () => isPlayerDead }, 
            {
                initAudio: initAudio, setShooting: (val) => { isShooting = val; },
                attemptShoot: () => { if (!arsenal[currentWeaponIndex].isAuto && !isReloading) attemptShoot(); },
                toggleAim: () => { isAiming = !isAiming; }, jump: () => { if(canJump) { velocity.y += 30; canJump = false; } },
                reload: startReload, throwNade: () => {}, detonateC4: () => {}
            }
        );
    }

    camera.position.set(0, 4, 0); camera.rotation.set(0, 0, 0); velocity.set(0, 0, 0);

    let hackDone = false;
    function renderHack() {
        if (!hackDone) {
            const spawn = getPlayerSpawnPoint();
            camera.position.set(spawn.x, 10, spawn.z); 
            renderer.render(scene, camera); 
            
            playerSpawnTime = performance.now() / 1000;
            prevTime = performance.now(); 
            isGameRunning = true;
            
            updateLeaderboard(); 
            startActionMusic();
            hackDone = true;
            animate();
        }
    }
    setTimeout(renderHack, 50);
}

function endGame(sortedPlayers = null) {
    isGameRunning = false;
    if(!isMobile) fpsControls.unlock();
    
    if (musicInterval) { clearInterval(musicInterval); musicInterval = null; }

    document.getElementById('hud').style.display = 'none';
    document.getElementById('mainMenuOverlay').style.display = 'none';
    document.getElementById('respawnScreen').style.display = 'none'; 
    
    if (!sortedPlayers) {
        sortedPlayers = [{ name: playerName, kills: window.currentKills || 0, isPlayer: true }];
        getBots().forEach(b => { sortedPlayers.push({ name: b.name, kills: b.kills, isPlayer: false }); });
        sortedPlayers.sort((a, b) => b.kills - a.kills);
    }

    let playerRank = sortedPlayers.findIndex(p => p.isPlayer) + 1;
    let winnerName = sortedPlayers[0].name;

    if (window.endGameUI) window.endGameUI(playerRank, winnerName); 
    
    const overScreen = document.getElementById('gameOverScreen'); overScreen.style.display = 'flex';
}

setInterval(() => {
    if(isGameRunning) {
        gameTimeRemaining--;
        if(timerUI) { const m = Math.floor(gameTimeRemaining / 60); const s = Math.floor(gameTimeRemaining % 60); timerUI.innerText = `${m}:${s < 10 ? '0' : ''}${s}`; }
        if(gameTimeRemaining <= 0) endGame(); 
    }
}, 1000);

function animate() {
    requestAnimationFrame(animate);
    const time = performance.now(); 
    const delta = Math.min((time - prevTime) / 1000, 0.1); 
    prevTime = time;
    const timeSec = time / 1000;

    if (isGameRunning) {
        if (!isPlayerDead) {
            canJump = updatePlayerPhysics(camera, velocity, fpsControls, moveState, mapColliders, delta);
            if (isShooting && arsenal[currentWeaponIndex].isAuto && !isReloading) attemptShoot();
            updatePlayerHPUI(); 

            if (canJump && (moveState.forward || moveState.backward || moveState.left || moveState.right)) {
                if (timeSec - lastFootstepTime > 0.4) {
                    playFootstepSound();
                    lastFootstepTime = timeSec;
                }
            }

            if (playerHP < 100 && (timeSec - lastDamageTime > REGEN_DELAY)) {
                playerHP += REGEN_RATE * delta; if (playerHP > 100) playerHP = 100; updatePlayerHPUI();
            }

            // THE FIX: The ultimate Abyss Safety Net!
            if (camera.position.y < -20 || camera.position.y > 100) {
                const safeSpawn = getPlayerSpawnPoint();
                camera.position.set(safeSpawn.x, 10, safeSpawn.z);
                velocity.set(0, 0, 0);
            }
        }

        const w = arsenal[currentWeaponIndex]; const targetFOV = isAiming ? w.adsFOV : 75;
        camera.fov += (targetFOV - camera.fov) * 10 * delta; camera.updateProjectionMatrix();

        if (!isReloading) {
            const targetX = isAiming ? 0 : 0.25; const targetY = isAiming ? -0.1 : -0.2;
            playerWeaponGroup.position.x += (targetX - playerWeaponGroup.position.x) * 15 * delta;
            playerWeaponGroup.position.y += (targetY - playerWeaponGroup.position.y) * 15 * delta;
            if (gunRecoil > 0) { playerWeaponGroup.position.z = w.zOffset + gunRecoil; gunRecoil -= delta * 2.0; } 
            else playerWeaponGroup.position.z = w.zOffset;
        }

        for (let i = bulletTracers.length - 1; i >= 0; i--) {
            const tracer = bulletTracers[i]; tracer.life -= delta * 5; tracer.mesh.material.opacity = tracer.life;
            if (tracer.life <= 0) { scene.remove(tracer.mesh); bulletTracers.splice(i, 1); }
        }

        const aiContext = { 
            delta, timeSec, time, camera, isPlayerDead, playerTeam: PLAYER_TEAM, colliders: mapColliders, scene, 
            createTracer, damagePlayer, getValidSpawnPoint: getBotSpawnPoint, playSound: playGunSound,
            difficulty: window.gameDifficulty || 'medium' 
        };
        updateBots(aiContext);
    }
    
    renderer.render(scene, camera);
}
