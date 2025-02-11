// Função fetchUserDeals
async function fetchUserDeals(id) {
    try {
        const response = await fetch(`https://camposmpinheiro.pythonanywhere.com/fetch-user-deals/${id}`, {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQ3MTQwNzQwMzA4LCJzdWIiOiI1MjkxMDA1Yi1iNGRiLTQ3OGYtYjM3Ny0zZjQ5YTZhYmQ2ZTQifQ.83RbwPsYmpqb5TeEVyhqQ7FdPD9pFqgEiX3aOQ3SopI'
            }
        });
        const data = await response.json();
        console.log(`Deals for ID ${id}:`, data);
        return data.deal; // Retorna o objeto "deal"
    } catch (error) {
        console.error(`Error fetching user deals for ID ${id}:`, error);
        return null; // Retorna null em caso de erro
    }
}

async function loadLootBoxes(amount,ignoreFinished) {
    try {
        const response = await fetch('https://camposmpinheiro.pythonanywhere.com/fetch-deals', {
            method: 'GET',
            headers: {
                'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjQ3MTQwNzQwMzA4LCJzdWIiOiI1MjkxMDA1Yi1iNGRiLTQ3OGYtYjM3Ny0zZjQ5YTZhYmQ2ZTQifQ.83RbwPsYmpqb5TeEVyhqQ7FdPD9pFqgEiX3aOQ3SopI'
            }
        });
        const data = await response.json();
        const container = document.getElementById('loot-container');
        container.innerHTML = ''; // Limpa o container antes de adicionar novos elementos

        // Coleta todas as promessas de fetchUserDeals
        const fetchPromises = data.deals.map(async (deal) => {
            // Criar a loot box e adicioná-la ao container
            const lootBox = document.createElement('div');
            lootBox.classList.add('loot-box');
        
            const progressPercentage = (deal.percent_prizes_claimed).toFixed(1);
            let progressColor;
        
            if (progressPercentage < 40) {
                progressColor = '#28a745'; // Verde
            } else if (progressPercentage < 100) {
                progressColor = '#fd7e14'; // Laranja
            } else {
                progressColor = '#dc3545'; // Vermelho
                if (ignoreFinished) {
                    return null; // Ignorar loot boxes concluídas
                }
            }
        
            lootBox.innerHTML = `
                <img class="loot-image" src="${deal.image_url}" alt="${deal.title}">
                <div class="loot-details">
                    <h2 class="loot-title">
                        ${deal.title}
                        <button class="copy-btn" id="copy-btn-${deal.id}" style="background: none; border: none; cursor: pointer;">
                            <!-- Ícone SVG de copiar -->
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" class="bi bi-clipboard" viewBox="0 0 16 16">
                                <path d="M10 1.5v1h2a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1h2v-1a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5zM4 2v1h8V2H4zm0 2v10h8V4H4zm2 1h4a.5.5 0 0 1 0 1H6a.5.5 0 0 1 0-1z"/>
                            </svg>
                        </button>
                    </h2>
                    <p class="loot-cost">Cost: ${deal.cost_gold} Gold</p>
                    <div class="progress-container">
                        <div class="progress-bar" style="width: ${progressPercentage}%; background-color: ${progressColor};"></div>
                    </div>
                    <p class="progress-text">${progressPercentage}% claimed</p>
                    <p class="loot-cost" style="margin-top:15px" id="first-p-${deal.id}">Loading...</p>
                    <p class="loot-cost" id="second-p-${deal.id}">Loading...</p>
                    <p class="loot-cost" id="profit-${deal.id}"></p>
                </div>
            `;
        
            container.appendChild(lootBox);
        
            document.getElementById(`copy-btn-${deal.id}`).addEventListener('click', function() {
                copyToClipboard(deal.id);
            });
        
            // Retorna uma função que busca os dados do user deal
            return (async () => {
                let profit = 0;
                const userDeal = await fetchUserDeals(deal.id);
        
                if (userDeal && userDeal.loot_box_asset_quantity_low && userDeal.loot_box_asset.price_usd) {
                    profit = ((userDeal.loot_box_asset_quantity_low * userDeal.loot_box_asset.price_usd) - (amount * deal.cost_gold)).toFixed(2);
                    document.getElementById(`first-p-${deal.id}`).textContent = 
                    `Min: ${userDeal.loot_box_asset_quantity_low} ($ ${(userDeal.loot_box_asset_quantity_low * userDeal.loot_box_asset.price_usd).toFixed(2)})`;
                } 
                else if (userDeal && userDeal.asset_quantity && userDeal.asset && userDeal.asset.price_usd) {
                    profit = ((userDeal.asset_quantity * userDeal.asset.price_usd) - (amount * deal.cost_gold)).toFixed(2);
                    document.getElementById(`first-p-${deal.id}`).textContent = 
                    `Est Value: ${userDeal.asset_quantity} ($ ${(userDeal.asset_quantity * userDeal.asset.price_usd).toFixed(2)})`;
                } else {
                    document.getElementById(`first-p-${deal.id}`).textContent = "";
                }
        
                if (userDeal && userDeal.loot_box_asset_quantity_high && userDeal.loot_box_asset.price_usd) {
                    document.getElementById(`second-p-${deal.id}`).textContent = 
                    `Max: ${userDeal.loot_box_asset_quantity_high} ($ ${(userDeal.loot_box_asset_quantity_high * userDeal.loot_box_asset.price_usd).toFixed(2)})`;
                } else {
                    document.getElementById(`second-p-${deal.id}`).textContent = "";
                }
        
                if (profit) {
                    const profitElement = document.getElementById(`profit-${deal.id}`);
                    profitElement.textContent = `Min Profit: $ ${profit}`;
        
                    if (parseFloat(profit) > 0) {
                        profitElement.classList.add('profit-positive');
                        profitElement.classList.remove('profit-negative');
                    } else if (parseFloat(profit) < 0) {
                        profitElement.classList.add('profit-negative');
                        profitElement.classList.remove('profit-positive');
                    } else {
                        profitElement.classList.remove('profit-positive', 'profit-negative');
                    }
                } else {
                    document.getElementById(`profit-${deal.id}`).textContent = "";
                }
        
                return {
                    id: deal.id,
                    profit: parseFloat(profit) || 0,
                    element: lootBox
                };
            })();
        });
        
        // Executa todas as promessas de uma vez usando Promise.all
        Promise.all(fetchPromises).then(results => {
            // Filtrar nulos (loot boxes ignoradas)
            const validResults = results.filter(result => result !== null);
        
            // Ordenar as loot boxes por lucro
            validResults.sort((a, b) => b.profit - a.profit);
        
            // Adicionar as loot boxes ao container em ordem de lucro
            validResults.forEach(result => {
                container.appendChild(result.element);
            });
        });
        

        function copyToClipboard(id) {
            navigator.clipboard.writeText("https://mobile-api.assetdash.com/api/api_v5/market/deals/user_deals/"+id+"/purchase_deal").then(function() {
            }, function(err) {
                console.error('Falha ao copiar o texto: ', err);
            });
        }

        // Aguarda todas as promessas de fetchUserDeals serem concluídas
        const dealsWithProfit = await Promise.all(fetchPromises);

        // Ordena os loot boxes por profit
        const sortedDeals = dealsWithProfit
            .filter(deal => deal) // Remove qualquer valor nulo ou indefinido
            .sort((a, b) => b.profit - a.profit); // Ordena do maior para o menor profit

        // Recria os elementos de loot box com a ordem correta
        container.innerHTML = '';
        sortedDeals.forEach(deal => {
            container.appendChild(deal.element);
        });
    } catch (error) {
        console.error('Erro:', error);
    }
}

document.getElementById("printAmountBtn").addEventListener("click", function() {
    const amount = document.getElementById("amount").value;
    const ignoreFinished = document.getElementById("ignoreFinished").checked;
    localStorage.setItem("goldUsdAmount", amount);
    localStorage.setItem("ignoreFinished", JSON.stringify(ignoreFinished));
    loadLootBoxes(amount,ignoreFinished);

});

window.onload = function() {
    const savedAmount = localStorage.getItem("goldUsdAmount");
    if (savedAmount) {
        document.getElementById("amount").value = savedAmount;
    }

    const savedCheckbox = localStorage.getItem("ignoreFinished");
    if (savedCheckbox) {
        document.getElementById("ignoreFinished").checked = JSON.parse(savedCheckbox);
    }
};
