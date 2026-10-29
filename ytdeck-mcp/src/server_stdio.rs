use crate::handler::McpHandler;
use crate::protocol::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tracing::{debug, error, info};

pub async fn run_stdio_server(handler: Arc<McpHandler>) -> anyhow::Result<()> {
    info!("Starting MCP stdio transport (strict JSON-RPC on stdin/stdout, stderr logging)");

    let stdin = tokio::io::stdin();
    let mut stdout = tokio::io::stdout();
    let mut reader = BufReader::new(stdin).lines();

    while let Ok(Some(line)) = reader.next_line().await {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }

        debug!(raw_line = %trimmed, "Received line on stdin");

        let request_res = serde_json::from_str::<JsonRpcRequest>(trimmed);
        match request_res {
            Ok(req) => {
                if let Some(resp) = handler.handle_request(req).await {
                    let mut serialized = serde_json::to_string(&resp)?;
                    serialized.push('\n');
                    stdout.write_all(serialized.as_bytes()).await?;
                    stdout.flush().await?;
                }
            }
            Err(e) => {
                error!(error = %e, "Failed to parse JSON-RPC request from stdin");
                let err_resp = JsonRpcResponse::error(None, JsonRpcError::parse_error(None));
                let mut serialized = serde_json::to_string(&err_resp)?;
                serialized.push('\n');
                stdout.write_all(serialized.as_bytes()).await?;
                stdout.flush().await?;
            }
        }
    }

    info!("Stdin closed, exiting stdio server");
    Ok(())
}
