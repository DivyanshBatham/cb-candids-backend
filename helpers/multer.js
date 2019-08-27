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

const fileFilter = (req, file, cb) => {
    if (/\.(jpg|jpeg|png|gif)$/.test(file.originalname))
        cb(null, true);
    else
        cb(new Error("Unsupported File Type"), false); // Ignores file, we can throw error.
}

const upload = multer({
    storage: storage,
    fileSize: 1024 * 1024 * 5, // 5 MB
    fileFilter: fileFilter
});

module.exports = upload