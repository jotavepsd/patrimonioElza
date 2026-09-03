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

    appAlert(
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

    appAlert(
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

    appAlert(
      `Os seguintes patrimônios já existem:\n${numerosJaExistentes.join(', ')}`
    );
  }


  if (
    numerosValidos.length === 0
  ) {

    appAlert(
      "Nenhum número válido para cadastrar."
    );

    return;
  }


  const dataAtual =
    new Date().toISOString();


  try {

const promessas =
  numerosValidos.map(
    async numero => {

      const ref =
        db
          .ref("patrimonios")
          .push();


      const patrimonio = {

        numero: numero,

        local: local,

        descricao: descricao,

        status: 'ativo',

        dataCadastro:
          dataAtual,

        dataModificacao:
          dataAtual

      };


      await registrarEvento({

        tipo: 'cadastro',

        patrimonioId:
          ref.key,

        patrimonio: {
          numero: numero
        },

        localNovo:
          local,

        descricaoNova:
          descricao,

        statusNovo:
          'ativo',

        observacao:
          'Patrimônio cadastrado no sistema.',

        databaseUpdates: {
          [`patrimonios/${ref.key}`]: patrimonio
        }

      });

    }
  );


await Promise.all(
  promessas
);


    abaAbertaRecentemente =
      modo === 'local'
        ? local
        : descricao;


    appAlert(
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

    appAlert(
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
    !await appConfirm(
      "Mover para a lixeira? O patrimônio poderá ser restaurado depois.",
      "Excluir patrimônio",
      { icone: "🗑️", confirmarTexto: "Mover para lixeira" }
    )
  ) {
    return;
  }


  const patrimonio =
    dados.find(
      item => item.id === id
    );


  if (!patrimonio) {
    return;
  }


  try {

    await registrarEvento({

      tipo: 'exclusao',

      patrimonioId: id,

      patrimonio,

      localAnterior:
        patrimonio.local,

      descricaoAnterior:
        patrimonio.descricao,

      statusAnterior:
        patrimonio.status,

      observacao:
        'Patrimônio movido para a lixeira.',

      statusNovo: 'excluido',

      databaseUpdates: {
        [`patrimonios/${id}/status`]: 'excluido',
        [`patrimonios/${id}/excluido`]: true,
        [`patrimonios/${id}/dataExclusao`]: new Date().toISOString(),
        [`patrimonios/${id}/dataModificacao`]: new Date().toISOString()
      }

    });


  } catch (error) {

    console.error(
      "Erro ao excluir:",
      error
    );

    appAlert(
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
    !await appConfirm(
      "Marcar como 'Em análise de integridade'?",
      "Enviar para análise",
      { icone: "⚠️", confirmarTexto: "Continuar" }
    )
  ) {
    return;
  }


  const patrimonio =
    dados.find(
      item => item.id === id
    );


  if (!patrimonio) {
    return;
  }


  try {

    const data =
      new Date().toISOString();


    await registrarEvento({

      tipo:
        'entrada_analise',

      patrimonioId:
        id,

      patrimonio,

      localNovo:
        patrimonio.local,

      statusAnterior:
        patrimonio.status,

      statusNovo:
        'analise',

      observacao:
        'Patrimônio colocado em análise de integridade.',

      databaseUpdates: {
        [`patrimonios/${id}/status`]: 'analise',
        [`patrimonios/${id}/dataModificacao`]: data
      }

    });


  } catch (error) {

    console.error(
      "Erro ao colocar em análise:",
      error
    );

    appAlert(
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
    !await appConfirm(
      "Dar baixa neste patrimônio?",
      "Dar baixa",
      { icone: "❌", confirmarTexto: "Dar baixa" }
    )
  ) {
    return;
  }


  const patrimonio =
    dados.find(
      item => item.id === id
    );


  if (!patrimonio) {
    return;
  }


  try {

    const data =
      new Date().toISOString();


    await registrarEvento({

      tipo: 'baixa',

      patrimonioId:
        id,

      patrimonio,

      localNovo:
        patrimonio.local,

      statusAnterior:
        patrimonio.status,

      statusNovo:
        'baixado',

      observacao:
        'Patrimônio recebeu baixa.',

      databaseUpdates: {
        [`patrimonios/${id}/status`]: 'baixado',
        [`patrimonios/${id}/dataBaixa`]: data,
        [`patrimonios/${id}/dataModificacao`]: data
      }

    });


  } catch (error) {

    console.error(
      "Erro ao dar baixa:",
      error
    );

    appAlert(
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
    !await appConfirm(
      "Reativar/Aprovar este patrimônio?",
      "Reativar patrimônio",
      { icone: "♻️", confirmarTexto: "Reativar" }
    )
  ) {
    return;
  }


  const patrimonio =
    dados.find(
      item => item.id === id
    );


  if (!patrimonio) {
    return;
  }


  try {

    const data = new Date().toISOString();

    await registrarEvento({

      tipo: 'reativacao',

      patrimonioId:
        id,

      patrimonio,

      localNovo:
        patrimonio.local,

      statusAnterior:
        patrimonio.status,

      statusNovo:
        'ativo',

      observacao:
        'Patrimônio reativado/aprovado.',

      databaseUpdates: {
        [`patrimonios/${id}/status`]: 'ativo',
        [`patrimonios/${id}/dataModificacao`]: data
      }

    });


  } catch (error) {

    console.error(
      "Erro ao reativar:",
      error
    );

    appAlert(
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
  ).style.display = 'flex';
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


  const patrimonioAnterior =
    dados.find(
      item => item.id === editandoId
    );


  if (!patrimonioAnterior) {
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

    appAlert(
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

    appAlert(
      `Erro: Patrimônio nº ${numero} já existe!`
    );

    return;

  }


  const houveAlteracao =
    String(patrimonioAnterior.numero) !== String(numero) ||
    patrimonioAnterior.local !== local ||
    patrimonioAnterior.descricao !== descricao ||
    (patrimonioAnterior.status || 'ativo') !== status;

  if (!houveAlteracao) {
    appAlert(
      'Nenhuma alteração foi realizada.',
      'Editar patrimônio'
    );
    return;
  }


  try {

    const data =
      new Date().toISOString();


    // =====================================================
    // DESCOBRIR O TIPO DA ALTERAÇÃO
    // =====================================================

    const houveMovimentacao =
      patrimonioAnterior.local !== local;


    const houveAlteracaoDescricao =
      patrimonioAnterior.descricao !== descricao;


    const houveAlteracaoStatus =
      patrimonioAnterior.status !== status;


    let tipoEvento =
      'alteracao';


    if (
      houveMovimentacao &&
      !houveAlteracaoDescricao &&
      !houveAlteracaoStatus
    ) {

      tipoEvento =
        'movimentacao';

    }


    await registrarEvento({

      tipo:
        tipoEvento,

      patrimonioId:
        editandoId,

      patrimonio: {

        numero

      },

      numeroAnterior:
        patrimonioAnterior.numero,

      numeroNovo:
        numero,

      localAnterior:
        patrimonioAnterior.local,

      localNovo:
        local,


      descricaoAnterior:
        patrimonioAnterior.descricao,

      descricaoNova:
        descricao,


      statusAnterior:
        patrimonioAnterior.status,

      statusNovo:
        status,


      observacao:
        houveMovimentacao
          ? 'Patrimônio movimentado para outro local.'
          : 'Dados do patrimônio alterados.',

      databaseUpdates: {
        [`patrimonios/${editandoId}`]: {
          ...patrimonioAnterior,
          numero,
          local,
          descricao,
          status,
          dataModificacao: data
        }
      }

    });


    fecharModal();


    appAlert(
      "Atualizado com sucesso!"
    );


  } catch (error) {

    console.error(
      "Erro ao salvar edição:",
      error
    );

    appAlert(
      "Não foi possível salvar as alterações."
    );

  }

}


// =========================================================
// FORMATAR DATA
// =========================================================
