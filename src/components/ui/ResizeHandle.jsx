import { useCallback, useEffect, useRef } from 'react';

/**
 * 可拖拽的分隔线，用于调整相邻面板宽度
 * direction: 'vertical'（左右拖）| 'horizontal'（上下拖，暂未用到）
 */
export default function ResizeHandle({ onResize, direction = 'vertical' }) {
  const dragging = useRef(false);
  const startX = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    dragging.current = true;
    startX.current = e.clientX;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, []);

  useEffect(() => {
    function handleMouseMove(e) {
      if (!dragging.current) return;
      const delta = e.clientX - startX.current;
      startX.current = e.clientX;
      onResize(delta);
    }

    function handleMouseUp() {
      if (!dragging.current) return;
      dragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [onResize]);

  return (
    <div
      onMouseDown={handleMouseDown}
      className="shrink-0 w-1 cursor-col-resize group relative hover:bg-accent/20 transition-colors"
      title="拖拽调整宽度"
    >
      {/* 增大可点击区域 */}
      <div className="absolute inset-y-0 -left-1 -right-1" />
      {/* 视觉指示线 */}
      <div className="absolute inset-y-0 left-0 w-px bg-border group-hover:bg-accent/40 transition-colors" />
    </div>
  );
}
