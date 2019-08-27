const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Post = require('../models/post');
const User = require('../models/user');
const jwtAuthCheck = require('../helpers/jwtAuthCheck');
const postsRouter = express.Router();
const commentsRouter = require('./comments');

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

// Fetch all Posts:
postsRouter.get("/", jwtAuthCheck, (req, res) => {
    Post.find()
        .populate({ path: 'author', model: User, select: ['username', 'email'] })
        .populate({ path: 'likes', model: User, select: 'username' })
        .populate({ path: 'taggedUsers', model: User, select: 'username' })
        .populate({ path: 'comments.author', model: User, select: 'username' })
        .populate({ path: 'comments.likes', model: User, select: 'username' })
        .then(posts => {
            console.log("Posts => ", posts);
            res.status(200).json({
                "success": true,
                // TODO: Change data reponse to direct data..
                "data": {
                    posts: posts,
                },
            });
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        })
});


// Create Post:
// TODO: Edit package.json to add "mkdir uploads" to the scripts
postsRouter.post("/", jwtAuthCheck, upload.single('imgSrc'), (req, res) => {
    const { title, description = "", taggedUsers = "[]" } = req.body;
    const errors = {};
    let taggedUsersArray;

    // Validation for empty data:
    if (!title)
        errors.title = "Title is required";
    if (!req.file)
        errors.file = "Image is required";
    try {
        taggedUsersArray = JSON.parse(taggedUsers.length === 0 ? "[]" : taggedUsers);
    } catch (err) {
        errors.taggedUsers = err.message
    };

    // Data is Invalid, respond immediately.
    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        res.status(422).json({
            "success": false,
            "errors": errors
        });
    } else {
        const newPost = new Post({
            _id: new mongoose.Types.ObjectId(),
            title: title,
            description: description,
            taggedUsers: taggedUsersArray,
            imgSrc: req.file.filename,
            author: req.userId,
            likes: [],
            comments: []
        })

        newPost.save().then(post => {
            res.status(201).json({
                "success": true,
                "data": {
                    post: post,
                },
            });
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        })
    }
});

// Fetch specific Post:
postsRouter.get("/:postId", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;

    Post.findById(postId)
        .populate({ path: 'author', model: User, select: ['username', 'email'] })
        .populate({ path: 'likes', model: User, select: 'username' })
        .populate({ path: 'taggedUsers', model: User, select: 'username' })
        .populate({ path: 'comments.author', model: User, select: 'username' })
        .populate({ path: 'comments.likes', model: User, select: 'username' })
        .then(post => {
            console.log(post);
            if (post)
                res.status(200).json({
                    "success": true,
                    "data": {
                        post: post,
                    },
                });
            else
                res.status(404).json({
                    "success": false,
                    "errors": "Post not Found"
                });
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        })
});


// Delete Post:
// TODO: Make sure only author can delete.
postsRouter.delete("/:postId", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;

    Post.findOneAndDelete({
        _id: postId,
        author: req.userId
    }).then(deletedPost => {
        if (deletedPost) {
            // Delete the uploaded image:
            fs.unlink("uploads/" + deletedPost.imgSrc, (err) => {
                if (err) {
                    console.log(err);
                    // Error deleting the file, so revert the document deletion:
                    // deletedPost.save().then(recoveredPost => console.log("recoveredPost ", recoveredPost))
                    // .catch(err => console.log(err));
                    // TODO: Make this atomic operation
                    // HELP: How should I handle this? 
                    // Post document is deleted but there was an error deleting the file.
                    // res.status(500).json({
                    //     "success": false,
                    //     "errors": err.message
                    // });
                } else {
                    console.log(deletedPost.imgSrc, ' was deleted');
                    // HELP: Should this be 204? "The server successfully processed the request, but is not returning any content"
                    // If we are using 204, then the body is ignored.
                    res.status(200).json({
                        "success": true,
                    });
                }
            });
        }
        else
            res.status(404).json({
                "success": false,
                "errors": "Post Not Found"
            });
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    })

});

// TODO: Make sure only author can edit.
// HELP NEEDED: Should I ask for all the parameters even if their values are not changed?
// HELP: Send all data or just updates?
postsRouter.patch("/:postId", jwtAuthCheck, upload.single('imgSrc'), (req, res) => {
    const { postId } = req.params;
    const { title, description, taggedUsers } = req.body;
    const changes = {}, errors = {};

    if (description !== undefined)
        changes.description = description;

    if (title !== undefined)
        if (title !== "")
            changes.title = title;
        else
            errors.title = "Title is required";

    if (req.file !== undefined)
        changes.imgSrc = req.file;

    if (taggedUsers !== undefined) {
        try {
            // changes.taggedUsers = JSON.parse(taggedUsers.length === 0 ? "[]" : taggedUsers);
            changes.taggedUsers = JSON.parse(taggedUsers);
        } catch (err) {
            errors.taggedUsers = err.message
        };
    }

    console.table({
        changes: !(Object.entries(changes).length === 0 && changes.constructor === Object),
        errors: !(Object.entries(errors).length === 0 && errors.constructor === Object)
    });

    if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
        // Data is Invalid, respond immediately.
        // HELP: Should I send the response after deleting the temporary file? (202 Accepted?)
        res.status(422).json({
            "success": false,
            "errors": errors,
        });

        // Errors found, no need to keep the file:
        if (req.file)
            fs.unlink(req.file.path, (err) => {
                if (err) console.log("Error deleting the file: ", err);
                console.log(req.file.path, ' was deleted');
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
                    })
                    // If new file was uploaded, delete the old one:
                    if (req.file)
                        fs.unlink("uploads/" + curPath, (err) => {
                            if (err)
                                console.log(err);
                            else
                                console.log(curPath, ' was deleted');
                        });

                }).catch(err => {
                    console.log(err)
                    res.status(500).json({
                        "success": false,
                        "errors": err.message
                    });
                });
            } else {
                res.status(404).json({
                    "success": false,
                    "errors": "Post Not Found"
                });
            }
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        });
    } else {
        // HELP: Should I just remove the body?
        res.status(304).json({
            "success": false,
            "errors": "No changes"
        });
    }

});


// Like a Post
// TODO: Add ability to reset.
postsRouter.post("/:postId/likes", jwtAuthCheck, (req, res) => {
    const { postId } = req.params;

    Post.findByIdAndUpdate(
        postId,
        { $addToSet: { likes: req.userId } },
        { new: true }
    ).then(post => {
        console.log("Liked Post => ", post);
        if (post)
            res.status(200).json({
                "success": true,
            });
        else
            res.status(404).json({
                "success": false,
                "errors": "Post Not Found"
            });
    }).catch(err => {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    })

});

postsRouter.use("/:postId/comments", commentsRouter);

module.exports = postsRouter;
