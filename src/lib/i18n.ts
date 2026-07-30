import type { Settings } from '../types';

export type Language = NonNullable<Settings['language']>;

const dictionary = {
  'zh-CN': {
    chat: '会话', projects: '项目', history: '任务历史', customize: '自定义头像', settings: '设置', account: '我的账号',
    customization: '自定义', avatarIntro: '设置聊天双方的头像。图片只保存在这台电脑上。', mine: '我的头像', assistant: 'wedex 头像', avatarUse: '用于聊天气泡旁的头像。', chooseImage: '选择图片', reset: '恢复默认',
    appearance: '外观与行为', language: '语言', chinese: '简体中文', english: 'English',
    settingsIntro: '本地偏好设置会保存在应用数据库中。', detectingCli: '正在检测命令行程序…', cliFound: '已发现', cliNotFound: '未发现命令行程序', cliUnavailable: '无法检测命令行程序', chooseCli: '选择 Codex CLI 可执行文件', chooseKimiCli: '选择 Kimi Code CLI 可执行文件',
    provider: 'AI 提供商', runMode: '运行模式', mockMode: 'Mock（仅供开发）', defaultModel: '默认模型', cliDefaultModel: '留空时使用 CLI 默认模型', cliPath: 'CLI 路径', chooseProgram: '选择程序', defaultPermission: '默认权限', readOnly: '只读', workspaceWrite: '工作区写入', fullAccess: '完全访问', kimiPermissionNotice: 'Kimi 当前通过官方结构化非交互模式运行，工具权限由 Kimi Code CLI 的安全策略处理。',
    theme: '主题', system: '跟随系统', light: '浅色', dark: '深色', fontSize: '字体大小', sendNotification: '完成任务时发送系统通知', autoScroll: '自动滚动到最新消息', compactLayout: '紧凑消息布局',
    privacy: '数据与隐私', privacyIntro: '项目、会话和消息仅保存在本机浏览器存储中。wedex 不会读取或保存 Codex、Kimi 登录凭证。', exportChats: '导出会话', clearCache: '清除缓存',
    closeWindow: '关闭窗口', minimizeWindow: '最小化窗口', maximizeWindow: '最大化或退出最大化',
    welcome: '欢迎使用 wedex', welcomeDescription: '一个受微信启发、支持 Codex 与 Kimi 的桌面界面', welcomeHint: '从左侧添加一个本地项目，随后就能在这里分配任务。', addProject: '添加项目', search: '搜索',
    nonGitProject: '非 Git 项目', nonGitRepository: '非 Git 仓库', startNewTask: '开始一个新任务', taskHint: '告诉当前 AI 你想在此项目中完成什么。',
    addContext: '添加上下文', attachedContext: '已附加上下文', chooseContextFiles: '选择文件', chooseContextFolder: '选择文件夹', dropContextHere: '松开以附加文件或文件夹', removeAttachment: '移除附件', characters: '字符', taskPlaceholder: '描述要交给 AI 的任务…（⌘/Ctrl + Enter 发送）', selectProjectFirst: '请先添加并选择一个项目', clear: '清空', stop: '停止', send: '发送', clearInput: '清空输入', stopTask: '停止任务', sendMessage: '发送消息', taskStopped: '任务已由用户停止。',
    chooseExistingProject: '选择已有项目文件夹', projectName: '项目名称', projectNamePlaceholder: '输入项目名称', createProject: '创建项目', create: '创建', cancel: '取消', moreActions: '更多操作', rename: '重命名', deleteProject: '删除项目', deleteConversation: '删除子对话', confirmDeleteProject: '只从 wedex 中移除此项目？磁盘中的项目文件会保留。', confirmDeleteConversation: '删除此子对话及其本地消息？项目文件会保留。', selectProjectToCreate: '请先在“项目”中选择或新建一个项目。', searchProjects: '搜索项目', searchConversations: '搜索子对话', searchConversation: '搜索对话', addConversation: '增加子对话', noProjects: '还没有项目', createInDownloads: '在“下载/wedex”中新建项目', addExistingProject: '添加已有项目', noConversation: '尚无对话', removeProject: '从应用中移除', selectAProject: '请先选择项目', openProjectList: '打开项目列表', noSubConversations: '还没有子对话', createFirstConversation: '新建第一个子对话', noReply: '暂无回复', conversationName: '子对话名称',
    myAvatar: '我的头像', assistantAvatar: 'wedex 头像', you: '你', copyReply: '复制回复', copyContent: '复制内容', collapse: '收起详情', expand: '展开详情', fileDiff: '文件差异', commandRun: '命令执行', fileOperation: '文件操作', error: '错误', log: '日志',
    typing: '对方正在输入中……', typingRetry: '对方正在输入中{count}…', startingCli: '正在启动 Codex CLI…', startingKimiCli: '正在启动 Kimi Code CLI…', promptProjectPath: '输入本地项目绝对路径',
  },
  'en-US': {
    chat: 'Chats', projects: 'Projects', history: 'Task history', customize: 'Customize avatars', settings: 'Settings', account: 'My account',
    customization: 'Customization', avatarIntro: 'Set avatars for both sides of the chat. Images stay on this device.', mine: 'My avatar', assistant: 'wedex avatar', avatarUse: 'Shown beside chat bubbles.', chooseImage: 'Choose image', reset: 'Reset',
    appearance: 'Appearance & behavior', language: 'Language', chinese: '简体中文', english: 'English',
    settingsIntro: 'Your preferences are stored in the app database on this device.', detectingCli: 'Detecting command-line tool…', cliFound: 'Found', cliNotFound: 'Command-line tool was not found', cliUnavailable: 'Could not detect command-line tool', chooseCli: 'Choose Codex CLI executable', chooseKimiCli: 'Choose Kimi Code CLI executable',
    provider: 'AI provider', runMode: 'Run mode', mockMode: 'Mock (development only)', defaultModel: 'Default model', cliDefaultModel: 'Leave empty to use the CLI default model', cliPath: 'CLI path', chooseProgram: 'Choose program', defaultPermission: 'Default permission', readOnly: 'Read only', workspaceWrite: 'Workspace write', fullAccess: 'Full access', kimiPermissionNotice: 'Kimi currently runs through its official structured non-interactive mode. Tool permissions are handled by Kimi Code CLI security policy.',
    theme: 'Theme', system: 'System', light: 'Light', dark: 'Dark', fontSize: 'Font size', sendNotification: 'Send a system notification when tasks finish', autoScroll: 'Scroll to the newest message automatically', compactLayout: 'Compact message layout',
    privacy: 'Data & privacy', privacyIntro: 'Projects, conversations, and messages are stored only in local browser storage. wedex never reads or stores Codex or Kimi sign-in credentials.', exportChats: 'Export chats', clearCache: 'Clear cache',
    closeWindow: 'Close window', minimizeWindow: 'Minimize window', maximizeWindow: 'Maximize or restore window',
    welcome: 'Welcome to wedex', welcomeDescription: 'A WeChat-inspired desktop interface for Codex and Kimi', welcomeHint: 'Add a local project from the left to start assigning tasks here.', addProject: 'Add project', search: 'Search',
    nonGitProject: 'Not a Git project', nonGitRepository: 'Not a Git repository', startNewTask: 'Start a new task', taskHint: 'Tell the selected AI what you want to do in this project.',
    addContext: 'Add context', attachedContext: 'Attached context', chooseContextFiles: 'Choose files', chooseContextFolder: 'Choose folder', dropContextHere: 'Release to attach files or folders', removeAttachment: 'Remove attachment', characters: 'characters', taskPlaceholder: 'Describe a task for the AI… (⌘/Ctrl + Enter to send)', selectProjectFirst: 'Add and select a project first', clear: 'Clear', stop: 'Stop', send: 'Send', clearInput: 'Clear input', stopTask: 'Stop task', sendMessage: 'Send message', taskStopped: 'Task stopped by the user.',
    chooseExistingProject: 'Choose an existing project folder', projectName: 'Project name', projectNamePlaceholder: 'Enter a project name', createProject: 'Create project', create: 'Create', cancel: 'Cancel', moreActions: 'More actions', rename: 'Rename', deleteProject: 'Delete project', deleteConversation: 'Delete conversation', confirmDeleteProject: 'Remove this project from wedex? Project files on disk will be kept.', confirmDeleteConversation: 'Delete this conversation and its local messages? Project files will be kept.', selectProjectToCreate: 'Choose or create a project in Projects first.', searchProjects: 'Search projects', searchConversations: 'Search conversations', searchConversation: 'Search conversations', addConversation: 'Add conversation', noProjects: 'No projects yet', createInDownloads: 'Create a project in Downloads/wedex', addExistingProject: 'Add an existing project', noConversation: 'No conversations yet', removeProject: 'Remove from app', selectAProject: 'Select a project first', openProjectList: 'Open project list', noSubConversations: 'No sub-conversations yet', createFirstConversation: 'Create the first conversation', noReply: 'No reply yet', conversationName: 'Conversation name',
    myAvatar: 'My avatar', assistantAvatar: 'wedex avatar', you: 'You', copyReply: 'Copy reply', copyContent: 'Copy content', collapse: 'Collapse details', expand: 'Expand details', fileDiff: 'File diff', commandRun: 'Command', fileOperation: 'File operation', error: 'Error', log: 'Log',
    typing: 'The other side is typing…', typingRetry: 'The other side is typing {count}…', startingCli: 'Starting Codex CLI…', startingKimiCli: 'Starting Kimi Code CLI…', promptProjectPath: 'Enter an absolute local project path',
  },
} as const;

export type TranslationKey = keyof typeof dictionary['zh-CN'];

export function t(language: Language | undefined, key: TranslationKey, values?: Record<string, string | number>): string {
  let text: string = dictionary[language ?? 'zh-CN'][key];
  for (const [name, value] of Object.entries(values ?? {})) text = text.replace(`{${name}}`, String(value));
  return text;
}
