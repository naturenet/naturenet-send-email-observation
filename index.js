


var formidable = require('formidable'),
    http = require('http'),
    cloudinary = require('cloudinary'),
    querystring = require('querystring'),
    fs = require('fs');

cloudinary.config({ cloud_name: 'university-of-colorado' });

http.createServer(function(req, res) {
    /* Process the form uploads */
    if (req.url == '/addEmailObservation' && req.method.toLowerCase() == 'post') {
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
             res.writeHead(200, {'content-type': 'text/plain'});
             res.write('Done.');
             
             var counter = 0;
             Object.keys(files).forEach(function(key) {
                  var file = files[key];
                                        
                  cloudinary.uploader.unsigned_upload(file.path, 'web-preset', function(result) {
                                        
                        // make firebase request to add the email observation
                        sendEmailObservation(counter, fields['from'], fields['subject'],
                                             fields['body-plain'], fields['timestamp'],
                                             result['secure_url']);
                        
                        // delete the temp file
                        fs.unlink(file.path, (err) => { if (err) console.log(err); });

                        counter = counter + 1;
                });
             });
             
             if (Object.keys(files).length == 0) {
                // the email came without attachment
                sendEmailObservation(0, fields['from'], fields['subject'],
                                     fields['body-plain'], fields['timestamp'], '');
             }
            
             res.end();
    });

    form.on('error', function(err) {
          console.error(err);
          });

    form.on('end', function() {
            
          });

    return;
    }
                  
    res.writeHead(200, {'content-type': 'text/html'});
    res.end();
}).listen((process.env.PORT || 5000));


function sendEmailObservation(id, from, subject, body, timestamp, attachment) {
    // make firebase request to add the email observation
    
    var observation = querystring.stringify({
                                            'id' : id,
                                            'from': from,
                                            'subject': subject,
                                            'body-plain' : body,
                                            'timestamp' : timestamp,
                                            'attachment': attachment
                                            });
    
    // An object of options to indicate where to post to
    var postParams = {
    host: 'us-central1-firebase-naturenet.cloudfunctions.net',
    path: '/addEmailObservation',
    method: 'POST',
    headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'Content-Length': observation.length
    }
    };
    
    // Set up the request
    var postReq = http.request(postParams, function(res) {
                               res.setEncoding('utf8');
                               res.on('data', function (chunk) {});
                               res.on('end', function () {});
                               });
    
    postReq.on('error', (e) => {
               console.error(`problem with request: ${e.message}`);
               });
    
    // post the data
    postReq.write(observation);
    postReq.end();
}
