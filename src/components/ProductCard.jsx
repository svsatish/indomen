import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { showToast } from './Toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
    const { addItem } = useCart();

    const handleAddToCart = () => {
        addItem(product, 1);
        showToast(`${product.name} added to cart!`, 'success');
    };

    // Helper function to get responsive image URLs
    const getImageUrl = (size = 'medium') => {
        // Check if product.image contains size variants
        if (product.imageSizes && product.imageSizes[size]) {
            return product.imageSizes[size];
        }
        // Fallback to single image or try to infer size variants
        if (typeof product.image === 'string') {
            // If it's a new optimized image (contains -medium, -large, etc.)
            if (product.image.includes('-medium') || product.image.includes('-large')) {
                return product.image.replace(/-medium|-large|-thumb|-original/, `-${size}`);
            }
            return product.image;
        }
        return product.image;
    };

    return (
        <div className="product-card animate-scale-in">
            <Link to={`/product/${product.id}`} className="product-image-link">
                <div className="product-image">
                    <img
                        src={getImageUrl('medium')}
                        alt={product.name}
                        loading="lazy"
                        decoding="async"
                    />
                    {product.stock < 5 && product.stock > 0 && (
                        <span className="badge badge-warning stock-badge">Low Stock</span>
                    )}
                    {product.stock === 0 && (
                        <span className="badge badge-error stock-badge">Out of Stock</span>
                    )}
                </div>
            </Link>

            <div className="product-info">
                <Link to={`/product/${product.id}`}>
                    <h3 className="product-name">{product.name}</h3>
                </Link>
                <p className="product-category">{product.category}</p>
                <p className="product-description">{product.description}</p>

                <div className="product-footer">
                    <div className="product-price">
                        <span className="price">${product.price.toFixed(2)}</span>
                        <span className="unit">/ {product.unit}</span>
                    </div>

                    <button
                        onClick={handleAddToCart}
                        disabled={product.stock === 0}
                        className="btn btn-primary btn-sm"
                    >
                        {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
