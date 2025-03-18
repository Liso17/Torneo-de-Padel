let players = [];
let pairStandings = {};
let individualStandings = {};
let currentTournament = null;
let tournaments = JSON.parse(localStorage.getItem('tournaments')) || {};
const adminPassword = "admin123";

window.onload = function() {
    console.log('Cargando página inicial...');
    updateTournamentList();
};

function startNewTournament() {
    const name = document.getElementById('tournamentName').value.trim();
    console.log('Intentando crear torneo:', name);
    if (!name) {
        alert('Ingresa un nombre para el torneo.');
        return;
    }
    if (tournaments[name]) {
        alert('Ya existe un torneo con ese nombre.');
        return;
    }
    currentTournament = name;
    tournaments[name] = { players: [], pairStandings: {}, individualStandings: {}, matches: [] };
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    console.log('Torneo creado:', tournaments[name]);
    switchToTournamentPage();
    updateTournamentList();
    document.getElementById('tournamentName').value = '';
}

function loadTournament(name) {
    console.log('Cargando torneo:', name);
    currentTournament = name;
    const tournamentData = tournaments[name];
    players = tournamentData.players || [];
    pairStandings = tournamentData.pairStandings || {};
    individualStandings = tournamentData.individualStandings || {};
    switchToTournamentPage();
    updatePlayerSelects();
    updateStandings();
    updateMatchHistory();
    updatePlayerList();
}

function deleteTournament(name) {
    if (confirm(`¿Seguro que quieres eliminar el torneo "${name}"?`)) {
        delete tournaments[name];
        localStorage.setItem('tournaments', JSON.stringify(tournaments));
        updateTournamentList();
    }
}

function switchToTournamentPage() {
    console.log('Cambiando a página del torneo:', currentTournament);
    const mainPage = document.getElementById('mainPage');
    const tournamentPage = document.getElementById('tournamentPage');
    if (mainPage && tournamentPage) {
        mainPage.classList.add('hidden');
        tournamentPage.classList.remove('hidden');
        document.getElementById('currentTournamentName').textContent = currentTournament;
    } else {
        console.error('No se encontraron los elementos mainPage o tournamentPage');
    }
}

function backToMain() {
    console.log('Volviendo a página principal');
    document.getElementById('tournamentPage').classList.add('hidden');
    document.getElementById('mainPage').classList.remove('hidden');
    updateTournamentList();
}

function updateTournamentList() {
    const list = document.getElementById('tournamentList');
    list.innerHTML = '';
    Object.keys(tournaments).forEach(name => {
        const li = document.createElement('li');
        li.innerHTML = `
            <a href="#" onclick="loadTournament('${name}')">${name}</a>
            <button class="delete-btn" onclick="deleteTournament('${name}')">Eliminar</button>
        `;
        list.appendChild(li);
    });
}

function addPlayer() {
    const playerName = document.getElementById('playerInput').value.trim();
    if (!playerName) {
        alert('Ingresa un nombre para el jugador.');
        return;
    }
    if (players.includes(playerName)) {
        alert('Este jugador ya fue agregado.');
        return;
    }
    players.push(playerName);
    tournaments[currentTournament].players = players;
    if (!individualStandings[playerName]) {
        individualStandings[playerName] = { points: 0, wins: 0, losses: 0 };
    }
    tournaments[currentTournament].individualStandings = individualStandings;
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    updatePlayerSelects();
    updatePlayerList();
    document.getElementById('playerInput').value = '';
}

function updatePlayerList() {
    const playerList = document.getElementById('playerList');
    playerList.innerHTML = '';
    players.forEach(player => {
        const li = document.createElement('li');
        li.textContent = player;
        playerList.appendChild(li);
    });
}

function updatePlayerSelects() {
    const selects = [document.getElementById('player1a'), document.getElementById('player1b'),
                    document.getElementById('player2a'), document.getElementById('player2b')];
    selects.forEach(select => {
        select.innerHTML = '<option value="">Seleccionar</option>';
        players.forEach(player => {
            const option = document.createElement('option');
            option.value = player;
            option.text = player;
            select.add(option);
        });
    });
}

