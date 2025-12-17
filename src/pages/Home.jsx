import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCache } from '../context/CacheContext';
import ProductCard from '../components/ProductCard';
import './Home.css';

const Home = () => {
    const { user, isKiosk } = useAuth();
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [notices, setNotices] = useState([]);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const { getCachedData, setCachedData } = useCache();

    useEffect(() => {
        if (user && !isKiosk()) {
            fetchData();
        } else {
            setLoading(false);
            setInitialLoad(false);
        }
    }, [user]);

    const fetchData = async () => {
        const cacheKey = 'home_data';

        // Check cache first
        const cachedData = getCachedData(cacheKey);
        if (cachedData) {
            setFeaturedProducts(cachedData.products);
            setNotices(cachedData.notices);
            setInitialLoad(false);
            return;
        }

        setLoading(true);
        try {
            const [productsRes, noticesRes] = await Promise.all([
                fetch('/api/products'),
                fetch('/api/admin/notices')
            ]);

            const products = await productsRes.json();
            const noticesData = await noticesRes.json();

            const featured = products.filter(p => p.featured).slice(0, 6);
            setFeaturedProducts(featured);
            setNotices(noticesData);

            // Cache the results
            setCachedData(cacheKey, {
                products: featured,
                notices: noticesData
            });
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
            setInitialLoad(false);
        }
    };

    const categories = [
        { name: 'Dairy', emoji: '🥛', path: '/products?category=dairy', color: 'hsl(200, 70%, 95%)' },
        { name: 'Eggs', emoji: '🥚', path: '/products?category=eggs', color: 'hsl(40, 80%, 95%)' },
        { name: 'Juices', emoji: '🧃', path: '/products?category=juices', color: 'hsl(30, 90%, 95%)' },
        { name: 'Bread', emoji: '🍞', path: '/products?category=bread', color: 'hsl(35, 70%, 95%)' },
        { name: 'Vegetables', emoji: '🥬', path: '/products?category=vegetables', color: 'hsl(120, 60%, 95%)' },
        { name: 'Fruits', emoji: '🍎', path: '/products?category=fruits', color: 'hsl(0, 80%, 95%)' },
        { name: 'Misc', emoji: '📦', path: '/products?category=misc', color: 'hsl(280, 60%, 95%)' }
    ];

    // Only show loading on initial load
    if (initialLoad && loading) {
        return <div className="loading">Loading...</div>;
    }

    // Show login prompt for non-authenticated users
    if (!user) {
        return (
            <div className="home">
                <section className="hero">
                    <div className="container">
                        <div className="hero-content animate-fade-in">
                            <h1 className="hero-title">Fresh from the Farm to Your Table</h1>
                            <p className="hero-subtitle">
                                Premium dairy, vegetables, and fresh food sourced weekly from local Menonite and Amish farms.
                                Experience the taste of authentic, farm-fresh quality.
                            </p>
                            <div className="hero-actions">
                                <Link to="/login" className="btn btn-primary btn-lg">
                                    Login to Shop
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="about-section">
                    <div className="container">
                        <div className="about-content">
                            <h2>Our Story</h2>
                            <p>
                                We partner with local Menonite and Amish farmers to bring you the freshest,
                                highest-quality dairy, produce, and baked goods. Every week, we source directly
                                from farms that practice traditional, sustainable farming methods.
                            </p>
                            <p>
                                Our commitment is to provide you with products that are not only delicious but
                                also support local farming communities and sustainable agriculture.
                            </p>
                            <div className="text-center mt-xl">
                                <Link to="/login" className="btn btn-secondary btn-lg">
                                    Login to View Products
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Kiosk users should be redirected
    if (isKiosk()) {
        return (
            <div className="home">
                <section className="hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1 className="hero-title">Kiosk Mode</h1>
                            <p className="hero-subtitle">
                                Please use the Kiosk Dashboard to manage pickup orders.
                            </p>
                            <div className="hero-actions">
                                <Link to="/kiosk" className="btn btn-primary btn-lg">
                                    Go to Kiosk Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        );
    }

    // Authenticated customer/admin view
    return (
        <div className="home">
            {/* Hero Section */}
            <section className="hero">
                <div className="container">
                    <div className="hero-content animate-fade-in">
                        <h1 className="hero-title">Fresh from the Farm to Your Table</h1>
                        <p className="hero-subtitle">
                            Premium dairy, vegetables, and fresh food sourced weekly from local Menonite and Amish farms.
                            Experience the taste of authentic, farm-fresh quality.
                        </p>
                        <div className="hero-actions">
                            <Link to="/products" className="btn btn-primary btn-lg">
                                Shop Now
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Notices */}
            {notices.length > 0 && (
                <section className="notices-section">
                    <div className="container">
                        {notices.map(notice => (
                            <div key={notice.id} className={`alert alert-${notice.type || 'info'}`}>
                                <strong>{notice.title}</strong> - {notice.message}
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Categories */}
            <section className="categories-section">
                <div className="container">
                    <h2 className="section-title">Shop by Category</h2>
                    <div className="categories-grid">
                        {categories.map((category, index) => (
                            <Link
                                key={category.name}
                                to={category.path}
                                className={`category-card ${category.colorClass} animate-scale-in`}
                                style={{
                                    animationDelay: `${index * 0.1}s`
                                }}
                            >
                                <span className="category-emoji">{category.emoji}</span>
                                <h3 className="category-name">{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="featured-section">
                <div className="container">
                    <h2 className="section-title">Featured Products</h2>
                    <div className="products-grid">
                        {featuredProducts.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                    <div className="text-center mt-xl">
                        <Link to="/products" className="btn btn-primary btn-lg">
                            View All Products
                        </Link>
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="about-section">
                <div className="container">
                    <div className="about-content">
                        <h2>Our Story</h2>
                        <p>
                            We partner with local Menonite and Amish farmers to bring you the freshest,
                            highest-quality dairy, produce, and baked goods. Every week, we source directly
                            from farms that practice traditional, sustainable farming methods.
                        </p>
                        <p>
                            Our commitment is to provide you with products that are not only delicious but
                            also support local farming communities and sustainable agriculture.
                        </p>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Home;
