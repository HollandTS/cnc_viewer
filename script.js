console.log("--- script.js HAS STARTED EXECUTING ---"); // Diagnostic log at the very top

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
// <<< THE DEFINITIVE TWEEN.JS IMPORT >>>
// This *must* be the only way TWEEN is referenced or loaded.
import * as TWEEN from './tween.esm.min.js'; 


// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null;
let isSceneInitialized = false; 

const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn');

// Camera Presets
const CAMERA_PRESETS = {
    tiberianSun: {
        position: new THREE.Vector3(110.0390, -110.0390, 89.8467),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    redAlert2: {
        position: new THREE.Vector3(70, 40, 70),
        lookAt: new THREE.Vector3(0, 0, 0)
    }
};

// Grid Presets
const GRID_PRESETS = {
    tiberianSun: {
        size: 100,
        divisions: 1000,
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

// --- Initialization functions (remain mostly same) ---

function init() {
    console.log("INIT: Starting Three.js initialization.");
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera
    camera = new THREE.PerspectiveCamera(75, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    applyCameraPreset('tiberianSun');

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewportContainer.appendChild(renderer.domElement);
    console.log("INIT: Renderer appended to viewport.");

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false;
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2;

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
    if (loadModelBtn) {
        loadModelBtn.disabled = false; // <<< Enable the button
        console.log("INIT: Load Model button enabled.");
    } else {
        console.warn("INIT: loadModelBtn element not found!");
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
    TWEEN.update(); // TWEEN is now directly imported, no typeof check needed
    if (renderer && scene && camera) renderer.render(scene, camera);
}

function onWindowResize() {
    if (!camera || !renderer || !viewportContainer) return;
    camera.aspect = viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
}

// --- Model Loading ---
const loader = new GLTFLoader(); // GLTFLoader is imported at the top now

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
} else {
    console.warn("WARN: loadModelBtn element not found at script start.");
}


function loadModel(url) {
    if (!scene || !loader) { // Check for scene AND loader instance
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
            const targetSize = 50;
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            currentModel.position.multiplyScalar(scaleFactor);
            console.log("LOAD MODEL: Model centered and scaled.");

            currentModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            console.log("LOAD MODEL: Shadows enabled for model meshes.");

            scene.add(currentModel);
            console.log("LOAD MODEL: Model added to scene.");

            box.setFromObject(currentModel);
            box.getCenter(center);
            box.getSize(size);

            const frameMaxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(frameMaxDim / 2 / Math.tan(fov / 2));

            cameraDistance *= 1.8;
            camera.position.set(center.x + cameraDistance, center.y + cameraDistance * 0.7, center.z + cameraDistance);
            camera.lookAt(center);

            controls.target.copy(center);
            controls.update();
            console.log('LOAD MODEL: Camera framed model.');

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
        applyCameraPreset(cameraAngleSelect.value);
        console.log("SETTINGS: Camera angle applied:", cameraAngleSelect.value);
    });
}

function applyCameraPreset(presetName) {
    if (!camera || !controls) { 
        console.warn("WARN: Camera or controls not initialized for camera preset.");
        return;
    }
    const preset = CAMERA_PRESETS[presetName];
    if (preset) {
        new TWEEN.Tween(camera.position)
            .to(preset.position, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                camera.lookAt(preset.lookAt);
                controls.target.copy(preset.lookAt);
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
// All imports (Three.js and TWEEN.js) are handled by the module system at the top.
init(); 
console.log("SCRIPT: init() called from main script body.");

// Set initial state of the button
if (loadModelBtn) {
    loadModelBtn.disabled = true; // Disabled initially
    console.log("INITIAL: Load Model button set to disabled.");
} else {
    console.error("CRITICAL ERROR: loadModelBtn element not found on page load. Check index.html ID.");
}
console.log("SCRIPT: script.js finished initial parsing.");