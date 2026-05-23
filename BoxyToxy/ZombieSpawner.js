import * as THREE from 'three';
import { createZombie } from './ZombieCharacter.js';

export const WaveState = {
    currentWave: 1,
    zombiesToSpawn: 10,
    activeZombiesLimit: 60,
    bossWarningTriggered: false
};

export function spawnZombie(scene, camera, staticColliders, zombies) {
    let typePool = [0]; 
    if (WaveState.currentWave >= 2) typePool.push(1); 
    if (WaveState.currentWave >= 3) typePool.push(3); 
    if (WaveState.currentWave >= 4) typePool.push(4, 5); 
    if (WaveState.currentWave >= 5) typePool.push(6, 2); 
    if (WaveState.currentWave >= 6) typePool.push(8); 
    if (WaveState.currentWave >= 7) typePool.push(7); 

    const type = typePool[Math.floor(Math.random() * typePool.length)];
    const zombieMesh = createZombie(type);

    let spawnX = 0, spawnZ = 0, validSpawn = false, attempts = 0;

    while (!validSpawn && attempts < 30) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 30; 
        spawnX = camera.position.x + Math.cos(angle) * distance;
        spawnZ = camera.position.z + Math.sin(angle) * distance;
        
        if (spawnX < -140 || spawnX > 140 || spawnZ < -140 || spawnZ > 140) {
            attempts++; continue; 
        }
        
        const spawnBox = new THREE.Box3().setFromCenterAndSize(new THREE.Vector3(spawnX, 2.0, spawnZ), new THREE.Vector3(2.0, 3.0, 2.0));
        let hitSomething = false;
        for (let box of staticColliders) { if (spawnBox.intersectsBox(box)) { hitSomething = true; break; } }
        if (!hitSomething) validSpawn = true;
        attempts++;
    }
    
    if(!validSpawn) { 
        const forwardVector = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion).normalize();
        spawnX = camera.position.x + (forwardVector.x * 15);
        spawnZ = camera.position.z + (forwardVector.z * 15);
        spawnX = Math.max(-140, Math.min(140, spawnX));
        spawnZ = Math.max(-140, Math.min(140, spawnZ));
    }

    zombieMesh.position.set(spawnX, type === 3 ? 0.5 : 1.5, spawnZ);
    scene.add(zombieMesh);
    
    let sprintSpeed = 16.0 + (Math.random() * 3.0); 
    let hp = 100 + (WaveState.currentWave * 20); 

    if (type === 1) { sprintSpeed *= 1.5; hp *= 0.5; } 
    else if (type === 2) { sprintSpeed *= 0.6; hp *= 3.0; } 
    else if (type === 3) { sprintSpeed *= 1.1; hp *= 0.5; } 
    else if (type === 4) { sprintSpeed *= 0.9; hp *= 1.5; }
    else if (type === 6) { sprintSpeed *= 1.2; hp *= 1.5; } 
    else if (type === 8) { sprintSpeed *= 1.3; hp *= 1.2; } 
    else if (type === 7) { 
        sprintSpeed = 7.0; 
        hp *= 15.0; 
    }

    zombies.push({ 
        mesh: zombieMesh, type: type, hp: hp, speed: sprintSpeed, walkCycle: Math.random() * 100, dead: false, 
        velocity: new THREE.Vector3(0, 0, 0), velocityY: 0, state: "running", stateTimer: 0, 
        diveCooldown: Math.random() * 2.0, spitCooldown: type === 7 ? 2.0 : 999 
    });
}

export function checkWaves(zombies, updateHUDCallback) {
    let aliveZombies = 0;
    for (let z of zombies) { if (!z.dead) aliveZombies++; }

    if (aliveZombies === 0 && WaveState.zombiesToSpawn === 0) { 
        WaveState.currentWave++; 
        WaveState.zombiesToSpawn = Math.floor(10 * Math.pow(1.3, WaveState.currentWave - 1)); 
        
        if (WaveState.currentWave === 7 && !WaveState.bossWarningTriggered) {
            WaveState.bossWarningTriggered = true;
            const bw = document.getElementById('boss-warning');
            if (bw) {
                bw.style.display = 'block';
                setTimeout(() => { bw.style.display = 'none'; }, 4000); 
            }
        }
        updateHUDCallback(); 
    }
    
    return {
        canSpawn: (WaveState.zombiesToSpawn > 0 && aliveZombies < WaveState.activeZombiesLimit)
    };
}