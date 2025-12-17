import { useState, useEffect } from 'react';
import ImageUpload from '../../components/ImageUpload';
import './ProductManagement.css';

const ProductManagement = () => {
    const [products, setProducts] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'dairy',
        price: '',
        unit: '',
        description: '',
        stock: '',
        image: '',
        featured: false
    });

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        try {
            const response = await fetch('/api/products');
            const data = await response.json();
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingProduct
                ? `/api/products/${editingProduct.id}`
                : '/api/products';

            const method = editingProduct ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                    stock: parseInt(formData.stock)
                })
            });

            if (response.ok) {
                fetchProducts();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving product:', error);
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData(product);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;

        try {
            await fetch(`/api/products/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            fetchProducts();
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    const toggleOutOfStock = async (product) => {
        try {
            const newStock = product.stock === 0 ? 10 : 0;
            await fetch(`/api/products/${product.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ ...product, stock: newStock })
            });
            fetchProducts();
        } catch (error) {
            console.error('Error toggling stock:', error);
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            category: 'dairy',
            price: '',
            unit: '',
            description: '',
            stock: '',
            image: '',
            featured: false
        });
        setEditingProduct(null);
        setShowForm(false);
    };

    return (
        <div className="product-management">
            <div className="container">
                <div className="page-header">
                    <h1>Product Management</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        {showForm ? 'Cancel' : '+ Add Product'}
                    </button>
                </div>

                {showForm && (
                    <div className="product-form card">
                        <h2>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label className="form-label">Product Name</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Category</label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="form-select"
                                        required
                                    >
                                        <option value="dairy">Dairy</option>
                                        <option value="eggs">Eggs</option>
                                        <option value="juices">Juices</option>
                                        <option value="bread">Bread</option>
                                        <option value="vegetables">Vegetables</option>
                                        <option value="fruits">Fruits</option>
                                        <option value="misc">Miscellaneous</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Price</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Unit</label>
                                    <input
                                        type="text"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        className="form-input"
                                        placeholder="e.g., gallon, lb, dozen"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label className="form-label">Stock</label>
                                    <input
                                        type="number"
                                        value={formData.stock}
                                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                                        className="form-input"
                                        required
                                    />
                                </div>

                                <div className="form-group full-width">
                                    <label className="form-label">Product Image</label>
                                    <ImageUpload
                                        currentImage={formData.image}
                                        onImageUpload={(imageUrl) => setFormData({ ...formData, image: imageUrl })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="form-textarea"
                                    rows="3"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={formData.featured}
                                        onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                                    />
                                    <span>Featured Product</span>
                                </label>
                            </div>

                            <div className="form-actions">
                                <button type="button" onClick={resetForm} className="btn btn-outline">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Update Product' : 'Add Product'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                <div className="products-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Featured</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map(product => (
                                <tr key={product.id}>
                                    <td>
                                        <div className="product-cell">
                                            <img src={product.image} alt={product.name} />
                                            <span>{product.name}</span>
                                        </div>
                                    </td>
                                    <td className="capitalize">{product.category}</td>
                                    <td>${product.price.toFixed(2)} / {product.unit}</td>
                                    <td>
                                        <span className={`badge ${product.stock < 5 ? 'badge-warning' : 'badge-success'}`}>
                                            {product.stock}
                                        </span>
                                    </td>
                                    <td>{product.featured ? '⭐' : '-'}</td>
                                    <td>
                                        <div className="action-buttons">
                                            <button
                                                onClick={() => toggleOutOfStock(product)}
                                                className="btn btn-sm btn-ghost"
                                                title={product.stock === 0 ? 'Mark In Stock' : 'Mark Out of Stock'}
                                            >
                                                {product.stock === 0 ? '✅' : '🚫'}
                                            </button>
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="btn btn-sm btn-ghost"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ProductManagement;
