use serde::{Serialize, Deserialize};
use sqlx::{Pool, Postgres, MySql, Sqlite};
use std::sync::Mutex;
use std::collections::HashMap;

/// Application state holding all database connection pools
#[derive(Default)]
pub struct AppState {
    pub pg_pools: Mutex<HashMap<String, Pool<Postgres>>>,
    pub mysql_pools: Mutex<HashMap<String, Pool<MySql>>>,
    pub sqlite_pools: Mutex<HashMap<String, Pool<Sqlite>>>,
    pub redis_clients: Mutex<HashMap<String, redis::Client>>,
}

/// Result of a database query
#[derive(Debug, Serialize, Deserialize)]
pub struct QueryResult {
    pub columns: Vec<String>,
    pub rows: Vec<Vec<serde_json::Value>>,
    pub execution_time_ms: u128,
    pub affected_rows: u64,
}
