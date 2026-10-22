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

function faixa(ano, mes, de, ate, tipo) {
    const mapa = {};
    for (let dia = de; dia <= ate; dia++) {
        mapa[ano + "-" + String(mes).padStart(2, "0") + "-" + String(dia).padStart(2, "0")] = tipo || "ferias";
    }
    return mapa;
}

// Contornos do calendário real: 1º ago/set (quebra-mês), 2º nov, 3º dez.
function contornoCalendario2027() {
    return Object.assign(
        {},
        faixa(2027, 8, 23, 31),
        faixa(2027, 9, 1, 3),
        faixa(2027, 11, 3, 12),
        faixa(2027, 12, 10, 17)
    );
}

function ilhasFerias(model, mapa) {
    const off = new Uint8Array(model.baseOff);
    Object.keys(mapa).forEach((iso) => {
        const i = model.index.get(iso);
        if (i != null) off[i] = 1;
    });
    const runs = [];
    let atual = null;
    model.days.forEach((day) => {
        if (!day.inYear || mapa[day.iso] !== "ferias") {
            if (atual) { runs.push(atual); atual = null; }
            return;
        }
        if (!atual) atual = { start: day, end: day, len: 1 };
        else { atual.end = day; atual.len++; }
    });
    if (atual) runs.push(atual);
    return runs.map((run, idx) => {
        let kStart = model.index.get(run.start.iso);
        let kEnd = model.index.get(run.end.iso);
        while (kStart > 0 && off[kStart - 1]) kStart--;
        while (kEnd + 1 < model.n && off[kEnd + 1]) kEnd++;
        const descanso = kEnd - kStart + 1;
        let gasto = 0;
        for (let k = kStart; k <= kEnd; k++) {
            if (model.days[k].inYear && mapa[model.days[k].iso]) gasto++;
        }
        const meses = {};
        for (let k = model.index.get(run.start.iso); k <= model.index.get(run.end.iso); k++) {
            meses[model.days[k].month] = (meses[model.days[k].month] || 0) + 1;
        }
        return {
            ordem: idx + 1,
            start: run.start.iso,
            end: run.end.iso,
            len: run.len,
            descanso,
            ganhos: Math.max(0, descanso - gasto),
            restStart: model.days[kStart].iso,
            restEnd: model.days[kEnd].iso,
            meses
        };
    });
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
    assert.ok(resultado.diagnosis);
    assert.equal(resultado.diagnosis.cause, "period");
    assert.ok(resultado.fallback && resultado.fallback.plans.length);
    assert.equal(resultado.fallback.applied[0].key, "period");
    resultado.fallback.plans.forEach((plano) => {
        assert.equal(plano.feriasDays, 30);
        assert.equal(plano.atinOk, true);
        assert.equal(plano.prOk, true);
    });
});

test("link de compartilhamento compacto redonda ida e volta e fica bem menor que o JSON", () => {
    const manual = {};
    for (let d = 17; d <= 26; d++) manual["2027-05-" + String(d).padStart(2, "0")] = "ferias";
    for (let d = 8; d <= 17; d++) manual["2027-09-" + String(d).padStart(2, "0")] = "ferias";
    for (let d = 3; d <= 12; d++) manual["2027-11-" + String(d).padStart(2, "0")] = "ferias";
    const payload = {
        year: 2027, period: "all", city: "saopaulo", recesso: "nenhum",
        feriasTotal: 30, mode: 3, minBlock: 0, minOneBlock: 0,
        lp: 0, abonadas: 0, eleitoral: 0, escala: 0, expandFixed: false,
        manual: manual, locked: manual
    };
    const compact = Folga.encodeSharePayload(payload);
    assert.ok(compact.length < 80, compact);
    assert.ok(compact.length * 4 < JSON.stringify(payload).length);
    const volta = Folga.decodeSharePayload(compact);
    assert.equal(volta.year, "2027");
    assert.equal(volta.period, "all");
    assert.equal(volta.mode, "3");
    assert.deepEqual(volta.manual, manual);
    assert.deepEqual(volta.locked, manual);

    const custom = Folga.encodeSharePayload({
        year: 2028, period: "custom", monthFrom: 3, monthTo: 8,
        city: "campinas", recesso: "natal", feriasTotal: 15, mode: 2,
        minBlock: 5, minOneBlock: 10, lp: 15, abonadas: 2, eleitoral: 1, escala: 3,
        expandFixed: true, manual: { "2028-03-06": "abonada" }, locked: { "2028-03-06": "bloqueado" }
    });
    const dec = Folga.decodeSharePayload(custom);
    assert.equal(dec.year, "2028");
    assert.equal(dec.period, "custom");
    assert.equal(dec.monthFrom, "3");
    assert.equal(dec.city, "campinas");
    assert.equal(dec.recesso, "natal");
    assert.equal(dec.feriasTotal, "15");
    assert.equal(dec.lp, "15");
    assert.equal(dec.expandFixed, true);
    assert.equal(dec.manual["2028-03-06"], "abonada");
    assert.equal(dec.locked["2028-03-06"], "bloqueado");
});

