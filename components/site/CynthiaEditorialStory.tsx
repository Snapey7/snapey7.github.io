import Image from 'next/image';
import type { Editorial } from '@/lib/content';
import { editorialBody } from '@/lib/editorials';

export function CynthiaEditorialStory({ editorial }: { editorial: Editorial }) {
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
    const landscape = index === 1 || index === 3;
    return (
      <figure className={`cynthia-story-photo cynthia-story-photo-${index + 1}`}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width || (landscape ? 1920 : 1280)}
          height={image.height || (landscape ? 1280 : 1920)}
          sizes={index === 3 ? '(max-width: 1280px) 100vw, 1280px' : '(max-width: 760px) 100vw, 50vw'}
        />
      </figure>
    );
  }

  return (
    <article className="cynthia-story" aria-labelledby="cynthia-story-title">
      <header className="cynthia-story-heading">
        <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
        <h1 id="cynthia-story-title">{editorial.title}</h1>
        <p className="cynthia-story-deck"><em>{editorial.cardDescription}</em></p>
      </header>

      <figure className="cynthia-story-cover">
        <Image
          src={editorial.image}
          alt="Cynthia leaning across a bamboo railing in warm light against deep shadow."
          width={5088}
          height={3392}
          sizes="(max-width: 1280px) 100vw, 1280px"
          preload
        />
      </figure>

      <div className="cynthia-story-opening">{copy(0, 1)}</div>

      <div className="cynthia-story-pair cynthia-story-casita">
        {photo(0)}
        <div className="cynthia-story-column">
          {copy(1, 2)}
          {photo(1)}
        </div>
      </div>

      <div className="cynthia-story-pair cynthia-story-portrait">
        {copy(2, 6)}
        {photo(2)}
      </div>

      {copy(6, 8)}
      {photo(3)}
      {copy(8, 10)}

      <div className="cynthia-story-pair">
        {photo(4)}
        {photo(5)}
      </div>

      {copy(10, 12)}

      <div className="cynthia-story-pair">
        {photo(6)}
        {photo(7)}
      </div>

      <div className="cynthia-story-closing">{copy(12, paragraphs.length)}</div>
    </article>
  );
}
