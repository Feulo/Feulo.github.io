const test = require("node:test");
const assert = require("node:assert/strict");
const Folga = require("../js/folga/engine.js");

const base = {
    year: 2027,
    from: 1,
    to: 12,
    mode: 3,
    minBlock: 0,
    minOneBlock: 0,
    lp: 0,
    abonadas: 6,
    eleitoral: 0,
    escala: 0,
    ufesp: 38.5,
    pr: 12000,
    maxDil: 1,
    city: "saopaulo"
};

function modelo(city) {
    const mapa = Folga.buildHolidayMap(2027, city || "saopaulo", [], {});
    return Folga.buildModel(2027, mapa);
}

test("calendário de 2027 confere Páscoa, Carnaval, Corpus e as pontes", () => {
    assert.deepEqual(Folga.holidaySelfCheck(), []);
});

test("a busca devolve descanso em dias e respeita férias, ATIN e PR", () => {
    const resultado = Folga.optimize(modelo(), base);
    assert.equal(resultado.error, undefined);
    assert.equal(resultado.plans.length, 3);

    const rotulos = resultado.plans.map((plano) => plano.label);
    assert.deepEqual(rotulos, ["Máximo descanso", "Menor perda", "Maior sequência"]);

    resultado.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        assert.equal(plano.atinOk, true);
        assert.equal(plano.prOk, true);
        assert.equal(plano.dilOk, true);
        assert.equal(plano.atinLoss, 0);
        assert.ok(plano.rest >= plano.spent);

        const ferias = plano.blocks.filter((bloco) => bloco.type === "ferias");
        assert.equal(ferias.length, 3);
        ferias.forEach((bloco) => {
            assert.ok(bloco.startDow >= 1 && bloco.startDow <= 5);
            assert.ok(bloco.endDow >= 1 && bloco.endDow <= 5);
            assert.ok(bloco.counts.every((dias) => dias <= 20));
        });
        const abonadasPorMes = {};
        plano.singles.filter((dia) => dia.type === "abonada").forEach((dia) => {
            const mes = dia.iso.slice(0, 7);
            abonadasPorMes[mes] = (abonadasPorMes[mes] || 0) + 1;
        });
        Object.values(abonadasPorMes).forEach((qtd) => assert.ok(qtd <= 1));
    });

    const maximo = resultado.plans[0];
    const menor = resultado.plans[1];
    assert.ok(maximo.rest >= menor.rest);
    assert.equal(menor.prLoss, 0);
    assert.equal(menor.used.abonada, 0);
    assert.equal(menor.used.lp, 0);
});

test("um bloco de 30 dias quebra o mês para não passar de 20 no ATIN", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 1, abonadas: 0 }));
    assert.equal(resultado.plans[0].blocks.length, 1);
    const bloco = resultado.plans[0].blocks[0];
    assert.equal(bloco.len, 30);
    const meses = bloco.counts.filter((dias) => dias > 0);
    assert.equal(meses.length, 2);
    assert.ok(meses.every((dias) => dias <= 20 && dias >= 10));
});

test("trinta dias dentro de um único mês não têm saída sem perder o ATIN", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 1, from: 3, to: 3 }));
    assert.match(resultado.error, /20 dias/);
});

test("exige que ao menos um período tenha no mínimo N dias (ex.: 3 períodos sendo um >= 18)", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 3, minBlock: 2, minOneBlock: 18 }));
    assert.equal(resultado.error, undefined);
    resultado.plans.forEach((plano) => {
        const ferias = plano.blocks.filter((b) => b.type === "ferias");
        assert.equal(ferias.length, 3);
        assert.ok(ferias.every((b) => b.len >= 2));
        assert.ok(ferias.some((b) => b.len >= 18));
    });
});

test("permite fixar um período no calendário e otimizar os dias restantes", () => {
    const fixo = {
        "2027-02-11": "ferias",
        "2027-02-12": "ferias"
    };
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, { mode: 3, minOneBlock: 15 }), fixo);
    assert.equal(resultado.error, undefined);
    assert.equal(resultado.fixedSummary.feriasDays, 2);
    resultado.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        const ferias = plano.blocks.filter((b) => b.type === "ferias");
        assert.equal(ferias.length, 3);
        const fixado = ferias.find((b) => b.start === "2027-02-11" && b.end === "2027-02-12");
        assert.ok(fixado && fixado.locked);
        assert.ok(ferias.some((b) => b.len >= 15));
    });
});

