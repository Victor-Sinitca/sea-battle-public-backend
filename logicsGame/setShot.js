const killShip = require('./killShip');

/*const action = {
    sector: {
        x: number,
        y: number,
    },
    firstUser: boolean
}*/


const setShot = (state,action) => {
    let uMap = "FUMap" ,
        uShips = "FUShips"
    if (action.firstUser) {
        uMap = "SUMap"
        uShips = "SUShips"
    }
    if (!state[uMap][action.sector.y][action.sector.x].sector.shot) { // если не стреляли по сектору, то среляем и выполняем проверку на убит/не убит
        let stateCopy = {...state}
        stateCopy[uMap] = [...state[uMap]];
        stateCopy[uMap][action.sector.y][action.sector.x].sector.shot = true // установка попадания в сектор
        if (stateCopy[uMap][action.sector.y][action.sector.x].sector.ship) { // если в секторе был корабль
            let stateKillShip = killShip(action.sector, stateCopy[uMap], stateCopy[uShips]) // проверка - убит ли корабль
            if (stateKillShip.kill) { //если корабль убит - отрисовываем секторы вокруг корабля и отнимаем убитый корабль
                stateCopy[uMap] = [...stateKillShip.map]
                stateCopy[uShips] = {...stateKillShip.ships}
            }
        } else { // если в секторе нет корабля
            stateCopy.FUTurn = {...state.FUTurn}
            stateCopy.FUTurn.turn = !stateCopy.FUTurn.turn; //передача хода
        }
        return stateCopy
    } else return state //если уже стреляли по сектору - ничего не делаем и продолжаем стрельбу
}

module.exports = setShot;
