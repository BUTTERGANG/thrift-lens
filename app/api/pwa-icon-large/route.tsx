import { ImageResponse } from 'next/og'

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0f172a',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: '#f59e0b',
            borderRadius: '50%',
            width: 360,
            height: 360,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#0f172a',
              fontSize: 200,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              lineHeight: 1,
              marginTop: -12,
            }}
          >
            $
          </span>
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  )
}
