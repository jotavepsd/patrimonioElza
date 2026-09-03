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

    appAlert(
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

    appAlert(
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

    appAlert(
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
