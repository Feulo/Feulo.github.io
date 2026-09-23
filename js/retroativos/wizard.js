(function () {
    "use strict";

    const Data = window.RemuneracaoData;
    const Core = window.CalcRetroativos;
    const Judiciais = window.ServicosJudiciais;
    const Descontos = window.DescontosHistoricos;

    const RUBRICAS = [
        { id: "vb", nome: "Vencimento básico" },
        { id: "pp", nome: "Prêmio de produtividade" },
        { id: "pl", nome: "Pró-labore" },
        { id: "quinquenio", nome: "Quinquênio" },
        { id: "sextaParte", nome: "Sexta-parte" },
        { id: "pr", nome: "Participação nos resultados (PR)" },
        {
            id: "atin",
            nome: "ATIN / Nos Conformes — líquido e extra teto (300 UFESPs)",
            sujeitaTeto: false,
            tributavel: false,
            liquida: true,
            proporcional: false
        }
    ];

    const GRUPOS_FUNCOES = [
        { nome: "Fiscalização Direta (Sem Função)", ids: [39] },
        { nome: "Interno - TI", ids: [57] },
        { nome: "Direção e Chefia", ids: [1, 3, 5, 7, 10, 16, 19, 30, 40, 42, 43, 44, 46] },
        { nome: "Assessoria", ids: [2, 6, 8, 11, 17, 26, 29, 41, 45, 47, 49, 51, 52, 53] },
        { nome: "Assistência", ids: [13, 14, 22, 23, 31, 34, 50, 54, 55, 56] },
        { nome: "Consultoria", ids: [24, 32, 35, 48] },
        { nome: "Corregedoria", ids: [4, 9, 15] },
        { nome: "Fiscalização (Chefia)", ids: [25, 28] },
        { nome: "Julgamento", ids: [12, 18, 20, 37, 38] },
        { nome: "Representação", ids: [21, 27, 33, 36] }
    ];

    const FUNCOES_RESTRITAS_AFR_I = new Set([
        1, 3, 4, 5, 7, 9, 10, 15, 16, 19, 20, 21, 28, 40, 42, 43, 44, 46
    ]);

    const VERBAS_PADRAO = [
        ...RUBRICAS,
        { id: "insalubridade", nome: "Insalubridade / periculosidade", personalizada: true }
    ];

    const estado = {
        passo: 1,
        competencias: [],
        overrides: {},
        rubricasRecebidasPorCompetencia: {},
        casoPadrao: "personalizado",
        personalizadas: [],
        proximoId: 1,
        resultado: null
    };

    const porId = (id) => document.getElementById(id);
    const moeda = (centavos) => Core.deCentavos(centavos).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
    const numero = (centavos) => Core.deCentavos(centavos).toFixed(2);

    function escapar(texto) {
        return String(texto ?? "")
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    }

    function mostrarErro(mensagem) {
        const alerta = porId("mensagemErro");
        alerta.textContent = mensagem;
        alerta.classList.remove("d-none");
        alerta.focus();
    }

    function limparErro() {
        porId("mensagemErro").classList.add("d-none");
    }

    function perfilNaCompetencia(competencia) {
        const inicio = porId("dataInicio").value.split("-").map(Number);
        const [ano, mes] = competencia.split("-").map(Number);
        const anosDecorridos = Math.max(0, ano - inicio[0] - (mes < inicio[1] ? 1 : 0));
        return {
            cargo: Number(porId("cargoRetro").value),
            funcaoId: Number(porId("funcaoRetro").value),
            tempoServico: Number(porId("tempoServicoRetro").value) + anosDecorridos,
            icm: Number(porId("icmRetro").value)
        };
    }

    function valoresPerfil(competencia) {
        const valores = Data.calcularRubricasPerfil(perfilNaCompetencia(competencia), competencia);
        return Object.fromEntries(RUBRICAS.map((rubrica) => [
            rubrica.id,
            {
                nome: rubrica.nome,
                valorCentavos: Core.paraCentavos(valores[rubrica.id]),
                sujeitaTeto: rubrica.sujeitaTeto !== false,
                tributavel: rubrica.tributavel !== false,
                liquida: rubrica.liquida === true,
                proporcional: rubrica.proporcional !== false
            }
        ]));
    }

    function rubricasRecebidasSelecionadas(competencia) {
        if (competencia && estado.rubricasRecebidasPorCompetencia[competencia]) {
            return estado.rubricasRecebidasPorCompetencia[competencia];
        }
        return RUBRICAS
            .filter((rubrica) => porId(`recebida-${rubrica.id}`).checked)
            .map((rubrica) => rubrica.id);
    }

    function renderFuncoes() {
        const porFuncao = new Map(Data.FUNCOES.map((item) => [item.id, item]));
        porId("funcaoRetro").innerHTML = GRUPOS_FUNCOES.map((grupo) => `
            <optgroup label="${escapar(grupo.nome)}">
                ${grupo.ids.map((id) => {
                    const item = porFuncao.get(id);
                    return item
                        ? `<option value="${item.id}" ${item.id === 39 ? "selected" : ""}>${escapar(item.nome)}</option>`
                        : "";
                }).join("")}
            </optgroup>`).join("");
        filtrarFuncoesPorCargo();
    }

    function filtrarFuncoesPorCargo() {
        const cargoInicial = porId("cargoRetro").value === "1";
        Array.from(porId("funcaoRetro").options).forEach((option) => {
            const restrita = FUNCOES_RESTRITAS_AFR_I.has(Number(option.value));
            option.disabled = cargoInicial && restrita;
            option.hidden = cargoInicial && restrita;
        });
        if (porId("funcaoRetro").selectedOptions[0]?.disabled) {
            porId("funcaoRetro").value = "39";
        }
    }

    function renderRubricasRecebidas() {
        porId("rubricasRecebidas").innerHTML = RUBRICAS.map((rubrica) => `
            <label class="check-tile form-check" for="recebida-${rubrica.id}">
                <input class="form-check-input" id="recebida-${rubrica.id}" type="checkbox" checked>
                <span class="form-check-label">${escapar(rubrica.nome)}</span>
            </label>
        `).join("");
    }

    function marcarVerbaDevida(id, inicio, fim, ativa) {
        porId(`devida-${id}-ativa`).checked = ativa;
        porId(`devida-${id}-inicio`).value = inicio;
        porId(`devida-${id}-fim`).value = fim;
    }

    function aplicarCasoPadrao(valor) {
        estado.casoPadrao = valor;
        estado.overrides = {};
        estado.rubricasRecebidasPorCompetencia = {};
        if (valor === "personalizado") {
            renderVerbas();
            RUBRICAS.forEach((rubrica) => {
                const campo = porId(`recebida-${rubrica.id}`);
                if (campo) campo.checked = true;
            });
            porId("resumoRubricasCaso").classList.add("d-none");
            porId("descricaoCasoPadrao").textContent =
                "Escolher TI ou GT preenche período, função, o que já foi pago e o que ficou faltando.";
            return;
        }

        porId("dataInicio").value = "2026-08-14";
        porId("dataFim").value = "2026-09-30";
        porId("cargoRetro").value = "1";
        porId("regimeRetro").value = "teto-rgps";
        const ti = valor === "turma-2026-ti";
        filtrarFuncoesPorCargo();
        porId("funcaoRetro").value = ti ? "57" : "39";

        atualizarCompetencias();
        renderVerbas();

        estado.rubricasRecebidasPorCompetencia = {
            "2026-08": ["vb"],
            "2026-09": ti ? ["vb", "atin"] : ["vb", "pp", "pl", "atin"]
        };
        marcarVerbaDevida("pp", "2026-08", ti ? "2026-09" : "2026-08", true);
        marcarVerbaDevida("pl", "2026-08", ti ? "2026-09" : "2026-08", ti);
        marcarVerbaDevida("atin", "2026-09", "2026-09", false);

        porId("descricaoCasoPadrao").textContent = ti
            ? "TI: AFR I, função Assistente Fiscal. 14/08 a 30/09. Agosto = só VB proporcional. Setembro = VB + ATIN líquido extra teto. Faltam PP e pró-labore."
            : "GT: AFR I, Fiscalização Direta. 14/08 a 30/09. Agosto = só VB proporcional. Setembro sai correto (VB + PP + ATIN).";
        porId("resumoRubricasCaso").textContent = ti
            ? "Caso TI aplicado com função Assistente Fiscal. Agosto recebeu só VB. Setembro recebeu VB + ATIN líquido. Devidos: PP e pró-labore em ago/set. ATIN só a partir de setembro."
            : "Caso GT aplicado com Fiscalização Direta. Agosto recebeu só VB. Setembro está completo. Devido: PP proporcional de agosto. ATIN só a partir de setembro.";
        porId("resumoRubricasCaso").classList.remove("d-none");

        const uniao = new Set(Object.values(estado.rubricasRecebidasPorCompetencia).flat());
        RUBRICAS.forEach((rubrica) => {
            porId(`recebida-${rubrica.id}`).checked = uniao.has(rubrica.id);
        });
    }

    function cardVerba(verba, personalizadaDinamica) {
        const prefixo = personalizadaDinamica ? `custom-${verba.id}` : `devida-${verba.id}`;
        const periodoInicio = estado.competencias[0]?.competencia || porId("dataInicio").value.slice(0, 7);
        const periodoFim = estado.competencias.at(-1)?.competencia || porId("dataFim").value.slice(0, 7);
        const inicioAtin = Core.proximaCompetencia(porId("dataInicio").value.slice(0, 7));
        const inicioVerba = verba.id === "atin" ? inicioAtin : periodoInicio;
        const camposValor = verba.personalizada ? `
            <div class="col-md-3">
                <label class="form-label small" for="${prefixo}-nome">Nome da verba</label>
                <input class="form-control" id="${prefixo}-nome" type="text" value="${escapar(verba.nome)}">
            </div>
            <div class="col-md-2">
                <label class="form-label small" for="${prefixo}-valor">Valor mensal cheio</label>
                <input class="form-control" id="${prefixo}-valor" type="number" min="0" step="0.01" value="${verba.valor || ""}">
            </div>
        ` : `<div class="col-md-5"><strong>${escapar(verba.nome)}</strong><div class="form-text">${verba.id === "atin" ? "Líquido, extra teto e devido só no mês seguinte ao ingresso. 300 UFESPs do mês, sem IR nem previdência." : "Valor calculado em cotas."}</div></div>`;

        return `
            <div class="due-card" data-verba="${prefixo}">
                <div class="row g-2 align-items-end">
                    <div class="col-md-1">
                        <div class="form-check">
                            <input class="form-check-input verba-ativa" id="${prefixo}-ativa" type="checkbox">
                            <label class="form-check-label" for="${prefixo}-ativa">Incluir</label>
                        </div>
                    </div>
                    ${camposValor}
                    <div class="col-md-2">
                        <label class="form-label small" for="${prefixo}-inicio">Desde</label>
                        <input class="form-control" id="${prefixo}-inicio" type="month" value="${inicioVerba}">
                    </div>
                    <div class="col-md-2">
                        <label class="form-label small" for="${prefixo}-fim">Até</label>
                        <input class="form-control" id="${prefixo}-fim" type="month" value="${periodoFim}">
                    </div>
                    ${verba.personalizada ? `
                    <div class="col-md-2">
                        <div class="form-check mb-2">
                            <input class="form-check-input" id="${prefixo}-teto" type="checkbox" checked>
                            <label class="form-check-label small" for="${prefixo}-teto">Sujeita ao teto e descontos</label>
                        </div>
                        ${personalizadaDinamica ? `<button class="btn btn-sm btn-outline-danger remover-personalizada" data-id="${verba.id}" type="button">Remover</button>` : ""}
                    </div>` : ""}
                </div>
            </div>`;
    }

    function renderVerbas() {
        const padrao = VERBAS_PADRAO.map((verba) => cardVerba(verba, false)).join("");
        const extras = estado.personalizadas.map((verba) => cardVerba(verba, true)).join("");
        porId("verbasDevidas").innerHTML = padrao + extras;
    }

    function lerVerbasDevidas() {
        const verbas = VERBAS_PADRAO.map((verba) => {
            const prefixo = `devida-${verba.id}`;
            return {
                id: prefixo,
                tipo: verba.personalizada ? "personalizada" : verba.id,
                nome: verba.personalizada ? porId(`${prefixo}-nome`).value.trim() : verba.nome,
                valor: verba.personalizada ? Number(porId(`${prefixo}-valor`).value) : undefined,
                inicio: porId(`${prefixo}-inicio`).value,
                fim: porId(`${prefixo}-fim`).value,
                sujeitaTeto: verba.personalizada ? porId(`${prefixo}-teto`).checked : verba.sujeitaTeto !== false,
                tributavel: verba.personalizada ? porId(`${prefixo}-teto`).checked : verba.tributavel !== false,
                liquida: verba.liquida === true,
                proporcional: verba.proporcional !== false,
                ativa: porId(`${prefixo}-ativa`).checked
            };
        });
        estado.personalizadas.forEach((verba) => {
            const prefixo = `custom-${verba.id}`;
            verbas.push({
                id: prefixo,
                tipo: "personalizada",
                nome: porId(`${prefixo}-nome`).value.trim(),
                valor: Number(porId(`${prefixo}-valor`).value),
                inicio: porId(`${prefixo}-inicio`).value,
                fim: porId(`${prefixo}-fim`).value,
                sujeitaTeto: porId(`${prefixo}-teto`).checked,
                tributavel: porId(`${prefixo}-teto`).checked,
                ativa: porId(`${prefixo}-ativa`).checked
            });
        });
        return verbas;
    }

    function atualizarCompetencias() {
        estado.competencias = Core.gerarCompetencias(porId("dataInicio").value, porId("dataFim").value);
        if (!estado.competencias.length) throw new Error("A data final deve ser igual ou posterior à data inicial.");
        const semTeto = estado.competencias.find((item) => !Data.tetoNaCompetencia(item.competencia));
        if (semTeto) throw new Error(`Ainda não há teto cadastrado para ${semTeto.competencia}. Escolha um período entre 2019 e 2026.`);
        const semDescontos = estado.competencias.find((item) =>
            !Descontos.PREVIDENCIA.some((tabela) =>
                item.competencia >= tabela.inicio && item.competencia <= tabela.fim
            )
        );
        if (semDescontos) {
            throw new Error(`Ainda não há tabelas de descontos para ${semDescontos.competencia}. Escolha um período entre 2021 e 2026.`);
        }
        const parciais = estado.competencias.filter((item) => item.eParcial);
        porId("resumoParcial").textContent = parciais.length
            ? `Mês parcial identificado: ${parciais.map((item) => `${item.competencia} (${item.diasTrabalhados} dias)`).join(", ")}.`
            : "Todos os meses do período têm 30 dias para o cálculo.";
    }

    function valorRubricaRecebida(rubrica, dias) {
        if (!rubrica) return 0;
        return rubrica.proporcional === false
            ? rubrica.valorCentavos
            : Core.proporcionalizar(rubrica.valorCentavos, dias);
    }

    function remuneracaoSujeitaTetoRecebida(competencia, dias) {
        const valores = valoresPerfil(competencia);
        return rubricasRecebidasSelecionadas(competencia).reduce((total, id) => {
            const rubrica = valores[id];
            if (!rubrica || rubrica.sujeitaTeto === false) return total;
            return total + valorRubricaRecebida(rubrica, dias);
        }, 0);
    }

    function atinRecebido(competencia) {
        const valores = valoresPerfil(competencia);
        return rubricasRecebidasSelecionadas(competencia).includes("atin")
            ? valores.atin.valorCentavos
            : 0;
    }

    function salvarConferencia() {
        estado.competencias.forEach((item) => {
            const dias = Number(porId(`dias-${item.competencia}`).value);
            const teto = Number(porId(`teto-${item.competencia}`).value);
            const bruto = Number(porId(`bruto-${item.competencia}`).value);
            if (!Number.isInteger(dias) || dias < 1 || dias > 30) {
                throw new Error(`Informe de 1 a 30 dias em ${item.competencia}.`);
            }
            if (!(teto > 0) || bruto < 0) throw new Error(`Confira os valores monetários de ${item.competencia}.`);
            estado.overrides[item.competencia] = {
                diasTrabalhados: dias,
                tetoCentavos: Core.paraCentavos(teto),
                brutoRecebidoCentavos: Core.paraCentavos(bruto)
            };
        });
    }

    function renderConferencia() {
        porId("corpoConferencia").innerHTML = estado.competencias.map((item) => {
            const tetoInfo = Data.tetoNaCompetencia(item.competencia);
            const override = estado.overrides[item.competencia];
            const dias = override?.diasTrabalhados ?? item.diasTrabalhados;
            const bruto = override?.brutoRecebidoCentavos ?? remuneracaoSujeitaTetoRecebida(item.competencia, dias);
            const teto = override?.tetoCentavos ?? Core.paraCentavos(tetoInfo.valor);
            const atin = atinRecebido(item.competencia);
            return `
                <tr>
                    <td><strong>${item.competencia.slice(5)}/${item.competencia.slice(0, 4)}</strong>${dias < 30 ? `<br><small class="text-muted">Parcial</small>` : ""}</td>
                    <td><input class="form-control form-control-sm" id="dias-${item.competencia}" aria-label="Dias trabalhados em ${item.competencia}" type="number" min="1" max="30" value="${dias}"></td>
                    <td><input class="form-control form-control-sm text-end" id="bruto-${item.competencia}" aria-label="Remuneração sujeita a teto em ${item.competencia}" type="number" min="0" step="0.01" value="${numero(bruto)}"></td>
                    <td class="text-end small">${atin ? `${moeda(atin)}<div class="text-muted">líquido extra teto</div>` : "—"}</td>
                    <td><input class="form-control form-control-sm text-end" id="teto-${item.competencia}" aria-label="Teto vigente em ${item.competencia}" type="number" min="0.01" step="0.01" value="${numero(teto)}"></td>
                    <td><a href="${tetoInfo.fonte}" target="_blank" rel="noopener" title="${escapar(tetoInfo.norma)}">Ver norma</a></td>
                </tr>`;
        }).join("");
    }

    function configuracaoCalculo() {
        return {
            competencias: estado.competencias,
            overrides: estado.overrides,
            rubricasRecebidas: rubricasRecebidasSelecionadas(),
            rubricasRecebidasPorCompetencia: estado.rubricasRecebidasPorCompetencia,
            dataIngresso: porId("dataInicio").value,
            verbasDevidas: lerVerbasDevidas(),
            obterTetoCentavos(competencia) {
                return Core.paraCentavos(Data.tetoNaCompetencia(competencia)?.valor);
            },
            obterValoresPerfil: valoresPerfil,
            calcularServicos: Judiciais.calcularServicos,
            servicos: {
                reflexoPR: { ativo: porId("servicoPR").checked },
                quinquenio: {
                    ativo: porId("servicoQuinquenio").checked,
                    incluirPrincipal: porId("incluirQuinquenioPrincipal").checked
                }
            }
        };
    }

    function validarVerbas() {
        for (const verba of lerVerbasDevidas().filter((item) => item.ativa)) {
            if (!verba.inicio || !verba.fim || verba.inicio > verba.fim) {
                throw new Error(`Confira o período da verba “${verba.nome || "sem nome"}”.`);
            }
            if (verba.tipo === "personalizada" && (!verba.nome || !(verba.valor > 0))) {
                throw new Error("Toda verba personalizada incluída precisa de nome e valor maior que zero.");
            }
        }
    }

    function opcoesDescontos() {
        return {
            regime: porId("regimeRetro").value,
            dependentesIR: Number(porId("dependentesIRRetro").value) || 0,
            complementarAtiva: porId("complementarAtiva").checked,
            percentualComplementar: Number(porId("percentualComplementar").value) || 0,
            iamspeAtivo: porId("iamspeAtivo").checked,
            percentualIamspe: Number(porId("percentualIamspe").value) || 0
        };
    }

    function linhasRubricas(itens) {
        if (!itens.length) return `<div class="text-muted small">Nenhuma rubrica.</div>`;
        return itens.map((item) => `
            <div class="detail-line">
                <span>${escapar(item.nome)}</span>
                <strong>${moeda(item.valorCentavos)}</strong>
            </div>`).join("");
    }

    function linhaDesconto(nome, original, recalculado, diferenca) {
        return `
            <div class="discount-line">
                <span>${nome}</span>
                <span>${moeda(original)}</span>
                <span>${moeda(recalculado)}</span>
                <strong class="${diferenca ? "text-danger" : ""}">${moeda(diferenca)}</strong>
            </div>`;
    }

    function renderResultado() {
        estado.resultado = Core.calcularRetroativos(configuracaoCalculo());
        const opcoes = opcoesDescontos();
        estado.resultado.linhas = estado.resultado.linhas.map((linha) => {
            const descontos = Descontos.diferencaDescontos(
                linha.competencia,
                linha.baseTributavelOriginalCentavos,
                linha.baseTributavelRecalculadaCentavos,
                opcoes
            );
            const descontosAdicionaisCentavos = descontos.diferenca.totalCentavos;
            return {
                ...linha,
                descontos,
                descontosAdicionaisCentavos,
                liquidoRetroativoCentavos: Math.max(
                    0,
                    linha.retroativoAjustadoCentavos - descontosAdicionaisCentavos
                )
            };
        });
        const { linhas, totais } = estado.resultado;
        totais.descontosCentavos = Core.somarCentavos(linhas.map((linha) => linha.descontosAdicionaisCentavos));
        totais.liquidoCentavos = Core.somarCentavos(linhas.map((linha) => linha.liquidoRetroativoCentavos));
        porId("totalBruto").textContent = moeda(totais.brutoCentavos);
        porId("totalExtrasLiquidos").textContent = moeda(totais.liquidasExtraCentavos);
        porId("totalAbate").textContent = moeda(totais.abateCentavos);
        porId("totalDescontos").textContent = moeda(totais.descontosCentavos);
        porId("totalLiquido").textContent = moeda(totais.liquidoCentavos);
        porId("totalReflexos").textContent = moeda(totais.reflexosCentavos);
        porId("corpoResultado").innerHTML = linhas.map((linha) => {
            const descontos = linha.descontos;
            const retroativos = [...linha.verbasDevidas, ...linha.reflexosJudiciais];
            return `<tr class="competencia-row">
                <td class="text-nowrap fw-semibold">${linha.competencia.slice(5)}/${linha.competencia.slice(0, 4)}${linha.eParcial ? `<br><small>${linha.diasTrabalhados} dias</small>` : ""}</td>
                <td class="text-end">${moeda(linha.remuneracaoBrutaOriginalCentavos)}</td>
                <td class="text-end">${moeda(linha.retroativoBrutoCentavos)}</td>
                <td class="text-end text-primary">${moeda(linha.retroLiquidoExtraCentavos)}</td>
                <td class="text-end">${moeda(linha.remuneracaoBrutaRecalculadaCentavos)}</td>
                <td class="text-end text-danger">${moeda(linha.abateIncrementalCentavos)}</td>
                <td class="text-end text-danger">${moeda(linha.descontosAdicionaisCentavos)}</td>
                <td class="text-end fw-bold text-success">${moeda(linha.liquidoRetroativoCentavos)}</td>
            </tr>
            <tr class="detail-row">
                <td colspan="8">
                    <details>
                        <summary>Ver rubricas e descontos de ${linha.competencia.slice(5)}/${linha.competencia.slice(0, 4)}</summary>
                        <div class="detail-grid">
                            <section>
                                <h3>Remuneração original</h3>
                                ${linhasRubricas(linha.rubricasRecebidas)}
                                <div class="detail-total"><span>Bruto original</span><strong>${moeda(linha.remuneracaoBrutaOriginalCentavos)}</strong></div>
                                <div class="detail-total"><span>Extras líquidas recebidas</span><strong>${moeda(linha.liquidasRecebidasCentavos)}</strong></div>
                                <div class="detail-total"><span>Total recebido</span><strong>${moeda(linha.remuneracaoTotalOriginalCentavos)}</strong></div>
                                <div class="detail-total"><span>Após teto + extras</span><strong>${moeda(linha.remuneracaoAposTetoOriginalCentavos)}</strong></div>
                            </section>
                            <section>
                                <h3>Verbas retroativas</h3>
                                ${linhasRubricas(retroativos)}
                                <div class="detail-total"><span>Retroativo bruto</span><strong>${moeda(linha.retroativoBrutoCentavos)}</strong></div>
                                <div class="detail-total"><span>Extras líquidas e extra-teto</span><strong>${moeda(linha.retroLiquidoExtraCentavos)}</strong></div>
                                <div class="detail-total"><span>Após teto + extras</span><strong>${moeda(linha.retroativoAjustadoCentavos)}</strong></div>
                            </section>
                        </div>
                        <div class="discount-detail">
                            <div class="discount-line discount-header">
                                <span>Desconto</span><span>Original</span><span>Recalculado</span><span>Diferença</span>
                            </div>
                            ${linhaDesconto("Previdência oficial", descontos.original.previdenciaCentavos, descontos.recalculado.previdenciaCentavos, descontos.diferenca.previdenciaCentavos)}
                            ${linhaDesconto("Previdência complementar", descontos.original.complementarCentavos, descontos.recalculado.complementarCentavos, descontos.diferenca.complementarCentavos)}
                            ${linhaDesconto("IRRF", descontos.original.irrfCentavos, descontos.recalculado.irrfCentavos, descontos.diferenca.irrfCentavos)}
                            ${linhaDesconto("IAMSPE", descontos.original.iamspeCentavos, descontos.recalculado.iamspeCentavos, descontos.diferenca.iamspeCentavos)}
                            ${linhaDesconto("Total", descontos.original.totalCentavos, descontos.recalculado.totalCentavos, descontos.diferenca.totalCentavos)}
                            <div class="discount-line net-line">
                                <span>Líquido estimado</span>
                                <span>${moeda(linha.remuneracaoAposTetoOriginalCentavos - descontos.original.totalCentavos)}</span>
                                <span>${moeda(linha.remuneracaoAposTetoRecalculadaCentavos - descontos.recalculado.totalCentavos)}</span>
                                <strong>${moeda(linha.liquidoRetroativoCentavos)}</strong>
                            </div>
                        </div>
                    </details>
                </td>
            </tr>`;
        }).join("");
    }

    function validarPasso() {
        if (estado.passo === 1) atualizarCompetencias();
        if (estado.passo === 2) {
            if (!rubricasRecebidasSelecionadas().length) {
                throw new Error("Selecione ao menos uma rubrica recebida para calcular a ocupação do teto.");
            }
            const opcoes = opcoesDescontos();
            if (opcoes.complementarAtiva && !(opcoes.percentualComplementar > 0)) {
                throw new Error("Informe o percentual da previdência complementar.");
            }
            if (opcoes.iamspeAtivo && !(opcoes.percentualIamspe > 0)) {
                throw new Error("Informe o percentual total do IAMSPE.");
            }
        }
        if (estado.passo === 3) {
            validarVerbas();
            renderConferencia();
        }
        if (estado.passo === 4) salvarConferencia();
        if (estado.passo === 5) renderResultado();
    }

    function mostrarPasso(novoPasso) {
        estado.passo = Math.min(6, Math.max(1, novoPasso));
        document.querySelectorAll(".wizard-step").forEach((secao) => {
            secao.classList.toggle("d-none", Number(secao.dataset.step) !== estado.passo);
        });
        document.querySelectorAll("#wizardProgress li").forEach((item, indice) => {
            item.classList.toggle("active", indice + 1 <= estado.passo);
        });
        porId("voltar").classList.toggle("d-none", estado.passo === 1);
        porId("avancar").classList.toggle("d-none", estado.passo === 6);
        porId("avancar").textContent = estado.passo === 5 ? "Calcular resultado" : "Continuar";
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function avancar() {
        limparErro();
        try {
            validarPasso();
            mostrarPasso(estado.passo + 1);
        } catch (erro) {
            mostrarErro(erro.message || "Confira as informações antes de continuar.");
        }
    }

    function voltar() {
        limparErro();
        if (estado.passo === 4) {
            try { salvarConferencia(); } catch (_) { /* preserva campos válidos ao voltar */ }
        }
        mostrarPasso(estado.passo - 1);
    }

    function csvCelula(valor) {
        return `"${String(valor ?? "").replaceAll('"', '""')}"`;
    }

    function exportarCsv() {
        if (!estado.resultado) return;
        const cabecalho = [
            "Competência", "Dias", "Rubricas recebidas", "Salário original", "Verbas devidas",
            "Retroativo bruto", "Extras líquidas", "Salário recalculado", "Abate teto", "Previdência adicional",
            "Complementar adicional", "IRRF adicional", "IAMSPE adicional", "Novos descontos",
            "Líquido retroativo", "Reflexos judiciais"
        ];
        const linhas = estado.resultado.linhas.map((linha) => [
            linha.competencia,
            linha.diasTrabalhados,
            linha.rubricasRecebidas.map((item) => `${item.nome}: ${numero(item.valorCentavos)}`).join(" | "),
            numero(linha.remuneracaoBrutaOriginalCentavos).replace(".", ","),
            linha.verbasDevidas.map((item) => `${item.nome}: ${numero(item.valorCentavos)}`).join(" | "),
            numero(linha.retroativoBrutoCentavos).replace(".", ","),
            numero(linha.retroLiquidoExtraCentavos).replace(".", ","),
            numero(linha.remuneracaoBrutaRecalculadaCentavos).replace(".", ","),
            numero(linha.abateIncrementalCentavos).replace(".", ","),
            numero(linha.descontos.diferenca.previdenciaCentavos).replace(".", ","),
            numero(linha.descontos.diferenca.complementarCentavos).replace(".", ","),
            numero(linha.descontos.diferenca.irrfCentavos).replace(".", ","),
            numero(linha.descontos.diferenca.iamspeCentavos).replace(".", ","),
            numero(linha.descontosAdicionaisCentavos).replace(".", ","),
            numero(linha.liquidoRetroativoCentavos).replace(".", ","),
            linha.reflexosJudiciais.map((item) => `${item.nome}: ${numero(item.valorCentavos).replace(".", ",")}`).join(" | ")
        ].map(csvCelula).join(";"));
        const blob = new Blob(["\uFEFF", [cabecalho.map(csvCelula).join(";"), ...linhas].join("\n")], { type: "text/csv;charset=utf-8" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "calculo-verbas-retroativas.csv";
        link.click();
        setTimeout(() => URL.revokeObjectURL(link.href), 0);
    }

    function renderFontes() {
        porId("listaFontes").innerHTML = Data.TETOS_SP.map((item) => `
            <li>${item.inicio} a ${item.fim}: ${moeda(Core.paraCentavos(item.valor))} —
                <a href="${item.fonte}" target="_blank" rel="noopener">${escapar(item.norma)}</a>
            </li>`).join("") + `
            <li>ATIN / Nos Conformes: 300 UFESPs conforme o valor anual —
                <a href="${Data.FONTE_UFESP}" target="_blank" rel="noopener">SEFAZ/SP — valores da UFESP</a>
            </li>`;
        porId("listaFontesDescontos").innerHTML = `
            <li><a href="${Descontos.FONTE_INSS}" target="_blank" rel="noopener">INSS — tabelas históricas de contribuição</a></li>
            <li><a href="${Descontos.FONTE_RPPS}" target="_blank" rel="noopener">SEFAZ/SP — contribuição previdenciária dos servidores ativos</a></li>
            <li><a href="${Descontos.FONTE_IR}" target="_blank" rel="noopener">Receita Federal — tabelas históricas do IRPF</a></li>`;
    }

    function iniciar() {
        renderFuncoes();
        renderRubricasRecebidas();
        atualizarCompetencias();
        renderVerbas();
        renderFontes();
        const casoInicial = document.querySelector("input[name='casoPadrao']:checked")?.value;
        if (casoInicial && casoInicial !== "personalizado") aplicarCasoPadrao(casoInicial);
        porId("avancar").addEventListener("click", avancar);
        porId("voltar").addEventListener("click", voltar);
        document.querySelectorAll("input[name='casoPadrao']").forEach((opcao) => {
            opcao.addEventListener("change", (evento) => aplicarCasoPadrao(evento.target.value));
        });
        porId("cargoRetro").addEventListener("change", filtrarFuncoesPorCargo);
        porId("exportarCsv").addEventListener("click", exportarCsv);
        porId("imprimirRelatorio").addEventListener("click", () => window.print());
        porId("complementarAtiva").addEventListener("change", (evento) => {
            porId("percentualComplementar").disabled = !evento.target.checked;
        });
        porId("iamspeAtivo").addEventListener("change", (evento) => {
            porId("percentualIamspe").disabled = !evento.target.checked;
        });
        porId("adicionarPersonalizada").addEventListener("click", () => {
            const verba = {
                id: estado.proximoId++,
                nome: "Outra verba",
                valor: "",
                personalizada: true
            };
            estado.personalizadas.push(verba);
            porId("verbasDevidas").insertAdjacentHTML("beforeend", cardVerba(verba, true));
        });
        porId("verbasDevidas").addEventListener("click", (evento) => {
            const botao = evento.target.closest(".remover-personalizada");
            if (!botao) return;
            estado.personalizadas = estado.personalizadas.filter((item) => item.id !== Number(botao.dataset.id));
            botao.closest(".due-card").remove();
        });
        let detalhesAbertos = [];
        window.addEventListener("beforeprint", () => {
            detalhesAbertos = Array.from(document.querySelectorAll(".detail-row details")).map((item) => item.open);
            document.querySelectorAll(".detail-row details").forEach((item) => { item.open = true; });
        });
        window.addEventListener("afterprint", () => {
            document.querySelectorAll(".detail-row details").forEach((item, indice) => {
                item.open = detalhesAbertos[indice] || false;
            });
        });
    }

    document.addEventListener("DOMContentLoaded", iniciar);
})();
