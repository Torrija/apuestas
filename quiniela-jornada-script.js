document.addEventListener('DOMContentLoaded', () => {
    const jornadaNumberElem = document.getElementById('jornadaNumber');
    const jornadaNumberBetsElem = document.getElementById('jornadaNumberBets');
    const matchesTableBody = document.getElementById('matchesTableBody');
    const totalCorrectMatchesElem = document.getElementById('totalCorrectMatches');
    const pleno15CorrectElem = document.getElementById('pleno15Correct');
    const userPredictionElem = document.getElementById('userPrediction');
    const coincidenceSummaryElem = document.getElementById('coincidenceSummary'); // Este ahora solo tiene un texto introductorio
    const peñaBetsList = document.getElementById('peñaBetsList');

    // Elementos del gráfico de probabilidades
    const probabilityTypeSelect = document.getElementById('probabilityType');
    const probabilityChartCanvas = document.getElementById('probabilityChart');
    const probabilityChartMessage = document.getElementById('probabilityChartMessage');

    let jornadaData = null; // Datos de los partidos de la jornada
    let peñaBets = [];    // Apuestas de la peña (array de arrays de 16 elementos)
    // userSelections: array de 16 elementos [14 partidos, Pleno15Local, Pleno15Visitante]
    let userSelections = Array(16).fill(null);
    let myProbabilityChart; // Instancia del gráfico de probabilidades

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
        calculateAndRenderProbabilityChart(); // Llamar a la función del gráfico
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
                    combinedPredictionHtml += `<span class="${pleno15LocalStatus === 'correct' ? 'bet-pleno15-highlight' : (pleno15LocalStatus === 'unselected' ? 'bet-result-unselected' : 'bet-result-incorrect')}">${pleno15LocalPick}</span>`;
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

    // --- Lógica del Gráfico de Probabilidades ---
    function calculateAndRenderProbabilityChart() {
        const userPicksMadeCount = userSelections.slice(0, 14).filter(s => s !== null).length;
        const probabilityType = probabilityTypeSelect.value; // 'probables', 'jugados', 'lae'

        if (userPicksMadeCount === 0) {
            probabilityChartMessage.style.display = 'block'; // Mostrar mensaje
            if (myProbabilityChart) {
                myProbabilityChart.destroy(); // Destruir gráfico si no hay selecciones
                myProbabilityChart = null;
            }
            return;
        } else {
            probabilityChartMessage.style.display = 'none'; // Ocultar mensaje
        }

        // Los labels de los datasets deben coincidir con las propiedades en jornadaData.matches
        const labels = ['jugados', 'lae', 'probables']; // Nombres de las propiedades en el JSON
        const labelsDisplay = ['Jugados', 'LAE', 'Probables']; // Nombres para mostrar en el gráfico
        const datasets = [];

        // Datos para las barras apiladas (Min vs Max)
        const minProbsForType = {}; // Producto de las probabilidades mínimas
        const maxProbsForType = {}; // Producto de las probabilidades máximas
        const userProbsForType = {}; // Producto de las probabilidades de los picks del usuario

        labels.forEach(type => { // type será 'jugados', 'lae', 'probables'
            minProbsForType[type] = 1;
            maxProbsForType[type] = 1;
            userProbsForType[type] = 1;

            jornadaData.matches.slice(0, 14).forEach((match, index) => { // Solo partidos 1-14
                const userPick = userSelections[index];
                if (userPick !== null) {
                    // Acceder a las probabilidades usando match[type][userPick]
                    // Las propiedades en el JSON son '1', 'X', '2'
                    const userPickProb = (match[type][userPick] || 0) / 100; // CORRECCIÓN AQUÍ: match[type] directamente
                    userProbsForType[type] *= userPickProb;

                    // Probabilidad mínima y máxima para este partido
                    const probs = [
                        (match[type]['1'] || 0) / 100,
                        (match[type]['X'] || 0) / 100,
                        (match[type]['2'] || 0) / 100
                    ];
                    const minProb = Math.min(...probs.filter(p => p > 0)); // Filtrar 0s para evitar Math.min de []
                    const maxProb = Math.max(...probs.filter(p => p > 0));

                    minProbsForType[type] *= minProb;
                    maxProbsForType[type] *= maxProb;
                }
            });
        });

        // Dataset para las barras de probabilidades mínimas
        datasets.push({
            label: 'Probabilidad Mínima',
            data: labels.map(type => (minProbsForType[type] * 100).toFixed(6)), // Convertir a porcentaje y redondear
            backgroundColor: '#004D99', // Azul oscuro
            borderColor: '#004D99',
            borderWidth: 1,
            stack: 'combinedBars' // Apilar en el mismo grupo
        });

        // Dataset para la diferencia (Máxima - Mínima)
        datasets.push({
            label: 'Rango Restante',
            data: labels.map(type => {
                const diff = (maxProbsForType[type] - minProbsForType[type]) * 100;
                return diff > 0 ? diff.toFixed(6) : 0; // Asegurar que no sea negativo y redondear
            }),
            backgroundColor: '#3498db', // Azul más claro
            borderColor: '#3498db',
            borderWidth: 1,
            stack: 'combinedBars' // Apilar en el mismo grupo
        });

        // Dataset para la línea (Producto de tu Pronóstico)
        datasets.push({
            type: 'line',
            label: 'Tu Pronóstico', // Etiqueta genérica, el callback del tooltip lo hace específico
            data: labels.map(type => {
                // Si este es el tipo seleccionado en el dropdown, usa el valor, si no, usa NaN
                return type === probabilityType ? (userProbsForType[type] * 100).toFixed(6) : NaN;
            }),
            borderColor: '#f7921a', // Naranja/Amarillo
            borderWidth: 3,
            fill: false,
            tension: 0, // Línea recta
            pointRadius: 5,
            pointBackgroundColor: '#f7921a',
            yAxisID: 'y' // Usar el mismo eje Y
        });


        if (myProbabilityChart) {
            myProbabilityChart.destroy();
        }

        myProbabilityChart = new Chart(probabilityChartCanvas, {
            type: 'bar', // Tipo base es barra
            data: {
                labels: labelsDisplay, // Usar los labels para mostrar
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Probabilidad Combinada de Signos Seleccionados (Jornada 1-14)',
                        font: { size: 16 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += parseFloat(context.parsed.y).toFixed(4) + '%'; // Asegurar formato de porcentaje
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            filter: function(item, chart) {
                                // Ocultar el label de la línea si no es el tipo seleccionado en el dropdown
                                // El índice del dataset de la línea es 2
                                if (item.datasetIndex === 2) { 
                                    const datasetLabels = chart.data.labels;
                                    const selectedTypeDisplayLabel = labelsDisplay[labels.indexOf(probabilityType)];
                                    return item.text === 'Tu Pronóstico'; // Siempre mostrar "Tu Pronóstico"
                                }
                                return true;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true, // Apilar barras en el eje X
                        title: {
                            display: true,
                            text: 'Tipo de Análisis'
                        }
                    },
                    y: {
                        stacked: true, // Apilar en el eje Y también para que las barras se apilen
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Probabilidad (%)'
                        },
                        max: 100, // Escala de 0 a 100 para porcentaje
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Ajustar el color de la leyenda de la línea para que coincida con el color de la línea
        if (myProbabilityChart && myProbabilityChart.options.plugins.legend && myProbabilityChart.options.plugins.legend.labels) {
            myProbabilityChart.options.plugins.legend.labels.generateLabels = function(chart) {
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                // Encontrar el label del dataset de la línea (índice 2) y cambiar su color de punto
                if (labels[2]) { // Asegurarse de que el label de la línea existe
                    labels[2].fillStyle = '#f7921a'; // El color de tu línea
                }
                return labels;
            };
            myProbabilityChart.update(); // Actualizar el gráfico para que la leyenda se repinte
        }
    }    // --- Lógica del Gráfico de Probabilidades ---
    function calculateAndRenderProbabilityChart() {
        const userPicksMadeCount = userSelections.slice(0, 14).filter(s => s !== null).length;
        const probabilityType = probabilityTypeSelect.value; // 'probables', 'jugados', 'lae'

        if (userPicksMadeCount === 0) {
            probabilityChartMessage.style.display = 'block'; // Mostrar mensaje
            if (myProbabilityChart) {
                myProbabilityChart.destroy(); // Destruir gráfico si no hay selecciones
                myProbabilityChart = null;
            }
            return;
        } else {
            probabilityChartMessage.style.display = 'none'; // Ocultar mensaje
        }

        // Los labels de los datasets deben coincidir con las propiedades en jornadaData.matches
        const labels = ['jugados', 'lae', 'probables']; // Nombres de las propiedades en el JSON
        const labelsDisplay = ['Jugados', 'LAE', 'Probables']; // Nombres para mostrar en el gráfico
        const datasets = [];

        // Datos para las barras apiladas (Min vs Max)
        const minProbsForType = {}; // Producto de las probabilidades mínimas
        const maxProbsForType = {}; // Producto de las probabilidades máximas
        const userProbsForType = {}; // Producto de las probabilidades de los picks del usuario

        labels.forEach(type => { // type será 'jugados', 'lae', 'probables'
            minProbsForType[type] = 1;
            maxProbsForType[type] = 1;
            userProbsForType[type] = 1;

            jornadaData.matches.slice(0, 14).forEach((match, index) => { // Solo partidos 1-14
                const userPick = userSelections[index];
                if (userPick !== null) {
                    // Acceder a las probabilidades usando match[type][userPick]
                    // Las propiedades en el JSON son '1', 'X', '2'
                    const userPickProb = (match[type][userPick] || 0) / 100;
                    userProbsForType[type] *= userPickProb;

                    // Probabilidad mínima y máxima para este partido
                    const probs = [
                        (match[type]['1'] || 0) / 100,
                        (match[type]['X'] || 0) / 100,
                        (match[type]['2'] || 0) / 100
                    ];
                    // Filtrar 0s antes de min/max para evitar problemas si todas las probs son 0
                    const validProbs = probs.filter(p => p > 0); 
                    const minProb = validProbs.length > 0 ? Math.min(...validProbs) : 0;
                    const maxProb = validProbs.length > 0 ? Math.max(...validProbs) : 0;

                    minProbsForType[type] *= minProb;
                    maxProbsForType[type] *= maxProb;
                }
            });
        });

        // Dataset para las barras de probabilidades mínimas
        datasets.push({
            label: 'Probabilidad Mínima',
            data: labels.map(type => (minProbsForType[type] * 100).toFixed(6)), // Convertir a porcentaje y redondear
            backgroundColor: '#004D99', // Azul oscuro
            borderColor: '#004D99',
            borderWidth: 1,
            stack: 'combinedBars' // Apilar en el mismo grupo
        });

        // Dataset para la diferencia (Máxima - Mínima)
        datasets.push({
            label: 'Rango Restante',
            data: labels.map(type => {
                const diff = (maxProbsForType[type] - minProbsForType[type]) * 100;
                return diff > 0 ? diff.toFixed(6) : 0; // Asegurar que no sea negativo y redondear
            }),
            backgroundColor: '#3498db', // Azul más claro
            borderColor: '#3498db',
            borderWidth: 1,
            stack: 'combinedBars' // Apilar en el mismo grupo
        });

        // Dataset para la línea (Producto de tu Pronóstico)
        datasets.push({
            type: 'line',
            label: 'Tu Pronóstico', // Etiqueta genérica
            data: labels.map(type => {
                // Solo mostrar la línea para el tipo seleccionado en el dropdown, otros NaN
                return type === probabilityType ? (userProbsForType[type] * 100).toFixed(6) : NaN;
            }),
            borderColor: '#f7921a', // Naranja/Amarillo
            borderWidth: 3,
            fill: false,
            tension: 0, // Línea recta
            pointRadius: 5,
            pointBackgroundColor: '#f7921a',
            yAxisID: 'y' // Usar el mismo eje Y
        });


        if (myProbabilityChart) {
            myProbabilityChart.destroy();
        }

        myProbabilityChart = new Chart(probabilityChartCanvas, {
            type: 'bar', // Tipo base es barra
            data: {
                labels: labelsDisplay, // Usar los labels para mostrar
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Probabilidad Combinada de Signos Seleccionados (Jornada 1-14)',
                        font: { size: 16 }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += parseFloat(context.parsed.y).toFixed(4) + '%'; // Asegurar formato de porcentaje
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        position: 'top',
                        labels: {
                            filter: function(item, chart) {
                                // Muestra las etiquetas de las barras y la etiqueta de la línea
                                // La línea (índice 2) siempre tiene la etiqueta 'Tu Pronóstico'
                                // Las barras (índice 0 y 1) tienen 'Probabilidad Mínima' y 'Rango Restante'
                                return item.datasetIndex === 0 || item.datasetIndex === 1 || item.datasetIndex === 2;
                            },
                            // No necesitamos generateLabels customizado si el color ya viene en el dataset
                            // Si el color del punto de la línea no es el correcto, se puede añadir:
                            // usePointStyle: true
                        }
                    }
                },
                scales: {
                    x: {
                        stacked: true, // Apilar barras en el eje X
                        title: {
                            display: true,
                            text: 'Tipo de Análisis'
                        }
                    },
                    y: {
                        stacked: true, // Apilar en el eje Y también para que las barras se apilen
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Probabilidad (%)'
                        },
                        max: 100, // Escala de 0 a 100 para porcentaje
                        ticks: {
                            callback: function(value) {
                                return value + '%';
                            }
                        }
                    }
                }
            }
        });
        
        // Código para asegurar que el punto de la leyenda de la línea tenga el color correcto
        // Esto a veces es necesario si Chart.js no aplica bien el color por defecto al punto de la leyenda
        if (myProbabilityChart && myProbabilityChart.options.plugins.legend && myProbabilityChart.options.plugins.legend.labels) {
            myProbabilityChart.options.plugins.legend.labels.generateLabels = function(chart) {
                const labels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                // Encuentra el label del dataset de la línea (índice 2) y ajusta su color de punto
                if (labels[2]) { // Asegúrate de que el label de la línea existe
                    labels[2].fillStyle = chart.data.datasets[2].borderColor; // Usar el borderColor del dataset como color de punto
                }
                return labels;
            };
            myProbabilityChart.update(); // Actualizar el gráfico para que la leyenda se repinte
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
            
            // Añadir listener al selector de tipo de probabilidad
            probabilityTypeSelect.addEventListener('change', calculateAndRenderProbabilityChart);

            calculateAndDisplayPeñaResults(); // Inicializar con resultados de la peña (sin aciertos al principio)
            calculateAndRenderProbabilityChart(); // Inicializar el gráfico

        } catch (error) {
            console.error("Error al cargar los datos de la Quiniela:", error);
            matchesTableBody.innerHTML = '<tr><td colspan="4" class="loading-message error-message">Error al cargar los datos de la Quiniela.</td></tr>';
            peñaBetsList.innerHTML = '<p class="loading-message error-message">Error al cargar las apuestas de la peña.</p>';
            probabilityChartMessage.textContent = 'Error al cargar los datos de la jornada para el gráfico.';
            probabilityChartMessage.style.display = 'block';
        }
    }

    // Iniciar la aplicación de la página de Quiniela
    initializeQuinielaPage();
});