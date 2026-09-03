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
    async (event) => {

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

          appAlert(
            "O arquivo não contém uma lista válida de patrimônios."
          );

          return;
        }


        if (
          await appConfirm(
            `Importar ${importados.length} itens?`,
            "Importar backup",
            { icone: "📥", confirmarTexto: "Importar" }
          )
        ) {

          const atualizacoes = {};
          const agora = new Date().toISOString();

          importados.forEach(item => {
            const key = db.ref('patrimonios').push().key;
            atualizacoes[`patrimonios/${key}`] = {
              numero: item.numero,
              local: item.local,
              descricao: item.descricao,
              status: item.status || 'ativo',
              dataCadastro: item.dataCadastro || agora,
              dataModificacao: agora
            };
          });

          await registrarEvento({
            tipo: 'importacao_backup',
            observacao: `Importação de backup concluída com ${importados.length} patrimônio(s).`,
            databaseUpdates: atualizacoes
          });

          appAlert(
            "Importação concluída!",
            "Backup importado",
            { icone: "✅" }
          );
        }

      } catch (err) {

        console.error(
          "Erro ao ler backup:",
          err
        );

        appAlert(
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
