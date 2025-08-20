console.log("--- script.js HAS STARTED EXECUTING ---"); // <<< NEW DIAGNOSTIC LINE

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null;

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

function init() {
    console.log("INIT: Starting initialization."); // DIAGNOSTIC
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
    console.log("INIT: Renderer appended to viewport."); // DIAGNOSTIC

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

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Create directional light
    directionalLight.position.set(-0.8005, -10.1766, 12.2700);
    directionalLight.intensity = 4.0;
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0);
    scene.add(directionalLight);
    scene.add(directionalLight.target);
    console.log("INIT: Lights added."); // DIAGNOSTIC

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
    console.log("INIT: Grid helper added."); // DIAGNOSTIC

    // Handle Window Resizing
    window.addEventListener('resize', onWindowResize, false);

    updateSunDirection();
    console.log("INIT: updateSunDirection called."); // DIAGNOSTIC

    // Initial Render
    animate();
    console.log("INIT: Animation loop started."); // DIAGNOSTIC
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (typeof TWEEN !== 'undefined') {
        TWEEN.update();
    }
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = viewportContainer.clientWidth / viewportContainer.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
}

// --- Model Loading ---
const loader = new GLTFLoader();

if (loadModelBtn) {
    loadModelBtn.addEventListener('click', () => {
        console.log("CLICK: Load Model button clicked."); // DIAGNOSTIC
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
    console.warn("WARN: loadModelBtn element not found at script start."); // DIAGNOSTIC
}


function loadModel(url) {
    if (!scene) {
        console.error("ERROR: Scene not available to load/remove model!");
        return;
    }
    console.log("LOAD MODEL: Attempting to load model from URL:", url.substring(0, 50) + '...'); // DIAGNOSTIC

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
        console.log("LOAD MODEL: Previous model removed."); // DIAGNOSTIC
    }

    loader.load(
        url,
        (gltf) => {
            currentModel = gltf.scene;
            console.log("LOAD MODEL: GLTF loaded successfully."); // DIAGNOSTIC

            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50;
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            currentModel.position.multiplyScalar(scaleFactor);
            console.log("LOAD MODEL: Model centered and scaled."); // DIAGNOSTIC

            currentModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });
            console.log("LOAD MODEL: Shadows enabled for model meshes."); // DIAGNOSTIC

            scene.add(currentModel);
            console.log("LOAD MODEL: Model added to scene."); // DIAGNOSTIC

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
            console.log('LOAD MODEL: Camera framed model.'); // DIAGNOSTIC

            console.log('Final Model Object:', currentModel); // DIAGNOSTIC: Log the actual THREE.Object3D
        },
        (xhr) => {
            console.log('LOAD PROGRESS:', (xhr.loaded / xhr.total * 100).toFixed(2) + '% loaded'); // DIAGNOSTIC: More precise progress
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
        applyCameraPreset(cameraAngleSelect.value);
        console.log("SETTINGS: Camera angle applied:", cameraAngleSelect.value); // DIAGNOSTIC
    });
}

function applyCameraPreset(presetName) {
    if (!camera || !controls || typeof TWEEN === 'undefined') { // Ensure TWEEN is also present
        console.warn("WARN: Camera, controls, or TWEEN not initialized for camera preset.");
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
        addGridHelper(gridSizeSelect.value);
        console.log("SETTINGS: Grid size applied:", gridSizeSelect.value); // DIAGNOSTIC
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
    console.log(`SETTINGS: Sun direction updated to Azimuth: ${azimuth}, Elevation: ${elevation}`); // DIAGNOSTIC
}

if (sunAzimuth) sunAzimuth.addEventListener('input', updateSunDirection);
if (sunElevation) sunElevation.addEventListener('input', updateSunDirection);


// --- TWEEN.js for smooth camera animation ---
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.min.js';
script.onload = () => {
    console.log("TWEEN: TWEEN.js loaded successfully. Calling init().");
    init(); // This is called *after* TWEEN is ready
};
script.onerror = () => {
    console.error("ERROR: Failed to load TWEEN.js from CDN. Check network or URL.");
    alert("Error: Core viewer components failed to load. Please check console.");
};
document.head.appendChild(script);

console.log("SCRIPT: script.js finished initial parsing."); // DIAGNOSTIC