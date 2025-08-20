import * as THREE from 'three'; // Import Three.js if needed for Vector3, Euler, Quaternion

export default {
    // Tiberian Sun camera preset (using Blender conversion attempt)
    basePosition: new THREE.Vector3(1.79616, 1.73212, 1.78978),
    positionScaleMultiplier: 10, // Adjust this value later for optimal framing
    rotationQuaternion: new THREE.Quaternion(0.000, 0.000, 0.214, 0.977)
};