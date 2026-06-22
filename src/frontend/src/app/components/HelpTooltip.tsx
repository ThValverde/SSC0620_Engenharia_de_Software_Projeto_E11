import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  maxWidth?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

export function HelpTooltip({ text, maxWidth = 240, side = 'top', delay = 200 }: HelpTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isVisible || !iconRef.current || !tooltipRef.current) return;

    const calculatePosition = () => {
      const iconRect = iconRef.current!.getBoundingClientRect();
      const tooltipRect = tooltipRef.current!.getBoundingClientRect();
      const gap = 8;

      let top = 0;
      let left = 0;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      switch (side) {
        case 'top':
          top = iconRect.top - tooltipRect.height - gap;
          left = iconRect.left + iconRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'bottom':
          top = iconRect.bottom + gap;
          left = iconRect.left + iconRect.width / 2 - tooltipRect.width / 2;
          break;
        case 'left':
          top = iconRect.top + iconRect.height / 2 - tooltipRect.height / 2;
          left = iconRect.left - tooltipRect.width - gap;
          break;
        case 'right':
          top = iconRect.top + iconRect.height / 2 - tooltipRect.height / 2;
          left = iconRect.right + gap;
          break;
      }

      // Adjust for viewport overflow
      if (left < 8) {
        left = 8;
      } else if (left + tooltipRect.width > viewportWidth - 8) {
        left = viewportWidth - tooltipRect.width - 8;
      }

      if (top < 8) {
        top = 8;
      } else if (top + tooltipRect.height > viewportHeight - 8) {
        top = viewportHeight - tooltipRect.height - 8;
      }

      setPosition({ top: Math.round(top), left: Math.round(left) });
    };

    calculatePosition();
    window.addEventListener('scroll', calculatePosition);
    window.addEventListener('resize', calculatePosition);

    return () => {
      window.removeEventListener('scroll', calculatePosition);
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isVisible, side]);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  return (
    <div className="relative inline-flex">
      <div
        ref={iconRef}
        className="cursor-help"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleMouseEnter}
        onBlur={handleMouseLeave}
        tabIndex={0}
      >
        <Info size={16} className="text-blue-500 hover:text-blue-600 transition-colors" />
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          className="fixed z-50 px-3 py-2 text-xs font-medium text-white bg-gray-900 rounded-lg shadow-lg pointer-events-none whitespace-normal"
          style={{
            maxWidth: `${maxWidth}px`,
            top: `${position.top}px`,
            left: `${position.left}px`,
          }}
          role="tooltip"
        >
          {text}
          <div
            className="absolute w-2 h-2 bg-gray-900 transform rotate-45"
            style={{
              bottom:
                side === 'top'
                  ? '-4px'
                  : side === 'bottom'
                    ? 'auto'
                    : side === 'left'
                      ? '50% -4px'
                      : 'auto',
              top:
                side === 'bottom'
                  ? '-4px'
                  : side === 'top'
                    ? 'auto'
                    : side === 'right'
                      ? '50%'
                      : 'auto',
              left: side === 'left' ? 'auto' : side === 'right' ? '-4px' : '50%',
              right:
                side === 'right'
                  ? 'auto'
                  : side === 'left'
                    ? '-4px'
                    : side === 'top' || side === 'bottom'
                      ? 'auto'
                      : '50%',
              transform: 'translate(-50%, -50%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

interface InlineHelpProps {
  label: string;
  tooltip: string;
  htmlFor?: string;
}

export function LabelWithHelp({ label, tooltip, htmlFor }: InlineHelpProps) {
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
        {label}
      </label>
      <HelpTooltip text={tooltip} />
    </div>
  );
}
