// --- Material Selection Controls ---
// ...existing code...
const matHue = document.getElementById('matHue');
const matHueBox = document.getElementById('matHueBox');
const matContrast = document.getElementById('matContrast');
const matContrastBox = document.getElementById('matContrastBox');
const matSharpness = document.getElementById('matSharpness');
const matSharpnessBox = document.getElementById('matSharpnessBox');
const matBrightness = document.getElementById('matBrightness');
const matBrightnessBox = document.getElementById('matBrightnessBox');

function updateMaterial() {
    if (!currentModel) return;
    currentModel.traverse((node) => {
        if (node.isMesh && node.material) {
            // Always allow roughness and metalness
            if (matRough) node.material.roughness = parseFloat(matRough.value);
            if (matMetal) node.material.metalness = parseFloat(matMetal.value);
            // Only apply color/hue/brightness if no texture
            if (!node.material.map && node.material.color) {
                // Hue
                if (matHue) {
                    const h = parseFloat(matHue.value) / 360;
                    let hsl = { h: 0, s: 1, l: 0.5 };
                    node.material.color.getHSL(hsl);
                    node.material.color.setHSL(h, hsl.s, hsl.l);
                }
                // Brightness
                if (matBrightness) {
                    let hsl = { h: 0, s: 1, l: 0.5 };
                    node.material.color.getHSL(hsl);
                    node.material.color.setHSL(hsl.h, hsl.s, hsl.l * parseFloat(matBrightness.value));
                }
            }
            // Contrast, Sharpness: not natively supported, requires post-processing
            node.material.needsUpdate = true;
        }
    });
    if (matRoughBox) matRoughBox.value = matRough.value;
    if (matMetalBox) matMetalBox.value = matMetal.value;
    if (matHueBox) matHueBox.value = matHue.value;
    if (matContrastBox) matContrastBox.value = matContrast.value;
    if (matSharpnessBox) matSharpnessBox.value = matSharpness.value;
    if (matBrightnessBox) matBrightnessBox.value = matBrightness.value;
}

if (matRough) matRough.addEventListener('input', updateMaterial);
if (matRoughBox) matRoughBox.addEventListener('input', () => {
    matRough.value = matRoughBox.value;
    updateMaterial();
});
if (matMetal) matMetal.addEventListener('input', updateMaterial);
if (matMetalBox) matMetalBox.addEventListener('input', () => {
    matMetal.value = matMetalBox.value;
    updateMaterial();
});
if (matHue) matHue.addEventListener('input', updateMaterial);
if (matHueBox) matHueBox.addEventListener('input', () => {
    matHue.value = matHueBox.value;
    updateMaterial();
});
if (matContrast) matContrast.addEventListener('input', updateMaterial);
if (matContrastBox) matContrastBox.addEventListener('input', () => {
    matContrast.value = matContrastBox.value;
    updateMaterial();
});
if (matSharpness) matSharpness.addEventListener('input', updateMaterial);
if (matSharpnessBox) matSharpnessBox.addEventListener('input', () => {
    matSharpness.value = matSharpnessBox.value;
    updateMaterial();
});
if (matBrightness) matBrightness.addEventListener('input', updateMaterial);
if (matBrightnessBox) matBrightnessBox.addEventListener('input', () => {
    matBrightness.value = matBrightnessBox.value;
    updateMaterial();
});
            // ...existing code...
// --- Material Selection Controls ---
const matColor = document.getElementById('matColor');
// ...existing code...

// ...existing code...

if (matColor) matColor.addEventListener('input', updateMaterial);
if (matMetal) matMetal.addEventListener('input', updateMaterial);
if (matMetalBox) matMetalBox.addEventListener('input', () => {
    matMetal.value = matMetalBox.value;
    updateMaterial();
});
if (matRough) matRough.addEventListener('input', updateMaterial);
if (matRoughBox) matRoughBox.addEventListener('input', () => {
    matRough.value = matRoughBox.value;
    updateMaterial();
});
// --- Model Transform Controls ---
const modelScale = document.getElementById('modelScale');
const modelScaleBox = document.getElementById('modelScaleBox');
const modelRotX = document.getElementById('modelRotX');
const modelRotXBox = document.getElementById('modelRotXBox');
const modelRotY = document.getElementById('modelRotY');
const modelRotYBox = document.getElementById('modelRotYBox');
const modelRotZ = document.getElementById('modelRotZ');
const modelRotZBox = document.getElementById('modelRotZBox');

