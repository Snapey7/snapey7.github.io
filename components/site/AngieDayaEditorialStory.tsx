import Image from 'next/image';
import type { Editorial, EditorialImage } from '@/lib/content';
import { editorialBody } from '@/lib/editorials';

export function AngieDayaEditorialStory({ editorial }: { editorial: Editorial }) {
  const paragraphs = editorialBody(editorial);
  const photos = editorial.gallery || [];

  function copy(start: number, end: number, className = '') {
    return (
      <div className={`duo-story-copy ${className}`.trim()}>
        {paragraphs.slice(start, end).map((paragraph, offset) => (
          <p className={start + offset === paragraphs.length - 1 ? 'duo-story-ending' : undefined} key={start + offset}>
            {paragraph}
          </p>
        ))}
      </div>
    );
  }

  function photo(index: number, className = '') {
    const image: EditorialImage | undefined = photos[index];
    if (!image) return null;

    return (
      <figure className={`duo-story-photo duo-story-photo-${index + 1} ${className}`.trim()} key={image.id || image.src}>
        <Image
          src={image.src}
          alt={image.alt}
          width={image.width || 1600}
          height={image.height || 2400}
          sizes="(max-width: 760px) 100vw, (max-width: 1200px) 50vw, 620px"
        />
      </figure>
    );
  }

  return (
    <article className="duo-story" aria-labelledby="duo-story-title">
      <figure className="duo-story-cover">
        <Image
          src={editorial.image}
          alt="Angie and Daya framed by the dense tropical greenery of Playa Carmen."
          width={4968}
          height={3312}
          sizes="100vw"
          preload
        />
        <figcaption>IMPURA VIDA <span>·</span> EDITORIAL</figcaption>
      </figure>

      <header className="duo-story-heading">
        <p className="eyebrow">{editorial.location} <span>·</span> EDITORIAL</p>
        <h1 id="duo-story-title">{editorial.title}</h1>
        <p className="duo-story-deck"><em>{editorial.cardDescription}</em></p>
      </header>

      <div className="duo-story-opening">{copy(0, 2)}</div>

      <section className="duo-story-pair duo-story-opening-pair" aria-label="The opening photographs">
        {photo(0)}
        {photo(1)}
      </section>

      <div className="duo-story-interlude duo-story-bath-copy">{copy(2, 6)}</div>

      <section className="duo-story-small-image" aria-label="The bedroom and window">
        {photo(2)}
        <div className="duo-story-interlude">{copy(6, 9)}</div>
      </section>

      <section className="duo-story-pair duo-story-window-pair" aria-label="The view into the greenery">
        {photo(3)}
        {photo(4)}
      </section>

      <div className="duo-story-interlude duo-story-light-copy">{copy(9, 11)}</div>

      <section className="duo-story-pair duo-story-green-pair" aria-label="The changing light">
        {photo(5)}
        {photo(6)}
      </section>

      <section className="duo-story-finale" aria-label="The last light">
        <div className="duo-story-interlude">{copy(11, 12)}</div>
        <div className="duo-story-triptych duo-story-final-triptych">
          {photo(7)}
          {photo(8)}
          {photo(9)}
        </div>
        <div className="duo-story-interlude duo-story-ending-copy">{copy(12, paragraphs.length)}</div>
      </section>
    </article>
  );
}
