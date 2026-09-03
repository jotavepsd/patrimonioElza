// =========================================================
// HISTÓRICO E AUDITORIA
// =========================================================


// =========================================================
// CONFIGURAÇÃO DOS TIPOS DE EVENTO
// =========================================================

const TIPOS_AUDITORIA = {

  cadastro: {
    label: 'CADASTRO',
    icone: '🟢'
  },

  alteracao: {
    label: 'ALTERAÇÃO',
    icone: '✏️'
  },

  movimentacao: {
    label: 'MOVIMENTAÇÃO',
    icone: '📦'
  },

  entrada_analise: {
    label: 'ENTRADA EM ANÁLISE',
    icone: '⚠️'
  },

  reativacao: {
    label: 'REATIVAÇÃO',
    icone: '✅'
  },

  baixa: {
    label: 'BAIXA',
    icone: '❌'
  },

  exclusao: {
    label: 'EXCLUSÃO/REMOÇÃO',
    icone: '🗑️'
  },

  restauracao: {
    label: 'RESTAURAÇÃO',
    icone: '♻️'
  },

  cadastro_local: {
    label: 'NOVO LOCAL',
    icone: '📍'
  },

  cadastro_descricao: {
    label: 'NOVA DESCRIÇÃO',
    icone: '🏷️'
  },

  importacao_backup: {
    label: 'IMPORTAÇÃO DE BACKUP',
    icone: '📥'
  },

  inventario_iniciado: {
    label: 'INVENTÁRIO INICIADO',
    icone: '📋'
  },

  inventario_finalizado: {
    label: 'INVENTÁRIO FINALIZADO',
    icone: '📋'
  },

  desfazer: {
    label: 'AÇÃO DESFEITA',
    icone: '↩️'
  },

  exclusao_permanente: {
    label: 'EXCLUSÃO PERMANENTE',
    icone: '☠️'
  }

};


// =========================================================
// REGISTRAR EVENTO
// =========================================================

async function registrarEvento({
  tipo,
  patrimonioId = null,
  patrimonio = null,
  observacao = null,

  numeroAnterior = null,
  numeroNovo = null,

  localAnterior = null,
  localNovo = null,

  descricaoAnterior = null,
  descricaoNova = null,

  statusAnterior = null,
  statusNovo = null,
  databaseUpdates = {}
}) {

  try {
    console.log('>>> registrarEvento FOI CHAMADA', {
  tipo,
  patrimonioId,
  patrimonio
});

    if (!tipo) {
      console.warn(
        'Tentativa de registrar auditoria sem tipo.'
      );

      return null;
    }


    const configuracao =
      TIPOS_AUDITORIA[tipo] ||
      {
        label: tipo.toUpperCase(),
        icone: '📝'
      };


    const usuario =
      typeof currentUser !== 'undefined'
        ? currentUser
        : {};


    const eventId =
      db
        .ref('auditoria')
        .push()
        .key;


    const agora =
      new Date().toISOString();


    const numero =
      patrimonio?.numero ??
      null;


    const evento = {

      id: eventId,

      tipo,

      acao:
        configuracao.label,

      icone:
        configuracao.icone,

      data:
        agora,

      usuario: {

        uid:
          usuario.uid ||
          null,

        nome:
          usuario.nome ||
          usuario.name ||
          usuario.displayName ||
          usuario.email ||
          'Usuário desconhecido',

        email:
          usuario.email ||
          null

      },

      patrimonioId,

      numero,
      numeroAnterior,
      numeroNovo,

      localAnterior,

      localNovo,

      descricaoAnterior,

      descricaoNova,

      statusAnterior,

      statusNovo,

      observacao

    };


    // ================================================
    // GRAVAÇÃO ATÔMICA
    // Auditoria, histórico e alteração do patrimônio são
    // enviados em uma única atualização multi-local.
    // O Firebase confirma a operação como um conjunto:
    // ou todas as alterações são aplicadas, ou nenhuma.
    // ================================================

    const atualizacoes = {
      [`auditoria/${eventId}`]: evento,
      ...databaseUpdates
    };

    if (patrimonioId) {
      atualizacoes[`historico/${patrimonioId}/${eventId}`] = evento;
    }

    await db.ref().update(atualizacoes);

    console.log(
      'AUDITORIA GRAVADA COM SUCESSO:',
      evento
    );

    // Se a tela de auditoria estiver aberta, atualiza a lista
    // imediatamente sem exigir que o usuário saia e entre novamente.
    if (typeof view !== 'undefined' && view === 'auditoria') {
      await carregarAuditoria();
    }

    return evento;


  } catch (error) {

    console.error(
      'ERRO REAL DA AUDITORIA:',
      error
    );


    throw error;

  }

}