function updateModelTransform() {
    if (!currentModel) return;
    // Scale
    const scaleVal = parseFloat(modelScale.value);
    currentModel.scale.setScalar(scaleVal);
    modelScaleBox.value = scaleVal;
    // Rotation (degrees to radians)
    const rotX = THREE.MathUtils.degToRad(parseFloat(modelRotX.value));
    const rotY = THREE.MathUtils.degToRad(parseFloat(modelRotY.value));
    const rotZ = THREE.MathUtils.degToRad(parseFloat(modelRotZ.value));
    currentModel.rotation.set(rotX, rotY, rotZ);
    modelRotXBox.value = modelRotX.value;
    modelRotYBox.value = modelRotY.value;
    modelRotZBox.value = modelRotZ.value;
}

if (modelScale) modelScale.addEventListener('input', updateModelTransform);
if (modelScaleBox) modelScaleBox.addEventListener('input', () => {
    modelScale.value = modelScaleBox.value;
    updateModelTransform();
});
if (modelRotX) modelRotX.addEventListener('input', updateModelTransform);
if (modelRotXBox) modelRotXBox.addEventListener('input', () => {
    modelRotX.value = modelRotXBox.value;
    updateModelTransform();
});
if (modelRotY) modelRotY.addEventListener('input', updateModelTransform);
if (modelRotYBox) modelRotYBox.addEventListener('input', () => {
    modelRotY.value = modelRotYBox.value;
    updateModelTransform();
});
if (modelRotZ) modelRotZ.addEventListener('input', updateModelTransform);
if (modelRotZBox) modelRotZBox.addEventListener('input', () => {
    modelRotZ.value = modelRotZBox.value;
    updateModelTransform();
});
console.log("--- script.js HAS STARTED EXECUTING ---"); 

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from './tween.esm.min.js'; 

// Import preset managers (assuming you have these files in presets/camera and presets/grid)
import { loadCameraPresets, getCameraPreset, getCameraPresetNames } from './presets/camera/camera_presets_manager.js';
import { loadGridPresets, getGridPreset, getGridPresetNames } from './presets/grid/grid_presets_manager.js';

// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null;
let isSceneInitialized = false; 

// --- HTML Element References (Declared once) ---
const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn'); 
const cameraAngleSelect = document.getElementById('cameraAngleSelect');
const applyCameraAngleBtn = document.getElementById('applyCameraAngle');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const applyGridSizeBtn = document.getElementById('applyGridSize');
const bgColorPicker = document.getElementById('bgColorPicker');
const bgColorEnable = document.getElementById('bgColorEnable');
// --- Background Color Logic ---
function setBackgroundAndGrid() {
    if (!scene) return;
    if (bgColorEnable && bgColorEnable.checked) {
        // Set background color from picker
        scene.background = new THREE.Color(bgColorPicker.value);
        // Hide grid
        if (gridHelper) gridHelper.visible = false;
        console.log("BG COLOR: Enabled, color set to", bgColorPicker.value);
    } else {
        // Restore default background and grid
        scene.background = new THREE.Color(0x111111);
        if (gridHelper) gridHelper.visible = true;
        console.log("BG COLOR: Disabled, restored default background and grid.");
    }
}

if (bgColorPicker) {
    bgColorPicker.addEventListener('input', () => {
        if (bgColorEnable && bgColorEnable.checked) setBackgroundAndGrid();
    });
}
if (bgColorEnable) {
    bgColorEnable.addEventListener('change', setBackgroundAndGrid);
}
// Removed sunAzimuth etc. from here - they are declared later in their specific section


// Camera Presets - These define the *desired angle and distance relative to the model*
const CAMERA_PRESETS = {
    tiberianSun: {
        basePosition: new THREE.Vector3(1.79616, 1.73212, 1.78978),
        positionScaleMultiplier: 10, 
        rotationQuaternion: new THREE.Quaternion(0.000, 0.000, 0.214, 0.977)
    },
    redAlert2: {
        positionOffset: new THREE.Vector3(1, 0.8, 1).normalize(), 
        distanceRatio: 3.5, 
        rotation: new THREE.Euler(-Math.atan(1 / Math.sqrt(3)), Math.PI / 4, 0, 'YXZ') 
    }
};

