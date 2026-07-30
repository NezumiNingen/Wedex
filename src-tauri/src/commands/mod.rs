use crate::TaskState;
use serde::Serialize;
use serde_json::Value;
use std::{
    collections::HashSet,
    fs,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};
#[derive(Clone, Serialize)]
pub struct CliStatus {
    installed: bool,
    version: Option<String>,
    error: Option<String>,
}
#[tauri::command]
pub fn check_codex(cli_path: String) -> CliStatus {
    let Some(binary) = resolve_codex(&cli_path) else {
        return CliStatus {
            installed: false,
            version: None,
            error: Some("未找到 Codex CLI。请安装官方 Codex CLI，或在设置中指定其路径。".into()),
        };
    };
    match Command::new(binary).arg("--version").output() {
        Ok(output) if output.status.success() => CliStatus {
            installed: true,
            version: Some(String::from_utf8_lossy(&output.stdout).trim().to_string()),
            error: None,
        },
        Ok(output) => CliStatus {
            installed: false,
            version: None,
            error: Some(String::from_utf8_lossy(&output.stderr).trim().to_string()),
        },
        Err(error) => CliStatus {
            installed: false,
            version: None,
            error: Some(format!("Codex CLI 不可用: {error}")),
        },
    }
}

#[tauri::command]
pub fn check_kimi(cli_path: String) -> CliStatus {
    let Some(binary) = resolve_kimi(&cli_path) else {
        return CliStatus {
            installed: false,
            version: None,
            error: Some("未找到 Kimi Code CLI。请安装 Kimi Code，或在设置中指定其路径。".into()),
        };
    };
    match Command::new(binary).arg("--version").output() {
        Ok(output) if output.status.success() => CliStatus {
            installed: true,
            version: Some(String::from_utf8_lossy(&output.stdout).trim().to_string()),
            error: None,
        },
        Ok(output) => CliStatus {
            installed: false,
            version: None,
            error: Some(String::from_utf8_lossy(&output.stderr).trim().to_string()),
        },
        Err(error) => CliStatus {
            installed: false,
            version: None,
            error: Some(format!("Kimi Code CLI 不可用: {error}")),
        },
    }
}

#[tauri::command]
pub fn create_project_directory(parent: String, name: String) -> Result<String, String> {
    let safe_name = name.trim();
    if safe_name.is_empty()
        || safe_name == "."
        || safe_name == ".."
        || safe_name.contains(['/', '\\'])
    {
        return Err("项目名称不能为空，且不能包含路径分隔符。".into());
    }
    let parent_path = Path::new(&parent);
    if !parent_path.is_dir() {
        return Err("所选父目录不存在或不可访问。".into());
    }
    let project_path = parent_path.join(safe_name);
    if project_path.exists() {
        return Err("同名项目目录已存在。请选择其他名称，或直接添加现有目录。".into());
    }
    fs::create_dir(&project_path).map_err(|error| format!("无法创建项目目录: {error}"))?;
    project_path
        .canonicalize()
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|error| format!("无法确认项目目录: {error}"))
}

fn checked_name<'a>(name: &'a str, kind: &str) -> Result<&'a str, String> {
    let safe_name = name.trim();
    if safe_name.is_empty()
        || safe_name == "."
        || safe_name == ".."
        || safe_name.contains(['/', '\\'])
    {
        return Err(format!("{kind}名称不能为空，且不能包含路径分隔符。"));
    }
    Ok(safe_name)
}

fn wedex_download_root(app: &AppHandle) -> Result<PathBuf, String> {
    let downloads = app
        .path()
        .download_dir()
        .map_err(|error| format!("无法获取下载目录: {error}"))?;
    let root = downloads.join("wedex");
    fs::create_dir_all(&root).map_err(|error| format!("无法创建 wedex 目录: {error}"))?;
    Ok(root)
}

