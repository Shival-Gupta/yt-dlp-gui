use clap::Parser;
use std::path::PathBuf;

#[derive(Debug, Clone, Parser)]
#[command(
    name = "ytdeck-mcp",
    about = "Standalone Model Context Protocol (MCP) server for yt-dlp",
    version = "1.0.0"
)]
pub struct CliArgs {
    /// Transport to run: "stdio" or "http"
    #[arg(long, default_value = "stdio")]
    pub transport: String,

    /// HTTP server bind port (used when transport is "http")
    #[arg(long, default_value = "7531")]
    pub port: u16,

    /// HTTP server bind host
    #[arg(long, default_value = "127.0.0.1")]
    pub host: String,

    /// Explicit path to yt-dlp executable
    #[arg(long)]
    pub ytdlp_path: Option<PathBuf>,

    /// Explicit path to ffmpeg executable
    #[arg(long)]
    pub ffmpeg_path: Option<PathBuf>,

    /// Logging level (trace, debug, info, warn, error)
    #[arg(long, default_value = "info")]
    pub log_level: String,
}
