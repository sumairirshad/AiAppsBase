import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getClientIp, isAdminGuardError, logAdminAction, requireAdmin } from '@/lib/admin'
import { sendModerationDecisionEmail } from '@/lib/email'
import { snapshotGithubRepo } from '@/lib/github-snapshot'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const guard = await requireAdmin()
  if (isAdminGuardError(guard)) return guard

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }
  const { status, reason, notes } = body as { status?: string; reason?: string; notes?: string }
  const allowed = ['approved', 'rejected', 'suspended', 'pending']
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }
  if (!reason || !String(reason).trim()) {
    return NextResponse.json({ error: 'A reason is required for this action' }, { status: 400 })
  }

  try {
    const existing = await query(
      `SELECT p.id, p.title, p.status, p.seller_id, p.github_repo_name, p.github_default_branch,
              u.email AS seller_email, u.email_notifications_enabled
       FROM products p JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1`,
      [params.id]
    )
    if (existing.rowCount === 0) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    const before = existing.rows[0] as any

    // A GitHub-sourced listing is only approved once its repo archive has
    // actually been fetched and stored — never on trust that it still will
    // be. This re-verifies seller authorization, repo existence, and the
    // selected branch (not just whatever was true at submission time, which
    // may have changed), then snapshots the archive into the same storage
    // manual-upload products use. If any of that fails, approval is refused
    // outright and the product's status is left untouched.
    if (status === 'approved' && before.github_repo_name) {
      const snapshot = await snapshotGithubRepo(
        params.id,
        before.seller_id,
        before.github_repo_name,
        before.github_default_branch || 'main'
      )
      if (!snapshot.ok) {
        return NextResponse.json(
          {
            error: `Could not approve: the repository archive could not be fetched and stored. ${snapshot.error}`,
          },
          { status: 502 }
        )
      }
    }

    // Surface the reason to the seller for a rejection; clear any stale
    // reason once the product moves to any other status. pending_reason is
    // cleared too -- an admin decision resolves whatever the seller-facing
    // "why is this pending" context was (see migration 035).
    const rejectionReason = status === 'rejected' ? String(reason).trim() : null
    await query('UPDATE products SET status = $1, rejection_reason = $2, pending_reason = NULL WHERE id = $3', [
      status,
      rejectionReason,
      params.id,
    ])

    await logAdminAction({
      adminId: guard.id,
      action: `product.status.${status}`,
      targetType: 'product',
      targetId: params.id,
      reason: String(reason).trim(),
      notes: notes ? String(notes).trim() : null,
      previousValue: { status: before.status },
      newValue: { status },
      ipAddress: getClientIp(req),
    })

    if ((status === 'approved' || status === 'rejected') && before.email_notifications_enabled) {
      try {
        await sendModerationDecisionEmail(before.seller_email, {
          kind: 'product',
          status,
          title: before.title,
          reason: rejectionReason,
        })
      } catch (error) {
        console.error('[admin/products] Failed to send moderation decision email', params.id, error)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Admin product update error:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}
