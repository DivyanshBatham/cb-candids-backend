const Post = require('../../models/post');

const authorizationCheck = (req, res, next) => {
    const { postId, commentId } = req.params;
    
    if (postId) {
        Post.findById(postId).then(post => {
            if (post) {
                if (commentId) {
                    // Edit / Delete Comment:
                    let commentIndex = post.comments.findIndex(comment => comment.id === commentId);

                    if (commentIndex !== -1) {
                        if ((post.comments[commentIndex].author).toString() !== req.userId)
                            return res.status(403).json({
                                "success": false,
                                "errors": "Request Forbidden"
                            });
                    }
                    else {
                        return res.status(404).json({
                            "success": false,
                            "errors": "Comment not Found"
                        });
                    }
                }
                else if ((post.author).toString() !== req.userId) {
                    // Edit / Delete Post:
                    return res.status(403).json({
                        "success": false,
                        "errors": "Request Forbidden"
                    });
                }
                next();

            } else {
                return res.status(404).json({
                    "success": false,
                    "errors": "Post not Found"
                });
            }
        }).catch(err => {
            console.log(err)
            res.status(500).json({
                "success": false,
                "errors": err.message
            });
        });
    }

}

module.exports = authorizationCheck