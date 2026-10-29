use crate::jobs::JobStore;
use crate::protocol::*;
use crate::resolution::BinaryResolver;
use crate::resources::ResourceManager;
use crate::tools::ToolManager;
use serde_json::{json, Value};
use tracing::{debug, info, warn};

#[derive(Clone)]
pub struct McpHandler {
    tool_manager: ToolManager,
    resource_manager: ResourceManager,
}

impl McpHandler {
    pub fn new(resolver: BinaryResolver, job_store: JobStore) -> Self {
        let tool_manager = ToolManager::new(resolver.clone(), job_store.clone());
        let resource_manager = ResourceManager::new(job_store, tool_manager.clone(), resolver);
        Self {
            tool_manager,
            resource_manager,
        }
    }

    pub fn tool_manager(&self) -> &ToolManager {
        &self.tool_manager
    }

    pub fn resource_manager(&self) -> &ResourceManager {
        &self.resource_manager
    }

    pub async fn handle_request(&self, req: JsonRpcRequest) -> Option<JsonRpcResponse> {
        let id = req.id.clone();
        debug!(method = %req.method, "Handling JSON-RPC request");

        match req.method.as_str() {
            "initialize" => {
                let result = InitializeResult {
                    protocol_version: MCP_PROTOCOL_VERSION.to_string(),
                    server_info: ServerInfo {
                        name: SERVER_NAME.to_string(),
                        version: SERVER_VERSION.to_string(),
                    },
                    capabilities: ServerCapabilities {
                        tools: ToolsCapability {
                            list_changed: false,
                        },
                        resources: ResourcesCapability {
                            subscribe: false,
                            list_changed: false,
                        },
                    },
                };
                Some(JsonRpcResponse::success(
                    id,
                    serde_json::to_value(result).unwrap(),
                ))
            }
            "initialized" | "notifications/initialized" => {
                info!("Client acknowledged initialization");
                None
            }
            "ping" => Some(JsonRpcResponse::success(id, json!({}))),
            "tools/list" => {
                let tools = self.tool_manager.list_tools();
                Some(JsonRpcResponse::success(id, json!({ "tools": tools })))
            }
            "tools/call" => {
                let params = req.params.unwrap_or(Value::Null);
                let name = params.get("name").and_then(Value::as_str);
                let args = params
                    .get("arguments")
                    .cloned()
                    .unwrap_or_else(|| json!({}));

                match name {
                    Some(tool_name) => {
                        let res = self.tool_manager.call_tool(tool_name, args).await;
                        Some(JsonRpcResponse::success(
                            id,
                            serde_json::to_value(res).unwrap(),
                        ))
                    }
                    None => Some(JsonRpcResponse::error(
                        id,
                        JsonRpcError::invalid_params("Missing tool name in tools/call"),
                    )),
                }
            }
            "resources/list" => {
                let resources = self.resource_manager.list_resources();
                Some(JsonRpcResponse::success(
                    id,
                    json!({ "resources": resources }),
                ))
            }
            "resources/read" => {
                let params = req.params.unwrap_or(Value::Null);
                let uri = params.get("uri").and_then(Value::as_str);

                match uri {
                    Some(resource_uri) => match self
                        .resource_manager
                        .read_resource(resource_uri)
                        .await
                    {
                        Ok(res) => Some(JsonRpcResponse::success(
                            id,
                            serde_json::to_value(res).unwrap(),
                        )),
                        Err(e) => Some(JsonRpcResponse::error(
                            id,
                            JsonRpcError::internal_error(format!("Error reading resource: {}", e)),
                        )),
                    },
                    None => Some(JsonRpcResponse::error(
                        id,
                        JsonRpcError::invalid_params("Missing 'uri' in resources/read"),
                    )),
                }
            }
            _ => {
                warn!(method = %req.method, "Unknown method called");
                Some(JsonRpcResponse::error(
                    id,
                    JsonRpcError::method_not_found(&req.method),
                ))
            }
        }
    }
}
