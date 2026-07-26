use crate::TaskState;
use serde::Serialize;
use serde_json::Value;
use std::{
    fs,
    io::{BufRead, BufReader},
    path::{Path, PathBuf},
    process::{Command, Stdio},
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, State};
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
#[tauri::command]
pub fn start_codex_task(
    cwd: String,
    prompt: String,
    sandbox: String,
    cli_path: String,
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
    let mut child = Command::new(binary)
        .args([
            "exec",
            "--json",
            "--skip-git-repo-check",
            "--sandbox",
            &sandbox,
            "--cd",
            &cwd,
            &prompt,
        ])
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
    thread::spawn(move || clear_finished_task(task_state, app));
    Ok(())
}

fn clear_finished_task(
    state: std::sync::Arc<std::sync::Mutex<Option<std::process::Child>>>,
    app: AppHandle,
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
                        format!("Codex 任务已完成（退出码 {exit_code}）"),
                    )
                } else {
                    (
                        "error",
                        "error",
                        format!("Codex CLI 异常退出（退出码 {exit_code}）"),
                    )
                };
                let _ = app.emit(
                    "codex-event",
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
#[tauri::command]
pub fn cancel_codex_task(state: State<'_, TaskState>) -> Result<(), String> {
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
