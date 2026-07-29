mod commands;
use std::sync::{Arc, Mutex};
use tauri::{window::Color, Manager};
pub struct TaskState(pub Arc<Mutex<Option<std::process::Child>>>);
pub fn run() {
    tauri::Builder::default()
        .manage(TaskState(Arc::new(Mutex::new(None))))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_codex,
            commands::create_project_directory,
            commands::ensure_wedex_root,
            commands::create_default_project,
            commands::create_session_directory,
            commands::start_codex_task,
            commands::cancel_codex_task
        ])
        .setup(|app| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_background_color(Some(Color(0, 0, 0, 0)));
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running wedex");
}
