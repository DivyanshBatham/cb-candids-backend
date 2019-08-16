const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

// Fetch all the Posts:
router.get("/", jwtAuthCheck, (req, res) => {
    Post.find()
        .populate({ path: 'author', model: User, select: ['username', 'email'] })
        .populate({ path: 'likes', model: User, select: 'username' })
        .populate({ path: 'taggedUsers', model: User, select: 'username' })
        .populate({ path: 'comments.author', model: User, select: 'username' })
        .populate({ path: 'comments.likes', model: User, select: 'username' })
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

// Create a new Post:
router.post("/", jwtAuthCheck, upload.single('img'), (req, res) => {
    const { title, description = null, taggedUsers = "[]" } = req.body;
    const errors = {};

    // Validation for empty data:
    if (title === undefined)
        errors.title = "Title cannot be Empty";
    if (req.file === undefined)
        errors.file = "Image is required";

    // Data is Invalid, respond immediately.
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(200).json({
            "success": false,
            "errors": errors
        });
    } else {
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
    }
});


// Delete a Post:
router.delete("/:postId", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;
    // TODO: Delete the image
    Post.findOneAndDelete({
        _id: postId,
        author: req.userId
    }).then(post => {
        console.log("Deleted Post => ", post);
        if (post)
            res.status(200).json({
                "success": true,
            });
        else
            res.status(200).json({
                "success": false,
                "errors": ["Unable to delete Post, id and author.id mismatch"]
            });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Unable to delete Post"]
        });
    })

});

// TODO: Edit a Post: 
router.patch("/:postId", jwtAuthCheck, upload.single('img'), (req, res) => {
    const { postId } = req.params;
    const { title, description, taggedUsers } = req.body;
    const changes = {}, errors = {};

    if (title !== undefined) {
        if (title === "")
            errors.title = "Title cannot be Empty";
        else
            changes.title = title;
    }
    if (description !== undefined)
        changes.description = description;
    if (taggedUsers)
        changes.taggedUsers = JSON.parse(taggedUsers);
    if (req.file)
        changes.imgSrc = req.file.filename;

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        res.status(200).json({
            "success": false,
            "errors": errors,
        });

        // Errors found, no need to keep the file:
        if (req.file)
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error deleting the file: ", err);
                console.log(curPath, ' was deleted');
            });

    } else if (!(Object.entries(changes).length === 0 && changes.constructor === Object)) {
        // Changes found, update the post:
        Post.findById(postId).then(curPost => {
            if (curPost) {
                const curPath = curPost.imgSrc;
                Object.assign(curPost, changes);
                curPost.save().then(updatedPost => {
                    console.log("Updated Post =>", updatedPost);
                    res.status(200).json({
                        "success": true,
                        "data": {
                            post: curPost
                        }
                    });
                    // If new file was uploaded, delete the old one:
                    if (req.file)
                        fs.unlink("uploads/" + curPath, (err) => {
                            if (err) throw err;
                            console.log(curPath, ' was deleted');
                        });
                });
            } else {
                res.status(200).json({
                    "success": false,
                    "errors": ["No such post found"]
                });
            }
        })

    } else {
        res.status(200).json({
            "success": false,
            "errors": ["No changes"]
        });
    }

});


// Like a Post
router.post("/:postId/likes", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;

    Post.findByIdAndUpdate(postId, {
        $addToSet: {
            likes: req.userId
        }
    }).then(post => {
        console.log("Liked Post => ", post);
        if (post)
            res.status(200).json({
                "success": true,
            });
        else
            res.status(200).json({
                "success": false,
                "errors": ["Unable to like Post"]
            });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Unable to like Post"]
        });
    })

});

// Comment a Post
router.post("/:postId/comments", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;
    const { comment } = req.body;

    Post.findByIdAndUpdate(postId, {
        $push: {
            comments: {
                comment: comment,
                author: req.userId,
                likes: [],
            }
        }
    }).then(post => {
        console.log("Commented on Post => ", post);
        if (post)
            res.status(200).json({
                "success": true,
            });
        else
            res.status(200).json({
                "success": false,
                "errors": ["Cannot find the post"]
            });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Unable to comment on Post"]
        });
    })

});

// Like a comment
router.post("/:postId/comments/:commentId", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
        for (let comment of post.comments) {
            if (comment.id === commentId) {
                if (!comment.likes.includes(req.userId)) {
                    comment.likes.push(req.userId);
                }
                break;
            }
        }
        post.save().then(likedPost => {
            res.json(likedPost);
        }).catch(err => console.log(err));
    }).catch(err => console.log(err));

});

// Delete a comment
router.delete("/:postId/comments/:commentId", jwtAuthCheck, (req, res) => {
    const { postId, commentId } = req.params;

    Post.findById(postId).then(post => {
        post.comments = post.comments.filter(comment => comment.id !== commentId);
        post.save().then(post => {
            res.status(200).json({
                "success": true,
            });
        }).catch(err => {
            console.log(err)
            res.status(200).json({
                "success": false,
                "errors": ["Unable to delete Comment"]
            });
        });
    }).catch(err => {
        console.log(err)
        res.status(200).json({
            "success": false,
            "errors": ["Unable to delete Comment"]
        });
    });

});


module.exports = router;
