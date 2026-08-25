// =========================================================
// MODO INVENTÁRIO
// =========================================================

function abrirConfiguracaoInventario() {

    const config =
        document.getElementById('inventarioConfig');

    const select =
        document.getElementById('inventarioLocal');

    if (!config || !select) {
        return;
    }

    select.innerHTML =
        '<option value="">Selecione o local</option>';

    listaLocais
        .filter(local => local !== 'Não localizado')
        .forEach(local => {

            const option =
                document.createElement('option');

            option.value = local;
            option.textContent = local;

            select.appendChild(option);
        });

    config.style.display = 'grid';
}


function fecharConfiguracaoInventario() {

    const config =
        document.getElementById('inventarioConfig');

    if (config) {
        config.style.display = 'none';
    }
}


function iniciarInventario() {

    const select =
        document.getElementById('inventarioLocal');

    if (!select) {
        return;
    }

    const local = select.value;

    if (!local) {

        alert(
            'Selecione um local para iniciar o inventário.'
        );

        return;
    }

    inventarioLocal = local;

    inventarioItens = dados
        .filter(item =>
            item.local === local &&
            item.status !== 'baixado'
        )
        .map(item => ({
            id: item.id,
            numero: item.numero,
            descricao: item.descricao,
            conferido: false
        }))
        .sort((a, b) =>
            String(a.numero).localeCompare(
                String(b.numero),
                undefined,
                {
                    numeric: true,
                    sensitivity: 'base'
                }
            )
        );

    inventarioAtivo = true;

    document.getElementById(
        'inventarioConfig'
    ).style.display = 'none';

    document.getElementById(
        'inventarioPainel'
    ).style.display = 'block';

    document.getElementById(
        'inventarioResultado'
    ).style.display = 'none';

    document.getElementById(
        'inventarioLocalAtual'
    ).textContent = inventarioLocal;

    document.getElementById(
        'inventarioPesquisa'
    ).value = '';

    document.getElementById(
        'inventarioResultadoBusca'
    ).innerHTML = '';

    renderizarInventario();

    document.getElementById(
        'inventarioPesquisa'
    ).focus();
}


// =========================================================
// RENDERIZAR LISTA
// =========================================================

function renderizarInventario() {

    const lista =
        document.getElementById('inventarioLista');

    if (!lista) {
        return;
    }

    lista.innerHTML = '';

    if (inventarioItens.length === 0) {

        lista.innerHTML = `
            <div class="inventario-vazio">
                Nenhum patrimônio encontrado neste local.
            </div>
        `;

        atualizarResumoInventario();

        return;
    }

    inventarioItens.forEach(item => {

        const div =
            document.createElement('div');

        div.className =
            `inventario-item ${
                item.conferido
                    ? 'conferido'
                    : 'pendente'
            }`;

        div.innerHTML = `
            <div class="inventario-item-info">

                <strong>
                    ${item.numero}
                </strong>

                <span>
                    ${item.descricao || 'Sem descrição'}
                </span>

            </div>

            <div class="inventario-item-status">

                ${
                    item.conferido
                        ? '🟢 Conferido'
                        : '⚪ Pendente'
                }

            </div>
        `;

        lista.appendChild(div);
    });

    atualizarResumoInventario();
}


// =========================================================
// ATUALIZAR RESUMO
// =========================================================

function atualizarResumoInventario() {

    const esperados =
        inventarioItens.length;

    const conferidos =
        inventarioItens.filter(
            item => item.conferido
        ).length;

    const pendentes =
        esperados - conferidos;

    const porcentagem =
        esperados > 0
            ? Math.round(
                (conferidos / esperados) * 100
            )
            : 0;


    document.getElementById(
        'inventarioEsperados'
    ).textContent = esperados;


    document.getElementById(
        'inventarioConferidos'
    ).textContent = conferidos;


    document.getElementById(
        'inventarioPendentes'
    ).textContent = pendentes;


    document.getElementById(
        'inventarioPorcentagem'
    ).textContent = `${porcentagem}%`;


    const barra =
        document.getElementById(
            'inventarioProgresso'
        );

    if (barra) {

        barra.style.width =
            `${porcentagem}%`;
    }
}


// =========================================================
// PESQUISA
// =========================================================

function pesquisarInventario() {

    const input =
        document.getElementById(
            'inventarioPesquisa'
        );

    const resultado =
        document.getElementById(
            'inventarioResultadoBusca'
        );

    if (!input || !resultado) {
        return;
    }

    const pesquisa =
        input.value.trim().toLowerCase();

    resultado.innerHTML = '';

    if (!pesquisa) {
        return;
    }

    const item =
        inventarioItens.find(item =>
            String(item.numero)
                .toLowerCase() === pesquisa
        );

    if (!item) {

        resultado.innerHTML = `
            <div class="inventario-busca-erro">

                ⚠️ Patrimônio não encontrado
                entre os itens esperados deste local.

            </div>
        `;

        return;
    }

    if (item.conferido) {

        resultado.innerHTML = `
            <div class="inventario-busca-conferido">

                <strong>
                    🟢 Patrimônio já conferido
                </strong>

                <span>
                    Nº ${item.numero}
                </span>

                <span>
                    ${item.descricao || 'Sem descrição'}
                </span>

            </div>
        `;

        return;
    }

    resultado.innerHTML = `
        <div class="inventario-resultado-item">

            <div class="inventario-resultado-info">

                <strong>
                    Nº ${item.numero}
                </strong>

                <span>
                    ${item.descricao || 'Sem descrição'}
                </span>

            </div>

            <button
                type="button"
                class="btn-conferir"
                onclick="conferirPatrimonioInventario('${item.id}')"
            >
                🟢 Conferir
            </button>

        </div>
    `;
}


