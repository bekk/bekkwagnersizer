
import {formatTime} from '../util.js';

let record = [];

export function registerGoalTime(time, texture) {
    if (!texture) { // Skjer med debug-figurer
        console.error("Tried to record highscore without texture");
        return;
    }

    const row = {time, fileName: texture.fileName};

    record.push(row);
    record.sort((a, b) => b.time - a.time);

    return record.indexOf(row) + 1;
}

export function getTopGoalTimes(amount) {
    return record.slice(0, amount);
}

export function makeHighscoreHtml() {
    let html = "";

    const top = getTopGoalTimes(12);

    for (let i = 0; i < 4; i++) {
        html += `<ol id="highscore-list-${i+1}">`

        for (let j = 0; j < 3; j++) {
            const topGoalTime = top[i * 3 + j];
            if (!topGoalTime) continue;
            const imageUrl = topGoalTime.fileName;
            const timeFormatted= formatTime(topGoalTime.time);
            html += `<li><h2>${i * 3 + j + 1}.</h2> <img src="http://localhost:3000/${imageUrl}"><span>${timeFormatted}</span></li>`
        }

        html += `</ol>`;
    }

    return html;
}

export function saveHighscore() {
    const pureObject = record;

    const stateString = JSON.stringify(pureObject);
    localStorage.setItem("highscore", stateString); 

    //console.log("Saved highscore", JSON.parse(stateString));  
}

export function loadHighscore() {
    const stateString = localStorage.getItem("highscore");

    if (stateString) {
        const pureObject = JSON.parse(stateString);
        record = pureObject;

        console.log("Loaded highscore", record);
    }
}

export function deleteHighscore() {
    localStorage.removeItem("highscore");
    record = [];
    console.log("Deleted highscore");
}