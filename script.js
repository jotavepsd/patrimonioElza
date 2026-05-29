// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyC6UbTClmCouKf9GBR-nUjWfIsMk9qhPdM",
  authDomain: "controlepatrimonio-f26a4.firebaseapp.com",
  databaseURL: "https://controlepatrimonio-f26a4-default-rtdb.firebaseio.com",
  projectId: "controlepatrimonio-f26a4",
  storageBucket: "controlepatrimonio-f26a4.firebasestorage.app"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

// Autenticação e Usuários
let currentUser = null;
const users = {
  'admin': { password: 'patrimonioElza', role: 'admin', name: 'Administrador' },
  'user': { password: 'user123', role: 'user', name: 'Usuário' }
};

// Executa automaticamente ao carregar o arquivo para checar login salvo
verificarSessao();

function fazerLogin() {
  const username = document.getElementById('loginUser').value.trim();
  const password = document.getElementById('loginPassword').value;
  const user = users[username];
  
  if (user && user.password === password) {
    currentUser = { username, role: user.role, name: user.name };
    sessionStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('userNameDisplay').textContent = currentUser.name;
    
    const roleSpan = document.getElementById('userRoleDisplay');
    roleSpan.textContent = currentUser.role === 'admin' ? '👑 ADMIN' : '👤 USUÁRIO';
    roleSpan.classList.toggle('admin', currentUser.role === 'admin');
    
    aplicarRestricoes();
    document.getElementById('loginError').textContent = '';
  } else {
    document.getElementById('loginError').textContent = 'Usuário ou senha inválidos!';
  }
}

function logout() {
  currentUser = null;
  sessionStorage.removeItem('currentUser');
  document.getElementById('loginContainer').style.display = 'flex';
  document.getElementById('mainApp').style.display = 'none';
}

function aplicarRestricoes() {
  const isAdmin = currentUser?.role === 'admin';
  const inputs = document.querySelectorAll('#mainApp input, #mainApp select');
  const btnAdd = document.getElementById('btnAdicionar');
  
  inputs.forEach(input => { 
    if (input.id !== 'pesquisa') input.disabled = !isAdmin; 
  });
  if (btnAdd) {
    btnAdd.disabled = !isAdmin;
    btnAdd.style.opacity = isAdmin ? '1' : '0.5';
  }
}

function verificarSessao() {
  const saved = sessionStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    // Garante que os elementos existam na DOM antes de manipular
    window.addEventListener('DOMContentLoaded', () => {
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('mainApp').style.display = 'block';
      document.getElementById('userNameDisplay').textContent = currentUser.name;
      const roleSpan = document.getElementById('userRoleDisplay');
      roleSpan.textContent = currentUser.role === 'admin' ? '👑 ADMIN' : '👤 USUÁRIO';
      roleSpan.classList.toggle('admin', currentUser.role === 'admin');
      aplicarRestricoes();
    });
  }
}

// Variáveis Globais de Estado
let dados = [];
let modo = 'local';
let abaAbertaRecentemente = null;
let editandoId = null;
let filtroStatus = 'todos';

function atualizarDashboard() {
  document.getElementById('totalItens').textContent = dados.length;
  document.getElementById('totalAtivos').textContent = dados.filter(d => d.status === 'ativo').length;
  document.getElementById('totalAnalise').textContent = dados.filter(d => d.status === 'analise').length;
  document.getElementById('totalBaixados').textContent = dados.filter(d => d.status === 'baixado').length;
  document.getElementById('totalLocais').textContent = [...new Set(dados.map(d => d.local))].length;
}

function filtrarTodos() {
  filtroStatus = 'todos';
  document.getElementById('pesquisa').value = '';
  renderizar();
}

function filtrarAtivos() {
  filtroStatus = 'ativo';
  document.getElementById('pesquisa').value = '';
  renderizar();
}

function filtrarAnalise() {
  filtroStatus = 'analise';
  document.getElementById('pesquisa').value = '';
  renderizar();
}

function filtrarBaixados() {
  filtroStatus = 'baixado';
  document.getElementById('pesquisa').value = '';
  renderizar();
}

