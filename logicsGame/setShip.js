

const lockMap = (map) => { // заблокировать карту
    let userMap = map
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) {
            userMap[i][j].sector.unlock = false
        }
    }
    return userMap
}
const setShip=(gameData,firstUser, sector,horizonSetShip,whatSetShip)=>{
    let gameDataCopy
    let map="SUMap",
        ships= "SUShips"

    if (firstUser) {
        map = "FUMap"
        ships = "FUShips"
    }

    gameDataCopy = {...gameData};
    gameDataCopy[map] = [...gameData[map]];
    if (horizonSetShip) {
        gameDataCopy[map][sector.y][sector.x].sector.ship = true
        if (whatSetShip === 1) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 1
        }
        if (whatSetShip > 1) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 21
            gameDataCopy[map][sector.y][sector.x + 1].sector.img = 22
            gameDataCopy[map][sector.y][sector.x + 1].sector.ship = true
        }
        if (whatSetShip > 2) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 31
            gameDataCopy[map][sector.y][sector.x + 1].sector.img = 32
            gameDataCopy[map][sector.y][sector.x + 2].sector.img = 33
            gameDataCopy[map][sector.y][sector.x + 2].sector.ship = true
        }
        if (whatSetShip > 3) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 41
            gameDataCopy[map][sector.y][sector.x + 1].sector.img = 42
            gameDataCopy[map][sector.y][sector.x + 2].sector.img = 43
            gameDataCopy[map][sector.y][sector.x + 3].sector.img = 44
            gameDataCopy[map][sector.y][sector.x + 3].sector.ship = true
        }
    } else {
        gameDataCopy[map][sector.y][sector.x].sector.ship = true
        if (whatSetShip === 1) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 1
        }
        if (whatSetShip > 1) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 221
            gameDataCopy[map][sector.y + 1][sector.x].sector.img = 211
            gameDataCopy[map][sector.y + 1][sector.x].sector.ship = true
        }
        if (whatSetShip > 2) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 331
            gameDataCopy[map][sector.y + 1][sector.x].sector.img = 321
            gameDataCopy[map][sector.y + 2][sector.x].sector.img = 311
            gameDataCopy[map][sector.y + 2][sector.x].sector.ship = true
        }
        if (whatSetShip > 3) {
            gameDataCopy[map][sector.y][sector.x].sector.img = 441
            gameDataCopy[map][sector.y + 1][sector.x].sector.img = 431
            gameDataCopy[map][sector.y + 2][sector.x].sector.img = 421
            gameDataCopy[map][sector.y + 3][sector.x].sector.img = 411
            gameDataCopy[map][sector.y + 3][sector.x].sector.ship = true
        }
    }
    gameDataCopy[map] = lockMap(gameDataCopy[map])
    if (whatSetShip === 1) {
        gameDataCopy[ships].ship1 -= 1
    }
    if (whatSetShip === 2) {
        gameDataCopy[ships].ship2 -= 1
    }
    if (whatSetShip === 3) {
        gameDataCopy[ships].ship3 -= 1
    }
    if (whatSetShip === 4) {
        gameDataCopy[ships].ship4 -= 1
    }
    return gameDataCopy
}

module.exports = setShip;