// =========================================================
// ABRIR HISTÓRICO DE UM PATRIMÔNIO
// =========================================================

async function abrirHistorico(id) {

  if (!id) {
    return;
  }


  const patrimonio =
    dados.find(
      item => item.id === id
    );


  if (!patrimonio) {

    appAlert(
      'Patrimônio não encontrado.'
    );

    return;

  }


  const historicoRef =
    db.ref(
      `historico/${id}`
    );


  try {

    const snapshot =
      await historicoRef.once(
        'value'
      );


    const dadosHistorico =
      snapshot.val() || {};


    const eventos =
      Object.values(
        dadosHistorico
      ).sort(
        (a, b) =>
          new Date(b.data) -
          new Date(a.data)
      );


    renderizarHistorico(
      patrimonio,
      eventos
    );


  } catch (error) {

    console.error(
      'Erro ao carregar histórico:',
      error
    );

    appAlert(
      'Não foi possível carregar o histórico.'
    );

  }

}


// =========================================================
// RENDERIZAR HISTÓRICO
// =========================================================

function renderizarHistorico(
  patrimonio,
  eventos
) {

  const modal =
    document.getElementById(
      'historicoModal'
    );


  const titulo =
    document.getElementById(
      'historicoTitulo'
    );


  const conteudo =
    document.getElementById(
      'historicoConteudo'
    );


  if (
    !modal ||
    !titulo ||
    !conteudo
  ) {

    console.error(
      'Elementos do histórico não encontrados.'
    );

    return;

  }


  titulo.innerHTML = `
    Histórico do Patrimônio
    <span>${patrimonio.numero}</span>
  `;


  if (
    eventos.length === 0
  ) {

    conteudo.innerHTML = `
      <div class="historico-vazio">

        <div class="historico-vazio-icone">
          📜
        </div>

        <h3>Nenhum evento registrado</h3>

        <p>
          Este patrimônio ainda não possui
          registros no histórico.
        </p>

      </div>
    `;

    modal.style.display = 'flex';

    return;

  }


  conteudo.innerHTML = `

    <div class="historico-patrimonio-resumo">

      <div>
        <span>Patrimônio</span>
        <strong>${patrimonio.numero}</strong>
      </div>

      <div>
        <span>Descrição</span>
        <strong>${patrimonio.descricao}</strong>
      </div>

      <div>
        <span>Local atual</span>
        <strong>${patrimonio.local}</strong>
      </div>

      <div>
        <span>Status atual</span>
        <strong>
          ${formatarStatusHistorico(
            patrimonio.status
          )}
        </strong>
      </div>

    </div>


    <div class="historico-timeline">

      ${eventos
        .map(
          evento =>
            renderizarEventoHistorico(
              evento
            )
        )
        .join('')}

    </div>

  `;


  modal.style.display = 'flex';

}


// =========================================================
// RENDERIZAR EVENTO
// =========================================================