// Grid Presets (kept same as last successful iteration)
const GRID_PRESETS = {
    tiberianSun: {
        size: 100,      
        divisions: 20, 
        colorCenterLine: 0x444444, 
        colorGrid: 0x888888       
    },
    redAlert2: {
        size: 150,
        divisions: 15,
        colorCenterLine: 0x333333,
        colorGrid: 0x666666
    }
};

// --- Initialization functions ---

async function init() { 
    console.log("INIT: Starting Three.js initialization.");
    
    // --- Load Presets First ---
    await loadCameraPresets();
    await loadGridPresets();
    populatePresetDropdowns(); // Populate dropdowns after presets are loaded
    console.log("INIT: All presets loaded and dropdowns populated.");


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Switch to OrthographicCamera
    const aspect = viewportContainer.clientWidth / viewportContainer.clientHeight;
    const frustumSize = 200;
    camera = new THREE.OrthographicCamera(
        frustumSize * aspect / -2, frustumSize * aspect / 2,
        frustumSize / 2, frustumSize / -2,
        -1000, 1000
    );
// --- Model Move Controls ---
const modelMoveX = document.getElementById('modelMoveX');
const modelMoveXBox = document.getElementById('modelMoveXBox');
const modelMoveY = document.getElementById('modelMoveY');
const modelMoveYBox = document.getElementById('modelMoveYBox');
const modelMoveZ = document.getElementById('modelMoveZ');
const modelMoveZBox = document.getElementById('modelMoveZBox');

function updateModelMove() {
    if (!currentModel) return;
    const x = parseFloat(modelMoveX.value);
    const y = parseFloat(modelMoveY.value);
    const z = parseFloat(modelMoveZ.value);
    currentModel.position.set(x, y, z);
    modelMoveXBox.value = x;
    modelMoveYBox.value = y;
    modelMoveZBox.value = z;
    // Do NOT move controls/camera, only the object
}

if (modelMoveX) modelMoveX.addEventListener('input', updateModelMove);
if (modelMoveXBox) modelMoveXBox.addEventListener('input', () => {
    modelMoveX.value = modelMoveXBox.value;
    updateModelMove();
});
if (modelMoveY) modelMoveY.addEventListener('input', updateModelMove);
if (modelMoveYBox) modelMoveYBox.addEventListener('input', () => {
    modelMoveY.value = modelMoveYBox.value;
    updateModelMove();
});
if (modelMoveZ) modelMoveZ.addEventListener('input', updateModelMove);
if (modelMoveZBox) modelMoveZBox.addEventListener('input', () => {
    modelMoveZ.value = modelMoveZBox.value;
    updateModelMove();
});

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewportContainer.appendChild(renderer.domElement);
    console.log("INIT: Renderer appended to viewport.");

    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2; 
    console.log("INIT: Controls set up.");

    // Apply initial camera preset (default to 'tiberianSun')
    applyCameraPreset('tiberianSun', new THREE.Vector3(0,0,0)); 
    console.log("INIT: Initial camera preset applied.");

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); 
    directionalLight.position.set(-0.8005, -10.1766, 12.2700); 
    directionalLight.intensity = 4.0; 
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0); 
    scene.add(directionalLight);
    scene.add(directionalLight.target); 
    console.log("INIT: Lights added.");

    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;


    // Grid Helper
    addGridHelper('tiberianSun'); // Default to Tiberian Sun grid
    console.log("INIT: Grid helper added.");

    // Handle Window Resizing
    window.addEventListener('resize', onWindowResize, false);

    isSceneInitialized = true;
    console.log("INIT: isSceneInitialized set to true.");

    // Attach load model button listener and enable it here
    if (loadModelBtn) {
        loadModelBtn.addEventListener('click', () => {
            if (!isSceneInitialized) { 
                console.warn("WARN: Scene not initialized yet. Cannot load model.");
                return;
            }
            console.log("CLICK: Load Model button clicked. Scene is initialized.");
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.glb, .gltf';
            input.onchange = (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const url = e.target.result;
                        loadModel(url);
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        });
        loadModelBtn.disabled = false; // Enable the button here
        console.log("INIT: Load Model button listener attached and enabled.");
    } else {
        console.error("INIT: loadModelBtn element not found!");
    }

    updateSunDirection(); 
    console.log("INIT: updateSunDirection called.");

    // Initial Render
    animate();
    console.log("INIT: Animation loop started.");
}

function animate() {
    requestAnimationFrame(animate);
    if (controls) controls.update();
    TWEEN.update(); 
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer || !viewportContainer) return;
    camera.aspect = viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
}

