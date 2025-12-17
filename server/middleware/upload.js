import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../public/images/uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage to use memory storage (for Sharp processing)
const storage = multer.memoryStorage();

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
};

// Create multer upload instance
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit (increased for raw uploads)
    }
});

// Image optimization function
export const optimizeImage = async (buffer, filename, options = {}) => {
    const {
        width = 800,
        height = 800,
        quality = 85,
        fit = 'inside', // 'cover', 'contain', 'fill', 'inside', 'outside'
        format = 'webp'
    } = options;

    try {
        const ext = format === 'original' ? path.extname(filename) : `.${format}`;
        const nameWithoutExt = path.basename(filename, path.extname(filename));
        const outputFilename = `${nameWithoutExt}${ext}`;
        const outputPath = path.join(uploadsDir, outputFilename);

        let sharpInstance = sharp(buffer);

        // Get image metadata
        const metadata = await sharpInstance.metadata();

        // Resize image
        if (width || height) {
            sharpInstance = sharpInstance.resize(width, height, {
                fit: fit,
                withoutEnlargement: true, // Don't enlarge smaller images
                background: { r: 255, g: 255, b: 255, alpha: 1 } // White background for transparency
            });
        }

        // Apply format-specific optimizations
        switch (format) {
            case 'webp':
                sharpInstance = sharpInstance.webp({ quality });
                break;
            case 'jpeg':
            case 'jpg':
                sharpInstance = sharpInstance.jpeg({
                    quality,
                    progressive: true,
                    mozjpeg: true
                });
                break;
            case 'png':
                sharpInstance = sharpInstance.png({
                    quality,
                    compressionLevel: 9,
                    progressive: true
                });
                break;
            default:
                // Keep original format
                break;
        }

        // Save optimized image
        await sharpInstance.toFile(outputPath);

        return {
            filename: outputFilename,
            path: outputPath,
            url: `/images/uploads/${outputFilename}`,
            width: width || metadata.width,
            height: height || metadata.height
        };
    } catch (error) {
        console.error('Image optimization error:', error);
        throw error;
    }
};

// Generate multiple image sizes
export const generateImageSizes = async (buffer, originalFilename) => {
    const baseFilename = path.basename(originalFilename, path.extname(originalFilename));
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1E9);
    const uniqueFilename = `${baseFilename}-${timestamp}-${random}`;

    const sizes = {
        // Thumbnail for lists/grids
        thumbnail: await optimizeImage(buffer, `${uniqueFilename}-thumb`, {
            width: 300,
            height: 300,
            quality: 80,
            fit: 'cover', // Square thumbnails
            format: 'webp'
        }),

        // Medium for product cards
        medium: await optimizeImage(buffer, `${uniqueFilename}-medium`, {
            width: 600,
            height: 600,
            quality: 85,
            fit: 'inside', // Preserve aspect ratio
            format: 'webp'
        }),

        // Large for detail pages
        large: await optimizeImage(buffer, `${uniqueFilename}-large`, {
            width: 1200,
            height: 1200,
            quality: 90,
            fit: 'inside', // Preserve aspect ratio
            format: 'webp'
        }),

        // Original (optimized)
        original: await optimizeImage(buffer, `${uniqueFilename}-original`, {
            width: null, // Keep original dimensions
            height: null,
            quality: 90,
            fit: 'inside',
            format: 'webp'
        })
    };

    return sizes;
};

export default upload;

