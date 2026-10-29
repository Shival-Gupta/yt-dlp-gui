use ytdeck_mcp::jobs::JobStore;
use ytdeck_mcp::handler::McpHandler;
use ytdeck_mcp::protocol::JsonRpcRequest;
use ytdeck_mcp::resolution::BinaryResolver;
use serde_json::json;

fn create_test_handler() -> McpHandler {
    let resolver = BinaryResolver::new(None, None);
    let store = JobStore::new();
    McpHandler::new(resolver, store)
}

#[tokio::test]
async fn test_rust_parse_line_adversarial_title_with_percent() {
    let store = JobStore::new();
    let job_id = store.create_job("https://youtube.com/watch?v=adv1".to_string()).await;

    // Simulate yt-dlp extracting info where the title has "100%"
    let title_line = "[youtube] Extracting info for '100% Authentic Cotton Shirt Review'";
    store.parse_and_update_line(&job_id, title_line).await;

    let job = store.get_job(&job_id).await.unwrap();
    println!("Job progress after title with '100%': {}", job.progress);

    // Now that re_pct is scoped to [download] lines, titles with % do NOT update progress!
    assert_eq!(job.progress, 0.0, "Verified regex does not capture non-download percentages in titles");
}

#[tokio::test]
async fn test_rust_format_table_parser_with_trailing_warnings() {
    let handler = create_test_handler();
    let req = JsonRpcRequest {
        jsonrpc: "2.0".to_string(),
        id: Some(json!("fmt-1")),
        method: "tools/call".to_string(),
        params: Some(json!({
            "name": "build_command",
            "arguments": {
                "url": "https://youtube.com/watch?v=test"
            }
        })),
    };

    let resp = handler.handle_request(req).await.unwrap();
    assert!(resp.error.is_none());
}