function renderizarEventoHistorico(
  evento
) {

  const configuracao =
    TIPOS_AUDITORIA[
      evento.tipo
    ] ||
    {
      label:
        evento.acao ||
        'EVENTO',

      icone:
        evento.icone ||
        '📝'
    };


  const data =
    formatarDataHistorico(
      evento.data
    );


  let detalhes = '';


  if (
    evento.localAnterior ||
    evento.localNovo
  ) {

    if (
      evento.localAnterior !==
      evento.localNovo
    ) {

      detalhes += `
        <div class="historico-detalhe">

          <span>Local</span>

          <strong>
            ${
              evento.localAnterior ||
              'Não informado'
            }

            <span class="historico-seta">
              →
            </span>

            ${
              evento.localNovo ||
              'Não informado'
            }
          </strong>

        </div>
      `;

    } else if (
      evento.localNovo
    ) {

      detalhes += `
        <div class="historico-detalhe">

          <span>Local</span>

          <strong>
            ${evento.localNovo}
          </strong>

        </div>
      `;

    }

  }


  if (
    evento.statusAnterior ||
    evento.statusNovo
  ) {

    if (
      evento.statusAnterior !==
      evento.statusNovo
    ) {

      detalhes += `
        <div class="historico-detalhe">

          <span>Status</span>

          <strong>

            ${formatarStatusHistorico(
              evento.statusAnterior
            )}

            <span class="historico-seta">
              →
            </span>

            ${formatarStatusHistorico(
              evento.statusNovo
            )}

          </strong>

        </div>
      `;

    }

  }


  if (
    evento.descricaoAnterior ||
    evento.descricaoNova
  ) {

    if (
      evento.descricaoAnterior !==
      evento.descricaoNova
    ) {

      detalhes += `
        <div class="historico-detalhe">

          <span>Descrição</span>

          <strong>

            ${
              evento.descricaoAnterior ||
              'Não informado'
            }

            <span class="historico-seta">
              →
            </span>

            ${
              evento.descricaoNova ||
              'Não informado'
            }

          </strong>

        </div>
      `;

    }

  }


  if (
    evento.observacao
  ) {

    detalhes += `
      <div class="historico-observacao">

        <span>Observação</span>

        <p>
          ${evento.observacao}
        </p>

      </div>
    `;

  }


  return `

    <article
      class="historico-evento"
      data-tipo="${evento.tipo}"
    >

      <div class="historico-evento-marcador">

        ${configuracao.icone}

      </div>


      <div class="historico-evento-conteudo">

        <div class="historico-evento-topo">

          <strong>
            ${configuracao.label}
          </strong>

          <span>
            ${data}
          </span>

        </div>


        ${detalhes}


        <div class="historico-usuario">

          👤

          ${
            evento.usuario?.nome ||
            'Usuário desconhecido'
          }

        </div>

      </div>

    </article>

  `;

}


// =========================================================
// FECHAR HISTÓRICO
// =========================================================

function fecharHistorico() {

  const modal =
    document.getElementById(
      'historicoModal'
    );


  if (modal) {
    modal.style.display = 'none';
  }

}


// =========================================================
// UTILITÁRIOS
// =========================================================

function formatarDataHistorico(
  data
) {

  if (!data) {
    return 'Data não informada';
  }


  const d =
    new Date(data);


  if (
    Number.isNaN(
      d.getTime()
    )
  ) {

    return 'Data inválida';

  }


  return d.toLocaleString(
    'pt-BR',
    {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }
  );

}


function formatarStatusHistorico(
  status
) {

  const nomes = {

    ativo:
      'ATIVO',

    analise:
      'EM ANÁLISE',

    baixado:
      'BAIXADO'

  };


  return nomes[
    status
  ] ||
    status ||
    'NÃO INFORMADO';

}

// =========================================================
// AUDITORIA GERAL
// =========================================================

let auditoriaEventos = [];
let auditoriaListenerAtivo = false;


async function carregarAuditoria() {

  const lista =
    document.getElementById('auditoriaLista');

  const resumo =
    document.getElementById('auditoriaResumo');

  if (!lista) {
    console.error('AUDITORIA: elemento #auditoriaLista não encontrado.');
    return;
  }

  console.log('AUDITORIA: iniciando leitura de /auditoria');

  lista.innerHTML = `
    <div class="auditoria-carregando">
      Carregando auditoria...
    </div>
  `;

  try {

    const snapshot = await db.ref('auditoria').once('value');

    console.log('AUDITORIA: snapshot recebido', {
      exists: snapshot.exists(),
      numChildren: snapshot.numChildren(),
      valor: snapshot.val()
    });

    if (!snapshot.exists()) {
      auditoriaEventos = [];
      if (resumo) resumo.innerHTML = '';
      lista.innerHTML = `
        <div class="auditoria-vazia">
          <div>🔎</div>
          <h3>Nenhum evento registrado</h3>
          <p>Ainda não existem registros na auditoria.</p>
        </div>
      `;
      return;
    }

    const dadosAuditoria = snapshot.val();

    // Object.entries é usado para garantir que somente registros
    // realmente existentes no nó /auditoria sejam transformados em eventos.
    auditoriaEventos = Object.entries(dadosAuditoria)
      .filter(([, evento]) => evento && typeof evento === 'object')
      .map(([key, evento]) => ({
        ...evento,
        id: evento.id || key
      }))
      .sort((a, b) => {
        const dataA = new Date(a.data || 0).getTime();
        const dataB = new Date(b.data || 0).getTime();
        return dataB - dataA;
      });

    console.log(
      'AUDITORIA: eventos preparados para renderização:',
      auditoriaEventos.length,
      auditoriaEventos
    );

    renderizarAuditoria();

  } catch (error) {

    console.error('AUDITORIA: erro ao carregar /auditoria:', error);

    auditoriaEventos = [];

    if (resumo) {
      resumo.innerHTML = '';
    }

    lista.innerHTML = `
      <div class="auditoria-vazia">
        <div>⚠️</div>
        <h3>Erro ao carregar a auditoria</h3>
        <p>${error?.message || error}</p>
      </div>
    `;

  }

}


