import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SearchFilters from '../components/SearchFilters';
import { useCache } from '../context/CacheContext';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false); // Changed to false
    const [initialLoad, setInitialLoad] = useState(true);
    const [resultsCount, setResultsCount] = useState(0);
    const [searchParams] = useSearchParams();
    const { getCachedData, setCachedData } = useCache();

    const category = searchParams.get('category');

    useEffect(() => {
        const initialFilters = category ? { category } : {};
        fetchProducts(initialFilters);
    }, [category]);

    const fetchProducts = async (filters = {}) => {
        // Generate cache key
        const cacheKey = `products_${JSON.stringify(filters)}`;

        // Check cache first
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            setProducts(cachedData.products);
            setResultsCount(cachedData.count);
            setInitialLoad(false);
            return;
        }

        setLoading(true);
        try {
            // Build query string
            const queryParams = new URLSearchParams();
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== '') {
                    queryParams.append(key, value);
                }
            });

            const response = await fetch(`/api/search/search?${queryParams}`);
            const data = await response.json();

            if (data.success) {
                setProducts(data.products);
                setResultsCount(data.count);

                // Cache the results
                setCachedData(cacheKey, {
                    products: data.products,
                    count: data.count
                });
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const handleSearch = (filters) => {
        fetchProducts(filters);
    };

    // Only show full-page loading on initial load
    if (initialLoad && loading) {
        return <div className="loading">Loading products...</div>;
    }

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-header">
                    <h1>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}</h1>
                    <p className="text-secondary">Fresh, quality products delivered weekly</p>
                </div>

                <SearchFilters onSearch={handleSearch} />

                {/* Show inline loading indicator for subsequent loads */}
                {loading && !initialLoad && (
                    <div className="inline-loading">
                        <div className="loading-spinner"></div>
                        <span>Updating results...</span>
                    </div>
                )}

                <div className="results-info">
                    <p>
                        Showing <strong>{resultsCount}</strong> product{resultsCount !== 1 ? 's' : ''}
                    </p>
                </div>

                {products.length === 0 ? (
                    <div className="no-products">
                        <p>No products found matching your criteria.</p>
                        <p className="text-secondary">Try adjusting your filters or search query.</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;