// --- Dynamic Preset Dropdown Population ---
function populatePresetDropdowns() {
    // Populate Camera Angle Select
    const cameraPresetNames = getCameraPresetNames();
    cameraAngleSelect.innerHTML = ''; // Clear existing options
    cameraPresetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()); // "tiberianSun" -> "Tiberian Sun"
        if (name === 'tiberianSun') { // Set default selection
            option.selected = true;
        }
        cameraAngleSelect.appendChild(option);
    });

    // Populate Grid Size Select
    const gridPresetNames = getGridPresetNames();
    gridSizeSelect.innerHTML = ''; // Clear existing options
    gridPresetNames.forEach(name => {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
        if (name === 'tiberianSun') { // Set default selection
            option.selected = true;
        }
        gridSizeSelect.appendChild(option);
    });
}


// --- Model Loading ---
const loader = new GLTFLoader(); 

function loadModel(url) {
    if (!scene || !loader) { 
        console.error("ERROR: Scene or GLTFLoader not available to load model!");
        return;
    }
    console.log("LOAD MODEL: Attempting to load model from URL:", url.substring(0, 50) + '...');

    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse((object) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            if (object.texture) object.texture.dispose();
            if (object.material && object.material.map) object.material.map.dispose();
            if (object.material && object.material.lightMap) object.material.lightMap.dispose();
            if (object.material && object.material.aoMap) object.material.aoMap.dispose();
        });
        currentModel = null;
        console.log("LOAD MODEL: Previous model removed.");
    }

    loader.load(
        url,
        (gltf) => {
            currentModel = gltf.scene;
            console.log("LOAD MODEL: GLTF loaded successfully.");

            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center); // Center the model at the origin

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50; // Our scene's target size for loaded models (e.g. 50x50x50 units)
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            
            console.log("LOAD MODEL: Model centered and scaled. New scaleFactor:", scaleFactor);

            currentModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            console.log("LOAD MODEL: Shadows enabled for model meshes.");

            scene.add(currentModel);
            console.log("LOAD MODEL: Model added to scene.");

            // Auto-enable background color checkbox
            if (bgColorEnable) {
                bgColorEnable.checked = true;
                setBackgroundAndGrid();
            }

            // Auto-apply Tiberian Sun camera angle
                // Auto-apply Tiberian Sun camera angle (force camera and controls)
                const preset = getCameraPreset('tiberianSun');
                if (preset && preset.positionOffset && preset.rotationQuaternion) {
                    let modelMaxDim = 50;
                    if (currentModel) {
                        const box = new THREE.Box3().setFromObject(currentModel);
                        const size = box.getSize(new THREE.Vector3());
                        modelMaxDim = Math.max(size.x, size.y, size.z);
                    }
                    const desiredDistance = modelMaxDim * preset.distanceRatio;
                    const newPosition = preset.positionOffset.clone().multiplyScalar(desiredDistance);
                    camera.position.copy(newPosition);
                    camera.quaternion.copy(preset.rotationQuaternion);
                    controls.target.set(0,0,0);
                    controls.update();
                    camera.lookAt(0,0,0);
                    if (renderer && scene && camera) renderer.render(scene, camera);
                    console.log("DEBUG: Camera snapped to Tiberian Sun preset after model load.");
                }
                if (cameraAngleSelect) cameraAngleSelect.value = 'tiberianSun';
                console.log('LOAD MODEL: Camera framed model using Tiberian Sun preset.');
// --- Model Transform Controls ---
const modelScale = document.getElementById('modelScale');
const modelScaleBox = document.getElementById('modelScaleBox');
const modelRotX = document.getElementById('modelRotX');
const modelRotXBox = document.getElementById('modelRotXBox');
const modelRotY = document.getElementById('modelRotY');
const modelRotYBox = document.getElementById('modelRotYBox');
const modelRotZ = document.getElementById('modelRotZ');
const modelRotZBox = document.getElementById('modelRotZBox');

function updateModelTransform() {
    if (!currentModel) return;
    // Scale
    const scaleVal = parseFloat(modelScale.value);
    currentModel.scale.setScalar(scaleVal);
    modelScaleBox.value = scaleVal;
    // Rotation (degrees to radians)
    const rotX = THREE.MathUtils.degToRad(parseFloat(modelRotX.value));
    const rotY = THREE.MathUtils.degToRad(parseFloat(modelRotY.value));
    const rotZ = THREE.MathUtils.degToRad(parseFloat(modelRotZ.value));
    currentModel.rotation.set(rotX, rotY, rotZ);
    modelRotXBox.value = modelRotX.value;
    modelRotYBox.value = modelRotY.value;
    modelRotZBox.value = modelRotZ.value;
}

if (modelScale) modelScale.addEventListener('input', updateModelTransform);
if (modelScaleBox) modelScaleBox.addEventListener('input', () => {
    modelScale.value = modelScaleBox.value;
    updateModelTransform();
});
if (modelRotX) modelRotX.addEventListener('input', updateModelTransform);
if (modelRotXBox) modelRotXBox.addEventListener('input', () => {
    modelRotX.value = modelRotXBox.value;
    updateModelTransform();
});
if (modelRotY) modelRotY.addEventListener('input', updateModelTransform);
if (modelRotYBox) modelRotYBox.addEventListener('input', () => {
    modelRotY.value = modelRotYBox.value;
    updateModelTransform();
});
if (modelRotZ) modelRotZ.addEventListener('input', updateModelTransform);
if (modelRotZBox) modelRotZBox.addEventListener('input', () => {
    modelRotZ.value = modelRotZBox.value;
    updateModelTransform();
});

            console.log('Final Model Object:', currentModel);
        },
        (xhr) => {
            console.log('LOAD PROGRESS:', (xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded');
        },
        (error) => {
            console.error('ERROR: An error happened loading the model:', error);
            alert('Error loading model. Check console for details.');
        }
    );
}

