import { PriceHistory } from '../types';

interface PriceChartProps {
  priceHistory: PriceHistory[];
  targetPrice?: number | null;
  currentPrice?: number | null;
}

export function PriceChart({ priceHistory, targetPrice, currentPrice }: PriceChartProps) {
  if (!priceHistory || priceHistory.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
        No price history available yet
      </div>
    );
  }

  const prices = priceHistory.map(p => parseFloat(p.price.toString()));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  // Use currentPrice if provided, otherwise use the last price in history
  const displayCurrentPrice = currentPrice ?? prices[prices.length - 1];
  const priceRange = maxPrice - minPrice || 1;

  const width = 800;
  const height = 300;
  const padding = 40;
  const chartWidth = width - padding * 2;
  const chartHeight = height - padding * 2;

  const points = priceHistory.map((item, index) => {
    const x = padding + (index / (priceHistory.length - 1 || 1)) * chartWidth;
    const y = padding + ((maxPrice - parseFloat(item.price.toString())) / priceRange) * chartHeight;
    return { x, y, price: parseFloat(item.price.toString()), date: item.checked_at };
  });

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  let targetY;
  if (targetPrice && targetPrice >= minPrice && targetPrice <= maxPrice) {
    targetY = padding + ((maxPrice - targetPrice) / priceRange) * chartHeight;
  }

  return (
    <div className="bg-white rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Price History</h3>

      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="priceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
          </linearGradient>
        </defs>

        <rect
          x={padding}
          y={padding}
          width={chartWidth}
          height={chartHeight}
          fill="#f9fafb"
          stroke="#e5e7eb"
          strokeWidth="1"
        />

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = padding + ratio * chartHeight;
          const price = maxPrice - ratio * priceRange;
          return (
            <g key={ratio}>
              <line
                x1={padding}
                y1={y}
                x2={width - padding}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="4"
              />
              <text
                x={padding - 10}
                y={y + 5}
                textAnchor="end"
                fontSize="12"
                fill="#6b7280"
              >
                ${price.toFixed(2)}
              </text>
            </g>
          );
        })}

        {targetY && (
          <g>
            <line
              x1={padding}
              y1={targetY}
              x2={width - padding}
              y2={targetY}
              stroke="#10b981"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
            <text
              x={width - padding + 5}
              y={targetY + 5}
              fontSize="12"
              fill="#10b981"
              fontWeight="bold"
            >
              Target
            </text>
          </g>
        )}

        <path
          d={pathD}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d={`${pathD} L ${points[points.length - 1].x} ${padding + chartHeight} L ${padding} ${padding + chartHeight} Z`}
          fill="url(#priceGradient)"
        />

        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r="5"
              fill="#3b82f6"
              stroke="white"
              strokeWidth="2"
            />
            <title>
              ${point.price.toFixed(2)} on {new Date(point.date).toLocaleDateString()}
            </title>
          </g>
        ))}
      </svg>

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Current</div>
          <div className="text-lg font-bold text-blue-600">
            ${displayCurrentPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Lowest</div>
          <div className="text-lg font-bold text-green-600">
            ${minPrice.toFixed(2)}
          </div>
        </div>
        <div className="bg-white rounded-lg p-3 border border-gray-200">
          <div className="text-sm text-gray-600">Highest</div>
          <div className="text-lg font-bold text-gray-900">
            ${maxPrice.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
