const aws = require('./aws');
const upload = require('./multer');
const randomColor = require('./RandomColor');
const sendForgetPasswordEmail = require('./sendForgetPasswordEmail');
const sendVerificationEmail = require('./sendVerificationEmail');

module.exports = {
    aws,
    upload,
    randomColor,
    sendForgetPasswordEmail,
    sendVerificationEmail
};