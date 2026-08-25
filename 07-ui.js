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