function addMatch() {
    const player1a = document.getElementById('player1a').value;
    const player1b = document.getElementById('player1b').value;
    const player2a = document.getElementById('player2a').value;
    const player2b = document.getElementById('player2b').value;
    const sets1 = [
        parseInt(document.getElementById('set1a').value || 0),
        parseInt(document.getElementById('set2a').value || 0),
        parseInt(document.getElementById('set3a').value || 0)
    ];
    const sets2 = [
        parseInt(document.getElementById('set1b').value || 0),
        parseInt(document.getElementById('set2b').value || 0),
        parseInt(document.getElementById('set3b').value || 0)
    ];
    const matchDate = document.getElementById('matchDate').value;

    if (!player1a || !player1b || !player2a || !player2b) {
        alert('Selecciona todos los jugadores.');
        return;
    }
    if (player1a === player1b || player2a === player2b || 
        [player1a, player1b].includes(player2a) || [player1a, player1b].includes(player2b)) {
        alert('Los jugadores deben ser distintos y no repetirse entre parejas.');
        return;
    }
    if (sets1.some(s => s > 7) || sets2.some(s => s > 7)) {
        alert('Los sets no pueden superar 7 juegos.');
        return;
    }
    if (!matchDate) {
        alert('Ingresa una fecha para el partido.');
        return;
    }

    const pair1 = `${player1a}-${player1b}`;
    const pair2 = `${player2a}-${player2b}`;
    const setsWon1 = sets1.filter((s, i) => s > sets2[i]).length;
    const setsWon2 = sets2.filter((s, i) => s > sets1[i]).length;

    if (!pairStandings[pair1]) pairStandings[pair1] = { points: 0, wins: 0, losses: 0 };
    if (!pairStandings[pair2]) pairStandings[pair2] = { points: 0, wins: 0, losses: 0 };

    if (setsWon1 > setsWon2) {
        pairStandings[pair1].points += 3;
        pairStandings[pair1].wins += 1;
        pairStandings[pair2].losses += 1;
        individualStandings[player1a].points += 3;
        individualStandings[player1a].wins += 1;
        individualStandings[player1b].points += 3;
        individualStandings[player1b].wins += 1;
        individualStandings[player2a].losses += 1;
        individualStandings[player2b].losses += 1;
    } else if (setsWon2 > setsWon1) {
        pairStandings[pair2].points += 3;
        pairStandings[pair2].wins += 1;
        pairStandings[pair1].losses += 1;
        individualStandings[player2a].points += 3;
        individualStandings[player2a].wins += 1;
        individualStandings[player2b].points += 3;
        individualStandings[player2b].wins += 1;
        individualStandings[player1a].losses += 1;
        individualStandings[player1b].losses += 1;
    }

    tournaments[currentTournament].matches.push({
        pair1, 
        pair2, 
        sets1, 
        sets2, 
        date: matchDate
    });
    tournaments[currentTournament].pairStandings = pairStandings;
    tournaments[currentTournament].individualStandings = individualStandings;
    localStorage.setItem('tournaments', JSON.stringify(tournaments));
    updateStandings();
    updateMatchHistory();

    document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');
    document.getElementById('matchDate').value = '';
}