// Ouvinte em Tempo Real do Firebase
db.ref("patrimonios").on("value", (snapshot) => {
  const val = snapshot.val();
  if (val) {
    dados = Object.keys(val).map(key => ({ id: key, ...val[key] }));
  } else {
    dados = [];
  }
  atualizarDashboard();
  renderizar(abaAbertaRecentemente);
});

function ordenarPatrimonios(a, b) {
  const statusOrder = { 'ativo': 1, 'analise': 2, 'baixado': 3 };
  const orderA = statusOrder[a.status] || 1;
  const orderB = statusOrder[b.status] || 1;
  
  if (orderA !== orderB) return orderA - orderB;
  
  const descA = a.descricao.toLowerCase();
  const descB = b.descricao.toLowerCase();
  const numA = String(a.numero);
  const numB = String(b.numero);
  const termoConjunto = "conjunto de carteira";
  
  if (descA === termoConjunto && descB !== termoConjunto) return 1;
  if (descA !== termoConjunto && descB === termoConjunto) return -1;
  if (descA !== descB) return descA.localeCompare(descB);
  return numA.localeCompare(numB, undefined, { numeric: true, sensitivity: 'base' });
}

function setModo(m) {
  modo = m;
  abaAbertaRecentemente = null; 
  document.getElementById('btnLocal').classList.toggle('active', m === 'local');
  document.getElementById('btnDescricao').classList.toggle('active', m === 'descricao');
  renderizar();
}

function adicionar() {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem cadastrar patrimônios!");
    return;
  }
  
  const numerosStr = document.getElementById('numero').value.trim();
  const local = document.getElementById('local').value;
  const descricao = document.getElementById('descricao').value;

  if (!numerosStr || !local || !descricao) {
    alert("Por favor, preencha todos os campos.");
    return;
  }

  const numeros = numerosStr.split(/\s+/);
  const numerosJaExistentes = [];
  const numerosValidos = [];

  const uniqueNumeros = [...new Set(numeros)];
  if (uniqueNumeros.length !== numeros.length) {
    alert("Erro: Existem números repetidos na lista! Remova as duplicatas.");
    return;
  }

  for (let num of numeros) {
    if (dados.some(item => String(item.numero).toUpperCase() === String(num).toUpperCase())) {
      numerosJaExistentes.push(num);
    } else {
      numerosValidos.push(num);
    }
  }

  if (numerosJaExistentes.length > 0) {
    alert(`Os seguintes patrimônios já existem:\n${numerosJaExistentes.join(', ')}`);
  }

  if (numerosValidos.length === 0) {
    alert("Nenhum número válido para cadastrar.");
    return;
  }

  const dataAtual = new Date().toISOString();
  
  numerosValidos.forEach(numero => {
    db.ref("patrimonios").push({ 
      numero: numero, 
      local: local, 
      descricao: descricao,
      status: 'ativo',
      dataCadastro: dataAtual,
      dataModificacao: dataAtual
    });
  });

  abaAbertaRecentemente = (modo === 'local') ? local : descricao;
  alert(`${numerosValidos.length} patrimônio(s) cadastrado(s)!`);
  
  document.getElementById('numero').value = '';
}

function excluir(id) {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem excluir!");
    return;
  }
  if (confirm("Excluir permanentemente?")) {
    db.ref("patrimonios").child(id).remove();
  }
}

function colocarEmAnalise(id) {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem alterar status!");
    return;
  }
  if (confirm("Marcar como 'Em análise de integridade'?")) {
    db.ref("patrimonios").child(id).update({
      status: 'analise',
      dataModificacao: new Date().toISOString()
    });
  }
}

function darBaixa(id) {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem dar baixa!");
    return;
  }
  if (confirm("Dar baixa neste patrimônio?")) {
    db.ref("patrimonios").child(id).update({
      status: 'baixado',
      dataBaixa: new Date().toISOString(),
      dataModificacao: new Date().toISOString()
    });
  }
}

function reativar(id) {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem reativar!");
    return;
  }
  if (confirm("Reativar este patrimônio?")) {
    db.ref("patrimonios").child(id).update({
      status: 'ativo',
      dataModificacao: new Date().toISOString()
    });
  }
}

