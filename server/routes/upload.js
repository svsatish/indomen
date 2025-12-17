import express from 'express';
import upload, { generateImageSizes } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Upload single image with optimization
router.post('/upload', requireAdmin, upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        console.log('📤 Processing image upload:', req.file.originalname);

        // Generate multiple optimized sizes
        const sizes = await generateImageSizes(req.file.buffer, req.file.originalname);

        console.log('✅ Image optimized and saved in multiple sizes');

        res.json({
            success: true,
            message: 'Image uploaded and optimized successfully',
            imageUrl: sizes.medium.url, // Use medium size as default
            sizes: {
                thumbnail: sizes.thumbnail.url,
                medium: sizes.medium.url,
                large: sizes.large.url,
                original: sizes.original.url
            },
            dimensions: {
                thumbnail: { width: sizes.thumbnail.width, height: sizes.thumbnail.height },
                medium: { width: sizes.medium.width, height: sizes.medium.height },
                large: { width: sizes.large.width, height: sizes.large.height },
                original: { width: sizes.original.width, height: sizes.original.height }
            }
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Failed to upload and optimize image' });
    }
});

// Upload multiple images
router.post('/upload-multiple', requireAdmin, upload.array('images', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const uploadedFiles = req.files.map(file => ({
            imageUrl: `/images/uploads/${file.filename}`,
            filename: file.filename,
            size: file.size,
            mimetype: file.mimetype
        }));

        console.log(`✅ ${req.files.length} images uploaded successfully`);

        res.json({
            success: true,
            message: `${req.files.length} images uploaded successfully`,
            files: uploadedFiles
        });
    } catch (error) {
        console.error('❌ Upload error:', error);
        res.status(500).json({ error: 'Failed to upload images' });
    }
});

// Get list of uploaded images
router.get('/list', requireAdmin, async (req, res) => {
    try {
        const uploadsDir = path.join(__dirname, '../../public/images/uploads');

        // Create directory if it doesn't exist
        try {
            await fs.access(uploadsDir);
        } catch {
            await fs.mkdir(uploadsDir, { recursive: true });
            return res.json({ images: [] });
        }

        const files = await fs.readdir(uploadsDir);
        const imageFiles = files.filter(file => {
            const ext = path.extname(file).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });

        const images = await Promise.all(imageFiles.map(async (filename) => {
            const filePath = path.join(uploadsDir, filename);
            const stats = await fs.stat(filePath);
            return {
                filename,
                imageUrl: `/images/uploads/${filename}`,
                size: stats.size,
                createdAt: stats.birthtime
            };
        }));

        // Sort by creation date (newest first)
        images.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ images });
    } catch (error) {
        console.error('❌ Error listing images:', error);
        res.status(500).json({ error: 'Failed to list images' });
    }
});

// Delete uploaded image
router.delete('/:filename', requireAdmin, async (req, res) => {
    try {
        const { filename } = req.params;

        // Validate filename (security check)
        if (filename.includes('..') || filename.includes('/')) {
            return res.status(400).json({ error: 'Invalid filename' });
        }

        const filePath = path.join(__dirname, '../../public/images/uploads', filename);

        // Check if file exists
        try {
            await fs.access(filePath);
        } catch {
            return res.status(404).json({ error: 'Image not found' });
        }

        // Delete the file
        await fs.unlink(filePath);

        console.log('🗑️  Image deleted:', filename);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('❌ Delete error:', error);
        res.status(500).json({ error: 'Failed to delete image' });
    }
});

export default router;

