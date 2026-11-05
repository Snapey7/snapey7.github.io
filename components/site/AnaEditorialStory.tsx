import Image from 'next/image';
import type { Editorial } from '@/lib/content';
import { editorialBody } from '@/lib/editorials';

export function AnaEditorialStory({ editorial }: { editorial: Editorial }) {
  const paragraphs = editorialBody(editorial);
  const photos = editorial.gallery || [];

  const copy = (start: number, end: number) => (
    <div className="cynthia-story-copy">
      {paragraphs.slice(start, end).map((paragraph, offset) => (
        <p className={start + offset === paragraphs.length - 1 ? 'cynthia-story-ending' : undefined} key={start + offset}>{paragraph}</p>
      ))}
    </div>
  );

  const photo = (index: number, priority = false) => {
    const image = photos[index];
    if (!image) return null;
    return (
      <figure className={`cynthia-story-photo ana-story-photo-${index + 1}`} key={image.src}>
        <Image src={image.src} alt={image.alt} width={image.width || 1920} height={image.height || 2880}
          sizes="(max-width: 760px) 100vw, 50vw" priority={priority} />
      </figure>
    );
  };

  return (
    <article className="cynthia-story ana-story" aria-labelledby="ana-story-title">
      <header className="cynthia-story-heading">
        <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
        <h1 id="ana-story-title">{editorial.title}</h1>
        <p className="cynthia-story-deck"><em>{editorial.cardDescription}</em></p>
      </header>

      {photo(0, true)}
      <div className="cynthia-story-opening">{copy(0, 1)}</div>

      <div className="cynthia-story-pair ana-story-neon">
        {copy(1, 2)}
        <div className="cynthia-story-column">{photo(1)}{photo(2)}</div>
      </div>
      {copy(2, 4)}
      {photo(3)}

      <div className="cynthia-story-pair ana-story-window">
        {photo(4)}
        <div className="cynthia-story-column">{copy(4, 7)}{photo(5)}</div>
      </div>
      {copy(7, 9)}

      <div className="cynthia-story-pair ana-story-balcony-intro">
        {copy(9, 11)}{photo(6)}
      </div>
      <div className="cynthia-story-pair ana-story-balcony-gallery">
        {photo(7)}{photo(8)}{photo(9)}{photo(10)}{photo(11)}{photo(12)}
      </div>
      {copy(11, 12)}

      <div className="cynthia-story-pair ana-story-finale">
        {copy(12, paragraphs.length)}{photo(13)}{photo(14)}
      </div>
    </article>
  );
}
