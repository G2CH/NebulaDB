// Database module - modular structure for database operations
//
// This module is organized as follows:
// - types.rs: Common types (AppState, QueryResult)
// - postgres.rs: PostgreSQL query execution and type conversion
// - mysql.rs: MySQL query execution and type conversion
// - sqlite.rs: SQLite query execution and type conversion
//
// All Tauri commands are defined here in mod.rs to ensure proper macro expansion.
// Database-specific query execution logic is delegated to respective modules.

pub mod types;
pub mod postgres;
pub mod mysql;
pub mod sqlite;

use sqlx::{postgres::PgPoolOptions, mysql::MySqlPoolOptions, sqlite::SqlitePoolOptions};
use tauri::State;

// Re-export types for convenience
pub use types::{AppState, QueryResult};

// ============================================================================
// Connection Commands
// ============================================================================

#[tauri::command]
pub async fn connect_postgres(
    state: State<'_, AppState>,
    connection_id: String,
    connection_string: String,
) -> Result<String, String> {
    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let mut pools = state.pg_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
    pools.insert(connection_id, pool);

    Ok("Connected successfully".to_string())
}

#[tauri::command]
pub async fn connect_mysql(
    state: State<'_, AppState>,
    connection_id: String,
    connection_string: String,
) -> Result<String, String> {
    let pool = MySqlPoolOptions::new()
        .max_connections(5)
        .connect(&connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let mut pools = state.mysql_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
    pools.insert(connection_id, pool);

    Ok("Connected successfully".to_string())
}

#[tauri::command]
pub async fn connect_sqlite(
    state: State<'_, AppState>,
    connection_id: String,
    connection_string: String,
) -> Result<String, String> {
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&connection_string)
        .await
        .map_err(|e| e.to_string())?;

    let mut pools = state.sqlite_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
    pools.insert(connection_id, pool);

    Ok("Connected successfully".to_string())
}

#[tauri::command]
pub async fn connect_redis(
    state: State<'_, AppState>,
    connection_id: String,
    connection_string: String,
) -> Result<String, String> {
    let client = redis::Client::open(connection_string)
        .map_err(|e| e.to_string())?;

    let mut clients = state.redis_clients.lock().map_err(|_| "Failed to lock mutex".to_string())?;
    clients.insert(connection_id, client);

    Ok("Connected successfully".to_string())
}

// ============================================================================
// Query Execution Commands
// ============================================================================

/// Execute a query across any database type
/// 
/// This function automatically detects which database pool contains
/// the connection_id and routes the query to the appropriate handler.
#[tauri::command]
pub async fn execute_query(
    state: State<'_, AppState>,
    connection_id: String,
    query: String,
    database: Option<String>,
) -> Result<QueryResult, String> {
    // Try Postgres first
    let pg_pool = {
        let pools = state.pg_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
        pools.get(&connection_id).cloned()
    };

    if let Some(pool) = pg_pool {
        // Postgres handles database selection at connection time, but we might want to support switching if possible
        // For now, we ignore the database parameter for Postgres as it requires a new connection
        return postgres::execute_postgres_query(&pool, &query).await;
    }

    // Try MySQL
    let mysql_pool = {
        let pools = state.mysql_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
        pools.get(&connection_id).cloned()
    };

    if let Some(pool) = mysql_pool {
        return mysql::execute_mysql_query(&pool, &query, database).await;
    }

    // Try SQLite
    let sqlite_pool = {
        let pools = state.sqlite_pools.lock().map_err(|_| "Failed to lock mutex".to_string())?;
        pools.get(&connection_id).cloned()
    };

    if let Some(pool) = sqlite_pool {
        return sqlite::execute_sqlite_query(&pool, &query).await;
    }

    Err("Connection not found".to_string())
}

#[tauri::command]
pub async fn execute_redis_command(
    state: State<'_, AppState>,
    connection_id: String,
    command: String,
) -> Result<String, String> {
    let clients = state.redis_clients.lock().map_err(|_| "Failed to lock mutex".to_string())?;
    let client = clients.get(&connection_id).ok_or("Redis connection not found")?;
    
    let mut con = client.get_connection().map_err(|e| e.to_string())?;
    
    let parts: Vec<&str> = command.split_whitespace().collect();
    if parts.is_empty() {
        return Err("Empty command".to_string());
    }

    let mut cmd = redis::cmd(parts[0]);
    for part in &parts[1..] {
        cmd.arg(*part);
    }


    let result: String = cmd.query(&mut con).map_err(|e| e.to_string())?;

    Ok(result)
}
