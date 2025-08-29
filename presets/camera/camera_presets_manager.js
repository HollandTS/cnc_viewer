// This manager will dynamically discover and load camera presets

const presetFiles = {
    // FIX: Paths should be relative to the manager file's location
    'tiberianSun': './tiberian_sun.js', // Changed from './presets/camera/tiberian_sun.js'
    'redAlert2': './red_alert_2.js',    // Changed from './presets/camera/red_alert_2.js'
    // Add more camera presets here as you create their files:
    // 'newPresetName': './new_preset_name.js',
};

let loadedPresets = {};

/**
 * Dynamically loads all camera presets.
 * @returns {Promise<Object>} A promise that resolves with an object of loaded presets.
 */
export async function loadCameraPresets() {
    console.log("PresetManager: Loading camera presets...");
    const promises = Object.entries(presetFiles).map(async ([key, path]) => {
        try {
            const module = await import(path);
            loadedPresets[key] = module.default;
            console.log(`PresetManager: Loaded camera preset '${key}' from ${path}`);
        } catch (error) {
            console.error(`PresetManager: Failed to load camera preset '${key}' from ${path}:`, error);
        }
    });
    await Promise.all(promises);
    return loadedPresets;
}

/**
 * Get a specific loaded camera preset.
 * @param {string} name The name of the preset (e.g., 'tiberianSun').
 * @returns {Object|undefined} The preset object, or undefined if not found.
 */
export function getCameraPreset(name) {
    return loadedPresets[name];
}

/**
 * Get the names of all loaded camera presets.
 * @returns {string[]} An array of preset names.
 */
export function getCameraPresetNames() {
    return Object.keys(loadedPresets);
}