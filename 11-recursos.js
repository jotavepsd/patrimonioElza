/* =========================================================
   RECURSOS EXTRAS DO SISTEMA
   - Filtros avançados
   - Lixeira / restauração
   - Desfazer ações da auditoria
   - Exportação da auditoria (CSV / impressão-PDF)
   - Dashboard complementar
   ========================================================= */

var filtroLocalAvancado = '';
var filtroDescricaoAvancado = '';
var filtroDataInicioAvancado = '';
var filtroDataFimAvancado = '';

function normalizarTextoRecurso(valor) {
  return String(valor ?? '').trim().toLowerCase();
}

function escaparCsv(valor) {
  return `"${String(valor ?? '').replace(/"/g, '""')}"`;
}

function patrimonioAtivoParaConsulta(item) {
  return item && item.status !== 'excluido';
}

function obterAuditoriaFiltradaParaExportacao() {
  const tipo = document.getElementById('auditoriaFiltroTipo')?.value || 'todos';
  const patrimonio = normalizarTextoRecurso(document.getElementById('auditoriaFiltroPatrimonio')?.value);
  const usuario = normalizarTextoRecurso(document.getElementById('auditoriaFiltroUsuario')?.value);
  const inicio = document.getElementById('auditoriaFiltroDataInicio')?.value || '';
  const fim = document.getElementById('auditoriaFiltroDataFim')?.value || '';

  return (auditoriaEventos || []).filter(evento => {
    const dataEvento = String(evento.data || '').slice(0, 10);
    const matchTipo = tipo === 'todos' || evento.tipo === tipo;
    const matchPatrimonio = !patrimonio || normalizarTextoRecurso(evento.numero).includes(patrimonio);
    const nome = normalizarTextoRecurso(evento.usuario?.nome);
    const email = normalizarTextoRecurso(evento.usuario?.email);
    const matchUsuario = !usuario || nome.includes(usuario) || email.includes(usuario);
    const matchInicio = !inicio || dataEvento >= inicio;
    const matchFim = !fim || dataEvento <= fim;
    return matchTipo && matchPatrimonio && matchUsuario && matchInicio && matchFim;
  });
}

function exportarAuditoriaCSV() {
  const eventos = obterAuditoriaFiltradaParaExportacao();
  if (!eventos.length) {
    appAlert('Nenhum evento encontrado com os filtros atuais.', 'Exportação', { icone: '📄' });
    return;
  }

  const cabecalho = ['Data/Hora', 'Ação', 'Patrimônio', 'Usuário', 'E-mail', 'Patrimônio anterior', 'Patrimônio novo', 'Local anterior', 'Local novo', 'Descrição anterior', 'Descrição nova', 'Status anterior', 'Status novo', 'Observação'];
  const linhas = eventos.map(e => [
    e.data, e.acao || e.tipo, e.numero, e.usuario?.nome, e.usuario?.email,
    e.numeroAnterior, e.numeroNovo, e.localAnterior, e.localNovo,
    e.descricaoAnterior, e.descricaoNova, e.statusAnterior, e.statusNovo, e.observacao
  ]);

  const csv = '\ufeff' + [cabecalho, ...linhas].map(linha => linha.map(escaparCsv).join(';')).join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `auditoria-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function imprimirAuditoria() {
  const eventos = obterAuditoriaFiltradaParaExportacao();
  if (!eventos.length) {
    appAlert('Nenhum evento encontrado com os filtros atuais.', 'Impressão', { icone: '🖨️' });
    return;
  }

  const linhas = eventos.map(e => `
    <tr>
      <td>${formatarDataHistorico(e.data)}</td>
      <td>${e.acao || e.tipo}</td>
      <td>${e.numero || '—'}</td>
      <td>${e.usuario?.nome || '—'}</td>
      <td>${e.observacao || ''}${e.localAnterior !== e.localNovo && e.localAnterior != null ? `<br>Local: ${e.localAnterior || '—'} → ${e.localNovo || '—'}` : ''}${e.descricaoAnterior !== e.descricaoNova && e.descricaoAnterior != null ? `<br>Descrição: ${e.descricaoAnterior || '—'} → ${e.descricaoNova || '—'}` : ''}${e.statusAnterior !== e.statusNovo && (e.statusAnterior != null || e.statusNovo != null) ? `<br>Status: ${e.statusAnterior || '—'} → ${e.statusNovo || '—'}` : ''}</td>
    </tr>`).join('');

  const janela = window.open('', '_blank');
  if (!janela) {
    appAlert('O navegador bloqueou a janela de impressão. Permita pop-ups para este site.', 'Impressão', { icone: '⚠️' });
    return;
  }

  janela.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>Auditoria</title><style>body{font-family:Arial,sans-serif;padding:20px}h1{font-size:22px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #ccc;padding:6px;text-align:left;vertical-align:top}th{background:#eee}@media print{button{display:none}}</style></head><body><h1>Auditoria do Patrimônio</h1><p>Gerado em ${new Date().toLocaleString('pt-BR')}</p><table><thead><tr><th>Data/Hora</th><th>Ação</th><th>Patrimônio</th><th>Usuário</th><th>Detalhes</th></tr></thead><tbody>${linhas}</tbody></table><script>window.onload=()=>window.print()<\/script></body></html>`);
  janela.document.close();
}

