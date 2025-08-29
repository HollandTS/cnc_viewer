// presets/camera/tiberian_sun.js
import * as THREE from 'three';

export default {
    // Tiberian Sun camera preset (Blender exact match)
    // Blender Camera Location: (110.0390, -110.0390, 89.8467)
    position: new THREE.Vector3(110.039, -110.039, 89.8467),
    // Blender Camera Rotation (Euler XYZ): (1.0472, 0.0000, 0.7854) radians
    rotation: new THREE.Euler(1.0472, 0.0000, 0.7854, 'XYZ'),
    // Orthographic scale from Blender
    orthoScale: 37.4
};