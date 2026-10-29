'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

type CataloguePhoto = {
  id: string;
  title: string;
  alt_text: string;
};

export function PrivateCatalogueExperience({
  modelName,
  location,
  coverImage,
  description,
  photos,
}: {
  modelName: string;
  location: string;
  coverImage: string;
  description: string;
  photos: CataloguePhoto[];
}) {
  const [activePhoto, setActivePhoto] = useState<number | null>(null);
  const activePhotoRef = useRef<number | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const isViewerOpen = activePhoto !== null;
  activePhotoRef.current = activePhoto;

  useEffect(() => {
    if (!isViewerOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      const current = activePhotoRef.current;
      if (current === null) return;
      if (event.key === 'Escape') setActivePhoto(null);
      if (event.key === 'ArrowRight') setActivePhoto((current + 1) % photos.length);
      if (event.key === 'ArrowLeft') setActivePhoto((current - 1 + photos.length) % photos.length);
      if (event.key === 'Tab') {
        const controls = viewerRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      triggerRef.current?.focus();
    };
  }, [isViewerOpen, photos.length]);

  function openPhoto(index: number, trigger: HTMLButtonElement) {
    triggerRef.current = trigger;
    setActivePhoto(index);
  }

  return (
    <main className="private-catalogue">
      <section className="private-catalogue-cover" aria-labelledby="private-catalogue-title">
        <Image
          alt=""
          className="private-catalogue-cover-image"
          fill
          priority
          sizes="100vw"
          src={coverImage}
        />
        <div className="private-catalogue-cover-shade" />
        <div className="private-catalogue-cover-copy">
          <p className="private-catalogue-kicker">IMPURA VIDA <span>·</span> PRIVATE COLLECTION</p>
          <p className="private-catalogue-edition">A photographic portfolio</p>
          <h1 id="private-catalogue-title">{modelName}</h1>
          <p className="private-catalogue-location">{location}</p>
          <span className="private-catalogue-rule" aria-hidden="true" />
          <p className="private-catalogue-description">
            {description || `A private photo collection with ${modelName}, captured in ${location}.`}
          </p>
          <a className="private-catalogue-browse" href="#private-gallery">Enter the collection <span aria-hidden="true">↓</span></a>
        </div>
        <p className="private-catalogue-cover-index" aria-hidden="true">PRIVATE VIEW · {String(photos.length).padStart(2, '0')} PHOTOGRAPHS</p>
      </section>

      <section className="private-catalogue-gallery" id="private-gallery" aria-labelledby="private-gallery-title">
        <header className="private-catalogue-gallery-heading">
          <div>
            <p className="private-catalogue-kicker">A CLOSER LOOK</p>
            <h2 id="private-gallery-title">The collection</h2>
          </div>
          <p>{String(photos.length).padStart(2, '0')} photographs <span>·</span> {location}</p>
        </header>

        <div className="private-catalogue-grid">
          {photos.map((photo, index) => (
            <button
              aria-label={`View photograph ${index + 1}: ${photo.alt_text || photo.title}`}
              className="private-catalogue-photo"
              key={photo.id}
              onClick={(event) => openPhoto(index, event.currentTarget)}
              type="button"
            >
              <img alt={photo.alt_text || photo.title} loading={index < 2 ? 'eager' : 'lazy'} src={`/api/member-media/${photo.id}`} />
              <span className="private-catalogue-photo-caption">
                <span>{photo.title || `${modelName} · ${String(index + 1).padStart(2, '0')}`}</span>
                <span aria-hidden="true">↗</span>
              </span>
            </button>
          ))}
        </div>

        <footer className="private-catalogue-footer">
          <span>IMPURA VIDA · PRIVATE COLLECTION</span>
          <a href="/models">Return to Muse <span aria-hidden="true">↑</span></a>
        </footer>
      </section>

      {activePhoto !== null && photos[activePhoto] && (
        <div
          aria-label={`${modelName} private collection photo viewer`}
          aria-modal="true"
          className="private-photo-viewer"
          onClick={(event) => {
            if (event.target === event.currentTarget) setActivePhoto(null);
          }}
          ref={viewerRef}
          role="dialog"
        >
          <button aria-label="Close photo viewer" className="private-photo-viewer-close" onClick={() => setActivePhoto(null)} ref={closeButtonRef} type="button">×</button>
          <button aria-label="Previous photograph" className="private-photo-viewer-nav previous" onClick={() => setActivePhoto((activePhoto - 1 + photos.length) % photos.length)} type="button">←</button>
          <figure className="private-photo-viewer-figure">
            <img alt={photos[activePhoto].alt_text || photos[activePhoto].title} src={`/api/member-media/${photos[activePhoto].id}`} />
            <figcaption>{photos[activePhoto].title || `${modelName} · ${String(activePhoto + 1).padStart(2, '0')}`}</figcaption>
          </figure>
          <button aria-label="Next photograph" className="private-photo-viewer-nav next" onClick={() => setActivePhoto((activePhoto + 1) % photos.length)} type="button">→</button>
          <p className="private-photo-viewer-count">{String(activePhoto + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</p>
        </div>
      )}
    </main>
  );
}