function editMatch(index) {
    const password = prompt("Ingresa la contraseña de administrador:");
    if (password !== adminPassword) {
        alert("Contraseña incorrecta. Solo el administrador puede editar partidos.");
        return;
    }

    const match = tournaments[currentTournament].matches[index];
    const oldPair1 = match.pair1.split('-');
    const oldPair2 = match.pair2.split('-');
    const oldSets1 = match.sets1;
    const oldSets2 = match.sets2;

    const setsWon1 = oldSets1.filter((s, i) => s > oldSets2[i]).length;
    const setsWon2 = oldSets2.filter((s, i) => s > oldSets1[i]).length;
    if (setsWon1 > setsWon2) {
        pairStandings[match.pair1].points -= 3;
        pairStandings[match.pair1].wins -= 1;
        pairStandings[match.pair2].losses -= 1;
        individualStandings[oldPair1[0]].points -= 3;
        individualStandings[oldPair1[0]].wins -= 1;
        individualStandings[oldPair1[1]].points -= 3;
        individualStandings[oldPair1[1]].wins -= 1;
        individualStandings[oldPair2[0]].losses -= 1;
        individualStandings[oldPair2[1]].losses -= 1;
    } else if (setsWon2 > setsWon1) {
        pairStandings[match.pair2].points -= 3;
        pairStandings[match.pair2].wins -= 1;
        pairStandings[match.pair1].losses -= 1;
        individualStandings[oldPair2[0]].points -= 3;
        individualStandings[oldPair2[0]].wins -= 1;
        individualStandings[oldPair2[1]].points -= 3;
        individualStandings[oldPair2[1]].wins -= 1;
        individualStandings[oldPair1[0]].losses -= 1;
        individualStandings[oldPair1[1]].losses -= 1;
    }

    document.getElementById('player1a').value = oldPair1[0];
    document.getElementById('player1b').value = oldPair1[1];
    document.getElementById('player2a').value = oldPair2[0];
    document.getElementById('player2b').value = oldPair2[1];
    document.getElementById('set1a').value = oldSets1[0];
    document.getElementById('set2a').value = oldSets1[1];
    document.getElementById('set3a').value = oldSets1[2];
    document.getElementById('set1b').value = oldSets2[0];
    document.getElementById('set2b').value = oldSets2[1];
    document.getElementById('set3b').value = oldSets2[2];
    document.getElementById('matchDate').value = match.date;

    tournaments[currentTournament].matches.splice(index, 1);
    addMatch();
}

function updateStandings() {
    const pairBody = document.getElementById('pairStandingsBody');
    pairBody.innerHTML = '';
    const sortedPairs = Object.keys(pairStandings).sort((a, b) => pairStandings[b].points - pairStandings[a].points);
    sortedPairs.forEach(pair => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${pair}</td>
            <td>${pairStandings[pair].points}</td>
            <td>${pairStandings[pair].wins}</td>
            <td>${pairStandings[pair].losses}</td>
        `;
        pairBody.appendChild(row);
    });

    const individualBody = document.getElementById('individualStandingsBody');
    individualBody.innerHTML = '';
    const sortedPlayers = Object.keys(individualStandings).sort((a, b) => individualStandings[b].points - individualStandings[a].points);
    sortedPlayers.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player}</td>
            <td>${individualStandings[player].points}</td>
            <td>${individualStandings[player].wins}</td>
            <td>${individualStandings[player].losses}</td>
        `;
        individualBody.appendChild(row); // Corregido: ahora usa individualBody
    });
}

function updateMatchHistory() {
    const matchList = document.getElementById('matchHistory');
    matchList.innerHTML = `
        <table class="scoreboard-table">
            <thead>
                <tr>
                    <th>Fecha</th>
                    <th>Parejas y Resultado</th>
                    <th>Acción</th>
                </tr>
            </thead>
            <tbody id="matchHistoryBody"></tbody>
        </table>
    `;
    const matchBody = document.getElementById('matchHistoryBody');
    const matches = tournaments[currentTournament].matches || [];
    matches.sort((a, b) => new Date(b.date) - new Date(a.date));
    matches.forEach((match, index) => {
        const row = document.createElement('tr');
        const formattedDate = new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td class="match-details">
                <div class="pair-score">
                    <span class="pair-name">${match.pair1}</span>
                    <span class="sets">${match.sets1.join(' ')}</span>
                </div>
                <div class="vs">vs</div>
                <div class="pair-score">
                    <span class="pair-name">${match.pair2}</span>
                    <span class="sets">${match.sets2.join(' ')}</span>
                </div>
            </td>
            <td><button class="edit-btn" onclick="editMatch(${index})">Editar</button></td>
        `;
        matchBody.appendChild(row);
    });
}