import { ImageResponse } from 'next/og'
 
export const runtime = 'edge'
export const size = { width: 192, height: 192 }
export const contentType = 'image/png'
 
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 100,
          background: 'linear-gradient(to right, #10b981, #06b6d4)',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          borderRadius: '48px',
          fontWeight: 900,
        }}
      >
        M
      </div>
    ),
    { ...size }
  )
}
