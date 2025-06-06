document.addEventListener('DOMContentLoaded', () => {
    const betListContainer = document.getElementById('betList');
    const totalSpentElem = document.getElementById('totalSpent');
    const totalWonElem = document.getElementById('totalWon');
    const netBalanceElem = document.getElementById('netBalance');
    const filterGameSelect = document.getElementById('filterGame');
    const sortBySelect = document.getElementById('sortBy');
    const betsBreakdownChartCanvas = document.getElementById('betsBreakdownChart');
    let allBets = []; // Almacenará todas las apuestas cargadas

    // Mapeo de nombres de juegos a nombres de archivo de logos
    const gameLogoMap = {
        "LOTERIA PRIMITIVA": "logo_primitiva.png",
        "BONOLOTO": "logo_bonoloto.png",
        "QUINIELA": "logo_quiniela.png",
        "GORDO PRIMITIVA": "logo_gordoprimitiva.png",
        "LOTERIA NACIONAL": "logo_loteria.png", // Asumiendo este nombre para Lotería Nacional del Sábado
        "EUROMILLONES": "logo_euromillones.png",
        "LOT. NACIONAL JUEVES": "logo_loteria.png", // Asumiendo el mismo logo que Lotería Nacional
        "CUPONAZO": "logo_once.png", // Los cupones de ONCE no tienen logo de juego individual
        "CUPON DIARIO": "logo_once.png"
    };

    // Mapeo de fuentes a nombres de archivo de logos
    const sourceLogoMap = {
        "Loterias y Apuestas del Estado": "logo_loterias_y_apuestas_estado.png",
        "ONCE": "logo_once.png"
    };

    // --- Funciones de Utilidad ---

    // Formatea un número como moneda EUR
    function formatCurrency(amount) {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    }

    // Parsea la fecha de los tickets para poder ordenarla
    function parseDate(dateString) {
        // Ejemplo: "06 JUN 25" -> 2025-06-06
        const parts = dateString.split(' ');
        const day = parseInt(parts[0]);
        const monthMap = {
            'ENE': 0, 'FEB': 1, 'MAR': 2, 'ABR': 3, 'ABR.': 3, 'MAY': 4, 'JUN': 5,
            'JUL': 6, 'AGO': 7, 'SEP': 8, 'OCT': 9, 'NOV': 10, 'DIC': 11
        };
        const month = monthMap[parts[1].toUpperCase()];
        let year = parseInt(parts[2]);
        // Ajustar el año para el formato 'YY'
        if (year < 100) {
            year += 2000; // Asumimos 20XX
        }
        return new Date(year, month, day);
    }

    // --- Funciones de Renderizado ---

    function renderBets(betsToDisplay) {
        betListContainer.innerHTML = ''; // Limpiar la lista actual
        if (betsToDisplay.length === 0) {
            betListContainer.innerHTML = '<p class="loading-message">No hay apuestas que coincidan con los filtros.</p>';
            return;
        }

        betsToDisplay.forEach(bet => {
            const betCard = document.createElement('div');
            betCard.className = 'bet-card';

            const gameLogoSrc = gameLogoMap[bet.game] ? `images/${gameLogoMap[bet.game]}` : '';
            const sourceLogoSrc = sourceLogoMap[bet.source] ? `images/${sourceLogoMap[bet.source]}` : '';
            const amountClass = bet.type === 'venta' ? 'positive' : 'negative';
            const statusClass = bet.status;

            // Formatear la fecha del sorteo si existe
            // Algunas fechas pueden ser "06 JUN 2025" o "06 JUN 25"
            let drawDateDisplay = '';
            if (bet.draw_date) {
                try {
                    const formattedDate = parseDate(bet.draw_date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                    drawDateDisplay = `Sorteo: ${formattedDate}`;
                } catch (e) {
                    console.warn(`Could not parse draw_date for bet ${bet.id}: ${bet.draw_date}`);
                    drawDateDisplay = `Sorteo: ${bet.draw_date}`; // Fallback to raw string
                }
            }


            // Generar detalles específicos del juego o premio
            let detailsHtml = '';
            if (bet.type === 'venta') {
                if (bet.game === "LOTERIA PRIMITIVA" || bet.game === "BONOLOTO" || bet.game === "GORDO PRIMITIVA" || bet.game === "EUROMILLONES") {
                    if (bet.details && bet.details.numbers_per_bet) {
                        detailsHtml += `<h4>Números Jugados:</h4><ul>`;
                        bet.details.numbers_per_bet.forEach((nums, idx) => {
                            detailsHtml += `<li>Apuesta ${idx + 1}: <strong>${nums.join(' ')}</strong></li>`;
                        });
                        detailsHtml += `</ul>`;
                    } else {
                        detailsHtml += `<p><em>No se encontraron detalles de números para esta venta.</em></p>`;
                    }
                    if (bet.details && bet.details.reintegro !== undefined) {
                        detailsHtml += `<p>Reintegro: <strong>${bet.details.reintegro}</strong></p>`;
                    }
                    if (bet.details && bet.details.joker !== undefined) {
                        detailsHtml += `<p>Joker: <strong>${bet.details.joker}</strong></p>`;
                    }
                    if (bet.details && bet.details.el_millon_code) {
                        detailsHtml += `<p>El Millón: <strong>${bet.details.el_millon_code}</strong></p>`;
                    }
                } else if (bet.game === "QUINIELA") {
                    detailsHtml += `<h4>Pronósticos:</h4>`;
                    if (bet.details) {
                        detailsHtml += `<p>Número de Apuestas: <strong>${bet.details.bets_count}</strong></p>`;
                        detailsHtml += `<p>Pleno al 15: <strong>${bet.details.match_15_pick}</strong></p>`;
                        detailsHtml += `<p><em>(Detalle de la cuadrícula simplificado para visualización. Ver ticket original para detalle completo.)</em></p>`;
                    }
                } else if (bet.game.includes("LOTERIA NACIONAL")) {
                    detailsHtml += `<h4>Décimo:</h4>`;
                    if (bet.details) {
                        detailsHtml += `<p>Número: <strong>${bet.details.number}</strong></p>`;
                        detailsHtml += `<p>Serie: <strong>${bet.details.serie}</strong></p>`;
                        detailsHtml += `<p>Fracción: <strong>${bet.details.fraccion}</strong></p>`;
                        detailsHtml += `<p>Precio por décimo: <strong>${bet.details.price_per_decimo}</strong></p>`;
                    }
                } else if (bet.game.includes("CUPON")) {
                    detailsHtml += `<h4>Detalles del Cupón:</h4>`;
                    if (bet.details) {
                        detailsHtml += `<p>Número: <strong>${bet.details.number}</strong></p>`;
                        detailsHtml += `<p>Serie: <strong>${bet.details.serie}</strong></p>`;
                        detailsHtml += `<p>Premio Máx: <strong>${bet.details.max_prize}</strong></p>`;
                    }
                }
            } else if (bet.type === 'pago') { // Manejo de detalles para premios
                detailsHtml += `<h4>Detalles del Premio:</h4>`;
                if (bet.details) {
                    if (bet.details.won_bets !== undefined) {
                        detailsHtml += `<p>Apuestas Premiadas: <strong>${bet.details.won_bets}</strong></p>`;
                    }
                    if (bet.details.prize_source) {
                        detailsHtml += `<p>Origen: <strong>${bet.details.prize_source}</strong></p>`;
                    }
                    // Puedes añadir más detalles específicos para pagos aquí si la data.json lo permite
                    // Por ejemplo, para un premio de Primitiva, podrías mostrar la combinación ganadora si la tuvieras en el JSON
                }
            }


            betCard.innerHTML = `
                <div class="bet-card-header-logos">
                    ${gameLogoSrc ? `<img src="${gameLogoSrc}" alt="${bet.game} Logo" class="game-logo">` : ''}
                    ${sourceLogoSrc && bet.source !== 'ONCE' ? `<img src="${sourceLogoSrc}" alt="${bet.source} Logo" class="source-logo">` : ''}
                </div>
                <h3>${bet.game} <span class="amount ${amountClass}">${formatCurrency(bet.amount)}</span></h3>
                <p>Fecha Transacción: ${parseDate(bet.date_transaction).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p>
                ${drawDateDisplay ? `<p>${drawDateDisplay}</p>` : ''}
                <p class="status ${statusClass}">Estado: ${bet.status === 'pending' ? 'Pendiente' : 'Jugada/Premiada'}</p>
                <button class="details-toggle">Ver Detalles <i class="fas fa-chevron-down"></i></button>
                <div class="details-content">
                    ${detailsHtml}
                    ${bet.ticket_code ? `<p>Código Ticket: <small>${bet.ticket_code}</small></p>` : ''}
                </div>
            `;
            betListContainer.appendChild(betCard);

            // Añadir evento para expandir/contraer detalles
            const toggleButton = betCard.querySelector('.details-toggle');
            toggleButton.addEventListener('click', () => {
                betCard.classList.toggle('expanded');
            });
        });
    }

    // --- Funciones de Cálculo y Resumen ---

    function updateSummary(bets) {
        let totalSpent = 0;
        let totalWon = 0;

        bets.forEach(bet => {
            if (bet.type === 'venta') {
                totalSpent += bet.amount;
            } else if (bet.type === 'pago') {
                totalWon += Math.abs(bet.amount); // Premios son positivos para el total ganado
            }
        });

        const netBalance = totalWon - totalSpent; // Premios menos Gastos

        totalSpentElem.textContent = formatCurrency(totalSpent);
        totalWonElem.textContent = formatCurrency(totalWon);
        netBalanceElem.textContent = formatCurrency(netBalance);

        // Actualizar la clase para el estilo de balance
        if (netBalance < 0) {
            netBalanceElem.classList.remove('highlight');
            netBalanceElem.classList.add('negative-balance');
        } else {
            netBalanceElem.classList.add('highlight');
            netBalanceElem.classList.remove('negative-balance');
        }
    }

    // --- Gráficos (Chart.js) ---
    let myChart; // Variable para la instancia del gráfico

    function renderChart(bets) {
        // Calcular el gasto por juego
        const gameExpenses = {};
        bets.filter(b => b.type === 'venta').forEach(bet => {
            gameExpenses[bet.game] = (gameExpenses[bet.game] || 0) + bet.amount;
        });

        const labels = Object.keys(gameExpenses);
        const data = Object.values(gameExpenses);

        const backgroundColors = [
            '#004D99', '#FFA000', '#dc3545', '#28a745', '#17a2b8', '#ffc107', '#6c757d', '#6f42c1', '#fd7e14', '#20c997'
        ];
        const borderColors = backgroundColors.map(color => color.replace(')', ', 0.8)')); // Ligeramente más oscuro

        if (myChart) {
            myChart.destroy(); // Destruye la instancia anterior si existe
        }

        myChart = new Chart(betsBreakdownChartCanvas, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors.slice(0, labels.length),
                    borderColor: borderColors.slice(0, labels.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Gasto por Tipo de Juego',
                        font: {
                            size: 16
                        }
                    }
                }
            }
        });
    }

    // --- Funciones de Filtrado y Ordenación ---

    function applyFiltersAndSort() {
        let filteredBets = [...allBets];

        // 1. Filtrado por juego
        const selectedGame = filterGameSelect.value;
        if (selectedGame !== 'all') {
            filteredBets = filteredBets.filter(bet => bet.game === selectedGame);
        }

        // 2. Ordenación
        const sortOption = sortBySelect.value;
        filteredBets.sort((a, b) => {
            let dateA, dateB;
            try {
                dateA = parseDate(a.date_transaction);
            } catch (e) {
                console.warn(`Could not parse date_transaction for bet ${a.id}: ${a.date_transaction}`);
                dateA = new Date(0); // Fallback to epoch start for sorting if date is unparseable
            }
            try {
                dateB = parseDate(b.date_transaction);
            } catch (e) {
                console.warn(`Could not parse date_transaction for bet ${b.id}: ${b.date_transaction}`);
                dateB = new Date(0);
            }

            if (sortOption === 'date_transaction_asc') {
                return dateA - dateB;
            } else if (sortOption === 'date_transaction_desc') {
                return dateB - dateA;
            } else if (sortOption === 'amount_asc') {
                return a.amount - b.amount;
            } else if (sortOption === 'amount_desc') {
                return b.amount - a.amount;
            }
            return 0;
        });

        renderBets(filteredBets);
    }

    // --- Inicialización ---

    async function initialize() {
        betListContainer.innerHTML = '<p class="loading-message">Cargando datos...</p>';
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allBets = await response.json();
            betListContainer.innerHTML = ''; // Quitar mensaje de carga

            // Llenar el filtro de juegos
            const uniqueGames = [...new Set(allBets.map(bet => bet.game))];
            uniqueGames.sort().forEach(game => { // Ordenar alfabéticamente
                const option = document.createElement('option');
                option.value = game;
                option.textContent = game;
                filterGameSelect.appendChild(option);
            });

            updateSummary(allBets);
            renderChart(allBets);
            renderBets(allBets); // Renderizar todas las apuestas inicialmente

            // Añadir listeners a los controles de filtro y ordenación
            filterGameSelect.addEventListener('change', applyFiltersAndSort);
            sortBySelect.addEventListener('change', applyFiltersAndSort);

        } catch (error) {
            console.error("Error al cargar los datos:", error);
            betListContainer.innerHTML = '<p class="loading-message error-message">Error al cargar los datos. Por favor, intente de nuevo más tarde.</p>';
            // Add negative balance style to CSS if it's not already there for safety
            const style = document.createElement('style');
            style.textContent = `.summary-cards .card p.negative-balance { color: #dc3545; }`;
            document.head.appendChild(style);
        }
    }

    // Iniciar la aplicación
    initialize();
});