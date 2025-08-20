import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// --- Global variables for Three.js objects ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null; // To keep track of the loaded model
let isSceneInitialized = false; // New flag to track initialization

const viewportContainer = document.getElementById('viewport-container');
const loadModelBtn = document.getElementById('loadModelBtn'); // Get the button element

// Camera Presets
const CAMERA_PRESETS = {
    tiberianSun: {
        position: new THREE.Vector3(110.0390, -110.0390, 89.8467),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    redAlert2: {
        position: new THREE.Vector3(70, 40, 70), // Placeholder for Red Alert 2 settings
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
    scene.background = new THREE.Color(0x111111); // Dark background

    // Camera
    camera = new THREE.PerspectiveCamera(75, viewportContainer.clientWidth / viewportContainer.clientHeight, 0.1, 1000);
    applyCameraPreset('tiberianSun'); // Default camera

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(viewportContainer.clientWidth, viewportContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true; // Enable shadow maps
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Softer shadows
    viewportContainer.appendChild(renderer.domElement);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.listenToKeyEvents(window); // Optional: enable keyboard shortcuts
    controls.enableDamping = true; // For a smoother feel
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = false; // Prevents pan from pushing object off screen
    controls.minDistance = 1;
    controls.maxDistance = 500;
    controls.maxPolarAngle = Math.PI / 2; // Limit vertical rotation to prevent going below ground

    // Lights
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5); // Soft white light
    scene.add(ambientLight);

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // White light
    // Use the Blender TS light position as the initial position
    directionalLight.position.set(-0.8005, -10.1766, 12.2700);
    directionalLight.intensity = 4.0; // Set power/strength from Blender settings
    directionalLight.castShadow = true; // This light will cast shadows
    directionalLight.target.position.set(0, 0, 0); // Light points at the origin
    scene.add(directionalLight);
    scene.add(directionalLight.target); // It's good practice to add target to scene

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

    // Set flag and enable UI elements AFTER scene is ready
    isSceneInitialized = true;
    loadModelBtn.disabled = false; // Enable the button
    // Now call updateSunDirection to ensure sliders match the light and vice-versa
    // For initial load, we want the sun to be at the Blender TS position.
    // If you want sliders to control this immediately, you'd need to inverse-calculate
    // azimuth/elevation from the blender (x,y,z) and set slider values.
    // For now, sliders will start at default (45,60) and can then modify the light.
    // No need to call updateSunDirection() here unless you want to override the Blender setup.
    // Let's remove the final updateSunDirection() for now, as init() sets the Blender values.

    // Initial Render
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    if (typeof TWEEN !== 'undefined') { // Check if TWEEN is loaded
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

loadModelBtn.addEventListener('click', () => {
    // Only proceed if scene is initialized
    if (!isSceneInitialized) {
        console.warn("Scene not initialized yet. Please wait.");
        return;
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

function loadModel(url) {
    // Ensure scene is available before attempting to remove from it
    if (currentModel && scene) {
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
            if (object.texture) object.texture.dispose(); // For textures directly on objects
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

            // Ensure scene is valid before adding to it
            if (scene) {
                scene.add(currentModel);
            } else {
                console.error("Scene not available to add model!");
                return;
            }


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

applyCameraAngleBtn.addEventListener('click', () => {
    if (!isSceneInitialized) return; // Prevent action if not initialized
    applyCameraPreset(cameraAngleSelect.value);
});

function applyCameraPreset(presetName) {
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

applyGridSizeBtn.addEventListener('click', () => {
    if (!isSceneInitialized) return; // Prevent action if not initialized
    addGridHelper(gridSizeSelect.value);
});

function addGridHelper(presetName) {
    if (!scene) { // Also check scene here
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
    if (!directionalLight) { // Crucial check: only update if light exists
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

sunAzimuth.addEventListener('input', updateSunDirection);
sunElevation.addEventListener('input', updateSunDirection);

// Initial call to updateSunDirection moved to after init().
// For initial load, the light position is set directly in init() using Blender values.
// The sliders (45, 60) will update the light from there when manipulated.


// --- TWEEN.js for smooth camera animation ---
// Add TWEEN.js library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.min.js';
script.onload = () => {
    // Initialize the Three.js scene once TWEEN is loaded
    init(); // This is called *after* TWEEN is ready
    // Now that init() has run and directionalLight exists,
    // we can call updateSunDirection IF you want the sliders to reflect the Blender angles
    // or set the light based on sliders *immediately*.
    // If init() already sets the light as per Blender, this call will overwrite it based on slider defaults.
    // For now, let's keep it here so the UI elements are immediately functional.
    updateSunDirection(); // Call after init() to ensure light exists
};
document.head.appendChild(script);

// Optionally, initially disable the load button in HTML to prevent early clicks
// index.html: <button id="loadModelBtn" disabled>Load GLB/GLTF Model</button>
// And then enable it in script.js after init()
loadModelBtn.disabled = true; // Set initial state in JS if not in HTML