const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');
const User = require('../models/user');
const jwtAuthCheck = require('../middlewares/jwtAuthCheck');
const router = express.Router();

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

router.get("/", jwtAuthCheck, (req, res) => {
    Post.find()
        .populate({ path: 'author', model: User, select: ['username', 'email'] })
        .populate({ path: 'likes', model: User, select: 'username' })
        .populate({ path: 'taggedUsers', model: User, select: 'username' })
        .populate({ path: 'comments.author', model: User, select: 'username' })
        .then(posts => {
            console.log("Posts => ", posts);
            if (posts)
                res.status(200).json({
                    "success": true,
                    "data": {
                        posts: posts,
                    },
                });
            else
                res.status(200).json({
                    "success": false,
                    "errors": ["Unable to fetch Posts"]
                });
        }).catch(err => {
            console.log(err)
            res.status(200).json({
                "success": false,
                "errors": ["Unable to fetch Posts"]
            });
        })
});

router.post("/", jwtAuthCheck, upload.single('img'), (req, res) => {
    const { title, description = null, taggedUsers = "[]" } = req.body;
    const errors = {};

    // Validation for empty data:
    if (title === undefined)
        errors.title = "Title is required";
    if (req.file === undefined)
        errors.file = "Image is required";

    // Data is Invalid, respond immediately.
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(200).json({
            "success": false,
            "errors": errors
        });
    }

    const post = new Post({
        _id: new mongoose.Types.ObjectId(),
        title: title,
        description: description,
        taggedUsers: JSON.parse(taggedUsers),
        imgSrc: req.file.filename,
        author: req.userId,
        likes: [],
        comments: []
    })

    post.save().then(post => {
        if (post) {
            res.status(200).json({
                "success": true,
                "data": post
            });
        } else
            res.status(200).json({
                "success": false,
                "errors": ["Unable to create Post"]
            });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Unable to create Post"]
        });
    })

});

module.exports = router;
