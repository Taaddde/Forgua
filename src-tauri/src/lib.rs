// LinguaForge — Minimal Tauri backend.
// All logic lives in the frontend (React). This is a thin wrapper.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .run(tauri::generate_context!())
        .expect("error while running LinguaForge");
}
