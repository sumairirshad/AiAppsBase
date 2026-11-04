import { query } from '@/lib/db'

export type SecurityEventType = 'login_failed' | 'login_locked' | 'password_changed' | 'password_change_failed'

export type SecurityEventEntry = {
  userId: string
  eventType: SecurityEventType
  ipAddress: string | null
  userAgent: string | null
  details?: string | null
}

/**
 * Records one account-security-sensitive event — a failed login attempt,
 * an account lockout, a password change (successful or attempted with the
 * wrong current password). This is the only write path into
 * security_events: there is no UPDATE or DELETE anywhere in the app
 * touching this table, so once written a row stands as durable evidence —
 * unlike users.login_failed_attempts, which resets the moment a correct
 * password follows and so can never answer "was this account hit with
 * repeated failed logins on this date" after the fact.
 *
 * Best-effort: a logging failure must never block the underlying action,
 * so failures are logged to stderr and swallowed here — mirroring
 * lib/download-audit.ts#logDownloadAttempt.
 */
export async function logSecurityEvent(entry: SecurityEventEntry): Promise<void> {
  try {
    await query(
      `INSERT INTO security_events (user_id, event_type, ip_address, user_agent, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [entry.userId, entry.eventType, entry.ipAddress, entry.userAgent, entry.details ?? null]
    )
  } catch (error) {
    console.error('[security-events] Failed to write security event', entry.userId, entry.eventType, error)
  }
}
