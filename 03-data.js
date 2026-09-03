function atualizarDashboard() {

  const consultaveis = dados.filter(d => d.status !== 'excluido');

  document.getElementById('totalItens').textContent =
    consultaveis.length;

  document.getElementById('totalAtivos').textContent =
    consultaveis.filter(
      d => d.status === 'ativo'
    ).length;

  document.getElementById('totalAnalise').textContent =
    consultaveis.filter(
      d => d.status === 'analise'
    ).length;

  document.getElementById('totalBaixados').textContent =
    consultaveis.filter(
      d => d.status === 'baixado'
    ).length;

  document.getElementById('totalLocais').textContent =
    [
      ...new Set(
        consultaveis.map(d => d.local)
      )
    ].length;
}


// =========================================================
// FILTROS
// =========================================================

function filtrarTodos() {

  filtroStatus = 'todos';

  document.getElementById(
    'pesquisa'
  ).value = '';

  renderizar();
}


function filtrarAtivos() {

  filtroStatus = 'ativo';

  document.getElementById(
    'pesquisa'
  ).value = '';

  renderizar();
}


function filtrarAnalise() {

  filtroStatus = 'analise';

  document.getElementById(
    'pesquisa'
  ).value = '';

  renderizar();
}


function filtrarBaixados() {

  filtroStatus = 'baixado';

  document.getElementById(
    'pesquisa'
  ).value = '';

  renderizar();
}


// =========================================================
// FIREBASE - PATRIMÔNIOS
// =========================================================

db.ref("patrimonios").on(
  "value",
  (snapshot) => {

    const val =
      snapshot.val();

    dados =
      val
        ? Object.keys(val).map(
            key => ({
              id: key,
              ...val[key],
              // Registros antigos, criados antes da implementação
              // do dashboard, podem não possuir o campo status.
              // Para esses registros, o status padrão é ATIVO.
              status:
                val[key]?.status || 'ativo'
            })
          )
        : [];

    // Migração segura dos patrimônios antigos: se o campo status
    // ainda não existir (ou estiver vazio), grava ATIVO no Firebase.
    // A segunda execução do listener não encontrará mais itens para migrar.
    if (val) {
      const atualizacoesStatus = {};

      Object.entries(val).forEach(([key, item]) => {
        if (!item?.status) {
          atualizacoesStatus[`patrimonios/${key}/status`] = 'ativo';
        }
      });

      if (Object.keys(atualizacoesStatus).length > 0) {
        db.ref().update(atualizacoesStatus)
          .then(() => {
            console.log(
              'STATUS: patrimônios antigos normalizados para ATIVO:',
              Object.keys(atualizacoesStatus).length
            );
          })
          .catch(error => {
            console.error(
              'STATUS: erro ao normalizar patrimônios antigos:',
              error
            );
          });
      }
    }

    atualizarDashboard();
    if (typeof atualizarDashboardExtra === 'function') atualizarDashboardExtra();

    renderizar(
      abaAbertaRecentemente
    );
  }
);


// =========================================================
// FIREBASE - LOCAIS
// =========================================================

db.ref("locais").on(
  "value",
  (snapshot) => {

    const val =
      snapshot.val();

    if (!val) {

      padraoLocais.forEach(
        local => {
          db.ref("locais").push(local);
        }
      );

      listaLocais =
        [...padraoLocais].sort();

    } else {

      listaLocais =
        Object.values(val).sort();
    }

    atualizarSelectsFormulario();
    if (typeof atualizarFiltrosAvancados === 'function') atualizarFiltrosAvancados();
  }
);


// =========================================================
// FIREBASE - DESCRIÇÕES
// =========================================================

db.ref("descricoes").on(
  "value",
  (snapshot) => {

    const val =
      snapshot.val();

    if (!val) {

      padraoDescricoes.forEach(
        descricao => {
          db.ref("descricoes").push(descricao);
        }
      );

      listaDescricoes =
        [...padraoDescricoes].sort();

    } else {

      listaDescricoes =
        Object.values(val).sort();
    }

    atualizarSelectsFormulario();
    if (typeof atualizarFiltrosAvancados === 'function') atualizarFiltrosAvancados();
  }
);


// =========================================================
// ATUALIZAR SELECTS
// =========================================================

function atualizarSelectsFormulario() {

  const selectLocal =
    document.getElementById('local');

  const selectDesc =
    document.getElementById('descricao');


  if (selectLocal) {

    selectLocal.innerHTML =
      '<option value="">Selecione o Local</option>' +
      listaLocais
        .map(
          loc =>
            `<option value="${loc}">${loc}</option>`
        )
        .join('');
  }


  if (selectDesc) {

    selectDesc.innerHTML =
      '<option value="">Selecione o Item</option>' +
      listaDescricoes
        .map(
          desc =>
            `<option value="${desc}">${desc}</option>`
        )
        .join('');
  }
}


