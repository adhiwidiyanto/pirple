/**
 * Primary File for the API
 * 
 * 
 */

// Depedency
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;
var config = require('./config');
var fs = require('fs');

// Instantiate the HTTP server.
var httpServer = http.createServer((req, res) => {
    unifiedServer(req, res);
});

// Start the server http.
httpServer.listen(config.httpPort, () => {
    console.log(`The server is listening on port ${config.httpPort}`);
});

// Instantiate the HTTPS server.
var httpsServerOptions = {
    'key': fs.readFileSync('./https/key.pem'),
    'cert': fs.readFileSync('./https/cert.pem')
};
var httpsServer = https.createServer(httpsServerOptions, (req, res) => {
    unifiedServer(req, res);
});

//Start the server https.
httpsServer.listen(config.httpsPort, () => {
    console.log(`The server is listening on port ${config.httpsPort}`);
});

// All the server logic for both the http and https server.
var unifiedServer = function(req, res) {
    // Get the URL and parse it.
    var parsedUrl = url.parse(req.url, true);

    // Get the path.
    var path = parsedUrl.pathname;
    var trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object.
    var queryStringObject = parsedUrl.query;

    // Get the header as an object.
    var headers = req.headers;

    // Get the HTTP Method.
    var method = req.method.toLowerCase();

    // Get the payloads, if any.
    var decoder = new StringDecoder('utf-8');
    var buffer = '';
    req.on('data', (data) => {
        buffer += decoder.write(data);
    });
    req.on('end', () => {
        buffer += decoder.end();

        // Choose the handler this request should go to. If one is not found, use the notFound handler.
        var choosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notFound;

        // Construct the data object to send to the handler.
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': buffer,
        };

        // Route the request to the handler specify to router.
        choosenHandler(data, function(statusCode, payload){
            // use the status code called back by the handler, or default to 200.
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
            
            // user the the payload called back by tne handler, or default to an empty object.
            payload = typeof(payload) == 'object' ? payload : {};

            // Convert the payload to  string.
            var payloadString = JSON.stringify(payload);

            // return the response.
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            res.end(payloadString);

            // Log the request path.
            console.log(`Returning this response:`, statusCode, payloadString);
        });
    });
};

// Define the handler.
var handlers = {};

// Sample handler.
handlers.sample = function(data, callback) {
    // Callback a http status code, and a payload object.
    callback(406,{'name': 'sample handler'});
};

handlers.hello = function(data, callback) {
    // Callback a http status code, and a payload object.
    callback(200,{'message': 'This is message from home assignment 1'});
};

// Not found handler.
handlers.notFound = function(data, callback) {
    callback(404);
};

// Define a request router.
var router = {
    'sample': handlers.sample,
    'hello': handlers.hello
}