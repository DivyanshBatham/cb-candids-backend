const express = require('express');
const userRouter = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user.js')
const Post = require('../models/post.js')
const jwtAuthCheck = require('../helpers/jwtAuthCheck');

// Fetch all Users (DEBUGGING ONLY)
userRouter.get("/", jwtAuthCheck, (req, res) => {
  User.find().then(users => {
    console.log("Users => ", users);
    res.status(200).json({
      "success": true,
      "data": {
        users: users,
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

// Fetch specific User:
userRouter.get("/:userName", jwtAuthCheck, (req, res) => {
  const { userName } = req.params;

  User.findOne({ username: userName }).then(user => {
    if (user) {
      Post.find({ author: user.id })
        .populate({ path: 'author', model: User, select: ['username', 'email'] })
        .populate({ path: 'likes', model: User, select: 'username' })
        .populate({ path: 'taggedUsers', model: User, select: 'username' })
        .populate({ path: 'comments.author', model: User, select: 'username' })
        .populate({ path: 'comments.likes', model: User, select: 'username' })
        .then(posts => {
          res.status(200).json({
            "success": true,
            "data": {
              user: user,
              postCount: posts.length,
              likeCount: posts.reduce((count, post) => count + post.likes.length, 0),
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

    }
    else
      res.status(404).json({
        "success": false,
        "errors": "User not Found"
      });
  }).catch(err => {
    console.log(err)
    res.status(500).json({
      "success": false,
      "errors": err.message
    });
  })
});


module.exports = userRouter;
