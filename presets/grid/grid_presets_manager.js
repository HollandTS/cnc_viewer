const presetFiles = {
    'tiberianSun': './presets/grid/tiberian_sun.js',
    'redAlert2': './presets/grid/red_alert_2.js',
    // Add more grid presets here:
    // 'newPresetName': './presets/grid/new_preset_name.js',
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