async function desfazerEventoAuditoria(eventId) {
  if (!validarAcessoAdmin()) return;
  const evento = (auditoriaEventos || []).find(e => e.id === eventId);
  if (!evento || !evento.patrimonioId) return;

  const patrimonioAtual = dados.find(d => d.id === evento.patrimonioId);
  if (!patrimonioAtual && evento.tipo !== 'exclusao' && evento.tipo !== 'cadastro') {
    appAlert('O patrimônio não está disponível para desfazer esta ação.', 'Desfazer', { icone: '⚠️' });
    return;
  }

  const ok = await appConfirm(
    `Desfazer a ação "${evento.acao || evento.tipo}" do patrimônio ${evento.numero || patrimonioAtual?.numero || ''}?`,
    'Desfazer ação',
    { icone: '↩️', confirmarTexto: 'Desfazer' }
  );
  if (!ok) return;

  try {
    const id = evento.patrimonioId;
    const atual = patrimonioAtual || {};
    const agora = new Date().toISOString();
    const updates = {};

    if (evento.tipo === 'cadastro') {
      updates[`patrimonios/${id}/status`] = 'excluido';
      updates[`patrimonios/${id}/excluido`] = true;
      updates[`patrimonios/${id}/dataExclusao`] = agora;
      updates[`patrimonios/${id}/dataModificacao`] = agora;
    } else {
      const restaurado = {
        ...atual,
        numero: evento.numeroAnterior ?? atual.numero,
        local: evento.localAnterior ?? atual.local,
        descricao: evento.descricaoAnterior ?? atual.descricao,
        status: evento.statusAnterior || 'ativo',
        excluido: false,
        dataModificacao: agora
      };
      delete restaurado.dataExclusao;
      updates[`patrimonios/${id}`] = restaurado;
    }

    await registrarEvento({
      tipo: 'desfazer',
      patrimonioId: id,
      patrimonio: { numero: evento.numero || atual.numero },
      numeroAnterior: atual.numero,
      numeroNovo: evento.numeroAnterior ?? atual.numero,
      localAnterior: atual.local,
      localNovo: evento.localAnterior ?? atual.local,
      descricaoAnterior: atual.descricao,
      descricaoNova: evento.descricaoAnterior ?? atual.descricao,
      statusAnterior: atual.status || 'ativo',
      statusNovo: evento.tipo === 'cadastro' ? 'excluido' : (evento.statusAnterior || 'ativo'),
      observacao: `Ação desfeita: ${evento.acao || evento.tipo}.`,
      databaseUpdates: updates
    });

    appAlert('A ação foi desfeita com sucesso.', 'Desfazer', { icone: '✅' });
    if (typeof renderizar === 'function') renderizar();
    renderizarLixeira();
  } catch (error) {
    console.error('Erro ao desfazer evento:', error);
    appAlert('Não foi possível desfazer a ação.', 'Erro', { icone: '❌' });
  }
}

