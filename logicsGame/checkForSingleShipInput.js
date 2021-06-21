
const lookAroundNoProperty = (i, j, userMap, property) => { //проверка клеток вокруг сектора на наличие свойства fire ли ship
    return (!userMap[i + 1]?.[j].sector[property]) &&
        (!userMap[i + 1]?.[j + 1]?.sector[property]) &&
        (!userMap[i + 1]?.[j - 1]?.sector[property]) &&
        (!userMap[i - 1]?.[j].sector[property]) &&
        (!userMap[i - 1]?.[j + 1]?.sector[property]) &&
        (!userMap[i - 1]?.[j - 1]?.sector[property]) &&
        (!userMap[i][j].sector[property]) &&
        (!userMap[i][j + 1]?.sector[property]) &&
        (!userMap[i][j - 1]?.sector[property]);
}
const lookRightNoShip = (i, j, x, userMap) => { //проверка нет ля справа корабля
    return (
        (!userMap[i + 1]?.[j + x]?.sector.ship) &&
        (!userMap[i - 1]?.[j + x]?.sector.ship) &&
        (!userMap[i][j + x]?.sector.ship));
}
const lookDownNoShip = (i, j, x, userMap) => { //проверка нет ли внизу корабля
    return (
        (!userMap[i + x]?.[j].sector.ship) &&
        (!userMap[i + x]?.[j + 1]?.sector.ship) &&
        (!userMap[i + x]?.[j - 1]?.sector.ship)
    )
}
const checkForShipInput = (map, horizon,   shipValue,
                                  human) => { //разблокировка клеток, куда можно установить корабль
    let userMap = map
    let shipInputState = []  //массив для запоминания
    for (let i = 0; i < 10; i++) {
        for (let j = 0; j < 10; j++) { //проверка клетки
            if (horizon) { //если корабль горизонтальный
                if (lookAroundNoProperty(i, j, userMap,"ship") && //проверка есть ли рядом корабль
                    (j < (11 - shipValue)) &&
                    (shipValue < 2 || lookRightNoShip(i, j, 2, userMap)) && // если двойной дополнительная  проверка
                    (shipValue < 3 || lookRightNoShip(i, j, 3, userMap)) && // если тройной дополнительная  проверка
                    (shipValue < 4 || lookRightNoShip(i, j, 4, userMap)) // если четверной дополнительная  проверка
                ) {
                    human ? userMap[i][j].sector.unlock = true  //разблокировка клетки если человек
                          : shipInputState.push(userMap[i][j].sector) //запоминание клетки если ИИ

                }
            } else { //если корабль вертикальный
                if (lookAroundNoProperty(i, j, userMap,"ship") &&
                    (i < (11 - shipValue)) &&
                    (shipValue < 2 || lookDownNoShip(i, j, 2, userMap)) &&
                    (shipValue < 3 || lookDownNoShip(i, j, 3, userMap)) &&
                    (shipValue < 4 || lookDownNoShip(i, j, 4, userMap))
                ) {
                    human ? userMap[i][j].sector.unlock = true  //разблокировка клетки если человек
                        : shipInputState.push(userMap[i][j].sector) //запоминание клетки если ИИ
                }
            }
        }
    }
    return {
        userMap,
        shipInputState
    }
}
module.exports = checkForShipInput;