function editar(id) {
  if (currentUser?.role !== 'admin') {
    alert("Apenas administradores podem editar!");
    return;
  }
  const item = dados.find(d => d.id === id);
  if (!item) return;
  
  editandoId = id;
  document.getElementById('editNumero').value = item.numero;
  document.getElementById('editLocal').innerHTML = `<option>${item.local}</option>` + document.getElementById('local').innerHTML;
  document.getElementById('editDescricao').innerHTML = `<option>${item.descricao}</option>` + document.getElementById('descricao').innerHTML;
  document.getElementById('editStatus').value = item.status || 'ativo';
  
  document.getElementById('editModal').style.display = 'block';
}

function fecharModal() {
  document.getElementById('editModal').style.display = 'none';
  editandoId = null;
}

function salvarEdicao() {
  if (!editandoId) return;
  
  const numero = document.getElementById('editNumero').value.trim();
  const local = document.getElementById('editLocal').value;
  const descricao = document.getElementById('editDescricao').value;
  const status = document.getElementById('editStatus').value;
  
  if (!numero || !local || !descricao) {
    alert("Preencha todos os campos!");
    return;
  }
  
  if (dados.some(item => item.id !== editandoId && String(item.numero).toUpperCase() === String(numero).toUpperCase())) {
    alert(`Erro: Patrimônio nº ${numero} já existe!`);
    return;
  }
  
  db.ref("patrimonios").child(editandoId).update({
    numero: numero,
    local: local,
    descricao: descricao,
    status: status,
    dataModificacao: new Date().toISOString()
  });
  
  fecharModal();
  alert("Atualizado com sucesso!");
}

function formatarData(dataISO) {
  if (!dataISO) return 'Não registrado';
  const data = new Date(dataISO);
  return data.toLocaleString('pt-BR');
}

function gerarRelatorio(nomeGrupo) {
  const campo = modo === 'local' ? 'local' : 'descricao';
  const itens = dados.filter(d => d[campo] === nomeGrupo && d.status !== 'baixado').sort(ordenarPatrimonios);
  imprimirTemplate(`Setor/Item: ${nomeGrupo}`, itens, false);
}

function gerarRelatorioGeral() {
  const dadosFiltrados = dados.filter(d => d.local !== "Não localizado" && d.status !== 'baixado');
  if (dadosFiltrados.length === 0) {
    alert("Não há dados para o relatório.");
    return;
  }
  const itensGerais = [...dadosFiltrados].sort((a, b) => {
    if (a.local.toLowerCase() < b.local.toLowerCase()) return -1;
    if (a.local.toLowerCase() > b.local.toLowerCase()) return 1;
    return ordenarPatrimonios(a, b);
  });
  imprimirTemplate("Relatório Geral (Ativos)", itensGerais, true);
}

function gerarRelatorioBaixados() {
  const baixados = dados.filter(d => d.status === 'baixado').sort(ordenarPatrimonios);
  if (baixados.length === 0) {
    alert("Não há itens baixados.");
    return;
  }
  imprimirTemplate("Relatório de Itens Baixados", baixados, false);
}

function imprimirTemplate(titulo, lista, isGeral) {
  let htmlRelatorio = `<html><head><title>${titulo}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: sans-serif; padding: 20px; }
    h2 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th, td { border: 1px solid #333; padding: 8px; text-align: left; font-size: 12px; }
    th { background-color: #f2f2f2; text-align: center; }
    .row-local-divider { background-color: #455a64; color: white; font-weight: bold; }
    .row-baixado { background-color: #ffebee; text-decoration: line-through; }
    .row-analise { background-color: #fff9c4; }
    .footer { margin-top: 40px; font-size: 11px; text-align: right; }
    @media (max-width: 600px) {
      th, td { font-size: 10px; padding: 6px; }
    }
  </style></head><body>
  <h2>Relatório de Patrimônio</h2>
  <h4>${titulo}</h4>
  <div style="overflow-x:auto;"><table><thead><tr><th width="15%">Nº</th><th width="25%">Descrição</th><th width="20%">Local</th><th width="20%">Status</th><th width="20%">Modificação</th></tr></thead><tbody>`;
  
  let localAtual = "";
  lista.forEach(item => {
    if (isGeral && item.local !== localAtual && item.status !== 'baixado') {
      localAtual = item.local;
      htmlRelatorio += `<tr><td colspan="5" class="row-local-divider">📍 LOCAL: ${localAtual.toUpperCase()}</td></tr>`;
    }
    let rowClass = '';
    let statusText = '';
    if (item.status === 'baixado') {
      rowClass = 'row-baixado';
      statusText = 'BAIXADO';
    } else if (item.status === 'analise') {
      rowClass = 'row-analise';
      statusText = '⚠️ EM ANÁLISE';
    } else {
      statusText = 'ATIVO';
    }
    htmlRelatorio += `<tr class="${rowClass}">
      <td style="text-align:center;">${item.numero}</td>
      <td>${item.descricao}</td>
      <td>${item.local}</td>
      <td>${statusText}</td>
      <td class="data-info">${formatarData(item.dataModificacao)}</td>
    </tr>`;
  });
  
  htmlRelatorio += `</tbody></table></div>
  <div class="footer">Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${lista.length}</div>
  <script>window.print();<\/script></body></html>`;
  
  const win = window.open('', '_blank');
  win.document.write(htmlRelatorio);
  win.document.close();
}

