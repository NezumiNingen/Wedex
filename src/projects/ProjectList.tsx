import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useMemo, useState } from 'react';
import { IconButton } from '../components/IconButton';
import { useAppStore } from '../stores/appStore';

export function ProjectList() {
  const {
    projects,
    sessions,
    messages,
    selectedProjectId,
    selectedSessionId,
    view,
    setView,
    select,
    addProject,
    newSession,
    renameProject,
    renameSession,
    removeProject,
    status,
  } = useAppStore();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ kind: 'project' | 'session'; id: string; value: string } | null>(null);
  const projectMode = view === 'projects';
  const selectedProject = projects.find((project) => project.id === selectedProjectId);

  const projectRows = useMemo(
    () => projects
      .filter((project) => project.name.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt - a.updatedAt),
    [projects, query],
  );

  const sessionRows = useMemo(
    () => sessions
      .filter((session) => session.projectId === selectedProjectId)
      .filter((session) => session.title.toLowerCase().includes(query.toLowerCase()))
      .sort((a, b) => b.updatedAt - a.updatedAt),
    [query, selectedProjectId, sessions],
  );

  const chooseExistingProject = async () => {
    const path = await open({ directory: true, multiple: false, title: '选择已有项目文件夹' });
    if (typeof path === 'string') addProject(path);
  };

  const createProject = async () => {
    const name = window.prompt('项目名称');
    if (!name?.trim()) return;
    try {
      const path = await invoke<string>('create_default_project', { name });
      addProject(path);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  };

  const createConversation = async () => {
    if (!selectedProjectId) {
      window.alert('请先在“项目”中选择或新建一个项目。');
      return;
    }
    try {
      await newSession(selectedProjectId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  };

  const create = projectMode ? createProject : createConversation;
  const beginRename = (kind: 'project' | 'session', id: string, value: string) => setEditing({ kind, id, value });
  const commitRename = () => {
    if (!editing) return;
    if (editing.kind === 'project') renameProject(editing.id, editing.value);
    else renameSession(editing.id, editing.value);
    setEditing(null);
  };

  return (
    <aside className="project-list">
      <header>
        <div className="search">
          <Search size={20}/>
          <input
            aria-label={projectMode ? '搜索项目' : '搜索子对话'}
            placeholder={projectMode ? '搜索项目' : '搜索对话'}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <IconButton
          title={projectMode ? '增加项目' : '增加子对话'}
          className="new-project"
          onClick={() => void create()}
        >
          <Plus size={25}/>
        </IconButton>
      </header>

      <div className="project-scroll">
        {projectMode ? (
          projectRows.length === 0 ? (
            <div className="list-empty">
              还没有项目
              <br/>
              <button onClick={() => void createProject()}>在“下载/wedex”中新建项目</button>
              <button onClick={() => void chooseExistingProject()}>添加已有项目</button>
            </div>
          ) : projectRows.map((project) => {
            const currentSession = sessions.find((session) => session.id === project.currentSessionId);
            return (
              <div
                key={project.id}
                className={`project-row ${project.id === selectedProjectId ? 'selected' : ''}`}
                onClick={() => select(project.id)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  beginRename('project', project.id, project.name);
                }}
              >
                <div className="avatar">{project.name.slice(0, 1).toUpperCase()}</div>
                <div className="project-main">
                  <div className="project-name">
                    {editing?.kind === 'project' && editing.id === project.id ? <input className="inline-rename" autoFocus value={editing.value} aria-label="项目名称" onMouseDown={(event) => event.stopPropagation()} onChange={(event) => setEditing({ ...editing, value: event.target.value })} onBlur={commitRename} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditing(null); }}/> : project.name}
                    <span className={`status-dot ${project.id === selectedProjectId ? status : currentSession?.status ?? 'idle'}`}/>
                  </div>
                  <div className="last-message">
                    {currentSession?.title ?? '尚无对话'} · {project.branch ?? '非 Git 项目'}
                  </div>
                </div>
                <div className="row-menu">
                  <IconButton
                    title="从应用中移除"
                    onClick={(event) => {
                      event.stopPropagation();
                      removeProject(project.id);
                    }}
                  >
                    <MoreHorizontal size={16}/>
                  </IconButton>
                </div>
              </div>
            );
          })
        ) : !selectedProject ? (
          <div className="list-empty">
            请先选择项目
            <br/>
            <button onClick={() => setView('projects')}>打开项目列表</button>
          </div>
        ) : sessionRows.length === 0 ? (
          <div className="list-empty">
            还没有子对话
            <br/>
            <button onClick={() => void createConversation()}>新建第一个子对话</button>
          </div>
        ) : sessionRows.map((session) => {
          const reply = messages
            .slice()
            .reverse()
            .find((message) => message.sessionId === session.id && message.type === 'assistant');
          const preview = reply?.content.replace(/\s+/g, ' ').trim().slice(0, 42) || '暂无回复';
          return (
            <div
              key={session.id}
              className={`project-row ${session.id === selectedSessionId ? 'selected' : ''}`}
              onClick={() => select(selectedProject.id, session.id)}
              onContextMenu={(event) => {
                event.preventDefault();
                beginRename('session', session.id, session.title);
              }}
            >
              <div className="avatar">{selectedProject.name.slice(0, 1).toUpperCase()}</div>
              <div className="project-main">
                <div className="project-name">
                  {editing?.kind === 'session' && editing.id === session.id ? <input className="inline-rename" autoFocus value={editing.value} aria-label="子对话名称" onMouseDown={(event) => event.stopPropagation()} onChange={(event) => setEditing({ ...editing, value: event.target.value })} onBlur={commitRename} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditing(null); }}/> : session.title}
                  <span className={`status-dot ${session.id === selectedSessionId ? status : session.status}`}/>
                </div>
                <div className="last-message">{preview}</div>
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}
