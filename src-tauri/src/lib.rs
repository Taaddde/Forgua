// Forgua — Minimal Tauri backend.
// All logic lives in the frontend (React). This is a thin wrapper.

#[tauri::command]
fn open_mic_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone")
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "ms-settings:privacy-microphone"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // No standard deep link for mic settings on Linux
        return Err("Not supported on Linux".to_string());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // TODO: Fase futura — habilitar cuando haya servidor de actualizaciones
        // .plugin(tauri_plugin_updater::init())
        .invoke_handler(tauri::generate_handler![open_mic_settings])
        .run(tauri::generate_context!())
        .expect("error while running Forgua");
}
