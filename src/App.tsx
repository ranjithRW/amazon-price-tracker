import { useState, useEffect } from 'react';
import { TrendingDown, RefreshCw, Package } from 'lucide-react';
import { AddProductForm } from './components/AddProductForm';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { getProducts, checkPrices } from './api';
import { Product } from './types';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getProducts();
      // Ensure we always have an array of products
      const productsArray = Array.isArray(data.products) ? data.products : [];
      setProducts(productsArray);
    } catch (error) {
      console.error('Failed to load products:', error);
      setProducts([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPrices = async () => {
    setChecking(true);
    try {
      await checkPrices();
      await loadProducts();
    } catch (error) {
      console.error('Failed to check prices:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <TrendingDown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Amazon Price Tracker
                </h1>
                <p className="text-gray-600 text-sm">
                  AI-powered price monitoring and alerts
                </p>
              </div>
            </div>

            <button
              onClick={handleCheckPrices}
              disabled={checking}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking...' : 'Check Prices Now'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AddProductForm onProductAdded={loadProducts} />

        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6" />
            Tracked Products ({products.length})
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No products tracked yet
            </h3>
            <p className="text-gray-500">
              Add your first Amazon product URL above to start tracking prices
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onClick={() => setSelectedProductId(product.id)}
              />
            ))}
          </div>
        )}
      </main>

      {selectedProductId && (
        <ProductModal
          productId={selectedProductId}
          onClose={() => setSelectedProductId(null)}
        />
      )}

      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600 text-sm">
            <p className="mb-2">
              Intelligent price tracking with AI predictions and instant alerts
            </p>
            <p className="text-xs text-gray-500">
              Prices checked periodically. Enable email alerts to never miss a deal.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
