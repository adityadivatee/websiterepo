import * as THREE from 'three';

// --- GLOBAL MEMORY OPTIMIZATION ---
const raycaster = new THREE.Raycaster();
const camDirection = new THREE.Vector3();
const camRight = new THREE.Vector3();
const worldMove = new THREE.Vector3();
const downVector = new THREE.Vector3(0, -1, 0);
const upVector = new THREE.Vector3(0, 1, 0);
const inputDirection = new THREE.Vector3();
const currentPos = new THREE.Vector3();
const xAxisVec = new THREE.Vector3();
const zAxisVec = new THREE.Vector3();

export function updatePlayerPhysics(camera, velocity, controls, moveState, mapColliders, delta) {
    let canJump = false;

    // 1. GRAVITY & PHYSICS DECAY
    velocity.y -= 9.8 * 10.0 * delta; 
    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;

    // THE FIX: The "Deadzone Clamp" stops infinite micro-drifting!
    if (Math.abs(velocity.x) < 0.2) velocity.x = 0;
    if (Math.abs(velocity.z) < 0.2) velocity.z = 0;

    // 2. INPUT ACCELERATION
    inputDirection.set(
        Number(moveState.right) - Number(moveState.left),
        0,
        Number(moveState.forward) - Number(moveState.backward)
    );
    
    if (inputDirection.lengthSq() > 0) {
        inputDirection.normalize();
    }

    const speedMultiplier = 150.0;
    if (moveState.forward || moveState.backward) velocity.z -= inputDirection.z * speedMultiplier * delta;
    if (moveState.left || moveState.right) velocity.x -= inputDirection.x * speedMultiplier * delta;

    // 3. HORIZONTAL MAP COLLISION
    currentPos.copy(camera.position);
    currentPos.y -= 2; 

    camera.getWorldDirection(camDirection);
    camDirection.y = 0; 
    if (camDirection.lengthSq() > 0) camDirection.normalize(); else camDirection.set(0, 0, -1);
    
    camRight.crossVectors(camDirection, camera.up);
    if (camRight.lengthSq() > 0) camRight.normalize(); else camRight.set(1, 0, 0);

    worldMove.set(0, 0, 0);
    worldMove.addScaledVector(camDirection, -velocity.z * delta);
    worldMove.addScaledVector(camRight, -velocity.x * delta);

    // THE FIX: Reduced buffer from 1.2 to 0.6 so raycasters don't trigger overlapping walls
    const buffer = 0.6; 

    // Test X-axis movement
    if (Math.abs(worldMove.x) > 0.0001) {
        xAxisVec.set(Math.sign(worldMove.x), 0, 0);
        raycaster.set(currentPos, xAxisVec);
        const hitX = raycaster.intersectObjects(mapColliders, false);
        if (hitX.length > 0 && hitX[0].distance < buffer) {
            worldMove.x = 0; 
            velocity.x = 0;  
        }
    }

    // Test Z-axis movement
    if (Math.abs(worldMove.z) > 0.0001) {
        zAxisVec.set(0, 0, Math.sign(worldMove.z));
        raycaster.set(currentPos, zAxisVec);
        const hitZ = raycaster.intersectObjects(mapColliders, false);
        if (hitZ.length > 0 && hitZ[0].distance < buffer) {
            worldMove.z = 0; 
            velocity.z = 0;  
        }
    }

    // Apply safe horizontal movement
    camera.position.x += worldMove.x;
    camera.position.z += worldMove.z;
    camera.position.y += velocity.y * delta;

    // 4. VERTICAL COLLISION (Y-axis)
    if (velocity.y > 0) {
        raycaster.set(camera.position, upVector);
        const headHits = raycaster.intersectObjects(mapColliders, false);
        if (headHits.length > 0 && headHits[0].distance < 0.5) {
            velocity.y = 0; 
        }
    }

    let groundHeight = 0; 
    raycaster.set(camera.position, downVector);
    const floorHits = raycaster.intersectObjects(mapColliders, false);
    
    if (floorHits.length > 0) {
        groundHeight = floorHits[0].point.y; 
    }

    if (camera.position.y <= groundHeight + 4) { 
        velocity.y = 0;
        camera.position.y = groundHeight + 4; 
        canJump = true;
    }

    return canJump;
}
