mod commands;
use std::sync::{Arc, Mutex};
pub struct TaskState(pub Arc<Mutex<Option<std::process::Child>>>);
pub fn run() {
    tauri::Builder::default()
        .manage(TaskState(Arc::new(Mutex::new(None))))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::check_codex,
            commands::create_project_directory,
            commands::start_codex_task,
            commands::cancel_codex_task
        ])
        .setup(|app| {
            let _ = app.handle();
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running wedex");
}
