// Valores atualizados até 04/2026.
const VALOR_UFESP = 38.42;
const VALOR_REFEICAO = 52.68;
const TETO_SP = 36301.53;
const TETO_STF = 46366.19;
const TETO_INSS = 8475.55;
const TETO_RPPS = 1086.87;
const VALOR_NOS_CONFORMES = 300 * VALOR_UFESP; 

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
    { id: 39, pl: 0, pp: 2700, pr: [2150, 2280, 2410, 2540, 2670, 2800] }, // Fiscalização Direta de Tributos (Externo)
    
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

function numberToReal(numero) {
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcSallary() {
    let cargo = Number(document.getElementById("cargo").value);
    let funcaoId = Number(document.getElementById("funcao").value);
    let diasAlimentacao = Number(document.getElementById("diasAlimentacao").value);
    let icm = Number(document.getElementById("icm").value) / 100;
    let participacao = Number(document.getElementById("participacaoResultados").value);
    let previdenciaComplementar = Number(document.getElementById("previdenciaComplementar").value) / 100;
    let atin = Number(document.getElementById("atin").value);
    let tipoTeto = document.getElementById("tipoTeto").value;
    let iamspe = Number(document.getElementById("iamspe").value);
    let agregadosIamspeIdadeInferior = Number(document.getElementById("agregadosIamspeIdadeInferior").value);
    let agregadosIamspeIdadeSuperior = Number(document.getElementById("agregadosIamspeIdadeSuperior").value);
    let dependentesIamspeIdadeInferior = Number(document.getElementById("dependentesIamspeIdadeInferior").value);
    let dependentesIamspeIdadeSuperior = Number(document.getElementById("dependentesIamspeIdadeSuperior").value);
    let tempoServico = Number(document.getElementById("tempoServico").value);
    
    let VALOR_COTA;
    let teto; 
    
    if (tipoTeto === "iludir") {
        VALOR_COTA = TETO_STF / 12000;
        teto = TETO_STF;
    } else if (tipoTeto === "stf") {
        VALOR_COTA = TETO_SP / 12000;
        teto = TETO_STF;
    } else {
        VALOR_COTA = TETO_SP / 12000;
        teto = TETO_SP;
    }
    
    // Busca a função selecionada dentro do array de objetos unificado
    const funcaoObj = FUNCOES.find(f => f.id === funcaoId);

    // Cálculos unificados
    let vb = VB_COTAS[cargo - 1] * VALOR_COTA;
    let pl = funcaoObj.pl * VALOR_COTA;
    let pp = funcaoObj.pp * VALOR_COTA;
    let pr = participacao * funcaoObj.pr[cargo - 1] * icm * VALOR_COTA;
    
    let aliquotaQq = Math.floor(tempoServico / 5) * 0.05; 
    let qq = (vb + pl + pp) * aliquotaQq;
    
    let aliquota6p = Math.floor(tempoServico / 20) * 0.1666;
    let sextaParte = (vb + pl + pp) * aliquota6p;
    
    let valorBruto = vb + pp + pl + sextaParte + qq + pr;
    
    // Deduções
    let deducaoTeto = valorBruto > teto ? (valorBruto - teto) : 0;
    let rpps = TETO_RPPS;
    let previdenciaComplementarValor = (valorBruto - deducaoTeto - TETO_INSS) * previdenciaComplementar;
    
    let irrf = (valorBruto - deducaoTeto - rpps) * 0.275 - 908.73;
    if (irrf < 0) irrf = 0;
    
    let descontoIamspeAgregados = agregadosIamspeIdadeInferior * 0.02 + agregadosIamspeIdadeSuperior * 0.03;
    let descontoIamspeDependentes = dependentesIamspeIdadeInferior * 0.005 + dependentesIamspeIdadeSuperior * 0.01;
    let totalDescontoIamspe = (iamspe + descontoIamspeAgregados + descontoIamspeDependentes) * (valorBruto - deducaoTeto);    
    
    let remuneracaoLiquida = valorBruto - deducaoTeto - rpps - previdenciaComplementarValor - irrf - totalDescontoIamspe;          
    
    let vr = diasAlimentacao * VALOR_REFEICAO;
    let nc = atin * VALOR_NOS_CONFORMES;
    let vencimentos = remuneracaoLiquida + vr + nc;
    
    // Atualização da Tela
    document.getElementById("vbCotas").innerText = VB_COTAS[cargo - 1];
    document.getElementById("vb").innerText = numberToReal(vb);
    
    document.getElementById("ppCotas").innerText = funcaoObj.pp; 
    document.getElementById("pp").innerText = numberToReal(pp);
    
    document.getElementById("plCotas").innerText = funcaoObj.pl; 
    document.getElementById("pl").innerText = numberToReal(pl);
    
    document.getElementById("aliquotaQq").innerText = (aliquotaQq * 100).toFixed(2) + "%";
    document.getElementById("qq").innerText = numberToReal(qq);
    
    document.getElementById("aliquota6p").innerText = (aliquota6p * 100).toFixed(2) + "%";
    document.getElementById("6p").innerText = numberToReal(sextaParte);
    
    document.getElementById("prCotas").innerText = funcaoObj.pr[cargo - 1];
    document.getElementById("pr").innerText = numberToReal(pr);
    document.getElementById("remuneracaoBruta").innerText = numberToReal(valorBruto);
    
    document.getElementById("valorTeto").innerText = numberToReal(teto);
    document.getElementById("deducaoTeto").innerText = numberToReal(deducaoTeto);
    document.getElementById("rpps").innerText = numberToReal(rpps);
    document.getElementById("spprev").innerText = numberToReal(previdenciaComplementarValor);
    document.getElementById("descontoIamspe").innerText = numberToReal(totalDescontoIamspe);
    document.getElementById("irrf").innerText = numberToReal(irrf);
    document.getElementById("remuneracaoLiquida").innerHTML = numberToReal(remuneracaoLiquida);
    
    document.getElementById("vr").innerHTML = numberToReal(vr);
    document.getElementById("nc").innerHTML = numberToReal(nc);
    document.getElementById("vencimentos").innerHTML = numberToReal(vencimentos);
}