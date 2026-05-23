import * as THREE from 'three';

// Exported so we can import it in game.js
export function createSoldier(shirtColorHex) {
    const playerGroup = new THREE.Group();

    const skinColor = 0xffcc99;
    const darkGrey = 0x222222;  
    const eyeWhite = 0xffffff;
    const black = 0x000000;
    const brown = 0x4a2e15;     

    // -- HEAD (Tagged for Headshots)
    const head = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: skinColor }));
    head.position.y = 1.25;
    head.name = "BotHead"; 
    playerGroup.add(head);

    // -- EYES & PUPILS (Tagged for Headshots)
    const leftEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: eyeWhite }));
    leftEye.position.set(-0.2, 1.35, 0.51); 
    leftEye.name = "BotHead";
    playerGroup.add(leftEye);

    const rightEye = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: eyeWhite }));
    rightEye.position.set(0.2, 1.35, 0.51);
    rightEye.name = "BotHead";
    playerGroup.add(rightEye);

    const leftPupil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: black }));
    leftPupil.position.set(-0.15, 1.35, 0.52); 
    leftPupil.name = "BotHead";
    playerGroup.add(leftPupil);

    const rightPupil = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.15, 0.05), new THREE.MeshLambertMaterial({ color: black }));
    rightPupil.position.set(0.15, 1.35, 0.52);
    rightPupil.name = "BotHead";
    playerGroup.add(rightPupil);

    // -- EYEBROWS (Tagged for Headshots)
    const leftBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), new THREE.MeshLambertMaterial({ color: brown }));
    leftBrow.position.set(-0.2, 1.48, 0.52);
    leftBrow.rotation.z = -0.1; 
    leftBrow.name = "BotHead";
    playerGroup.add(leftBrow);

    const rightBrow = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.08, 0.05), new THREE.MeshLambertMaterial({ color: brown }));
    rightBrow.position.set(0.2, 1.48, 0.52);
    rightBrow.rotation.z = 0.1; 
    rightBrow.name = "BotHead";
    playerGroup.add(rightBrow);

    // -- TORSO 
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: shirtColorHex }));
    torso.position.y = 0;
    playerGroup.add(torso);

    // -- VEST & BACKPACK
    const vestFront = new THREE.Mesh(new THREE.BoxGeometry(0.85, 1.1, 0.1), new THREE.MeshLambertMaterial({ color: darkGrey }));
    vestFront.position.set(0, 0.1, 0.26); 
    playerGroup.add(vestFront);

    const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1, 0.3), new THREE.MeshLambertMaterial({ color: darkGrey }));
    backpack.position.set(0, 0.1, -0.4); 
    playerGroup.add(backpack);

    // -- ARMS
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: skinColor }));
    leftArm.position.set(-0.75, 0, 0); 
    playerGroup.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: skinColor }));
    rightArm.position.set(0.75, 0, 0);
    playerGroup.add(rightArm);

    // -- LEGS
    const leftLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: darkGrey }));
    leftLeg.position.set(-0.25, -1.5, 0); 
    playerGroup.add(leftLeg);

    const rightLeg = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.5, 0.5), new THREE.MeshLambertMaterial({ color: darkGrey }));
    rightLeg.position.set(0.25, -1.5, 0);
    playerGroup.add(rightLeg);

    // Ensure detailed model casts shadows
    playerGroup.traverse((child) => { if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; } });

    return playerGroup;
}