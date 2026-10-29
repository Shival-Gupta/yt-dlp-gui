use clap::Parser;
use std::sync::Arc;
use tracing::info;
use tracing_subscriber::EnvFilter;
use ytdeck_mcp::cli::CliArgs;
use ytdeck_mcp::handler::McpHandler;
use ytdeck_mcp::jobs::JobStore;
use ytdeck_mcp::resolution::BinaryResolver;
use ytdeck_mcp::{server_sse, server_stdio};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args = CliArgs::parse();

    // STRICT STDERR LOGGING: all logs must go to stderr so stdout is reserved for JSON-RPC
    let filter =
        EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new(&args.log_level));

    tracing_subscriber::fmt()
        .with_writer(std::io::stderr)
        .with_env_filter(filter)
        .init();

    info!(
        transport = %args.transport,
        port = args.port,
        host = %args.host,
        "Initializing ytdeck-mcp server"
    );

    let resolver = BinaryResolver::new(args.ytdlp_path, args.ffmpeg_path);
    if let Some(ref path) = resolver.resolve_ytdlp() {
        info!(path = ?path, "Resolved yt-dlp binary");
    } else {
        tracing::warn!("yt-dlp binary could not be resolved at startup");
    }

    if let Some(ref path) = resolver.resolve_ffmpeg() {
        info!(path = ?path, "Resolved ffmpeg binary");
    } else {
        tracing::warn!("ffmpeg binary could not be resolved at startup");
    }

    let job_store = JobStore::new();
    let handler = Arc::new(McpHandler::new(resolver, job_store));

    match args.transport.to_lowercase().as_str() {
        "http" | "sse" => {
            server_sse::run_sse_server(handler, &args.host, args.port).await?;
        }
        "stdio" => {
            server_stdio::run_stdio_server(handler).await?;
        }
        unknown => {
            anyhow::bail!(
                "Unsupported transport: '{}'. Use 'stdio' or 'http'.",
                unknown
            );
        }
    }

    Ok(())
}
