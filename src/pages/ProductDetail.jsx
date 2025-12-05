import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { showToast } from '../components/Toast';
import './ProductDetail.css';

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addItem } = useCart();
    const [product, setProduct] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            const foundProduct = data.find(p => p.id === id);
            setProduct(foundProduct);
        } catch (error) {
            console.error('Error fetching product:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = () => {
        addItem(product, quantity);
        showToast(`${quantity}x ${product.name} added to cart!`, 'success');
    };

    if (loading) {
        return <div className="loading">Loading product...</div>;
    }

    if (!product) {
        return (
            <div className="product-detail-page">
                <div className="container container-narrow">
                    <div className="card text-center">
                        <h2>Product Not Found</h2>
                        <p>Sorry, we couldn't find the product you're looking for.</p>
                        <button onClick={() => navigate('/products')} className="btn btn-primary">
                            Back to Products
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="product-detail-page">
            <div className="container container-narrow">
                <button onClick={() => navigate(-1)} className="btn btn-ghost back-button">
                    ← Back
                </button>

                <div className="product-detail-card">
                    <div className="product-detail-image">
                        <img src={product.image} alt={product.name} />
                        {product.stock < 5 && product.stock > 0 && (
                            <span className="badge badge-warning stock-badge">Low Stock</span>
                        )}
                        {product.stock === 0 && (
                            <span className="badge badge-error stock-badge">Out of Stock</span>
                        )}
                    </div>

                    <div className="product-detail-info">
                        <div className="product-detail-category">{product.category}</div>
                        <h1 className="product-detail-name">{product.name}</h1>
                        <p className="product-detail-description">{product.description}</p>

                        <div className="product-detail-price">
                            <span className="price">${product.price.toFixed(2)}</span>
                            <span className="unit">/ {product.unit}</span>
                        </div>

                        <div className="product-detail-stock">
                            <strong>Stock:</strong> {product.stock} {product.unit}(s) available
                        </div>

                        <div className="product-detail-actions">
                            <div className="quantity-selector">
                                <label htmlFor="quantity">Quantity:</label>
                                <div className="quantity-controls">
                                    <button
                                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                        className="btn btn-sm btn-outline"
                                    >
                                        −
                                    </button>
                                    <input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        max={product.stock}
                                        value={quantity}
                                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                        className="quantity-input"
                                    />
                                    <button
                                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                                        className="btn btn-sm btn-outline"
                                        disabled={quantity >= product.stock}
                                    >
                                        +
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                                className="btn btn-primary btn-lg"
                                style={{ width: '100%' }}
                            >
                                {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetail;
