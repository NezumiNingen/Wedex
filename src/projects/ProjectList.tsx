import { MoreHorizontal, Plus, Search } from 'lucide-react';
import { open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useMemo, useState } from 'react';
import { IconButton } from '../components/IconButton';
import { useAppStore } from '../stores/appStore';
import { t } from '../lib/i18n';

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
    settings,
  } = useAppStore();
  const tr = (key: Parameters<typeof t>[1]) => t(settings.language, key);
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<{ kind: 'project' | 'session'; id: string; value: string } | null>(null);
  const [projectCreatorOpen, setProjectCreatorOpen] = useState(false);
  const [projectAddMenuOpen, setProjectAddMenuOpen] = useState(false);
  const [projectDraft, setProjectDraft] = useState('');
  const [projectError, setProjectError] = useState('');
  const [creatingProject, setCreatingProject] = useState(false);
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
    setProjectAddMenuOpen(false);
    const path = await open({ directory: true, multiple: false, title: tr('chooseExistingProject') });
    if (typeof path === 'string') addProject(path);
  };

  const openProjectCreator = () => {
    setProjectAddMenuOpen(false);
    setProjectError('');
    setProjectDraft('');
    setProjectCreatorOpen(true);
  };

  const closeProjectCreator = () => {
    if (creatingProject) return;
    setProjectCreatorOpen(false);
    setProjectDraft('');
    setProjectError('');
  };

  const createProject = async () => {
    const name = projectDraft.trim();
    if (!name || creatingProject) return;
    setCreatingProject(true);
    setProjectError('');
    try {
      const path = await invoke<string>('create_default_project', { name });
      addProject(path);
      setProjectCreatorOpen(false);
      setProjectDraft('');
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : String(error));
    } finally {
      setCreatingProject(false);
    }
  };

  const createConversation = async () => {
    if (!selectedProjectId) {
      window.alert(tr('selectProjectToCreate'));
      return;
    }
    try {
      await newSession(selectedProjectId);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : String(error));
    }
  };

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
            aria-label={projectMode ? tr('searchProjects') : tr('searchConversations')}
            placeholder={projectMode ? tr('searchProjects') : tr('searchConversation')}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="project-add-action">
          <IconButton
            title={projectMode ? tr('addProject') : tr('addConversation')}
            className="new-project"
            onClick={() => projectMode ? setProjectAddMenuOpen((open) => !open) : void createConversation()}
          >
            <Plus size={25}/>
          </IconButton>
          {projectMode && projectAddMenuOpen && <div className="project-add-menu">
            <button type="button" onClick={openProjectCreator}>{tr('createProject')}</button>
            <button type="button" onClick={() => void chooseExistingProject()}>{tr('addExistingProject')}</button>
          </div>}
        </div>
      </header>

      {projectMode && projectCreatorOpen && <div className="project-create-panel">
        <label>{tr('createProject')}</label>
        <input
          autoFocus
          value={projectDraft}
          placeholder={tr('projectNamePlaceholder')}
          aria-label={tr('projectName')}
          onChange={(event) => setProjectDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') void createProject();
            if (event.key === 'Escape') closeProjectCreator();
          }}
        />
        {projectError && <p role="alert">{projectError}</p>}
        <div><button type="button" onClick={closeProjectCreator}>{tr('cancel')}</button><button type="button" disabled={!projectDraft.trim() || creatingProject} onClick={() => void createProject()}>{tr('create')}</button></div>
      </div>}

      <div className="project-scroll">
        {projectMode ? (
          projectRows.length === 0 ? (
            <div className="list-empty">
              {tr('noProjects')}
              <br/>
              <button onClick={openProjectCreator}>{tr('createInDownloads')}</button>
              <button onClick={() => void chooseExistingProject()}>{tr('addExistingProject')}</button>
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
                    {editing?.kind === 'project' && editing.id === project.id ? <input className="inline-rename" autoFocus value={editing.value} aria-label={tr('projectName')} onMouseDown={(event) => event.stopPropagation()} onChange={(event) => setEditing({ ...editing, value: event.target.value })} onBlur={commitRename} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditing(null); }}/> : project.name}
                    <span className={`status-dot ${project.id === selectedProjectId ? status : currentSession?.status ?? 'idle'}`}/>
                  </div>
                  <div className="last-message">
                    {currentSession?.title ?? tr('noConversation')} · {project.branch ?? tr('nonGitProject')}
                  </div>
                </div>
                <div className="row-menu">
                  <IconButton
                    title={tr('removeProject')}
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
            {tr('selectAProject')}
            <br/>
            <button onClick={() => setView('projects')}>{tr('openProjectList')}</button>
          </div>
        ) : sessionRows.length === 0 ? (
          <div className="list-empty">
            {tr('noSubConversations')}
            <br/>
            <button onClick={() => void createConversation()}>{tr('createFirstConversation')}</button>
          </div>
        ) : sessionRows.map((session) => {
          const reply = messages
            .slice()
            .reverse()
            .find((message) => message.sessionId === session.id && message.type === 'assistant');
          const preview = reply?.content.replace(/\s+/g, ' ').trim().slice(0, 42) || tr('noReply');
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
                  {editing?.kind === 'session' && editing.id === session.id ? <input className="inline-rename" autoFocus value={editing.value} aria-label={tr('conversationName')} onMouseDown={(event) => event.stopPropagation()} onChange={(event) => setEditing({ ...editing, value: event.target.value })} onBlur={commitRename} onKeyDown={(event) => { if (event.key === 'Enter') commitRename(); if (event.key === 'Escape') setEditing(null); }}/> : session.title}
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
