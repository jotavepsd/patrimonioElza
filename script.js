(function () {
  // =========================================================
  // CONFIGURAÇÃO DO FIREBASE
  // =========================================================

  const firebaseConfig = {
    apiKey: "AIzaSyC6UbTClmCouKf9GBR-nUjWfIsMk9qhPdM",
    authDomain: "controlepatrimonio-f26a4.firebaseapp.com",
    databaseURL: "https://controlepatrimonio-f26a4-default-rtdb.firebaseio.com",
    projectId: "controlepatrimonio-f26a4",
    storageBucket: "controlepatrimonio-f26a4.firebasestorage.app"
  };

  firebase.initializeApp(firebaseConfig);

  const db = firebase.database();
  const auth = firebase.auth();


  // =========================================================
  // USUÁRIO ATUAL
  // =========================================================

  let currentUser = null;


  // =========================================================
  // ADMINISTRADOR PRINCIPAL
  // =========================================================
  //
  // Este UID é o usuário administrador que você acabou
  // de cadastrar no Firebase Authentication.
  //
  // Depois podemos tirar isso do código e colocar a
  // autorização definitivamente nas Security Rules.
  //

  const ADMIN_UIDS = [
    "zx87UQ8tzmMuYXksGWGA3B0eZ6k2"
  ];


  // =========================================================
  // DADOS DA APLICAÇÃO
  // =========================================================

  let dados = [];
  let listaLocais = [];
  let listaDescricoes = [];
  let modo = 'local';
  let abaAbertaRecentemente = null;
  let editandoId = null;
  let filtroStatus = 'todos';


  // =========================================================
  // DADOS PADRÃO
  // =========================================================

  const padraoLocais = [
    "Sala 01",
    "Sala 03",
    "Sala 04",
    "Sala 05",
    "Sala 06",
    "Sala 07",
    "Sala 08",
    "Sala 09",
    "Sala 10",
    "Sala 11",
    "Sala 12",
    "Sala 13",
    "Sala 14",
    "Secretaria",
    "Direção",
    "Depósito",
    "Biblioteca",
    "Coordenação",
    "Refeitório",
    "Sala de Atendimento",
    "Sala de Informática",
    "Sala do AEE",
    "Sala dos Professores",
    "Vice-Direção",
    "Cozinha dos Servidores",
    "Não localizado"
  ];

  const padraoDescricoes = [
    "Conjunto de carteira",
    "Armário",
    "Ar Condicionado",
    "Cadeira",
    "Ventilador",
    "Mesa",
    "Headset",
    "WebCam",
    "Computador",
    "Monitor",
    "Roteador",
    "Impressora",
    "Geladeira",
    "Microondas",
    "Arquivo",
    "Prateleira",
    "TV",
    "Bebedouro",
    "Lousa Digital",
    "Plastificadora",
    "Switch",
    "Suporte"
  ];


  // =========================================================
  // FUNÇÕES AUXILIARES DE INTERFACE
  // =========================================================

  function mostrarTelaLogin() {
    const loginContainer = document.getElementById('loginContainer');
    const mainApp = document.getElementById('mainApp');

    if (loginContainer) {
      loginContainer.style.display = 'flex';
    }

    if (mainApp) {
      mainApp.style.display = 'none';
    }
  }


  function mostrarAplicacao() {
    const loginContainer = document.getElementById('loginContainer');
    const mainApp = document.getElementById('mainApp');

    if (loginContainer) {
      loginContainer.style.display = 'none';
    }

    if (mainApp) {
      mainApp.style.display = 'block';
    }
  }


  function limparErroLogin() {
    const loginError = document.getElementById('loginError');

    if (loginError) {
      loginError.textContent = '';
    }
  }


  function mostrarErroLogin(mensagem) {
    const loginError = document.getElementById('loginError');

    if (loginError) {
      loginError.textContent = mensagem;
    }
  }


  function atualizarDadosUsuario() {
    if (!currentUser) {
      return;
    }

    const userNameDisplay =
      document.getElementById('userNameDisplay');

    const userRoleDisplay =
      document.getElementById('userRoleDisplay');

    if (userNameDisplay) {
      userNameDisplay.textContent =
        currentUser.name || currentUser.email;
    }

    if (userRoleDisplay) {
      userRoleDisplay.textContent =
        currentUser.role === 'admin'
          ? '👑 ADMIN'
          : '👤 USUÁRIO';

      userRoleDisplay.classList.toggle(
        'admin',
        currentUser.role === 'admin'
      );
    }
  }


  // =========================================================
  // LOGIN COM FIREBASE AUTHENTICATION
  // =========================================================

  async function fazerLogin() {

    const emailInput =
      document.getElementById('loginUser');

    const passwordInput =
      document.getElementById('loginPassword');

    if (!emailInput || !passwordInput) {
      console.error(
        "Campos de login não encontrados."
      );

      return;
    }

    const email =
      emailInput.value.trim();

    const password =
      passwordInput.value;

    limparErroLogin();

    if (!email || !password) {
      mostrarErroLogin(
        'Informe o e-mail e a senha.'
      );

      return;
    }

    const btnLogin =
      document.getElementById('btnFazerLogin');

    if (btnLogin) {
      btnLogin.disabled = true;
      btnLogin.textContent = 'Entrando...';
    }

    try {

      console.log(
        "Tentando autenticar:",
        email
      );

      const userCredential =
        await auth.signInWithEmailAndPassword(
          email,
          password
        );

      const user =
        userCredential.user;

      console.log(
        "Login Firebase realizado com sucesso."
      );

      console.log(
        "UID:",
        user.uid
      );

      console.log(
        "E-mail:",
        user.email
      );

      limparErroLogin();

    } catch (error) {

      console.error(
        "Erro no login:",
        error
      );

      let mensagem =
        'E-mail ou senha inválidos.';

      switch (error.code) {

        case 'auth/invalid-email':
          mensagem =
            'O e-mail informado é inválido.';
          break;

        case 'auth/user-disabled':
          mensagem =
            'Este usuário foi desativado.';
          break;

        case 'auth/user-not-found':
          mensagem =
            'Usuário não encontrado.';
          break;

        case 'auth/wrong-password':
          mensagem =
            'Senha incorreta.';
          break;

        case 'auth/invalid-credential':
          mensagem =
            'E-mail ou senha incorretos.';
          break;

        case 'auth/too-many-requests':
          mensagem =
            'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
          break;

        case 'auth/network-request-failed':
          mensagem =
            'Erro de conexão. Verifique sua internet.';
          break;

        default:
          mensagem =
            'Não foi possível realizar o login.';
      }

      mostrarErroLogin(mensagem);

    } finally {

      if (btnLogin) {
        btnLogin.disabled = false;
        btnLogin.textContent =
          'Entrar no Sistema';
      }
    }
  }


  // =========================================================
  // CARREGAR PERFIL DO USUÁRIO
  // =========================================================

  async function carregarPerfilUsuario(user) {

    if (!user) {
      return;
    }

    const uid = user.uid;

    console.log(
      "Carregando perfil do usuário:",
      uid
    );


    // ---------------------------------------------------------
    // 1. PRIMEIRO: verificar se existe um perfil pelo UID
    // ---------------------------------------------------------

    try {

      const snapshot =
        await db.ref(`usuarios/${uid}`).once('value');

      const perfil =
        snapshot.val();

      if (perfil) {

        currentUser = {
          uid: uid,
          email: user.email,
          name:
            perfil.name ||
            perfil.nome ||
            user.email,
          role:
            perfil.role || 'user'
        };

        console.log(
          "Perfil encontrado no banco:",
          currentUser
        );

        atualizarDadosUsuario();

        aplicarRestricoes();

        return;
      }

    } catch (error) {

      console.error(
        "Erro ao buscar perfil pelo UID:",
        error
      );
    }


    // ---------------------------------------------------------
    // 2. BOOTSTRAP DO ADMINISTRADOR
    // ---------------------------------------------------------
    //
    // Como o seu banco ainda possui:
    //
    // usuarios/admin
    //
    // e o usuário administrador possui o UID:
    //
    // zx87UQ8tzmMuYXksGWGA3B0eZ6k2
    //
    // fazemos a migração automática desse administrador.
    //

    if (ADMIN_UIDS.includes(uid)) {

      currentUser = {
        uid: uid,
        email: user.email,
        name: 'Administrador Master',
        role: 'admin'
      };

      console.log(
        "Administrador principal identificado."
      );


      // Tenta criar o perfil usando o UID.
      //
      // Se as regras permitirem escrita, o perfil ficará
      // automaticamente disponível para os próximos logins.

      try {

        await db.ref(`usuarios/${uid}`).set({
          name: 'Administrador Master',
          role: 'admin'
        });

        console.log(
          "Perfil do administrador criado/migrado."
        );

      } catch (error) {

        console.warn(
          "Não foi possível gravar o perfil do administrador.",
          error
        );

        // O login continua funcionando mesmo que essa
        // gravação não seja possível neste momento.
      }

      atualizarDadosUsuario();

      aplicarRestricoes();

      return;
    }


    // ---------------------------------------------------------
    // 3. USUÁRIO COMUM
    // ---------------------------------------------------------

    currentUser = {
      uid: uid,
      email: user.email,
      name: user.email,
      role: 'user'
    };

    console.log(
      "Usuário autenticado sem perfil definido."
    );

    atualizarDadosUsuario();

    aplicarRestricoes();
  }


  // =========================================================
  // OBSERVADOR DE AUTENTICAÇÃO
  // =========================================================
  //
  // O Firebase chama esta função sempre que o estado de
  // autenticação muda.
  //

  auth.onAuthStateChanged(async function (user) {

    console.log(
      "Estado de autenticação alterado:",
      user ? user.email : "nenhum usuário"
    );


    if (user) {

      try {

        await carregarPerfilUsuario(user);

        mostrarAplicacao();

        limparErroLogin();

        renderizar();

      } catch (error) {

        console.error(
          "Erro ao carregar aplicação:",
          error
        );

        mostrarErroLogin(
          'Erro ao carregar o perfil do usuário.'
        );

      }

    } else {

      currentUser = null;

      mostrarTelaLogin();

    }
  });


  // =========================================================
  // LOGOUT
  // =========================================================

  async function logout() {

    try {

      await auth.signOut();

      currentUser = null;

      console.log(
        "Logout realizado."
      );

    } catch (error) {

      console.error(
        "Erro ao sair:",
        error
      );

      alert(
        "Não foi possível sair do sistema."
      );
    }
  }


  // =========================================================
  // PERMISSÕES
  // =========================================================

  function aplicarRestricoes() {

    const isAdmin =
      currentUser?.role === 'admin';

    const inputs =
      document.querySelectorAll(
        '#mainApp input, #mainApp select, #mainApp button.btn-inline-add'
      );

    const btnAdd =
      document.getElementById('btnAdicionar');


    inputs.forEach(input => {

      if (input.id !== 'pesquisa') {
        input.disabled = !isAdmin;
      }

    });


    if (btnAdd) {

      btnAdd.disabled = !isAdmin;

      btnAdd.style.opacity =
        isAdmin ? '1' : '0.5';
    }
  }


  // =========================================================
  // VALIDAÇÃO DE ADMIN
  // =========================================================

  function validarAcessoAdmin() {

    if (
      !currentUser ||
      currentUser.role !== 'admin'
    ) {

      alert(
        "Acesso negado: Apenas administradores autorizados!"
      );

      aplicarRestricoes();

      return false;
    }

    return true;
  }


  // =========================================================
  // DASHBOARD
  // =========================================================

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

  function formatarData(dataISO) {

    if (!dataISO) {
      return 'Não registrado';
    }

    return new Date(
      dataISO
    ).toLocaleString('pt-BR');
  }


  // =========================================================
  // RELATÓRIO DE GRUPO
  // =========================================================

  function gerarRelatorio(nomeGrupo) {

    const campo =
      modo === 'local'
        ? 'local'
        : 'descricao';


    const itens =
      dados
        .filter(
          d =>
            d[campo] === nomeGrupo &&
            d.status !== 'baixado'
        )
        .sort(
          ordenarPatrimonios
        );


    imprimirTemplate(
      `Setor/Item: ${nomeGrupo}`,
      itens,
      false
    );
  }


  // =========================================================
  // RELATÓRIO GERAL
  // =========================================================

  function gerarRelatorioGeral() {

    const dadosFiltrados =
      dados.filter(
        d =>
          d.local !== "Não localizado" &&
          d.status !== 'baixado'
      );


    if (
      dadosFiltrados.length === 0
    ) {

      alert(
        "Não há dados para o relatório."
      );

      return;
    }


    const itensGerais =
      [...dadosFiltrados]
        .sort(
          (a, b) =>
            a.local
              .toLowerCase()
              .localeCompare(
                b.local.toLowerCase()
              ) ||
            ordenarPatrimonios(a, b)
        );


    imprimirTemplate(
      "Relatório Geral (Ativos)",
      itensGerais,
      true
    );
  }


  // =========================================================
  // RELATÓRIO DE BAIXADOS
  // =========================================================

  function gerarRelatorioBaixados() {

    const baixados =
      dados
        .filter(
          d =>
            d.status === 'baixado'
        )
        .sort(
          ordenarPatrimonios
        );


    if (
      baixados.length === 0
    ) {

      alert(
        "Não há itens baixados."
      );

      return;
    }


    imprimirTemplate(
      "Relatório de Itens Baixados",
      baixados,
      false
    );
  }


  // =========================================================
  // IMPRIMIR RELATÓRIO
  // =========================================================

  function imprimirTemplate(
    titulo,
    lista,
    isGeral
  ) {

    let htmlRelatorio = `
      <html>
      <head>
        <title>${titulo}</title>

        <style>

          body {
            font-family: sans-serif;
            padding: 20px;
          }

          h2 {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
          }

          th,
          td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
            font-size: 12px;
          }

          th {
            background-color: #f2f2f2;
            text-align: center;
          }

          .row-local-divider {
            background-color: #455a64;
            color: white;
            font-weight: bold;
          }

          .row-baixado {
            background-color: #ffebee;
            text-decoration: line-through;
          }

          .row-analise {
            background-color: #fff9c4;
          }

          .footer {
            margin-top: 40px;
            font-size: 11px;
            text-align: right;
          }

        </style>

      </head>

      <body>

        <h2>Relatório de Patrimônio</h2>

        <h4>${titulo}</h4>

        <table>

          <thead>

            <tr>
              <th>Nº</th>
              <th>Descrição</th>
              <th>Local</th>
              <th>Status</th>
              <th>Modificação</th>
            </tr>

          </thead>

          <tbody>
    `;


    let localAtual = "";


    lista.forEach(item => {

      if (
        isGeral &&
        item.local !== localAtual &&
        item.status !== 'baixado'
      ) {

        localAtual =
          item.local;

        htmlRelatorio += `
          <tr>
            <td
              colspan="5"
              class="row-local-divider"
            >
              📍 LOCAL:
              ${localAtual.toUpperCase()}
            </td>
          </tr>
        `;
      }


      let rowClass =
        item.status === 'baixado'
          ? 'row-baixado'
          : item.status === 'analise'
            ? 'row-analise'
            : '';


      let statusText =
        item.status === 'baixado'
          ? 'BAIXADO'
          : item.status === 'analise'
            ? '⚠️ EM ANÁLISE'
            : 'ATIVO';


      htmlRelatorio += `
        <tr class="${rowClass}">

          <td style="text-align:center;">
            ${item.numero}
          </td>

          <td>
            ${item.descricao}
          </td>

          <td>
            ${item.local}
          </td>

          <td>
            ${statusText}
          </td>

          <td>
            ${formatarData(
              item.dataModificacao
            )}
          </td>

        </tr>
      `;
    });


    htmlRelatorio += `
          </tbody>

        </table>

        <div class="footer">
          Gerado em:
          ${new Date().toLocaleString('pt-BR')}
          |
          Total:
          ${lista.length}
        </div>

        <script>
          window.print();
        <\/script>

      </body>

      </html>
    `;


    const win =
      window.open(
        '',
        '_blank'
      );


    if (!win) {

      alert(
        "O navegador bloqueou a janela de impressão. Permita pop-ups para este site."
      );

      return;
    }


    win.document.write(
      htmlRelatorio
    );

    win.document.close();
  }


  // =========================================================
  // EXPORTAR BACKUP
  // =========================================================

  function exportar() {

    if (!currentUser) {
      return;
    }


    const blob =
      new Blob(
        [
          JSON.stringify(
            dados,
            null,
            2
          )
        ],
        {
          type: "application/json"
        }
      );


    const a =
      document.createElement("a");


    a.href =
      URL.createObjectURL(
        blob
      );


    a.download =
      `patrimonio_backup_${new Date().toISOString().slice(0, 10)}.json`;


    a.click();


    URL.revokeObjectURL(
      a.href
    );
  }


  // =========================================================
  // IMPORTAR BACKUP
  // =========================================================

  function importar(e) {

    if (!validarAcessoAdmin()) {
      return;
    }


    const file =
      e.target.files[0];


    if (!file) {
      return;
    }


    const reader =
      new FileReader();


    reader.onload =
      (event) => {

        try {

          const importados =
            JSON.parse(
              event.target.result
            );


          if (
            !Array.isArray(
              importados
            )
          ) {

            alert(
              "O arquivo não contém uma lista válida de patrimônios."
            );

            return;
          }


          if (
            confirm(
              `Importar ${importados.length} itens?`
            )
          ) {

            const ref =
              db.ref(
                "patrimonios"
              );


            const promessas =
              importados.map(
                item =>
                  ref.push({
                    numero:
                      item.numero,

                    local:
                      item.local,

                    descricao:
                      item.descricao,

                    status:
                      item.status ||
                      'ativo',

                    dataCadastro:
                      item.dataCadastro ||
                      new Date().toISOString(),

                    dataModificacao:
                      new Date().toISOString()
                  })
              );


            Promise
              .all(promessas)
              .then(() => {

                alert(
                  "Importação concluída!"
                );

              })
              .catch(error => {

                console.error(
                  "Erro na importação:",
                  error
                );

                alert(
                  "Ocorreu um erro durante a importação."
                );
              });
          }

        } catch (err) {

          console.error(
            "Erro ao ler backup:",
            err
          );

          alert(
            "Arquivo inválido."
          );
        }
      };


    reader.readAsText(
      file
    );


    // Permite selecionar o mesmo arquivo novamente.
    e.target.value = '';
  }


  // =========================================================
  // RENDERIZAR
  // =========================================================

  function renderizar(
    abaParaFocar = null
  ) {

    const pesquisaElement =
      document.getElementById(
        'pesquisa'
      );


    if (!pesquisaElement) {
      return;
    }


    const pesquisa =
      pesquisaElement.value
        .toLowerCase();


    let filtrados =
      dados
        .filter(d => {

          const matchPesquisa =
            String(
              d.numero
            )
              .toLowerCase()
              .includes(
                pesquisa
              );


          const matchStatus =
            filtroStatus === 'todos'
              ? true
              : d.status ===
                filtroStatus;


          return (
            matchPesquisa &&
            matchStatus
          );
        })
        .sort(
          ordenarPatrimonios
        );


    const tabButtons =
      document.getElementById(
        'tabButtons'
      );

    const tabContents =
      document.getElementById(
        'tabContents'
      );


    if (
      !tabButtons ||
      !tabContents
    ) {
      return;
    }


    tabButtons.innerHTML =
      '';

    tabContents.innerHTML =
      '';


    if (
      filtrados.length === 0
    ) {

      tabContents.innerHTML =
        "<p style='text-align:center; padding:40px;'>Nenhum registro encontrado.</p>";

      return;
    }


    const isAdmin =
      currentUser?.role === 'admin';


    // =======================================================
    // RESULTADOS DA BUSCA
    // =======================================================

    if (
      pesquisa !== "" ||
      filtroStatus !== 'todos'
    ) {

      tabButtons.innerHTML =
        "<span style='padding: 10px; color: #0277bd; font-weight: bold;'>🔍 Resultados da Busca:</span>";


      const div =
        document.createElement(
          'div'
        );


      div.className =
        'tab-content active';


      let t = `
        <div class="table-wrapper">

          <table>

            <thead>

              <tr>

                <th>N°</th>
                <th>Local</th>
                <th>Descrição</th>
                <th>Status</th>
                <th>Modificação</th>

                ${
                  isAdmin
                    ? '<th>Ações</th>'
                    : ''
                }

              </tr>

            </thead>

            <tbody>
      `;


      filtrados.forEach(d => {

        let rowClass =
          d.status === 'baixado'
            ? 'item-baixado'
            : d.status === 'analise'
              ? 'item-analise'
              : '';


        let statusDisplay =
          d.status === 'baixado'
            ? '❌ BAIXADO'
            : d.status === 'analise'
              ? '⚠️ EM ANÁLISE'
              : '✅ ATIVO';


        t += `
          <tr class="${rowClass}">

            <td>
              <strong>
                ${d.numero}
              </strong>
            </td>

            <td>
              ${d.local}
            </td>

            <td>
              ${d.descricao}
            </td>

            <td
              class="${
                d.status === 'analise'
                  ? 'status-analise'
                  : ''
              }"
            >
              ${statusDisplay}
            </td>

            <td>
              <small>
                ${formatarData(
                  d.dataModificacao
                )}
              </small>
            </td>
        `;


        if (isAdmin) {

          t += `
            <td class="action-buttons">

              <button
                class="btn-edit"
                data-id="${d.id}"
                data-action="editar"
              >
                Editar
              </button>

              ${
                d.status === 'baixado'

                ?

                `
                  <button
                    class="btn-edit"
                    data-id="${d.id}"
                    data-action="reativar"
                    style="background:#4caf50;"
                  >
                    Reativar
                  </button>
                `

                :

                d.status === 'analise'

                ?

                `
                  <button
                    class="btn-edit"
                    data-id="${d.id}"
                    data-action="reativar"
                    style="background:#4caf50;"
                  >
                    Aprovar
                  </button>

                  <button
                    class="btn-baixa-status"
                    data-id="${d.id}"
                    data-action="baixa"
                  >
                    Dar Baixa
                  </button>
                `

                :

                `
                  <button
                    class="btn-baixa-status"
                    data-id="${d.id}"
                    data-action="analise"
                    style="background:#f9a825;"
                  >
                    ⚠️ Análise
                  </button>

                  <button
                    class="btn-baixa-status"
                    data-id="${d.id}"
                    data-action="baixa"
                  >
                    Dar Baixa
                  </button>
                `
              }

              <button
                class="btn-delete"
                data-id="${d.id}"
                data-action="excluir"
              >
                Excluir
              </button>

            </td>
          `;
        }


        t += `
          </tr>
        `;
      });


      t += `
            </tbody>

          </table>

        </div>
      `;


      div.innerHTML =
        t;


      tabContents.appendChild(
        div
      );


      vincularEventosBotoes(
        div
      );


      return;
    }


    // =======================================================
    // VISUALIZAÇÃO POR GRUPO
    // =======================================================

    const campo =
      modo === 'local'
        ? 'local'
        : 'descricao';


    const grupos =
      [
        ...new Set(
          filtrados.map(
            d => d[campo]
          )
        )
      ].sort();


    let indiceAtivo =
      0;


    grupos.forEach(
      (g, i) => {

        if (
          abaParaFocar &&
          g === abaParaFocar
        ) {

          indiceAtivo =
            i;
        }


        const b =
          document.createElement(
            'button'
          );


        b.textContent =
          g;


        b.onclick =
          () => {

            abaAbertaRecentemente =
              g;

            ativarAba(i);
          };


        tabButtons.appendChild(
          b
        );


        const div =
          document.createElement(
            'div'
          );


        div.className =
          'tab-content';


        let t = `
          <div
            style="margin-bottom:12px; text-align:right;"
          >

            <button
              class="btn-print"
              data-grupo="${g}"
              data-action="imprimir-grupo"
            >
              🖨️ Imprimir Grupo
            </button>

          </div>
        `;


        t += `
          <div class="table-wrapper">

            <table>

              <thead>

                <tr>

                  <th>N°</th>

                  <th>
                    ${
                      modo === 'local'
                        ? 'Descrição'
                        : 'Local'
                    }
                  </th>

                  <th>Status</th>

                  <th>Modificação</th>

                  ${
                    isAdmin
                      ? '<th>Ações</th>'
                      : ''
                  }

                </tr>

              </thead>

              <tbody>
        `;


        const itensDoGrupo =
          filtrados.filter(
            d =>
              d[campo] === g
          );


        itensDoGrupo.forEach(
          d => {

            let rowClass =
              d.status === 'baixado'
                ? 'item-baixado'
                : d.status === 'analise'
                  ? 'item-analise'
                  : '';


            let statusDisplay =
              d.status === 'baixado'
                ? '❌ BAIXADO'
                : d.status === 'analise'
                  ? '⚠️ EM ANÁLISE'
                  : '✅ ATIVO';


            t += `
              <tr
                class="${rowClass}"
              >

                <td>
                  <strong>
                    ${d.numero}
                  </strong>
                </td>

                <td>
                  ${
                    modo === 'local'
                      ? d.descricao
                      : d.local
                  }
                </td>

                <td
                  class="${
                    d.status === 'analise'
                      ? 'status-analise'
                      : ''
                  }"
                >
                  ${statusDisplay}
                </td>

                <td>
                  <small>
                    ${formatarData(
                      d.dataModificacao
                    )}
                  </small>
                </td>
            `;


            if (isAdmin) {

              t += `
                <td class="action-buttons">

                  <button
                    class="btn-edit"
                    data-id="${d.id}"
                    data-action="editar"
                  >
                    Editar
                  </button>

                  ${
                    d.status === 'baixado'

                    ?

                    `
                      <button
                        class="btn-edit"
                        data-id="${d.id}"
                        data-action="reativar"
                        style="background:#4caf50;"
                      >
                        Reativar
                      </button>
                    `

                    :

                    d.status === 'analise'

                    ?

                    `
                      <button
                        class="btn-edit"
                        data-id="${d.id}"
                        data-action="reativar"
                        style="background:#4caf50;"
                      >
                        Aprovar
                      </button>

                      <button
                        class="btn-baixa-status"
                        data-id="${d.id}"
                        data-action="baixa"
                      >
                        Dar Baixa
                      </button>
                    `

                    :

                    `
                      <button
                        class="btn-baixa-status"
                        data-id="${d.id}"
                        data-action="analise"
                        style="background:#f9a825;"
                      >
                        ⚠️ Análise
                      </button>

                      <button
                        class="btn-baixa-status"
                        data-id="${d.id}"
                        data-action="baixa"
                      >
                        Dar Baixa
                      </button>
                    `
                  }

                  <button
                    class="btn-delete"
                    data-id="${d.id}"
                    data-action="excluir"
                  >
                    Excluir
                  </button>

                </td>
              `;
            }


            t += `
              </tr>
            `;
          }
        );


        t += `
              </tbody>

            </table>

          </div>
        `;


        div.innerHTML =
          t;


        tabContents.appendChild(
          div
        );


        vincularEventosBotoes(
          div
        );
      }
    );


    ativarAba(
      indiceAtivo
    );
  }


  // =========================================================
  // ATIVAR ABA
  // =========================================================

  function ativarAba(indice) {

    const botoes =
      document.querySelectorAll(
        '#tabButtons button'
      );

    const conteudos =
      document.querySelectorAll(
        '#tabContents .tab-content'
      );


    botoes.forEach(
      (b, i) =>
        b.classList.toggle(
          'active',
          i === indice
        )
    );


    conteudos.forEach(
      (c, i) =>
        c.classList.toggle(
          'active',
          i === indice
        )
    );
  }


  // =========================================================
  // EVENTOS DOS BOTÕES
  // =========================================================

  function vincularEventosBotoes(
    container
  ) {

    container
      .querySelectorAll(
        'button'
      )
      .forEach(
        btn => {

          const action =
            btn.getAttribute(
              'data-action'
            );

          const id =
            btn.getAttribute(
              'data-id'
            );

          const grupo =
            btn.getAttribute(
              'data-grupo'
            );


          if (!action) {
            return;
          }


          btn.onclick =
            (e) => {

              e.preventDefault();


              if (
                action === 'editar'
              ) {
                editar(id);
              }


              if (
                action === 'excluir'
              ) {
                excluir(id);
              }


              if (
                action === 'analise'
              ) {
                colocarEmAnalise(id);
              }


              if (
                action === 'baixa'
              ) {
                darBaixa(id);
              }


              if (
                action === 'reativar'
              ) {
                reativar(id);
              }


              if (
                action === 'imprimir-grupo'
              ) {
                gerarRelatorio(grupo);
              }

            };
        }
      );
  }


  // =========================================================
  // INICIALIZAÇÃO DA INTERFACE
  // =========================================================

  window.addEventListener(
    'DOMContentLoaded',
    () => {

      const btnLogin =
        document.getElementById(
          'btnFazerLogin'
        );

      const btnLogout =
        document.getElementById(
          'btnLogout'
        );


      if (btnLogin) {
        btnLogin.onclick =
          fazerLogin;
      }


      if (btnLogout) {
        btnLogout.onclick =
          logout;
      }


      document.getElementById(
        'cardTotal'
      ).onclick =
        filtrarTodos;


      document.getElementById(
        'cardAtivos'
      ).onclick =
        filtrarAtivos;


      document.getElementById(
        'cardAnalise'
      ).onclick =
        filtrarAnalise;


      document.getElementById(
        'cardBaixados'
      ).onclick =
        filtrarBaixados;


      document.getElementById(
        'btnExportar'
      ).onclick =
        exportar;


      document.getElementById(
        'btnRelatorioGeral'
      ).onclick =
        gerarRelatorioGeral;


      document.getElementById(
        'btnRelatorioBaixados'
      ).onclick =
        gerarRelatorioBaixados;


      document.getElementById(
        'btnAdicionar'
      ).onclick =
        adicionar;


      document.getElementById(
        'btnLocal'
      ).onclick =
        () => setModo('local');


      document.getElementById(
        'btnDescricao'
      ).onclick =
        () => setModo('descricao');


      document.querySelector(
        ".close"
      ).onclick =
        fecharModal;


      document.getElementById(
        'btnSalvarEdicao'
      ).onclick =
        salvarEdicao;


      document.getElementById(
        'pesquisa'
      ).oninput =
        () => renderizar();


      document.getElementById(
        'importFile'
      ).onchange =
        (e) => importar(e);


      document.getElementById(
        'btnAdicionarLocal'
      ).onclick =
        adicionarLocalDinamico;


      document.getElementById(
        'btnAdicionarDescricao'
      ).onclick =
        adicionarDescricaoDinamica;


      // Permitir pressionar ENTER no login

      const loginPassword =
        document.getElementById(
          'loginPassword'
        );


      if (loginPassword) {

        loginPassword.addEventListener(
          'keydown',
          (event) => {

            if (
              event.key === 'Enter'
            ) {

              fazerLogin();
            }
          }
        );
      }

    }
  );

})();