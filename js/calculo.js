// Valores atualizados até 04/2026.
const VALOR_UFESP = 38.42;
const VALOR_REFEICAO = 55;
const TETO_SP = 36301.53;
const TETO_STF = 46366.19;
const TETO_INSS = 8475.55;
// Última quota calculada cuja tabela foi lida por inteiro: competência jul/2025,
// Portaria DGEP 03, de 30/03/2026, competência fevereiro/2026.
const QUOTA_CALCULADA_PUBLICADA = 5.908;
const VALOR_NOS_CONFORMES = 300 * VALOR_UFESP; 
const SALARIO_MINIMO = 1621.00;

const VB_COTAS = [4300, 4550, 4800, 5200, 5600, 6000];

// Estrutura unificada: reflete o PL e PP da imagem de funções atuais + PR da tabela de resolução
const FUNCOES = [
    { id: 1, pl: 2400, pp: 3600, pr: [0, 4280, 4410, 4540, 4670, 4800] }, // Subsecretário da Receita Estadual
    { id: 2, pl: 2400, pp: 3600, pr: [4150, 4280, 4410, 4540, 4670, 4800] }, // Assessor Fiscal Setorial VII
    { id: 3, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Subsecretário Adjunto
    { id: 4, pl: 2380, pp: 3595, pr: [0, 4066, 4190, 4313, 4437, 4560] }, // Corregedor-Geral
    { id: 5, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Diretor Geral
    { id: 6, pl: 2380, pp: 3595, pr: [4026, 4152, 4278, 4404, 4530, 4656] }, // Assessor Fiscal Setorial VI
    { id: 7, pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] }, // Diretor Geral Adjunto
    { id: 8, pl: 2280, pp: 3585, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Assessor Fiscal Setorial V
    { id: 9, pl: 2280, pp: 3585, pr: [0, 3959, 4079, 4200, 4320, 4440] }, // Corregedor Adjunto
    { id: 10, pl: 2160, pp: 3570, pr: [0, 4066, 4190, 4313, 4437, 4560] }, // Diretor
    { id: 11, pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assessor Fiscal Setorial IV
    { id: 12, pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Presidente do TIT
    { id: 13, pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assistente Fiscal Técnico Chefe
    { id: 14, pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assistente Fiscal de Gab. do Secretário
    { id: 15, pl: 2160, pp: 3570, pr: [0, 3638, 3749, 3859, 3970, 4080] }, // Corregedor Fiscal
    { id: 16, pl: 2070, pp: 3480, pr: [0, 3959, 4079, 4200, 4320, 4440] }, // Diretor Adjunto
    { id: 17, pl: 2070, pp: 3480, pr: [3735, 3852, 3969, 4086, 4203, 4320] }, // Assessor Fiscal Setorial III
    { id: 18, pl: 2070, pp: 3480, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Vice-Presidente do TIT
    { id: 19, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Tributário
    { id: 20, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Tributário de Julgamento
    { id: 21, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Representante Fiscal Chefe
    { id: 22, pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Técnico
    { id: 23, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Chefe
    { id: 24, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Consultor Tributário Chefe
    { id: 25, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Supervisor Fiscal
    { id: 26, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assessor Fiscal Setorial II
    { id: 27, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Rep. Fiscal Chefe de Assistência
    { id: 28, pl: 1980, pp: 3450, pr: [0, 3638, 3749, 3859, 3970, 4080] }, // Inspetor Fiscal
    { id: 29, pl: 1800, pp: 3375, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assessor Fiscal Setorial I
    { id: 30, pl: 1800, pp: 3375, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Chefe
    { id: 31, pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] }, // Assistente Fiscal Especialista
    { id: 32, pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] }, // Consultor Tributário Especialista
    { id: 33, pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] }, // Representante Fiscal Especialista
    { id: 34, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Assistente Fiscal
    { id: 35, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Consultor Tributário
    { id: 36, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Representante Fiscal
    { id: 37, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Juiz com Dedicação Exclusiva
    { id: 38, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Julgador Fiscal
    { id: 39, pl: 0, pp: 2700, pr: [3279, 3381, 3484, 3587, 3689, 3792]}, // Fiscalização Direta de Tributos (Externo)
    
    // Novas Funções (Complementares das Tabelas de PR)
    { id: 40, pl: 2400, pp: 3600, pr: [0, 4280, 4410, 4540, 4670, 4800] }, // Coordenador da Administração Tributária
    { id: 41, pl: 2160, pp: 3570, pr: [4150, 4237, 4366, 4495, 4623, 4752] }, // Assessor Fiscal Especial IV
    { id: 42, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Coordenador Adjunto da Administração Tributária
    { id: 43, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Subcoordenador da Administração Tributária
    { id: 44, pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] }, // Subcoordenador Adjunto da Administração Tributária
    { id: 45, pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Assessor Fiscal Especial III
    { id: 46, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Regional Tributário
    { id: 47, pl: 1980, pp: 3450, pr: [3735, 3852, 3969, 4086, 4203, 4320] }, // Assessor Fiscal III
    { id: 48, pl: 1980, pp: 3450, pr: [3631, 3745, 3859, 3973, 4086, 4200] }, // Consultor Tributário Chefe - Cotepe
    { id: 49, pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assessor Fiscal Especial II
    { id: 50, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Chefe I
    { id: 51, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assessor Fiscal II
    { id: 52, pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] }, // Assessor Fiscal Especial I
    { id: 53, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Assessor Fiscal I
    { id: 54, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Assistente Fiscal III
    { id: 55, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }, // Assistente Fiscal II
    { id: 56, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }, // Assistente Fiscal de Cobrança
    { id: 57, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }  // Assistente Fiscal I
];

// Faixas RPPS SP (LC 1.354/2020)
const FAIXAS_RPPS = [
    { limite: SALARIO_MINIMO, aliquota: 0.11 },
    { limite: 4174.58, aliquota: 0.12 },
    { limite: TETO_INSS, aliquota: 0.14 },
    { limite: Infinity, aliquota: 0.16 }
];

// LC 1.354/2020, art. 8º, I a III. No RGPS a contribuição para no teto.
// O limite de R$ 3.000,00 do inciso II foi reajustado pela UFESP para R$ 4.174,58 em 2026.
const FAIXAS_RGPS = [
    { limite: SALARIO_MINIMO, aliquota: 0.11 },
    { limite: 4174.58, aliquota: 0.12 },
    { limite: TETO_INSS, aliquota: 0.14 }
];

// Art. 16, § 4º, item 2, da LC 1.059/2008: 0,008334% do limite do art. 115, XII, da CE.
// As portarias truncam esse produto em 4 casas. Não é teto / 12.000.
function limiteDaQuota(teto) {
    const centavos = Math.round(Number(teto) * 100);
    if (!Number.isFinite(centavos) || centavos <= 0) return 0;
    return Math.floor((centavos * 8334) / 1000000) / 10000;
}

function numberToReal(numero) {
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function numberToQuota(numero) {
    return numero.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4
    });
}

function calcularFaixasProgressivas(valorBase, faixas) {
    let total = 0;
    for (let i = 0; i < faixas.length; i++) {
        const { limite, aliquota } = faixas[i];
        const limiteAnterior = i === 0 ? 0 : faixas[i - 1].limite;
        
        if (valorBase > limiteAnterior) {
            const baseCalculo = Math.min(valorBase, limite) - limiteAnterior;
            total += baseCalculo * aliquota;
        } else {
            break;
        }
    }
    return total;
}

function calcularIRRF(baseIRRF) {
    if (baseIRRF <= 2428.80) {
        return 0;
    }

    let aliquota = 0;
    let parcelaDeduzir = 0;

    if (baseIRRF <= 2826.65) {
        aliquota = 0.075;
        parcelaDeduzir = 182.16;
    } else if (baseIRRF <= 3751.05) {
        aliquota = 0.15;
        parcelaDeduzir = 394.16;
    } else if (baseIRRF <= 4664.68) {
        aliquota = 0.225;
        parcelaDeduzir = 675.49;
    } else {
        aliquota = 0.275;
        parcelaDeduzir = 908.73; 
    }

    const imposto = (baseIRRF * aliquota) - parcelaDeduzir;
    return imposto > 0 ? imposto : 0;
}

function lerTetoEscolhido() {
    const tipoTeto = document.getElementById("tipoTeto").value;
    const cotaAcompanhaTeto = document.getElementById("cotaAcompanhaTeto").value !== "0";
    let teto;
    if (tipoTeto === "stf") {
        teto = TETO_STF;
    } else if (tipoTeto === "informado") {
        teto = Number(document.getElementById("tetoInformado").value);
    } else {
        teto = TETO_SP;
    }
    if (!Number.isFinite(teto) || teto < 0) teto = 0;
    return {
        teto,
        tetoDaCota: cotaAcompanhaTeto ? teto : TETO_SP
    };
}

const FAIXAS_AMAFRESP = [
    { id: "0-18", rotulo: "0 a 18 anos", decimos: 6 },
    { id: "19-23", rotulo: "19 a 23 anos", decimos: 6 },
    { id: "24-28", rotulo: "24 a 28 anos", decimos: 8 },
    { id: "29-33", rotulo: "29 a 33 anos", decimos: 10 },
    { id: "34-38", rotulo: "34 a 38 anos", decimos: 10 },
    { id: "39-43", rotulo: "39 a 43 anos", decimos: 10 },
    { id: "44-48", rotulo: "44 a 48 anos", decimos: 15 },
    { id: "49-53", rotulo: "49 a 53 anos", decimos: 20 },
    { id: "54-58", rotulo: "54 a 58 anos", decimos: 20 },
    { id: "59-63", rotulo: "59 a 63 anos", decimos: 35, descontoDecimos: 10 },
    { id: "64-69", rotulo: "64 a 69 anos", decimos: 35, descontoDecimos: 5 },
    { id: "70", rotulo: "70 anos ou mais", decimos: 35 }
];

function faixaAmafresp(id) {
    return FAIXAS_AMAFRESP.find((faixa) => faixa.id === id) || null;
}

function decimosAmafresp(id, comDesconto10) {
    const faixa = faixaAmafresp(id);
    if (!faixa) return 0;
    const desconto = comDesconto10 && faixa.descontoDecimos ? faixa.descontoDecimos : 0;
    return Math.max(0, faixa.decimos - desconto);
}

function valorPorDecimos(decimos, valorCota) {
    const centavos = Math.round(Number(valorCota) * 100);
    if (!Number.isFinite(centavos) || centavos < 0) return 0;
    return (decimos * centavos) / 1000;
}

function textoCotas(decimos) {
    return (decimos / 10).toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function lerEntrada() {
    const dependentesIRRFElem = document.getElementById("dependentesIRRF");
    const auxilioSaude = document.getElementById("auxilioSaude").value;
    const iamspeLigado = auxilioSaude === "iamspe";
    const iamspe = iamspeLigado ? Number(document.getElementById("iamspe").value) : 0;
    const teto = lerTetoEscolhido();
    const dependentesAmafresp = auxilioSaude === "amafresp"
        ? Array.from(document.querySelectorAll(".amafresp-dependente")).map((campo) => ({
            faixaId: campo.dataset.faixa,
            comDesconto10: campo.dataset.desconto === "1",
            quantidade: Number(campo.value) || 0
        }))
        : [];
    return {
        cargo: Number(document.getElementById("cargo").value),
        funcaoId: Number(document.getElementById("funcao").value),
        diasAlimentacao: Number(document.getElementById("diasAlimentacao").value),
        icm: Number(document.getElementById("icm").value) / 100,
        participacao: Number(document.getElementById("participacaoResultados").value),
        regimePrevidenciario: document.getElementById("regimePrevidenciario").value,
        previdenciaComplementar: Number(document.getElementById("previdenciaComplementar").value) / 100,
        transporte: document.getElementById("transporte").value,
        teto: teto.teto,
        tetoDaCota: teto.tetoDaCota,
        auxilioSaude,
        cotaAmafresp: Number(document.getElementById("cotaAmafresp").value) || 0,
        faixaAmafresp: document.getElementById("faixaAmafresp").value,
        desconto10Amafresp: document.getElementById("desconto10Amafresp").checked,
        dependentesAmafresp,
        iamspe,
        agregadosIamspeIdadeInferior: iamspeLigado ? Number(document.getElementById("agregadosIamspeIdadeInferior").value) : 0,
        agregadosIamspeIdadeSuperior: iamspeLigado ? Number(document.getElementById("agregadosIamspeIdadeSuperior").value) : 0,
        dependentesIamspeIdadeInferior: iamspeLigado ? Number(document.getElementById("dependentesIamspeIdadeInferior").value) : 0,
        dependentesIamspeIdadeSuperior: iamspeLigado ? Number(document.getElementById("dependentesIamspeIdadeSuperior").value) : 0,
        tempoServico: Number(document.getElementById("tempoServico").value),
        dependentesIRRF: dependentesIRRFElem ? Number(dependentesIRRFElem.value) : 0
    };
}

function montarFolha(entrada) {
    const limiteQuota = limiteDaQuota(entrada.tetoDaCota);
    const valorCota = Math.min(limiteQuota, QUOTA_CALCULADA_PUBLICADA);
    const funcaoObj = FUNCOES.find(f => f.id === entrada.funcaoId);

    const vb = VB_COTAS[entrada.cargo - 1] * valorCota;
    const pl = funcaoObj.pl * valorCota;
    const pp = funcaoObj.pp * valorCota;
    const pr = entrada.participacao * funcaoObj.pr[entrada.cargo - 1] * entrada.icm * valorCota;
    const aliquotaQq = Math.floor(entrada.tempoServico / 5) * 0.05;
    const qq = (vb + pl + pp) * aliquotaQq;
    const aliquota6p = Math.floor(entrada.tempoServico / 20) * 1 / 6;
    const sextaParte = (vb + pl + pp + qq) * aliquota6p;
    const valorBruto = vb + pp + pl + sextaParte + qq + pr;
    const deducaoTeto = valorBruto > entrada.teto ? (valorBruto - entrada.teto) : 0;
    const baseParaPrevidencia = valorBruto - deducaoTeto;
    const faixas = entrada.regimePrevidenciario === "RPPS" ? FAIXAS_RPPS : FAIXAS_RGPS;
    const valorPrevidenciaSocial = calcularFaixasProgressivas(baseParaPrevidencia, faixas);
    const previdenciaComplementarValor = Math.max(0, baseParaPrevidencia - TETO_INSS) * entrada.previdenciaComplementar;

    const valorAdicional = 6000 * 0.285 * valorCota;
    let auxilioTransporte = 0;
    let adicionalNaBaseIRRF = 0;
    if (entrada.transporte === "nos") {
        auxilioTransporte = VALOR_NOS_CONFORMES;
    } else if (entrada.transporte === "adicional" && funcaoObj.id === 39) {
        auxilioTransporte = valorAdicional;
        adicionalNaBaseIRRF = valorAdicional;
    }

    const baseIRRF = baseParaPrevidencia + adicionalNaBaseIRRF - valorPrevidenciaSocial - previdenciaComplementarValor - (entrada.dependentesIRRF * 189.59);
    const irrf = calcularIRRF(baseIRRF);
    let decimosSaude = 0;
    let descontoSaude = 0;
    if (entrada.auxilioSaude === "amafresp") {
        decimosSaude = decimosAmafresp(entrada.faixaAmafresp, entrada.desconto10Amafresp);
        for (const dependente of entrada.dependentesAmafresp) {
            decimosSaude += dependente.quantidade * decimosAmafresp(dependente.faixaId, dependente.comDesconto10);
        }
        descontoSaude = valorPorDecimos(decimosSaude, entrada.cotaAmafresp);
    } else if (entrada.auxilioSaude === "iamspe") {
        const aliquotaIamspe = entrada.iamspe
            + entrada.agregadosIamspeIdadeInferior * 0.02
            + entrada.agregadosIamspeIdadeSuperior * 0.03
            + entrada.dependentesIamspeIdadeInferior * 0.005
            + entrada.dependentesIamspeIdadeSuperior * 0.01;
        descontoSaude = aliquotaIamspe * baseParaPrevidencia;
    }
    const remuneracaoLiquida = baseParaPrevidencia - valorPrevidenciaSocial - previdenciaComplementarValor - irrf - descontoSaude;
    const vr = entrada.diasAlimentacao * VALOR_REFEICAO;

    return {
        funcaoObj,
        valorCota,
        limiteQuota,
        vb,
        pl,
        pp,
        pr,
        aliquotaQq,
        qq,
        aliquota6p,
        sextaParte,
        valorBruto,
        deducaoTeto,
        valorPrevidenciaSocial,
        previdenciaComplementarValor,
        auxilioTransporte,
        irrf,
        decimosSaude,
        descontoSaude,
        remuneracaoLiquida,
        vr,
        vencimentos: remuneracaoLiquida + vr + auxilioTransporte
    };
}

function valorZerado(valor) {
    return Math.abs(valor) < 0.005;
}

function mostrarLinha(id, visivel) {
    const linha = document.getElementById(id);
    if (linha) linha.classList.toggle("d-none", !visivel);
}

function calcSallary() {
    const entrada = lerEntrada();
    const atual = montarFolha(entrada);
    const normal = montarFolha({ ...entrada, teto: TETO_SP, tetoDaCota: TETO_SP });
    const nomeFuncao = document.getElementById("funcao").selectedOptions[0].text;
    const folhaNormal = Math.abs(entrada.teto - TETO_SP) < 0.005 && Math.abs(entrada.tetoDaCota - TETO_SP) < 0.005;
    const delta = atual.vencimentos - normal.vencimentos;
    const textoComparacao = folhaNormal || valorZerado(delta)
        ? ""
        : `${numberToReal(Math.abs(delta))} ${delta > 0 ? "a mais" : "a menos"} que a folha atual`;

    document.getElementById("vbCotas").innerText = VB_COTAS[entrada.cargo - 1];
    document.getElementById("vb").innerText = numberToReal(atual.vb);
    document.getElementById("ppCotas").innerText = atual.funcaoObj.pp;
    document.getElementById("pp").innerText = numberToReal(atual.pp);
    document.getElementById("nomeFuncaoPp").textContent = nomeFuncao;
    document.getElementById("plCotas").innerText = atual.funcaoObj.pl;
    document.getElementById("pl").innerText = numberToReal(atual.pl);
    document.getElementById("nomeFuncaoPl").textContent = nomeFuncao;
    mostrarLinha("linhaPl", !valorZerado(atual.pl));

    document.getElementById("aliquotaQq").innerText = (atual.aliquotaQq * 100).toFixed(2) + "%";
    document.getElementById("qq").innerText = numberToReal(atual.qq);
    mostrarLinha("linhaQq", !valorZerado(atual.qq));

    document.getElementById("aliquota6p").innerText = (atual.aliquota6p * 100).toFixed(2) + "%";
    document.getElementById("6p").innerText = numberToReal(atual.sextaParte);
    mostrarLinha("linha6p", !valorZerado(atual.sextaParte));

    document.getElementById("prCotas").innerText = atual.funcaoObj.pr[entrada.cargo - 1];
    document.getElementById("pr").innerText = numberToReal(atual.pr);
    document.getElementById("remuneracaoBruta").innerText = numberToReal(atual.valorBruto);

    document.getElementById("valorTeto").innerText = numberToReal(entrada.teto);
    document.getElementById("deducaoTeto").innerText = numberToReal(atual.deducaoTeto);
    mostrarLinha("linhaDeducaoTeto", !valorZerado(atual.deducaoTeto));

    const quotaPagamento = document.getElementById("quotaPagamento");
    const detalheQuota = document.getElementById("detalheQuota");
    if (quotaPagamento) quotaPagamento.innerText = numberToQuota(atual.valorCota);
    if (detalheQuota) detalheQuota.textContent = numberToQuota(QUOTA_CALCULADA_PUBLICADA);
    const textoLimite = atual.limiteQuota <= QUOTA_CALCULADA_PUBLICADA + 0.00005
        ? "Limitada pelo teto."
        : "Limitada pelo índice de variação nominal da arrecadação.";
    const ajudaCota = document.getElementById("ajudaCota");
    const balaoCota = document.getElementById("balaoCota");
    const notaCota = document.getElementById("notaCota");
    if (ajudaCota) ajudaCota.setAttribute("aria-label", textoLimite);
    if (balaoCota) balaoCota.textContent = textoLimite;
    if (notaCota) notaCota.title = textoLimite;

    document.getElementById("spprev").innerText = numberToReal(atual.previdenciaComplementarValor);
    document.getElementById("descontoIamspe").innerText = numberToReal(atual.descontoSaude);
    mostrarLinha("linhaSaude", !valorZerado(atual.descontoSaude));
    const labelSaude = document.getElementById("labelSaude");
    const cotasSaude = document.getElementById("cotasSaude");
    if (labelSaude) {
        const nome = entrada.auxilioSaude === "iamspe" ? "IAMSPE" : "AMAFRESP";
        labelSaude.innerHTML = `(−) ${nome}<sup><a href="#nota5">5</a></sup>`;
    }
    if (cotasSaude) {
        cotasSaude.textContent = entrada.auxilioSaude === "amafresp" && atual.decimosSaude
            ? `(${textoCotas(atual.decimosSaude)} cotas)`
            : "";
    }
    document.getElementById("irrf").innerText = numberToReal(atual.irrf);
    document.getElementById("remuneracaoLiquida").innerHTML = numberToReal(atual.remuneracaoLiquida);
    document.getElementById("vr").innerHTML = numberToReal(atual.vr);
    document.getElementById("nc").innerHTML = numberToReal(atual.auxilioTransporte);
    mostrarLinha("linhaTransporte", !valorZerado(atual.auxilioTransporte));

    const labelAtin = document.getElementById("labelAtin");
    if (labelAtin) {
        if (entrada.transporte === "nos") {
            labelAtin.innerHTML = `<span>(+) Nos Conformes</span> <span class="item-cotas">(300 UFESPs<sup><a href="#nota7">7</a></sup>)</span>`;
        } else {
            labelAtin.innerHTML = `<span>(+) Adicional de Transporte</span> <span class="item-cotas">(1710 cotas<sup><a href="#nota6">6</a></sup>)</span>`;
        }
    }
    document.getElementById("vencimentos").innerHTML = numberToReal(atual.vencimentos);

    const diferenca = document.getElementById("diferencaFolhaNormal");
    if (diferenca) {
        diferenca.textContent = textoComparacao;
        diferenca.classList.toggle("d-none", textoComparacao === "");
    }
    preencherComparacao(entrada, normal);

    const liquidoFixo = document.getElementById("liquidoFixo");
    const liquidoFixoValor = document.getElementById("liquidoFixoValor");
    const liquidoFixoComparacao = document.getElementById("liquidoFixoComparacao");
    if (liquidoFixo && liquidoFixoValor && liquidoFixoComparacao) {
        liquidoFixoValor.textContent = numberToReal(atual.vencimentos);
        liquidoFixoComparacao.textContent = textoComparacao;
        liquidoFixo.hidden = false;
        liquidoFixo.classList.add("visivel");
        document.body.classList.add("com-liquido-fixo");
    }

    const labelPrevidencia = document.getElementById("labelPrevidencia");
    if (labelPrevidencia) {
        if (entrada.regimePrevidenciario === "RPPS") {
            labelPrevidencia.innerHTML = `(−) Regime Previdenciário <span class="badge bg-primary ms-1 fw-normal">RPPS pré-reforma</span><sup><a href="#nota4">4</a></sup>`;
        } else {
            labelPrevidencia.innerHTML = `(−) Regime Previdenciário <span class="badge bg-success ms-1 fw-normal">RPPS pós-reforma</span><sup><a href="#nota4">4</a></sup>`;
        }
    }

    document.getElementById("rpps").innerText = numberToReal(atual.valorPrevidenciaSocial);
}

function numberToRealArredondado(numero) {
    return Math.round(numero).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    });
}

function textoDiferenca(valor, base) {
    const delta = Math.round(valor) - Math.round(base);
    if (delta === 0) return { texto: "—", sinal: 0 };
    return {
        texto: `${delta > 0 ? "+" : "−"} ${numberToRealArredondado(Math.abs(delta))}`,
        sinal: delta > 0 ? 1 : -1
    };
}

let tetoEmComparacao = null;

function atualizarTetoEmComparacao() {
    const tipo = document.getElementById("tipoTeto").value;
    if (tipo === "stf") {
        tetoEmComparacao = { tipo: "stf", valor: TETO_STF };
    } else if (tipo === "informado") {
        let valor = Number(document.getElementById("tetoInformado").value);
        if (!Number.isFinite(valor) || valor < 0) valor = 0;
        tetoEmComparacao = { tipo: "informado", valor };
    }
    return tetoEmComparacao;
}

function preencherComparacao(entrada, normal) {
    const painel = document.getElementById("comparacaoTeto");
    if (!painel) return;
    const comparacao = atualizarTetoEmComparacao();
    const folhaAtual = Math.abs(entrada.teto - TETO_SP) < 0.005;
    if (!comparacao || Math.abs(comparacao.valor - TETO_SP) < 0.005) {
        painel.classList.add("d-none");
        return;
    }

    const cotaGovernador = montarFolha({ ...entrada, teto: comparacao.valor, tetoDaCota: TETO_SP });
    const cotaTeto = montarFolha({ ...entrada, teto: comparacao.valor, tetoDaCota: comparacao.valor });
    const nomeGovernador = document.getElementById("cmp-cota-governador-nome");
    const nomeCotaTeto = document.getElementById("cmp-cota-teto-nome");
    if (nomeGovernador && nomeCotaTeto) {
        if (comparacao.tipo === "stf") {
            nomeGovernador.textContent = "Teto STF e Cota governador";
            nomeCotaTeto.textContent = "Teto e cota STF";
        } else {
            nomeGovernador.textContent = "Teto informado e cota do Governador";
            nomeCotaTeto.textContent = "Teto e cota informados";
        }
    }
    const linhas = [
        ["folha", normal, TETO_SP],
        ["cota-governador", cotaGovernador, comparacao.valor],
        ["cota-teto", cotaTeto, comparacao.valor]
    ];
    const ativa = folhaAtual
        ? "folha"
        : (Math.abs(entrada.tetoDaCota - TETO_SP) < 0.005 ? "cota-governador" : "cota-teto");
    for (const [id, folha, teto] of linhas) {
        document.getElementById(`cmp-${id}-cota`).textContent = numberToQuota(folha.valorCota);
        document.getElementById(`cmp-${id}-teto`).textContent = numberToRealArredondado(teto);
        document.getElementById(`cmp-${id}-abate`).textContent = numberToRealArredondado(folha.deducaoTeto);
        document.getElementById(`cmp-${id}-venc`).textContent = numberToRealArredondado(folha.vencimentos);
        const diferenca = textoDiferenca(folha.vencimentos, normal.vencimentos);
        const celula = document.getElementById(`cmp-${id}-diff`);
        celula.textContent = diferenca.texto;
        celula.classList.toggle("text-success", diferenca.sinal > 0);
        celula.classList.toggle("text-danger", diferenca.sinal < 0);
        celula.classList.toggle("fw-bold", diferenca.sinal !== 0);
        document.querySelector(`#comparacaoTeto [data-cenario="${id}"]`).classList.toggle("ativa", id === ativa);
    }
    painel.classList.remove("d-none");
}

function atualizarAjudaTransporte() {
    const ajuda = document.getElementById("ajudaTransporte");
    const transporte = document.getElementById("transporte");
    const funcao = document.getElementById("funcao");
    if (!ajuda || !transporte || !funcao) return;
    const fiscalizacaoDireta = funcao.value === "39";
    if (transporte.value === "nos") {
        ajuda.textContent = "Indenizatório. Não entra no imposto de renda.";
    } else if (transporte.value === "adicional" && fiscalizacaoDireta) {
        ajuda.textContent = "Entra na base do imposto de renda. São 1.710 cotas na fiscalização direta.";
    } else if (transporte.value === "adicional") {
        ajuda.textContent = "O adicional de transporte é pago na fiscalização direta. Nesta função o valor fica zerado.";
    } else {
        ajuda.textContent = "Sem Nos Conformes e sem adicional de transporte.";
    }
}

function campoDependenteAmafresp(faixa, comDesconto) {
    const decimos = decimosAmafresp(faixa.id, comDesconto);
    const grupo = document.createElement("div");
    grupo.className = "form-group mb-2";
    const id = `amafresp-${faixa.id}${comDesconto ? "-10" : ""}`;
    const rotulo = document.createElement("label");
    rotulo.className = "form-label mb-1";
    rotulo.htmlFor = id;
    rotulo.textContent = `${comDesconto ? faixa.rotulo + " com 10 anos" : faixa.rotulo} (${textoCotas(decimos)} cotas)`;
    const campo = document.createElement("input");
    campo.type = "number";
    campo.className = "form-control amafresp-dependente";
    campo.id = id;
    campo.min = "0";
    campo.max = "20";
    campo.value = "0";
    campo.dataset.faixa = faixa.id;
    campo.dataset.desconto = comDesconto ? "1" : "0";
    grupo.append(rotulo, campo);
    return grupo;
}

function montarCamposAmafresp() {
    const select = document.getElementById("faixaAmafresp");
    const lista = document.getElementById("listaAmafrespDependentes");
    if (!select || !lista || select.options.length) return;
    for (const faixa of FAIXAS_AMAFRESP) {
        const opcao = document.createElement("option");
        opcao.value = faixa.id;
        opcao.textContent = `${faixa.rotulo} (${textoCotas(faixa.decimos)} cotas)`;
        opcao.selected = faixa.id === "29-33";
        select.appendChild(opcao);
        lista.appendChild(campoDependenteAmafresp(faixa, false));
        if (faixa.descontoDecimos) lista.appendChild(campoDependenteAmafresp(faixa, true));
    }
}

function atualizarAuxilioSaude() {
    const plano = document.getElementById("auxilioSaude");
    const amafresp = document.getElementById("grupoAmafresp");
    const iamspe = document.getElementById("grupoIamspe");
    if (!plano || !amafresp || !iamspe) return;
    amafresp.classList.toggle("d-none", plano.value !== "amafresp");
    iamspe.classList.toggle("d-none", plano.value !== "iamspe");
    const faixa = faixaAmafresp(document.getElementById("faixaAmafresp").value);
    const desconto = document.getElementById("grupoDescontoAmafresp");
    const mostraDesconto = plano.value === "amafresp" && Boolean(faixa && faixa.descontoDecimos);
    if (desconto) desconto.classList.toggle("d-none", !mostraDesconto);
    if (!mostraDesconto) {
        const caixa = document.getElementById("desconto10Amafresp");
        if (caixa) caixa.checked = false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const tipoTeto = document.getElementById("tipoTeto");
    const grupoTetoInformado = document.getElementById("grupoTetoInformado");
    if (tipoTeto && grupoTetoInformado) {
        const atualizarTetoInformado = () => {
            grupoTetoInformado.classList.toggle("d-none", tipoTeto.value !== "informado");
        };
        tipoTeto.addEventListener("change", atualizarTetoInformado);
        atualizarTetoInformado();
    }

    const transporte = document.getElementById("transporte");
    const funcao = document.getElementById("funcao");
    const auxilioSaude = document.getElementById("auxilioSaude");
    const faixaAmafrespSelect = document.getElementById("faixaAmafresp");
    montarCamposAmafresp();
    if (transporte) transporte.addEventListener("change", atualizarAjudaTransporte);
    if (funcao) funcao.addEventListener("change", atualizarAjudaTransporte);
    if (auxilioSaude) auxilioSaude.addEventListener("change", atualizarAuxilioSaude);
    if (faixaAmafrespSelect) faixaAmafrespSelect.addEventListener("change", atualizarAuxilioSaude);
    atualizarAjudaTransporte();
    atualizarAuxilioSaude();

    const comparacaoTeto = document.getElementById("comparacaoTeto");
    if (comparacaoTeto) {
        comparacaoTeto.addEventListener("click", (evento) => {
            const linha = evento.target.closest("[data-cenario]");
            if (!linha) return;
            if (linha.dataset.cenario === "folha") {
                document.getElementById("tipoTeto").value = "sp";
                document.getElementById("cotaAcompanhaTeto").value = "0";
                document.getElementById("tipoTeto").dispatchEvent(new Event("change"));
            } else if (tetoEmComparacao) {
                document.getElementById("tipoTeto").value = tetoEmComparacao.tipo;
                if (tetoEmComparacao.tipo === "informado") {
                    document.getElementById("tetoInformado").value = String(tetoEmComparacao.valor);
                }
                document.getElementById("cotaAcompanhaTeto").value = linha.dataset.cenario === "cota-teto" ? "1" : "0";
                document.getElementById("tipoTeto").dispatchEvent(new Event("change"));
            }
            calcSallary();
        });
    }

    const header = document.querySelector("header");
    if (!header || header.querySelector("nav")) return;
    const nav = document.createElement("nav");
    nav.className = "text-center mt-2";
    nav.innerHTML = `
        <span class="text-warning">Remuneração</span>
        <span class="text-white-50 mx-3">|</span>
        <a class="text-white text-decoration-none" href="./retroativos.html">Retroativos (abate teto)</a>`;
    header.appendChild(nav);
});