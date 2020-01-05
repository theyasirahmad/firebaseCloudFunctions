/* eslint-disable promise/always-return */
/* eslint-disable consistent-return */
const functions = require('firebase-functions');
const os = require('os');
const path = require('path');
const cors = require('cors')({ origin: true });
const Busboy = require('busboy');
const fs = require('fs');
const spawn = require('child-process-promise').spawn;


const { Storage } = require('@google-cloud/storage');
const gcs = new Storage({
    // config..
    projectId: "hallreservation-2020", //id of project
    keyFilename: "hallreservation-2020-firebase-adminsdk-8qix5-164b7c8b90.json" // name of file in same folder
});

// onChange function was obselete thats why onFinalizes 
exports.onFileChange = functions.storage.object().onFinalize(event => {
    console.log(event);
    const object = event;
    const bucket = object.bucket;
    const contentType = object.contentType;
    const filePath = object.name;
    console.log("File Change Detected, Fucntion execution started");
        //
    if (object.resourceState === 'not_exists'){
        console.log('we deleted a file, exit..');
        return;
    }
    if (path.basename(filePath).startsWith('resized-')) {
        console.log('already resized file');
        return;
    }
    const destBucket = gcs.bucket(bucket);
    const tempFilePath = path.join(os.tmpdir(), path.basename(filePath));
    const metadata = { contentType: contentType };
    return destBucket.file(filePath).download({
        destination: tempFilePath
    }).then(() => {
        return spawn('convert', [tempFilePath, '-resize', '500x500', tempFilePath])
    }).then(() => {
        return destBucket.upload(tempFilePath, {
            destination: 'resized-' + path.basename(filePath),
            metadata: metadata
        })
    })
});

exports.uploadFile = functions.https.onRequest((req, res) => {
    cors(req, res, () => {

        if (req.method !== 'POST') {
            return res.status(500).json({
                message: 'Not allowed'
            });
        }
        const busboy = new Busboy({ headers: req.headers });
        let uploadData = null;
        busboy.on('file', (fieldName, file, filename, encoding, mimetype) => {
            const filepath = path.join(os.tmpdir(), filename);
            uploadData = { file: filepath, type: mimetype };
            file.pipe(fs.createWriteStream(filepath));
        });

        busboy.on('finish', () => {
            const bucket = gcs.bucket('hallreservation-2020.appspot.com');
            // eslint-disable-next-line promise/catch-or-return
            bucket.upload(uploadData.file, {
                uploadType: 'media',
                metadata: {
                    metadata: {
                        contentType: uploadData.type
                    }
                }
            }).then(() => {

                res.status(200).json({
                    message: 'It works'
                });
            }).catch(() => {
                return res.status(500).json({
                    error: err
                })
            })
        });
        busboy.end(req.rawBody);
    });

});

exports.onDataAdded = functions.firestore.document('Users/{id}').onCreate((event)=>{

    // console.log();
    
    // const data = event.dat
    const newData = { 
        msg: event._fieldsProto.msg.stringValue.toUpperCase() // most probably will covert to uppercase
    };
    return event.ref.set(newData);
    // return;
});