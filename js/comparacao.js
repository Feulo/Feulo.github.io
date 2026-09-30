(function () {
    "use strict";

    const FUNCAO_EXTERNO = 39;
    const FUNCAO_INTERNO = 57;

    function entradaDe(funcaoId) {
        const teto = lerTetoEscolhido();
        return {
            cargo: Number(document.getElementById("cargo").value),
            funcaoId,
            diasAlimentacao: 22,
            icm: 0.945,
            participacao: 1,
            regimePrevidenciario: "RGPS",
            previdenciaComplementar: Number(document.getElementById("previdenciaComplementar").value) / 100,
            transporte: document.getElementById("atin").value,
            teto: teto.teto,
            tetoDaCota: teto.tetoDaCota,
            auxilioSaude: "amafresp",
            cotaAmafresp: 930,
            faixaAmafresp: "29-33",
            desconto10Amafresp: false,
            dependentesAmafresp: [],
            iamspe: 0,
            agregadosIamspeIdadeInferior: 0,
            agregadosIamspeIdadeSuperior: 0,
            dependentesIamspeIdadeInferior: 0,
            dependentesIamspeIdadeSuperior: 0,
            tempoServico: Number(document.getElementById("tempoServico").value) || 0,
            dependentesIRRF: 0,
            situacao: "ativo",
            incorporacao: 0
        };
    }

    function dinheiro(valor) {
        return numberToReal(valor);
    }

    function visivel(externo, interno) {
        return Math.abs(externo) >= 0.005 || Math.abs(interno) >= 0.005;
    }

    function textoDelta(externo, interno) {
        const delta = externo - interno;
        if (Math.abs(delta) < 0.005) return { texto: "—", cor: "text-muted" };
        return {
            texto: `${delta > 0 ? "+" : "−"} ${dinheiro(Math.abs(delta))}`,
            cor: delta > 0 ? "text-success" : "text-danger"
        };
    }

    function item(esquerda, externo, interno, extra) {
        const delta = textoDelta(externo, interno);
        return `<div class="item-resultado item-comparado${extra ? ` ${extra}` : ""}">
            <div class="item-esquerda">${esquerda}</div>
            <span class="item-valor">${dinheiro(externo)}</span>
            <span class="item-valor">${dinheiro(interno)}</span>
            <span class="item-valor ${delta.cor}">${delta.texto}</span>
        </div>`;
    }

    function subsecao(titulo) {
        return `<div class="subsecao fw-bold border-bottom mt-3 mb-2 pb-1">${titulo}</div>`;
    }

    function cartaoCota(folha) {
        const textoLimite = folha.limiteQuota <= QUOTA_CALCULADA_PUBLICADA + 0.00005
            ? "Limitada pelo teto."
            : "Limitada pelo índice de variação nominal da arrecadação.";
        const cota = numberToQuota(folha.valorCota);
        const limite = numberToQuota(QUOTA_CALCULADA_PUBLICADA);
        return `<div class="cota-card cota-comparada">
            <div class="item-resultado item-comparado">
                <span class="cota-card-rotulo">
                    Cota de Pagamento
                    <button type="button" class="cota-info" aria-label="${textoLimite}">
                        <i class="bi bi-info-circle" aria-hidden="true"></i>
                        <span class="cota-balao" role="tooltip">${textoLimite}</span>
                    </button>
                </span>
                <span class="cota-card-valor text-end">${cota}</span>
                <span class="cota-card-valor text-end">${cota}</span>
                <span class="item-valor">—</span>
            </div>
            <div class="item-resultado item-comparado cota-card-limite">
                <span>Cota limite</span>
                <span class="text-end">${limite}</span>
                <span class="text-end">${limite}</span>
                <span class="item-valor">—</span>
            </div>
        </div>`;
    }

    function holerite(externo, interno, teto, mostrar) {
        const cargo = VB_COTAS[Number(document.getElementById("cargo").value) - 1];
        const atin = document.getElementById("atin").value === "nos";
        const remuneracao = [
            item(`<span>(+) Vencimento base</span> <span class="item-cotas">(${cargo} cotas)</span>`, externo.vb, interno.vb),
            mostrar.pp ? item(`<span>(+) Prêmio Produtividade</span> <span class="item-cotas">(${externo.ppCotas} / ${interno.ppCotas} cotas)</span>`, externo.pp, interno.pp) : "",
            mostrar.pl ? item(`<span>(+) Pro Labore</span> <span class="item-cotas">(${externo.funcaoObj.pl} / ${interno.funcaoObj.pl} cotas)</span>`, externo.pl, interno.pl) : "",
            mostrar.qq ? item(`<span>(+) Quinquênios</span> <span class="item-cotas">(${(externo.aliquotaQq * 100).toFixed(2)}%)</span>`, externo.qq, interno.qq) : "",
            mostrar.sexta ? item(`<span>(+) Sexta Parte</span> <span class="item-cotas">(${(externo.aliquota6p * 100).toFixed(2)}%)</span>`, externo.sextaParte, interno.sextaParte) : "",
            mostrar.pr ? item(`<span>(+) Participação nos Resultados</span> <span class="item-cotas">(${externo.prCotas} cotas)</span>`, externo.pr, interno.pr, "border-bottom mb-2 pb-2") : ""
        ].join("");
        const deducoes = [
            mostrar.teto ? item(`<span>(−) Dedução Teto</span> <span class="item-cotas">(${dinheiro(teto)})</span>`, externo.deducaoTeto, interno.deducaoTeto, "text-danger") : "",
            item(`<span>(−) Regime Previdenciário <span class="badge bg-success ms-1 fw-normal">RPPS pós-reforma</span></span>`, externo.valorPrevidenciaSocial, interno.valorPrevidenciaSocial, "text-danger"),
            mostrar.complementar ? item("<span>(−) Previdência Complementar</span>", externo.previdenciaComplementarValor, interno.previdenciaComplementarValor, "text-danger") : "",
            item("<span>(−) IRRF</span>", externo.irrf, interno.irrf, "text-danger"),
            mostrar.saude ? item(`<span>(−) AMAFRESP</span> <span class="item-cotas">(${textoCotas(externo.decimosSaude)} cotas)</span>`, externo.descontoSaude, interno.descontoSaude, "border-bottom mb-2 pb-2 text-danger") : ""
        ].join("");
        const indenizatorias = [
            mostrar.refeicao ? item(`<span>(+) Auxílio Refeição</span> <span class="item-cotas">(R$ 55,00/dia)</span>`, externo.vr, interno.vr, "text-success") : "",
            mostrar.transporte ? item(
                atin
                    ? `<span>(+) Nos Conformes</span> <span class="item-cotas">(300 UFESPs)</span>`
                    : `<span>(+) Adicional de Transporte</span> <span class="item-cotas">(1710 cotas)</span>`,
                externo.auxilioTransporte,
                interno.auxilioTransporte,
                "border-bottom mb-2 pb-2 text-success"
            ) : ""
        ].join("");
        const tituloIndenizatorias = indenizatorias ? subsecao("Verbas indenizatórias") : "";
        return `
            <div class="item-resultado item-comparado item-comparado-cabecalho fw-bold text-primary">
                <span></span>
                <span class="item-valor">Externo<span class="item-cotas">Fiscalização direta</span></span>
                <span class="item-valor">Interno<span class="item-cotas">Assistente fiscal</span></span>
                <span class="item-valor">Diferença<span class="item-cotas">externo − interno</span></span>
            </div>
            <div class="subsecao fw-bold border-bottom mb-2 pb-1">Cálculo da remuneração</div>
            ${remuneracao}
            ${item("<span>(=) Valor bruto</span>", externo.valorBruto, interno.valorBruto, "fw-bold")}
            ${cartaoCota(externo)}
            ${subsecao("Deduções")}
            ${deducoes}
            ${item("<span>(=) Valor líquido sem indenizações</span>", externo.remuneracaoLiquida, interno.remuneracaoLiquida, "fw-bold")}
            ${tituloIndenizatorias}
            ${indenizatorias}
            ${item("<span>(=) Vencimentos</span>", externo.vencimentos, interno.vencimentos, "fs-5 fw-bold text-primary bg-light p-2 rounded")}`;
    }

    function calcularComparacao() {
        const entradaExterno = entradaDe(FUNCAO_EXTERNO);
        const entradaInterno = entradaDe(FUNCAO_INTERNO);
        const externo = montarFolha(entradaExterno);
        const interno = montarFolha(entradaInterno);
        const mostrar = {
            pp: visivel(externo.pp, interno.pp),
            pl: visivel(externo.pl, interno.pl),
            qq: visivel(externo.qq, interno.qq),
            sexta: visivel(externo.sextaParte, interno.sextaParte),
            pr: visivel(externo.pr, interno.pr),
            teto: visivel(externo.deducaoTeto, interno.deducaoTeto),
            complementar: visivel(externo.previdenciaComplementarValor, interno.previdenciaComplementarValor),
            saude: visivel(externo.descontoSaude, interno.descontoSaude),
            refeicao: visivel(externo.vr, interno.vr),
            transporte: visivel(externo.auxilioTransporte, interno.auxilioTransporte)
        };
        document.getElementById("folhasComparadas").innerHTML = holerite(externo, interno, entradaExterno.teto, mostrar);
        document.getElementById("quadroComparacao").classList.remove("d-none");
        desenharEvolucao();

        const delta = externo.vencimentos - interno.vencimentos;
        const resumo = document.getElementById("resumoComparacao");
        const cota = `Cota de pagamento ${numberToQuota(externo.valorCota)}. Cota limite ${numberToQuota(QUOTA_CALCULADA_PUBLICADA)}.`;
        if (Math.abs(delta) < 0.005) {
            resumo.textContent = `Os vencimentos ficam iguais. ${cota}`;
        } else if (delta > 0) {
            resumo.textContent = `A fiscalização direta fica ${dinheiro(delta)} acima do assistente fiscal. ${cota}`;
        } else {
            resumo.textContent = `O assistente fiscal fica ${dinheiro(Math.abs(delta))} acima da fiscalização direta. ${cota}`;
        }
    }

    function projetarAno(teto) {
        const externoPleno = folhaNoLimite(entradaDe(FUNCAO_EXTERNO), teto, teto);
        const internoPleno = folhaNoLimite(entradaDe(FUNCAO_INTERNO), teto, teto);
        const externoHibrido = folhaNoLimite(entradaDe(FUNCAO_EXTERNO), teto, TETO_SP);
        const internoHibrido = folhaNoLimite(entradaDe(FUNCAO_INTERNO), teto, TETO_SP);
        return {
            teto,
            cota: externoPleno.valorCota,
            externoPleno: externoPleno.vencimentos,
            internoPleno: internoPleno.vencimentos,
            externoHibrido: externoHibrido.vencimentos,
            internoHibrido: internoHibrido.vencimentos,
            perdaExterno: externoPleno.vencimentos - externoHibrido.vencimentos,
            perdaInterno: internoPleno.vencimentos - internoHibrido.vencimentos
        };
    }

    function desenharEvolucao() {
        const anos = [];
        let tetoProjetado = TETO_STF;
        for (let ano = 2026; ano <= 2036; ano += 1) {
            if (ano > 2026) tetoProjetado *= 1 + AUMENTO_MEDIO_DECADA;
            anos.push({ ano, ...projetarAno(tetoProjetado) });
        }
        const percentual = (AUMENTO_MEDIO_DECADA * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        document.getElementById("textoEvolucao").textContent = `De 2016 a 2026 o subsídio dos ministros do STF passou de R$ 33.763,00 para R$ 46.366,19, uma média de ${percentual}% ao ano. A tabela aplica esse percentual ao teto e compara a cota acompanhando o STF com a cota presa ao governador de hoje (R$ 36.301,53). O nível, o tempo, o ATIN e a previdência complementar são os escolhidos acima.`;
        document.getElementById("corpoEvolucao").innerHTML = anos.map((linha) => `
            <tr>
                <td>${linha.ano}</td>
                <td class="text-end">${dinheiro(linha.teto)}</td>
                <td class="text-end">${numberToQuota(linha.cota)}</td>
                <td class="text-end text-success">${dinheiro(linha.externoPleno)}</td>
                <td class="text-end">${dinheiro(linha.externoHibrido)}</td>
                <td class="text-end text-danger fw-bold">${dinheiro(linha.perdaExterno)}</td>
                <td class="text-end text-success">${dinheiro(linha.internoPleno)}</td>
                <td class="text-end">${dinheiro(linha.internoHibrido)}</td>
                <td class="text-end text-danger fw-bold">${dinheiro(linha.perdaInterno)}</td>
            </tr>
        `).join("");
        const ultimo = anos[anos.length - 1];
        document.getElementById("fechoEvolucao").innerHTML = `Em 2036, deixar a cota no governador significa a fiscalização direta receber <strong>${dinheiro(ultimo.perdaExterno)}</strong> a menos por mês e o assistente fiscal receber <strong>${dinheiro(ultimo.perdaInterno)}</strong> a menos por mês.`;
    }

    document.getElementById("calcularComparacao").addEventListener("click", calcularComparacao);
})();
