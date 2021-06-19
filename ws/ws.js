const mongoose = require('mongoose');
const {v1} = require('uuid');
require('../models/Users');
require('../models/UsersProfile');


let clients = {};
let messages = []
let invitationsInGames = []
let gamesRooms = []
let startedGames =[]
const Profile = mongoose.model('UsersProfile');

let game={
    gameId:"",
    firstUser: {
        id: "",
        name: ""
    },
    secondUser: {
        id: "",
        name: ""
    },
    gameData:{
        FUMap: [],
        SUMap: [],
        FUTurn: {
            turn: true
        },
        comp: {
            game: false,
            damaged: false,
            hit: false,
            sectorFire: []
        },
        lookSecondUser: false ,
        whatSetShipFU: 0 ,
        whatSetShipSU: 0 ,
        horizonSetShipFU: null ,
        horizonSetShipSU: null ,
        deleteShipFU: false ,
        deleteShipSU: false ,

        settingShipUser: {
            firstUser: true ,
            secondUser: true ,
        },

        FUShips: {
            ship1: 4,
            ship2: 3,
            ship3: 2,
            ship4: 1,
            numberShips1: 4,
            numberShips2: 3,
            numberShips3: 2,
            numberShips4: 1,
        } ,
        SUShips: {
            ship1: 4,
            ship2: 3,
            ship3: 2,
            ship4: 1,
            numberShips1: 4,
            numberShips2: 3,
            numberShips3: 2,
            numberShips4: 1,
        },
        idTurn: 0 ,
    }





}



const getWs = async (ws, url, token, user) => {
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
            games: invitationsInGames,
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

            invitationsInGames.push(newGame[0])
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
            invitationsInGames = invitationsInGames.filter(game => {
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
            invitationsInGames = invitationsInGames.filter(game => {
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
};


module.exports = getWs;
