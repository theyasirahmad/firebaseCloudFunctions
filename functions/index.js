/* eslint-disable promise/always-return */
/* eslint-disable consistent-return */
const functions = require('firebase-functions');
// const gcs = require('@google-cloud/storage')();// () calling method is now obselete
// const gcs = require('@google-cloud/storage');// () calling method is now obselete
const os = require('os');
const path = require('path');
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const fs = require('fs');

const { Storage } = require('@google-cloud/storage');
const gcs = new Storage({
    // config..
    projectId: "hallreservation-2020",
    keyFilename: "hallreservation-2020-firebase-adminsdk-8qix5-164b7c8b90.json"
});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

// onChange function was obselete thats why onFinalizes 
exports.onBucketChange = functions.storage.object().onFinalize(event => {
    // console.log(event);
    // code does not work due to obseletion of some components i gues
    console.log(event);
    const object = event;
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name;
    console.log("File Change Detected, Fucntion execution started");

    if(path.basename(filePath).startsWith('renamed-')){
        console.log('already renamed file')
       return;
    }
    const destBucket = gcs.bucket(bucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = { contentType: contentType };
    return destBucket.file(filePath).download({
        destination:tempFilePath
    }).then(()=>{
        return destBucket.upload(tempFilePath, {
            destination:'renamed-'+path.basename(filePath),
            metadata:metadata
        })
    })
});

// exports.uploadFile = functions.https.onRequest((req, res) => {
//     cors(req, res, () => {

//         if (req.method !== 'POST') {
//             return res.status(500).json({
//                 message: 'Not allowed'
//             });
//         }
//         const busboy = new Busboy({ headers: req.headers });
//         let uploadData = null;
//         busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
//             const filepath = path.join(os.tmpdir(), filename);
//             uploadData = { file: filepath, type: mimetype };
//             file.pipe(fs.createWriteStream(filepath));
//         });

//         busboy.on('finish', () => {
//             const bucket = Storage.Bucket('hallreservation-2020.appspot.com');
//             // eslint-disable-next-line promise/catch-or-return
//             bucket.upload(uploadData.file, {
//                 uploadType: 'media',
//                 metadata: {
//                     metadata: {
//                         contentType: uploadData.type
//                     }
//                 }
//             }).then(() => {

//                 res.status(200).json({
//                     message: 'It works'
//                 });
//             }).catch(() => {
//                 return res.status(500).json({
//                     error: err
//                 })
//             })
//         });
//         busboy.end(req.rawBody);
//     });

// });