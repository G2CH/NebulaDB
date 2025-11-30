use sqlx::{Pool, Postgres, Row, Column, TypeInfo, Executor};
use sqlx::types::chrono;
use crate::db::types::QueryResult;

/// Execute a query on a PostgreSQL database and convert row values to JSON
pub async fn execute_postgres_query(
    pool: &Pool<Postgres>,
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
                 // Try String first (VARCHAR, TEXT, CHAR, etc.)
                 if let Ok(v) = row.try_get::<Option<String>, _>(col.name()) {
                     v.map(serde_json::Value::String).unwrap_or(serde_json::Value::Null)
                 }
                 // Try chrono types for date/time
                 else if let Ok(v) = row.try_get::<Option<chrono::NaiveDateTime>, _>(col.name()) {
                     v.map(|dt| serde_json::Value::String(dt.format("%Y-%m-%d %H:%M:%S").to_string())).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<chrono::DateTime<chrono::Utc>>, _>(col.name()) {
                     v.map(|dt| serde_json::Value::String(dt.format("%Y-%m-%d %H:%M:%S UTC").to_string())).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<chrono::NaiveDate>, _>(col.name()) {
                     v.map(|d| serde_json::Value::String(d.format("%Y-%m-%d").to_string())).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<chrono::NaiveTime>, _>(col.name()) {
                     v.map(|t| serde_json::Value::String(t.format("%H:%M:%S").to_string())).unwrap_or(serde_json::Value::Null)
                 }
                 // Try JSON/JSONB
                 else if let Ok(v) = row.try_get::<Option<serde_json::Value>, _>(col.name()) {
                     v.unwrap_or(serde_json::Value::Null)
                 }
                 // Binary (BYTEA)
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
                 // Numeric types
                 else if let Ok(v) = row.try_get::<Option<i64>, _>(col.name()) {
                     v.map(|n| serde_json::Value::Number(serde_json::Number::from(n))).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<i32>, _>(col.name()) {
                     v.map(|n| serde_json::Value::Number(serde_json::Number::from(n))).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<i16>, _>(col.name()) {
                     v.map(|n| serde_json::Value::Number(serde_json::Number::from(n))).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<f64>, _>(col.name()) {
                     v.and_then(|f| serde_json::Number::from_f64(f)).map(serde_json::Value::Number).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<f32>, _>(col.name()) {
                     v.and_then(|f| serde_json::Number::from_f64(f as f64)).map(serde_json::Value::Number).unwrap_or(serde_json::Value::Null)
                 }
                 else if let Ok(v) = row.try_get::<Option<bool>, _>(col.name()) {
                     v.map(serde_json::Value::Bool).unwrap_or(serde_json::Value::Null)
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