test("recesso de Natal e de Ano Novo segue o Decreto 70.273/2025 e amplia a emenda de dezembro", () => {
    const rec2026 = Folga.recessoInfo(2026);
    assert.equal(rec2026.natal.start, "2026-12-21");
    assert.equal(rec2026.natal.end, "2026-12-25");
    assert.equal(rec2026.anonovo.start, "2026-12-28");
    assert.equal(rec2026.anonovo.end, "2027-01-01");

    const semRecesso = Folga.buildModel(2026, Folga.buildHolidayMap(2026, "saopaulo", [], {}, "nenhum"));
    const comNatal = Folga.buildModel(2026, Folga.buildHolidayMap(2026, "saopaulo", [], {}, "natal"));
    const comAnoNovo = Folga.buildModel(2026, Folga.buildHolidayMap(2026, "saopaulo", [], {}, "anonovo"));

    // Emendar 28 a 30/12 com Recesso de Natal une 19/12 a 03/01 (16 dias de descanso com 3 dias de férias)
    const feriasFimAno = { "2026-12-28": "ferias", "2026-12-29": "ferias", "2026-12-30": "ferias" };
    const relSem = Folga.analyze(semRecesso, Object.assign({}, base, { year: 2026 }), feriasFimAno);
    const relNatal = Folga.analyze(comNatal, Object.assign({}, base, { year: 2026 }), feriasFimAno);
    assert.equal(relSem.rest, 11);
    assert.equal(relNatal.rest, 16);

    // Emendar 21 a 23/12 com Recesso de Ano Novo também une 19/12 a 03/01 (16 dias de descanso)
    const feriasNatal = { "2026-12-21": "ferias", "2026-12-22": "ferias", "2026-12-23": "ferias" };
    const relAnoNovo = Folga.analyze(comAnoNovo, Object.assign({}, base, { year: 2026 }), feriasNatal);
    assert.equal(relAnoNovo.rest, 16);
});

test("condição de contorno: marcar 25/08 (aniversário) com expandFixed recupera os dias perdidos ao esticar os arredores", () => {
    const m = modelo();
    const fixo25Ago = { "2027-08-25": "ferias" };
    const estrito = Folga.optimize(m, Object.assign({}, base, { abonadas: 0, expandFixed: false }), fixo25Ago);
    const expandido = Folga.optimize(m, Object.assign({}, base, { abonadas: 0, expandFixed: true }), fixo25Ago);

    assert.equal(estrito.error, undefined);
    assert.equal(expandido.error, undefined);

    // No modo estrito (1 dia isolado numa quarta-feira), o descanso máximo fica em 44 dias
    assert.equal(estrito.plans[0].rest, 44);
    const blocoEstrito = estrito.plans[0].blocks.find((b) => b.locked);
    assert.equal(blocoEstrito.len, 1);

    // No modo expandFixed, o otimizador estica o bloco ao redor de 25/08 e sobe para 49 dias (+5 dias de descanso)
    assert.equal(expandido.plans[0].rest, 49);
    const blocoExpandido = expandido.plans[0].blocks.find((b) => b.locked);
    assert.ok(blocoExpandido.len > 1);
    assert.ok(blocoExpandido.start <= "2027-08-25" && blocoExpandido.end >= "2027-08-25");
    assert.equal(expandido.plans[0].leaveMap["2027-08-25"], "ferias");
});

test("todas as DRTs da DEAT constroem calendários válidos e aplicam seus feriados municipais", () => {
    const drts = Object.keys(Folga.CITY_PRESETS);
    assert.ok(drts.length >= 17);
    drts.forEach((cityId) => {
        const mapa = Folga.buildHolidayMap(2026, cityId, [], {}, "nenhum");
        const m = Folga.buildModel(2026, mapa);
        assert.equal(m.days.filter((d) => d.inYear).length, 365);
    });
    // Taubaté (DRT-3) inclui 05/02, segunda após Páscoa (06/04/2026) e 04/10
    const taubate2026 = Folga.buildHolidayMap(2026, "taubate", [], {}, "nenhum");
    assert.equal(taubate2026.get("2026-02-05").kind, "feriado");
    assert.equal(taubate2026.get("2026-04-06").kind, "feriado");
    assert.equal(taubate2026.get("2026-10-04").kind, "feriado");
    assert.ok(Folga.CITY_PRESETS.dtic);
});

