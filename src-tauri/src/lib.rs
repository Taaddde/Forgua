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

/// Opens the OS Sound / Audio input device settings panel.
/// Useful for telling the user "change your default mic here" since the
/// Web Speech API doesn't let us do that programmatically.
#[tauri::command]
fn open_sound_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.sound?input")
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("cmd")
            .args(["/c", "start", "ms-settings:sound"])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        // Try common sound control panels in order — fall back to pavucontrol.
        // This is best-effort; Linux has no standardized deep link.
        let tried = ["pavucontrol", "gnome-control-center", "kcmshell5"];
        for tool in tried.iter() {
            let args: Vec<&str> = if *tool == "gnome-control-center" {
                vec!["sound"]
            } else if *tool == "kcmshell5" {
                vec!["kcm_pulseaudio"]
            } else {
                vec![]
            };
            if std::process::Command::new(tool).args(&args).spawn().is_ok() {
                return Ok(());
            }
        }
        return Err("No sound settings tool available on this Linux desktop".to_string());
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        // TODO: Fase futura — habilitar cuando haya servidor de actualizaciones
        // .plugin(tauri_plugin_updater::init())
        .invoke_handler(tauri::generate_handler![open_mic_settings, open_sound_settings])
        .run(tauri::generate_context!())
        .expect("error while running Forgua");
}
