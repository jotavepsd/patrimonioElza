// =========================================================
// MODAIS GLOBAIS
// Substitui alert(), confirm() e prompt() nativos.
// =========================================================

let modalGlobalAberto = false;
let modalGlobalResolver = null;

function garantirModalGlobal() {
  if (document.getElementById('modalGlobal')) return;

  const modal = document.createElement('div');
  modal.id = 'modalGlobal';
  modal.className = 'modal modal-global';
  modal.innerHTML = `
    <div class="modal-content modal-global-content" role="dialog" aria-modal="true" aria-labelledby="modalGlobalTitulo">
      <button type="button" class="modal-global-fechar" aria-label="Fechar">×</button>
      <div id="modalGlobalIcone" class="modal-global-icone"></div>
      <h2 id="modalGlobalTitulo"></h2>
      <div id="modalGlobalMensagem" class="modal-global-mensagem"></div>
      <input id="modalGlobalInput" class="modal-global-input" type="text" autocomplete="off" style="display:none">
      <div class="modal-global-acoes">
        <button type="button" id="modalGlobalCancelar" class="btn-secondary">Cancelar</button>
        <button type="button" id="modalGlobalConfirmar" class="btn-primary">OK</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const fechar = (valor = false) => resolverModalGlobal(valor);
  modal.querySelector('.modal-global-fechar').addEventListener('click', () => fechar(false));
  modal.querySelector('#modalGlobalCancelar').addEventListener('click', () => fechar(false));
  modal.addEventListener('click', event => {
    if (event.target === modal && modal.dataset.permitirCliqueFora === 'true') fechar(false);
  });

  document.addEventListener('keydown', event => {
    if (!modalGlobalAberto) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      fechar(false);
    }
    if (event.key === 'Enter' && modal.dataset.tipo === 'prompt' && document.activeElement === modal.querySelector('#modalGlobalInput')) {
      event.preventDefault();
      fechar(modal.querySelector('#modalGlobalInput').value.trim());
    }
  });
}

function resolverModalGlobal(valor) {
  if (!modalGlobalAberto) return;
  const resolver = modalGlobalResolver;
  modalGlobalResolver = null;
  modalGlobalAberto = false;

  const modal = document.getElementById('modalGlobal');
  if (modal) modal.style.display = 'none';

  if (resolver) resolver(valor);
}

function abrirModalGlobal({
  tipo = 'alert',
  titulo = 'Aviso',
  mensagem = '',
  icone = 'ℹ️',
  confirmarTexto = 'OK',
  cancelarTexto = 'Cancelar',
  valorInicial = '',
  permitirCliqueFora = false
} = {}) {
  garantirModalGlobal();

  if (modalGlobalAberto) resolverModalGlobal(false);

  const modal = document.getElementById('modalGlobal');
  const iconeEl = document.getElementById('modalGlobalIcone');
  const tituloEl = document.getElementById('modalGlobalTitulo');
  const mensagemEl = document.getElementById('modalGlobalMensagem');
  const input = document.getElementById('modalGlobalInput');
  const cancelar = document.getElementById('modalGlobalCancelar');
  const confirmar = document.getElementById('modalGlobalConfirmar');

  modal.dataset.tipo = tipo;
  modal.dataset.permitirCliqueFora = permitirCliqueFora ? 'true' : 'false';
  iconeEl.textContent = icone;
  tituloEl.textContent = titulo;
  mensagemEl.textContent = String(mensagem);
  confirmar.textContent = confirmarTexto;
  cancelar.textContent = cancelarTexto;

  const ehPrompt = tipo === 'prompt';
  const ehConfirm = tipo === 'confirm' || ehPrompt;
  input.style.display = ehPrompt ? 'block' : 'none';
  input.value = ehPrompt ? valorInicial : '';
  cancelar.style.display = ehConfirm ? 'inline-flex' : 'none';

  modal.style.display = 'flex';
  modalGlobalAberto = true;

  return new Promise(resolve => {
    modalGlobalResolver = resolve;
    confirmar.onclick = () => {
      if (ehPrompt) resolverModalGlobal(input.value.trim());
      else resolverModalGlobal(true);
    };

    requestAnimationFrame(() => {
      if (ehPrompt) input.focus();
      else confirmar.focus();
    });
  });
}

function appAlert(mensagem, titulo = 'Aviso', opcoes = {}) {
  return abrirModalGlobal({
    tipo: 'alert',
    titulo,
    mensagem,
    icone: opcoes.icone || 'ℹ️',
    confirmarTexto: opcoes.confirmarTexto || 'OK',
    permitirCliqueFora: opcoes.permitirCliqueFora ?? true
  });
}

function appConfirm(mensagem, titulo = 'Confirmação', opcoes = {}) {
  return abrirModalGlobal({
    tipo: 'confirm',
    titulo,
    mensagem,
    icone: opcoes.icone || '❓',
    confirmarTexto: opcoes.confirmarTexto || 'Confirmar',
    cancelarTexto: opcoes.cancelarTexto || 'Cancelar',
    permitirCliqueFora: opcoes.permitirCliqueFora ?? false
  });
}

function appPrompt(mensagem, valorInicial = '', titulo = 'Informação', opcoes = {}) {
  return abrirModalGlobal({
    tipo: 'prompt',
    titulo,
    mensagem,
    icone: opcoes.icone || '✏️',
    confirmarTexto: opcoes.confirmarTexto || 'Continuar',
    cancelarTexto: opcoes.cancelarTexto || 'Cancelar',
    valorInicial,
    permitirCliqueFora: false
  });
}

window.addEventListener('DOMContentLoaded', garantirModalGlobal);
