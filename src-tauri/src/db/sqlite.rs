use sqlx::{Pool, Sqlite, Row, Column, TypeInfo};
use crate::db::types::QueryResult;

/// Execute a query on a SQLite database and convert row values to JSON
pub async fn execute_sqlite_query(
    pool: &Pool<Sqlite>,
    query: &str,
) -> Result<QueryResult, String> {
    let start = std::time::Instant::now();
    
    let rows = sqlx::query(query)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    let execution_time_ms = start.elapsed().as_millis();
    let mut columns = Vec::new();
    let mut result_rows = Vec::new();

    if let Some(first_row) = rows.first() {
        for col in first_row.columns() {
            columns.push(col.name().to_string());
        }
    } else {
        // If no rows, try to get column info from describe
        use sqlx::Executor;
        if let Ok(describe) = pool.describe(query).await {
            for col in describe.columns() {
                columns.push(col.name().to_string());
            }
        }
    }

    for row in rows {
        let mut row_data = Vec::new();
        for col in row.columns() {
             let value: serde_json::Value = 
                 // SQLite has dynamic typing, try in order of likelihood
                 // Try String (TEXT)
                 if let Ok(v) = row.try_get::<Option<String>, _>(col.name()) {
                     v.map(serde_json::Value::String).unwrap_or(serde_json::Value::Null)
                 }
                 // Try i64 (INTEGER, most common)
                 else if let Ok(v) = row.try_get::<Option<i64>, _>(col.name()) {
                     v.map(|n| serde_json::Value::Number(serde_json::Number::from(n))).unwrap_or(serde_json::Value::Null)
                 }
                 // Try i32
                 else if let Ok(v) = row.try_get::<Option<i32>, _>(col.name()) {
                     v.map(|n| serde_json::Value::Number(serde_json::Number::from(n))).unwrap_or(serde_json::Value::Null)
                 }
                 // Try f64 (REAL)
                 else if let Ok(v) = row.try_get::<Option<f64>, _>(col.name()) {
                     v.and_then(|f| serde_json::Number::from_f64(f)).map(serde_json::Value::Number).unwrap_or(serde_json::Value::Null)
                 }
                 // Try bool (stored as 0/1)
                 else if let Ok(v) = row.try_get::<Option<bool>, _>(col.name()) {
                     v.map(serde_json::Value::Bool).unwrap_or(serde_json::Value::Null)
                 }
                 // Try binary (BLOB)
                 else if let Ok(v) = row.try_get::<Option<Vec<u8>>, _>(col.name()) {
                     v.map(|bytes| {
                         if let Ok(text) = String::from_utf8(bytes.clone()) {
                             serde_json::Value::String(text)
                         } else if bytes.len() > 100 {
                             serde_json::Value::String(format!("<binary: {} bytes>", bytes.len()))
                         } else {
                             serde_json::Value::String(format!("0x{}", bytes.iter().map(|b| format!("{:02x}", b)).collect::<String>()))
                         }
                     }).unwrap_or(serde_json::Value::Null)
                 }
                 else {
                     serde_json::Value::String(format!("<unsupported: {}>", col.type_info().name()))
                 };
             row_data.push(value);
        }
        result_rows.push(row_data);
    }

    Ok(QueryResult {
        columns,
        rows: result_rows,
        execution_time_ms,
        affected_rows: 0,
    })
}
