console.log("--- script.js HAS STARTED EXECUTING ---");

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import * as TWEEN from './tween.esm.min.js'; 


// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null;
let isSceneInitialized = false; 

const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn'); 

// Camera Presets
const CAMERA_PRESETS = {
    // NEW TIBERIAN SUN CAMERA PRESET (from your latest screenshot)
    // The positions are based on the original Blender units.
    // We will dynamically scale this position based on the loaded model's scale in the scene.
    tiberianSun: {
        // Blender Location (X, Y, Z): (1.79616, -1.78978, 1.73212)
        // Blender Rotation (Quaternion WXYZ): (0.977, 0.000, 0.000, 0.214)
        // Converting Blender Q(W,X,Y,Z) to Three.js Q(X,Y,Z,W): Q(0,0,0.214,0.977)
        // This corresponds to a Z-rotation (around 25 degrees)
        // For simplicity and direct control, we'll store the desired *relative* position and let a function
        // place it correctly relative to the *scaled* model.
        // Let's use the angles you want, rather than raw coordinates for this specific preset.
        // We want a top-down, slightly isometric view, characteristic of TS.
        // Assuming the model is centered at (0,0,0) after loading.
        // Let's create a vector that represents the *direction* from the center for the camera.
        // For a roughly 45-degree isometric view:
        relativePositionVector: new THREE.Vector3(1, -1, 1).normalize(), // Example: isometric 45 deg angle
        baseDistance: 50 // Base distance for calculation, will be scaled
    },
    redAlert2: {
        relativePositionVector: new THREE.Vector3(1.2, -0.8, 1.2).normalize(), // More squashed isometric
        baseDistance: 60
    }
};

// Grid Presets
const GRID_PRESETS = {
    // Tiberian Sun: Assuming 1 Blender unit = 1 Three.js unit
    // Your previous request was Subdivisions: 10, Scale: 1.00 for Blender,
    // which implies 10 subdivisions per 1 main unit.
    // If our model is scaled to approx 50 units, a grid of 100x100 with 1000 divisions
    // means cells are 0.1 x 0.1 units, and 10 of these make a 1x1 area.
    // This seems consistent with high-detail grids for precise placement.
    tiberianSun: {
        size: 100,      // Total size of the grid (e.g., 100x100 units)
        divisions: 1000, // Number of divisions across the size (1000 divisions over 100 units = 0.1 unit per cell)
        colorCenterLine: 0x444444, // Darker gray for center lines
        colorGrid: 0x888888       // Lighter gray for grid lines
    },
    redAlert2: {
        size: 150,
        divisions: 15,
        colorCenterLine: 0x333333,
        colorGrid: 0x666666
    }
};

// --- Initialization functions ---

function init() {
    console.log("INIT: Starting Three.js initialization.");
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    camera = new THREE.PerspectiveCamera(75, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    // Camera position will be set by applyCameraPreset (called after controls)

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

    // Call camera preset AFTER controls are initialized, using a default target
    applyCameraPreset('tiberianSun', new THREE.Vector3(0,0,0)); // Default lookAt target is origin
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
    addGridHelper('tiberianSun');
    console.log("INIT: Grid helper added.");

    // Handle Window Resizing
    window.addEventListener('resize', onWindowResize, false);

    isSceneInitialized = true;
    console.log("INIT: isSceneInitialized set to true.");

    // Attach button listener and enable it here, AFTER init is complete
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
        loadModelBtn.disabled = false; // <<< Enable the button here
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

            currentModel.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50; // Our scene's target size for loaded models
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            // currentModel.position.multiplyScalar(scaleFactor); // Don't re-scale position after centering

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

            // Update controls target and camera position to frame the new model
            // Make sure the camera still looks at the model's new center (0,0,0)
            controls.target.set(0,0,0); // Model is centered at origin

            // Recalculate camera position based on the new model's dimensions
            // and the desired TS view angle, *relative* to the scaled model.
            // Use the targetSize (50) as reference for the camera distance
            const targetLookAt = new THREE.Vector3(0,0,0); // Camera will look at model's center
            
            // Adjust CAMERA_PRESETS to hold desired offset direction and scale
            const preset = CAMERA_PRESETS['tiberianSun'];
            const desiredDistance = preset.baseDistance * scaleFactor; // Scale distance by model's scale factor
            
            // Calculate new camera position
            camera.position.copy(preset.relativePositionVector).multiplyScalar(desiredDistance).add(targetLookAt);
            camera.lookAt(targetLookAt);

            controls.update(); // Update controls to reflect new camera position and target
            console.log('LOAD MODEL: Camera framed model with TS preset.');

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

const cameraAngleSelect = document.getElementById('cameraAngleSelect');
const applyCameraAngleBtn = document.getElementById('applyCameraAngle');

if (applyCameraAngleBtn) {
    applyCameraAngleBtn.addEventListener('click', () => {
        if (!isSceneInitialized) { console.warn("WARN: Scene not initialized for camera angle."); return; }
        // When applying a preset from UI, we apply it relative to current model's center
        const currentTarget = controls.target.clone(); // Get current target (model center)
        applyCameraPreset(cameraAngleSelect.value, currentTarget);
        console.log("SETTINGS: Camera angle applied:", cameraAngleSelect.value);
    });
}

// Function now accepts a target for the camera to look at
function applyCameraPreset(presetName, targetPosition = new THREE.Vector3(0,0,0)) {
    if (!camera || !controls) { 
        console.warn("WARN: Camera or controls not initialized for camera preset.");
        return;
    }
    const preset = CAMERA_PRESETS[presetName];
    if (preset) {
        // Calculate new position based on preset vector, base distance, and target
        // If a model is loaded, use its maxDim or current scale for a better fit
        let effectiveDistance = preset.baseDistance;
        if (currentModel) {
            const box = new THREE.Box3().setFromObject(currentModel);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            // This is the model's actual size after our scaling.
            // If it was scaled to 'targetSize = 50', then maxDim will be close to 50.
            // So we don't need another 'scaleFactor' here, just use a multiple of maxDim or a fixed distance
            effectiveDistance = maxDim * 1.5; // Example: 1.5 times the max dimension
            if (effectiveDistance < preset.baseDistance) effectiveDistance = preset.baseDistance; // Ensure minimum distance
        }
        
        const newPosition = preset.relativePositionVector.clone().multiplyScalar(effectiveDistance).add(targetPosition);

        new TWEEN.Tween(camera.position)
            .to(newPosition, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                camera.lookAt(targetPosition);
                controls.target.copy(targetPosition);
                controls.update();
            })
            .start();
    }
}

const gridSizeSelect = document.getElementById('gridSizeSelect');
const applyGridSizeBtn = document.getElementById('applyGridSize');

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

    const preset = GRID_PRESETS[presetName];
    if (preset) {
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

// Set initial state of the button. This part is critical for enabling.
// Note: The listener and disabled=false moved INTO init()
if (loadModelBtn) { 
    console.log("INITIAL: loadModelBtn element found during initial parse. Will be handled in init().");
} else {
    console.error("CRITICAL ERROR: loadModelBtn element not found on page load. Check index.html ID.");
}
console.log("SCRIPT: script.js finished initial parsing.");