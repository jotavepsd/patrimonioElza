function atualizarDashboard() {

  document.getElementById('totalItens').textContent =
    dados.length;

  document.getElementById('totalAtivos').textContent =
    dados.filter(
      d => d.status === 'ativo'
    ).length;

  document.getElementById('totalAnalise').textContent =
    dados.filter(
      d => d.status === 'analise'
    ).length;

  document.getElementById('totalBaixados').textContent =
    dados.filter(
      d => d.status === 'baixado'
    ).length;

  document.getElementById('totalLocais').textContent =
    [
      ...new Set(
        dados.map(d => d.local)
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
              ...val[key]
            })
          )
        : [];

    atualizarDashboard();

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


// =========================================================
// ADICIONAR LOCAL
// =========================================================

function adicionarLocalDinamico() {

  if (!validarAcessoAdmin()) {
    return;
  }

  const novoLocal =
    prompt(
      "Digite o nome do novo Local (Setor):"
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

    alert(
      "Este local já está cadastrado!"
    );

    return;
  }


  db.ref("locais")
    .push(novoLocal.trim())
    .then(() => {

      alert(
        "Local adicionado com sucesso!"
      );

    })
    .catch(error => {

      console.error(
        "Erro ao adicionar local:",
        error
      );

      alert(
        "Não foi possível adicionar o local."
      );
    });
}


// =========================================================
// ADICIONAR DESCRIÇÃO
// =========================================================

function adicionarDescricaoDinamica() {

  if (!validarAcessoAdmin()) {
    return;
  }

  const novoItem =
    prompt(
      "Digite a descrição do novo Item:"
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

    alert(
      "Esta descrição de item já existe!"
    );

    return;
  }


  db.ref("descricoes")
    .push(novoItem.trim())
    .then(() => {

      alert(
        "Item adicionado com sucesso!"
      );

    })
    .catch(error => {

      console.error(
        "Erro ao adicionar descrição:",
        error
      );

      alert(
        "Não foi possível adicionar o item."
      );
    });
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
