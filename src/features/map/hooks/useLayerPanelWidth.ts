import { useEffect, useRef, useState } from 'react';

type ActiveTab = 'layers' | 'tools' | 'admin' | 'ai';

interface UseLayerPanelWidthProps {
  initialWidth?: number;
  activeTab: ActiveTab;
  onWidthChange?: (width: number) => void;
  minWidth?: number;
  maxMargin?: number;
  aiMinWidth?: number;
}

export default function useLayerPanelWidth({
  initialWidth = 288,
  activeTab,
  onWidthChange,
  minWidth = 200,
  maxMargin = 200,
  aiMinWidth = 240,
}: UseLayerPanelWidthProps) {
  const [width, setWidthState] = useState<number>(initialWidth);
  const [isResizing, setIsResizing] = useState(false);

  const startXRef = useRef<number>(0);
  const startWidthRef = useRef<number>(0);
  const prevWidthRef = useRef<number | null>(null);

  useEffect(() => {
    setWidthState(initialWidth);
  }, [initialWidth]);

  const handleMouseDownResize = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = width;
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startXRef.current - e.clientX;
      const newWidth = Math.max(
        minWidth,
        Math.min(window.innerWidth - maxMargin, startWidthRef.current + deltaX)
      );
      setWidthState(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      onWidthChange?.(width);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
     
  }, [isResizing, width, minWidth, maxMargin, onWidthChange]);

  useEffect(() => {
    if (isResizing) return;

    if (activeTab === 'ai') {
      prevWidthRef.current = width;
      const target = Math.max(aiMinWidth, Math.floor(window.innerWidth / 3));
      setWidthState(target);
      onWidthChange?.(target);
    } else {
      if (prevWidthRef.current != null) {
        const restore = prevWidthRef.current;
        setWidthState(restore);
        onWidthChange?.(restore);
        prevWidthRef.current = null;
      } else {
        const defaultWidth = initialWidth;
        if (width !== defaultWidth) {
          setWidthState(defaultWidth);
          onWidthChange?.(defaultWidth);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const setWidth = (w: number) => {
    setWidthState(w);
    onWidthChange?.(w);
  };

  return { width, isResizing, handleMouseDownResize, setWidth } as const;
}