#[tauri::command]
pub fn ensure_wedex_root(app: AppHandle) -> Result<String, String> {
    wedex_download_root(&app).map(|path| path.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn create_default_project(app: AppHandle, name: String) -> Result<String, String> {
    let safe_name = checked_name(&name, "项目")?;
    let project_path = wedex_download_root(&app)?.join(safe_name);
    if project_path.exists() {
        return Err("同名项目已经存在。".into());
    }
    fs::create_dir_all(&project_path).map_err(|error| format!("无法创建项目目录: {error}"))?;
    project_path
        .canonicalize()
        .map(|path| path.to_string_lossy().into_owned())
        .map_err(|error| format!("无法确认项目目录: {error}"))
}

#[tauri::command]
pub fn create_session_directory(
    project_path: String,
    session_id: String,
) -> Result<String, String> {
    let safe_session = checked_name(&session_id, "子对话")?;
    let project = Path::new(&project_path);
    if !project.is_dir() {
        return Err("项目目录不存在或不可访问。".into());
    }
    // Conversation metadata is kept separate from project source files while
    // remaining inside the project directory.
    let session_path = project
        .join(".wedex")
        .join("conversations")
        .join(safe_session);
    fs::create_dir_all(&session_path).map_err(|error| format!("无法创建子对话目录: {error}"))?;
    Ok(session_path.to_string_lossy().into_owned())
}
#[tauri::command]
pub fn start_codex_task(
    cwd: String,
    prompt: String,
    sandbox: String,
    cli_path: String,
    attachment_paths: Vec<String>,
    app: AppHandle,
    state: State<'_, TaskState>,
) -> Result<(), String> {
    let path = Path::new(&cwd);
    if !path.is_dir() {
        return Err("项目目录不存在或不可访问".into());
    }
    let mut guard = state.0.lock().map_err(|_| "任务状态不可用")?;
    if guard.is_some() {
        return Err("已有 Codex 任务正在运行".into());
    }
    // Arguments are passed directly, never through a shell. This prevents shell injection and Windows quoting errors.
    let binary =
        resolve_codex(&cli_path).ok_or("未找到 Codex CLI。请在设置中配置有效的 CLI 路径。")?;
    let (extra_dirs, image_paths) = attachment_paths_for_codex(&attachment_paths, path);
    let mut args = vec![
        "exec".to_owned(),
        "--json".to_owned(),
        "--skip-git-repo-check".to_owned(),
        "--sandbox".to_owned(),
        sandbox,
        "--cd".to_owned(),
        cwd.clone(),
    ];
    for dir in extra_dirs {
        args.push("--add-dir".to_owned());
        args.push(dir.to_string_lossy().into_owned());
    }
    for image in image_paths {
        args.push("--image".to_owned());
        args.push(image.to_string_lossy().into_owned());
    }
    args.push(prompt);
    let mut child = Command::new(binary)
        .args(args)
        .current_dir(path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("无法启动 Codex CLI: {error}"))?;
    let stdout = child.stdout.take().ok_or("无法读取 Codex 输出")?;
    let stderr = child.stderr.take().ok_or("无法读取 Codex 错误输出")?;
    let stdout_app = app.clone();
    thread::spawn(move || forward_stream(BufReader::new(stdout), stdout_app, false));
    let stderr_app = app.clone();
    thread::spawn(move || forward_stream(BufReader::new(stderr), stderr_app, true));
    *guard = Some(child);
    let task_state = state.0.clone();
    thread::spawn(move || clear_finished_task(task_state, app, "codex-event", "Codex"));
    Ok(())
}

fn attachment_paths_for_codex(paths: &[String], cwd: &Path) -> (Vec<PathBuf>, Vec<PathBuf>) {
    let mut directories = Vec::new();
    let mut images = Vec::new();
    let mut seen_directories = HashSet::new();
    let mut seen_images = HashSet::new();
    let canonical_cwd = cwd.canonicalize().unwrap_or_else(|_| cwd.to_path_buf());
    for raw_path in paths {
        let Ok(path) = Path::new(raw_path).canonicalize() else {
            continue;
        };
        if path.is_file() && is_image_path(&path) {
            let key = path.to_string_lossy().into_owned();
            if seen_images.insert(key) {
                images.push(path.clone());
            }
        }
        let directory = if path.is_dir() { path } else { path.parent().map(Path::to_path_buf).unwrap_or_default() };
        if directory.as_os_str().is_empty() || directory == canonical_cwd {
            continue;
        }
        let key = directory.to_string_lossy().into_owned();
        if seen_directories.insert(key) {
            directories.push(directory);
        }
    }
    (directories, images)
}

fn is_image_path(path: &Path) -> bool {
    matches!(
        path.extension().and_then(|extension| extension.to_str()).map(str::to_ascii_lowercase).as_deref(),
        Some("avif" | "bmp" | "gif" | "heic" | "jpeg" | "jpg" | "png" | "svg" | "webp")
    )
}

fn clear_finished_task(
    state: std::sync::Arc<std::sync::Mutex<Option<std::process::Child>>>,
    app: AppHandle,
    event_name: &'static str,
    agent_name: &'static str,
) {
    loop {
        thread::sleep(Duration::from_millis(250));
        let mut guard = match state.lock() {
            Ok(guard) => guard,
            Err(_) => return,
        };
        let Some(child) = guard.as_mut() else { return };
        match child.try_wait() {
            Ok(Some(status)) => {
                let exit_code = status.code().unwrap_or(-1);
                *guard = None;
                let (kind, task_status, content) = if status.success() {
                    (
                        "completed",
                        "completed",
                        format!("{agent_name} 任务已完成（退出码 {exit_code}）"),
                    )
                } else {
                    (
                        "error",
                        "error",
                        format!("{agent_name} CLI 异常退出（退出码 {exit_code}）"),
                    )
                };
                let _ = app.emit(
                    event_name,
                    FrontendEvent {
                        kind: kind.into(),
                        content,
                        status: task_status.into(),
                        metadata: serde_json::Map::new(),
                    },
                );
                return;
            }
            Ok(None) => continue,
            Err(_) => {
                *guard = None;
                return;
            }
        }
    }
}

fn resolve_codex(configured: &str) -> Option<PathBuf> {
    let mut candidates = Vec::new();
    if !configured.trim().is_empty() {
        candidates.push(PathBuf::from(configured));
    }
    // The normal installation route on all supported platforms: rely on PATH.
    candidates.push(PathBuf::from("codex"));
    // Desktop app bundles do not always inherit a terminal's PATH. Cover the
    // official/common per-user locations as well, without assuming a version.
    if let Some(home) = std::env::var_os("HOME").map(PathBuf::from) {
        candidates.push(home.join(".cargo/bin/codex"));
        candidates.push(home.join(".local/bin/codex"));
    }
    #[cfg(target_os = "macos")]
    candidates.push(PathBuf::from(
        "/Applications/ChatGPT.app/Contents/Resources/codex",
    ));
    #[cfg(target_os = "windows")]
    {
        if let Some(app_data) = std::env::var_os("APPDATA").map(PathBuf::from) {
            candidates.push(app_data.join("npm/codex.cmd"));
        }
        if let Some(user_profile) = std::env::var_os("USERPROFILE").map(PathBuf::from) {
            candidates.push(user_profile.join(".cargo/bin/codex.exe"));
            candidates.push(user_profile.join(".local/bin/codex.exe"));
        }
    }
    candidates.into_iter().find(|candidate| {
        Command::new(candidate)
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    })
}

fn resolve_kimi(configured: &str) -> Option<PathBuf> {
    let mut candidates = Vec::new();
    if !configured.trim().is_empty() {
        candidates.push(PathBuf::from(configured));
    }
    candidates.push(PathBuf::from("kimi"));
    if let Some(home) = std::env::var_os("HOME").map(PathBuf::from) {
        candidates.push(home.join(".kimi-code/bin/kimi"));
        candidates.push(home.join(".local/bin/kimi"));
    }
    #[cfg(target_os = "windows")]
    {
        if let Some(user_profile) = std::env::var_os("USERPROFILE").map(PathBuf::from) {
            candidates.push(user_profile.join(".kimi-code/bin/kimi.exe"));
            candidates.push(user_profile.join(".kimi-code/bin/kimi.cmd"));
            candidates.push(user_profile.join(".local/bin/kimi.exe"));
        }
        if let Some(app_data) = std::env::var_os("APPDATA").map(PathBuf::from) {
            candidates.push(app_data.join("npm/kimi.cmd"));
        }
    }
    candidates.into_iter().find(|candidate| {
        Command::new(candidate)
            .arg("--version")
            .output()
            .map(|output| output.status.success())
            .unwrap_or(false)
    })
}

#[tauri::command]
pub fn start_kimi_task(
    cwd: String,
    prompt: String,
    cli_path: String,
    session_id: Option<String>,
    model: Option<String>,
    app: AppHandle,
    state: State<'_, TaskState>,
) -> Result<(), String> {
    let path = Path::new(&cwd);
    if !path.is_dir() {
        return Err("项目目录不存在或不可访问".into());
    }
    let mut guard = state.0.lock().map_err(|_| "任务状态不可用")?;
    if guard.is_some() {
        return Err("已有任务正在运行".into());
    }
    let binary =
        resolve_kimi(&cli_path).ok_or("未找到 Kimi Code CLI。请在设置中配置有效的 CLI 路径。")?;
    let mut args = Vec::new();
    if let Some(id) = session_id.filter(|id| !id.trim().is_empty()) {
        args.push("--session".to_owned());
        args.push(id);
    }
    if let Some(model) = model.filter(|model| !model.trim().is_empty()) {
        args.push("--model".to_owned());
        args.push(model);
    }
    args.push("--prompt".to_owned());
    args.push(prompt);
    args.push("--output-format".to_owned());
    args.push("stream-json".to_owned());
    let mut child = Command::new(binary)
        .args(args)
        .current_dir(path)
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| format!("无法启动 Kimi Code CLI: {error}"))?;
    let stdout = child.stdout.take().ok_or("无法读取 Kimi 输出")?;
    let stderr = child.stderr.take().ok_or("无法读取 Kimi 错误输出")?;
    let stdout_app = app.clone();
    thread::spawn(move || forward_kimi_stream(BufReader::new(stdout), stdout_app, false));
    let stderr_app = app.clone();
    thread::spawn(move || forward_kimi_stream(BufReader::new(stderr), stderr_app, true));
    *guard = Some(child);
    let task_state = state.0.clone();
    thread::spawn(move || clear_finished_task(task_state, app, "kimi-event", "Kimi"));
    Ok(())
}

#[tauri::command]
pub fn cancel_codex_task(state: State<'_, TaskState>) -> Result<(), String> {
    cancel_task(state)
}

#[tauri::command]
pub fn cancel_kimi_task(state: State<'_, TaskState>) -> Result<(), String> {
    cancel_task(state)
}

fn cancel_task(state: State<'_, TaskState>) -> Result<(), String> {
    let mut guard = state.0.lock().map_err(|_| "任务状态不可用")?;
    if let Some(mut child) = guard.take() {
        child
            .kill()
            .map_err(|error| format!("无法停止任务: {error}"))?;
    }
    Ok(())
}

#[derive(Clone, Serialize)]
struct FrontendEvent {
    #[serde(rename = "type")]
    kind: String,
    content: String,
    status: String,
    metadata: serde_json::Map<String, Value>,
}

fn forward_stream<R: std::io::Read>(reader: BufReader<R>, app: AppHandle, stderr: bool) {
    for line in reader.lines().map_while(Result::ok) {
        if stderr && line.starts_with("Reading additional input from stdin") {
            continue;
        }
        let event = parse_event(&line, stderr);
        let _ = app.emit("codex-event", event);
    }
}

fn forward_kimi_stream<R: std::io::Read>(reader: BufReader<R>, app: AppHandle, stderr: bool) {
    for line in reader.lines().map_while(Result::ok) {
        if line.trim().is_empty() {
            continue;
        }
        let event = parse_kimi_event(&line, stderr);
        let _ = app.emit("kimi-event", event);
    }
}

fn parse_kimi_event(line: &str, stderr: bool) -> FrontendEvent {
    let Some(parsed) = serde_json::from_str::<Value>(line).ok() else {
        return FrontendEvent {
            kind: if stderr { "raw_log" } else { "status" }.into(),
            content: line.to_owned(),
            status: if stderr { "starting" } else { "running" }.into(),
            metadata: serde_json::Map::new(),
        };
    };
    let role = parsed.get("role").and_then(Value::as_str).unwrap_or("meta");
    let mut metadata = parsed.as_object().cloned().unwrap_or_default();
    match role {
        "assistant" => {
            if let Some(tool_calls) = parsed.get("tool_calls").and_then(Value::as_array) {
                let first = tool_calls.first();
                let tool_name = first
                    .and_then(|value| value.pointer("/function/name"))
                    .and_then(Value::as_str)
                    .unwrap_or("Tool");
                let arguments = first
                    .and_then(|value| value.pointer("/function/arguments"))
                    .and_then(Value::as_str)
                    .unwrap_or_default();
                metadata.insert("toolName".into(), Value::String(tool_name.to_owned()));
                return FrontendEvent {
                    kind: map_kimi_tool(tool_name).into(),
                    content: arguments.to_owned(),
                    status: "running".into(),
                    metadata,
                };
            }
            FrontendEvent {
                kind: "assistant".into(),
                content: extract_kimi_content(parsed.get("content")),
                status: "running".into(),
                metadata,
            }
        }
        "tool" => FrontendEvent {
            kind: "command_result".into(),
            content: extract_kimi_content(parsed.get("content")),
            status: "running".into(),
            metadata,
        },
        "meta" => {
            if let Some(session_id) = parsed.get("session_id").and_then(Value::as_str) {
                metadata.insert("sessionId".into(), Value::String(session_id.to_owned()));
            }
            FrontendEvent {
                kind: "status".into(),
                content: extract_kimi_content(parsed.get("content")),
                status: "running".into(),
                metadata,
            }
        }
        "error" => FrontendEvent {
            kind: "error".into(),
            content: extract_kimi_content(parsed.get("content")),
            status: "error".into(),
            metadata,
        },
        _ => FrontendEvent {
            kind: if stderr { "raw_log" } else { "status" }.into(),
            content: extract_kimi_content(parsed.get("content")),
            status: "running".into(),
            metadata,
        },
    }
}

fn extract_kimi_content(content: Option<&Value>) -> String {
    match content {
        Some(Value::String(text)) => text.clone(),
        Some(Value::Array(parts)) => parts
            .iter()
            .filter_map(|part| {
                part.get("text")
                    .and_then(Value::as_str)
                    .or_else(|| part.as_str())
            })
            .collect::<Vec<_>>()
            .join(""),
        Some(value) => value.to_string(),
        None => String::new(),
    }
}

fn map_kimi_tool(tool_name: &str) -> &'static str {
    match tool_name.to_ascii_lowercase().as_str() {
        "read" | "glob" | "grep" | "search" => "file_read",
        "write" | "edit" | "multiedit" | "apply_patch" => "file_edit",
        "bash" | "shell" | "exec" | "command" => "command",
        _ => "status",
    }
}