function exportar() {
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `patrimonio_backup_${new Date().toISOString().slice(0,19)}.json`;
  a.click();
}

function importar(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      let importados = JSON.parse(event.target.result);
      if (confirm(`Importar ${importados.length} itens?`)) {
        const ref = db.ref("patrimonios");
        importados.forEach(item => {
          ref.push({ 
            numero: item.numero, 
            local: item.local, 
            descricao: item.descricao,
            status: item.status || 'ativo',
            dataCadastro: item.dataCadastro || new Date().toISOString(),
            dataModificacao: new Date().toISOString()
          });
        });
        alert("Importação concluída!");
      }
    } catch (err) { alert("Arquivo inválido."); }
  };
  reader.readAsText(file);
}

function renderizar(abaParaFocar = null) {
  let filtrados = dados.filter(d => {
    const matchPesquisa = String(d.numero).toLowerCase().includes(document.getElementById('pesquisa').value.toLowerCase());
    const matchStatus = filtroStatus === 'todos' ? true : d.status === filtroStatus;
    return matchPesquisa && matchStatus;
  }).sort(ordenarPatrimonios);
  
  const tabButtons = document.getElementById('tabButtons');
  const tabContents = document.getElementById('tabContents');
  tabButtons.innerHTML = '';
  tabContents.innerHTML = '';

  if (filtrados.length === 0) {
    tabContents.innerHTML = "<p style='text-align:center; padding:40px;'>Nenhum registro encontrado.</p>";
    return;
  }

  const isAdmin = currentUser?.role === 'admin';

  if (document.getElementById('pesquisa').value !== "" || filtroStatus !== 'todos') {
    tabButtons.innerHTML = "<span style='padding: 10px; color: #0277bd; font-weight: bold;'>🔍 Resultados da Busca:</span>";
    const div = document.createElement('div');
    div.className = 'tab-content active';
    let t = `<div class="table-wrapper"><table><thead><tr><th>N°</th><th>Local</th><th>Descrição</th><th>Status</th><th>Modificação</th>${isAdmin ? '<th>Ações</th>' : ''}</tr></thead><tbody>`;
    filtrados.forEach(d => {
      let rowClass = '';
      let statusDisplay = '';
      if (d.status === 'baixado') {
        rowClass = 'item-baixado';
        statusDisplay = '❌ BAIXADO';
      } else if (d.status === 'analise') {
        rowClass = 'item-analise';
        statusDisplay = '⚠️ EM ANÁLISE';
      } else {
        statusDisplay = '✅ ATIVO';
      }
      t += `<tr class="${rowClass}">
        <td><strong>${d.numero}</strong></td>
        <td>${d.local}</td>
        <td>${d.descricao}</td>
        <td class="${d.status === 'analise' ? 'status-analise' : ''}">${statusDisplay}</td>
        <td><small>${formatarData(d.dataModificacao)}</small></td>`;
      if (isAdmin) {
        t += `<td class="action-buttons">
          <button class="btn-edit" onclick="editar('${d.id}')">Editar</button>
          ${d.status === 'baixado' ? 
            `<button class="btn-edit" onclick="reativar('${d.id}')" style="background:#4caf50;">Reativar</button>` : 
            d.status === 'analise' ?
            `<button class="btn-edit" onclick="reativar('${d.id}')" style="background:#4caf50;">Aprovar</button>
             <button class="btn-baixa-status" onclick="darBaixa('${d.id}')">Dar Baixa</button>` :
            `<button class="btn-baixa-status" onclick="colocarEmAnalise('${d.id}')" style="background:#f9a825;">⚠️ Análise</button>
             <button class="btn-baixa-status" onclick="darBaixa('${d.id}')">Dar Baixa</button>`
          }
          <button class="btn-delete" onclick="excluir('${d.id}')">Excluir</button>
        </td>`;
      }
      t += `</tr>`;
    });
    t += '</tbody></table></div>';
    div.innerHTML = t;
    tabContents.appendChild(div);
    return;
  }

  const campo = modo === 'local' ? 'local' : 'descricao';
  const grupos = [...new Set(filtrados.map(d => d[campo]))].sort();
  let indiceAtivo = 0;
  
  grupos.forEach((g, i) => {
    if (abaParaFocar && g === abaParaFocar) indiceAtivo = i;
    const b = document.createElement('button');
    b.textContent = g;
    b.onclick = () => { abaAbertaRecentemente = g; ativarAba(i); };
    tabButtons.appendChild(b);
    
    const div = document.createElement('div');
    div.className = 'tab-content';
    
    let t = `<div style="margin-bottom:12px; text-align:right;">
      <button class="btn-print" onclick="gerarRelatorio('${g}')">🖨️ Imprimir Grupo</button>
    </div>`;
    t += `<div class="table-wrapper"><table><thead><tr><th>N°</th><th>${modo === 'local' ? 'Descrição' : 'Local'}</th><th>Status</th><th>Modificação</th>${isAdmin ? '<th>Ações</th>' : ''}</tr></thead><tbody>`;
    
    let itensDoGrupo = filtrados.filter(d => d[campo] === g);
    itensDoGrupo.forEach(d => {
      let rowClass = '';
      let statusDisplay = '';
      if (d.status === 'baixado') {
        rowClass = 'item-baixado';
        statusDisplay = '❌ BAIXADO';
      } else if (d.status === 'analise') {
        rowClass = 'item-analise';
        statusDisplay = '⚠️ EM ANÁLISE';
      } else {
        statusDisplay = '✅ ATIVO';
      }
      
      t += `<tr class="${rowClass}">
        <td><strong>${d.numero}</strong></td>
        <td>${modo === 'local' ? d.descricao : d.local}</td>
        <td class="${d.status === 'analise' ? 'status-analise' : ''}">${statusDisplay}</td>
        <td><small>${formatarData(d.dataModificacao)}</small></td>`;
      if (isAdmin) {
        t += `<td class="action-buttons">
          <button class="btn-edit" onclick="editar('${d.id}')">Editar</button>
          ${d.status === 'baixado' ? 
            `<button class="btn-edit" onclick="reativar('${d.id}')" style="background:#4caf50;">Reativar</button>` : 
            d.status === 'analise' ?
            `<button class="btn-edit" onclick="reativar('${d.id}')" style="background:#4caf50;">Aprovar</button>
             <button class="btn-baixa-status" onclick="darBaixa('${d.id}')">Dar Baixa</button>` :
            `<button class="btn-baixa-status" onclick="colocarEmAnalise('${d.id}')" style="background:#f9a825;">⚠️ Análise</button>
             <button class="btn-baixa-status" onclick="darBaixa('${d.id}')">Dar Baixa</button>`
          }
          <button class="btn-delete" onclick="excluir('${d.id}')">Excluir</button>
        </td>`;
      }
      t += `</tr>`;
    });
    t += '</tbody></table></div>';
    div.innerHTML = t;
    tabContents.appendChild(div);
  });
  
  ativarAba(indiceAtivo);
}

function ativarAba(indice) {
  const botoes = document.querySelectorAll('#tabButtons button');
  const conteudos = document.querySelectorAll('#tabContents .tab-content');
  
  botoes.forEach((b, i) => b.classList.toggle('active', i === indice));
  conteudos.forEach((c, i) => c.classList.toggle('active', i === indice));
  
  if(botoes[indice]) {
    botoes[indice].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }
}
