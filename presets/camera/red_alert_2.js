import * as THREE from 'three';

export default {
    // Red Alert 2 camera preset (generic isometric, as before)
    positionOffset: new THREE.Vector3(1, 0.8, 1).normalize(),
    distanceRatio: 3.5,
    rotation: new THREE.Euler(-Math.atan(1 / Math.sqrt(3)), Math.PI / 4, 0, 'YXZ')
};