async function restaurarPatrimonio(id) {
  if (!validarAcessoAdmin()) return;
  const item = dados.find(d => d.id === id && d.status === 'excluido');
  if (!item) return;
  if (!await appConfirm(`Restaurar o patrimônio ${item.numero}?`, 'Restaurar patrimônio', { icone: '♻️', confirmarTexto: 'Restaurar' })) return;

  try {
    const agora = new Date().toISOString();
    await registrarEvento({
      tipo: 'restauracao',
      patrimonioId: id,
      patrimonio: item,
      statusAnterior: 'excluido',
      statusNovo: 'ativo',
      localAnterior: item.local,
      localNovo: item.local,
      descricaoAnterior: item.descricao,
      descricaoNova: item.descricao,
      observacao: 'Patrimônio restaurado da lixeira.',
      databaseUpdates: {
        [`patrimonios/${id}/status`]: 'ativo',
        [`patrimonios/${id}/excluido`]: false,
        [`patrimonios/${id}/dataModificacao`]: agora,
        [`patrimonios/${id}/dataExclusao`]: null
      }
    });
    appAlert('Patrimônio restaurado com sucesso.', 'Lixeira', { icone: '✅' });
    renderizarLixeira();
  } catch (error) {
    console.error(error);
    appAlert('Não foi possível restaurar o patrimônio.', 'Erro', { icone: '❌' });
  }
}

async function excluirPermanentementeDaLixeira(id) {
  if (!validarAcessoAdmin()) return;
  const item = dados.find(d => d.id === id && d.status === 'excluido');
  if (!item) return;
  if (!await appConfirm(`Excluir permanentemente o patrimônio ${item.numero}? Esta ação não poderá ser desfeita.`, 'Exclusão permanente', { icone: '☠️', confirmarTexto: 'Excluir definitivamente' })) return;

  try {
    const eventId = db.ref('auditoria').push().key;
    const agora = new Date().toISOString();
    const usuario = currentUser || {};
    const evento = {
      id: eventId,
      tipo: 'exclusao_permanente',
      acao: 'EXCLUSÃO PERMANENTE',
      icone: '☠️',
      data: agora,
      usuario: { uid: usuario.uid || null, nome: usuario.nome || usuario.name || usuario.displayName || usuario.email || 'Usuário desconhecido', email: usuario.email || null },
      patrimonioId: id,
      numero: item.numero,
      numeroAnterior: item.numero,
      localAnterior: item.local,
      descricaoAnterior: item.descricao,
      statusAnterior: item.status,
      observacao: 'Patrimônio excluído permanentemente da lixeira.'
    };
    await db.ref().update({ [`auditoria/${eventId}`]: evento, [`historico/${id}/${eventId}`]: evento, [`patrimonios/${id}`]: null });
    appAlert('Patrimônio excluído permanentemente.', 'Lixeira', { icone: '✅' });
    renderizarLixeira();
  } catch (error) {
    console.error(error);
    appAlert('Não foi possível excluir permanentemente.', 'Erro', { icone: '❌' });
  }
}

