import * as THREE from 'three';

export function setupMobileControls(camera, moveState, touchLookEuler, gameSettings, callbacks) {
    const mobileUIContainer = document.getElementById('mobile-controls');
    const joyZone = document.getElementById('move-zone'); 
    const joyBg = document.getElementById('joystick-visual-bg'); 
    const joyKnob = document.getElementById('joystick-knob'); 
    const lookZone = document.getElementById('touch-look-zone'); 
    const fireBtn = document.getElementById('btn-fire');

    // THE FIX: We removed the aggressive "display: block" from here! 
    // Now, your index.html will handle making it visible ONLY when "Start" is clicked.
    if (mobileUIContainer) {
        mobileUIContainer.style.pointerEvents = 'none'; 
        mobileUIContainer.style.zIndex = '99999';
    }

    if (joyZone) {
        joyZone.style.cssText = "position:absolute; top:0; left:0; width:50%; height:100%; z-index:999999; pointer-events:auto; touch-action:none;";
    }
    
    if (lookZone) {
        lookZone.style.cssText = "position:absolute; top:0; right:0; width:50%; height:100%; z-index:999999; pointer-events:auto; touch-action:none;";
    }

    let joyTouchId = null; let joyActive = false; let joyOrigin = {x:0, y:0};
    let lookTouchId = null; let lastTouchX = 0, lastTouchY = 0;
    let fireTouchId = null; let fireLastX = 0, fireLastY = 0;

    if(joyZone && lookZone) {
        joyZone.addEventListener('touchstart', e => {
            e.preventDefault();
            for(let i=0; i<e.changedTouches.length; i++) {
                if(joyTouchId === null) {
                    joyTouchId = e.changedTouches[i].identifier; joyActive = true;
                    const t = e.changedTouches[i];
                    joyOrigin = { x: t.clientX, y: t.clientY };
                    if(joyBg) {
                        joyBg.style.left = (t.clientX - 60) + 'px'; 
                        joyBg.style.top = (t.clientY - 60) + 'px';
                        joyBg.style.opacity = '1'; 
                    }
                    if(joyKnob) joyKnob.style.transform = `translate(0px, 0px)`;
                }
            }
        }, {passive: false});

        joyZone.addEventListener('touchmove', e => {
            e.preventDefault(); if(!joyActive || !gameSettings.isRunning()) return;
            for(let i=0; i<e.changedTouches.length; i++) {
                if(e.changedTouches[i].identifier === joyTouchId) {
                    const t = e.changedTouches[i];
                    let dx = t.clientX - joyOrigin.x, dy = t.clientY - joyOrigin.y;
                    const dist = Math.hypot(dx, dy); const maxR = 50;
                    if(dist > maxR) { dx = (dx/dist)*maxR; dy = (dy/dist)*maxR; }
                    if(joyKnob) joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
                    moveState.forward = dy < -10; moveState.backward = dy > 10; moveState.left = dx < -10; moveState.right = dx > 10;
                }
            }
        }, {passive: false});

        joyZone.addEventListener('touchend', e => {
            for(let i=0; i<e.changedTouches.length; i++) {
                if(e.changedTouches[i].identifier === joyTouchId) {
                    joyTouchId = null; joyActive = false; if(joyBg) joyBg.style.opacity = '0';
                    moveState.forward = false; moveState.backward = false; moveState.left = false; moveState.right = false;
                }
            }
        });

        lookZone.addEventListener('touchstart', e => { 
            e.preventDefault();
            for(let i=0; i<e.changedTouches.length; i++) {
                if(lookTouchId === null) { lookTouchId = e.changedTouches[i].identifier; lastTouchX = e.changedTouches[i].clientX; lastTouchY = e.changedTouches[i].clientY; }
            }
        }, {passive: false});

        lookZone.addEventListener('touchmove', e => {
            e.preventDefault(); if(!gameSettings.isRunning() || gameSettings.isDead()) return;
            for(let i=0; i<e.changedTouches.length; i++) {
                if(e.changedTouches[i].identifier === lookTouchId) {
                    const t = e.changedTouches[i];
                    const dx = t.clientX - lastTouchX; const dy = t.clientY - lastTouchY; 
                    lastTouchX = t.clientX; lastTouchY = t.clientY;
                    const sens = parseFloat(window.gameSensitivity) || 1.0;
                    
                    touchLookEuler.setFromQuaternion(camera.quaternion);
                    touchLookEuler.y -= dx * 0.005 * sens; touchLookEuler.x -= dy * 0.005 * sens;
                    touchLookEuler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, touchLookEuler.x));
                    camera.quaternion.setFromEuler(touchLookEuler);
                }
            }
        }, {passive: false});

        lookZone.addEventListener('touchend', e => { 
            for(let i=0; i<e.changedTouches.length; i++) { if(e.changedTouches[i].identifier === lookTouchId) lookTouchId = null; }
        });
    }

    if(fireBtn) {
        fireBtn.style.pointerEvents = 'auto'; fireBtn.style.zIndex = '999999';
        fireBtn.addEventListener('touchstart', (e) => {
            e.preventDefault(); callbacks.initAudio(); callbacks.setShooting(true); callbacks.attemptShoot();
            for(let i=0; i<e.changedTouches.length; i++) {
                if(fireTouchId === null) { fireTouchId = e.changedTouches[i].identifier; fireLastX = e.changedTouches[i].clientX; fireLastY = e.changedTouches[i].clientY; }
            }
        }, {passive: false});

        fireBtn.addEventListener('touchmove', (e) => {
            e.preventDefault(); if(!gameSettings.isRunning() || gameSettings.isDead()) return;
            for(let i=0; i<e.changedTouches.length; i++) {
                if(e.changedTouches[i].identifier === fireTouchId) {
                    const t = e.changedTouches[i];
                    const dx = t.clientX - fireLastX; const dy = t.clientY - fireLastY;
                    fireLastX = t.clientX; fireLastY = t.clientY;
                    const sens = parseFloat(window.gameSensitivity) || 1.0;
                    
                    touchLookEuler.setFromQuaternion(camera.quaternion);
                    touchLookEuler.y -= dx * 0.003 * sens; touchLookEuler.x -= dy * 0.003 * sens;
                    touchLookEuler.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, touchLookEuler.x));
                    camera.quaternion.setFromEuler(touchLookEuler);
                }
            }
        }, {passive: false});

        fireBtn.addEventListener('touchend', (e) => {
            e.preventDefault();
            for(let i=0; i<e.changedTouches.length; i++) { if(e.changedTouches[i].identifier === fireTouchId) { fireTouchId = null; callbacks.setShooting(false); } }
        });
    }

    const bindBtn = (id, startFn, endFn) => {
        const b = document.getElementById(id); if(!b) return;
        b.style.pointerEvents = 'auto'; b.style.zIndex = '999999';
        b.addEventListener('touchstart', (e) => { e.preventDefault(); callbacks.initAudio(); startFn(); }, {passive: false});
        if(endFn) b.addEventListener('touchend', (e) => { e.preventDefault(); endFn(); }, {passive: false});
    };
    
    bindBtn('btn-aim', callbacks.toggleAim);
    bindBtn('btn-jump', callbacks.jump);
    bindBtn('btn-reload', callbacks.reload);
    bindBtn('btn-nade', callbacks.throwNade);
    bindBtn('btn-det', callbacks.detonateC4);
}
