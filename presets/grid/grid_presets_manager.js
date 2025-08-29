const presetFiles = {
    // FIX: Paths should be relative to the manager file's location
    'tiberianSun': './tiberian_sun.js', // Changed from './presets/grid/tiberian_sun.js'
    'redAlert2': './red_alert_2.js',    // Changed from './presets/grid/red_alert_2.js'
    // Add more grid presets here:
    // 'newPresetName': './new_preset_name.js',
};

let loadedPresets = {};

export async function loadGridPresets() {
    console.log("PresetManager: Loading grid presets...");
    const promises = Object.entries(presetFiles).map(async ([key, path]) => {
        try {
            const module = await import(path);
            loadedPresets[key] = module.default;
            console.log(`PresetManager: Loaded grid preset '${key}' from ${path}`);
        } catch (error) {
            console.error(`PresetManager: Failed to load grid preset '${key}' from ${path}:`, error);
        }
    });
    await Promise.all(promises);
    return loadedPresets;
}

export function getGridPreset(name) {
    return loadedPresets[name];
}

export function getGridPresetNames() {
    return Object.keys(loadedPresets);
}