fn parse_event(line: &str, stderr: bool) -> FrontendEvent {
    let parsed = serde_json::from_str::<Value>(line).ok();
    let event_type = parsed
        .as_ref()
        .and_then(|value| value.get("type"))
        .and_then(Value::as_str)
        .unwrap_or("raw_log");
    let kind = match event_type {
        "item.started" | "item.updated" => parsed
            .as_ref()
            .and_then(|value| value.pointer("/item/type"))
            .and_then(Value::as_str)
            .map(map_item_type)
            .unwrap_or("status"),
        "item.completed" => parsed
            .as_ref()
            .and_then(|value| value.pointer("/item/type"))
            .and_then(Value::as_str)
            .map(map_item_type)
            .unwrap_or("assistant"),
        "turn.completed" => "completed",
        "turn.failed" => "error",
        "error" => {
            let message = parsed
                .as_ref()
                .and_then(|value| value.get("message"))
                .and_then(Value::as_str)
                .unwrap_or_default();
            if message.contains("Reconnecting") || message.contains("timed out") {
                "status"
            } else {
                "error"
            }
        }
        "thread.started" => "status",
        "turn.started" => "thinking",
        _ if stderr => "raw_log",
        _ => "raw_log",
    };
    let status = match kind {
        "thinking" | "assistant" => "running",
        "status" if event_type == "error" => "thinking",
        "command" | "command_result" | "file_read" | "file_edit" | "diff" => "running",
        "completed" => "completed",
        "error" => "error",
        _ => "starting",
    };
    let content = match event_type {
        "thread.started" => "已建立 Codex 会话。".to_owned(),
        "turn.started" => "Codex 正在分析任务…".to_owned(),
        "error" => parsed
            .as_ref()
            .and_then(|value| value.get("message"))
            .and_then(Value::as_str)
            .map(|message| {
                if message.contains("Reconnecting") || message.contains("timed out") {
                    format!("网络请求暂时超时，Codex 正在重试连接：{message}")
                } else {
                    message.to_owned()
                }
            })
            .unwrap_or_else(|| "Codex 返回了错误。".to_owned()),
        _ => parsed
            .as_ref()
            .and_then(|value| {
                value
                    .pointer("/item/text")
                    .or_else(|| value.pointer("/item/output"))
                    .or_else(|| value.get("message"))
                    .or_else(|| value.pointer("/error/message"))
            })
            .and_then(Value::as_str)
            .map(str::to_owned)
            .unwrap_or_else(|| line.to_owned()),
    };
    let metadata = parsed
        .as_ref()
        .and_then(Value::as_object)
        .cloned()
        .unwrap_or_default();
    FrontendEvent {
        kind: kind.to_owned(),
        content,
        status: status.to_owned(),
        metadata,
    }
}