function atualizarFiltrosAvancados() {
  const localSelect = document.getElementById('filtroLocalAvancado');
  const descSelect = document.getElementById('filtroDescricaoAvancado');
  if (localSelect) {
    const atual = localSelect.value;
    localSelect.innerHTML = '<option value="">Todos os locais</option>' + listaLocais.map(v => `<option value="${String(v).replace(/"/g,'&quot;')}">${v}</option>`).join('');
    localSelect.value = listaLocais.includes(atual) ? atual : '';
  }
  if (descSelect) {
    const atual = descSelect.value;
    descSelect.innerHTML = '<option value="">Todas as descrições</option>' + listaDescricoes.map(v => `<option value="${String(v).replace(/"/g,'&quot;')}">${v}</option>`).join('');
    descSelect.value = listaDescricoes.includes(atual) ? atual : '';
  }
}

// =========================================================
// ADICIONAR LOCAL
// =========================================================

async function adicionarLocalDinamico() {

  if (!validarAcessoAdmin()) {
    return;
  }

  const novoLocal = await appPrompt(
    "Digite o nome do novo Local (Setor):",
    "",
    "Novo local"
  );

  if (
    !novoLocal ||
    novoLocal.trim() === ""
  ) {
    return;
  }


  if (
    listaLocais.some(
      l =>
        l.toLowerCase() ===
        novoLocal.trim().toLowerCase()
    )
  ) {

    appAlert(
      "Este local já está cadastrado!"
    );

    return;
  }


  try {
    const localRef = db.ref('locais').push();

    await registrarEvento({
      tipo: 'cadastro_local',
      observacao: `Novo local cadastrado: ${novoLocal.trim()}.`,
      databaseUpdates: {
        [`locais/${localRef.key}`]: novoLocal.trim()
      }
    });

    appAlert(
      "Local adicionado com sucesso!",
      "Cadastro concluído",
      { icone: "✅" }
    );
  } catch (error) {
    console.error(
      "Erro ao adicionar local:",
      error
    );

    appAlert(
      "Não foi possível adicionar o local.",
      "Erro",
      { icone: "❌" }
    );
  }
}


// =========================================================
// ADICIONAR DESCRIÇÃO
// =========================================================

async function adicionarDescricaoDinamica() {

  if (!validarAcessoAdmin()) {
    return;
  }

  const novoItem = await appPrompt(
    "Digite a descrição do novo Item:",
    "",
    "Nova descrição"
  );

  if (
    !novoItem ||
    novoItem.trim() === ""
  ) {
    return;
  }


  if (
    listaDescricoes.some(
      d =>
        d.toLowerCase() ===
        novoItem.trim().toLowerCase()
    )
  ) {

    appAlert(
      "Esta descrição de item já existe!"
    );

    return;
  }


  try {
    const descricaoRef = db.ref('descricoes').push();

    await registrarEvento({
      tipo: 'cadastro_descricao',
      observacao: `Nova descrição cadastrada: ${novoItem.trim()}.`,
      databaseUpdates: {
        [`descricoes/${descricaoRef.key}`]: novoItem.trim()
      }
    });

    appAlert(
      "Item adicionado com sucesso!",
      "Cadastro concluído",
      { icone: "✅" }
    );
  } catch (error) {
    console.error(
      "Erro ao adicionar descrição:",
      error
    );

    appAlert(
      "Não foi possível adicionar o item.",
      "Erro",
      { icone: "❌" }
    );
  }
}


// =========================================================
// ORDENAR PATRIMÔNIOS
// =========================================================

function ordenarPatrimonios(a, b) {

  const statusOrder = {
    'ativo': 1,
    'analise': 2,
    'baixado': 3
  };

  const orderA =
    statusOrder[a.status] || 1;

  const orderB =
    statusOrder[b.status] || 1;


  if (orderA !== orderB) {
    return orderA - orderB;
  }


  const descA =
    String(a.descricao || '')
      .toLowerCase();

  const descB =
    String(b.descricao || '')
      .toLowerCase();

  const termoConjunto =
    "conjunto de carteira";


  if (
    descA === termoConjunto &&
    descB !== termoConjunto
  ) {
    return 1;
  }


  if (
    descA !== termoConjunto &&
    descB === termoConjunto
  ) {
    return -1;
  }


  if (descA !== descB) {
    return descA.localeCompare(descB);
  }


  return String(a.numero)
    .localeCompare(
      String(b.numero),
      undefined,
      {
        numeric: true,
        sensitivity: 'base'
      }
    );
}


// =========================================================
// MODO DE VISUALIZAÇÃO
// =========================================================

function setModo(m) {

  modo = m;

  abaAbertaRecentemente = null;

  document
    .getElementById('btnLocal')
    .classList
    .toggle(
      'active',
      m === 'local'
    );

  document
    .getElementById('btnDescricao')
    .classList
    .toggle(
      'active',
      m === 'descricao'
    );

  renderizar();
}


// =========================================================
// ADICIONAR PATRIMÔNIO
// =========================================================