// --- Settings Logic ---

if (applyCameraAngleBtn) {
    applyCameraAngleBtn.addEventListener('click', () => {
        if (!isSceneInitialized) { console.warn("WARN: Scene not initialized for camera angle."); return; }
    // Always snap to model center (origin) for camera presets
        // Force camera and controls to snap instantly for debugging
        const preset = getCameraPreset(cameraAngleSelect.value);
        if (preset && preset.position && preset.rotation) {
            // Convert Blender (X, Y, Z) to Three.js (X, Z, -Y)
            const blenderPos = preset.position;
            camera.position.set(blenderPos.x, blenderPos.z, -blenderPos.y);
            camera.up.set(0, 1, 0); // Y-up for Three.js upright orientation
            camera.lookAt(0,0,0);
            controls.target.set(0,0,0);
            controls.update();
            console.log('DEBUG: Camera position:', camera.position.toArray());
            console.log('DEBUG: Camera up:', camera.up.toArray());
            console.log('DEBUG: Camera target:', [0,0,0]);
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
                console.log("DEBUG: Camera snapped to Blender position and lookAt.");
            }
        } else {
            console.warn("WARN: Camera preset not found or invalid:", cameraAngleSelect.value);
        }
        console.log("SETTINGS: Camera angle applied:", cameraAngleSelect.value);
    });
}