function renderizarLixeira() {
  const lista = document.getElementById('lixeiraLista');
  const resumo = document.getElementById('lixeiraResumo');
  if (!lista) return;

  const itens = dados.filter(d => d.status === 'excluido').sort((a,b) => String(b.dataExclusao || b.dataModificacao || '').localeCompare(String(a.dataExclusao || a.dataModificacao || '')));
  if (resumo) resumo.textContent = `${itens.length} patrimônio(s) na lixeira`;

  if (!itens.length) {
    lista.innerHTML = '<div class="auditoria-vazia"><div>🗑️</div><h3>Lixeira vazia</h3><p>Nenhum patrimônio excluído.</p></div>';
    return;
  }

  lista.innerHTML = `<div class="table-wrapper"><table><thead><tr><th>Patrimônio</th><th>Descrição</th><th>Local</th><th>Excluído em</th><th>Ações</th></tr></thead><tbody>${itens.map(item => `<tr><td><strong>${item.numero}</strong></td><td>${item.descricao || '—'}</td><td>${item.local || '—'}</td><td>${formatarData(item.dataExclusao || item.dataModificacao)}</td><td class="action-buttons"><button class="btn-edit" data-lixeira-action="restaurar" data-id="${item.id}">♻️ Restaurar</button><button class="btn-baixa-status" data-lixeira-action="permanente" data-id="${item.id}">☠️ Excluir</button></td></tr>`).join('')}</tbody></table></div>`;
  lista.querySelectorAll('[data-lixeira-action]').forEach(btn => btn.addEventListener('click', () => {
    const id = btn.dataset.id;
    if (btn.dataset.lixeiraAction === 'restaurar') restaurarPatrimonio(id);
    else excluirPermanentementeDaLixeira(id);
  }));
}

function abrirLixeira() {
  abrirView('lixeira');
  renderizarLixeira();
}

function atualizarDashboardExtra() {
  const recentes = document.getElementById('dashboardAcoesRecentes');
  const porLocal = document.getElementById('dashboardPorLocal');
  if (!recentes && !porLocal) return;

  const ativos = dados.filter(patrimonioAtivoParaConsulta);
  if (porLocal) {
    const mapa = {};
    ativos.forEach(item => { const local = item.local || 'Sem local'; mapa[local] = (mapa[local] || 0) + 1; });
    porLocal.innerHTML = Object.entries(mapa).sort((a,b) => b[1]-a[1]).slice(0, 10).map(([local, total]) => `<div class="dashboard-local-row"><span>${local}</span><strong>${total}</strong></div>`).join('') || '<p>Nenhum dado.</p>';
  }

  if (recentes) {
    const eventos = (typeof auditoriaEventos !== 'undefined' ? auditoriaEventos : []).slice(0, 8);
    recentes.innerHTML = eventos.length ? eventos.map(e => `<div class="dashboard-evento-row"><span>${e.icone || '📝'} ${e.acao || e.tipo}</span><strong>${e.numero || '—'}</strong><small>${formatarDataHistorico(e.data)}</small></div>`).join('') : '<p>Nenhuma ação registrada.</p>';
  }
}

function inicializarRecursosExtras() {
  const filtroLocal = document.getElementById('filtroLocalAvancado');
  const filtroDesc = document.getElementById('filtroDescricaoAvancado');
  const filtroInicio = document.getElementById('filtroDataInicioAvancado');
  const filtroFim = document.getElementById('filtroDataFimAvancado');
  const limpar = document.getElementById('btnLimparFiltrosAvancados');

  const atualizar = () => {
    filtroLocalAvancado = filtroLocal?.value || '';
    filtroDescricaoAvancado = filtroDesc?.value || '';
    filtroDataInicioAvancado = filtroInicio?.value || '';
    filtroDataFimAvancado = filtroFim?.value || '';
    renderizar();
  };
  [filtroLocal, filtroDesc, filtroInicio, filtroFim].forEach(el => el?.addEventListener('input', atualizar));
  [filtroLocal, filtroDesc].forEach(el => el?.addEventListener('change', atualizar));
  limpar?.addEventListener('click', () => {
    [filtroLocal, filtroDesc, filtroInicio, filtroFim].forEach(el => { if (el) el.value = ''; });
    atualizar();
  });

  document.getElementById('btnExportarAuditoriaCSV')?.addEventListener('click', exportarAuditoriaCSV);
  document.getElementById('btnImprimirAuditoria')?.addEventListener('click', imprimirAuditoria);
  document.getElementById('btnAbrirLixeira')?.addEventListener('click', abrirLixeira);

  if (typeof iniciarListenerAuditoria === 'function') iniciarListenerAuditoria();
}

window.addEventListener('DOMContentLoaded', inicializarRecursosExtras);
