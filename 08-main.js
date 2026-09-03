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
  action === 'historico'
) {
  abrirHistorico(id);
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
    // =========================================================
// NAVEGAÇÃO PRINCIPAL
// =========================================================

inicializarNavegacao()

function abrirView(view) {

  const views = document.querySelectorAll('.app-view');
  const tabs = document.querySelectorAll('.nav-tab');

  views.forEach(section => {
    section.classList.toggle(
      'active',
      section.id === `view-${view}`
    );
  });

  tabs.forEach(tab => {
    tab.classList.toggle(
      'active',
      tab.dataset.view === view
    );
  });

  // Quando entrar no estoque, garante que a lista
  // esteja atualizada.
  if (view === 'estoque') {
    renderizar();
  }

  if (view === 'auditoria') {
    iniciarListenerAuditoria();
    carregarAuditoria();
  }

  if (view === 'lixeira') {
    renderizarLixeira();
  }

  if (view === 'dashboard' && typeof atualizarDashboardExtra === 'function') {
    atualizarDashboardExtra();
  }

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


function inicializarNavegacao() {

  document
    .querySelectorAll('.nav-tab')
    .forEach(tab => {

      tab.addEventListener('click', () => {

        const view =
          tab.dataset.view;

        abrirView(view);

      });

    });


  document
    .querySelectorAll('[data-go-view]')
    .forEach(button => {

      button.addEventListener('click', () => {

        abrirView(
          button.dataset.goView
        );

      });

    });

}

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
).onclick = () => {

  abrirView('estoque');

  filtrarTodos();

};


document.getElementById(
  'cardAtivos'
).onclick = () => {

  abrirView('estoque');

  filtrarAtivos();

};


document.getElementById(
  'cardAnalise'
).onclick = () => {

  abrirView('estoque');

  filtrarAnalise();

};


document.getElementById(
  'cardBaixados'
).onclick = () => {

  abrirView('estoque');

  filtrarBaixados();

};

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

    // =========================================================
// INVENTÁRIO
// =========================================================

document.getElementById(
    'btnAbrirInventario'
).onclick =
    abrirConfiguracaoInventario;


document.getElementById(
    'btnIniciarInventario'
).onclick =
    iniciarInventario;


document.getElementById(
    'btnCancelarInventario'
).onclick =
    fecharConfiguracaoInventario;

    const inventarioPesquisa =
    document.getElementById('inventarioPesquisa');

if (inventarioPesquisa) {

    inventarioPesquisa.addEventListener(
        'input',
        pesquisarInventario
    );
}

const btnLimparPesquisa =
    document.getElementById('btnLimparPesquisa');

if (btnLimparPesquisa) {

    btnLimparPesquisa.addEventListener(
        'click',
        () => {

            const input =
                document.getElementById(
                    'inventarioPesquisa'
                );

            const resultado =
                document.getElementById(
                    'inventarioResultadoBusca'
                );

            if (input) {
                input.value = '';
                input.focus();
            }

            if (resultado) {
                resultado.innerHTML = '';
            }
        }
    );
}

const btnFinalizarInventario =
    document.getElementById(
        'btnFinalizarInventario'
    );

if (btnFinalizarInventario) {

    btnFinalizarInventario.addEventListener(
        'click',
        finalizarInventario
    );

}

    // =========================================================
// AUDITORIA
// =========================================================

const filtroAuditoriaTipo =
  document.getElementById(
    'auditoriaFiltroTipo'
  );


const filtroAuditoriaPatrimonio =
  document.getElementById(
    'auditoriaFiltroPatrimonio'
  );


const filtroAuditoriaUsuario =
  document.getElementById(
    'auditoriaFiltroUsuario'
  );


const btnLimparAuditoria =
  document.getElementById(
    'btnLimparFiltrosAuditoria'
  );


if (filtroAuditoriaTipo) {

  filtroAuditoriaTipo.addEventListener(
    'change',
    renderizarAuditoria
  );

}


if (filtroAuditoriaPatrimonio) {

  filtroAuditoriaPatrimonio.addEventListener(
    'input',
    renderizarAuditoria
  );

}


if (filtroAuditoriaUsuario) {

  filtroAuditoriaUsuario.addEventListener(
    'input',
    renderizarAuditoria
  );

}

['auditoriaFiltroDataInicio','auditoriaFiltroDataFim'].forEach(id => {
  const campo = document.getElementById(id);
  if (campo) campo.addEventListener('change', renderizarAuditoria);
});


if (btnLimparAuditoria) {

  btnLimparAuditoria.onclick =
    () => {

      if (filtroAuditoriaTipo) {
        filtroAuditoriaTipo.value =
          'todos';
      }

      if (filtroAuditoriaPatrimonio) {
        filtroAuditoriaPatrimonio.value =
          '';
      }

      if (filtroAuditoriaUsuario) {
        filtroAuditoriaUsuario.value =
          '';
      }

      const dataInicioAuditoria = document.getElementById('auditoriaFiltroDataInicio');
      const dataFimAuditoria = document.getElementById('auditoriaFiltroDataFim');
      if (dataInicioAuditoria) dataInicioAuditoria.value = '';
      if (dataFimAuditoria) dataFimAuditoria.value = '';

      renderizarAuditoria();

    };

}

  }
);
