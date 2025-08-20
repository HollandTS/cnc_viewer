console.log("--- script.js HAS STARTED EXECUTING ---");

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from './tween.esm.min.js'; 

// Import preset managers
import { loadCameraPresets, getCameraPreset, getCameraPresetNames } from './presets/camera/camera_presets_manager.js';
import { loadGridPresets, getGridPreset, getGridPresetNames } from './presets/grid/grid_presets_manager.js';

// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null;
let isSceneInitialized = false; 

const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn'); 
const cameraAngleSelect = document.getElementById('cameraAngleSelect');
const applyCameraAngleBtn = document.getElementById('applyCameraAngle');
const gridSizeSelect = document.getElementById('gridSizeSelect');
const applyGridSizeBtn = document.getElementById('applyGridSize');
const sunAzimuth = document.getElementById('sunAzimuth');
const sunElevation = document.getElementById('sunElevation');
const sunAzimuthValueSpan = document.getElementById('sunAzimuthValue');
const sunElevationValueSpan = document.getElementById('sunElevationValue');


// --- No more hardcoded CAMERA_PRESETS or GRID_PRESETS here! ---


// --- Initialization functions ---

async function init() { // Make init() async because it will load presets
    console.log("INIT: Starting Three.js initialization.");
    
    // --- Load Presets First ---
    await loadCameraPresets();
    await loadGridPresets();
    populatePresetDropdowns(); // Populate dropdowns after presets are loaded
    console.log("INIT: All presets loaded and dropdowns populated.");


    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(75, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);

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

            const modelCenter = new THREE.Vector3(0,0,0); // Model is centered at origin
            applyCameraPreset(cameraAngleSelect.value, modelCenter); // Apply the currently selected camera preset
            console.log('LOAD MODEL: Camera framed model using current preset.');

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
        const currentTarget = currentModel ? controls.target.clone() : new THREE.Vector3(0,0,0); 
        applyCameraPreset(cameraAngleSelect.value, currentTarget);
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

    let modelMaxDim = 50; 
    if (currentModel) {
        const box = new THREE.Box3().setFromObject(currentModel);
        const size = box.getSize(new THREE.Vector3());
        modelMaxDim = Math.max(size.x, size.y, size.z);
    }
    
    let newPosition;
    let targetQuaternion;

    // Determine which type of preset is being used (Blender-converted vs. generic isometric)
    if (preset.basePosition && preset.rotationQuaternion) {
        // This path is for the Tiberian Sun preset, using Blender-converted data
        // Adjust positionScaleMultiplier in the preset file to control zoom/distance.
        newPosition = preset.basePosition.clone().multiplyScalar(preset.positionScaleMultiplier).add(targetPosition);
        targetQuaternion = preset.rotationQuaternion.clone();
        
        console.log(`DEBUG: Applying Blender-converted position: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(2)}, ${newPosition.z.toFixed(2)}) and Quaternion.`);

    } else if (preset.positionOffset && preset.rotation) {
        // This path is for other presets (like Red Alert 2), using generic isometric logic
        const desiredDistance = modelMaxDim * preset.distanceRatio;
        newPosition = preset.positionOffset.clone().multiplyScalar(desiredDistance).add(targetPosition);
        targetQuaternion = new THREE.Quaternion().setFromEuler(preset.rotation);
        console.log(`DEBUG: Applying generic isometric position and rotation.`);

    } else {
        console.warn("WARN: Invalid camera preset configuration for:", presetName);
        return;
    }

    // Animate camera position
    new TWEEN.Tween(camera.position)
        .to(newPosition, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .start();

    // Animate camera quaternion
    new TWEEN.Tween(camera.quaternion)
        .to({ _x: targetQuaternion.x, _y: targetQuaternion.y, _z: targetQuaternion.z, _w: targetQuaternion.w }, 1000)
        .easing(TWEEN.Easing.Quadratic.Out)
        .onUpdate(() => {
            camera.lookAt(targetPosition); 
            controls.target.copy(targetPosition); 
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