import { createContext, useContext, useState, useCallback, useRef } from 'react';

const CacheContext = createContext(null);

export const useCache = () => {
    const context = useContext(CacheContext);
    if (!context) {
        throw new Error('useCache must be used within CacheProvider');
    }
    return context;
};

export const CacheProvider = ({ children }) => {
    const [cache, setCache] = useState({});
    const cacheTimestamps = useRef({});

    // Default cache duration: 5 minutes
    const DEFAULT_TTL = 5 * 60 * 1000;

    const getCachedData = useCallback((key) => {
        const cached = cache[key];
        const timestamp = cacheTimestamps.current[key];

        if (!cached || !timestamp) return null;

        // Check if cache is still valid
        const now = Date.now();
        if (now - timestamp > DEFAULT_TTL) {
            // Cache expired
            return null;
        }

        return cached;
    }, [cache]);

    const setCachedData = useCallback((key, data, ttl = DEFAULT_TTL) => {
        setCache(prev => ({
            ...prev,
            [key]: data
        }));
        cacheTimestamps.current[key] = Date.now();
    }, []);

    const invalidateCache = useCallback((key) => {
        setCache(prev => {
            const newCache = { ...prev };
            delete newCache[key];
            return newCache;
        });
        delete cacheTimestamps.current[key];
    }, []);

    const clearCache = useCallback(() => {
        setCache({});
        cacheTimestamps.current = {};
    }, []);

    const value = {
        getCachedData,
        setCachedData,
        invalidateCache,
        clearCache
    };

    return (
        <CacheContext.Provider value={value}>
            {children}
        </CacheContext.Provider>
    );
};

