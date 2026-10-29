use std::env;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone)]
pub struct BinaryResolver {
    ytdlp_cli_override: Option<PathBuf>,
    ffmpeg_cli_override: Option<PathBuf>,
}

impl BinaryResolver {
    pub fn new(ytdlp_cli_override: Option<PathBuf>, ffmpeg_cli_override: Option<PathBuf>) -> Self {
        Self {
            ytdlp_cli_override,
            ffmpeg_cli_override,
        }
    }

    /// Resolve `yt-dlp` executable path according to the 4-level hierarchy:
    /// 1. `--ytdlp-path` CLI arg
    /// 2. `YTDECK_YTDLP_PATH` environment variable
    /// 3. Sibling binary next to the current running executable
    /// 4. System PATH lookup
    pub fn resolve_ytdlp(&self) -> Option<PathBuf> {
        // Level 1: CLI override
        if let Some(ref path) = self.ytdlp_cli_override {
            if path.exists() {
                return Some(path.clone());
            }
        }

        // Level 2: Environment variable
        if let Ok(env_val) = env::var("YTDECK_YTDLP_PATH") {
            let path = PathBuf::from(env_val.trim());
            if path.exists() {
                return Some(path);
            }
        }

        // Level 3: Sibling executable
        if let Ok(current_exe) = env::current_exe() {
            if let Some(parent) = current_exe.parent() {
                if let Some(sibling) = find_binary_in_dir(parent, "yt-dlp") {
                    return Some(sibling);
                }
            }
        }

        // Check relative to current working directory as part of local run
        if let Ok(cwd) = env::current_dir() {
            if let Some(local_bin) = find_binary_in_dir(&cwd, "yt-dlp") {
                return Some(local_bin);
            }
            // Also check parent/sibling workspace dirs (e.g. yt-dlp clone in repo)
            if let Some(parent) = cwd.parent() {
                let sibling_clone = parent.join("yt-dlp").join("yt-dlp.cmd");
                if sibling_clone.exists() {
                    return Some(sibling_clone);
                }
            }
        }

        // Level 4: System PATH lookup
        self.resolve_in_path("yt-dlp")
    }

    /// Resolve `ffmpeg` executable path
    pub fn resolve_ffmpeg(&self) -> Option<PathBuf> {
        // Level 1: CLI override
        if let Some(ref path) = self.ffmpeg_cli_override {
            if path.exists() {
                return Some(path.clone());
            }
        }

        // Level 2: Environment variable
        if let Ok(env_val) = env::var("YTDECK_FFMPEG_PATH") {
            let path = PathBuf::from(env_val.trim());
            if path.exists() {
                return Some(path);
            }
        }

        // Level 3: Sibling executable
        if let Ok(current_exe) = env::current_exe() {
            if let Some(parent) = current_exe.parent() {
                if let Some(sibling) = find_binary_in_dir(parent, "ffmpeg") {
                    return Some(sibling);
                }
            }
        }

        // Level 4: System PATH
        self.resolve_in_path("ffmpeg")
    }

    /// Resolve any named binary (e.g. ffprobe, deno, node, aria2c, atomicparsley)
    pub fn resolve_tool(&self, name: &str) -> Option<PathBuf> {
        match name {
            "ytdlp" | "yt-dlp" => self.resolve_ytdlp(),
            "ffmpeg" => self.resolve_ffmpeg(),
            _ => {
                // Check sibling
                if let Ok(current_exe) = env::current_exe() {
                    if let Some(parent) = current_exe.parent() {
                        if let Some(sibling) = find_binary_in_dir(parent, name) {
                            return Some(sibling);
                        }
                    }
                }
                // Check PATH
                self.resolve_in_path(name)
            }
        }
    }

    fn resolve_in_path(&self, binary_name: &str) -> Option<PathBuf> {
        let path_var = env::var_os("PATH")?;
        for dir in env::split_paths(&path_var) {
            if let Some(found) = find_binary_in_dir(&dir, binary_name) {
                return Some(found);
            }
        }
        None
    }
}

fn find_binary_in_dir(dir: &Path, name: &str) -> Option<PathBuf> {
    #[cfg(windows)]
    let extensions = ["exe", "cmd", "bat", "com"];
    #[cfg(not(windows))]
    let extensions = [""];

    // Direct match if extension is already present
    let direct = dir.join(name);
    if direct.is_file() {
        return Some(direct);
    }

    #[cfg(windows)]
    for ext in extensions {
        let candidate = dir.join(format!("{}.{}", name, ext));
        if candidate.is_file() {
            return Some(candidate);
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs::File;
    use tempfile::tempdir;

    #[test]
    fn test_cli_override_level_1() {
        let temp = tempdir().unwrap();
        let custom_ytdlp = temp.path().join("custom-yt-dlp.exe");
        File::create(&custom_ytdlp).unwrap();

        let resolver = BinaryResolver::new(Some(custom_ytdlp.clone()), None);
        assert_eq!(resolver.resolve_ytdlp(), Some(custom_ytdlp));
    }

    #[test]
    fn test_env_override_level_2() {
        let temp = tempdir().unwrap();
        let env_ytdlp = temp.path().join("env-yt-dlp.exe");
        File::create(&env_ytdlp).unwrap();

        env::set_var("YTDECK_YTDLP_PATH", env_ytdlp.to_str().unwrap());
        let resolver = BinaryResolver::new(None, None);
        assert_eq!(resolver.resolve_ytdlp(), Some(env_ytdlp));
        env::remove_var("YTDECK_YTDLP_PATH");
    }

    #[test]
    fn test_path_resolution() {
        let resolver = BinaryResolver::new(None, None);
        // ffmpeg or cmd or python is typically on PATH in test environment
        let tool = resolver.resolve_tool("cmd");
        #[cfg(windows)]
        assert!(tool.is_some());
    }
}