// Function applies camera position and rotation based on preset type
function applyCameraPreset(presetName, targetPosition = new THREE.Vector3(0,0,0)) {
    if (!camera || !controls || !TWEEN) { 
        console.warn("WARN: Camera, controls, or TWEEN not initialized for camera preset.");
        return;
    }
    const preset = getCameraPreset(presetName); // Get preset from manager
    if (!preset) {
        console.warn("WARN: Camera preset not found:", presetName);
        return;
    }

    let modelMaxDim = 50; // Default if no model is loaded, or if model size is too small
    if (currentModel) {
        const box = new THREE.Box3().setFromObject(currentModel);
        const size = box.getSize(new THREE.Vector3());
        modelMaxDim = Math.max(size.x, size.y, size.z);
    }
    console.log(`DEBUG: Applying preset '${presetName}'. Model max dim: ${modelMaxDim.toFixed(2)}.`);

    let newPosition;
    let targetQuaternion;

    if (preset.positionOffset && preset.rotationQuaternion) {
        // This path is for the Tiberian Sun preset, using normalized positionOffset and rotationQuaternion
        // The new position is calculated by scaling the direction vector by 'distanceRatio' times modelMaxDim.
        const desiredDistance = modelMaxDim * preset.distanceRatio; // Use distanceRatio as intended
        newPosition = preset.positionOffset.clone().multiplyScalar(desiredDistance).add(targetPosition);
        targetQuaternion = preset.rotationQuaternion.clone();
        
        console.log(`DEBUG: TS Preset Applied. Desired Distance: ${desiredDistance.toFixed(2)}. New Position: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}).`);

    } else if (preset.positionOffset && preset.rotation) {
        // This path is for other presets (like Red Alert 2), using generic isometric logic
        const desiredDistance = modelMaxDim * preset.distanceRatio;
        newPosition = preset.positionOffset.clone().multiplyScalar(desiredDistance).add(targetPosition);
        targetQuaternion = new THREE.Quaternion().setFromEuler(preset.rotation);
        console.log(`DEBUG: Generic Preset Applied. Desired Distance: ${desiredDistance.toFixed(2)}. New Position: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}).`);

    } else {
        console.warn("WARN: Invalid camera preset configuration for:", presetName);
        return;
    }

    // Animate camera position
    new TWEEN.Tween(camera.position)
        .to(newPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => console.log("DEBUG: Camera position animation started."))
        .onComplete(() => console.log("DEBUG: Camera position animation completed."))
        .start();

    // Animate camera quaternion
    new TWEEN.Tween(camera.quaternion)
        .to({ _x: targetQuaternion.x, _y: targetQuaternion.y, _z: targetQuaternion.z, _w: targetQuaternion.w }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onStart(() => console.log("DEBUG: Camera rotation animation started."))
        .onComplete(() => console.log("DEBUG: Camera rotation animation completed."))
        .onUpdate(() => {
            camera.lookAt(targetPosition); // Keep camera looking at target during rotation
            controls.target.copy(targetPosition); // Keep controls looking at target during rotation
            controls.update();
        })
        .start();
    
    // Ensure controls target is explicitly set after animation starts
    controls.target.copy(targetPosition);
    controls.update(); 
}

if (applyGridSizeBtn) {
    applyGridSizeBtn.addEventListener('click', () => {
        if (!isSceneInitialized) { console.warn("WARN: Scene not initialized for grid size."); return; }
        addGridHelper(gridSizeSelect.value);
        console.log("SETTINGS: Grid size applied:", gridSizeSelect.value);
    });
}

function addGridHelper(presetName) {
    if (!scene) {
        console.warn("WARN: Scene not available for grid helper.");
        return;
    }
    if (gridHelper) {
        scene.remove(gridHelper);
        if (gridHelper.geometry) gridHelper.geometry.dispose();
        if (gridHelper.material) gridHelper.material.dispose();
    }

    const preset = getGridPreset(presetName); // Get preset from manager
    if (!preset) {
        console.warn("WARN: Grid preset not found:", presetName);
        return;
    }

    if (preset) { // Check again in case getGridPreset returned undefined
        gridHelper = new THREE.GridHelper(
            preset.size,
            preset.divisions,
            preset.colorCenterLine,
            preset.colorGrid
        );
        scene.add(gridHelper);
    }
}

const sunAzimuth = document.getElementById('sunAzimuth');
const sunElevation = document.getElementById('sunElevation');
const sunAzimuthValueSpan = document.getElementById('sunAzimuthValue');
const sunElevationValueSpan = document.getElementById('sunElevationValue');

function updateSunDirection() {
    if (!directionalLight) {
        console.warn("WARN: Directional light not initialized yet for sun settings.");
        return;
    }
    const azimuth = parseFloat(sunAzimuth.value);
    const elevation = parseFloat(sunElevation.value);

    sunAzimuthValueSpan.textContent = azimuth;
    sunElevationValueSpan.textContent = elevation;

    const azimuthRad = THREE.MathUtils.degToRad(azimuth);
    const elevationRad = THREE.MathUtils.degToRad(elevation);

    const r = 50;
    const x = r * Math.sin(elevationRad) * Math.cos(azimuthRad);
    const y = r * Math.cos(elevationRad);
    const z = r * Math.sin(elevationRad) * Math.sin(azimuthRad);

    directionalLight.position.set(x, y, z);
    directionalLight.target.position.set(0,0,0);
    directionalLight.target.updateMatrixWorld();
    console.log(`SETTINGS: Sun direction updated to Azimuth: ${azimuth}, Elevation: ${elevation}`);
}

if (sunAzimuth) sunAzimuth.addEventListener('input', updateSunDirection);
if (sunElevation) sunElevation.addEventListener('input', updateSunDirection);

// Call init() directly as soon as the script parses.
init(); 
console.log("SCRIPT: init() called from main script body.");

// Final log message for script parsing completion.
console.log("SCRIPT: script.js finished initial parsing.");