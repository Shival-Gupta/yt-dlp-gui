pub mod commands;
pub mod sidecar;
pub mod state;
pub mod tray;
pub mod updater;

use state::AppState;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            app.manage(AppState::new());
            let _ = tray::setup_tray(app.handle());
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::spawn_ytdlp,
            commands::cancel_download,
            commands::pause_download,
            commands::resume_download,
            commands::fetch_info,
            commands::fetch_formats,
            commands::check_update,
            commands::download_update,
            commands::install_update,
            commands::update_ytdlp_sidecar,
            commands::open_path,
            commands::get_app_version,
            commands::get_ytdlp_version,
            commands::update_tray_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
