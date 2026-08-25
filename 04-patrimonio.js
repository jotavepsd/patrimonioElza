async function adicionar() {

  if (!validarAcessoAdmin()) {
    return;
  }


  const numerosStr =
    document
      .getElementById('numero')
      .value
      .trim();

  const local =
    document
      .getElementById('local')
      .value;

  const descricao =
    document
      .getElementById('descricao')
      .value;


  if (
    !numerosStr ||
    !local ||
    !descricao
  ) {

    alert(
      "Por favor, preencha todos os campos."
    );

    return;
  }


  const numeros =
    numerosStr.split(/\s+/);


  const uniqueNumeros =
    [...new Set(numeros)];


  if (
    uniqueNumeros.length !==
    numeros.length
  ) {

    alert(
      "Erro: Existem números repetidos na lista!"
    );

    return;
  }


  const numerosJaExistentes = [];
  const numerosValidos = [];


  for (
    let num of numeros
  ) {

    if (
      dados.some(
        item =>
          String(item.numero)
            .toUpperCase() ===
          String(num)
            .toUpperCase()
      )
    ) {

      numerosJaExistentes.push(num);

    } else {

      numerosValidos.push(num);
    }
  }


  if (
    numerosJaExistentes.length > 0
  ) {

    alert(
      `Os seguintes patrimônios já existem:\n${numerosJaExistentes.join(', ')}`
    );
  }


  if (
    numerosValidos.length === 0
  ) {

    alert(
      "Nenhum número válido para cadastrar."
    );

    return;
  }


  const dataAtual =
    new Date().toISOString();


  try {

    const promessas =
      numerosValidos.map(
        numero =>
          db
            .ref("patrimonios")
            .push({
              numero: numero,
              local: local,
              descricao: descricao,
              status: 'ativo',
              dataCadastro: dataAtual,
              dataModificacao: dataAtual
            })
      );


    await Promise.all(
      promessas
    );


    abaAbertaRecentemente =
      modo === 'local'
        ? local
        : descricao;


    alert(
      `${numerosValidos.length} patrimônio(s) cadastrado(s)!`
    );


    document.getElementById(
      'numero'
    ).value = '';

  } catch (error) {

    console.error(
      "Erro ao cadastrar patrimônio:",
      error
    );

    alert(
      "Erro ao cadastrar patrimônio."
    );
  }
}


// =========================================================
// EXCLUIR
// =========================================================

async function excluir(id) {

  if (!validarAcessoAdmin()) {
    return;
  }


  if (
    !confirm(
      "Excluir permanentemente?"
    )
  ) {
    return;
  }


  try {

    await db
      .ref("patrimonios")
      .child(id)
      .remove();

  } catch (error) {

    console.error(
      "Erro ao excluir:",
      error
    );

    alert(
      "Não foi possível excluir o patrimônio."
    );
  }
}


// =========================================================
// COLOCAR EM ANÁLISE
// =========================================================

async function colocarEmAnalise(id) {

  if (!validarAcessoAdmin()) {
    return;
  }


  if (
    !confirm(
      "Marcar como 'Em análise de integridade'?"
    )
  ) {
    return;
  }


  try {

    await db
      .ref("patrimonios")
      .child(id)
      .update({
        status: 'analise',
        dataModificacao:
          new Date().toISOString()
      });

  } catch (error) {

    console.error(
      "Erro ao colocar em análise:",
      error
    );

    alert(
      "Não foi possível alterar o status."
    );
  }
}


// =========================================================
// DAR BAIXA
// =========================================================

async function darBaixa(id) {

  if (!validarAcessoAdmin()) {
    return;
  }


  if (
    !confirm(
      "Dar baixa neste patrimônio?"
    )
  ) {
    return;
  }


  try {

    const data =
      new Date().toISOString();


    await db
      .ref("patrimonios")
      .child(id)
      .update({
        status: 'baixado',
        dataBaixa: data,
        dataModificacao: data
      });

  } catch (error) {

    console.error(
      "Erro ao dar baixa:",
      error
    );

    alert(
      "Não foi possível dar baixa."
    );
  }
}


// =========================================================
// REATIVAR
// =========================================================

async function reativar(id) {

  if (!validarAcessoAdmin()) {
    return;
  }


  if (
    !confirm(
      "Reativar/Aprovar este patrimônio?"
    )
  ) {
    return;
  }


  try {

    await db
      .ref("patrimonios")
      .child(id)
      .update({
        status: 'ativo',
        dataModificacao:
          new Date().toISOString()
      });

  } catch (error) {

    console.error(
      "Erro ao reativar:",
      error
    );

    alert(
      "Não foi possível reativar."
    );
  }
}


// =========================================================
// EDITAR
// =========================================================

function editar(id) {

  if (!validarAcessoAdmin()) {
    return;
  }


  const item =
    dados.find(
      d => d.id === id
    );


  if (!item) {
    return;
  }


  editandoId = id;


  document.getElementById(
    'editNumero'
  ).value = item.numero;


  document.getElementById(
    'editLocal'
  ).innerHTML =
    listaLocais
      .map(
        loc =>
          `<option value="${loc}" ${loc === item.local ? 'selected' : ''}>${loc}</option>`
      )
      .join('');


  document.getElementById(
    'editDescricao'
  ).innerHTML =
    listaDescricoes
      .map(
        desc =>
          `<option value="${desc}" ${desc === item.descricao ? 'selected' : ''}>${desc}</option>`
      )
      .join('');


  document.getElementById(
    'editStatus'
  ).value =
    item.status || 'ativo';


  document.getElementById(
    'editModal'
  ).style.display = 'block';
}


// =========================================================
// FECHAR MODAL
// =========================================================

function fecharModal() {

  document.getElementById(
    'editModal'
  ).style.display = 'none';

  editandoId = null;
}


// =========================================================
// SALVAR EDIÇÃO
// =========================================================

async function salvarEdicao() {

  if (
    !validarAcessoAdmin() ||
    !editandoId
  ) {
    return;
  }


  const numero =
    document
      .getElementById('editNumero')
      .value
      .trim();

  const local =
    document
      .getElementById('editLocal')
      .value;

  const descricao =
    document
      .getElementById('editDescricao')
      .value;

  const status =
    document
      .getElementById('editStatus')
      .value;


  if (
    !numero ||
    !local ||
    !descricao
  ) {

    alert(
      "Preencha todos os campos!"
    );

    return;
  }


  if (
    dados.some(
      item =>
        item.id !== editandoId &&
        String(item.numero)
          .toUpperCase() ===
        String(numero)
          .toUpperCase()
    )
  ) {

    alert(
      `Erro: Patrimônio nº ${numero} já existe!`
    );

    return;
  }


  try {

    await db
      .ref("patrimonios")
      .child(editandoId)
      .update({
        numero,
        local,
        descricao,
        status,
        dataModificacao:
          new Date().toISOString()
      });


    fecharModal();

    alert(
      "Atualizado com sucesso!"
    );

  } catch (error) {

    console.error(
      "Erro ao salvar edição:",
      error
    );

    alert(
      "Não foi possível salvar as alterações."
    );
  }
}


// =========================================================
// FORMATAR DATA
// =========================================================
