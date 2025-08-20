import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null; // To keep track of the loaded model
let isSceneInitialized = false; // <<< CRITICAL: New flag to track initialization

const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn'); // Get the button element

// Camera Presets
const CAMERA_PRESETS = {
    tiberianSun: {
        position: new THREE.Vector3(110.0390, -110.0390, 89.8467),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    redAlert2: {
        // Placeholder for Red Alert 2 settings
        position: new THREE.Vector3(70, 40, 70), // Example: More isometric
        lookAt: new THREE.Vector3(0, 0, 0)
    }
};

// Grid Presets (Plane geometry for reference, size, divisions)
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
    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x111111);

    // Camera
    camera = new THREE.PerspectiveCamera(75, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    applyCameraPreset('tiberianSun'); // Default camera view

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    viewportContainer.appendChild(renderer.domElement);

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
    // Set initial position based on Tiberian Sun light settings
    directionalLight.position.set(-0.8005, -10.1766, 12.2700);
    directionalLight.intensity = 4.0;
    directionalLight.castShadow = true;
    directionalLight.target.position.set(0, 0, 0); // Light points at the origin
    scene.add(directionalLight);
    scene.add(directionalLight.target); // Good practice to add target to scene if its position is manipulated

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
    addGridHelper('tiberianSun'); // Default grid

    // Handle Window Resizing
    window.addEventListener('resize', onWindowResize, false);

    // <<< CRITICAL: Set flag and enable UI elements AFTER scene is ready
    isSceneInitialized = true;
    if (loadModelBtn) { // Safety check if button element exists
        loadModelBtn.disabled = false; // Enable the button
    }
    // Now that directionalLight is guaranteed to exist,
    // call updateSunDirection to apply initial slider values to the light.
    // NOTE: This will override the Blender TS light position set above if sliders
    // don't match it. If you want the Blender position to be fixed initially,
    // and sliders just to be for *later* adjustment, you might not call this here.
    // For immediate slider functionality on load, keep this.
    updateSunDirection(); // <<< CRITICAL: Call after init() to ensure light exists

    // Initial Render
    animate();
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

// <<< CRITICAL: Added safety check for scene initialization
if (loadModelBtn) { // Ensure button exists before adding listener
    loadModelBtn.addEventListener('click', () => {
        if (!isSceneInitialized) { // <<< CRITICAL: Only proceed if scene is initialized
            console.warn("Scene not initialized yet. Please wait.");
            return; // Exit early if not ready
        }
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
        input.click(); // Programmatically click the hidden input
    });
}


function loadModel(url) {
    // <<< CRITICAL: Ensure scene is available before attempting to remove from it
    if (!scene) {
        console.error("Scene not available to load/remove model!");
        return;
    }

    if (currentModel) {
        scene.remove(currentModel); // This line caused TypeError if scene was undefined
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
    }

    loader.load(
        url,
        (gltf) => {
            currentModel = gltf.scene;

            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            currentModel.position.sub(center);

            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50;
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            currentModel.position.multiplyScalar(scaleFactor);

            currentModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                }
            });

            // Ensure scene is valid before adding to it (redundant if !scene check at start of function)
            scene.add(currentModel);


            // Update bounding box after scaling for accurate camera framing
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

            console.log('Model loaded:', currentModel);
        },
        (xhr) => {
            console.log((xhr.loaded / xhr.total * 100) + '% loaded');
        },
        (error) => {
            console.error('An error happened loading the model:', error);
            alert('Error loading model. Check console for details.');
        }
    );
}

// --- Settings Logic ---

// Camera Angle
const cameraAngleSelect = document.getElementById('cameraAngleSelect');
const applyCameraAngleBtn = document.getElementById('applyCameraAngle');

if (applyCameraAngleBtn) { // Safety check
    applyCameraAngleBtn.addEventListener('click', () => {
        if (!isSceneInitialized) return; // Prevent action if not initialized
        applyCameraPreset(cameraAngleSelect.value);
    });
}

function applyCameraPreset(presetName) {
    // <<< CRITICAL: Ensure camera and controls exist before using
    if (!camera || !controls) {
        console.warn("Camera or controls not initialized for camera preset.");
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


// Grid Size
const gridSizeSelect = document.getElementById('gridSizeSelect');
const applyGridSizeBtn = document.getElementById('applyGridSize');

if (applyGridSizeBtn) { // Safety check
    applyGridSizeBtn.addEventListener('click', () => {
        if (!isSceneInitialized) return; // Prevent action if not initialized
        addGridHelper(gridSizeSelect.value);
    });
}

function addGridHelper(presetName) {
    // <<< CRITICAL: Also check scene here
    if (!scene) {
        console.warn("Scene not available for grid helper.");
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


// Sun Settings (Directional Light)
const sunAzimuth = document.getElementById('sunAzimuth');
const sunElevation = document.getElementById('sunElevation');
const sunAzimuthValueSpan = document.getElementById('sunAzimuthValue');
const sunElevationValueSpan = document.getElementById('sunElevationValue');

function updateSunDirection() {
    // <<< CRITICAL: Check if directionalLight exists before trying to use it
    if (!directionalLight) {
        console.warn("Directional light not initialized yet for sun settings.");
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
}

// Attach listeners only if elements exist
if (sunAzimuth) sunAzimuth.addEventListener('input', updateSunDirection);
if (sunElevation) sunElevation.addEventListener('input', updateSunDirection);


// --- TWEEN.js for smooth camera animation ---
// Add TWEEN.js library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.min.js';
script.onload = () => {
    // Initialize the Three.js scene once TWEEN is loaded
    init(); // This is called *after* TWEEN is ready and guarantees Three.js objects exist.
    // Call updateSunDirection *after* init() has populated directionalLight
    updateSunDirection(); // <<< CRITICAL: Ensures light is set and sliders are synced post-init
};
document.head.appendChild(script);

// <<< CRITICAL: Set initial state of the button
if (loadModelBtn) { // Safety check for button existence
    loadModelBtn.disabled = true; // Initially disable the button until init() enables it
}