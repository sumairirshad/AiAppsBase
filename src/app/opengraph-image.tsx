import { ImageResponse } from 'next/og'

export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0b1020 0%, #1e1440 55%, #3b0f3d 100%)',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 40,
            fontWeight: 700,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #d946ef 100%)',
            }}
          >
            A
          </div>
          AIAppsBase
        </div>
        <div style={{ display: 'flex', fontSize: 56, fontWeight: 700, textAlign: 'center', maxWidth: 900 }}>
          The marketplace for AI-built apps &amp; repos
        </div>
        <div style={{ display: 'flex', fontSize: 26, color: '#a3a3c2', marginTop: 20 }}>
          Websites · SaaS · UI kits · Mobile apps
        </div>
      </div>
    ),
    { ...size }
  )
}
