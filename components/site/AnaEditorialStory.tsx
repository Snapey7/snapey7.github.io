import Image from 'next/image';
import type { Editorial } from '@/lib/content';
import { editorialBody } from '@/lib/editorials';

export function AnaEditorialStory({ editorial }: { editorial: Editorial }) {
  const paragraphs = editorialBody(editorial);
  const photos = editorial.gallery || [];

  function copy(start: number, end: number) {
    return (
      <div className="cynthia-story-copy">
        {paragraphs.slice(start, end).map((paragraph, offset) => (
          <p className={start + offset === paragraphs.length - 1 ? 'cynthia-story-ending' : undefined} key={start + offset}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  function photo(index: number) {
    const image = photos[index];
    if (!image) return null;
    return (
      <figure className={`cynthia-story-photo ana-story-photo-${index + 1}`} key={image.src}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width || 1920}
          height={image.height || 2880}
          sizes="(max-width: 760px) 100vw, 50vw"
        />
      </figure>
    );
  }

  const cover = photos[0];

  return (
    <article className="cynthia-story ana-story" aria-labelledby="ana-story-title">
      <header className="cynthia-story-heading">
        <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
        <h1 id="ana-story-title">{editorial.title}</h1>
        <p className="cynthia-story-deck"><em>{editorial.cardDescription}</em></p>
      </header>

      <figure className="cynthia-story-cover">
        <Image
          src={editorial.image}
          alt={cover?.alt || `Ana in Miami for ${editorial.title}.`}
          width={cover?.width || 1920}
          height={cover?.height || 2880}
          sizes="(max-width: 1280px) 100vw, 1280px"
          preload
        />
      </figure>

      <div className="cynthia-story-opening">{copy(0, 1)}</div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(1)}
        <div className="cynthia-story-column">
          {copy(1, 3)}
          {photo(2)}
        </div>
      </div>

      <div className="cynthia-story-pair cynthia-story-portrait">
        {copy(3, 5)}
        {photo(3)}
      </div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(4)}
        <div className="cynthia-story-column">
          {copy(5, 6)}
          {photo(5)}
        </div>
      </div>

      <div className="cynthia-story-pair cynthia-story-portrait">
        {copy(6, 9)}
        {photo(6)}
      </div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(7)}
        <div className="cynthia-story-column">
          {copy(9, 11)}
          {photo(8)}
        </div>
      </div>

      <div className="cynthia-story-pair cynthia-story-portrait">
        {copy(11, 13)}
        {photo(9)}
      </div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(10)}
        <div className="cynthia-story-column">
          {copy(13, 14)}
          {photo(11)}
        </div>
      </div>

      <div className="cynthia-story-pair cynthia-story-portrait">
        {copy(14, 15)}
        {photo(12)}
      </div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(13)}
        <div className="cynthia-story-column">
          {copy(15, paragraphs.length)}
          {photo(14)}
        </div>
      </div>
    </article>
  );
}
