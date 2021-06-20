const mongoose = require('mongoose');
const {v1} = require('uuid');
const setShot = require('../logicsGame/setShot');
require('../models/Users');
require('../models/UsersProfile');


let clients = {};
let messages = []
let invitationsInGames = []
let gameRooms = []
let startedGames = []
const Profile = mongoose.model('UsersProfile');


const initMap = () => {
    let map = Array.from(Array(10), () => new Array(10))
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            map[i][j] = {
                sector: {
                    ship: false,
                    shot: false,
                    x: j,
                    y: i,
                    unlock: false,
                    img: null
                }
            }
        }
    }
    return map
}
const createGame = (gameId, firstUser, secondUser) => {
    return {
        gameId: gameId,
        firstUser: firstUser,
        secondUser: secondUser,
        gameData: {
            FUMap: initMap(),
            SUMap: initMap(),
            FUTurn: {
                turn: true
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
            },
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
        }
    }
}
const createGameRoom = (game, profile) => {
    return {
        firstUser: {
            id: game.userId,
            name: game.userName
        },
        secondUser: {
            id: profile.id,
            name: profile.name
        },
        gamesRoomId: v1()
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
    const sendRoom = gameRooms.filter(r => (user.id === r.firstUser.id || user.id === r.secondUser.id))
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
                    const gameRoom = createGameRoom(game, profile)
                    const newGame = createGame(gameRoom.gamesRoomId, gameRoom.firstUser, gameRoom.secondUser)
                    gameRooms.push(gameRoom)
                    startedGames.push(newGame)
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
        if (newMessageDate.eventName === "startGame") {
            const sendGame = startedGames.filter(g => newMessageDate.date.gameId === g.gameId)
            ws.send(JSON.stringify({
                eventName: "startGame",
                date: sendGame
            }))
        }






        if (newMessageDate.eventName === "userTurn") {
/*            const newMessageDateReceived = {
                eventName: "userTurn",
                date: {
                    gameId: "",
                    userTurnId: "",
                    sectorFire: {
                        x: number,
                        y: number,
                    }
                }
            }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userTurnId === item.firstUser) === item.gameData.FUTurn.turn)) {
                    item.gameData=setShot(item.gameData,newMessageDate.date.sectorFire)
                    for (let key in clients) {
                        if (clients[key].id === item.firstUser || clients[key].id === item.secondUser) {
                            clients[key].webSocket.send(JSON.stringify({
                                eventName: "userTurn",
                                date: item
                            }))
                        }
                    }
                }
            });







            ws.send(JSON.stringify({
                eventName: "startGame",
                date: sendGame
            }))
        }


    });


    ws.on('close', function () {
        console.log('соединение закрыто ' + user.id);
        delete clients[user.id];
    });
};


module.exports = getWs;
