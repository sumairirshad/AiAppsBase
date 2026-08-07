import { NextRequest, NextResponse } from 'next/server'

import { query } from './db'
import { getSessionUserId } from './session'

export type AdminUser = { id: string; full_name: string; email: string }

/**
 * Guards an admin API route. Returns the admin's identity, or a ready-to-return
 * NextResponse (401/403) if the caller isn't a signed-in admin.
 */
export async function requireAdmin(): Promise<AdminUser | NextResponse> {
  const userId = await getSessionUserId()
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const res = await query<{ id: string; full_name: string; email: string; role: string }>(
    'SELECT id, full_name, email, role FROM users WHERE id = $1',
    [userId]
  )
  if ((res.rowCount ?? 0) === 0 || res.rows[0].role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id, full_name, email } = res.rows[0]
  return { id, full_name, email }
}

export function isAdminGuardError(guard: AdminUser | NextResponse): guard is NextResponse {
  return guard instanceof NextResponse
}

export function getClientIp(req: NextRequest): string | null {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip')
}

export type AuditAction = {
  adminId: string
  action: string
  targetType: string
  targetId: string
  reason: string
  notes?: string | null
  previousValue?: unknown
  newValue?: unknown
  ipAddress?: string | null
}

/**
 * Records an administrative action. Best-effort: a logging failure must never
 * block the underlying action, so failures are logged and swallowed here.
 */
export async function logAdminAction(entry: AuditAction): Promise<void> {
  try {
    await query(
      `INSERT INTO audit_logs
         (admin_id, action, target_type, target_id, reason, notes, previous_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        entry.adminId,
        entry.action,
        entry.targetType,
        entry.targetId,
        entry.reason,
        entry.notes ?? null,
        entry.previousValue !== undefined ? JSON.stringify(entry.previousValue) : null,
        entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null,
        entry.ipAddress ?? null,
      ]
    )
  } catch (error) {
    console.error('[audit] Failed to write audit log entry', entry.action, entry.targetType, entry.targetId, error)
  }
}
