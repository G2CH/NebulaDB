mod db;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(db::AppState::default())
    .invoke_handler(tauri::generate_handler![
        db::connect_postgres,
        db::connect_mysql,
        db::connect_sqlite,
        db::connect_redis,
        db::execute_redis_command,
        db::execute_query
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      app.handle().plugin(tauri_plugin_clipboard_manager::init())?;
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
