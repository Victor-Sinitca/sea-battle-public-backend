

const deleteShipFromTheMap=(state, sector, firstUser)=>{
    let uMap = "FUMap" ,
        uShips = "FUShips"
    if (!firstUser) {
        uMap = "SUMap"
        uShips = "SUShips"
    }
    let stateCopy = {...state}

    let i =sector.y, j=sector.x;
    let iMax = i, iMin = i, jMax = j, jMin = j
    if (stateCopy[uMap][i][j].sector.ship){
        //проверка по вертикали
        if (stateCopy[uMap][i - 1]?.[j].sector.ship) { //есть ли корабль слева на -1
                if (stateCopy[uMap][i - 2]?.[j].sector.ship) { // если есть, то есть ли корабль с лева на -2
                        if (stateCopy[uMap][i - 3]?.[j].sector.ship) { // если есть, то есть ли корабль с лева на -3
                                iMin = i-3; stateCopy[uShips].ship4++ // УБРАТЬ 000x
                        } else if (stateCopy[uMap][i +1]?.[j].sector.ship) { //если -1 есть, -2 есть, -3 нет корабля - есть ли корабль на +1
                                iMin = i-2 ; iMax=i+1; stateCopy[uShips].ship4++ // УБРАТЬ 00x0
                        }else {iMin = i-2; stateCopy[uShips].numberShips3--} //усли  на +1  корабля нет  - УБРАТЬ 00x
                } else if (stateCopy[uMap][i+1]?.[j].sector.ship) {  // если слева на -1 есть , далее с лева на -2 пусто, а справа на +1 есть
                        if(stateCopy[uMap][i+2]?.[j].sector.ship){  // если справан а +2 есть корабль
                                iMin =i-1; iMax=i+2; stateCopy[uShips].ship4++  // УБРАТЬ 0x00
                        }else  {iMin =i-1; iMax=i+1; stateCopy[uShips].ship3++}  // если справа на +2 нет корабля - УБРАТЬ 0x0
                }else  {iMin =i-1; stateCopy[uShips].ship2++ } // если слева на -1 есть, далее с лева на -2 пусто, и с права на +1 нет - УБРАТЬ 0x
        }else if(stateCopy[uMap][i+1]?.[j].sector.ship) {
                if(stateCopy[uMap][i+2]?.[j].sector.ship){
                        if(stateCopy[uMap][i+3]?.[j].sector.ship){
                                iMax =i+3; stateCopy[uShips].ship4++ // УБРАТЬ x000
                        }else {iMax =i+2; stateCopy[uShips].ship3++} //  на -1 нет  на +1 есть на +2 есть на +3 нет  - УБРАТЬ x00
                }else {iMax =i+1; stateCopy[uShips].ship2++} // на -1 нет  на +1 есть на +2 нет  - УБРАТЬ x0


         //проверка по горизонтали по аналогии с вертикалью

        } else if (stateCopy[uMap][i ][j- 1]?.sector.ship) {
                if (stateCopy[uMap][i ][j- 2]?.sector.ship) {
                        if (stateCopy[uMap][i ][j- 3]?.sector.ship) {
                                jMin = j-3; stateCopy[uShips].ship4++
                        } else if (stateCopy[uMap][i ][j+1]?.sector.ship) {
                                jMin = j-2 ; jMax=j+1; stateCopy[uShips].ship4++
                        }else {jMin = j-2; stateCopy[uShips].ship3++}
                } else if (stateCopy[uMap][i][j+1]?.sector.ship) {
                        if(stateCopy[uMap][i][j+2]?.sector.ship){
                                jMin =j-1; jMax=j+2; stateCopy[uShips].ship4++
                        }else  {jMin =j-1; jMax=j+1; stateCopy[uShips].ship3++}
                }else  {jMin =j-1; stateCopy[uShips].ship2++ }
        }else if(stateCopy[uMap][i][j+1]?.sector.ship) {
                if(stateCopy[uMap][i][j+2]?.sector.ship){
                        if(stateCopy[uMap][i][j+3]?.sector.ship){
                                jMax =j+3; stateCopy[uShips].ship4++
                        }else {jMax =j+2; stateCopy[uShips].ship3++}
                }else {jMax =j+1; stateCopy[uShips].ship2++}
        }else  stateCopy[uShips].ship1++;



        for(i=iMin; i<=iMax ; i++){
            for(j=jMin; j<=jMax ; j++){
                stateCopy[uMap][i][j].sector.ship = false
                stateCopy[uMap][i][j].sector.img = 0

            }
        }
    }
    return stateCopy
}

module.exports = deleteShipFromTheMap;
