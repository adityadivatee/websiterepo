import * as THREE from 'three';
import { createSoldier } from './Character.js';
import { AI_WAYPOINTS } from './Map.js'; 

const botRaycaster = new THREE.Raycaster();
let bots = [];

function getRandomWaypoint() {
    return AI_WAYPOINTS[Math.floor(Math.random() * AI_WAYPOINTS.length)];
}

function createFloatingUI(name, teamColorStr) {
    const canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 128;
    const ctx = canvas.getContext('2d'); const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, depthTest: true });
    const sprite = new THREE.Sprite(spriteMat); sprite.scale.set(4, 2, 1); sprite.position.y = 2.5; 

    sprite.updateHealth = function(hp) {
        ctx.clearRect(0, 0, 256, 128); ctx.fillStyle = teamColorStr; ctx.font = 'bold 36px Arial';
        ctx.textAlign = 'center'; ctx.fillText(name, 128, 40);
        ctx.fillStyle = '#cc0000'; ctx.fillRect(28, 60, 200, 20);
        if (hp > 0) { ctx.fillStyle = '#00ff00'; ctx.fillRect(28, 60, (hp / 100) * 200, 20); }
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4; ctx.strokeRect(28, 60, 200, 20);
        texture.needsUpdate = true;
    };
    sprite.updateHealth(100); return sprite;
}

export function getBots() { return bots; }

export function spawnBots(scene, colliders, arsenal, getValidSpawnFn) {
    bots = []; 
    const botNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf"];
    
    for(let i=0; i<7; i++) {
        const botTeam = 'bot' + i; 
        const botName = botNames[i];
        const bot = createSoldier(0xff0000); 
        
        const randomWepIndex = Math.floor(Math.random() * 4);
        const botGun = arsenal[randomWepIndex].modelFn();
        botGun.scale.set(0.5, 0.5, 0.5); botGun.position.set(0.5, 0.5, -0.5); bot.add(botGun);

        const spawn = getValidSpawnFn(botTeam);
        bot.position.set(spawn.x, spawn.y + 2, spawn.z);
        
        const ui = createFloatingUI("[ENEMY] " + botName, "#ffaa00"); bot.add(ui);
        bot.traverse(child => { if(child.isMesh) { child.userData = { isBot: true, botId: i, team: botTeam }; colliders.push(child); } });
        scene.add(bot);
        
        bots.push({ 
            id: i, name: botName, mesh: bot, team: botTeam, hp: 100, ui: ui, dead: false, 
            weaponStats: arsenal[randomWepIndex], lastFired: (performance.now() / 1000) + 2.0, 
            velocityY: 0, targetWaypoint: new THREE.Vector3(spawn.x, 2, spawn.z),
            stuckTimer: 0, trapTimer: 0, huntTimer: 0, lastPos: bot.position.clone(), strafeDir: 1, kills: 0,
            lastSeenPos: null, timeSinceLastSeen: 999, targetAcquiredTime: 0, hadTargetLastFrame: false 
        });
    }
}

export function killBot(bot, killerName, killerTeam, killedByPlayer, getValidSpawnFn) {
    if (bot.dead) return; 
    bot.dead = true; bot.mesh.rotation.x = -Math.PI / 2; bot.ui.visible = false;
    
    if (killedByPlayer && window.addPlayerKill) window.addPlayerKill();
    if (window.addKillFeedEvent) window.addKillFeedEvent(killerName, killerTeam, bot.name, bot.team, killedByPlayer);
    if (window.refreshLeaderboard) window.refreshLeaderboard(); 

    setTimeout(() => {
        bot.hp = 100; bot.ui.updateHealth(100); bot.dead = false; bot.mesh.rotation.x = 0; bot.ui.visible = true;
        const spawn = getValidSpawnFn(bot.team); bot.mesh.position.set(spawn.x, spawn.y + 2, spawn.z); bot.targetWaypoint.set(spawn.x, spawn.y + 2, spawn.z);
        bot.velocityY = 0; bot.lastFired = (performance.now() / 1000) + 2.0; bot.stuckTimer = 0; bot.trapTimer = 0; bot.huntTimer = 0;
        bot.lastSeenPos = null; bot.timeSinceLastSeen = 999; bot.hadTargetLastFrame = false; 
    }, 3000);
}

