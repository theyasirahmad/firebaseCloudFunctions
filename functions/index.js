/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const gcs = require('@google-cloud/storage')();// () calling method is now obselete
const os = require('os');
const path = require('path');
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });
// onChange function was obselete thats why onFinalizes 
exports.onFileChange = functions.storage.object().onFinalize(event => {
    // console.log(event);
    // code does not work due to obseletion of some components i guess
    const object = event.data;
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name;
    console.log("File Change Detected, Fucntion execution started");

    if(path.basename(filePath).startsWith('renamed-')){
        console.log('already renamed file')
       return;
    }
    const destBucket = gcs.Bucket(bucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = { contentType: contentType };
    return destBucket.file(filePath).download({
        destination:tempFilePath
    }).then(()=>{
        console.log('we');
        return destBucket.upload(tempFilePath, {
            destination:'renamed-'+path.basename(filePath),
            metadata:metadata
        })
    })
});