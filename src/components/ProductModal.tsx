import { useEffect, useState } from 'react';
import { X, ExternalLink, Mail, Target } from 'lucide-react';
import { getProductDetails } from '../api';
import { ProductWithHistory } from '../types';
import { PriceChart } from './PriceChart';

interface ProductModalProps {
  productId: string;
  onClose: () => void;
}

export function ProductModal({ productId, onClose }: ProductModalProps) {
  const [data, setData] = useState<ProductWithHistory | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProductDetails();
  }, [productId]);

  const loadProductDetails = async () => {
    try {
      const result = await getProductDetails(productId);
      setData(result);
    } catch (error) {
      console.error('Failed to load product details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <div 
          className="bg-white rounded-lg p-8"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { product, priceHistory, alerts } = data;
  const activeAlert = alerts.find(a => a.is_active);

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg max-w-4xl w-full my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200 flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              {product.title}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span>ASIN: {product.asin}</span>
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700"
              >
                View on Amazon
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="flex items-start gap-6">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.title}
                className="w-32 h-32 object-contain rounded-lg flex-shrink-0"
              />
            )}

            <div className="flex-1 space-y-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">Current Price</div>
                <div className="text-4xl font-bold text-gray-900">
                  ${product.current_price?.toFixed(2) || 'N/A'}
                </div>
              </div>

              {activeAlert && (
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <Target className="w-5 h-5" />
                    Active Alert
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-gray-600">Target Price</div>
                      <div className="font-semibold text-gray-900">
                        ${activeAlert.target_price?.toFixed(2) || 'AI Predicted'}
                      </div>
                    </div>
                    {activeAlert.predicted_price && (
                      <div>
                        <div className="text-gray-600">AI Prediction</div>
                        <div className="font-semibold text-gray-900">
                          ${activeAlert.predicted_price.toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4" />
                    {activeAlert.user_email}
                  </div>

                  {activeAlert.notified_at && (
                    <div className="text-xs text-green-600">
                      Last notified: {new Date(activeAlert.notified_at).toLocaleString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <PriceChart
            priceHistory={priceHistory}
            targetPrice={activeAlert?.target_price || activeAlert?.predicted_price}
          />

          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-gray-800 mb-2">Price History Summary</h4>
            <div className="text-sm text-gray-600 space-y-1">
              <div>Total checks: {priceHistory.length}</div>
              <div>
                First tracked: {new Date(product.created_at).toLocaleDateString()}
              </div>
              {product.last_checked_at && (
                <div>
                  Last checked: {new Date(product.last_checked_at).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
