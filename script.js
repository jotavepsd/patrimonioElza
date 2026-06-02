(function () {
  const firebaseConfig = {
    apiKey: "AIzaSyC6UbTClmCouKf9GBR-nUjWfIsMk9qhPdM",
    authDomain: "controlepatrimonio-f26a4.firebaseapp.com",
    databaseURL: "https://controlepatrimonio-f26a4-default-rtdb.firebaseio.com",
    projectId: "controlepatrimonio-f26a4",
    storageBucket: "controlepatrimonio-f26a4.firebasestorage.app"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  function sha256(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var mathPow = Math.pow; var maxWord = mathPow(2, 32); var lengthProperty = 'length'; var i, j; var result = '';
    var words = []; var asciiLength = ascii[lengthProperty]; var hash = []; var k = []; var primeCounter = 0;
    var isComposite = {}; for (i = 2; primeCounter < 64; i++) {
      if (!isComposite[i]) {
        for (j = i * i; j < 311; j += i) { isComposite[j] = true; }
        hash[primeCounter] = (mathPow(i, .5) * maxWord) | 0; k[primeCounter++] = (mathPow(i, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += '\x80'; while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
    for (i = 0; i < ascii[lengthProperty]; i++) {
      j = ascii.charCodeAt(i); if (j >> 8) return; words[i >> 2] |= j << ((3 - i % 4) * 8);
    }
    words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0; words[words[lengthProperty]] = (asciiLength * 8);
    for (j = 0; j < words[lengthProperty]; j += 16) {
      var w = []; for (i = 0; i < 16; i++) w[i] = words[j + i];
      for (i = 16; i < 64; i++) {
        var s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        var s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
      }
      var a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
      for (i = 0; i < 64; i++) {
        var S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
        var ch = (e & f) ^ ((~e) & g); var temp1 = (h + S1 + ch + k[i] + w[i]) | 0;
        var S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
        var maj = (a & b) ^ (a & c) ^ (b & c); var temp2 = (S0 + maj) | 0;
        h = g; g = f; f = e; e = (d + temp1) | 0; d = c; c = b; b = a; a = (temp1 + temp2) | 0;
      }
      hash[0] = (hash[0] + a) | 0; hash[1] = (hash[1] + b) | 0; hash[2] = (hash[2] + c) | 0; hash[3] = (hash[3] + d) | 0;
      hash[4] = (hash[4] + e) | 0; hash[5] = (hash[5] + f) | 0; hash[6] = (hash[6] + g) | 0; hash[7] = (hash[7] + h) | 0;
    }
    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) { var b = (hash[i] >> (j * 8)) & 255; result += ((b < 16 ? '0' : '') + b.toString(16)); }
    }
    return result;
  }

  let currentUser = null;
  const users = {
    'admin': { hash: '6cfa87332cfa2f4477cfa90a886ea5b11ba9f735d4ba94da1c72dfd08c5c76bd', role: 'admin', name: 'Administrador' },
    'user': { hash: '5e8842c1651a186ee7a063d5de69a741f32076b738323419837a72b2996153a7', role: 'user', name: 'Usuário' }
  };

  let dados = [];
  let listaLocais = [];
  let listaDescricoes = [];
  let modo = 'local';
  let abaAbertaRecentemente = null;
  let editandoId = null;
  let filtroStatus = 'todos';

  verificarSessao();

  function fazerLogin() {
    const username = document.getElementById('loginUser').value.trim();
    const password = document.getElementById('loginPassword').value;
    const user = users[username];
    
    if (user && user.hash === sha256(password)) {
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
    const inputs = document.querySelectorAll('#mainApp input, #mainApp select, #mainApp button.btn-inline-add');
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

  function validarAcessoAdmin() {
    if (!currentUser || currentUser.role !== 'admin') {
      alert("Acesso negado: Apenas administradores autorizados!");
      aplicarRestricoes();
      return false;
    }
    return true;
  }

  function atualizarDashboard() {
    document.getElementById('totalItens').textContent = dados.length;
    document.getElementById('totalAtivos').textContent = dados.filter(d => d.status === 'ativo').length;
    document.getElementById('totalAnalise').textContent = dados.filter(d => d.status === 'analise').length;
    document.getElementById('totalBaixados').textContent = dados.filter(d => d.status === 'baixado').length;
    document.getElementById('totalLocais').textContent = [...new Set(dados.map(d => d.local))].length;
  }

  function filtrarTodos() { filtroStatus = 'todos'; document.getElementById('pesquisa').value = ''; renderizar(); }
  function filtrarAtivos() { filtroStatus = 'ativo'; document.getElementById('pesquisa').value = ''; renderizar(); }
  function filtrarAnalise() { filtroStatus = 'analise'; document.getElementById('pesquisa').value = ''; renderizar(); }
  function filtrarBaixados() { filtroStatus = 'baixado'; document.getElementById('pesquisa').value = ''; renderizar(); }

  db.ref("patrimonios").on("value", (snapshot) => {
    const val = snapshot.val();
    dados = val ? Object.keys(val).map(key => ({ id: key, ...val[key] })) : [];
    atualizarDashboard();
    renderizar(abaAbertaRecentemente);
  });

  db.ref("locais").on("value", (snapshot) => {
    const val = snapshot.val();
    listaLocais = val ? Object.values(val).sort() : ["Sala 01", "Secretaria", "Direção", "Depósito", "Não localizado"];
    atualizarSelectsFormulario();
  });

  db.ref("descricoes").on("value", (snapshot) => {
    const val = snapshot.val();
    listaDescricoes = val ? Object.values(val).sort() : ["Armário", "Computador", "Cadeira", "Mesa", "Ventilador"];
    atualizarSelectsFormulario();
  });

  function atualizarSelectsFormulario() {
    const selectLocal = document.getElementById('local');
    const selectDesc = document.getElementById('descricao');
    
    if (selectLocal) {
      selectLocal.innerHTML = '<option value="">Selecione o Local</option>' + 
        listaLocais.map(loc => `<option value="${loc}">${loc}</option>`).join('');
    }
    if (selectDesc) {
      selectDesc.innerHTML = '<option value="">Selecione o Item</option>' + 
        listaDescricoes.map(desc => `<option value="${desc}">${desc}</option>`).join('');
    }
  }

  function adicionarLocalDinamico() {
    if (!validarAcessoAdmin()) return;
    const novoLocal = prompt("Digite o nome do novo Local (Setor):");
    if (!novoLocal || novoLocal.trim() === "") return;
    
    if (listaLocais.some(l => l.toLowerCase() === novoLocal.trim().toLowerCase())) {
      alert("Este local já está cadastrado!");
      return;
    }
    db.ref("locais").push(novoLocal.trim());
    alert("Local adicionado com sucesso!");
  }

  function adicionarDescricaoDinamica() {
    if (!validarAcessoAdmin()) return;
    const novoItem = prompt("Digite a descrição do novo Item:");
    if (!novoItem || novoItem.trim() === "") return;
    
    if (listaDescricoes.some(d => d.toLowerCase() === novoItem.trim().toLowerCase())) {
      alert("Esta descrição de item já existe!");
      return;
    }
    db.ref("descricoes").push(novoItem.trim());
    alert("Item adicionado com sucesso!");
  }

  function ordenarPatrimonios(a, b) {
    const statusOrder = { 'ativo': 1, 'analise': 2, 'baixado': 3 };
    const orderA = statusOrder[a.status] || 1;
    const orderB = statusOrder[b.status] || 1;
    if (orderA !== orderB) return orderA - orderB;
    
    const descA = a.descricao.toLowerCase();
    const descB = b.descricao.toLowerCase();
    const termoConjunto = "conjunto de carteira";
    if (descA === termoConjunto && descB !== termoConjunto) return 1;
    if (descA !== termoConjunto && descB === termoConjunto) return -1;
    if (descA !== descB) return descA.localeCompare(descB);
    return String(a.numero).localeCompare(String(b.numero), undefined, { numeric: true, sensitivity: 'base' });
  }

  function setModo(m) {
    modo = m;
    abaAbertaRecentemente = null; 
    document.getElementById('btnLocal').classList.toggle('active', m === 'local');
    document.getElementById('btnDescricao').classList.toggle('active', m === 'descricao');
    renderizar();
  }

  function adicionar() {
    if (!validarAcessoAdmin()) return;
    
    const numerosStr = document.getElementById('numero').value.trim();
    const local = document.getElementById('local').value;
    const descricao = document.getElementById('descricao').value;

    if (!numerosStr || !local || !descricao) { alert("Por favor, preencha todos os campos."); return; }

    const numeros = numerosStr.split(/\s+/);
    const uniqueNumeros = [...new Set(numeros)];
    if (uniqueNumeros.length !== numeros.length) { alert("Erro: Existem números repetidos na lista!"); return; }

    const numerosJaExistentes = [];
    const numerosValidos = [];

    for (let num of numeros) {
      if (dados.some(item => String(item.numero).toUpperCase() === String(num).toUpperCase())) {
        numerosJaExistentes.push(num);
      } else {
        numerosValidos.push(num);
      }
    }

    if (numerosJaExistentes.length > 0) { alert(`Os seguintes patrimônios já existem:\n${numerosJaExistentes.join(', ')}`); }
    if (numerosValidos.length === 0) { alert("Nenhum número válido para cadastrar."); return; }

    const dataAtual = new Date().toISOString();
    numerosValidos.forEach(numero => {
      db.ref("patrimonios").push({ 
        numero: numero, local: local, descricao: descricao, status: 'ativo', dataCadastro: dataAtual, dataModificacao: dataAtual
      });
    });

    abaAbertaRecentemente = (modo === 'local') ? local : descricao;
    alert(`${numerosValidos.length} patrimônio(s) cadastrado(s)!`);
    document.getElementById('numero').value = '';
  }

  function excluir(id) {
    if (!validarAcessoAdmin()) return;
    if (confirm("Excluir permanentemente?")) { db.ref("patrimonios").child(id).remove(); }
  }

  function colocarEmAnalise(id) {
    if (!validarAcessoAdmin()) return;
    if (confirm("Marcar como 'Em análise de integridade'?")) {
      db.ref("patrimonios").child(id).update({ status: 'analise', dataModificacao: new Date().toISOString() });
    }
  }

  function darBaixa(id) {
    if (!validarAcessoAdmin()) return;
    if (confirm("Dar baixa neste patrimônio?")) {
      db.ref("patrimonios").child(id).update({ status: 'baixado', dataBaixa: new Date().toISOString(), dataModificacao: new Date().toISOString() });
    }
  }

  function reativar(id) {
    if (!validarAcessoAdmin()) return;
    if (confirm("Reativar/Aprovar este patrimônio?")) {
      db.ref("patrimonios").child(id).update({ status: 'ativo', dataModificacao: new Date().toISOString() });
    }
  }

  function editar(id) {
    if (!validarAcessoAdmin()) return;
    const item = dados.find(d => d.id === id);
    if (!item) return;
    
    editandoId = id;
    document.getElementById('editNumero').value = item.numero;
    
    document.getElementById('editLocal').innerHTML = 
      listaLocais.map(loc => `<option value="${loc}" ${loc === item.local ? 'selected' : ''}>${loc}</option>`).join('');
      
    document.getElementById('editDescricao').innerHTML = 
      listaDescricoes.map(desc => `<option value="${desc}" ${desc === item.descricao ? 'selected' : ''}>${desc}</option>`).join('');
      
    document.getElementById('editStatus').value = item.status || 'ativo';
    document.getElementById('editModal').style.display = 'block';
  }

  function fecharModal() { document.getElementById('editModal').style.display = 'none'; editandoId = null; }

  function salvarEdicao() {
    if (!validarAcessoAdmin() || !editandoId) return;
    
    const numero = document.getElementById('editNumero').value.trim();
    const local = document.getElementById('editLocal').value;
    const descricao = document.getElementById('editDescricao').value;
    const status = document.getElementById('editStatus').value;
    
    if (!numero || !local || !descricao) { alert("Preencha todos os campos!"); return; }
    if (dados.some(item => item.id !== editandoId && String(item.numero).toUpperCase() === String(numero).toUpperCase())) {
      alert(`Erro: Patrimônio nº ${numero} já existe!`); return;
    }
    
    db.ref("patrimonios").child(editandoId).update({
      numero, local, descricao, status, dataModificacao: new Date().toISOString()
    });
    fecharModal();
    alert("Atualizado com sucesso!");
  }

  function formatarData(dataISO) {
    if (!dataISO) return 'Não registrado';
    return new Date(dataISO).toLocaleString('pt-BR');
  }

  function gerarRelatorio(nomeGrupo) {
    const campo = modo === 'local' ? 'local' : 'descricao';
    const itens = dados.filter(d => d[campo] === nomeGrupo && d.status !== 'baixado').sort(ordenarPatrimonios);
    imprimirTemplate(`Setor/Item: ${nomeGrupo}`, itens, false);
  }

  function gerarRelatorioGeral() {
    const dadosFiltrados = dados.filter(d => d.local !== "Não localizado" && d.status !== 'baixado');
    if (dadosFiltrados.length === 0) { alert("Não há dados para o relatório."); return; }
    const itensGerais = [...dadosFiltrados].sort((a, b) => a.local.toLowerCase().localeCompare(b.local.toLowerCase()) || ordenarPatrimonios(a, b));
    imprimirTemplate("Relatório Geral (Ativos)", itensGerais, true);
  }

  function gerarRelatorioBaixados() {
    const baixados = dados.filter(d => d.status === 'baixado').sort(ordenarPatrimonios);
    if (baixados.length === 0) { alert("Não há itens baixados."); return; }
    imprimirTemplate("Relatório de Itens Baixados", baixados, false);
  }

  function imprimirTemplate(titulo, lista, isGeral) {
    let htmlRelatorio = `<html><head><title>${titulo}</title><style>body{font-family:sans-serif;padding:20px;}h2{text-align:center;border-bottom:2px solid #000;padding-bottom:10px;}table{width:100%;border-collapse:collapse;margin-top:20px;}th,td{border:1px solid #333;padding:8px;text-align:left;font-size:12px;}th{background-color:#f2f2f2;text-align:center;}.row-local-divider{background-color:#455a64;color:white;font-weight:bold;}.row-baixado{background-color:#ffebee;text-decoration:line-through;}.row-analise{background-color:#fff9c4;}.footer{margin-top:40px;font-size:11px;text-align:right;}</style></head><body><h2>Relatório de Patrimônio</h2><h4>${titulo}</h4><table><thead><tr><th>Nº</th><th>Descrição</th><th>Local</th><th>Status</th><th>Modificação</th></tr></thead><tbody>`;
    let localAtual = "";
    lista.forEach(item => {
      if (isGeral && item.local !== localAtual && item.status !== 'baixado') {
        localAtual = item.local; htmlRelatorio += `<tr><td colspan="5" class="row-local-divider">📍 LOCAL: ${localAtual.toUpperCase()}</td></tr>`;
      }
      let rowClass = item.status === 'baixado' ? 'row-baixado' : item.status === 'analise' ? 'row-analise' : '';
      let statusText = item.status === 'baixado' ? 'BAIXADO' : item.status === 'analise' ? '⚠️ EM ANÁLISE' : 'ATIVO';
      htmlRelatorio += `<tr class="${rowClass}"><td style="text-align:center;">${item.numero}</td><td>${item.descricao}</td><td>${item.local}</td><td>${statusText}</td><td>${formatarData(item.dataModificacao)}</td></tr>`;
    });
    htmlRelatorio += `</tbody></table><div class="footer">Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${lista.length}</div><script>window.print();<\/script></body></html>`;
    const win = window.open('', '_blank'); win.document.write(htmlRelatorio); win.document.close();
  }

  function exportar() {
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `patrimonio_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
  }

  function importar(e) {
    if (!validarAcessoAdmin()) return;
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        let importados = JSON.parse(event.target.result);
        if (confirm(`Importar ${importados.length} itens?`)) {
          const ref = db.ref("patrimonios");
          importados.forEach(item => {
            ref.push({ numero: item.numero, local: item.local, descricao: item.descricao, status: item.status || 'ativo', dataCadastro: item.dataCadastro || new Date().toISOString(), dataModificacao: new Date().toISOString() });
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
        let rowClass = d.status === 'baixado' ? 'item-baixado' : d.status === 'analise' ? 'item-analise' : '';
        let statusDisplay = d.status === 'baixado' ? '❌ BAIXADO' : d.status === 'analise' ? '⚠️ EM ANÁLISE' : '✅ ATIVO';
        
        t += `<tr class="${rowClass}">
          <td><strong>${d.numero}</strong></td>
          <td>${d.local}</td>
          <td>${d.descricao}</td>
          <td class="${d.status === 'analise' ? 'status-analise' : ''}">${statusDisplay}</td>
          <td><small>${formatarData(d.dataModificacao)}</small></td>`;
        if (isAdmin) {
          t += `<td class="action-buttons">
            <button class="btn-edit" data-id="${d.id}" data-action="editar">Editar</button>
            ${d.status === 'baixado' ? 
              `<button class="btn-edit" data-id="${d.id}" data-action="reativar" style="background:#4caf50;">Reativar</button>` : 
              d.status === 'analise' ?
              `<button class="btn-edit" data-id="${d.id}" data-action="reativar" style="background:#4caf50;">Aprovar</button>
               <button class="btn-baixa-status" data-id="${d.id}" data-action="baixa">Dar Baixa</button>` :
              `<button class="btn-baixa-status" data-id="${d.id}" data-action="analise" style="background:#f9a825;">⚠️ Análise</button>
               <button class="btn-baixa-status" data-id="${d.id}" data-action="baixa">Dar Baixa</button>`
            }
            <button class="btn-delete" data-id="${d.id}" data-action="excluir">Excluir</button>
          </td>`;
        }
        t += `</tr>`;
      });
      t += '</tbody></table></div>';
      div.innerHTML = t;
      tabContents.appendChild(div);
      vincularEventosBotoes(div);
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
        <button class="btn-print" data-grupo="${g}" data-action="imprimir-grupo">🖨️ Imprimir Grupo</button>
      </div>`;
      t += `<div class="table-wrapper"><table><thead><tr><th>N°</th><th>${modo === 'local' ? 'Descrição' : 'Local'}</th><th>Status</th><th>Modificação</th>${isAdmin ? '<th>Ações</th>' : ''}</tr></thead><tbody>`;
      
      let itensDoGrupo = filtrados.filter(d => d[campo] === g);
      itensDoGrupo.forEach(d => {
        let rowClass = d.status === 'baixado' ? 'item-baixado' : d.status === 'analise' ? 'item-analise' : '';
        let statusDisplay = d.status === 'baixado' ? '❌ BAIXADO' : d.status === 'analise' ? '⚠️ EM ANÁLISE' : '✅ ATIVO';
        
        t += `<tr class="${rowClass}">
          <td><strong>${d.numero}</strong></td>
          <td>${modo === 'local' ? d.descricao : d.local}</td>
          <td class="${d.status === 'analise' ? 'status-analise' : ''}">${statusDisplay}</td>
          <td><small>${formatarData(d.dataModificacao)}</small></td>`;
        if (isAdmin) {
          t += `<td class="action-buttons">
            <button class="btn-edit" data-id="${d.id}" data-action="editar">Editar</button>
            ${d.status === 'baixado' ? 
              `<button class="btn-edit" data-id="${d.id}" data-action="reativar" style="background:#4caf50;">Reativar</button>` : 
              d.status === 'analise' ?
              `<button class="btn-edit" data-id="${d.id}" data-action="reativar" style="background:#4caf50;">Aprovar</button>
               <button class="btn-baixa-status" data-id="${d.id}" data-action="baixa">Dar Baixa</button>` :
              `<button class="btn-baixa-status" data-id="${d.id}" data-action="analise" style="background:#f9a825;">⚠️ Análise</button>
               <button class="btn-baixa-status" data-id="${d.id}" data-action="baixa">Dar Baixa</button>`
            }
            <button class="btn-delete" data-id="${d.id}" data-action="excluir">Excluir</button>
          </td>`;
        }
        t += `</tr>`;
      });
      t += '</tbody></table></div>';
      div.innerHTML = t;
      tabContents.appendChild(div);
      vincularEventosBotoes(div);
    });
    
    ativarAba(indiceAtivo);
  }

  function ativarAba(indice) {
    const botoes = document.querySelectorAll('#tabButtons button');
    const conteudos = document.querySelectorAll('#tabContents .tab-content');
    botoes.forEach((b, i) => b.classList.toggle('active', i === indice));
    conteudos.forEach((c, i) => c.classList.toggle('active', i === indice));
  }

  function vincularEventosBotoes(container) {
    container.querySelectorAll('button').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');
      const grupo = btn.getAttribute('data-grupo');
      
      if (!action) return;
      btn.onclick = (e) => {
        e.preventDefault();
        if (action === 'editar') editar(id);
        if (action === 'excluir') excluir(id);
        if (action === 'analise') colocarEmAnalise(id);
        if (action === 'baixa') darBaixa(id);
        if (action === 'reativar') reativar(id);
        if (action === 'imprimir-grupo') gerarRelatorio(grupo);
      };
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    document.querySelector("button[onclick='fazerLogin()']").onclick = fazerLogin;
    document.querySelector("button[onclick='logout()']").onclick = logout;
    document.querySelector("button[onclick='filtrarTodos()']").onclick = filtrarTodos;
    document.querySelector("button[onclick='filtrarAtivos()']").onclick = filtrarAtivos;
    document.querySelector("button[onclick='filtrarAnalise()']").onclick = filtrarAnalise;
    document.querySelector("button[onclick='filtrarBaixados()']").onclick = filtrarBaixados;
    document.querySelector("button[onclick='exportar()']").onclick = exportar;
    document.querySelector("button[onclick='gerarRelatorioGeral()']").onclick = gerarRelatorioGeral;
    document.querySelector("button[onclick='gerarRelatorioBaixados()']").onclick = gerarRelatorioBaixados;
    document.getElementById('btnAdicionar').onclick = adicionar;
    document.getElementById('btnLocal').onclick = () => setModo('local');
    document.getElementById('btnDescricao').onclick = () => setModo('descricao');
    document.querySelector(".close").onclick = fecharModal;
    document.querySelector("button[onclick='salvarEdicao()']").onclick = salvarEdicao;
    document.getElementById('pesquisa').oninput = () => renderizar();
    document.getElementById('importFile').onchange = (e) => importar(e);
    
    document.getElementById('btnAdicionarLocal').onclick = adicionarLocalDinamico;
    document.getElementById('btnAdicionarDescricao').onclick = adicionarDescricaoDinamica;
  });

})();
