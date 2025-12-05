import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import './Products.css';

const Products = () => {
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchParams] = useSearchParams();

    const category = searchParams.get('category');

    useEffect(() => {
        fetchProducts();
    }, []);

    useEffect(() => {
        if (category) {
            setFilteredProducts(products.filter(p => p.category === category));
        } else {
            setFilteredProducts(products);
        }
    }, [category, products]);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
            setFilteredProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['dairy', 'eggs', 'juices', 'bread', 'vegetables', 'fruits', 'misc'];

    if (loading) {
        return <div className="loading">Loading products...</div>;
    }

    return (
        <div className="products-page">
            <div className="container">
                <div className="products-header">
                    <h1>{category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Products'}</h1>
                    <p className="text-secondary">Fresh, quality products delivered weekly</p>
                </div>

                {!category && (
                    <div className="products-filters">
                        <a
                            href="/products"
                            className={`filter-btn ${!category ? 'active' : ''}`}
                        >
                            All
                        </a>
                        {categories.map(cat => (
                            <a
                                key={cat}
                                href={`/products?category=${cat}`}
                                className={`filter-btn ${category === cat ? 'active' : ''}`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </a>
                        ))}
                    </div>
                )}

                {filteredProducts.length === 0 ? (
                    <div className="no-products">
                        <p>No products found in this category.</p>
                    </div>
                ) : (
                    <div className="products-grid">
                        {filteredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Products;
