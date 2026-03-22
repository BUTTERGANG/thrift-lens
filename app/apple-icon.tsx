import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: 40,
        }}
      >
        {/* Outer amber circle */}
        <div
          style={{
            background: '#f59e0b',
            borderRadius: '50%',
            width: 128,
            height: 128,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Dollar sign */}
          <span
            style={{
              color: '#0f172a',
              fontSize: 68,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              lineHeight: 1,
              marginTop: -4,
            }}
          >
            $
          </span>
        </div>
        {/* Small lens highlight in top-right */}
        <div
          style={{
            position: 'absolute',
            top: 32,
            right: 32,
            width: 20,
            height: 20,
            background: '#fbbf24',
            borderRadius: '50%',
            border: '3px solid #0f172a',
          }}
        />
      </div>
    ),
    size,
  )
}
