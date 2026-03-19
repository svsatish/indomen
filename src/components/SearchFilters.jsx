import { useState, useEffect } from 'react';
import './SearchFilters.css';

const SearchFilters = ({ onFilterChange, onSearch }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [category, setCategory] = useState('all');
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [inStock, setInStock] = useState(false);
    const [featured, setFeatured] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const [sortOrder, setSortOrder] = useState('asc');
    const [filterOptions, setFilterOptions] = useState(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchFilterOptions();
    }, []);

    const fetchFilterOptions = async () => {
        try {
            const response = await fetch('/api/search/filters');
            const data = await response.json();
            setFilterOptions(data);
        } catch (error) {
            console.error('Error fetching filter options:', error);
        }
    };

    const handleSearch = (e) => {
        e?.preventDefault();
        applyFilters();
    };

    const applyFilters = () => {
        const filters = {
            q: searchQuery,
            category: category === 'all' ? undefined : category,
            minPrice: minPrice || undefined,
            maxPrice: maxPrice || undefined,
            inStock: inStock ? 'true' : undefined,
            featured: featured ? 'true' : undefined,
            sortBy,
            sortOrder
        };

        if (onFilterChange) {
            onFilterChange(filters);
        }

        if (onSearch) {
            onSearch(filters);
        }
    };

    const resetFilters = () => {
        setSearchQuery('');
        setCategory('all');
        setMinPrice('');
        setMaxPrice('');
        setInStock(false);
        setFeatured(false);
        setSortBy('name');
        setSortOrder('asc');

        if (onFilterChange) {
            onFilterChange({
                sortBy: 'name',
                sortOrder: 'asc'
            });
        }
    };

    useEffect(() => {
        applyFilters();
    }, [category, inStock, featured, sortBy, sortOrder]);

    return (
        <div className="search-filters-container">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="search-bar">
                <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                />
                <button type="submit" className="search-btn">
                    🔍 Search
                </button>
                <button
                    type="button"
                    className="filter-toggle-btn"
                    onClick={() => setShowFilters(!showFilters)}
                >
                    {showFilters ? '✕ Hide Filters' : '⚙️ Filters'}
                </button>
            </form>

            {/* Filters Panel */}
            {showFilters && (
                <div className="filters-panel">
                    <div className="filters-grid">
                        {/* Category Filter */}
                        <div className="filter-group">
                            <label className="filter-label">Category</label>
                            <select
                                value={category}
                                onChange={(e) => setCategory(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">All Categories</option>
                                {filterOptions?.categories.map((cat) => (
                                    <option key={cat.value} value={cat.value}>
                                        {cat.label} ({cat.count})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Price Range */}
                        <div className="filter-group">
                            <label className="filter-label">Price Range</label>
                            <div className="price-range">
                                <input
                                    type="number"
                                    placeholder={`Min ($${filterOptions?.priceRange.min || 0})`}
                                    value={minPrice}
                                    onChange={(e) => setMinPrice(e.target.value)}
                                    className="price-input"
                                    min="0"
                                    step="0.01"
                                />
                                <span className="price-separator">—</span>
                                <input
                                    type="number"
                                    placeholder={`Max ($${filterOptions?.priceRange.max || 100})`}
                                    value={maxPrice}
                                    onChange={(e) => setMaxPrice(e.target.value)}
                                    className="price-input"
                                    min="0"
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* Sort Options */}
                        <div className="filter-group">
                            <label className="filter-label">Sort By</label>
                            <div className="sort-controls">
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="filter-select"
                                >
                                    <option value="name">Name</option>
                                    <option value="price">Price</option>
                                    <option value="stock">Stock</option>
                                </select>
                                <button
                                    type="button"
                                    className="sort-order-btn"
                                    onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                    title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}
                                >
                                    {sortOrder === 'asc' ? '⬆️' : '⬇️'}
                                </button>
                            </div>
                        </div>

                        {/* Checkboxes */}
                        <div className="filter-group filter-checkboxes">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={inStock}
                                    onChange={(e) => setInStock(e.target.checked)}
                                />
                                <span>In Stock Only ({filterOptions?.inStockCount || 0})</span>
                            </label>
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={featured}
                                    onChange={(e) => setFeatured(e.target.checked)}
                                />
                                <span>Featured Only ({filterOptions?.featuredCount || 0})</span>
                            </label>
                        </div>
                    </div>

                    {/* Filter Actions */}
                    <div className="filter-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={resetFilters}
                        >
                            Reset Filters
                        </button>
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={applyFilters}
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchFilters;

