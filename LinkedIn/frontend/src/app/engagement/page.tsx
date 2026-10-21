'use client'

import { useEffect, useState } from 'react'
import { useRequireAuth } from '@/lib/auth-context'
import { api, ApiError } from '@/lib/api'
import type { EngagementActionType, EngagementTarget, EngagementTask } from '@/lib/types'

export default function EngagementPage() {
  const { user, loading: authLoading } = useRequireAuth()
  const [targets, setTargets] = useState<EngagementTarget[]>([])
  const [tasks, setTasks] = useState<EngagementTask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [newTarget, setNewTarget] = useState({ name: '', linkedInProfileUrl: '' })
  const [newTask, setNewTask] = useState({ engagementTargetId: '', actionType: 'Comment' as EngagementActionType, suggestedText: '' })

  function load() {
    Promise.all([
      api.get<EngagementTarget[]>('/api/engagement/targets'),
      api.get<EngagementTask[]>('/api/engagement/tasks?status=Pending'),
    ])
      .then(([t, k]) => {
        setTargets(t)
        setTasks(k)
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Failed to load engagement data.'))
  }

  useEffect(() => {
    if (user) load()
  }, [user])

  async function addTarget(e: React.FormEvent) {
    e.preventDefault()
    try {
      await api.post('/api/engagement/targets', {
        name: newTarget.name,
        linkedInProfileUrl: newTarget.linkedInProfileUrl || null,
      })
      setNewTarget({ name: '', linkedInProfileUrl: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add target.')
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    if (!newTask.engagementTargetId) return
    try {
      await api.post('/api/engagement/tasks', newTask)
      setNewTask({ engagementTargetId: '', actionType: 'Comment', suggestedText: '' })
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to add task.')
    }
  }

  async function completeTask(id: string) {
    await api.post(`/api/engagement/tasks/${id}/complete`)
    load()
  }

  async function dismissTask(id: string) {
    await api.post(`/api/engagement/tasks/${id}/dismiss`)
    load()
  }

  if (authLoading || !user) return null

  return (
    <div className="space-y-10">
      <div>
        <h1 className="mb-2 text-lg font-semibold text-slate-900">Engagement</h1>
        <p className="mb-6 text-sm text-slate-600">
          LinkedIn does not allow posting comments or reactions on another member&apos;s behalf through the API —
          track suggested engagement here, then have the relevant Tisoro team member post it manually from their own
          LinkedIn account.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Tracked profiles</h2>
        <form onSubmit={addTarget} className="mb-4 flex flex-wrap gap-2">
          <input
            required
            placeholder="Name"
            value={newTarget.name}
            onChange={(e) => setNewTarget((t) => ({ ...t, name: e.target.value }))}
            className="rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <input
            placeholder="LinkedIn profile URL"
            value={newTarget.linkedInProfileUrl}
            onChange={(e) => setNewTarget((t) => ({ ...t, linkedInProfileUrl: e.target.value }))}
            className="min-w-[16rem] flex-1 rounded-md border border-slate-300 px-3 py-1.5 text-sm"
          />
          <button type="submit" className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">
            Add
          </button>
        </form>
        <ul className="space-y-1">
          {targets.map((t) => (
            <li key={t.id} className="flex items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm">
              <span>
                {t.name} {t.linkedInProfileUrl && <a href={t.linkedInProfileUrl} target="_blank" rel="noreferrer" className="text-sky-600">↗</a>}
              </span>
              <span className="text-xs text-slate-500">{t.pendingTaskCount} pending</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Suggest an engagement action</h2>
        <form onSubmit={addTask} className="mb-4 space-y-2 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <select
            required
            value={newTask.engagementTargetId}
            onChange={(e) => setNewTask((t) => ({ ...t, engagementTargetId: e.target.value }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="">Select a tracked profile…</option>
            {targets.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <select
            value={newTask.actionType}
            onChange={(e) => setNewTask((t) => ({ ...t, actionType: e.target.value as EngagementActionType }))}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            <option value="Comment">Comment</option>
            <option value="Reaction">Reaction</option>
            <option value="Repost">Repost</option>
          </select>
          {newTask.actionType === 'Comment' && (
            <textarea
              placeholder="Suggested comment text"
              value={newTask.suggestedText}
              onChange={(e) => setNewTask((t) => ({ ...t, suggestedText: e.target.value }))}
              rows={2}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          )}
          <button type="submit" className="rounded-md bg-sky-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-sky-700">
            Add suggestion
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Pending suggestions</h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">Nothing pending.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li key={task.id} className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-medium">{task.targetName} — {task.actionType}</span>
                  <div className="flex gap-2">
                    <button onClick={() => completeTask(task.id)} className="text-xs font-medium text-emerald-600">Mark done</button>
                    <button onClick={() => dismissTask(task.id)} className="text-xs font-medium text-slate-500">Dismiss</button>
                  </div>
                </div>
                {task.suggestedText && <p className="text-xs text-slate-600">{task.suggestedText}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
