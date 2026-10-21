'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useRequireAuth } from '@/lib/auth-context'
import { api, ApiError } from '@/lib/api'
import type { LinkedInStatus } from '@/lib/types'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_state: 'The connection attempt could not be verified. Please try connecting again.',
  missing_code_or_state: 'LinkedIn did not return the expected authorization details. Please try again.',
  admin_not_found: 'The admin account that started this connection no longer exists.',
  no_administered_organization:
    'Your LinkedIn account does not administer the Tisoro Global Page (or the required role has not been granted). Ask a current Page admin to grant you Super Admin / Content Admin access on LinkedIn, then try again.',
  linkedin_api_error: 'LinkedIn rejected the request. Check the LinkedIn app credentials and try again.',
}

export default function LinkedInSettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
      <LinkedInSettingsContent />
    </Suspense>
  )
}

function LinkedInSettingsContent() {
  const { user, loading: authLoading } = useRequireAuth()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<LinkedInStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)

  const load = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      setStatus(await api.get<LinkedInStatus>('/api/linkedin/status'))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load connection status.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const errorCode = searchParams.get('error')
    if (errorCode) setError(ERROR_MESSAGES[errorCode] ?? `Connection failed: ${errorCode}`)
  }, [searchParams])

  async function connect() {
    setConnecting(true)
    setError(null)
    try {
      const { authorizeUrl } = await api.get<{ authorizeUrl: string }>('/api/linkedin/connect')
      window.location.href = authorizeUrl
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to start the LinkedIn connection.')
      setConnecting(false)
    }
  }

  async function disconnect() {
    if (!confirm('Disconnect the Tisoro Global LinkedIn Page? Scheduled posts will fail to publish until reconnected.')) return
    try {
      await api.post('/api/linkedin/disconnect')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to disconnect.')
    }
  }

  if (authLoading || !user) return null

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-lg font-semibold text-slate-900">LinkedIn connection</h1>

      {searchParams.get('connected') === '1' && (
        <p className="mb-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          LinkedIn connected successfully.
        </p>
      )}
      {error && <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : status?.connected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
                Connected
              </span>
              {status.tokenExpired && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                  Access token expired — reconnect
                </span>
              )}
            </div>
            <dl className="space-y-1 text-sm text-slate-700">
              <div><dt className="inline font-medium">Organization: </dt><dd className="inline">{status.organizationName || status.organizationUrn}</dd></div>
              <div><dt className="inline font-medium">Connected by: </dt><dd className="inline">{status.connectedByAdminEmail}</dd></div>
              <div><dt className="inline font-medium">Connected at: </dt><dd className="inline">{status.connectedAt && new Date(status.connectedAt).toLocaleString()}</dd></div>
              <div><dt className="inline font-medium">Access token expires: </dt><dd className="inline">{status.accessTokenExpiresAt && new Date(status.accessTokenExpiresAt).toLocaleString()}</dd></div>
            </dl>
            <div className="flex gap-3 pt-2">
              <button onClick={connect} disabled={connecting} className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-slate-50">
                Reconnect
              </button>
              <button onClick={disconnect} className="rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              No LinkedIn Page is connected. Connecting requires an admin (Super Admin or Content Admin) of the
              Tisoro Global LinkedIn Page to sign in and grant access — scheduled posts cannot publish until this is
              done.
            </p>
            <button
              onClick={connect}
              disabled={connecting}
              className="rounded-md bg-[#0a66c2] px-4 py-2 text-sm font-medium text-white hover:bg-[#004182] disabled:opacity-60"
            >
              {connecting ? 'Redirecting to LinkedIn…' : 'Connect LinkedIn Page'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
