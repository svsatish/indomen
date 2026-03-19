import { useState } from 'react';
import './ImageUpload.css';

const ImageUpload = ({ currentImage, onImageSelect, onImageUpload }) => {
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState(currentImage || '');
    const [error, setError] = useState('');
    const [uploadedImages, setUploadedImages] = useState([]);
    const [showGallery, setShowGallery] = useState(false);

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setError('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Image size must be less than 5MB');
            return;
        }

        setError('');

        // Show preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setPreview(reader.result);
        };
        reader.readAsDataURL(file);

        // Upload to server
        await uploadImage(file);
    };

    const uploadImage = async (file) => {
        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('image', file);

        try {
            const response = await fetch('/api/upload/upload', {
                method: 'POST',
                credentials: 'include',
                body: formData
            });

            if (!response.ok) {
                throw new Error('Upload failed');
            }

            const data = await response.json();

            if (onImageUpload) {
                onImageUpload(data.imageUrl);
            }

            setPreview(data.imageUrl);
            console.log('✅ Image uploaded:', data.imageUrl);
        } catch (err) {
            console.error('Upload error:', err);
            setError('Failed to upload image. Please try again.');
            setPreview(currentImage || '');
        } finally {
            setUploading(false);
        }
    };

    const loadUploadedImages = async () => {
        try {
            const response = await fetch('/api/upload/list', {
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to load images');

            const data = await response.json();
            setUploadedImages(data.images || []);
            setShowGallery(true);
        } catch (err) {
            console.error('Error loading images:', err);
            setError('Failed to load image gallery');
        }
    };

    const selectFromGallery = (imageUrl) => {
        setPreview(imageUrl);
        if (onImageSelect) {
            onImageSelect(imageUrl);
        }
        if (onImageUpload) {
            onImageUpload(imageUrl);
        }
        setShowGallery(false);
    };

    const deleteImage = async (filename) => {
        if (!confirm('Are you sure you want to delete this image?')) return;

        try {
            const response = await fetch(`/api/upload/${filename}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to delete image');

            // Reload gallery
            await loadUploadedImages();
        } catch (err) {
            console.error('Delete error:', err);
            setError('Failed to delete image');
        }
    };

    return (
        <div className="image-upload-container">
            <div className="image-preview-section">
                {preview ? (
                    <div className="image-preview">
                        <img src={preview} alt="Preview" />
                        <button
                            type="button"
                            className="remove-image-btn"
                            onClick={() => {
                                setPreview('');
                                if (onImageUpload) onImageUpload('');
                            }}
                        >
                            ✕
                        </button>
                    </div>
                ) : (
                    <div className="image-placeholder">
                        <span>📷</span>
                        <p>No image selected</p>
                    </div>
                )}
            </div>

            <div className="upload-actions">
                <label className="upload-btn">
                    {uploading ? (
                        <>
                            <span className="spinner"></span>
                            Uploading...
                        </>
                    ) : (
                        <>
                            📤 Upload New Image
                        </>
                    )}
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        disabled={uploading}
                        style={{ display: 'none' }}
                    />
                </label>

                <button
                    type="button"
                    className="gallery-btn"
                    onClick={loadUploadedImages}
                    disabled={uploading}
                >
                    🖼️ Choose from Gallery
                </button>
            </div>

            {error && (
                <div className="upload-error">
                    ⚠️ {error}
                </div>
            )}

            {showGallery && (
                <div className="image-gallery-modal">
                    <div className="gallery-content">
                        <div className="gallery-header">
                            <h3>Image Gallery</h3>
                            <button
                                className="close-gallery-btn"
                                onClick={() => setShowGallery(false)}
                            >
                                ✕
                            </button>
                        </div>

                        <div className="gallery-grid">
                            {uploadedImages.length === 0 ? (
                                <p className="no-images">No images uploaded yet</p>
                            ) : (
                                uploadedImages.map((img) => (
                                    <div key={img.filename} className="gallery-item">
                                        <img
                                            src={img.imageUrl}
                                            alt={img.filename}
                                            onClick={() => selectFromGallery(img.imageUrl)}
                                        />
                                        <div className="gallery-item-actions">
                                            <button
                                                className="select-btn"
                                                onClick={() => selectFromGallery(img.imageUrl)}
                                            >
                                                ✓ Select
                                            </button>
                                            <button
                                                className="delete-btn"
                                                onClick={() => deleteImage(img.filename)}
                                            >
                                                🗑️ Delete
                                            </button>
                                        </div>
                                        <div className="image-info">
                                            <small>{(img.size / 1024).toFixed(1)} KB</small>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;