export function updateBots(ctx) {
    const { delta, timeSec, camera, isPlayerDead, playerTeam, colliders, scene, createTracer, damagePlayer, getValidSpawnPoint, playSound, difficulty } = ctx;
    const diff = difficulty || 'medium';

    bots.forEach(bot => {
        if (bot.dead) return;

        if (bot.mesh.position.y < 0) { bot.mesh.position.y = 4; bot.velocityY = 0; }

        const distMoved = bot.mesh.position.distanceTo(bot.lastPos); bot.lastPos = bot.mesh.position.clone();
        if (distMoved < 0.1 * delta) { bot.stuckTimer += delta; bot.trapTimer += delta; } 
        else { bot.stuckTimer = 0; bot.trapTimer = 0; }

        if (bot.trapTimer > 5.0) {
            const rescueSpawn = getValidSpawnPoint(bot.team); bot.mesh.position.set(rescueSpawn.x, rescueSpawn.y + 2, rescueSpawn.z); bot.targetWaypoint.set(rescueSpawn.x, rescueSpawn.y + 2, rescueSpawn.z);
            bot.trapTimer = 0; bot.stuckTimer = 0; bot.huntTimer = 0; bot.lastFired = timeSec + 1.0; return; 
        }

        const botChest = new THREE.Vector3(bot.mesh.position.x, bot.mesh.position.y + 0.5, bot.mesh.position.z);
        
        if (bot.stuckTimer > 1.0) {
            let bestDir = new THREE.Vector3(); let maxDist = 0;
            for(let a=0; a<Math.PI*2; a+=Math.PI/4) {
                 let d = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)); botRaycaster.set(botChest, d);
                 let hits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot);
                 let dist = hits.length > 0 ? hits[0].distance : 10;
                 if(dist > maxDist) { maxDist = dist; bestDir.copy(d); }
            }
            bot.targetWaypoint.copy(bot.mesh.position).add(bestDir.multiplyScalar(4)); bot.stuckTimer = 0;
        }

        // --- LOS SYSTEM ---
        let closestDist = 150; // Massively increased vision range
        let targetPos = null; let targetIsPlayer = false; let targetedBot = null; 

        if (!isPlayerDead) {
            const distToPlayer = botChest.distanceTo(camera.position);
            if (distToPlayer < closestDist) {
                const dirToPlayer = new THREE.Vector3().subVectors(camera.position, botChest).normalize(); botRaycaster.set(botChest, dirToPlayer);
                const hits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot); // recursive = true
                if (hits.length === 0 || hits[0].distance > distToPlayer) { closestDist = distToPlayer; targetPos = camera.position.clone(); targetIsPlayer = true; }
            }
        }

        bots.forEach(otherBot => {
            if (!otherBot.dead && otherBot.team !== bot.team) {
                const otherChest = new THREE.Vector3(otherBot.mesh.position.x, otherBot.mesh.position.y + 0.5, otherBot.mesh.position.z);
                const distToBot = botChest.distanceTo(otherChest);
                if (distToBot < closestDist) {
                    const dirToBot = new THREE.Vector3().subVectors(otherChest, botChest).normalize(); botRaycaster.set(botChest, dirToBot);
                    const hits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot);
                    if (hits.length === 0 || hits[0].distance > distToBot) { closestDist = distToBot; targetPos = otherChest.clone(); targetIsPlayer = false; targetedBot = otherBot; }
                }
            }
        });

        // TRACK MEMORY
        if (targetPos) {
            bot.lastSeenPos = targetPos.clone();
            bot.timeSinceLastSeen = 0;
            if (!bot.hadTargetLastFrame) { bot.targetAcquiredTime = timeSec; bot.hadTargetLastFrame = true; }
        } else { bot.timeSinceLastSeen += delta; bot.hadTargetLastFrame = false; }

        const separationForce = new THREE.Vector3();
        bots.forEach(otherBot => {
            if (otherBot !== bot && !otherBot.dead) {
                const dist = bot.mesh.position.distanceTo(otherBot.mesh.position);
                if (dist < 3.0) { const push = new THREE.Vector3().subVectors(bot.mesh.position, otherBot.mesh.position); push.y = 0; push.normalize().divideScalar(dist); separationForce.add(push); }
            }
        });

        let moveSpeed = 6.0; let intendedDir = new THREE.Vector3();
        
        // DIFFICULTY SCALING
        let reactionTime = 0.25; let spread = 0.06; let headshotChance = 0.10;

        if (diff === 'easy') { reactionTime = 2.0; spread = 0.35; headshotChance = 0.0; moveSpeed = 2.5; } 
        else if (diff === 'hard') { reactionTime = 0.05; spread = 0.02; headshotChance = 0.35; moveSpeed = 7.0; }

        if (bot.weaponStats.name === 'Sniper') {
            reactionTime = diff === 'hard' ? 0.8 : (diff === 'easy' ? 3.0 : 1.5);
            spread = diff === 'hard' ? 0.05 : (diff === 'easy' ? 0.50 : 0.15); 
            moveSpeed = diff === 'easy' ? 0.0 : 1.0; 
        }

        if (bot.hp < 30 && bot.timeSinceLastSeen > 2.0) {
            if (bot.mesh.position.distanceTo(bot.targetWaypoint) < 3) { const wp = getRandomWaypoint(); bot.targetWaypoint.set(wp.x, bot.mesh.position.y, wp.z); }
            bot.mesh.lookAt(bot.targetWaypoint.x, bot.mesh.position.y, bot.targetWaypoint.z); bot.mesh.getWorldDirection(intendedDir);
        } else if (targetPos) {
            
            // --- GUARANTEED FIRING LOGIC ---
            bot.mesh.lookAt(targetPos.x, bot.mesh.position.y, targetPos.z);
            if (Math.random() < 0.02) bot.strafeDir *= -1; 
            const toTarget = new THREE.Vector3().subVectors(targetPos, botChest); toTarget.y = 0; toTarget.normalize(); 
            intendedDir.set(-toTarget.z, 0, toTarget.x).multiplyScalar(bot.strafeDir); 

            // Did they wait long enough to pull the trigger?
            if (timeSec - bot.targetAcquiredTime > reactionTime) {
                // Is the gun ready to fire?
                if (timeSec - bot.lastFired > bot.weaponStats.fireRate) {
                    
                    bot.lastFired = timeSec; 
                    if (playSound) playSound(bot.weaponStats.name, botChest.distanceTo(camera.position)); 
                    
                    const pellets = bot.weaponStats.pellets || 1;
                    for(let p = 0; p < pellets; p++) {
                        const aimDir = new THREE.Vector3().subVectors(targetPos, botChest).normalize();
                        aimDir.x += (Math.random() - 0.5) * spread; aimDir.y += (Math.random() - 0.5) * spread; aimDir.z += (Math.random() - 0.5) * spread; aimDir.normalize();
                        createTracer(botChest, aimDir, closestDist); 
                        
                        if (targetIsPlayer) {
                            let dmg = Math.random() < headshotChance ? bot.weaponStats.headDamage : bot.weaponStats.bodyDamage;
                            if (bot.weaponStats.name === 'Shotgun') dmg = (closestDist > 15) ? 5 : 25; 
                            damagePlayer(dmg, bot.name, bot.team); 
                        } else if (targetedBot) {
                            let dmg = Math.random() < headshotChance ? bot.weaponStats.headDamage : bot.weaponStats.bodyDamage;
                            if (bot.weaponStats.name === 'Shotgun') dmg = (closestDist > 15) ? 5 : 25;
                            targetedBot.hp -= dmg; targetedBot.ui.updateHealth(targetedBot.hp);
                            if(targetedBot.hp <= 0 && !targetedBot.dead) { bot.kills++; killBot(targetedBot, bot.name, bot.team, false, getValidSpawnPoint); }
                        }
                    }
                }
            }
        } else if (bot.lastSeenPos && bot.timeSinceLastSeen < 5.0) {
            bot.mesh.lookAt(bot.lastSeenPos.x, bot.mesh.position.y, bot.lastSeenPos.z); bot.targetWaypoint.copy(bot.lastSeenPos); bot.mesh.getWorldDirection(intendedDir); moveSpeed = 4.0;
        } else {
            if (bot.mesh.position.distanceTo(bot.targetWaypoint) < 3) { const wp = getRandomWaypoint(); bot.targetWaypoint.set(wp.x, bot.mesh.position.y, wp.z); }
            bot.mesh.lookAt(bot.targetWaypoint.x, bot.mesh.position.y, bot.targetWaypoint.z); bot.mesh.getWorldDirection(intendedDir);
        }

        intendedDir.add(separationForce); intendedDir.y = 0; if(intendedDir.lengthSq() > 0) intendedDir.normalize();
        bot.velocityY -= 98 * delta; 
        
        botRaycaster.set(botChest, intendedDir); const chestHits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot);
        botRaycaster.set(new THREE.Vector3(botChest.x, botChest.y - 1.0, botChest.z), intendedDir); const kneeHits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot);
        
        if (chestHits.length > 0 && chestHits[0].distance < 1.5) { const escapeNode = getRandomWaypoint(); bot.targetWaypoint.set(escapeNode.x, bot.mesh.position.y, escapeNode.z); } 
        else if (kneeHits.length > 0 && kneeHits[0].distance < 1.5) { if(bot.mesh.position.y <= 2.1) bot.velocityY = 20; bot.mesh.position.addScaledVector(intendedDir, moveSpeed * delta); } 
        else { bot.mesh.position.addScaledVector(intendedDir, moveSpeed * delta); }

        botRaycaster.set(bot.mesh.position, new THREE.Vector3(0, -1, 0)); const fHits = botRaycaster.intersectObjects(colliders, true).filter(h => !h.object.userData.isBot);
        let floorY = 0; if(fHits.length > 0) floorY = fHits[0].point.y;
        bot.mesh.position.y += bot.velocityY * delta; if (bot.mesh.position.y < floorY + 2) { bot.velocityY = 0; bot.mesh.position.y = floorY + 2; }
    });
}