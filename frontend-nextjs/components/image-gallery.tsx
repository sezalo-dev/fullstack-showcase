'use client';

import { useState } from 'react';
import { PublicImage } from './public-image';

export default function ImageGallery({ images }: { images: string[] }) {
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="relative w-full aspect-video mb-4 overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200">
        {images && images.length > 0 ? (
          <PublicImage objectKey={images[active]} alt={`Bild ${active + 1}`} priority />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500">
            <span>Kein Bild verfügbar</span>
          </div>
        )}
      </div>

      {images && images.length > 1 && (
        <div className="flex gap-2">
          {images.map((img, idx) => (
            <button
              key={img}
              onClick={() => setActive(idx)}
              className={`relative w-20 aspect-square rounded overflow-hidden border ${idx === active ? 'ring-2 ring-blue-400' : 'border-slate-200'}`}
            >
              <PublicImage objectKey={img} alt={`Thumb ${idx + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
