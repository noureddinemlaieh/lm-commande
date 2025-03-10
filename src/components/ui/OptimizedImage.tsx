import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import React from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  loadingComponent?: React.ReactNode;
  onLoad?: () => void;
  onError?: () => void;
}

/**
 * Composant d'image optimisé avec chargement paresseux et fallback
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  fallbackSrc = '/images/placeholder.png',
  loadingComponent = React.createElement("div", { className: "image-loading-placeholder", style: { width, height } }),
  onLoad,
  onError,
  ...props
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imageSrc, setImageSrc] = useState(src);
  
  // Réinitialiser l'état lorsque la source change
  useEffect(() => {
    setIsLoading(true);
    setError(false);
    setImageSrc(src);
  }, [src]);
  
  // Gérer le chargement de l'image
  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };
  
  // Gérer les erreurs de chargement
  const handleError = () => {
    setIsLoading(false);
    setError(true);
    setImageSrc(fallbackSrc);
    onError?.();
  };
  
  // Utiliser l'API Intersection Observer pour le chargement paresseux
  useEffect(() => {
    if (!imgRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Précharger l'image lorsqu'elle est visible
            const img = new Image();
            img.src = src as string;
            observer.disconnect();
          }
        });
      },
      { rootMargin: '200px' } // Précharger lorsque l'image est à 200px de la zone visible
    );
    
    observer.observe(imgRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [src]);
  
  if (isLoading) {
    return React.createElement(React.Fragment, null, loadingComponent);
  }
  
  return React.createElement(Image, {
    ref: imgRef,
    src: imageSrc,
    alt,
    width,
    height,
    onLoadingComplete: handleLoad,
    onError: handleError,
    ...props
  });
} 