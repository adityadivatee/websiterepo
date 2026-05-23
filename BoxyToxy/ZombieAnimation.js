import * as THREE from 'three';

export function updateZombieAnimation(zombie, timeSec, delta, distToPlayer) {
    const data = zombie.mesh.userData;
    const t = zombie.walkCycle;
    const type = zombie.type || 0; 

    // ==================================================
    // 1. EXPLOSION DISMEMBERMENT (THE BLAST STATE)
    // ==================================================
    if (zombie.state === "blasted") {
        // As stateTimer increases, push body parts further away from their base positions
        const force = zombie.stateTimer * 25.0; // Explosion speed
        const spin = zombie.stateTimer * 15.0;  // Tumbling speed

        // Pop the body up
        if (data.innerGroup) data.innerGroup.position.y = Math.min(force * 0.5, 2.0); 

        // Send all standard limbs flying
        if (data.head) { data.head.position.y = data.head.userData.basePos.y + force; data.head.rotation.x = spin; }
        if (data.leftArm) { data.leftArm.position.x = data.leftArm.userData.basePos.x - force; data.leftArm.rotation.z = spin; }
        if (data.rightArm) { data.rightArm.position.x = data.rightArm.userData.basePos.x + force; data.rightArm.rotation.z = -spin; }
        if (data.leftLeg) { data.leftLeg.position.z = data.leftLeg.userData.basePos.z + force; data.leftLeg.rotation.x = spin; }
        if (data.rightLeg) { data.rightLeg.position.z = data.rightLeg.userData.basePos.z - force; data.rightLeg.rotation.x = -spin; }
        
        // --- NEW: Extra Mutant Arms (Type 6) ---
        if (data.extraLeftArm) { 
            data.extraLeftArm.position.x = data.extraLeftArm.userData.basePos.x - force; 
            data.extraLeftArm.position.y = data.extraLeftArm.userData.basePos.y + force; 
            data.extraLeftArm.rotation.z = spin;
        }
        if (data.extraRightArm) { 
            data.extraRightArm.position.x = data.extraRightArm.userData.basePos.x + force; 
            data.extraRightArm.position.y = data.extraRightArm.userData.basePos.y + force; 
            data.extraRightArm.rotation.z = -spin;
        }
        
        // --- NEW: Tentacles (Type 8) ---
        if (data.tentacles) {
            data.tentacles.forEach((tent, i) => {
                tent.position.y = tent.userData.basePos.y + force;
                tent.position.x = tent.userData.basePos.x + (i % 2 === 0 ? -force : force);
                tent.rotation.x = spin;
            });
        }
        return; // Skip normal animation while they are exploding
    }

    // 2. GLOBAL RESET (Ensures they snap back together if they wake up)
    if(data.innerGroup) { data.innerGroup.rotation.set(0, 0, 0); data.innerGroup.position.y = 0; }
    if(data.head) { data.head.rotation.set(0, 0, 0); data.head.position.copy(data.head.userData.basePos); }
    if(data.leftArm) { data.leftArm.rotation.set(0, 0, 0); data.leftArm.position.copy(data.leftArm.userData.basePos); }
    if(data.rightArm) { data.rightArm.rotation.set(0, 0, 0); data.rightArm.position.copy(data.rightArm.userData.basePos); }
    if(data.leftLeg) { data.leftLeg.rotation.set(0, 0, 0); data.leftLeg.position.copy(data.leftLeg.userData.basePos); }
    if(data.rightLeg) { data.rightLeg.rotation.set(0, 0, 0); data.rightLeg.position.copy(data.rightLeg.userData.basePos); }
    if(data.extraLeftArm) { data.extraLeftArm.rotation.set(0, 0, 0); data.extraLeftArm.position.copy(data.extraLeftArm.userData.basePos); }
    if(data.extraRightArm) { data.extraRightArm.rotation.set(0, 0, 0); data.extraRightArm.position.copy(data.extraRightArm.userData.basePos); }
    if(data.tentacles) data.tentacles.forEach(t => { t.rotation.set(0,0,0); t.position.copy(t.userData.basePos); });

    // ==================================================
    // 3. THE GIANT'S CREEPY 3-HEAD TWITCH
    // ==================================================
    if (type === 7 && data.head) {
        data.head.children.forEach((h, i) => {
            // Each head twitches at a slightly different speed!
            h.rotation.y = Math.sin(timeSec * (8 + i * 2)) * 0.2;
            h.rotation.x = Math.cos(timeSec * (6 + i * 2)) * 0.1;
        });
    }

    // ==================================================
    // STATE 1A: RAGDOLL FALLING (Backward)
    // ==================================================
    if (zombie.state === "falling") {
        const microTwitch = Math.sin(timeSec * 30) * 0.05; 
        if(data.innerGroup) { data.innerGroup.rotation.x = -Math.PI / 2.2; data.innerGroup.rotation.z = 0.3; data.innerGroup.position.y = -1.1; }
        if(data.leftArm) { data.leftArm.rotation.x = Math.PI - 0.2; data.leftArm.rotation.z = 0.5 + microTwitch; }
        if(data.rightArm) { data.rightArm.rotation.x = Math.PI + 0.2; data.rightArm.rotation.z = -0.8 - microTwitch; }
        if(data.leftLeg) { data.leftLeg.rotation.x = -0.2; data.leftLeg.rotation.z = 0.4; }
        if(data.rightLeg) { data.rightLeg.rotation.x = -0.6; data.rightLeg.rotation.z = -0.3; }
        if(data.head) { data.head.rotation.x = -0.5; data.head.rotation.y = 0.6 + microTwitch; }
        if(data.tentacles) data.tentacles.forEach(t => t.rotation.x = Math.PI/2 + microTwitch);
        return; 
    } 

    // ==================================================
    // STATE 1B: RAGDOLL TRIPPING (Leap, Tumble, Faceplant)
    // ==================================================
    if (zombie.state === "tripping") {
        const floorHeight = type === 3 ? 0.5 : 1.5;
        
        if (zombie.mesh.position.y > floorHeight + 0.2) {
            if (zombie.velocityY > 0) {
                if(data.innerGroup) { data.innerGroup.rotation.x = 1.0; }
                if(data.leftArm) data.leftArm.rotation.x = -Math.PI / 1.5; 
                if(data.rightArm) data.rightArm.rotation.x = -Math.PI / 1.5;
                if(data.leftLeg) data.leftLeg.rotation.x = -1.0; 
                if(data.rightLeg) data.rightLeg.rotation.x = -0.5;
            } else {
                if(data.innerGroup) { data.innerGroup.rotation.x = timeSec * 15; data.innerGroup.rotation.y = Math.sin(timeSec * 5) * 0.5; }
                if(data.leftArm) data.leftArm.rotation.x = Math.sin(timeSec * 25) * Math.PI; 
                if(data.rightArm) data.rightArm.rotation.x = Math.cos(timeSec * 25) * Math.PI; 
            }
        } else {
            const microTwitch = Math.sin(timeSec * 35) * 0.05; 
            if(data.innerGroup) { data.innerGroup.rotation.x = Math.PI / 2.2; data.innerGroup.rotation.z = -0.2; data.innerGroup.position.y = -1.0; }
            if(data.leftArm) { data.leftArm.rotation.x = -Math.PI/2; data.leftArm.rotation.z = -0.3 + microTwitch; }
            if(data.rightArm) { data.rightArm.rotation.x = -Math.PI/2; data.rightArm.rotation.z = 0.3 - microTwitch; }
            if(data.leftLeg) { data.leftLeg.rotation.x = 0.2; data.leftLeg.rotation.z = -0.4; }
            if(data.rightLeg) { data.rightLeg.rotation.x = 0.5; data.rightLeg.rotation.z = 0.2; }
            if(data.head) { data.head.rotation.x = 0.6; data.head.rotation.y = -0.4 + microTwitch; }
        }
        return; 
    }
    
    // ==================================================
    // STATE 2: WAKING UP 
    // ==================================================
    if (zombie.state === "waking" || zombie.state === "waking_front") {
        const progress = zombie.stateTimer / 1.0; 
        const snap = Math.pow(progress, 3); 
        const knees = Math.sin(progress * Math.PI); 
        const isFront = zombie.state === "waking_front";
        const startRotX = isFront ? (Math.PI / 2.2) : (-Math.PI / 2.2);

        if(data.innerGroup) {
            data.innerGroup.rotation.x = startRotX * (1.0 - snap);
            data.innerGroup.rotation.z = (isFront ? -0.2 : 0.3) * (1.0 - snap); 
            data.innerGroup.position.y = -1.1 * (1.0 - snap);
        }
        if(data.leftArm) data.leftArm.rotation.x = (isFront ? -Math.PI/2 : Math.PI * 0.8) * (1.0 - snap);
        if(data.rightArm) data.rightArm.rotation.x = (isFront ? -Math.PI/2 : Math.PI * 0.8) * (1.0 - snap);
        if(data.leftLeg) data.leftLeg.rotation.x = -knees * 1.5;
        if(data.rightLeg) data.rightLeg.rotation.x = -knees * 1.5;
        if(data.head) data.head.rotation.x = (isFront ? 0.6 : -0.5) * (1.0 - snap);
        return;
    } 

    // ==================================================
    // STATE 3: CRICKET DIVE TACKLE
    // ==================================================
    if (zombie.state === "diving") {
        if(data.innerGroup) data.innerGroup.rotation.x = 1.3; 
        if(data.leftArm) data.leftArm.rotation.x = -Math.PI + 0.2; 
        if(data.rightArm) data.rightArm.rotation.x = -Math.PI + 0.2;
        if(data.leftLeg) data.leftLeg.rotation.x = Math.sin(timeSec * 25) * 0.6 - 0.5;
        if(data.rightLeg) data.rightLeg.rotation.x = -Math.sin(timeSec * 25) * 0.6 + 0.5;
        return;
    }

    // ==================================================
    // STATE 4: TYPE-SPECIFIC RUNNING
    // ==================================================
    
    // Type 6: 4-Arm Mutant
    if (type === 6) {
        if (data.innerGroup) data.innerGroup.rotation.x = 0.4;
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t) * 1.2;
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t) * 1.2;
        // Upper arms swing normally
        if (data.leftArm) data.leftArm.rotation.x = -Math.PI/2 + Math.sin(t) * 0.5;
        if (data.rightArm) data.rightArm.rotation.x = -Math.PI/2 - Math.sin(t) * 0.5;
        // Lower arms swing erratically in double-time
        if (data.extraLeftArm) { data.extraLeftArm.rotation.x = -Math.PI/2 - Math.sin(t*2) * 0.8; data.extraLeftArm.rotation.z = 0.3; }
        if (data.extraRightArm) { data.extraRightArm.rotation.x = -Math.PI/2 + Math.sin(t*2) * 0.8; data.extraRightArm.rotation.z = -0.3; }
    }
    // Type 7: GIANT BLOATER (Fat, slow waddle, leaning back to balance belly)
    else if (type === 7) {
        if (data.innerGroup) {
            data.innerGroup.rotation.x = -0.1; // Leans backward to support the giant belly!
            data.innerGroup.rotation.z = Math.sin(t) * 0.2; // Heavy side-to-side waddle
        }
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t) * 0.6; // Short steps
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t) * 0.6; 
        if (data.leftArm) { data.leftArm.rotation.x = -0.2 + Math.sin(t) * 0.3; data.leftArm.rotation.z = 0.5; } // Arms pushed way out by fat
        if (data.rightArm) { data.rightArm.rotation.x = -0.2 - Math.sin(t) * 0.3; data.rightArm.rotation.z = -0.5; } 
    }
    // Type 8: Tentacle Monster
    else if (type === 8) {
        if (data.innerGroup) data.innerGroup.rotation.x = 0.3;
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t * 1.2) * 1.0;
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t * 1.2) * 1.0;
        if (data.tentacles) {
            data.tentacles.forEach((tent, i) => {
                // Sine wave wriggling
                tent.rotation.x = -Math.PI/2 + Math.sin(timeSec * (4 + i)) * 0.5;
                tent.rotation.z = Math.cos(timeSec * (3 + i)) * 0.4;
            });
        }
    }
    // Standard Types (1-5)
    else if (type === 2) {
        if (data.innerGroup) { data.innerGroup.rotation.z = Math.sin(t*0.5)*0.08; data.innerGroup.rotation.y = Math.sin(t*0.5)*0.1; }
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t*0.5)*0.9;
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t*0.5)*0.7; 
        if (data.leftArm) data.leftArm.rotation.x = -0.2 + Math.sin(t*0.5)*0.3;
        if (data.rightArm) data.rightArm.rotation.x = -0.8 - Math.sin(t*0.5)*0.3; 
    } else if (type === 3) {
        if (data.innerGroup) { data.innerGroup.rotation.x = 1.4; data.innerGroup.position.y = -0.5; data.innerGroup.rotation.z = Math.sin(t)*0.15; }
        if (data.leftArm) { data.leftArm.rotation.x = -Math.PI/2 + Math.sin(t)*0.9; data.leftArm.rotation.z = 0.2; }
        if (data.rightArm) { data.rightArm.rotation.x = -Math.PI/2 - Math.sin(t)*0.9; data.rightArm.rotation.z = -0.2; }
    } else if (type === 1 || type === 5) {
        if (data.innerGroup) { data.innerGroup.rotation.x = 0.6; data.innerGroup.rotation.z = Math.sin(timeSec*20)*0.1; }
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t*1.5)*1.4;
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t*1.5)*1.4;
        if (data.leftArm) data.leftArm.rotation.x = -Math.PI/2 - Math.sin(t*2.5)*0.8;
        if (data.rightArm) data.rightArm.rotation.x = -Math.PI/2 + Math.sin(t*2.5)*0.8;
    } else {
        if (data.innerGroup) { data.innerGroup.rotation.x = 0.35; data.innerGroup.rotation.z = Math.sin(timeSec*8)*0.05; }
        if (data.leftLeg) data.leftLeg.rotation.x = Math.sin(t)*1.2;
        if (data.rightLeg) data.rightLeg.rotation.x = -Math.sin(t)*1.2;
        const flail = distToPlayer < 6 ? Math.sin(timeSec*35)*0.4 : Math.sin(t)*0.2;
        if (data.leftArm) { data.leftArm.rotation.x = -Math.PI/2.2 - flail; data.leftArm.rotation.z = 0.1; }
        if (data.rightArm) { data.rightArm.rotation.x = -Math.PI/2.2 + flail; data.rightArm.rotation.z = -0.1; }
    }

    if (data.head && type !== 2 && type !== 7) {
        let twitchSpeed = (type === 1 || type === 5) ? 40 : 15;
        let intensity = (type === 1 || type === 5) ? 0.3 : 0.15;
        data.head.rotation.y = Math.sin(timeSec * twitchSpeed) * Math.cos(timeSec * 5) * intensity;
        data.head.rotation.z = Math.sin(timeSec * (twitchSpeed * 0.8)) * (intensity * 0.5);
    }
}