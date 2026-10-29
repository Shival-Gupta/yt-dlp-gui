use crate::handler::McpHandler;
use crate::protocol::{JsonRpcError, JsonRpcRequest, JsonRpcResponse};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::sse::{Event, KeepAlive, Sse};
use axum::response::{IntoResponse, Json};
use axum::routing::{get, post};
use axum::Router;
use futures::stream::Stream;
use futures::StreamExt;
use serde::Deserialize;
use serde_json::json;
use std::collections::HashMap;
use std::convert::Infallible;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::sync::{mpsc, RwLock};
use tokio_stream::wrappers::ReceiverStream;
use tower_http::cors::{Any, CorsLayer};
use tracing::{debug, error, info};
use uuid::Uuid;

#[derive(Clone)]
pub struct SseServerState {
    pub handler: Arc<McpHandler>,
    pub sessions: Arc<RwLock<HashMap<String, mpsc::Sender<Event>>>>,
}

#[derive(Debug, Deserialize)]
pub struct MessageQuery {
    #[serde(rename = "sessionId")]
    pub session_id: Option<String>,
}

pub async fn run_sse_server(handler: Arc<McpHandler>, host: &str, port: u16) -> anyhow::Result<()> {
    let state = SseServerState {
        handler,
        sessions: Arc::new(RwLock::new(HashMap::new())),
    };

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    let app = Router::new()
        .route("/health", get(health_handler))
        .route("/sse", get(sse_handler))
        .route("/message", post(message_handler))
        .layer(cors)
        .with_state(state);

    let addr: SocketAddr = format!("{}:{}", host, port).parse()?;
    info!("Starting MCP HTTP SSE server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(&addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn health_handler() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "name": "ytdeck-mcp",
        "version": "1.0.0"
    }))
}

async fn sse_handler(
    State(state): State<SseServerState>,
) -> Sse<impl Stream<Item = Result<Event, Infallible>>> {
    let session_id = Uuid::new_v4().to_string();
    info!(session_id = %session_id, "New SSE client connected");

    let (tx, rx) = mpsc::channel::<Event>(32);

    // Initial endpoint notification per MCP spec
    let endpoint_uri = format!("/message?sessionId={}", session_id);
    let initial_event = Event::default().event("endpoint").data(endpoint_uri);
    let _ = tx.send(initial_event).await;

    {
        let mut sessions = state.sessions.write().await;
        sessions.insert(session_id.clone(), tx);
    }

    let stream = ReceiverStream::new(rx).map(Ok);

    Sse::new(stream).keep_alive(KeepAlive::default())
}

async fn message_handler(
    State(state): State<SseServerState>,
    Query(query): Query<MessageQuery>,
    body: String,
) -> impl IntoResponse {
    let trimmed = body.trim();
    debug!(raw_body = %trimmed, session = ?query.session_id, "Received HTTP POST /message");

    let req = match serde_json::from_str::<JsonRpcRequest>(trimmed) {
        Ok(r) => r,
        Err(e) => {
            error!(error = %e, "Invalid JSON-RPC request on HTTP /message");
            let err_resp = JsonRpcResponse::error(None, JsonRpcError::parse_error(None));
            return (StatusCode::BAD_REQUEST, Json(json!(err_resp)));
        }
    };

    let resp_opt = state.handler.handle_request(req).await;

    if let Some(resp) = resp_opt {
        // If connected via SSE session, also dispatch to SSE stream
        if let Some(ref session_id) = query.session_id {
            let sessions = state.sessions.read().await;
            if let Some(sender) = sessions.get(session_id) {
                if let Ok(json_text) = serde_json::to_string(&resp) {
                    let event = Event::default().event("message").data(json_text);
                    let _ = sender.send(event).await;
                }
            }
        }

        (StatusCode::OK, Json(json!(resp)))
    } else {
        (
            StatusCode::ACCEPTED,
            Json(json!({ "status": "acknowledged" })),
        )
    }
}