test("mínimo de um período longo impossível aponta a trava e oferece busca relaxada", () => {
    const resultado = Folga.optimize(modelo(), Object.assign({}, base, {
        mode: 3, minBlock: 10, minOneBlock: 25, abonadas: 0
    }));
    assert.ok(resultado.error);
    assert.ok(resultado.diagnosis);
    assert.ok(["minOneBlock", "minimos"].indexOf(resultado.diagnosis.cause) !== -1);
    assert.ok(resultado.fallback && resultado.fallback.plans.length);
    assert.equal(resultado.fallback.plans[0].feriasDays, 30);
    const trial = resultado.diagnosis.trials.find((t) => t.key === "minOneBlock");
    assert.ok(trial && trial.unlocked);
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

test("contorno do calendário: 3 períodos de 2027 com quebra ago/set, ATIN e folgas emendadas", () => {
    const m = modelo();
    const mapa = contornoCalendario2027();
    const cfg = Object.assign({}, base, { abonadas: 0 });
    const rel = Folga.analyze(m, cfg, mapa);
    const periodos = ilhasFerias(m, mapa);

    assert.equal(Object.keys(mapa).length, 30);
    assert.equal(rel.feriasDays, 30);
    assert.equal(rel.spent, 30);
    assert.equal(rel.atinOk, true);
    assert.equal(rel.prOk, true);
    assert.equal(rel.dilOk, true);
    assert.equal(rel.atinLoss, 0);
    assert.equal(rel.prLoss, 0);
    assert.equal(periodos.length, 3);

    // 1º período: 23/08 a 03/09 (9d em agosto + 3d em setembro), emenda até 07/09
    assert.equal(periodos[0].start, "2027-08-23");
    assert.equal(periodos[0].end, "2027-09-03");
    assert.equal(periodos[0].len, 12);
    assert.equal(periodos[0].meses[7], 9);
    assert.equal(periodos[0].meses[8], 3);
    assert.equal(periodos[0].ganhos, 6);
    assert.equal(periodos[0].descanso, 18);
    assert.equal(periodos[0].restStart, "2027-08-21");
    assert.equal(periodos[0].restEnd, "2027-09-07");

    // 2º período: 03/11 a 12/11 (10d), emenda Finados à esquerda e 15/11 à direita
    assert.equal(periodos[1].start, "2027-11-03");
    assert.equal(periodos[1].end, "2027-11-12");
    assert.equal(periodos[1].len, 10);
    assert.equal(periodos[1].meses[10], 10);
    assert.equal(periodos[1].ganhos, 7);
    assert.equal(periodos[1].descanso, 17);
    assert.equal(periodos[1].restStart, "2027-10-30");
    assert.equal(periodos[1].restEnd, "2027-11-15");

    // 3º período: 10/12 a 17/12 (8d), só o fim de semana seguinte
    assert.equal(periodos[2].start, "2027-12-10");
    assert.equal(periodos[2].end, "2027-12-17");
    assert.equal(periodos[2].len, 8);
    assert.equal(periodos[2].meses[11], 8);
    assert.equal(periodos[2].ganhos, 2);
    assert.equal(periodos[2].descanso, 10);
    assert.equal(periodos[2].restStart, "2027-12-10");
    assert.equal(periodos[2].restEnd, "2027-12-19");

    assert.equal(rel.rest, 18 + 17 + 10);
    assert.equal(rel.months[7].days, 9);
    assert.equal(rel.months[8].days, 3);
    assert.equal(rel.months[10].days, 10);
    assert.equal(rel.months[11].days, 8);
    rel.months.forEach((mes) => assert.ok(mes.days <= 20));

    const start = m.days[m.index.get("2027-08-23")];
    const end = m.days[m.index.get("2027-09-03")];
    assert.equal(start.dow, 1);
    assert.equal(end.dow, 5);
    assert.equal(start.plain, true);
    assert.equal(end.plain, true);
});

test("contorno do calendário: feriados e pontes visíveis em 2027 batem com o mapa de São Paulo", () => {
    const feriados = Folga.buildHolidayMap(2027, "saopaulo", [], {});
    const esperados = {
        "2027-05-01": "feriado",
        "2027-05-27": "feriado",
        "2027-05-28": "facultativo",
        "2027-07-09": "feriado",
        "2027-09-06": "facultativo",
        "2027-09-07": "feriado",
        "2027-10-11": "facultativo",
        "2027-10-12": "feriado",
        "2027-10-28": "facultativo",
        "2027-11-01": "facultativo",
        "2027-11-02": "feriado",
        "2027-11-15": "feriado",
        "2027-11-20": "feriado",
        "2027-12-24": "facultativo",
        "2027-12-25": "feriado",
        "2027-12-31": "facultativo"
    };
    Object.keys(esperados).forEach((iso) => {
        const dia = feriados.get(iso);
        assert.ok(dia, iso);
        assert.equal(dia.kind, esperados[iso], iso);
    });
});

test("contorno do calendário: o plano de 30 dias cabe nas travas e o link compacto preserva as datas", () => {
    const m = modelo();
    const mapa = contornoCalendario2027();
    const resultado = Folga.optimize(m, Object.assign({}, base, { abonadas: 0, mode: 3 }), mapa);
    assert.equal(resultado.error, undefined);
    resultado.plans.forEach((plano) => {
        assert.equal(plano.leaveMap["2027-08-23"], "ferias");
        assert.equal(plano.leaveMap["2027-09-03"], "ferias");
        assert.equal(plano.leaveMap["2027-11-03"], "ferias");
        assert.equal(plano.leaveMap["2027-12-17"], "ferias");
        assert.equal(plano.feriasDays, 30);
        assert.equal(plano.atinOk, true);
    });

    const compact = Folga.encodeSharePayload({
        year: 2027, period: "all", city: "saopaulo", recesso: "nenhum",
        feriasTotal: 30, mode: 3, manual: mapa, locked: mapa
    });
    const volta = Folga.decodeSharePayload(compact);
    assert.deepEqual(volta.manual, mapa);
    assert.ok(compact.length < 90, compact);
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






