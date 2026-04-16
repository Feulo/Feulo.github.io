// Valores atualizados até 04/2026.
// Removi o VALOR_COTA daqui, pois agora ele será calculado dinamicamente na função.
const VALOR_UFESP = 38.42;
const VALOR_REFEICAO = 52.68;
const TETO_SP = 36301.53;
const TETO_STF = 46366.19;
const TETO_INSS = 8475.55;
const TETO_RPPS = 1086.87;
const VALOR_NOS_CONFORMES = 300 * VALOR_UFESP; 

const VB_COTAS = [4300, 4550, 4800, 5200, 5600, 6000];
const PL_COTAS = [2400, 2360, 2280, 2280, 2160, 2160, 2160, 2070, 1980, 1980, 1980, 1920, 1920, 1920, 1800, 1800, 1800, 1800, 1800, 180, 1800, 1800, 1680, 1680, 1680, 1680, 1680, 1680, 1610, 1610, 1540, 1500, 1500, 1500, 1500, 1500, 0];
const PP_COTAS = [3600, 3590, 3585, 3585, 3570, 3570, 3570, 3480, 3450, 3450, 3450, 3400, 3400, 3400, 3375, 3375, 3375, 3375, 3375, 3375, 3375, 3375, 3300, 3300, 3300, 3300, 3300, 3300, 3280, 3280, 3255, 3170, 3170, 3170, 3170, 3170, 0];
const PR_COTAS = [
    [4150,4109,4026,4026,3943,3943,3943,3839,3735,3735,3735,3631,3631,3631,3528,3528,3528,3528,3528,3528,3528,3528,3403,3403,3403,3403,3403,3403,3279,3279,3113,0,0,0,0,0,2150],
    [4280,4237,4152,4152,4066,4066,4066,3959,3852,3852,3852,3745,3745,3745,3638,3638,3638,3638,3638,3638,3638,3638,3510,3510,3510,3510,3510,3510,3381,3381,3210,0,0,0,0,0,2280],
    [4410,4366,4278,4278,4190,4190,4190,4079,3969,3969,3969,3859,3859,3859,3749,3749,3749,3749,3749,3749,3749,3749,3616,3616,3616,3616,3616,3616,3484,3484,3308,0,0,0,0,0,2410],
    [4540,4495,4404,4404,4313,4313,4313,4200,4086,4086,4086,3973,3973,3973,3859,3859,3859,3859,3859,3859,3859,3859,3723,3723,3723,3723,3723,3723,3587,3587,3405,0,0,0,0,0,2540],
    [4670,4623,4530,4530,4437,4437,4437,4320,4203,4203,4203,4086,4086,4086,3970,3970,3970,3970,3970,3970,3970,3970,3829,3829,3829,3829,3829,3829,3689,3689,3503,0,0,0,0,0,2670],
    [4800,4752,4656,4656,4560,4560,4560,4440,4320,4320,4320,4200,4200,4200,4080,4080,4080,4080,4080,4080,4080,4080,3936,3936,3936,3936,3936,3936,3792,3792,3600,0,0,0,0,0,2800]
];

function numberToReal(numero) {
    return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcSallary() {
    // Obtém os parâmetros fornecidos pelo usuário no HTML
    let cargo = Number(document.getElementById("cargo").value);
    let funcao = Number(document.getElementById("funcao").value);
    let diasAlimentacao = Number(document.getElementById("diasAlimentacao").value);
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
    
    // --- APLICAÇÃO DA SUA REGRA DE COTA ---
    // Checa se o usuário quer "iludir" (teto do STF) ou a realidade (teto SP)
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
    
    // VENCIMENTOS MULTIPLICADOS PELA COTA DINÂMICA
    let vb = VB_COTAS[cargo - 1] * VALOR_COTA;
    let pl = PL_COTAS[funcao - 1] * VALOR_COTA;
    let pp = PP_COTAS[funcao - 1] * VALOR_COTA;
    let pr = participacao * PR_COTAS[cargo - 1][funcao - 1] * VALOR_COTA;
    
    // Quinquênio (Juros simples de 5% a cada 5 anos completos)
    let aliquotaQq = Math.floor(tempoServico / 5) * 0.05; 
    let qq = (vb + pl + pp) * aliquotaQq;
    
    // Sexta-parte (20 anos completos)
    let aliquota6p = Math.floor(tempoServico / 20) * 0.1666;
    let sextaParte = (vb + pl + pp) * aliquota6p;
    
    let valorBruto = vb + pp + pl + sextaParte + qq + pr;
    
    // DEDUÇÕES
    let deducaoTeto = valorBruto > teto ? (valorBruto - teto) : 0;
    let rpps = TETO_RPPS;
    let previdenciaComplementarValor = (valorBruto - deducaoTeto - TETO_INSS) * previdenciaComplementar;
    
    // IRRF (Cálculo simplificado na alíquota máxima)
    let irrf = (valorBruto - deducaoTeto - rpps) * 0.275 - 908.73;
    if (irrf < 0) irrf = 0;
    
    // IAMSPE
    let descontoIamspeAgregados = agregadosIamspeIdadeInferior * 0.02 + agregadosIamspeIdadeSuperior * 0.03;
    let descontoIamspeDependentes = dependentesIamspeIdadeInferior * 0.005 + dependentesIamspeIdadeSuperior * 0.01;
    let totalDescontoIamspe = (iamspe + descontoIamspeAgregados + descontoIamspeDependentes) * (valorBruto - deducaoTeto);    
    
    let remuneracaoLiquida = valorBruto - deducaoTeto - rpps - previdenciaComplementarValor - irrf - totalDescontoIamspe;          
    
    // INDENIZAÇÕES (Livres de tributos/teto)
    let vr = diasAlimentacao * VALOR_REFEICAO;
    let nc = atin * VALOR_NOS_CONFORMES;
    let vencimentos = remuneracaoLiquida + vr + nc;
    
    // ATUALIZAÇÃO DO DOM (Tela)
    document.getElementById("vbCotas").innerText = VB_COTAS[cargo - 1];
    document.getElementById("vb").innerText = numberToReal(vb);
    
    document.getElementById("ppCotas").innerText = PP_COTAS[funcao - 1]; 
    document.getElementById("pp").innerText = numberToReal(pp);
    
    document.getElementById("plCotas").innerText = PL_COTAS[funcao - 1]; 
    document.getElementById("pl").innerText = numberToReal(pl);
    
    document.getElementById("aliquotaQq").innerText = (aliquotaQq * 100).toFixed(2) + "%";
    document.getElementById("qq").innerText = numberToReal(qq);
    
    document.getElementById("aliquota6p").innerText = (aliquota6p * 100).toFixed(2) + "%";
    document.getElementById("6p").innerText = numberToReal(sextaParte);
    
    document.getElementById("prCotas").innerText = PR_COTAS[cargo - 1][funcao - 1];
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