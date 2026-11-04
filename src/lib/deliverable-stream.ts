import { NextResponse } from 'next/server'
import { Readable } from 'stream'
import { downloadDeliverableStream } from '@/lib/sftp'
import { decryptToken } from '@/lib/token-crypto'
import type { ResolvedDeliverable } from '@/lib/product-versions'

/**
 * Streams a resolved deliverable back to the client. Factored out of
 * /api/orders/[id]/download so the malware-override endpoint (which streams
 * the exact same bytes once a buyer has cleared the warning + reauth flow)
 * doesn't duplicate the SFTP/GitHub fallback logic.
 */
export function streamDeliverable(webStream: ReadableStream, fileName: string, size?: number, contentType = 'application/octet-stream') {
  const headers: Record<string, string> = {
    'Content-Disposition': `attachment; filename="${fileName.replace(/"/g, '')}"`,
    'Content-Type': contentType,
  }
  if (size) headers['Content-Length'] = String(size)
  return new NextResponse(webStream, { headers })
}

export async function streamResolvedDeliverable(
  deliverable: ResolvedDeliverable,
  sellerGithubAccessTokenEncrypted: string | null
): Promise<NextResponse> {
  if (deliverable.deliverableRemotePath) {
    try {
      const { stream, size } = await downloadDeliverableStream(deliverable.deliverableRemotePath)
      const webStream = Readable.toWeb(stream as Readable) as ReadableStream
      return streamDeliverable(webStream, deliverable.deliverableOriginalName || 'download', size)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      console.error('[deliverable-stream] SFTP fetch failed:', message, err)
      return NextResponse.json({ error: 'Could not reach file storage server. Please try again shortly.' }, { status: 502 })
    }
  }

  if (deliverable.githubRepoName) {
    const branch = deliverable.githubBranch || 'main'
    const accessToken = decryptToken(sellerGithubAccessTokenEncrypted)

    if (accessToken) {
      try {
        const ghRes = await fetch(`https://api.github.com/repos/${deliverable.githubRepoName}/zipball/${branch}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: 'application/vnd.github+json',
            'User-Agent': 'AIAppsBase-App',
          },
        })

        if (ghRes.ok && ghRes.body) {
          const repoSlug = deliverable.githubRepoName.split('/').pop() || 'repo'
          return streamDeliverable(ghRes.body as unknown as ReadableStream, `${repoSlug}-${branch}.zip`, undefined, 'application/zip')
        }

        console.error(
          '[deliverable-stream] legacy GitHub zipball fetch failed:',
          ghRes.status,
          await ghRes.text().catch(() => '')
        )
      } catch (err) {
        console.error('[deliverable-stream] legacy GitHub zipball fetch error:', err)
      }
    }

    try {
      const publicRes = await fetch(
        `https://github.com/${deliverable.githubRepoName}/archive/refs/heads/${branch}.zip`
      )

      if (publicRes.ok && publicRes.body) {
        const repoSlug = deliverable.githubRepoName.split('/').pop() || 'repo'
        return streamDeliverable(publicRes.body as unknown as ReadableStream, `${repoSlug}-${branch}.zip`, undefined, 'application/zip')
      }
    } catch (err) {
      console.error('[deliverable-stream] legacy public archive fetch error:', err)
    }

    console.error(
      '[deliverable-stream] Unable to fetch legacy (pre-snapshot) deliverable for repo',
      deliverable.githubRepoName,
      'branch', branch
    )
    return NextResponse.json(
      {
        error:
          "This product's files couldn't be retrieved. The seller's GitHub connection needs to be reconnected — please contact support or the seller.",
      },
      { status: 502 }
    )
  }

  return NextResponse.json({ error: 'No downloadable file for this product' }, { status: 404 })
}
