const express = require('express');
const userRouter = express.Router();
const mongoose = require('mongoose');
const User = require('../models/user.js')
const Post = require('../models/post.js')
const upload = require('../helpers/multer');
const jwtAuthCheck = require('../helpers/jwtAuthCheck');
const aws = require('../helpers/aws');
var Jimp = require('jimp');

// Fetch all Users (DEBUGGING ONLY)
userRouter.get("/", (req, res) => {
  User.find().then(users => {
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
        .populate({ path: 'author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'likes', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'taggedUsers', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.author', model: User, select: ['username', 'imgSrc'] })
        .populate({ path: 'comments.likes', model: User, select: ['username', 'imgSrc'] })
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

userRouter.patch("/", jwtAuthCheck, upload.single('imgSrc'), async (req, res) => {
  const { username, bio } = req.body;
  const changes = {}, errors = {};

  if (username !== undefined)
    if (/^\w{3,}(\s\w+)*$/.test(username))
      changes.username = username;
    else
      errors.username = "Invalid Username";

  if (bio !== undefined)
    changes.bio = bio.trim();

  if (req.file !== undefined)
    changes.imgSrc = req.file.path;

  if (!(Object.entries(errors).length === 0 && errors.constructor === Object)) {
    // Data is Invalid, respond immediately.
    res.status(422).json({
      "success": false,
      "errors": errors,
    });

    // Errors found, no need to keep the file:
    if (req.file)
      fs.unlink(req.file.path, (err) => {
        if (err) console.log("Error deleting the file: ", err);
        else console.log(req.file.path, ' was deleted');
      });

  } else if (!(Object.entries(changes).length === 0 && changes.constructor === Object)) {

    // HELP: This works but what is username wasn't passed?
    // If changes in Username:
    if (changes.username) {
      // Checking for duplication:
      const user = await User.findOne({ 'username': changes.username });
      if (user && user.id !== req.userId) {
        errors.username = "Username already exists";
        return res.status(409).json({
          "success": false,
          "errors": errors
        });
      }
    }

    if (changes.imgSrc) {
      // Upload to S3:
      // TODO: Upload smaller images also (Target them to ~10KB )
      try {
        // Try to manipulate image:
        // TODO: Should I be limiting file types based on Jimp? 
        // Or should I simply save un processed files if Jimp cannot process it?
        let processedImageLarge = `./uploads/processed/${req.userId}-large.png`;
        let processedImage = `./uploads/processed/${req.userId}.png`;

        const image = await Jimp.read(changes.imgSrc);
        image.cover(256, 256)
          .quality(100)
          .write(processedImageLarge);

        image.cover(48, 48)
          .quality(100)
          .write(processedImage);

        const locationLarge = await aws.s3Upload("users/", processedImageLarge);
        const location = await aws.s3Upload("users/", processedImage);
        changes.imgSrcLarge = locationLarge;
        changes.imgSrc = location;
      } catch (err) {
        console.log(err)
        return res.status(500).json({
          "success": false,
          "errors": err.message
        });
      }
    }

    User.findByIdAndUpdate(req.userId, changes, { new: true }).then(user => {
      res.status(200).json({
        "success": true,
        "data": user
      });
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


module.exports = userRouter;