test("datas bloqueadas (expediente obrigatório) impedem alocação de férias ou abonadas naqueles dias", () => {
    const m = modelo();
    // Bloquear 11/02 e 12/02 (ponte de Carnaval em 2027) obriga o otimizador a não usar esses dias como férias
    const bloqueio = {
        "2027-02-11": "bloqueado",
        "2027-02-12": "bloqueado"
    };
    const resultado = Folga.optimize(m, Object.assign({}, base, { abonadas: 6 }), bloqueio);
    assert.equal(resultado.error, undefined);
    resultado.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        assert.equal(plano.leaveMap["2027-02-11"], "bloqueado");
        assert.equal(plano.leaveMap["2027-02-12"], "bloqueado");
        plano.blocks.forEach((b) => {
            assert.ok(b.end < "2027-02-11" || b.start > "2027-02-12");
        });
    });
});

test("permite otimizar quantidade flexível de dias de férias (< 30 dias, ex.: 15 dias em 1 ou 2 períodos)", () => {
    const m = modelo();
    const res15 = Folga.optimize(m, Object.assign({}, base, { feriasTotal: 15, mode: 2, abonadas: 0 }));
    assert.equal(res15.error, undefined);
    res15.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 15);
        const ferias = plano.blocks.filter((b) => b.type === "ferias");
        assert.equal(ferias.length, 2);
        assert.equal(ferias.reduce((s, b) => s + b.len, 0), 15);
    });
});

test("edge cases: ano bissexto (2028), 1 dia de férias com modo=3, LP fixa < 15d e bloco de 30d cobrindo feriados internos", () => {
    // 1. Ano bissexto 2028 (366 dias, fevereiro com 29 dias e 1º trimestre com 91 dias -> limite PR = 30d)
    const m2028 = Folga.buildModel(2028, Folga.buildHolidayMap(2028, "saopaulo", [], {}, "natal"));
    assert.equal(m2028.days.filter((d) => d.inYear).length, 366);
    assert.equal(m2028.qDays[0], 91);
    assert.equal(m2028.qSafe[0], 30);

    // 2. Pedir apenas 1 dia de férias mesmo com "3 períodos" marcado ajusta automaticamente para 1 período
    const res1Dia = Folga.optimize(m2028, Object.assign({}, base, { year: 2028, feriasTotal: 1, mode: 3, abonadas: 0 }));
    assert.equal(res1Dia.error, undefined);
    assert.equal(res1Dia.plans[0].feriasDays, 1);

    // 3. Bloco único de 30 dias corridos consegue atravessar feriado interno no meio do bloco (quebrando mês p/ ATIN)
    const res30Corridos = Folga.optimize(m2028, Object.assign({}, base, { year: 2028, feriasTotal: 30, mode: 1, abonadas: 0 }));
    assert.equal(res30Corridos.error, undefined);
    assert.equal(res30Corridos.plans[0].blocks[0].len, 30);

    // 4. Licença-prêmio fixada manualmente com menos de 15 dias é rejeitada com erro claro
    const lpCurta = { "2027-05-03": "lp", "2027-05-04": "lp", "2027-05-05": "lp" };
    const resLpCurta = Folga.optimize(modelo(), base, lpCurta);
    assert.match(resLpCurta.error, /15 dias/);

    // 5. Licença-prêmio automática (15 dias) nunca sobrepõe dias bloqueados
    const bloqueioMarco = { "2027-03-08": "bloqueado", "2027-03-09": "bloqueado" };
    const resComLpEBloqueio = Folga.optimize(modelo(), Object.assign({}, base, { lp: 15, abonadas: 0 }), bloqueioMarco);
    assert.equal(resComLpEBloqueio.error, undefined);
    resComLpEBloqueio.plans.forEach((plano) => {
        assert.equal(plano.leaveMap["2027-03-08"], "bloqueado");
        assert.equal(plano.leaveMap["2027-03-09"], "bloqueado");
    });
});






