import React, { useEffect, useRef } from 'react';
import { ICONS } from './iconData';
import type { IconData } from './iconData';

export interface InteractiveIconBackgroundProps {
  icons?: IconData[];
  maxDistance?: number;
  minDistance?: number;
  baseOpacity?: number;
  activeOpacity?: number;
  showLabels?: boolean;
  className?: string;
  disabled?: boolean;
  networkPaths?: React.ReactNode;
}

const DEFAULT_NETWORK_PATHS = (
  <>
    <path d="M 12% 15% Q 22% 25% 35% 10% T 50% 8% T 65% 12% T 78% 22% T 92% 18%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,12" />
    <path d="M 8% 35% Q 20% 45% 35% 50% T 65% 50% T 82% 40% T 95% 38%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,12" />
    <path d="M 10% 55% Q 25% 65% 35% 92% T 50% 88% T 65% 90% T 80% 78% T 90% 55%" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4,12" />
  </>
);

export function InteractiveIconBackground({
  icons = ICONS,
  maxDistance = 200,
  minDistance = 50,
  baseOpacity = 0.15,
  activeOpacity = 0.90,
  showLabels = true,
  className = '',
  disabled = false,
  networkPaths = DEFAULT_NETWORK_PATHS,
}: InteractiveIconBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const labelRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (prefersReducedMotion || isTouchDevice || disabled) return;

    let animationFrameId: number;
    let mouseX = -1000; // start off-screen
    let mouseY = -1000;
    let targetX = -1000;
    let targetY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const handleMouseLeave = () => {
      targetX = -1000;
      targetY = -1000;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    const animate = () => {
      mouseX += (targetX - mouseX) * 0.15;
      mouseY += (targetY - mouseY) * 0.15;

      iconRefs.current.forEach((el, index) => {
        if (!el) return;
        const labelEl = labelRefs.current[index];
        
        const rect = el.getBoundingClientRect();
        const iconX = rect.left + rect.width / 2;
        const iconY = rect.top + rect.height / 2;
        
        const dx = mouseX - iconX;
        const dy = mouseY - iconY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        let factor = 0;
        if (distance < maxDistance) {
          factor = 1 - ((distance - minDistance) / (maxDistance - minDistance));
          factor = Math.max(0, Math.min(1, factor));
        }

        const targetOpacity = baseOpacity + ((activeOpacity - baseOpacity) * factor);
        const targetScale = 1 + (0.15 * factor);
        
        el.style.opacity = targetOpacity.toString();
        el.style.transform = `translate(-50%, -50%) scale(${targetScale})`;
        el.style.filter = `grayscale(${100 - (factor * 100)}%)`;

        if (labelEl && showLabels) {
          const labelOpacity = factor > 0.3 ? (factor - 0.3) / 0.7 : 0;
          labelEl.style.opacity = labelOpacity.toString();
          labelEl.style.transform = `translateY(${10 * (1 - labelOpacity)}px)`;
        }
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [baseOpacity, activeOpacity, maxDistance, minDistance, disabled, showLabels]);

  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none z-0 select-none ${className}`}
      aria-hidden="true"
    >
      <svg className="absolute w-full h-full opacity-[0.03] dark:opacity-[0.05]" xmlns="http://www.w3.org/2000/svg">
        {networkPaths}
      </svg>

      {icons.map((iconData, index) => (
        <div
          key={`${iconData.id}-${index}`}
          className="absolute"
          style={{ 
            left: `${iconData.x}%`, 
            top: `${iconData.y}%`,
          }}
        >
          <div 
            ref={el => { iconRefs.current[index] = el; }}
            className="flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 grayscale transition-none"
            style={{ 
              opacity: baseOpacity,
              willChange: 'opacity, transform, filter' 
            }}
          >
            <div className={`p-3 rounded-md bg-surface border border-border ${iconData.color}`}>
              <iconData.icon className="w-6 h-6 md:w-7 md:h-7" />
            </div>
            {showLabels && (
              <span 
                ref={el => { labelRefs.current[index] = el; }}
                className="absolute top-full mt-2 text-xs font-bold tracking-tight px-3 py-1 rounded-md bg-surface border border-border text-foreground opacity-0 whitespace-nowrap"
                style={{ willChange: 'opacity, transform' }}
              >
                {iconData.label}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
