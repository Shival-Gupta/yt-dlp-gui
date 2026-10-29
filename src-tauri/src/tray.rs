use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent},
    AppHandle, Emitter, Manager, Runtime,
};

pub const TRAY_ID: &str = "yt-dlp-gui-tray";

pub fn setup_tray<R: Runtime>(
    app: &AppHandle<R>,
) -> Result<TrayIcon<R>, Box<dyn std::error::Error>> {
    let show_i = MenuItem::with_id(app, "show", "Show YTDeck", true, None::<&str>)?;
    let hide_i = MenuItem::with_id(app, "hide", "Hide to Tray", true, None::<&str>)?;
    let sep1 = PredefinedMenuItem::separator(app)?;
    let status_i = MenuItem::with_id(app, "status", "Active downloads: 0", false, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let pause_i = MenuItem::with_id(app, "pause_all", "Pause All", true, None::<&str>)?;
    let resume_i = MenuItem::with_id(app, "resume_all", "Resume All", true, None::<&str>)?;
    let sep3 = PredefinedMenuItem::separator(app)?;
    let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &show_i, &hide_i, &sep1, &status_i, &sep2, &pause_i, &resume_i, &sep3, &quit_i,
        ],
    )?;

    let icon = app
        .default_window_icon()
        .cloned()
        .ok_or("No default window icon found")?;

    let tray = TrayIconBuilder::with_id(TRAY_ID)
        .tooltip("yt-dlp GUI | Ready")
        .icon(icon)
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "show" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.unminimize();
                    let _ = window.set_focus();
                }
            }
            "hide" => {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.hide();
                }
            }
            "pause_all" => {
                let _ = app.emit("tray-pause-all", ());
            }
            "resume_all" => {
                let _ = app.emit("tray-resume-all", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                if let Some(window) = app.get_webview_window("main") {
                    let is_visible = window.is_visible().unwrap_or(false);
                    if is_visible {
                        let _ = window.hide();
                    } else {
                        let _ = window.show();
                        let _ = window.unminimize();
                        let _ = window.set_focus();
                    }
                }
            }
        })
        .build(app)?;

    Ok(tray)
}

pub fn update_tray<R: Runtime>(
    app: &AppHandle<R>,
    active_count: u32,
    speed: Option<&str>,
) -> Result<(), String> {
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let tooltip = match speed {
            Some(s) if !s.is_empty() && active_count > 0 => {
                format!("yt-dlp GUI | Active: {} | ↓ {}", active_count, s)
            }
            _ if active_count > 0 => format!("yt-dlp GUI | Active: {}", active_count),
            _ => "yt-dlp GUI | Ready".to_string(),
        };
        let _ = tray.set_tooltip(Some(tooltip));
    }
    Ok(())
}
