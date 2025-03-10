import React, { useEffect, useRef, useState } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  height: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onEndReached?: () => void;
  endReachedThreshold?: number;
}

/**
 * Composant de liste virtualisée pour afficher efficacement de grandes listes
 */
export default function VirtualizedList<T>({
  items,
  height,
  itemHeight,
  renderItem,
  overscan = 5,
  className = '',
  onEndReached,
  endReachedThreshold = 0.8
}: VirtualizedListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [isEndReached, setIsEndReached] = useState(false);
  
  // Calculer les indices des éléments visibles
  const totalHeight = items.length * itemHeight;
  const visibleItemsCount = Math.ceil(height / itemHeight);
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + height) / itemHeight) + overscan
  );
  
  // Gérer le défilement
  const handleScroll = () => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
      
      // Vérifier si on a atteint la fin de la liste
      if (onEndReached && !isEndReached) {
        const scrollPosition = containerRef.current.scrollTop + containerRef.current.clientHeight;
        const threshold = totalHeight * endReachedThreshold;
        
        if (scrollPosition >= threshold) {
          setIsEndReached(true);
          onEndReached();
        }
      }
    }
  };
  
  // Réinitialiser l'état isEndReached lorsque les éléments changent
  useEffect(() => {
    setIsEndReached(false);
  }, [items.length]);
  
  // Éléments visibles à rendre
  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    visibleItems.push(
      React.createElement("div", {
        key: i,
        style: {
          position: 'absolute',
          top: i * itemHeight,
          height: itemHeight,
          left: 0,
          right: 0
        }
      }, renderItem(items[i], i))
    );
  }
  
  return React.createElement("div", {
    ref: containerRef,
    className: `virtualized-list-container ${className}`,
    style: {
      height,
      overflow: 'auto',
      position: 'relative'
    },
    onScroll: handleScroll
  }, React.createElement("div", {
    style: { height: totalHeight, position: 'relative' }
  }, visibleItems));
} 