// Mantém a tela de Auditoria sincronizada com o Firebase enquanto ela
// estiver aberta. O listener é registrado apenas uma vez.
function iniciarListenerAuditoria() {

  if (auditoriaListenerAtivo) {
    return;
  }

  auditoriaListenerAtivo = true;

  db.ref('auditoria').on(
    'value',
    snapshot => {

      // Só atualiza a interface se a tela existir no DOM.
      const lista = document.getElementById('auditoriaLista');
      if (!lista) return;

      const dadosAuditoria = snapshot.val() || {};

      auditoriaEventos = Object.entries(dadosAuditoria)
        .filter(([, evento]) => evento && typeof evento === 'object')
        .map(([key, evento]) => ({
          ...evento,
          id: evento.id || key
        }))
        .sort((a, b) =>
          new Date(b.data || 0).getTime() -
          new Date(a.data || 0).getTime()
        );

      console.log(
        'AUDITORIA: atualização em tempo real recebida:',
        auditoriaEventos.length
      );

      renderizarAuditoria();
      if (typeof atualizarDashboardExtra === 'function') atualizarDashboardExtra();
    },
    error => {
      console.error(
        'AUDITORIA: erro no listener /auditoria:',
        error
      );
    }
  );

}


function renderizarAuditoria() {

  const lista =
    document.getElementById('auditoriaLista');

  const resumo =
    document.getElementById('auditoriaResumo');

  // A lista é o elemento obrigatório. O resumo é opcional para que
  // um problema no cabeçalho nunca impeça a auditoria de aparecer.
  if (!lista) {
    console.error('AUDITORIA: não foi possível renderizar; #auditoriaLista não existe.');
    return;
  }

  try {

    const tipo =
      document.getElementById('auditoriaFiltroTipo')?.value || 'todos';

    const patrimonio =
      document.getElementById('auditoriaFiltroPatrimonio')?.value
        ?.trim()
        .toLowerCase() || '';

    const usuario =
      document.getElementById('auditoriaFiltroUsuario')?.value
        ?.trim()
        .toLowerCase() || '';

    const dataInicio = document.getElementById('auditoriaFiltroDataInicio')?.value || '';
    const dataFim = document.getElementById('auditoriaFiltroDataFim')?.value || '';

    const filtrados = auditoriaEventos.filter(evento => {

      const matchTipo =
        tipo === 'todos' || evento.tipo === tipo;

      const matchPatrimonio =
        !patrimonio ||
        String(evento.numero || '')
          .toLowerCase()
          .includes(patrimonio);

      const nomeUsuario =
        String(evento.usuario?.nome || '')
          .toLowerCase();

      const emailUsuario =
        String(evento.usuario?.email || '')
          .toLowerCase();

      const matchUsuario =
        !usuario ||
        nomeUsuario.includes(usuario) ||
        emailUsuario.includes(usuario);

      const dataEvento = String(evento.data || '').slice(0, 10);
      const matchDataInicio = !dataInicio || dataEvento >= dataInicio;
      const matchDataFim = !dataFim || dataEvento <= dataFim;

      return matchTipo && matchPatrimonio && matchUsuario && matchDataInicio && matchDataFim;
    });

    console.log('AUDITORIA: renderizando', {
      total: auditoriaEventos.length,
      filtrados: filtrados.length,
      tipo,
      patrimonio,
      usuario
    });

    if (resumo) {
      resumo.innerHTML = `
        <div class="auditoria-resumo-card">
          <span>Eventos encontrados</span>
          <strong>${filtrados.length}</strong>
        </div>
      `;
    }

    if (filtrados.length === 0) {

      lista.innerHTML = `
        <div class="auditoria-vazia">
          <div>🔎</div>
          <h3>Nenhum evento encontrado</h3>
          <p>Tente alterar os filtros.</p>
        </div>
      `;

      return;
    }

    lista.innerHTML = `
      <div class="table-wrapper">
        <table class="auditoria-tabela">
          <thead>
            <tr>
              <th>Data/Hora</th>
              <th>Ação</th>
              <th>Patrimônio</th>
              <th>Usuário</th>
              <th>Detalhes</th>
            </tr>
          </thead>
          <tbody>
            ${filtrados.map(evento => renderizarLinhaAuditoria(evento)).join('')}
          </tbody>
        </table>
      </div>
    `;

    lista.querySelectorAll('[data-desfazer-evento]').forEach(botao => {
      botao.addEventListener('click', () => desfazerEventoAuditoria(botao.dataset.desfazerEvento));
    });

  } catch (error) {

    console.error('AUDITORIA: erro durante a renderização:', error);

    lista.innerHTML = `
      <div class="auditoria-vazia">
        <div>⚠️</div>
        <h3>Erro ao renderizar a auditoria</h3>
        <p>${error?.message || error}</p>
      </div>
    `;

  }

}