// =========================================================
// CONFERIR PATRIMÔNIO
// =========================================================

function conferirPatrimonioInventario(id) {

    const item =
        inventarioItens.find(
            item => String(item.id) === String(id)
        );

    if (!item) {
        return;
    }

    if (item.conferido) {
        return;
    }

    item.conferido = true;

    renderizarInventario();

    const resultado =
        document.getElementById(
            'inventarioResultadoBusca'
        );

    if (resultado) {

        resultado.innerHTML = `
            <div class="inventario-busca-conferido">

                <strong>
                    🟢 Patrimônio conferido!
                </strong>

                <span>
                    Nº ${item.numero}
                </span>

                <span>
                    ${item.descricao || 'Sem descrição'}
                </span>

            </div>
        `;
    }

    const input =
        document.getElementById(
            'inventarioPesquisa'
        );

    if (input) {

        input.value = '';

        input.focus();
    }
}


// =========================================================
// FINALIZAR INVENTÁRIO
// =========================================================

function finalizarInventario() {

    if (!inventarioAtivo) {
        return;
    }

    const conferidos =
        inventarioItens.filter(
            item => item.conferido
        );

    const pendentes =
        inventarioItens.filter(
            item => !item.conferido
        );

    inventarioAtivo = false;

    renderizarResultadoInventario(
        conferidos,
        pendentes
    );
}


// =========================================================
// RESULTADO DO INVENTÁRIO
// =========================================================

function renderizarResultadoInventario(
    conferidos,
    pendentes
) {

    const painel =
        document.getElementById(
            'inventarioPainel'
        );

    const resultado =
        document.getElementById(
            'inventarioResultado'
        );

    if (!resultado) {
        return;
    }

    if (painel) {
        painel.style.display = 'none';
    }

    resultado.style.display = 'block';

    resultado.innerHTML = `
        <div class="inventario-resultado-final">

            <div class="inventario-resultado-header">

                <h2>
                    ✅ Inventário Finalizado
                </h2>

                <p>
                    Local:
                    <strong>
                        ${inventarioLocal}
                    </strong>
                </p>

            </div>


            <div class="inventario-resultado-resumo">

                <div class="inventario-card conferidos">

                    <span>
                        Conferidos
                    </span>

                    <strong>
                        ${conferidos.length}
                    </strong>

                </div>


                <div class="inventario-card pendentes">

                    <span>
                        Não encontrados
                    </span>

                    <strong>
                        ${pendentes.length}
                    </strong>

                </div>

            </div>


            <div class="inventario-resultado-lista">

                <h3>
                    Patrimônios não encontrados
                </h3>

                ${
                    pendentes.length === 0

                        ? `
                            <div class="
                                inventario-tudo-encontrado
                            ">

                                🟢 Todos os patrimônios
                                foram encontrados.

                            </div>
                        `

                        : `
                            <div class="
                                inventario-pendentes-lista
                            ">

                                ${pendentes.map(item => `

                                    <div class="
                                        inventario-pendente-item
                                    ">

                                        <div>

                                            <strong>
                                                ${item.numero}
                                            </strong>

                                            <span>
                                                ${
                                                    item.descricao ||
                                                    'Sem descrição'
                                                }
                                            </span>

                                        </div>

                                        <span>
                                            ⚪ Não encontrado
                                        </span>

                                    </div>

                                `).join('')}

                            </div>
                        `
                }

            </div>


            <div class="inventario-resultado-acoes">

                <button
                    type="button"
                    id="btnFecharResultadoInventario"
                    class="btn-primary"
                >
                    Concluir
                </button>

            </div>

        </div>
    `;


    const btn =
        document.getElementById(
            'btnFecharResultadoInventario'
        );

    if (btn) {

        btn.addEventListener(
            'click',
            fecharResultadoInventario
        );
    }
}


// =========================================================
// FECHAR RESULTADO
// =========================================================

function fecharResultadoInventario() {

    const resultado =
        document.getElementById(
            'inventarioResultado'
        );

    if (resultado) {

        resultado.style.display = 'none';

        resultado.innerHTML = '';
    }

    inventarioAtivo = false;

    inventarioLocal = '';

    inventarioItens = [];

    document.getElementById(
        'inventarioLocalAtual'
    ).textContent = '-';

    atualizarResumoInventario();
}