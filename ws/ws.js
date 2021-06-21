const mongoose = require('mongoose');
const {v1} = require('uuid');
const setShot = require('../logicsGame/setShot');
const setShip = require('../logicsGame/setShip');
const checkForShipInput = require('../logicsGame/checkForSingleShipInput');
const deleteShipFromTheMap = require('../logicsGame/deleteShipFromTheMap');
require('../models/Users');
require('../models/UsersProfile');


let clients = {};
let messages = []
let invitationsInGames = []
let gameRooms = []
let startedGames = []
const Profile = mongoose.model('UsersProfile');

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

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
            settingShipUser: {
                firstUser: true,
                secondUser: true,
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

        if (newMessageDate.eventName === "startGameSetShip") {
            /*const newMessageDateReceived = {
                eventName: "startGameSetShip",
                date: {
                    sector: {
                        x: sector.x,
                        y: sector.y,
                    },
                    gameId: gameId,
                    userId: userId,
                    horizonSetShip: horizonSetShip,
                    whatSetShip: whatSetShip
                }
            }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.firstUser.id) === item.gameData.settingShipUser.firstUser)) {
                    item.gameData = setShip(item.gameData, true, newMessageDate.date.sector,
                        newMessageDate.date.horizonSetShip, newMessageDate.date.whatSetShip)
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.secondUser.id) === item.gameData.settingShipUser.secondUser)) {
                    item.gameData = setShip(item.gameData, false, newMessageDate.date.sector,
                        newMessageDate.date.horizonSetShip, newMessageDate.date.whatSetShip)
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
            });
        }
        if (newMessageDate.eventName === "startGameDeleteShip") {
            /*const newMessageDateReceived = {
                eventName: "startGameDeleteShip",
                date: {
                    sector: {
                        ship: boolean,
                        shot: boolean,
                        x: number,
                        y: number,
                        unlock: boolean,
                        img: null | number
                    },
                    gameId: gameId,
                    userId: userId
                }
            }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.firstUser.id) === item.gameData.settingShipUser.firstUser)) {
                    item.gameData = deleteShipFromTheMap(item.gameData,newMessageDate.date.sector,true)
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.secondUser.id) === item.gameData.settingShipUser.secondUser)) {
                    item.gameData = item.gameData = deleteShipFromTheMap(item.gameData,newMessageDate.date.sector,false)
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
            });
        }
        if (newMessageDate.eventName === "startGameSetShipsRandom") {
            /* const newMessageDateReceived = {
                 eventName: "startGameSetShipsRandom",
                 date: {
                     gameId: gameId,
                     userId: userId
                 }
             }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.firstUser.id) && item.gameData.settingShipUser.firstUser) {
                    item.gameData.FUMap = initMap()
                    item.gameData.FUShips = {
                        ship1: 4,
                        ship2: 3,
                        ship3: 2,
                        ship4: 1,
                        numberShips1: 4,
                        numberShips2: 3,
                        numberShips3: 2,
                        numberShips4: 1,
                    }
                    let horizon = true;
                    let shipInputState = [];
                    for (let shipValue = 4; shipValue >= 1; shipValue--) {
                        for (let numberOfShips = shipValue; numberOfShips <= 4; numberOfShips++) {
                            horizon = Boolean(getRandomInt(2))
                            shipInputState = checkForShipInput(item.gameData.FUMap, horizon, shipValue, false).shipInputState;
                            item.gameData = setShip(item.gameData, true, shipInputState[getRandomInt(shipInputState.length)],
                                horizon, shipValue)
                        }
                    }
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.secondUser.id) && item.gameData.settingShipUser.secondUser) {

                    item.gameData.SUMap = initMap()
                    item.gameData.SUShips = {
                        ship1: 4,
                        ship2: 3,
                        ship3: 2,
                        ship4: 1,
                        numberShips1: 4,
                        numberShips2: 3,
                        numberShips3: 2,
                        numberShips4: 1,
                    }
                    let horizon = true;
                    let shipInputState = [];
                    for (let shipValue = 4; shipValue >= 1; shipValue--) {
                        for (let numberOfShips = shipValue; numberOfShips <= 4; numberOfShips++) {
                            horizon = Boolean(getRandomInt(2))
                            shipInputState = checkForShipInput(item.gameData.SUMap, horizon, shipValue, false).shipInputState;
                            item.gameData = setShip(item.gameData, false, shipInputState[getRandomInt(shipInputState.length)],
                                horizon, shipValue)
                        }
                    }
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
            });
        }
        if (newMessageDate.eventName === "startGameClearMap") {
            /* const newMessageDateReceived = {
                 eventName: "startGameSetShipsRandom",
                 date: {
                     gameId: gameId,
                     userId: userId
                 }
             }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.firstUser.id) && item.gameData.settingShipUser.firstUser) {
                    item.gameData.FUMap = initMap()
                    item.gameData.FUShips = {
                        ship1: 4,
                        ship2: 3,
                        ship3: 2,
                        ship4: 1,
                        numberShips1: 4,
                        numberShips2: 3,
                        numberShips3: 2,
                        numberShips4: 1,
                    }
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.secondUser.id) && item.gameData.settingShipUser.secondUser) {
                    item.gameData.SUMap = initMap()
                    item.gameData.SUShips = {
                        ship1: 4,
                        ship2: 3,
                        ship3: 2,
                        ship4: 1,
                        numberShips1: 4,
                        numberShips2: 3,
                        numberShips3: 2,
                        numberShips4: 1,
                    }
                    ws.send(JSON.stringify({
                        eventName: "startGame",
                        date: [item]
                    }))
                }
            });
        }
        if (newMessageDate.eventName === "startGameUser") {
            /*            const newMessageDateReceived = {
                            eventName: "startGameUser",
                            date: {
                                gameId: gameId,
                                userId: userId
                            }
                        }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.firstUser.id) === item.gameData.settingShipUser.firstUser)) {
                    item.gameData.settingShipUser.firstUser = false
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    ((newMessageDate.date.userId === item.secondUser.id) === item.gameData.settingShipUser.secondUser)) {
                    item.gameData.settingShipUser.secondUser = false
                }
                ws.send(JSON.stringify({
                    eventName: "startGame",
                    date: [item]
                }))
            });
        }
        if (newMessageDate.eventName === "startGameSetShot") {
/*                        const newMessageDateReceived = {
                            eventName: "userTurn",
                            date: {
                                gameId: "",
                                userId: "",
                                sector: {
                                    ship: boolean,
                                    shot: boolean,
                                    x: number,
                                    y: number,
                                    unlock: boolean,
                                    img: null | number
                                }
                            }
                        }*/
            startedGames.forEach(function (item, index, array) {
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.firstUser.id) && item.gameData.FUTurn.turn) {
                    item.gameData = setShot(item.gameData, true, newMessageDate.date.sector)
                    for (let key in clients) {
                        if (clients[key].id === item.firstUser.id || clients[key].id === item.secondUser.id) {
                            clients[key].webSocket.send(JSON.stringify({
                                eventName: "startGame",
                                date: [item]
                            }))
                        }
                    }
                }
                if ((item.gameId === newMessageDate.date.gameId) &&
                    (newMessageDate.date.userId === item.secondUser.id) && !item.gameData.FUTurn.turn) {
                    item.gameData = setShot(item.gameData,false, newMessageDate.date.sector)
                    for (let key in clients) {
                        if (clients[key].id === item.firstUser.id || clients[key].id === item.secondUser.id) {
                            clients[key].webSocket.send(JSON.stringify({
                                eventName: "startGame",
                                date: [item]
                            }))
                        }
                    }
                }
            });
        }


    });


    ws.on('close', function () {
        console.log('соединение закрыто ' + user.id);
        delete clients[user.id];
    });
};


module.exports = getWs;
