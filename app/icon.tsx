import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
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
            width: '78%',
            height: '78%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#0f172a',
              fontSize: 16,
              fontWeight: 900,
              fontFamily: 'sans-serif',
              lineHeight: 1,
            }}
          >
            $
          </span>
        </div>
      </div>
    ),
    size,
  )
}
