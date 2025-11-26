const asyncHandler = require("express-async-handler");

// Helper function to get base URL
const getBaseUrl = (req) => {
    return `${req.protocol}://${req.get('host')}/v1`;
};

// Upload Single File
const uploadSingle = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            code: 1,
            message: "No file uploaded"
        });
    }

    const baseUrl = getBaseUrl(req);
    const fullFileUrl = `${baseUrl}/uploads/${req.file.filename}`;

    return res.json({
        code: 0,
        message: "File uploaded successfully",
        file: req.file,
        fileUrl: fullFileUrl
    });
});

// Upload Multiple Files
const uploadMultiple = asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            code: 1,
            message: "No files uploaded"
        });
    }

    const baseUrl = getBaseUrl(req);
    const fileUrls = req.files.map(f => `${baseUrl}/uploads/${f.filename}`);

    return res.json({
        code: 0,
        message: "Files uploaded successfully",
        files: req.files,
        fileUrls: fileUrls
    });
});

module.exports = { uploadSingle, uploadMultiple };