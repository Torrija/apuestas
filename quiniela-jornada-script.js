document.addEventListener('DOMContentLoaded', () => {
    const jornadaNumberElem = document.getElementById('jornadaNumber');
    const jornadaNumberBetsElem = document.getElementById('jornadaNumberBets');
    const matchesTableBody = document.getElementById('matchesTableBody');
    const totalCorrectMatchesElem = document.getElementById('totalCorrectMatches');
    const pleno15CorrectElem = document.getElementById('pleno15Correct');
    const userPredictionElem = document.getElementById('userPrediction');
    const coincidenceSummaryElem = document.getElementById('coincidenceSummary'); // Este ahora solo tiene un texto introductorio
    const peñaBetsList = document.getElementById('peñaBetsList');

    let jornadaData = null; // Datos de los partidos de la jornada
    let peñaBets = [];    // Apuestas de la peña (array de arrays de 16 elementos)
    // userSelections: array de 16 elementos [14 partidos, Pleno15Local, Pleno15Visitante]
    let userSelections = Array(16).fill(null);

    // --- Funciones de Utilidad ---

    // Función para limpiar la tabla de partidos
    function clearMatchesTable() {
        matchesTableBody.innerHTML = '<tr><td colspan="4" class="loading-message">Cargando partidos...</td></tr>';
    }

    // Función para actualizar el resumen del pronóstico del usuario
    function updateUserPredictionDisplay() {
        const mainPicks = userSelections.slice(0, 14).map(s => s === null ? '-' : s).join('');
        const pleno15Picks = (userSelections[14] !== null && userSelections[15] !== null) ?
                              `<span class="pleno15-user-scores">(${userSelections[14]}-${userSelections[15]})</span>` : '';
        userPredictionElem.innerHTML = mainPicks + pleno15Picks;
    }

    /**
     * Compara la selección del usuario con una apuesta de la peña.
     * Calcula aciertos solo para los partidos donde el usuario ha hecho una selección.
     */
    function compareBets(userPicks, peñaBet) {
        let correctMatches = 0;
        let pleno15Correct = false;
        let userPicksMadeCount = 0; // Cuántos picks ha hecho el usuario en 1-14

        let matchesDetail = []; // Para resaltar aciertos y no seleccionados

        for (let i = 0; i < 14; i++) { // Partidos del 1 al 14
            if (userPicks[i] !== null) {
                userPicksMadeCount++;
                if (userPicks[i] === peñaBet[i]) {
                    correctMatches++;
                    matchesDetail.push({ pick: peñaBet[i], status: 'correct' });
                } else {
                    matchesDetail.push({ pick: peñaBet[i], status: 'incorrect' });
                }
            } else {
                matchesDetail.push({ pick: peñaBet[i], status: 'unselected' }); // Marcar como no seleccionado por el usuario
            }
        }

        // Pleno al 15 (Partido 15: local y visitante)
        // Solo se considera acertado si AMBAS partes han sido seleccionadas por el usuario y coinciden
        if (userPicks[14] !== null && userPicks[15] !== null &&
            userPicks[14] === peñaBet[14] && userPicks[15] === peñaBet[15]) {
            pleno15Correct = true;
        }

        // Para el Pleno al 15 en matchesDetail
        matchesDetail.push({ pick: peñaBet[14], status: (userPicks[14] !== null && userPicks[14] === peñaBet[14]) ? 'correct' : ((userPicks[14] === null) ? 'unselected' : 'incorrect') });
        matchesDetail.push({ pick: peñaBet[15], status: (userPicks[15] !== null && userPicks[15] === peñaBet[15]) ? 'correct' : ((userPicks[15] === null) ? 'unselected' : 'incorrect') });


        return { correctMatches, pleno15Correct, userPicksMadeCount, matchesDetail };
    }


    // --- Funciones de Renderizado ---

    // Renderiza la tabla de partidos y los botones de selección
    function renderMatchesTable(data) {
        jornadaNumberElem.textContent = data.jornada_number;
        jornadaNumberBetsElem.textContent = data.jornada_number;
        matchesTableBody.innerHTML = ''; // Limpiar mensaje de carga

        data.matches.forEach((match, index) => {
            const row = document.createElement('tr');
            let selectionButtonsHtml = '';

            if (index < 14) { // Partidos 1-14 (1X2)
                selectionButtonsHtml = `
                    <div class="selection-buttons-group" data-match-id="${match.id}">
                        <button class="selection-button" data-pick="1">1</button>
                        <button class="selection-button" data-pick="X">X</button>
                        <button class="selection-button" data-pick="2">2</button>
                    </div>
                `;
            } else { // Partido 15 (Pleno al 15 - Goles)
                selectionButtonsHtml = `
                    <div class="pleno15-selection">
                        <div class="score-group">
                            <label>${match.home_team}</label>
                            <div class="score-buttons-group" data-match-id="${match.id}" data-team="home">
                                <button class="selection-button" data-pick="0">0</button>
                                <button class="selection-button" data-pick="1">1</button>
                                <button class="selection-button" data-pick="2">2</button>
                                <button class="selection-button" data-pick="M">M</button>
                            </div>
                        </div>
                        <div class="score-group">
                            <label>${match.away_team}</label>
                            <div class="score-buttons-group" data-match-id="${match.id}" data-team="away">
                                <button class="selection-button" data-pick="0">0</button>
                                <button class="selection-button" data-pick="1">1</button>
                                <button class="selection-button" data-pick="2">2</button>
                                <button class="selection-button" data-pick="M">M</button>
                            </div>
                        </div>
                    </div>
                `;
            }

            row.innerHTML = `
                <td>${match.id}</td>
                <td>${match.home_team} - ${match.away_team}</td>
                <td>${match.day_time}</td>
                <td>${selectionButtonsHtml}</td>
            `;
            matchesTableBody.appendChild(row);
        });

        // Añadir listeners a todos los botones de selección
        matchesTableBody.querySelectorAll('.selection-button').forEach(button => {
            button.addEventListener('click', handleSelectionClick);
        });
    }

    // Manejador de clic para botones de selección
    function handleSelectionClick(event) {
        const button = event.target.closest('.selection-button'); // Asegura que el click sea en el botón
        if (!button) return;

        const pick = button.dataset.pick;
        const matchId = parseInt(button.closest('[data-match-id]').dataset.matchId);
        const team = button.closest('[data-team]') ? button.closest('[data-team]').dataset.team : null;

        // Desactivar selecciones previas en el mismo grupo
        let parentGroup;
        if (team) { // Pleno al 15
            parentGroup = button.closest('.score-buttons-group');
            if (team === 'home') {
                userSelections[14] = pick;
            } else if (team === 'away') {
                userSelections[15] = pick;
            }
        } else { // Partidos 1-14
            parentGroup = button.closest('.selection-buttons-group');
            userSelections[matchId - 1] = pick;
        }

        parentGroup.querySelectorAll('.selection-button').forEach(btn => {
            btn.classList.remove('selected');
        });
        button.classList.add('selected');

        updateUserPredictionDisplay();
        calculateAndDisplayPeñaResults();
    }


    // Calcula y muestra los resultados de las apuestas de la peña
    function calculateAndDisplayPeñaResults() {
        const userPicksMadeCount = userSelections.slice(0, 14).filter(s => s !== null).length;

        if (userPicksMadeCount === 0) {
            totalCorrectMatchesElem.innerHTML = `
                <h3>Aciertos Signos (1X2)</h3>
                <p>Selecciona partidos para ver el desglose.</p>
            `;
            pleno15CorrectElem.textContent = '--';
            peñaBetsList.innerHTML = '<p class="loading-message">Selecciona los resultados de los partidos para ver las coincidencias.</p>';
            coincidenceSummaryElem.textContent = 'Apuestas de la Peña agrupadas por aciertos:';
            return;
        }

        let betsWithResults = [];
        let aciertosDistribution = {}; // Almacenará { 'numAciertos': [betResult1, betResult2, ...] }

        peñaBets.forEach((peñaBet, index) => {
            const { correctMatches, pleno15Correct, matchesDetail } = compareBets(userSelections, peñaBet);
            
            const betResult = {
                originalBet: peñaBet,
                correctMatches, // Aciertos sobre userPicksMadeCount
                pleno15Correct,
                matchesDetail,
                id: `bet_${index}` // ID para identificar la apuesta
            };
            betsWithResults.push(betResult);

            // Agrupar apuestas por número de aciertos
            if (!aciertosDistribution[correctMatches]) {
                aciertosDistribution[correctMatches] = [];
            }
            aciertosDistribution[correctMatches].push(betResult);
        });

        // --- Actualizar el resumen del pronóstico del usuario (Aciertos (1-14) card) ---
        let aciertosTableHtml = `
            <h3>Aciertos Signos (1X2)</h3>
            <table class="aciertos-summary-table">
                <thead>
                    <tr>
                        <th>S.</th>
                        <th>Aciertos</th>
                        <th>Nº Ap.</th>
                        <th>%</th>
                    </tr>
                </thead>
                <tbody>
        `;
        const totalApuestas = peñaBets.length;
        const sortedAciertosKeys = Object.keys(aciertosDistribution).map(Number).sort((a, b) => b - a); // Ordenar de más a menos aciertos
        
        sortedAciertosKeys.forEach(numAciertos => {
            const count = aciertosDistribution[numAciertos].length;
            const percentage = ((count / totalApuestas) * 100).toFixed(2); // Formatear a 2 decimales
            aciertosTableHtml += `
                <tr>
                    <td>${userPicksMadeCount}</td>
                    <td>${numAciertos}</td>
                    <td>${count}</td>
                    <td>${percentage}%</td>
                </tr>
            `;
        });
        aciertosTableHtml += `
                </tbody>
            </table>
        `;
        totalCorrectMatchesElem.innerHTML = aciertosTableHtml;


        // --- Actualizar Pleno al 15 ---
        const userPleno15Completed = userSelections[14] !== null && userSelections[15] !== null;
        let pleno15BetsCount = 0;
        let pleno15StatusIcon = '<i class="fas fa-question-circle"></i>'; // Icono por defecto (no completado)

        if (userPleno15Completed) {
            pleno15BetsCount = betsWithResults.filter(b => b.pleno15Correct).length;
            // Para la tarjeta principal del pleno al 15, indicamos si el pleno al 15 del usuario es 'correcto' para alguna apuesta de la peña
            if (pleno15BetsCount > 0) {
                 pleno15StatusIcon = '<i class="fas fa-trophy"></i>'; // Trofeo si al menos una lo acierta
            } else {
                 pleno15StatusIcon = '<i class="fas fa-times-circle"></i>'; // Cruz si ninguna lo acierta
            }
            pleno15CorrectElem.innerHTML = `${pleno15BetsCount} de ${peñaBets.length} ${pleno15StatusIcon}`;
        } else {
            pleno15CorrectElem.textContent = '--';
        }
        
        // --- Actualizar la sección de Apuestas de la Peña ---
        peñaBetsList.innerHTML = '';
        coincidenceSummaryElem.textContent = 'Apuestas de la Peña agrupadas por aciertos:';

        if (userPicksMadeCount === 0 && (!userPleno15Completed || pleno15BetsCount === 0)) { // Si no hay picks o no hay pleno completado
            peñaBetsList.innerHTML = '<p class="loading-message">Selecciona resultados para ver las apuestas de la peña.</p>';
        } else {
            // Mostrar los grupos de aciertos
            sortedAciertosKeys.forEach(numAciertos => {
                const group = aciertosDistribution[numAciertos]; // Array de betResults para este número de aciertos
                if (group.length === 0) return; // No renderizar grupos vacíos

                const groupContainer = document.createElement('div');
                groupContainer.className = 'peña-bet-group-card'; // Nueva clase para el contenedor de grupo

                const groupTitle = document.createElement('h3');
                groupTitle.innerHTML = `${numAciertos} Aciertos (${group.length} apuestas) <i class="fas fa-check-circle correct-icon-title"></i>`;
                groupContainer.appendChild(groupTitle);

                const betsInGroupContainer = document.createElement('div');
                betsInGroupContainer.className = 'bets-in-group';

                group.forEach(betResult => {
                    const betLine = document.createElement('p');
                    betLine.className = 'bet-combination-line'; // Nueva clase para cada línea de apuesta

                    let combinedPredictionHtml = '';
                    betResult.matchesDetail.forEach((detail, idx) => {
                        let className = '';
                        if (detail.status === 'correct') {
                            className = 'bet-result-highlight';
                        } else if (detail.status === 'unselected') {
                            className = 'bet-result-unselected';
                        } else {
                            className = 'bet-result-incorrect';
                        }

                        if (idx < 14) {
                            combinedPredictionHtml += `<span class="${className}">${detail.pick}</span>`;
                        }
                    });

                    // Añadir Pleno al 15 (usando los últimos dos elementos de matchesDetail)
                    const pleno15LocalStatus = betResult.matchesDetail[14].status;
                    const pleno15VisitantStatus = betResult.matchesDetail[15].status;
                    const pleno15LocalPick = betResult.matchesDetail[14].pick;
                    const pleno15VisitantPick = betResult.matchesDetail[15].pick;

                    combinedPredictionHtml += `<span class="pleno15-scores-display">`;
                    combinedPredictionHtml += `<span class="${pleno15LocalStatus === 'correct' ? 'bet-pleno15-highlight' : (pleno15LocalStatus === 'unselected' ? 'bet-result-unselected' : 'bet-result-incorrect')}">${pleno15LocalPick}</span>`; // CORRECCIÓN APLICADA AQUÍ
                    combinedPredictionHtml += `-`;
                    combinedPredictionHtml += `<span class="${pleno15VisitantStatus === 'correct' ? 'bet-pleno15-highlight' : (pleno15VisitantStatus === 'unselected' ? 'bet-result-unselected' : 'bet-result-incorrect')}">${pleno15VisitantPick}</span>`; 
                    combinedPredictionHtml += `</span>`;

                    // Iconos de Pleno al 15 al final de cada combinación
                    const pleno15Icon = betResult.pleno15Correct ? '<i class="fas fa-trophy pleno15-icon-correct"></i>' : '<i class="fas fa-times-circle pleno15-icon-incorrect"></i>';

                    betLine.innerHTML = `${combinedPredictionHtml} <span class="bet-icons-summary">${pleno15Icon}</span>`;
                    betsInGroupContainer.appendChild(betLine);
                });

                groupContainer.appendChild(betsInGroupContainer);
                peñaBetsList.appendChild(groupContainer);
            });
        }
    }


    // --- Inicialización ---

    async function initializeQuinielaPage() {
        clearMatchesTable(); // Mostrar mensaje de carga inicial

        try {
            // Cargar datos de los partidos de la jornada
            const jornadaResponse = await fetch('quiniela_jornada_66.json');
            if (!jornadaResponse.ok) throw new Error(`HTTP error! status: ${jornadaResponse.status} for quiniela_jornada_66.json`);
            jornadaData = await jornadaResponse.json();

            // Cargar apuestas de la peña
            const peñaBetsResponse = await fetch('quiniela_bets_jornada_66.json');
            if (!peñaBetsResponse.ok) throw new Error(`HTTP error! status: ${peñaBetsResponse.status} for quiniela_bets_jornada_66.json`);
            peñaBets = await peñaBetsResponse.json();

            renderMatchesTable(jornadaData);
            updateUserPredictionDisplay(); // Inicializar con pronóstico vacío
            calculateAndDisplayPeñaResults(); // Inicializar con resultados de la peña (sin aciertos al principio)

        } catch (error) {
            console.error("Error al cargar los datos de la Quiniela:", error);
            matchesTableBody.innerHTML = '<tr><td colspan="4" class="loading-message error-message">Error al cargar los datos de la Quiniela.</td></tr>';
            peñaBetsList.innerHTML = '<p class="loading-message error-message">Error al cargar las apuestas de la peña.</p>';
        }
    }

    // Iniciar la aplicación de la página de Quiniela
    initializeQuinielaPage();
});