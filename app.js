const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

const http = require('http');
const jwt = require('jsonwebtoken')


const getWs = require('./ws/ws');
//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;

/*const hfjnfjd=""*/
//Configure isProduction variable
const isProduction = process.env.NODE_ENV === 'production';

//Initiate our app
const app = express();
const server = http.createServer(app);


//Configure our app
app.use(cors());
app.use(require('morgan')('dev'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({secret: 'passport-tutorial', cookie: {maxAge: 60000}, resave: false, saveUninitialized: false}));

if (!isProduction) {
    app.use(errorHandler());
}

//Configure Mongoose
mongoose.connect('mongodb://localhost/passport-tutorial',
    {useNewUrlParser: true, useUnifiedTopology: true,});
mongoose.set('debug', true);


require('./models/Users');
require('./models/UsersProfile');
require('./config/passport');
app.use(require('./routes'));

//Error handlers & middlewares
if (!isProduction) {
    app.use((err, req, res) => {
        res.status(err.status || 500);

        res.json({
            errors: {
                message: err.message,
                error: err,
            },
        });
    });
}
app.use((err, req, res) => {
    res.status(err.status || 500);

    res.json({
        errors: {
            message: err.message,
            error: {},
        },
    });
});


const WebSocketServer = new require('ws');
const webSocketServer = new WebSocketServer.Server({ server});

webSocketServer.on('connection',  async (ws, url,) => {
    const token = url.url.split("=")[1]
    const user = jwt.verify(token, 'secret', {algorithms: ['sha1', 'RS256', 'HS256']}, function (err, decoded) {
        return decoded;
    });
    await  getWs(ws,url,token,user)
});
server.listen(8000, `192.168.35.2`, () => console.log('Server running on http://localhost:8000/'));
