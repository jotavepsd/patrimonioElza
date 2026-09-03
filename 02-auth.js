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

    appAlert(
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

    appAlert(
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
