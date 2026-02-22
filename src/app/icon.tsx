import { ImageResponse } from 'next/server'

export const size = {
  width: 256,
  height: 256,
}

export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#FFF3E0',
          borderRadius: 48,
        }}
      >
        <div
          style={{
            width: 200,
            height: 200,
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 999,
              background: '#FF8A65',
              left: 24,
              top: 40,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 48,
              height: 48,
              borderRadius: 999,
              background: '#FFB74D',
              left: 72,
              top: 28,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 56,
              height: 56,
              borderRadius: 999,
              background: '#4FC3F7',
              left: 120,
              top: 40,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 96,
              height: 64,
              borderRadius: 32,
              background: '#FFCCBC',
              left: 8,
              top: 96,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 88,
              height: 58,
              borderRadius: 32,
              background: '#FFE0B2',
              left: 64,
              top: 100,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 96,
              height: 64,
              borderRadius: 32,
              background: '#B3E5FC',
              left: 104,
              top: 96,
            }}
          />
          <div
            style={{
              position: 'absolute',
              width: 56,
              height: 32,
              left: 72,
              top: 120,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background: '#FF6F61',
              }}
            />
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
