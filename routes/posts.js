const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Post = require('../models/post');
const User = require('../models/user');
const jwtAuthCheck = require('../middlewares/jwtAuthCheck');

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

router.post("/", jwtAuthCheck, (req, res) => {

    const { title, description, taggedUsers, imgSrc } = req.body;

    const post = new Post({
        _id: new mongoose.Types.ObjectId(),
        title: title,
        description: description,
        taggedUsers: taggedUsers,
        imgSrc: imgSrc,
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
