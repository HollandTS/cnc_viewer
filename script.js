import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// TWEEN.js needs to be globally available before init is called
// So we ensure it's loaded before we initialize Three.js
// This part remains outside any function to ensure its global scope.
// The init() call moves inside the script.onload for TWEEN.
// This is already handled at the very end of your script.js
// So, just ensure this is consistent.

// --- Scene Setup ---
let scene, camera, renderer, controls, gridHelper, directionalLight;
let currentModel = null; // To keep track of the loaded model

const viewportContainer = document.getElementById('viewport-container');

// Camera Presets
const CAMERA_PRESETS = {
    tiberianSun: {
        // These are just example values, you'll replace them
        // with your actual C&C inspired coords.
        position: new THREE.Vector3(50, 60, 50),
        lookAt: new THREE.Vector3(0, 0, 0)
    },
    redAlert2: {
        // These are just example values, you'll replace them
        // with your actual C&C inspired coords.
        position: new THREE.Vector3(70, 40, 70),
        lookAt: new THREE.Vector3(0, 0, 0)
    }
};

// Grid Presets (Plane geometry for reference, size, divisions)
const GRID_PRESETS = {
    tiberianSun: {
        size: 100,
        divisions: 100, // 1 unit per division
        colorCenterLine: 0x444444,
        colorGrid: 0x888888
    },
    redAlert2: {
        size: 150,
        divisions: 15, // 10 units per division
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
    // Note: We apply the preset AFTER the model loads if we want it to frame the model.
    // For now, let's keep it here for an initial view.
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

    directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // White light
    directionalLight.position.set(20, 30, 15); // Initial position (relative to scene origin)
    directionalLight.castShadow = true; // This light will cast shadows
    scene.add(directionalLight);

    // Configure shadow properties for the directional light
    directionalLight.shadow.mapSize.width = 2048; // default is 512
    directionalLight.shadow.mapSize.height = 2048; // default is 512
    directionalLight.shadow.camera.near = 0.5; // default
    directionalLight.shadow.camera.far = 100; // default
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    // const helper = new THREE.DirectionalLightHelper( directionalLight, 5 ); // Uncomment for debugging light position
    // scene.add( helper );
    // const shadowHelper = new THREE.CameraHelper( directionalLight.shadow.camera ); // Uncomment for debugging shadow camera
    // scene.add( shadowHelper );


    // Grid Helper
    addGridHelper('tiberianSun'); // Default grid

    // Handle Window Resizing
    window.addEventListener('resize', onWindowResize, false);

    // Initial Render
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update(); // only required if controls.enableDamping or controls.autoRotate are set to true
    // TWEEN.js update must be called in the animation loop
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

document.getElementById('loadModelBtn').addEventListener('click', () => {
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
    if (currentModel) {
        scene.remove(currentModel);
        currentModel.traverse((object) => {
            // Dispose of geometries, materials, and textures to prevent memory leaks
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
            if (object.texture) object.texture.dispose(); // For textures directly on objects
        });
        currentModel = null;
    }

    loader.load(
        url,
        (gltf) => {
            currentModel = gltf.scene;

            // --- IMPORTANT: Enable shadows and adjust position/scale ---
            // Calculate bounding box to center and scale the model
            const box = new THREE.Box3().setFromObject(currentModel);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());

            // Center the model in the scene
            currentModel.position.sub(center);

            // Optional: Scale the model to fit a certain size (e.g., within a 100 unit cube)
            // This is crucial if models come in wildly different scales.
            const maxDim = Math.max(size.x, size.y, size.z);
            const targetSize = 50; // A reasonable size for our viewer (e.g., 50 units wide)
            const scaleFactor = targetSize / maxDim;
            currentModel.scale.setScalar(scaleFactor);
            // After scaling, recenter relative to the new scale
            currentModel.position.multiplyScalar(scaleFactor);


            // Make all parts of the model cast and receive shadows
            currentModel.traverse((node) => {
                if (node.isMesh) {
                    node.castShadow = true;
                    node.receiveShadow = true;
                    // If materials use textures, dispose them too when removing the model
                    if (node.material && node.material.map) node.material.map.dispose();
                    if (node.material && node.material.lightMap) node.material.lightMap.dispose();
                    if (node.material && node.material.aoMap) node.material.aoMap.dispose();
                    // Add more texture types as needed (emissiveMap, normalMap, etc.)
                }
            });

            scene.add(currentModel);

            // Adjust camera position to frame the new, centered, and scaled model
            // Re-calculate box and center/size after scaling for accurate camera framing
            box.setFromObject(currentModel);
            box.getCenter(center);
            box.getSize(size);

            const frameMaxDim = Math.max(size.x, size.y, size.z);
            const fov = camera.fov * (Math.PI / 180);
            let cameraDistance = Math.abs(frameMaxDim / 2 / Math.tan(fov / 2));

            // Add some padding and lift for a better view
            cameraDistance *= 1.8; // Example padding
            camera.position.set(center.x + cameraDistance, center.y + cameraDistance * 0.7, center.z + cameraDistance);
            camera.lookAt(center);

            controls.target.copy(center); // Update controls target to model center
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
    applyCameraPreset(cameraAngleSelect.value);
});

function applyCameraPreset(presetName) {
    const preset = CAMERA_PRESETS[presetName];
    if (preset) {
        // Smoothly animate camera movement
        new TWEEN.Tween(camera.position)
            .to(preset.position, 1000) // Animate over 1 second
            .easing(TWEEN.Easing.Quadratic.Out)
            .onUpdate(() => {
                camera.lookAt(preset.lookAt);
                controls.target.copy(preset.lookAt); // Keep controls looking at the target
                controls.update();
            })
            .start();
            // Start the animation loop for TWEEN
            // This is no longer needed here if TWEEN.update() is called in the main animate loop
            // function animateTween() {
            //     if (TWEEN.update()) {
            //         requestAnimationFrame(animateTween);
            //     }
            // }
            // animateTween();
    }
}


// Grid Size
const gridSizeSelect = document.getElementById('gridSizeSelect');
const applyGridSizeBtn = document.getElementById('applyGridSize');

applyGridSizeBtn.addEventListener('click', () => {
    addGridHelper(gridSizeSelect.value);
});

function addGridHelper(presetName) {
    if (gridHelper) {
        scene.remove(gridHelper);
        // Dispose of the grid helper's geometry and material
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
    const azimuth = parseFloat(sunAzimuth.value);
    const elevation = parseFloat(sunElevation.value);

    sunAzimuthValueSpan.textContent = azimuth;
    sunElevationValueSpan.textContent = elevation;

    // Convert degrees to radians
    const azimuthRad = THREE.MathUtils.degToRad(azimuth);
    const elevationRad = THREE.MathUtils.degToRad(elevation);

    // Calculate light position using spherical coordinates
    // r is arbitrary, just defines distance from origin
    const r = 50; // Distance of the light from the origin
    const x = r * Math.sin(elevationRad) * Math.cos(azimuthRad);
    const y = r * Math.cos(elevationRad); // Y is 'up' in Three.js
    const z = r * Math.sin(elevationRad) * Math.sin(azimuthRad);

    directionalLight.position.set(x, y, z);
    directionalLight.target.position.set(0,0,0); // Light always points at the origin
    directionalLight.target.updateMatrixWorld(); // Important for shadow updates
}

sunAzimuth.addEventListener('input', updateSunDirection);
sunElevation.addEventListener('input', updateSunDirection);

// Initialize sun direction on load
updateSunDirection();


// --- TWEEN.js for smooth camera animation ---
// Add TWEEN.js library
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tween.js/18.6.4/tween.min.js';
script.onload = () => {
    // Initialize the Three.js scene once TWEEN is loaded
    init();
};
document.head.appendChild(script);