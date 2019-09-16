const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    // where the file should be saved:
    destination: function (req, file, cb) {
        cb(null, './uploads');
    },
    // how the file should be named:
    filename: function (req, file, cb) {
        cb(null, (new Date().getTime()) + path.extname(file.originalname))
    },
});

const limits = {
    files: 1, // Allow only 1 file per request
    fileSize: 1024 * 1024 * 10, // 10 MB (max file size)
};

const fileFilter = (req, file, cb) => {
    // These are the file types that Jimp supports:
    if (/\.(jpg|jpeg|png|gif|bmp|tiff)$/.test(file.originalname))
        cb(null, true);
    else
        cb(new Error("Unsupported File Type"), false); // Ignores file, we can throw error.
}


const upload = multer({
    storage,
    limits,
    fileFilter
});

module.exports = upload