fn map_item_type(item_type: &str) -> &'static str {
    match item_type {
        "agent_message" => "assistant",
        "reasoning" => "thinking",
        "command_execution" => "command",
        "file_change" => "diff",
        "mcp_tool_call" => "status",
        _ => "raw_log",
    }
}

#[cfg(test)]
mod tests {
    use super::{is_image_path, parse_kimi_event, FrontendEvent};
    use std::path::Path;

    fn metadata_string<'a>(event: &'a FrontendEvent, key: &str) -> Option<&'a str> {
        event.metadata.get(key).and_then(|value| value.as_str())
    }

    #[test]
    fn parses_kimi_assistant_message() {
        let event = parse_kimi_event(r#"{"role":"assistant","content":"Hello from Kimi"}"#, false);
        assert_eq!(event.kind, "assistant");
        assert_eq!(event.content, "Hello from Kimi");
        assert_eq!(event.status, "running");
    }

    #[test]
    fn parses_kimi_tool_call() {
        let event = parse_kimi_event(
            r#"{"role":"assistant","tool_calls":[{"type":"function","id":"tool-1","function":{"name":"Read","arguments":"{\"path\":\"README.md\"}"}}]}"#,
            false,
        );
        assert_eq!(event.kind, "file_read");
        assert!(event.content.contains("README.md"));
        assert_eq!(metadata_string(&event, "toolName"), Some("Read"));
    }

    #[test]
    fn extracts_kimi_resume_session() {
        let event = parse_kimi_event(
            r#"{"role":"meta","type":"session.resume_hint","session_id":"session-123","content":"resume"}"#,
            false,
        );
        assert_eq!(event.kind, "status");
        assert_eq!(metadata_string(&event, "sessionId"), Some("session-123"));
    }

    #[test]
    fn recognises_native_image_attachments() {
        assert!(is_image_path(Path::new("reference.HEIC")));
        assert!(!is_image_path(Path::new("reference.md")));
    }
}
