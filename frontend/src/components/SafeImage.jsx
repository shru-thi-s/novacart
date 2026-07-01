import { useState } from 'react';
import { ImageOff } from 'lucide-react';

export default function SafeImage({ src, alt, className, ...props }) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className={`flex flex-col items-center justify-center bg-primary-light/20 text-gray-400 ${className}`}>
        <ImageOff className="w-8 h-8 mb-2 opacity-50" />
        <span className="text-xs font-medium uppercase tracking-wider opacity-70">No Image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      {...props}
    />
  );
}
