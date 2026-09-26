(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.RemuneracaoData = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const TETOS_SP = [
        {
            inicio: "2019-01",
            fim: "2022-12",
            valor: 23048.59,
            norma: "Lei nº 16.929/2019 e prorrogações",
            fonte: "https://www.al.sp.gov.br/noticia/?id=443825"
        },
        {
            inicio: "2023-01",
            fim: "2023-12",
            valor: 34572.89,
            norma: "Lei nº 17.616/2023",
            fonte: "https://www.al.sp.gov.br/noticia/?id=443825"
        },
        {
            inicio: "2024-01",
            fim: "2025-06",
            valor: 34572.89,
            norma: "Lei nº 17.862/2023",
            fonte: "https://www.al.sp.gov.br/propositura/?id=1000539166"
        },
        {
            inicio: "2025-07",
            fim: "2025-12",
            valor: 36301.53,
            norma: "Lei nº 18.152/2025",
            fonte: "https://www.al.sp.gov.br/repositorio/legislacao/lei/2025/lei-18152-02.06.2025.html"
        },
        {
            inicio: "2026-01",
            fim: "2026-12",
            valor: 36301.53,
            norma: "Lei nº 18.385/2025",
            fonte: "https://www.al.sp.gov.br/repositorio/legislacao/lei/2025/lei-18152-02.06.2025.html"
        },
        {
            inicio: "2027-01",
            fim: "2099-12",
            valor: 46366.19,
            baseDaCota: false,
            norma: "Teto federal — subsídio dos ministros do STF, Lei nº 14.520/2023",
            fonte: "http://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/lei/L14520.htm"
        }
    ];

    const UFESPS = [
        { inicio: "2021-01", fim: "2021-12", valor: 29.09 },
        { inicio: "2022-01", fim: "2022-12", valor: 31.97 },
        { inicio: "2023-01", fim: "2023-12", valor: 34.26 },
        { inicio: "2024-01", fim: "2024-12", valor: 35.36 },
        { inicio: "2025-01", fim: "2025-12", valor: 37.02 },
        { inicio: "2026-01", fim: "2099-12", valor: 38.42 }
    ];
    const FONTE_UFESP = "https://legislacao.fazenda.sp.gov.br/Paginas/ValoresDaUFESP.aspx";

    const VB_COTAS = [4300, 4550, 4800, 5200, 5600, 6000];

    const FUNCOES = [
        { id: 1, nome: "Subsecretário da Receita Estadual", pl: 2400, pp: 3600, pr: [0, 4280, 4410, 4540, 4670, 4800] },
        { id: 2, nome: "Assessor Fiscal Setorial VII", pl: 2400, pp: 3600, pr: [4150, 4280, 4410, 4540, 4670, 4800] },
        { id: 3, nome: "Subsecretário Adjunto da Receita Estadual", pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] },
        { id: 4, nome: "Corregedor-Geral da Corfisp", pl: 2380, pp: 3595, pr: [0, 4066, 4190, 4313, 4437, 4560] },
        { id: 5, nome: "Diretor Geral", pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] },
        { id: 6, nome: "Assessor Fiscal Setorial VI", pl: 2380, pp: 3595, pr: [4026, 4152, 4278, 4404, 4530, 4656] },
        { id: 7, nome: "Diretor Geral Adjunto", pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] },
        { id: 8, nome: "Assessor Fiscal Setorial V", pl: 2280, pp: 3585, pr: [3943, 4066, 4190, 4313, 4437, 4560] },
        { id: 9, nome: "Corregedor Adjunto da Corfisp", pl: 2280, pp: 3585, pr: [0, 3959, 4079, 4200, 4320, 4440] },
        { id: 10, nome: "Diretor", pl: 2160, pp: 3570, pr: [0, 4066, 4190, 4313, 4437, 4560] },
        { id: 11, nome: "Assessor Fiscal Setorial IV", pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] },
        { id: 12, nome: "Presidente do TIT", pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] },
        { id: 13, nome: "Assistente Fiscal Técnico Chefe", pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] },
        { id: 14, nome: "Assistente Fiscal de Gabinete do Secretário", pl: 2160, pp: 3570, pr: [3839, 3959, 4079, 4200, 4320, 4440] },
        { id: 15, nome: "Corregedor Fiscal", pl: 2160, pp: 3570, pr: [0, 3638, 3749, 3859, 3970, 4080] },
        { id: 16, nome: "Diretor Adjunto", pl: 2070, pp: 3480, pr: [0, 3959, 4079, 4200, 4320, 4440] },
        { id: 17, nome: "Assessor Fiscal Setorial III", pl: 2070, pp: 3480, pr: [3735, 3852, 3969, 4086, 4203, 4320] },
        { id: 18, nome: "Vice-Presidente do TIT", pl: 2070, pp: 3480, pr: [3839, 3959, 4079, 4200, 4320, 4440] },
        { id: 19, nome: "Delegado Tributário", pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] },
        { id: 20, nome: "Delegado Tributário de Julgamento", pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] },
        { id: 21, nome: "Representante Fiscal Chefe", pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] },
        { id: 22, nome: "Assistente Fiscal Técnico", pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 23, nome: "Assistente Fiscal Chefe", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 24, nome: "Consultor Tributário Chefe", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 25, nome: "Supervisor Fiscal", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 26, nome: "Assessor Fiscal Setorial II", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 27, nome: "Representante Fiscal Chefe de Assistência", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 28, nome: "Inspetor Fiscal", pl: 1980, pp: 3450, pr: [0, 3638, 3749, 3859, 3970, 4080] },
        { id: 29, nome: "Assessor Fiscal Setorial I", pl: 1800, pp: 3375, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 30, nome: "Chefe", pl: 1800, pp: 3375, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 31, nome: "Assistente Fiscal Especialista", pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] },
        { id: 32, nome: "Consultor Tributário Especialista", pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] },
        { id: 33, nome: "Representante Fiscal Especialista", pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] },
        { id: 34, nome: "Assistente Fiscal", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 35, nome: "Consultor Tributário", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 36, nome: "Representante Fiscal", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 37, nome: "Juiz com Dedicação Exclusiva", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 38, nome: "Julgador Fiscal", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 39, nome: "Fiscalização Direta de Tributos", pl: 0, pp: 2700, pr: [3279, 3381, 3484, 3587, 3689, 3792] },
        { id: 40, nome: "Coordenador da Administração Tributária", pl: 2400, pp: 3600, pr: [0, 4280, 4410, 4540, 4670, 4800] },
        { id: 41, nome: "Assessor Fiscal Especial IV", pl: 2160, pp: 3570, pr: [4150, 4237, 4366, 4495, 4623, 4752] },
        { id: 42, nome: "Coordenador Adjunto da Administração Tributária", pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] },
        { id: 43, nome: "Subcoordenador da Administração Tributária", pl: 2380, pp: 3595, pr: [0, 4152, 4278, 4404, 4530, 4656] },
        { id: 44, nome: "Subcoordenador Adjunto da Administração Tributária", pl: 2280, pp: 3585, pr: [0, 4126, 4252, 4378, 4504, 4630] },
        { id: 45, nome: "Assessor Fiscal Especial III", pl: 2160, pp: 3570, pr: [3943, 4066, 4190, 4313, 4437, 4560] },
        { id: 46, nome: "Delegado Regional Tributário", pl: 2070, pp: 3480, pr: [0, 3852, 3969, 4086, 4203, 4320] },
        { id: 47, nome: "Assessor Fiscal III", pl: 1980, pp: 3450, pr: [3735, 3852, 3969, 4086, 4203, 4320] },
        { id: 48, nome: "Consultor Tributário Chefe - Cotepe", pl: 1980, pp: 3450, pr: [3631, 3745, 3859, 3973, 4086, 4200] },
        { id: 49, nome: "Assessor Fiscal Especial II", pl: 2070, pp: 3480, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 50, nome: "Assistente Fiscal Chefe I", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 51, nome: "Assessor Fiscal II", pl: 1980, pp: 3450, pr: [3528, 3638, 3749, 3859, 3970, 4080] },
        { id: 52, nome: "Assessor Fiscal Especial I", pl: 1760, pp: 3350, pr: [3486, 3595, 3705, 3814, 3923, 4032] },
        { id: 53, nome: "Assessor Fiscal I", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 54, nome: "Assistente Fiscal III", pl: 1680, pp: 3300, pr: [3403, 3510, 3616, 3723, 3829, 3936] },
        { id: 55, nome: "Assistente Fiscal II", pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] },
        { id: 56, nome: "Assistente Fiscal de Cobrança", pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] },
        { id: 57, nome: "Assistente Fiscal", pl: 1680, pp: 3300, pr: [3279, 3381, 3484, 3587, 3689, 3792] }
    ];

    function tetoNaCompetencia(competencia) {
        return TETOS_SP.find((item) => competencia >= item.inicio && competencia <= item.fim) || null;
    }

    function tetoBaseDaCota(competencia) {
        const bases = TETOS_SP.filter((item) => item.baseDaCota !== false);
        const vigente = bases.find((item) => competencia >= item.inicio && competencia <= item.fim);
        if (vigente) return vigente;
        const anteriores = bases.filter((item) => item.fim < competencia);
        return anteriores[anteriores.length - 1] || null;
    }

    function valorCota(competencia) {
        const teto = tetoBaseDaCota(competencia);
        return teto ? teto.valor / 12000 : null;
    }

    function ufespNaCompetencia(competencia) {
        return UFESPS.find((item) => competencia >= item.inicio && competencia <= item.fim) || null;
    }

    function calcularRubricasPerfil(perfil, competencia) {
        const cargo = Math.min(6, Math.max(1, Number(perfil.cargo) || 1));
        const funcao = FUNCOES.find((item) => item.id === Number(perfil.funcaoId)) || FUNCOES.find((item) => item.id === 39);
        const cota = valorCota(competencia);
        if (cota === null) throw new Error(`Não há teto cadastrado para ${competencia}.`);

        const vb = VB_COTAS[cargo - 1] * cota;
        const pp = funcao.pp * cota;
        const pl = funcao.pl * cota;
        const quinquenio = (vb + pp + pl) * Math.floor((Number(perfil.tempoServico) || 0) / 5) * 0.05;
        const sextaParte = (vb + pp + pl + quinquenio) * (Number(perfil.tempoServico) >= 20 ? 1 / 6 : 0);
        const pr = funcao.pr[cargo - 1] * cota * ((Number(perfil.icm) || 0) / 100);
        const ufesp = ufespNaCompetencia(competencia);
        const atin = ufesp ? 300 * ufesp.valor : 0;

        return { vb, pp, pl, quinquenio, sextaParte, pr, atin };
    }

    return {
        TETOS_SP,
        UFESPS,
        FONTE_UFESP,
        VB_COTAS,
        FUNCOES,
        tetoNaCompetencia,
        valorCota,
        ufespNaCompetencia,
        calcularRubricasPerfil
    };
});
