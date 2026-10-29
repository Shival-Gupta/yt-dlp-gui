use serde_json::json;
use ytdeck_mcp::handler::McpHandler;
use ytdeck_mcp::jobs::{JobStatus, JobStore};
use ytdeck_mcp::protocol::{JsonRpcRequest, MCP_PROTOCOL_VERSION};
use ytdeck_mcp::resolution::BinaryResolver;

fn create_test_handler() -> McpHandler {
    let resolver = BinaryResolver::new(None, None);
    let store = JobStore::new();
    McpHandler::new(resolver, store)
}

#[tokio::test]
async fn test_protocol_initialize() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(1)),
        method: "initialize".to_string(),
        params: Some(json!({})),
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    assert_eq!(resp.id, Some(json!(1)));
    assert!(resp.error.is_none());
    let res = resp.result.expect("Expected result");
    assert_eq!(res["protocolVersion"], MCP_PROTOCOL_VERSION);
    assert_eq!(res["serverInfo"]["name"], "ytdeck-mcp");
    assert_eq!(res["serverInfo"]["version"], "1.0.0");
    assert!(res["capabilities"]["tools"].is_object());
    assert!(res["capabilities"]["resources"].is_object());
}

#[tokio::test]
async fn test_protocol_ping() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!("ping-1")),
        method: "ping".to_string(),
        params: None,
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    assert_eq!(resp.id, Some(json!("ping-1")));
    assert_eq!(resp.result, Some(json!({})));
}

#[tokio::test]
async fn test_tools_list_all_12_tools() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(2)),
        method: "tools/list".to_string(),
        params: None,
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    let result = resp.result.unwrap();
    let tools = result["tools"].as_array().expect("tools array");
    assert_eq!(tools.len(), 12, "Must implement all 12 MCP tools");

    let expected_tools = [
        "download",
        "get_job_status",
        "cancel_job",
        "list_jobs",
        "fetch_info",
        "fetch_formats",
        "fetch_thumbnails",
        "search",
        "check_dependency",
        "get_supported_sites",
        "build_command",
        "update_ytdlp",
    ];

    for expected in expected_tools {
        let found = tools.iter().any(|t| t["name"] == expected);
        assert!(found, "Tool '{}' must be present in tools/list", expected);
    }
}

#[tokio::test]
async fn test_resources_list_all_4_resources() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(3)),
        method: "resources/list".to_string(),
        params: None,
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    let result = resp.result.unwrap();
    let resources = result["resources"].as_array().expect("resources array");
    assert_eq!(resources.len(), 4, "Must implement all 4 MCP resources");

    let expected_uris = [
        "ytdeck://queue",
        "ytdeck://history",
        "ytdeck://settings",
        "ytdeck://supported-sites",
    ];

    for expected in expected_uris {
        let found = resources.iter().any(|r| r["uri"] == expected);
        assert!(
            found,
            "Resource '{}' must be present in resources/list",
            expected
        );
    }
}

#[tokio::test]
async fn test_tool_build_command() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(4)),
        method: "tools/call".to_string(),
        params: Some(json!({
            "name": "build_command",
            "arguments": {
                "url": "https://www.youtube.com/watch?v=aqz-KE-bpKQ",
                "format": "bestvideo+bestaudio",
                "output_dir": "C:\\Downloads",
                "output_template": "%(title)s.%(ext)s",
                "extract_audio": true,
                "audio_format": "mp3",
                "write_subs": true,
                "embed_metadata": true
            }
        })),
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    let res = resp.result.unwrap();
    let content_text = &res["content"][0]["text"].as_str().unwrap();
    let parsed: serde_json::Value = serde_json::from_str(content_text).unwrap();

    assert_eq!(parsed["command"], "yt-dlp");
    let args = parsed["args"].as_array().unwrap();
    assert!(args.contains(&json!("-f")));
    assert!(args.contains(&json!("bestvideo+bestaudio")));
    assert!(args.contains(&json!("-x")));
    assert!(args.contains(&json!("--audio-format")));
    assert!(args.contains(&json!("mp3")));
    assert!(args.contains(&json!("--write-subs")));
    assert!(args.contains(&json!("--embed-metadata")));
}

#[tokio::test]
async fn test_tool_job_management_lifecycle() {
    let handler = create_test_handler();
    let cancel_req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(10)),
        method: "tools/call".to_string(),
        params: Some(json!({
            "name": "cancel_job",
            "arguments": {
                "job_id": "non-existent-id"
            }
        })),
    };
    let resp = handler.handle_request(cancel_req).await.unwrap();
    assert!(resp.result.unwrap()["isError"].as_bool().unwrap());

    let store = JobStore::new();
    let job_id = store
        .create_job("https://example.com/video".to_string())
        .await;

    // Direct job store check
    let job = store.get_job(&job_id).await.unwrap();
    assert_eq!(job.status, JobStatus::Queued);

    // Cancel job
    let cancelled = store.cancel_job(&job_id).await.unwrap();
    assert!(cancelled);

    let updated = store.get_job(&job_id).await.unwrap();
    assert_eq!(updated.status, JobStatus::Cancelled);

    // List jobs
    let all = store.list_jobs(None).await;
    assert_eq!(all.len(), 1);
    let cancelled_list = store.list_jobs(Some("cancelled")).await;
    assert_eq!(cancelled_list.len(), 1);
}

#[tokio::test]
async fn test_read_resource_settings() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(5)),
        method: "resources/read".to_string(),
        params: Some(json!({
            "uri": "ytdeck://settings"
        })),
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    let res = resp.result.unwrap();
    let contents = res["contents"].as_array().unwrap();
    assert_eq!(contents.len(), 1);
    assert_eq!(contents[0]["uri"], "ytdeck://settings");
    let text = contents[0]["text"].as_str().unwrap();
    assert!(text.contains("default_format"));
}

#[tokio::test]
async fn test_read_resource_queue() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(6)),
        method: "resources/read".to_string(),
        params: Some(json!({
            "uri": "ytdeck://queue"
        })),
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    let res = resp.result.unwrap();
    let contents = res["contents"].as_array().unwrap();
    assert_eq!(contents.len(), 1);
    assert_eq!(contents[0]["uri"], "ytdeck://queue");
}

#[tokio::test]
async fn test_method_not_found() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!(7)),
        method: "non_existent_method".to_string(),
        params: None,
    };

    let resp = handler
        .handle_request(req)
        .await
        .expect("Expected response");
    assert!(resp.result.is_none());
    let err = resp.error.unwrap();
    assert_eq!(err.code, -32601);
    assert!(err.message.contains("Method not found"));
}
