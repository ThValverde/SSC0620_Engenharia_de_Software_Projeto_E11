import React, { useState, useRef, useEffect } from 'react';
import { Info } from 'lucide-react';

interface HelpTooltipProps {
  text: string;
  maxWidth?: number;
  side?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
}

/**
 * Ícone flutuante de ajuda (tooltip).
 * Ele calcula a própria posição dinamicamente para não ser cortado pelas bordas da tela.
 */
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
