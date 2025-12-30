import { useState } from 'react';
import { Plus } from 'lucide-react';
import { addProduct } from '../api';

interface AddProductFormProps {
  onProductAdded: () => void;
}

export function AddProductForm({ onProductAdded }: AddProductFormProps) {
  const [url, setUrl] = useState('');
  const [email, setEmail] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [usePrediction, setUsePrediction] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const data = await addProduct({
        url,
        userEmail: email || undefined,
        targetPrice: targetPrice && !usePrediction ? parseFloat(targetPrice) : undefined,
      });

      setSuccess(`Product added: ${data.product.title}`);
      setUrl('');
      setEmail('');
      setTargetPrice('');
      setUsePrediction(false);
      onProductAdded();
    } catch (err: any) {
      setError(err.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Plus className="w-6 h-6" />
        Track New Product
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amazon Product URL *
          </label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/dp/B08..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email for Alerts (Optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={usePrediction}
              onChange={(e) => setUsePrediction(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Use AI Price Prediction</span>
          </label>
        </div>

        {!usePrediction && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Target Price (Optional)
            </label>
            <input
              type="number"
              step="0.01"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              placeholder="99.99"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Adding Product...
            </>
          ) : (
            <>
              <Plus className="w-5 h-5" />
              Track This Product
            </>
          )}
        </button>
      </form>
    </div>
  );
}