function renderizarLinhaAuditoria(
  evento
) {

  const configuracao =
    TIPOS_AUDITORIA[
      evento.tipo
    ] ||
    {
      label:
        evento.acao ||
        'EVENTO',

      icone:
        evento.icone ||
        '📝'
    };


  // Mostra somente os campos que realmente mudaram.
  // Isso evita casos como "ATIVO → ATIVO" quando, na verdade,
  // a descrição ou o local foram alterados.
  const mudancas = [];

  if (
    evento.numeroAnterior != null &&
    evento.numeroNovo != null &&
    String(evento.numeroAnterior) !== String(evento.numeroNovo)
  ) {
    mudancas.push(
      `<div><strong>Patrimônio:</strong> ${evento.numeroAnterior} → ${evento.numeroNovo}</div>`
    );
  }

  if (
    evento.localAnterior != null &&
    evento.localNovo != null &&
    String(evento.localAnterior) !== String(evento.localNovo)
  ) {
    mudancas.push(
      `<div><strong>Local:</strong> ${evento.localAnterior} → ${evento.localNovo}</div>`
    );
  }

  if (
    evento.descricaoAnterior != null &&
    evento.descricaoNova != null &&
    String(evento.descricaoAnterior) !== String(evento.descricaoNova)
  ) {
    mudancas.push(
      `<div><strong>Descrição:</strong> ${evento.descricaoAnterior} → ${evento.descricaoNova}</div>`
    );
  }

  if (
    (evento.statusAnterior != null || evento.statusNovo != null) &&
    String(evento.statusAnterior || '') !== String(evento.statusNovo || '')
  ) {
    mudancas.push(
      `<div><strong>Status:</strong> ${formatarStatusHistorico(evento.statusAnterior)} → ${formatarStatusHistorico(evento.statusNovo)}</div>`
    );
  }

  let detalhes =
    mudancas.length > 0
      ? mudancas.join('')
      : (evento.observacao || '—');


  return `

    <tr>

      <td>
        ${formatarDataHistorico(
          evento.data
        )}
      </td>


      <td>

        <span
          class="auditoria-acao"
          data-tipo="${evento.tipo}"
        >

          ${configuracao.icone}

          ${configuracao.label}

        </span>

      </td>


      <td>

        ${
          evento.numero
            ? `<strong>${evento.numero}</strong>`
            : '—'
        }

      </td>


      <td>

        <div>
          ${
            evento.usuario?.nome ||
            'Usuário desconhecido'
          }
        </div>

        <small>
          ${
            evento.usuario?.email ||
            ''
          }
        </small>

      </td>


      <td>
        ${detalhes}
        ${['alteracao','movimentacao','entrada_analise','reativacao','baixa','cadastro'].includes(evento.tipo) && evento.tipo !== 'desfazer' && evento.tipo !== 'exclusao_permanente' ? `<div class="auditoria-acoes-linha"><button type="button" class="btn-auditoria-desfazer" data-desfazer-evento="${evento.id}">↩️ Desfazer</button></div>` : ''}
      </td>

    </tr>

  `;

}