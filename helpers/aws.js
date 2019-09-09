var AWS = require('aws-sdk');
var fs = require('fs');
var path = require('path');

AWS.config.update({ region: 'ap-south-1' });

// Create S3 service object
s3 = new AWS.S3({ apiVersion: '2006-03-01' });

var uploadParams = { Bucket: "cb-candids", Key: '', Body: '' };

exports.s3Upload = (folder, file, key) => {
    var fileStream = fs.createReadStream(file);
    fileStream.on('error', function (err) {
        console.log('File Error', err);
    });
    uploadParams.Body = fileStream;
    if (key)
        uploadParams.Key = folder + key;
    else
        uploadParams.Key = folder + path.basename(file);

    // call S3 to retrieve upload file to specified bucket
    return new Promise((resolve, reject) => {
        s3.upload(uploadParams, function (err, data) {
            if (err) {
                console.log(">>>>> Error", err);
                return reject(err);
            } if (data) {
                console.log(">>>>> Upload Success", data.Location);
                return resolve(data.Location);
            }
        });
    });

}