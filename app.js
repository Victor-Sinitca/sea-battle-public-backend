const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

const http = require('http');


//Configure mongoose's promise to global promise
mongoose.promise = global.Promise;


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
let clients = {};
const webSocketServer = new WebSocketServer.Server({
    server
});
let messages = [];

webSocketServer.on('connection', function (ws,url) {
    const token=url.url.split("=")[1]





    let id = Math.round(Math.random() * 1000000);
    clients[id] = {
        id:id,
        webSocket:ws
    };
    console.log("новое соединение " + id);

    console.log("is token="+token)




    ws.send(JSON.stringify(messages))

    ws.on('message', function (message) {
        console.log('получено сообщение ' + message);
        const newMessage = [
            {   message: message,
                photo: "",
                userId: id,
                userName: "" + id
            }
        ]
        messages.push(newMessage[0])
        for (let key in clients) {
            clients[key].webSocket.send(JSON.stringify(newMessage))
        }
    });

    ws.on('close', function () {
        console.log('соединение закрыто ' + id);
        delete clients[id];
    });

});


server.listen(8000, () => console.log('Server running on http://localhost:8000/'));
