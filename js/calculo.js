// Valores atualizados até 04/2026.
const VALOR_UFESP = 38.42;
const VALOR_REFEICAO = 55;
const TETO_SP = 36301.53;
const TETO_STF = 46366.19;
// Subsídio de desembargador: 90,25% do STF. Cartilha CNJ, ago/2026: R$ 41.845,49.
const TETO_DESEMBARGADOR = 41845.49;
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
    { id: 6, pl: 2380, pp: 3595, pr: [4150, 4280, 4410, 4540, 4670, 4800] }, // Assessor Fiscal Setorial VI
    { id: 7, pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] }, // Diretor Geral Adjunto
    { id: 8, pl: 2280, pp: 3585, pr: [4026, 4152, 4278, 4404, 4530, 4656] }, // Assessor Fiscal Setorial V
    { id: 9, pl: 2280, pp: 3585, pr: [0, 3959, 4079, 4200, 4320, 4440] }, // Corregedor Adjunto
    { id: 10, pl: 2160, pp: 3570, pr: [0, 4066, 4190, 4313, 4437, 4560] }, // Diretor
    { id: 11, pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Assessor Fiscal Setorial IV
    { id: 12, pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Presidente do TIT
    { id: 13, pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assistente Fiscal Técnico Chefe
    { id: 14, pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assistente Fiscal de Gab. do Secretário
    { id: 15, pl: 2160, pp: 3570, pr: [0, 3638, 3749, 3859, 3970, 4080] }, // Corregedor Fiscal
    { id: 16, pl: 2070, pp: 3480, pr: [0, 3959, 4079, 4200, 4320, 4440] }, // Diretor Adjunto
    { id: 17, pl: 2070, pp: 3480, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Assessor Fiscal Setorial III
    { id: 18, pl: 2070, pp: 3480, pr: [3839, 3959, 4079, 4200, 4320, 4440] }, // Vice-Presidente do TIT
    { id: 19, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Tributário
    { id: 20, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Tributário de Julgamento
    { id: 21, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Representante Fiscal Chefe
    { id: 22, pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Técnico
    { id: 23, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Chefe
    { id: 24, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Consultor Tributário Chefe
    { id: 25, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Supervisor Fiscal
    { id: 26, pl: 1980, pp: 3450, pr: [3735, 3852, 3969, 4086, 4203, 4320] }, // Assessor Fiscal Setorial II
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
    { id: 38, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }, // Julgador Fiscal
    { id: 39, pl: 0, pp: 2700, pr: [3279, 3381, 3484, 3587, 3689, 3792]}, // Fiscalização Direta de Tributos (Externo)
    
    // Novas Funções (Complementares das Tabelas de PR)
    { id: 40, pl: 2400, pp: 3600, pr: [0, 4280, 4410, 4540, 4670, 4800] }, // Subsecretário da Receita Estadual
    { id: 41, pl: 2160, pp: 3570, pr: [4150, 4237, 4366, 4495, 4623, 4752] }, // Assistente Fiscal de Gabinete do Secretário
    { id: 42, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Subsecretário Adjunto da Receita Estadual
    { id: 43, pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] }, // Coordenador da Administração Tributária
    { id: 44, pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] }, // Coordenador Adjunto da Administração Tributária
    { id: 45, pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] }, // Assistente Fiscal Técnico (Assessor Fiscal Especial III)
    { id: 46, pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] }, // Delegado Tributário
    { id: 47, pl: 1980, pp: 3450, pr: [3735, 3852, 3969, 4086, 4203, 4320] }, // Assessor Fiscal III
    { id: 48, pl: 1980, pp: 3450, pr: [3631, 3745, 3859, 3973, 4086, 4200] }, // Consultor Tributário Chefe - Cotepe
    { id: 49, pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Técnico
    { id: 50, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assistente Fiscal Chefe
    { id: 51, pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] }, // Assessor Fiscal II
    { id: 52, pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] }, // Assistente Fiscal Especialista
    { id: 53, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Assistente Fiscal
    { id: 54, pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] }, // Assistente Fiscal
    { id: 55, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }, // Assistente Fiscal
    { id: 56, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }, // Assistente Fiscal
    { id: 57, pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }  // Assistente Fiscal
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
    if (tipoTeto === "hibrido") {
        return { teto: TETO_STF, tetoDaCota: TETO_DESEMBARGADOR };
    }
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
        dependentesIRRF: dependentesIRRFElem ? Number(dependentesIRRFElem.value) : 0,
        situacao: document.getElementById("situacao")?.value === "aposentado" ? "aposentado" : "ativo",
        incorporacao: Math.max(0, Number(document.getElementById("incorporacao")?.value) || 0)
    };
}

function montarFolha(entrada) {
    const limiteQuota = limiteDaQuota(entrada.tetoDaCota);
    const valorCota = Math.min(limiteQuota, QUOTA_CALCULADA_PUBLICADA);
    const funcaoObj = FUNCOES.find(f => f.id === entrada.funcaoId);

    const aposentado = entrada.situacao === "aposentado";
    const referencia = aposentado ? FUNCOES.find(f => f.id === 39) : funcaoObj;
    const vb = VB_COTAS[entrada.cargo - 1] * valorCota;
    const ppCotas = referencia.pp;
    const prCotas = referencia.pr[entrada.cargo - 1];
    const plCalculado = aposentado ? 0 : funcaoObj.pl * valorCota;
    const pp = ppCotas * valorCota;
    const pr = entrada.participacao * prCotas * entrada.icm * valorCota;
    const incorporacaoInformada = Math.max(0, Number(entrada.incorporacao) || 0);
    const incorporacaoPrevalece = aposentado || incorporacaoInformada > plCalculado + 0.005;
    const pl = incorporacaoPrevalece ? 0 : plCalculado;
    const incorporacao = incorporacaoPrevalece ? incorporacaoInformada : 0;
    const aliquotaQq = Math.floor(entrada.tempoServico / 5) * 0.05;
    const qq = (vb + pl + pp + incorporacao) * aliquotaQq;
    const aliquota6p = Math.floor(entrada.tempoServico / 20) * 1 / 6;
    const sextaParte = (vb + pl + pp + incorporacao + qq) * aliquota6p;
    const valorBruto = vb + pp + pl + sextaParte + qq + pr + incorporacao;
    const deducaoTeto = valorBruto > entrada.teto ? (valorBruto - entrada.teto) : 0;
    const baseParaPrevidencia = valorBruto - deducaoTeto;
    const faixas = entrada.regimePrevidenciario === "RPPS" ? FAIXAS_RPPS : FAIXAS_RGPS;
    const excedenteInss = Math.max(0, baseParaPrevidencia - TETO_INSS);
    // Aposentado: 16% só sobre o que ultrapassa o teto do INSS. Ativo segue as faixas.
    const valorPrevidenciaSocial = aposentado
        ? excedenteInss * 0.16
        : calcularFaixasProgressivas(baseParaPrevidencia, faixas);
    const previdenciaComplementarValor = excedenteInss * entrada.previdenciaComplementar;

    const valorAdicional = 6000 * 0.285 * valorCota;
    let auxilioTransporte = 0;
    if (!aposentado && entrada.transporte === "nos") {
        auxilioTransporte = VALOR_NOS_CONFORMES;
    } else if (!aposentado && entrada.transporte === "adicional" && funcaoObj.id === 39) {
        auxilioTransporte = valorAdicional;
    }

    const baseIRRF = baseParaPrevidencia - valorPrevidenciaSocial - previdenciaComplementarValor - (entrada.dependentesIRRF * 189.59);
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
    const vr = aposentado ? 0 : entrada.diasAlimentacao * VALOR_REFEICAO;

    return {
        funcaoObj,
        valorCota,
        limiteQuota,
        vb,
        pl,
        plCalculado,
        pp,
        ppCotas,
        pr,
        prCotas,
        aliquotaQq,
        qq,
        aliquota6p,
        sextaParte,
        incorporacao,
        incorporacaoInformada,
        incorporacaoPrevalece,
        semFuncao: aposentado,
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

const SUBSIDIO_STF_2016 = 33763;
const AUMENTO_MEDIO_DECADA = Math.pow(TETO_STF / SUBSIDIO_STF_2016, 1 / 10) - 1;
const FUTUROS_COTA = [
    {
        nome: "Tudo como está hoje",
        detalhe: "Governador e STF permanecem nos valores de 2026.",
        governador: TETO_SP,
        stf: TETO_STF
    },
    {
        nome: "Os dois sobem",
        detalhe: "Governador vai a R$ 40 mil e o STF a R$ 60 mil.",
        governador: 40000,
        stf: 60000
    },
    {
        nome: "Tenebroso",
        detalhe: "Governador congelado em R$ 36,3 mil e o STF vai a R$ 60 mil.",
        governador: TETO_SP,
        stf: 60000
    },
    {
        nome: "Pesadelo",
        detalhe: "Governador congelado em R$ 36,3 mil e o STF vai a R$ 70 mil.",
        governador: TETO_SP,
        stf: 70000
    }
];

function folhaNoLimite(entrada, teto, tetoDaCota) {
    return montarFolha({ ...entrada, teto, tetoDaCota });
}

function linhaCenario(sinal, nome, detalhe, valor, classe) {
    return `<div class="item-resultado${classe ? ` ${classe}` : ""}">
        <div class="item-esquerda">
            <span>(${sinal}) ${nome}</span>
            <span class="item-cotas">${detalhe}</span>
        </div>
        <span class="item-valor">${numberToReal(valor)}</span>
    </div>`;
}

function gerarRelatorioCenarios() {
    const painel = document.getElementById("relatorioCenarios");
    if (!painel) return;
    const entrada = lerEntrada();
    const hoje = folhaNoLimite(entrada, TETO_SP, TETO_SP);
    const futuros = FUTUROS_COTA.map((futuro, indice) => {
        const atual = folhaNoLimite(entrada, futuro.governador, futuro.governador);
        const hibrido = folhaNoLimite(entrada, futuro.stf, futuro.governador);
        const pleno = folhaNoLimite(entrada, futuro.stf, futuro.stf);
        return { ...futuro, indice: indice + 1, atual, hibrido, pleno, perda: pleno.vencimentos - hibrido.vencimentos };
    });
    const anos = [];
    let tetoProjetado = TETO_STF;
    for (let ano = 2026; ano <= 2036; ano += 1) {
        if (ano > 2026) tetoProjetado *= 1 + AUMENTO_MEDIO_DECADA;
        const hibrido = folhaNoLimite(entrada, tetoProjetado, TETO_SP);
        const pleno = folhaNoLimite(entrada, tetoProjetado, tetoProjetado);
        anos.push({
            ano,
            teto: tetoProjetado,
            cotaStf: pleno.valorCota,
            hibrido: hibrido.vencimentos,
            pleno: pleno.vencimentos,
            perda: pleno.vencimentos - hibrido.vencimentos
        });
    }
    const ultimo = anos[anos.length - 1];
    const percentual = (AUMENTO_MEDIO_DECADA * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const abaixoDoTeto = hoje.deducaoTeto < 0.01;
    painel.classList.remove("d-none");
    painel.innerHTML = `
        <div class="secao fs-5 fw-bold text-primary mb-2 border-start border-primary border-4 ps-2 bg-light">Evolução do vencimento e a perda da cota</div>
        <p class="text-muted">O cálculo usa o cargo, a função e os demais dados que você informou. Em cada futuro, a linha vermelha é o que se deixa de receber por mês se o teto for o do STF e a cota continuar a do governador.${abaixoDoTeto ? " Neste perfil o vencimento ainda não encosta no teto: subir só o teto não muda o salário, e a diferença vem da cota." : ""}</p>
        <div class="cenario-grade">
            ${futuros.map((futuro) => `
                <article class="cenario-card">
                    <header>
                        <span>${futuro.indice}</span>
                        <div>
                            <strong>${futuro.nome}</strong>
                            <small>${futuro.detalhe}</small>
                        </div>
                    </header>
                    ${linhaCenario("+", "Como ficaria no governador", `cota ${numberToQuota(futuro.atual.valorCota)}`, futuro.atual.vencimentos, "")}
                    ${linhaCenario("+", "Híbrido", `teto ${numberToReal(futuro.stf)} · cota do governador`, futuro.hibrido.vencimentos, "")}
                    ${linhaCenario("=", "Cota reconhecida no STF", `cota ${numberToQuota(futuro.pleno.valorCota)}`, futuro.pleno.vencimentos, "fw-bold text-success")}
                    ${linhaCenario("−", "Perda no mês", `${numberToReal(futuro.perda * 12)} no ano`, futuro.perda, "text-danger fw-bold")}
                    <p class="cenario-hoje">${futuro.pleno.vencimentos - hoje.vencimentos >= 0 ? numberToReal(futuro.pleno.vencimentos - hoje.vencimentos) + " a mais" : numberToReal(hoje.vencimentos - futuro.pleno.vencimentos) + " a menos"} que o vencimento de hoje, se a cota for a do STF.</p>
                </article>
            `).join("")}
        </div>
        <div class="secao fs-5 fw-bold text-primary mt-4 mb-2 border-start border-primary border-4 ps-2 bg-light">Cota do governador e o aumento médio dos ministros</div>
        <p class="text-muted">De 2016 a 2026 o subsídio dos ministros do STF passou de R$ 33.763,00 para R$ 46.366,19, uma média de ${percentual}% ao ano. A tabela aplica esse percentual a cada ano e mantém a cota presa ao governador de hoje (R$ 36.301,53).</p>
        <div class="table-responsive">
            <table class="table table-sm align-middle cenario-anos">
                <thead>
                    <tr>
                        <th>Ano</th>
                        <th class="text-end">Teto do STF</th>
                        <th class="text-end">Cota se fosse a do STF</th>
                        <th class="text-end">Vencimento com cota no STF</th>
                        <th class="text-end">Vencimento com cota no governador</th>
                        <th class="text-end">Perda no mês</th>
                    </tr>
                </thead>
                <tbody>
                    ${anos.map((linha) => `
                        <tr>
                            <td>${linha.ano}</td>
                            <td class="text-end">${numberToReal(linha.teto)}</td>
                            <td class="text-end">${numberToQuota(linha.cotaStf)}</td>
                            <td class="text-end text-success">${numberToReal(linha.pleno)}</td>
                            <td class="text-end">${numberToReal(linha.hibrido)}</td>
                            <td class="text-end text-danger fw-bold">${numberToReal(linha.perda)}</td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
        <p class="cenario-fecho">Em 2036, deixar a cota no governador significa receber <strong>${numberToReal(ultimo.perda)}</strong> a menos por mês, ou <strong>${numberToReal(ultimo.perda * 12)}</strong> no ano.</p>
        <button type="button" class="btn btn-outline-secondary btn-sm no-print" onclick="imprimirRelatorioCenarios()">Imprimir este relatório</button>
    `;
}

function mostrarPerdaDaCota() {
    mostrarQuadroPerdaCota();
    gerarRelatorioCenarios();
    const painel = document.getElementById("relatorioCenarios");
    if (painel) painel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function atualizarPerdaDaCotaSeVisivel() {
    const cenarios = document.getElementById("relatorioCenarios");
    const quadro = document.getElementById("quadroPerdaCota");
    const aberto = (cenarios && !cenarios.classList.contains("d-none"))
        || (quadro && !quadro.classList.contains("d-none"));
    if (!aberto) return;
    const ano = Number(document.getElementById("quadroPerdaRange")?.value) || 0;
    const tabelaAberta = Boolean(quadro?.querySelector("details")?.open);
    mostrarQuadroPerdaCota();
    gerarRelatorioCenarios();
    const controle = document.getElementById("quadroPerdaRange");
    if (controle && ano > 0) {
        controle.value = String(ano);
        controle.dispatchEvent(new Event("input"));
    }
    const detalhe = quadro?.querySelector("details");
    if (detalhe && tabelaAberta) detalhe.open = true;
}

function imprimirRelatorioCenarios() {
    document.body.classList.add("imprimindo-relatorio");
    window.print();
    document.body.classList.remove("imprimindo-relatorio");
}

function projetarCenariosDaPessoa(entrada) {
    const atual = [];
    const stf = [];
    let tetoProjetado = TETO_STF;
    for (let ano = 2026; ano <= 2036; ano += 1) {
        if (ano > 2026) tetoProjetado *= 1 + AUMENTO_MEDIO_DECADA;
        const folhaAtual = folhaNoLimite(entrada, tetoProjetado, TETO_SP);
        const folhaStf = folhaNoLimite(entrada, tetoProjetado, tetoProjetado);
        atual.push({
            ano,
            valor: folhaAtual.vencimentos,
            cota: folhaAtual.valorCota
        });
        stf.push({
            ano,
            valor: folhaStf.vencimentos,
            cota: folhaStf.valorCota,
            brutoExtra: folhaStf.valorBruto - folhaAtual.valorBruto,
            vencExtra: folhaStf.vencimentos - folhaAtual.vencimentos
        });
    }
    return { atual, stf };
}

function pisoDoEixo(minimo, topo) {
    if (minimo <= 0 || topo <= minimo) return 0;
    const folga = (topo - minimo) * 0.12;
    const potencia = Math.pow(10, Math.max(0, Math.floor(Math.log10(topo)) - 1));
    const piso = Math.floor(Math.max(0, minimo - folga) / potencia) * potencia;
    return piso >= topo ? 0 : piso;
}

function topoDoEixo(maximo) {
    if (maximo <= 0) return 1000;
    const potencia = Math.pow(10, Math.floor(Math.log10(maximo)));
    return [potencia, potencia * 2, potencia * 5, potencia * 10].find((valor) => valor >= maximo);
}

function rotuloEixo(valor) {
    if (!Number.isFinite(valor)) return "";
    if (Math.abs(valor) < 0.5) return "0";
    if (valor % 1000 === 0) return `${(valor / 1000).toLocaleString("pt-BR")} mil`;
    return numberToRealArredondado(valor).replace("R$", "").trim();
}

function desenharPerdaCota(series, topo, piso, largura, altura) {
    const margem = { esquerda: 68, direita: 20, topo: 16, base: 28 };
    const anos = series[0].pontos.map((ponto) => ponto.ano);
    const plotW = Math.max(1, largura - margem.esquerda - margem.direita);
    const plotH = Math.max(1, altura - margem.topo - margem.base);
    const x = (indice) => margem.esquerda + (indice / (anos.length - 1)) * plotW;
    const y = (valor) => margem.topo + (1 - (valor - piso) / (topo - piso)) * plotH;
    const base = y(piso);
    const linha = (pontos) => pontos.map((ponto, indice) => `${indice === 0 ? "M" : "L"}${x(indice).toFixed(1)},${y(ponto.valor).toFixed(1)}`).join(" ");
    const faixaEntre = series.length > 1
        ? `<path d="${linha(series[0].pontos)} ${[...series[1].pontos].reverse().map((ponto, indice) => `L${x(series[1].pontos.length - 1 - indice).toFixed(1)},${y(ponto.valor).toFixed(1)}`).join(" ")} Z" fill="#198754" fill-opacity="0.12"></path>`
        : "";
    const grades = [piso, (piso + topo) / 2, topo].map((valor) => `
        <line x1="${margem.esquerda}" y1="${y(valor).toFixed(1)}" x2="${largura - margem.direita}" y2="${y(valor).toFixed(1)}" stroke="#e2e8f0" stroke-width="1"></line>
        <text x="${margem.esquerda - 10}" y="${y(valor).toFixed(1)}" text-anchor="end" dominant-baseline="middle">${rotuloEixo(valor)}</text>
    `).join("");
    const desenhos = series.map((serie) => {
        const traco = linha(serie.pontos);
        const pontos = serie.pontos.map((ponto, indice) => `<circle class="quadro-perda-marco" data-indice="${indice}" cx="${x(indice).toFixed(1)}" cy="${y(ponto.valor).toFixed(1)}" r="4" fill="${serie.cor}"></circle>`).join("");
        return `<path d="${traco}" fill="none" stroke="${serie.cor}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"></path>${pontos}`;
    }).join("");
    const passo = plotW / (anos.length - 1);
    const pular = passo < 56 ? 2 : 1;
    const eixoX = anos.map((ano, indice) => {
        if (indice % pular !== 0 && indice !== anos.length - 1) return "";
        return `<text x="${x(indice).toFixed(1)}" y="${altura - 8}" text-anchor="middle">${ano}</text>`;
    }).join("");
    const colunas = anos.map((_, indice) => {
        const anterior = indice === 0 ? x(0) : (x(indice - 1) + x(indice)) / 2;
        const proximo = indice === anos.length - 1 ? x(indice) : (x(indice) + x(indice + 1)) / 2;
        return `<rect class="quadro-perda-coluna" data-indice="${indice}" x="${anterior.toFixed(1)}" y="${margem.topo}" width="${Math.max(0, proximo - anterior).toFixed(1)}" height="${plotH.toFixed(1)}" fill="transparent"></rect>`;
    }).join("");
    return `<svg class="quadro-perda-svg" viewBox="0 0 ${largura} ${altura}" role="group" tabindex="0" aria-label="Vencimento mensal de 2026 a 2036 no cenário atual e com teto e cota do STF. Use as setas para mudar o ano.">
        ${grades}
        ${faixaEntre}
        ${desenhos}
        <line id="quadroPerdaGuia" y1="${margem.topo}" y2="${base.toFixed(1)}" stroke="#64748b" stroke-opacity="0.7" stroke-dasharray="3 4"></line>
        ${eixoX}
        ${colunas}
    </svg>`;
}

let observadorQuadroPerda = null;

function ligarQuadroPerda(painel, series, topo, piso) {
    const grafico = painel.querySelector(".quadro-perda-grafico");
    const ano = painel.querySelector("#quadroPerdaAno");
    const valores = [
        painel.querySelector("#quadroPerdaValor0"),
        painel.querySelector("#quadroPerdaValor1")
    ];
    const controle = painel.querySelector("#quadroPerdaRange");
    const leitura = painel.querySelector("#quadroPerdaLeitura");
    if (!grafico || !controle) return;
    if (observadorQuadroPerda) observadorQuadroPerda.disconnect();

    const svgAtual = () => grafico.querySelector(".quadro-perda-svg");
    let ultimaLargura = 0;

    const marcar = (indice) => {
        const svg = svgAtual();
        if (!svg) return;
        const guia = svg.querySelector("#quadroPerdaGuia");
        const marco = svg.querySelector(`.quadro-perda-marco[data-indice="${indice}"]`);
        if (marco && guia) {
            guia.setAttribute("x1", marco.getAttribute("cx"));
            guia.setAttribute("x2", marco.getAttribute("cx"));
        }
        svg.querySelectorAll(".quadro-perda-marco").forEach((circulo) => {
            const ativo = circulo.dataset.indice === String(indice);
            circulo.setAttribute("r", ativo ? "6" : "4");
            circulo.setAttribute("stroke", ativo ? "#fff" : "none");
            circulo.setAttribute("stroke-width", ativo ? "2" : "0");
        });
    };

    const escolher = (indice, anunciar) => {
        const limite = series[0].pontos.length - 1;
        const atual = Math.max(0, Math.min(limite, indice));
        controle.value = String(atual);
        const ponto = series[0].pontos[atual];
        ano.textContent = String(ponto.ano);
        controle.setAttribute("aria-valuetext", String(ponto.ano));
        series.forEach((serie, serieIndice) => {
            valores[serieIndice].textContent = numberToReal(serie.pontos[atual].valor);
        });
        marcar(atual);
        if (anunciar && leitura) leitura.textContent = `${ponto.ano}: ${series.map((serie, serieIndice) => `${serie.nome} ${valores[serieIndice].textContent}`).join(", ")}`;
    };

    const desenhar = () => {
        const largura = Math.round(grafico.clientWidth);
        if (largura < 280 || largura === ultimaLargura) return;
        ultimaLargura = largura;
        const altura = largura < 640 ? 200 : 240;
        grafico.innerHTML = desenharPerdaCota(series, topo, piso, largura, altura);
        marcar(Number(controle.value) || 0);
    };

    const indiceDoPonteiro = (evento) => {
        const svg = svgAtual();
        if (!svg) return 0;
        const alvo = evento.target.closest(".quadro-perda-coluna");
        if (alvo) return Number(alvo.dataset.indice);
        const caixa = svg.getBoundingClientRect();
        const viewX = ((evento.clientX - caixa.left) / caixa.width) * svg.viewBox.baseVal.width;
        let melhor = 0;
        let distancia = Infinity;
        svg.querySelectorAll(".quadro-perda-marco").forEach((circulo) => {
            const delta = Math.abs(Number(circulo.getAttribute("cx")) - viewX);
            if (delta < distancia) {
                distancia = delta;
                melhor = Number(circulo.dataset.indice);
            }
        });
        return melhor;
    };

    grafico.addEventListener("pointermove", (evento) => {
        if (evento.pointerType === "touch") return;
        escolher(indiceDoPonteiro(evento), false);
    });
    grafico.addEventListener("pointerdown", (evento) => escolher(indiceDoPonteiro(evento), true));
    grafico.addEventListener("keydown", (evento) => {
        const atual = Number(controle.value);
        if (evento.key === "ArrowRight" || evento.key === "ArrowUp") {
            evento.preventDefault();
            escolher(atual + 1, true);
        } else if (evento.key === "ArrowLeft" || evento.key === "ArrowDown") {
            evento.preventDefault();
            escolher(atual - 1, true);
        } else if (evento.key === "Home") {
            evento.preventDefault();
            escolher(0, true);
        } else if (evento.key === "End") {
            evento.preventDefault();
            escolher(series[0].pontos.length - 1, true);
        }
    });
    controle.addEventListener("input", () => escolher(Number(controle.value), true));
    observadorQuadroPerda = new ResizeObserver(desenhar);
    observadorQuadroPerda.observe(grafico);
    desenhar();
    escolher(0, false);
}

function mostrarQuadroPerdaCota() {
    const painel = document.getElementById("quadroPerdaCota");
    if (!painel) return;
    const entrada = lerEntrada();
    const { atual, stf } = projetarCenariosDaPessoa(entrada);
    const cargoNome = document.getElementById("cargo").selectedOptions[0].text.trim();
    const funcaoNome = document.getElementById("funcao").selectedOptions[0].text.trim();
    const perfil = entrada.situacao === "aposentado" ? `${cargoNome}, aposentado` : `${cargoNome}, ${funcaoNome}`;
    const percentual = (AUMENTO_MEDIO_DECADA * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const maximo = Math.max(...atual.map((ponto) => ponto.valor), ...stf.map((ponto) => ponto.valor), 1);
    const minimo = Math.min(...atual.map((ponto) => ponto.valor), ...stf.map((ponto) => ponto.valor));
    const topo = topoDoEixo(maximo);
    const piso = pisoDoEixo(minimo, topo);
    const series = [
        { nome: "Cenário atual", curto: "Cenário atual", cor: "#1e3a8a", pontos: atual },
        { nome: "Teto e cota STF", curto: "Teto e cota STF", cor: "#198754", pontos: stf }
    ];
    const diferenca = (indice) => stf[indice].valor - atual[indice].valor;
    const semFolga = atual.every((ponto, indice) => Math.abs(diferenca(indice)) < 0.5);
    const linhasTabela = atual.map((ponto, indice) => `
        <tr>
            <th scope="row">${ponto.ano}</th>
            <td>${numberToReal(ponto.valor)}</td>
            <td>${numberToReal(stf[indice].valor)}</td>
            <td>${numberToReal(diferenca(indice))}</td>
        </tr>
    `).join("");
    painel.classList.remove("d-none");
    painel.innerHTML = `
        <div class="quadro-perda">
            <div class="quadro-perda-kpis">
                <article class="quadro-perda-kpi neutro">
                    <div class="quadro-perda-valor">${numberToReal(atual[0].valor)}</div>
                    <div class="quadro-perda-rotulo">Cenário atual em 2026</div>
                </article>
                <article class="quadro-perda-kpi sucesso">
                    <div class="quadro-perda-valor">${numberToReal(stf[0].valor)}</div>
                    <div class="quadro-perda-rotulo">Teto e cota STF em 2026</div>
                </article>
                <article class="quadro-perda-kpi perigo">
                    <div class="quadro-perda-valor">${numberToReal(diferenca(0))}</div>
                    <div class="quadro-perda-rotulo">Diferença em 2026</div>
                </article>
                <article class="quadro-perda-kpi perigo">
                    <div class="quadro-perda-valor">${numberToReal(diferenca(atual.length - 1))}</div>
                    <div class="quadro-perda-rotulo">Diferença em 2036</div>
                </article>
            </div>
            <h2 class="quadro-perda-titulo">Cenário atual e teto com cota do STF</h2>
            <p class="quadro-perda-sub">${perfil}. Teto do STF composto a ${percentual}% ao ano a partir de ${numberToReal(TETO_STF)}. No cenário atual a cota permanece a do governador, ${numberToQuota(atual[0].cota)}. No outro, teto e cota acompanham o STF.</p>
            <div class="quadro-perda-leitura-box">
                <div class="quadro-perda-ano" id="quadroPerdaAno">${atual[0].ano}</div>
                <div class="quadro-perda-leitura-linhas">
                    ${series.map((serie, indice) => `
                        <div>
                            <i class="quadro-perda-ponto" style="background:${serie.cor}"></i>
                            <span>${serie.curto}</span>
                            <strong id="quadroPerdaValor${indice}" class="${indice === 0 ? "neutro" : "sucesso"}">${numberToReal(serie.pontos[0].valor)}</strong>
                        </div>
                    `).join("")}
                </div>
            </div>
            <p id="quadroPerdaLeitura" class="visually-hidden" aria-live="polite"></p>
            <div class="quadro-perda-grafico"></div>
            <label class="quadro-perda-controle">
                <span>Ano</span>
                <input id="quadroPerdaRange" type="range" min="0" max="${atual.length - 1}" value="0" step="1" aria-valuemin="2026" aria-valuemax="2036" aria-valuetext="2026">
            </label>
            ${semFolga ? `<p class="quadro-perda-nota">Neste perfil os dois cenários pagam o mesmo até 2036. O vencimento já chega ao teto, e a cota maior é cortada no mesmo valor.</p>` : ""}
            <details class="quadro-perda-detalhe">
                <summary>Ver os valores ano a ano</summary>
                <div class="table-responsive">
                    <table>
                        <caption class="visually-hidden">Vencimento mensal no cenário atual e com teto e cota do STF</caption>
                        <thead>
                            <tr>
                                <th scope="col">Ano</th>
                                <th scope="col">Cenário atual</th>
                                <th scope="col">Teto e cota STF</th>
                                <th scope="col">Diferença</th>
                            </tr>
                        </thead>
                        <tbody>${linhasTabela}</tbody>
                    </table>
                </div>
            </details>
            <p class="quadro-perda-fonte">Usa o cargo, a função e os demais dados informados. Passe o cursor no gráfico, arraste o ano ou use as setas.</p>
        </div>
    `;
    ligarQuadroPerda(painel, series, topo, piso);
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
    document.getElementById("ppCotas").innerText = atual.ppCotas;
    document.getElementById("pp").innerText = numberToReal(atual.pp);
    document.getElementById("nomeFuncaoPp").textContent = atual.semFuncao ? "Fiscalização direta" : nomeFuncao;
    mostrarLinha("linhaPp", !valorZerado(atual.pp));
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

    const incorporacaoValor = document.getElementById("incorporacaoValor");
    if (incorporacaoValor) incorporacaoValor.innerText = numberToReal(atual.incorporacao);
    mostrarLinha("linhaIncorporacao", !valorZerado(atual.incorporacao));
    const explicacaoPrevalencia = document.getElementById("explicacaoPrevalencia");
    if (explicacaoPrevalencia) {
        const texto = textoPrevalencia(atual);
        explicacaoPrevalencia.textContent = texto;
        explicacaoPrevalencia.classList.toggle("d-none", texto === "");
    }

    document.getElementById("prCotas").innerText = atual.prCotas;
    document.getElementById("pr").innerText = numberToReal(atual.pr);
    mostrarLinha("linhaPr", !valorZerado(atual.pr));
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
    mostrarLinha("linhaRefeicao", !valorZerado(atual.vr));
    mostrarLinha("linhaTransporte", !valorZerado(atual.auxilioTransporte));
    mostrarLinha("tituloIndenizatorias", !valorZerado(atual.vr) || !valorZerado(atual.auxilioTransporte));

    const labelAtin = document.getElementById("labelAtin");
    if (labelAtin) {
        if (entrada.transporte === "nos") {
            labelAtin.innerHTML = `<span>(+) Nos Conformes</span> <span class="item-cotas">(300 UFESPs<sup><a href="#nota7">7</a></sup>)</span>`;
        } else {
            labelAtin.innerHTML = `<span>(+) Adicional de Transporte<sup><a href="#nota9">9</a></sup></span> <span class="item-cotas">(1710 cotas<sup><a href="#nota6">6</a></sup>)</span>`;
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
        if (entrada.situacao === "aposentado") {
            labelPrevidencia.innerHTML = `(−) Regime Previdenciário <span class="badge bg-primary ms-1 fw-normal">16% acima do teto do INSS</span><sup><a href="#nota4">4</a></sup>`;
        } else if (entrada.regimePrevidenciario === "RPPS") {
            labelPrevidencia.innerHTML = `(−) Regime Previdenciário <span class="badge bg-primary ms-1 fw-normal">RPPS pré-reforma</span><sup><a href="#nota4">4</a></sup>`;
        } else {
            labelPrevidencia.innerHTML = `(−) Regime Previdenciário <span class="badge bg-success ms-1 fw-normal">RPPS pós-reforma</span><sup><a href="#nota4">4</a></sup>`;
        }
    }

    document.getElementById("rpps").innerText = numberToReal(atual.valorPrevidenciaSocial);
    atualizarPerdaDaCotaSeVisivel();
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
    if (tipo === "stf" || tipo === "hibrido") {
        tetoEmComparacao = { tipo, valor: TETO_STF };
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
    const cotaDesembargador = montarFolha({ ...entrada, teto: TETO_STF, tetoDaCota: TETO_DESEMBARGADOR });
    const cotaTeto = montarFolha({ ...entrada, teto: comparacao.valor, tetoDaCota: comparacao.valor });
    const nomeGovernador = document.getElementById("cmp-cota-governador-nome");
    const nomeCotaTeto = document.getElementById("cmp-cota-teto-nome");
    const linhaDesembargador = document.querySelector('#comparacaoTeto [data-cenario="cota-desembargador"]');
    const mostraDesembargador = comparacao.tipo === "stf" || comparacao.tipo === "hibrido";
    if (linhaDesembargador) linhaDesembargador.classList.toggle("d-none", !mostraDesembargador);
    if (nomeGovernador && nomeCotaTeto) {
        if (comparacao.tipo === "stf" || comparacao.tipo === "hibrido") {
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
        ["cota-desembargador", cotaDesembargador, TETO_STF],
        ["cota-teto", cotaTeto, comparacao.valor]
    ];
    const ativa = folhaAtual
        ? "folha"
        : (Math.abs(entrada.tetoDaCota - TETO_DESEMBARGADOR) < 0.005
            ? "cota-desembargador"
            : (Math.abs(entrada.tetoDaCota - TETO_SP) < 0.005 ? "cota-governador" : "cota-teto"));
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

function textoPrevalencia(folha) {
    const proLabore = folha.plCalculado;
    const incorporacao = folha.incorporacaoInformada;
    if (folha.semFuncao) {
        if (valorZerado(incorporacao)) {
            return "O aposentado não recebe pro labore. O prêmio de produtividade e a participação nos resultados são os da fiscalização direta. A incorporação informada é R$ 0,00.";
        }
        return `O aposentado não recebe pro labore. A incorporação informada é ${numberToReal(incorporacao)}. O prêmio de produtividade e a participação nos resultados são os da fiscalização direta.`;
    }
    if (valorZerado(proLabore) && valorZerado(incorporacao)) return "";
    if (folha.incorporacaoPrevalece) {
        if (valorZerado(proLabore)) {
            return `Prevaleceu a incorporação (${numberToReal(incorporacao)}) porque esta função não tem pro labore.`;
        }
        return `Prevaleceu a incorporação (${numberToReal(incorporacao)}) porque é maior que o pro labore da função (${numberToReal(proLabore)}).`;
    }
    if (valorZerado(incorporacao)) {
        return `Prevaleceu o pro labore (${numberToReal(proLabore)}) porque a incorporação informada é ${numberToReal(0)}.`;
    }
    if (Math.abs(incorporacao - proLabore) <= 0.005) {
        return `Pro labore e incorporação valem o mesmo (${numberToReal(proLabore)}). Prevaleceu o pro labore.`;
    }
    return `Prevaleceu o pro labore (${numberToReal(proLabore)}) porque é maior que a incorporação informada (${numberToReal(incorporacao)}).`;
}

function selecionarSituacao(situacao) {
    const valor = situacao === "aposentado" ? "aposentado" : "ativo";
    const campo = document.getElementById("situacao");
    if (campo) campo.value = valor;
    document.querySelectorAll(".situacao-btn").forEach((botao) => {
        botao.setAttribute("aria-pressed", botao.dataset.situacao === valor ? "true" : "false");
    });
    const aposentado = valor === "aposentado";
    const regime = document.getElementById("regimePrevidenciario");
    const complementar = document.getElementById("previdenciaComplementar");
    if (regime) regime.value = aposentado ? "RPPS" : "RGPS";
    if (complementar) complementar.value = aposentado ? "0" : "7.5";
    const dias = document.getElementById("diasAlimentacao");
    const transporte = document.getElementById("transporte");
    const funcao = document.getElementById("funcao");
    const aviso = document.getElementById("avisoAposentado");
    if (dias) dias.disabled = aposentado;
    if (transporte) transporte.disabled = aposentado;
    if (funcao) funcao.disabled = aposentado;
    if (aviso) aviso.classList.toggle("d-none", !aposentado);
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
        ajuda.textContent = "Indenizatório. Não entra no imposto de renda. São 1.710 cotas na fiscalização direta.";
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
    const grupoCotaAcompanha = document.getElementById("grupoCotaAcompanha");
    const ajudaHibrido = document.getElementById("ajudaHibrido");
    if (tipoTeto && grupoTetoInformado) {
        const atualizarTetoInformado = () => {
            const hibrido = tipoTeto.value === "hibrido";
            grupoTetoInformado.classList.toggle("d-none", tipoTeto.value !== "informado");
            if (grupoCotaAcompanha) grupoCotaAcompanha.classList.toggle("d-none", hibrido);
            if (ajudaHibrido) ajudaHibrido.classList.toggle("d-none", !hibrido);
        };
        tipoTeto.addEventListener("change", atualizarTetoInformado);
        atualizarTetoInformado();
    }

    document.querySelectorAll(".situacao-btn").forEach((botao) => {
        botao.addEventListener("click", () => {
            selecionarSituacao(botao.dataset.situacao);
            calcSallary();
        });
    });
    const incorporacao = document.getElementById("incorporacao");
    if (incorporacao) incorporacao.addEventListener("input", () => calcSallary());
    selecionarSituacao("ativo");

    const regime = document.getElementById("regimePrevidenciario");
    const complementar = document.getElementById("previdenciaComplementar");
    if (regime && complementar) {
        regime.addEventListener("change", () => {
            complementar.value = regime.value === "RPPS" ? "0" : "7.5";
            calcSallary();
        });
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
            } else if (linha.dataset.cenario === "cota-desembargador") {
                document.getElementById("tipoTeto").value = "hibrido";
                document.getElementById("tipoTeto").dispatchEvent(new Event("change"));
            } else if (tetoEmComparacao) {
                const tipo = tetoEmComparacao.tipo === "hibrido" ? "stf" : tetoEmComparacao.tipo;
                document.getElementById("tipoTeto").value = tipo;
                if (tipo === "informado") {
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
