/* NOTE: This file should only contain the following:
- Error handling middleware for multer upload errors
*/

// Error handling middleware for multer errors
const handleUploadError = (err, req, res, next) => {
    if (err) {
        // Multer errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                error: 'File too large. Maximum file size is 5MB.',
                code: 'FILE_TOO_LARGE'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                error: 'Too many files. Only one image is allowed.',
                code: 'TOO_MANY_FILES'
            });
        }
        if (err.message && err.message.includes('Only image files')) {
            return res.status(400).json({ 
                error: 'Only image files are allowed (jpeg, jpg, png, gif, webp)',
                code: 'INVALID_FILE_TYPE'
            });
        }
        // Generic multer error
        return res.status(400).json({ 
            error: err.message || 'File upload error',
            code: 'UPLOAD_ERROR'
        });
    }
    next();
};

module.exports = handleUploadError;

