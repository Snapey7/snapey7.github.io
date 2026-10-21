import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';

export const alt =
  'IMPURA VIDA Magazine — Freedom, beauty, and temptation in Costa Rica and beyond.';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const hero = await readFile(join(process.cwd(), 'public/assets/hero.png'));
const logo = await readFile(
  join(process.cwd(), 'public/assets/impura-vida-logo.png'),
);

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          backgroundColor: '#050505',
          display: 'flex',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
          width: '100%',
        }}
      >
        <img
          alt=""
          src={`data:image/png;base64,${hero.toString('base64')}`}
          style={{
            height: '100%',
            left: 0,
            objectFit: 'cover',
            objectPosition: 'center 42%',
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        />
        <div
          style={{
            background:
              'linear-gradient(90deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.72) 46%, rgba(0,0,0,0.1) 100%)',
            display: 'flex',
            height: '100%',
            left: 0,
            position: 'absolute',
            top: 0,
            width: '100%',
          }}
        />
        <div
          style={{
            alignItems: 'flex-start',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'center',
            padding: '54px 74px',
            position: 'relative',
            width: '66%',
          }}
        >
          <img
            alt="IMPURA VIDA Magazine"
            src={`data:image/png;base64,${logo.toString('base64')}`}
            style={{
              height: 190,
              marginLeft: -74,
              objectFit: 'contain',
              objectPosition: 'left center',
              width: 440,
            }}
          />
          <div
            style={{
              color: '#ff685f',
              fontFamily: 'Arial, sans-serif',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: 5,
              marginTop: 2,
            }}
          >
            A PRIVATE DIGITAL EDITORIAL WORLD
          </div>
          <div
            style={{
              color: '#f4eee9',
              fontFamily: 'Georgia, serif',
              fontSize: 34,
              lineHeight: 1.25,
              marginTop: 22,
              maxWidth: 620,
            }}
          >
            Freedom, beauty, and temptation in Costa Rica and beyond.
          </div>
          <div
            style={{
              color: '#e3b0a8',
              fontFamily: 'Arial, sans-serif',
              fontSize: 15,
              letterSpacing: 3,
              marginTop: 34,
            }}
          >
            IMPURAVIDAMAGAZINE.COM
          </div>
        </div>
      </div>
    ),
    size,
  );
}
