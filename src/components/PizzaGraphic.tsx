import React, { useMemo } from 'react';
import { PIZZA_RECIPES } from '../utils/pizzaNames';

interface PizzaGraphicProps {
  percentage: number;
  recipeId?: string;
  isBaking?: boolean;
  interactive?: boolean;
  onSliceClick?: (index: number) => void;
  size?: number;
}

export const PizzaGraphic: React.FC<PizzaGraphicProps> = ({
  percentage,
  recipeId = 'pepperoni-classic',
  isBaking = false,
  interactive = false,
  onSliceClick,
  size = 320,
}) => {
  const recipe = useMemo(() => {
    return PIZZA_RECIPES.find((r) => r.id === recipeId) || PIZZA_RECIPES[0];
  }, [recipeId]);

  // 8 slices total
  const totalSlices = 8;
  const activeSlicesCount = Math.floor((percentage / 100) * totalSlices);
  const partialSliceRatio = ((percentage / 100) * totalSlices) % 1;

  // Generate SVG path for slice 'i' (0 to 7)
  const getSlicePath = (i: number, isExtracted = false) => {
    const cx = 160;
    const cy = 160;
    const r = 140;
    const angleStart = (i * 45 - 90) * (Math.PI / 180);
    const angleEnd = ((i + 1) * 45 - 90) * (Math.PI / 180);

    // If slice is slightly pulled out on hover
    const midAngle = ((i + 0.5) * 45 - 90) * (Math.PI / 180);
    const offsetX = isExtracted ? Math.cos(midAngle) * 12 : 0;
    const offsetY = isExtracted ? Math.sin(midAngle) * 12 : 0;

    const x0 = cx + offsetX;
    const y0 = cy + offsetY;
    const x1 = cx + offsetX + r * Math.cos(angleStart);
    const y1 = cy + offsetY + r * Math.sin(angleStart);
    const x2 = cx + offsetX + r * Math.cos(angleEnd);
    const y2 = cy + offsetY + r * Math.sin(angleEnd);

    return `M ${x0} ${y0} L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
  };

  // Crust arc path
  const getCrustPath = (i: number, isExtracted = false) => {
    const cx = 160;
    const cy = 160;
    const rOuter = 144;
    const rInner = 126;
    const angleStart = (i * 45 - 90) * (Math.PI / 180);
    const angleEnd = ((i + 1) * 45 - 90) * (Math.PI / 180);

    const midAngle = ((i + 0.5) * 45 - 90) * (Math.PI / 180);
    const offsetX = isExtracted ? Math.cos(midAngle) * 12 : 0;
    const offsetY = isExtracted ? Math.sin(midAngle) * 12 : 0;

    const x1 = cx + offsetX + rInner * Math.cos(angleStart);
    const y1 = cy + offsetY + rInner * Math.sin(angleStart);
    const x2 = cx + offsetX + rOuter * Math.cos(angleStart);
    const y2 = cy + offsetY + rOuter * Math.sin(angleStart);
    const x3 = cx + offsetX + rOuter * Math.cos(angleEnd);
    const y3 = cy + offsetY + rOuter * Math.sin(angleEnd);
    const x4 = cx + offsetX + rInner * Math.cos(angleEnd);
    const y4 = cy + offsetY + rInner * Math.sin(angleEnd);

    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;
  };

  // Topping positions for each slice
  const getSliceToppings = (sliceIndex: number) => {
    const midAngle = ((sliceIndex + 0.5) * 45 - 90) * (Math.PI / 180);
    const cx = 160;
    const cy = 160;

    // 2-3 positions per slice
    return [
      {
        x: cx + 65 * Math.cos(midAngle - 0.16),
        y: cy + 65 * Math.sin(midAngle - 0.16),
        rot: sliceIndex * 45,
        type: recipe.toppings[0] || 'pepperoni',
      },
      {
        x: cx + 100 * Math.cos(midAngle + 0.12),
        y: cy + 100 * Math.sin(midAngle + 0.12),
        rot: sliceIndex * 45 + 30,
        type: recipe.toppings[1] || 'basil',
      },
      {
        x: cx + 90 * Math.cos(midAngle - 0.15),
        y: cy + 90 * Math.sin(midAngle - 0.15),
        rot: sliceIndex * 45 - 20,
        type: recipe.toppings[2] || (recipe.toppings[0] === 'pepperoni' ? 'olive' : 'mushroom'),
      },
    ];
  };

  return (
    <div className="relative inline-flex flex-col items-center justify-center select-none" style={{ width: size, height: size }}>
      {/* Warm oven ambient glow when cooking */}
      {isBaking && (
        <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-2xl animate-warm-glow -z-10" />
      )}

      {/* Steam particles if baking or freshly done */}
      {(isBaking || percentage >= 100) && (
        <div className="absolute -top-12 flex justify-center gap-6 pointer-events-none opacity-80 z-20">
          <div className="w-2 h-14 bg-gradient-to-t from-stone-400/40 via-stone-300/30 to-transparent rounded-full blur-[2px] animate-steam-1" />
          <div className="w-2.5 h-16 bg-gradient-to-t from-amber-400/40 via-stone-300/30 to-transparent rounded-full blur-[2px] animate-steam-2" />
          <div className="w-2 h-12 bg-gradient-to-t from-stone-400/40 via-stone-300/30 to-transparent rounded-full blur-[2px] animate-steam-3" />
        </div>
      )}

      {/* Main SVG Pizza Canvas */}
      <svg
        viewBox="0 0 320 320"
        className="w-full h-full drop-shadow-xl transition-transform duration-300 hover:scale-[1.02]"
      >
        <defs>
          {/* Pizza Pan Shadow & Rim */}
          <radialGradient id="panGrad" cx="50%" cy="50%" r="50%">
            <stop offset="85%" stopColor="#292524" />
            <stop offset="94%" stopColor="#44403C" />
            <stop offset="100%" stopColor="#1C1917" />
          </radialGradient>

          {/* Golden Crust Gradient */}
          <linearGradient id="crustGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#D97706" />
            <stop offset="50%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#B45309" />
          </linearGradient>

          {/* Raw Dough Gradient */}
          <linearGradient id="rawDoughGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#CBD5E1" />
          </linearGradient>

          {/* Melted Cheese & Marinara Gradient */}
          <radialGradient id="cheeseGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="70%" stopColor="#FDE047" />
            <stop offset="92%" stopColor="#F59E0B" />
            <stop offset="100%" stopColor="#DC2626" />
          </radialGradient>

          {/* Pepperoni Gradient */}
          <radialGradient id="pepGrad" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="70%" stopColor="#B91C1C" />
            <stop offset="100%" stopColor="#7F1D1D" />
          </radialGradient>
        </defs>

        {/* 1. Baking Pan */}
        <circle cx="160" cy="160" r="156" fill="url(#panGrad)" stroke="#57534E" strokeWidth="2.5" />
        <circle cx="160" cy="160" r="148" fill="none" stroke="#44403C" strokeWidth="1" strokeDasharray="4 3" opacity="0.6" />

        {/* 2. 8 Slices */}
        {Array.from({ length: totalSlices }).map((_, i) => {
          const isCooked = i < activeSlicesCount;
          const isCurrentlyCooking = i === activeSlicesCount && percentage < 100;

          // Slice color based on progress
          const sliceFill = isCooked
            ? 'url(#cheeseGrad)'
            : isCurrentlyCooking
            ? '#FDE68A'
            : '#F1F5F9';

          const crustFill = isCooked ? 'url(#crustGrad)' : '#E2E8F0';
          const sliceOpacity = isCooked ? 1 : isCurrentlyCooking ? 0.6 + partialSliceRatio * 0.4 : 0.35;

          return (
            <g
              key={i}
              className={`transition-all duration-300 ${interactive ? 'cursor-pointer group' : ''}`}
              onClick={() => onSliceClick?.(i)}
              opacity={sliceOpacity}
            >
              {/* Cheese Base */}
              <path
                d={getSlicePath(i)}
                fill={sliceFill}
                stroke="#D97706"
                strokeWidth="1.2"
                strokeLinejoin="round"
                className="transition-colors duration-500"
              />

              {/* Crust Rim */}
              <path
                d={getCrustPath(i)}
                fill={crustFill}
                stroke="#92400E"
                strokeWidth="1"
                className="transition-colors duration-500"
              />

              {/* Crust Char Marks */}
              {isCooked && (
                <circle
                  cx={160 + 134 * Math.cos(((i + 0.3) * 45 - 90) * (Math.PI / 180))}
                  cy={160 + 134 * Math.sin(((i + 0.3) * 45 - 90) * (Math.PI / 180))}
                  r="2.5"
                  fill="#78350F"
                  opacity="0.7"
                />
              )}

              {/* Slice Toppings */}
              {(isCooked || isCurrentlyCooking) &&
                getSliceToppings(i).map((top, tIdx) => {
                  if (top.type === 'pepperoni') {
                    return (
                      <g key={tIdx} transform={`translate(${top.x}, ${top.y}) rotate(${top.rot})`}>
                        <circle cx="0" cy="0" r="10" fill="url(#pepGrad)" stroke="#991B1B" strokeWidth="1" />
                        <circle cx="-3" cy="-2" r="1.5" fill="#FCA5A5" opacity="0.6" />
                        <circle cx="2" cy="3" r="1.2" fill="#7F1D1D" />
                      </g>
                    );
                  }
                  if (top.type === 'mushroom') {
                    return (
                      <g key={tIdx} transform={`translate(${top.x}, ${top.y}) rotate(${top.rot})`}>
                        <path
                          d="M -6 0 A 6 6 0 0 1 6 0 Z M -2 0 L -2 5 L 2 5 L 2 0 Z"
                          fill="#78716C"
                          stroke="#44403C"
                          strokeWidth="0.8"
                        />
                      </g>
                    );
                  }
                  if (top.type === 'olive') {
                    return (
                      <g key={tIdx} transform={`translate(${top.x}, ${top.y})`}>
                        <circle cx="0" cy="0" r="5" fill="#1C1917" stroke="#0C0A09" strokeWidth="1" />
                        <circle cx="0" cy="0" r="2.2" fill="#FEF08A" />
                      </g>
                    );
                  }
                  if (top.type === 'basil') {
                    return (
                      <g key={tIdx} transform={`translate(${top.x}, ${top.y}) rotate(${top.rot})`}>
                        <path
                          d="M 0 -8 C 5 -4, 6 4, 0 8 C -6 4, -5 -4, 0 -8 Z"
                          fill="#16A34A"
                          stroke="#14532D"
                          strokeWidth="0.8"
                        />
                        <path d="M 0 -6 L 0 6" stroke="#86EFAC" strokeWidth="0.5" />
                      </g>
                    );
                  }
                  if (top.type === 'pepper') {
                    return (
                      <g key={tIdx} transform={`translate(${top.x}, ${top.y}) rotate(${top.rot})`}>
                        <path
                          d="M -7 -2 C -4 -7, 4 -7, 7 -2 C 5 2, -5 2, -7 -2 Z"
                          fill="#EA580C"
                          stroke="#9A3412"
                          strokeWidth="0.8"
                        />
                      </g>
                    );
                  }
                  return null;
                })}
            </g>
          );
        })}

        {/* 3. Slice divider cuts */}
        {Array.from({ length: 4 }).map((_, i) => {
          const angle = i * 45 * (Math.PI / 180);
          const x1 = 160 + 142 * Math.cos(angle);
          const y1 = 160 + 142 * Math.sin(angle);
          const x2 = 160 - 142 * Math.cos(angle);
          const y2 = 160 - 142 * Math.sin(angle);
          return (
            <line
              key={i}
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke="#78350F"
              strokeWidth="1.2"
              strokeDasharray="2 1"
              opacity="0.4"
            />
          );
        })}

        {/* 4. Center Pizza Hub Badge */}
        <circle cx="160" cy="160" r="32" fill="#1C1917" stroke="#D97706" strokeWidth="2.5" />
        <circle cx="160" cy="160" r="28" fill="#292524" />

        {/* Center Progress or Pizza Icon */}
        <text
          x="160"
          y={percentage > 0 && percentage < 100 ? '157' : '165'}
          textAnchor="middle"
          fill="#FEF08A"
          fontSize={percentage > 0 && percentage < 100 ? '14' : '22'}
          fontWeight="bold"
          fontFamily="var(--font-mono)"
          className="tabular-nums"
        >
          {percentage >= 100 ? '🍕' : percentage > 0 ? `${percentage}%` : '🍕'}
        </text>

        {percentage > 0 && percentage < 100 && (
          <text
            x="160"
            y="172"
            textAnchor="middle"
            fill="#F59E0B"
            fontSize="8"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            BAKED
          </text>
        )}
      </svg>

      {/* Oven Thermostat Status Indicator */}
      <div className="mt-3 flex items-center gap-2 text-xs font-mono text-stone-600 dark:text-stone-400">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
        <span>
          {isBaking
            ? `Oven 485°F · Baking Slice ${Math.min(8, activeSlicesCount + 1)}/8`
            : percentage >= 100
            ? 'Fresh out of the Oven! Hot & Ready'
            : 'Oven Preheated · 485°F'}
        </span>
      </div>
    </div>
  );
};
