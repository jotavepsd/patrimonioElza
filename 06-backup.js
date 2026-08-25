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
