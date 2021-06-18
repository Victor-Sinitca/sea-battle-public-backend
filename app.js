const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');
const cors = require('cors');
const mongoose = require('mongoose');
const errorHandler = require('errorhandler');

const http = require('http');
const auth = require('./routes/auth')
const jwt = require('jsonwebtoken')
const {v1} = require('uuid');
/*import {v1} from "uuid"*/


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
let clients = {};
const webSocketServer = new WebSocketServer.Server({
    server
});
let messages = []
let games = []
let gamesRooms = []

const Profile = mongoose.model('UsersProfile');


webSocketServer.on('connection', async (ws, url,) => {
    const token = url.url.split("=")[1]
    const user = jwt.verify(token, 'secret', {algorithms: ['sha1', 'RS256', 'HS256']}, function (err, decoded) {
        return decoded;
    });
    console.log(user)
    clients[user.id] = {
        id: user.id,
        webSocket: ws
    };
    console.log("новое соединение " + user.id);
    const profile = await Profile.findById(user.id)
        .then((userProfile) => {
            if (!userProfile) {
                return null;
            }
            return userProfile;
        });
    if (!profile) {
        ws.close(JSON.stringify({
            eventName: "errorAuthorize",
            date: {messages: "you are not logged in",}
        }))
    }
    console.log(profile)
    ws.send(JSON.stringify({
        eventName: "allDate",
        date: {
            messages: messages,
            games: games,
        }
    }))
    const sendRoom = gamesRooms.filter(r => (user.id === r.firstUser.id || user.id === r.secondUser.id))
    ws.send(JSON.stringify({
        eventName: "acceptGameOfId",
        date: sendRoom
    }))

    ws.on('message', function (message) {
        console.log('получено сообщение ' + message);
        const newMessageDate = JSON.parse(message)
        if (newMessageDate.eventName === "listGame") {
            const newGame = [{
                nameGame: newMessageDate.date.nameGame,
                userId: user.id,
                userName: profile.name,
                id: v1()
            }]

            games.push(newGame[0])
            for (let key in clients) {
                clients[key].webSocket.send(JSON.stringify({
                    eventName: "listGame",
                    date: {
                        games: newGame
                    }
                }))
            }
        }
        if (newMessageDate.eventName === "message") {
            const newMessage = [{
                message: newMessageDate.date.messages,
                photo: profile.photo ?? "",
                userId: user.id,
                userName: profile.name
            }]
            messages.push(newMessage[0])
            for (let key in clients) {
                clients[key].webSocket.send(JSON.stringify({
                    eventName: "message",
                    date: {
                        messages: newMessage,
                    }
                }))
            }
        }
        if (newMessageDate.eventName === "deleteGameOfId") {
            games = games.filter(game => {
                if (game.id === newMessageDate.date.id) {
                    for (let key in clients) {
                        clients[key].webSocket.send(JSON.stringify({
                            eventName: "deleteGameOfId",
                            date: {
                                message: `game id = ${newMessageDate.date.id} is delete`,
                                idGameDelete: newMessageDate.date.id
                            }
                        }))
                    }
                    return false
                } else return true
            });
        }
        if (newMessageDate.eventName === "acceptGameOfId") {
            games = games.filter(game => {
                if (game.id === newMessageDate.date.id
                    && game.userId !== user.id) {
                    const gameRoom = {
                        firstUser: {
                            id: game.userId,
                            name: game.userName
                        },
                        secondUser: {
                            id: user.id,
                            name: profile.name
                        },
                        gamesRoomId: v1()
                    }
                    gamesRooms.push(gameRoom)
                    for (let key in clients) {
                        if (clients[key].id === game.userId || clients[key].id === user.id) {
                            clients[key].webSocket.send(JSON.stringify({
                                eventName: "acceptGameOfId",
                                date: [gameRoom]
                            }))
                        }
                        clients[key].webSocket.send(JSON.stringify({
                            eventName: "deleteGameOfId",
                            date: {
                                message: `game id = ${newMessageDate.date.id} is accept`,
                                idGameDelete: newMessageDate.date.id
                            }
                        }))
                    }
                    return false
                } else return true
            });
        }
    });


    ws.on('close', function () {
        console.log('соединение закрыто ' + user.id);
        delete clients[user.id];
    });
});

server.listen(8000, () => console.log('Server running on http://localhost:8000/'));
