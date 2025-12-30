import { ExternalLink, TrendingDown, TrendingUp, Bell, Clock } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick: () => void;
}

export function ProductCard({ product, onClick }: ProductCardProps) {
  const hasActiveAlert = product.alerts && product.alerts.some(a => a.is_active);
  const targetPrice = product.alerts?.[0]?.target_price || product.alerts?.[0]?.predicted_price;

  const getPriceStatus = () => {
    if (!product.current_price || !targetPrice) return null;

    if (product.current_price <= targetPrice) {
      return { text: 'Target Reached!', icon: TrendingDown, color: 'text-green-600', bg: 'bg-green-50' };
    }
    return { text: 'Monitoring', icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' };
  };

  const status = getPriceStatus();
  const lastChecked = product.last_checked_at
    ? new Date(product.last_checked_at).toLocaleString()
    : 'Never';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
    >
      <div className="p-6">
        <div className="flex gap-4">
          {product.image_url && (
            <img
              src={product.image_url}
              alt={product.title}
              className="w-24 h-24 object-contain rounded-lg flex-shrink-0"
            />
          )}

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">
              {product.title}
            </h3>

            <div className="flex items-baseline gap-3 mb-3">
              <span className="text-2xl font-bold text-gray-900">
                ${product.current_price?.toFixed(2) || 'N/A'}
              </span>
              {targetPrice && (
                <span className="text-sm text-gray-500">
                  Target: ${targetPrice.toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {status && (
                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                  <status.icon className="w-3 h-3" />
                  {status.text}
                </span>
              )}

              {hasActiveAlert && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
                  <Bell className="w-3 h-3" />
                  Alert Active
                </span>
              )}

              {!product.is_active && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  Paused
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {lastChecked}
          </span>
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium"
          >
            View on Amazon
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
