import { redirect } from 'next/navigation'
import { getCurrentUser, type CurrentUser } from '@/lib/dashboard'

/** Each role's own portal — where a signed-in user of the "wrong" role gets sent instead of the page they asked for. */
const PORTAL_HOME: Record<string, string> = {
  buyer: '/buyer',
  seller: '/panel',
  admin: '/admin',
}

/**
 * Guards a portal route group's layout. Call at the top of a Server
 * Component layout (buyer/panel/admin) with the roles that may see it.
 *
 * - Not signed in -> redirected to /auth/login.
 * - Signed in but the wrong role (e.g. a seller on /buyer, a buyer on
 *   /panel) -> redirected to their own portal, never the page they asked
 *   for. This runs on every request for every nested route under the
 *   layout, so there's no page to reach by typing a URL directly.
 *
 * Returns the authorized user so the layout can use it if needed.
 */
export async function requirePortalRole(allowedRoles: string[]): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/auth/login')
  if (!allowedRoles.includes(user.role)) redirect(PORTAL_HOME[user.role] ?? '/')
  return user
}
