const express = require('express');
const mongoose = require('mongoose');
const { User, Post } = require('../models');
const { jwtAuthCheck } = require('./middlewares');
const searchRouter = express.Router();

// Fetch all Posts:
searchRouter.get("/taggedUsers", jwtAuthCheck, async (req, res) => {

    try {
        const { query = '' } = req.query;
        const users = await User.find(
            { username: { $regex: new RegExp(`${query}`, 'i') } },
            null,
            {
                sort: {
                    username: 'asc' // Alphabetically
                },
                limit: 2
            })
            .collation({ locale: "en" });

        const posts = await Post.find(
            // These doesn't work:
            // { 'taggedUsers.username': { $regex: new RegExp(`${query}`, 'i') } },
            // { 'taggedUsers.username': 'dixit' },
            // This work:
            { taggedUsers: users.map(user => user.id) },
            null,
            {
                // sort: {
                //     username: 'asc' // Alphabetically
                // },
                limit: 2
            })
            .populate({ path: 'author', model: User, select: ['username', 'imgSrc'] })
            .populate({ path: 'likes', model: User, select: ['username', 'imgSrc'] })
            .populate({ path: 'taggedUsers', model: User, select: ['username', 'imgSrc'] })
            .populate({ path: 'comments.author', model: User, select: ['username', 'imgSrc'] })
            .populate({ path: 'comments.likes', model: User, select: ['username', 'imgSrc'] })
            .lean();

        console.log(posts);
        
        res.status(200).json({
            "success": true,
            "data": {
                users,
                posts: posts.map(post => {
                    return {
                        ...post,
                        comments: post.comments.map(comment => ({
                            ...comment,
                            isAuthor: comment.author._id.toString() === req.userId
                        })),
                        isLiked: post.likes.findIndex(like => like._id.toString() === req.userId) !== -1
                    }
                }),
            }
        })
    } catch (err) {
        console.log(err)
        res.status(500).json({
            "success": false,
            "errors": err.message
        });
    }
});

module.exports = searchRouter;