var express = require('express')
var app = express()
var port = process.env.PORT || 80
process.env.SECRET_HASH = "sr89#$443"
app.set('port', port);

var winston = require('winston');
var {Loggly} = require('winston-loggly-bulk');
var expressWinston = require('express-winston');
expressWinston.requestWhitelist.push('body');

app.use(expressWinston.logger({
    transports: [
        new winston.transports.Console({
            json: true,
            colorize: true
        }),
        new winston.transports.File({
            filename: 'combined.log',
            level: 'info'
        }),
        winston.add(new Loggly({
            inputToken: "8b356096-ae55-428e-bb91-d486e81a0244",
            subdomain: "maestrojolly",
            tags: ["Winston-NodeJS"],
            json: true
        }))
    ]
}));

var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({
    extended: false
}))
app.use(bodyParser.json())

app.get('/', (req, res) => res.send('Hello World!'))

app.post("/ghmobile", function (req, res) {
    // retrieve the signature from the header
    winston.info(req.body);
    var hash = req.headers["verif-hash"];
    // var data = req.body;
    // console.log(data);

    if (!hash) {
        // discard the request,only a post with rave signature header gets our attention 
        // console.log("Hash not provided");
        res.send({
            status: "error"
        });
        process.exit(0)
    }

    // // Get signature stored as env variable on your server
    const secret_hash = process.env.SECRET_HASH;

    // // check if signatures match

    if (hash !== secret_hash) {
        // silently exit, or check that you are passing the write hash on your server.
        //  console.log("Hash not valid");
        res.send({
            status: "error"
        });
        process.exit(0)
    }

    // Retrieve the request's body
    var request_json = req.body;
    // winston.log("info",request_json);
    res.send({
        status: "success",
        data: request_json["flwRef"]
    });
});

app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};

    // add this line to include winston logging
    winston.info(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

    // render the error page
    res.status(err.status || 500);
    res.render('error');
});

app.listen(port, '', () => {
    console.log('App listening on port %s', port);
});
