(function () {
    "use strict";

    const Engine = window.FolgaEngine;
    const MESES = Engine.MESES;
    const SEMANA = Engine.SEMANA;
    const TIPOS = Engine.TYPE_META;
    const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
    const TINTAS = [
        ["ferias", "Férias"],
        ["lp", "Licença-prêmio"],
        ["abonada", "Abonada"],
        ["eleitoral", "Eleitoral"],
        ["escala", "Escala"],
        ["saude", "Saúde"],
        ["nojo", "Nojo/gala"],
        ["bloqueado", "Bloqueado"],
        ["apagar", "Apagar"]
    ];
    const state = {
        manual: {},
        locked: {},
        expandFixed: false,
        rangeMode: false,
        rangeStart: null,
        custom: [],
        disabled: {},
        paint: "ferias",
        anchor: null,
        plans: [],
        activeId: null,
        model: null
    };

    function esc(valor) {
        return String(valor == null ? "" : valor).replace(/[&<>"']/g, function (ch) {
            return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch];
        });
    }

    function num(id, fallback, min, max) {
        const valor = Number(document.getElementById(id).value);
        if (!Number.isFinite(valor)) return fallback;
        return Engine.clamp(valor, min, max);
    }

    function readConfig() {
        const year = num("year", 2027, 2024, 2040);
        const period = document.getElementById("period").value;
        let from = 1;
        let to = 12;
        if (period === "s1") to = 6;
        else if (period === "s2") from = 7;
        else if (period === "q1") to = 3;
        else if (period === "q2") { from = 4; to = 6; }
        else if (period === "q3") { from = 7; to = 9; }
        else if (period === "q4") from = 10;
        else if (period === "custom") {
            from = num("monthFrom", 1, 1, 12);
            to = num("monthTo", 12, 1, 12);
            if (from > to) { const tmp = from; from = to; to = tmp; }
        }
        const mode = Number((document.querySelector('input[name="feriasMode"]:checked') || {}).value || 3);
        return {
            year: year,
            from: from,
            to: to,
            feriasTotal: num("feriasTotal", 30, 1, 30),
            mode: Engine.clamp(mode, 1, 3),
            minBlock: num("minBlock", 0, 0, 30),
            minOneBlock: num("minOneBlock", 0, 0, 30),
            lp: num("lp", 0, 0, 90),
            abonadas: num("abonadas", 0, 0, 6),
            eleitoral: num("eleitoral", 0, 0, 10),
            escala: num("escala", 0, 0, 15),
            ufesp: num("ufesp", 38.5, 1, 1000),
            pr: num("prValor", 12000, 0, 1000000),
            maxDil: num("maxDil", 1, 1, 6),
            city: document.getElementById("city").value,
            recesso: (document.getElementById("recesso") || {}).value || "nenhum",
            expandFixed: Boolean(state.expandFixed)
        };
    }

    function gasto(used) {
        const partes = [];
        if (used.ferias) partes.push(used.ferias + (used.ferias > 1 ? " dias de férias" : " dia de férias"));
        if (used.lp) partes.push(used.lp + " de licença-prêmio");
        if (used.abonada) partes.push(used.abonada + (used.abonada > 1 ? " abonadas" : " abonada"));
        if (used.eleitoral) partes.push(used.eleitoral + " de eleitoral ou doação");
        if (used.escala) partes.push(used.escala + " de escala");
        if (used.saude) partes.push(used.saude + " de licença-saúde");
        if (used.nojo) partes.push(used.nojo + " de nojo ou gala");
        return partes;
    }

    function placarVivo(report) {
        if (!report.spent) {
            return '<div class="placar-vazio"><i class="bi bi-hand-index-thumb"></i><span>Marque no calendário um período que você já quer tirar e clique em <strong>Otimizar o restante</strong>, ou busque direto acima.</span></div>';
        }
        const emendados = report.rest - report.spent;
        const resumoSaldo = gasto(report.used).join(", ").replace(/, ([^,]*)$/, " e $1");
        const seq = report.longestStart ? Engine.fmt(report.longestStart).slice(0, 5) + " a " + Engine.fmt(report.longestEnd).slice(0, 5) : "—";
        return '<div class="placar-grid">' +
            '<div class="placar-item destaque"><strong>' + report.rest + "</strong><span>dias de descanso</span><small>" + esc(resumoSaldo) + "</small></div>" +
            '<div class="placar-item"><strong>+' + emendados + '</strong><span>dias emendados</span><small>feriados, pontes e fins de semana</small></div>' +
            '<div class="placar-item"><strong>' + report.longest + ' dias</strong><span>maior sequência</span><small>' + seq + "</small></div>" +
            "</div>";
    }

    function quebraMes(block) {
        const counts = block.counts || Engine.countMonths(state.model, block.i, block.j);
        const partes = [];
        counts.forEach(function (dias, mes) {
            if (dias) partes.push(dias + " em " + MESES[mes]);
        });
        return partes.length > 1 ? "Quebra-mês: " + partes.join(" + ") : "";
    }

    function classeDia(day, leave, isLocked) {
        const classes = ["dia"];
        if (leave) classes.push(leave);
        else if (day.holiday) classes.push(day.holiday.kind === "feriado" ? "feriado" : "facultativo");
        else if (day.weekend) classes.push("fds");
        if (leave && leave !== "bloqueado" && !day.plain) classes.push("desperdicio");
        if (isLocked) classes.push("fixado");
        if (state.rangeMode && state.rangeStart === day.iso) classes.push("inicio-intervalo");
        return classes.join(" ");
    }

    function faixa(plan) {
        if (!plan.longestStart || !plan.longestEnd) return "";
        const inicio = state.model.index.get(plan.longestStart);
        const fim = state.model.index.get(plan.longestEnd);
        if (inicio == null || fim == null) return "";
        let html = "";
        for (let i = inicio; i <= fim; i++) {
            const day = state.model.days[i];
            const leave = plan.leaveMap[day.iso] || "";
            const titulo = Engine.fmt(day.iso) + (day.holiday ? " · " + day.holiday.name : "") + (leave ? " · " + TIPOS[leave].label : "");
            html += '<span class="bolinha ' + classeDia(day, leave, false).replace("dia ", "") + '" title="' + esc(titulo) + '">' + day.iso.slice(-2) + "</span>";
        }
        return '<div class="faixa-bloco"><div class="faixa-cabeca"><span>Maior sequência seguida · <strong>' + plan.longest + " dias</strong></span><small>" + Engine.fmt(plan.longestStart) + " → " + Engine.fmt(plan.longestEnd) + '</small></div><div class="faixa">' + html + "</div></div>";
    }

    function renderScenarios(payload) {
        const host = document.getElementById("scenarios");
        if (!payload || payload.error) {
            host.innerHTML = '<p class="alerta danger mt-3">' + esc(payload && payload.error ? payload.error : "Nenhum período dentro das travas.") + "</p>";
            return;
        }
        if (!payload.plans.length) {
            host.innerHTML = '<p class="alerta mt-3">Nenhum período dentro das travas.</p>';
            return;
        }
        const atalhos = payload.plans.map(function (plan, idx) {
            const emendados = plan.rest - plan.spent;
            const ativo = state.activeId === plan.id;
            return '<button type="button" class="atalho' + (ativo ? " preferido" : "") + '" data-jump="' + idx + '">' +
                "<em>" + esc(plan.label) + (ativo ? ' · <i class="bi bi-check2-circle"></i> No calendário' : "") + "</em>" +
                "<strong>" + plan.rest + "</strong>" +
                "<span>dias de descanso</span>" +
                "<small>+" + emendados + " dias emendados · seq. " + plan.longest + "d</small>" +
                "</button>";
        }).join("");
        const cards = payload.plans.map(function (plan, idx) {
            const ferias = plan.blocks.filter(function (b) { return b.type === "ferias"; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
            const lps = plan.blocks.filter(function (b) { return b.type === "lp"; }).sort(function (a, b) { return a.start < b.start ? -1 : 1; });
            const itens = ferias.map(function (bloco, i) {
                const quebra = quebraMes(bloco);
                const seloFixo = bloco.locked ? ' <em class="selo-fixo"><i class="bi bi-pin-angle-fill"></i> fixado por você</em>' : "";
                return '<li><span class="tag-tipo ferias">Férias ' + (i + 1) + 'º</span><div class="item-datas"><strong>' +
                    Engine.fmt(bloco.start) + " → " + Engine.fmt(bloco.end) +
                    (i === 0 ? ' <em class="terco">1/3 constitucional</em>' : "") + seloFixo + "</strong><small>" +
                    SEMANA[bloco.startDow] + " a " + SEMANA[bloco.endDow] +
                    (quebra ? " · " + esc(quebra) : "") + '</small></div><strong class="qtd-dias">' + bloco.len + " dias</strong></li>";
            }).concat(lps.map(function (bloco) {
                const quebra = quebraMes(bloco);
                const seloFixo = bloco.locked ? ' <em class="selo-fixo"><i class="bi bi-pin-angle-fill"></i> fixado por você</em>' : "";
                return '<li><span class="tag-tipo lp">Lic.-prêmio</span><div class="item-datas"><strong>' +
                    Engine.fmt(bloco.start) + " → " + Engine.fmt(bloco.end) + seloFixo + "</strong><small>" +
                    SEMANA[bloco.startDow] + " a " + SEMANA[bloco.endDow] +
                    (quebra ? " · " + esc(quebra) : "") + '</small></div><strong class="qtd-dias">' + bloco.len + " dias</strong></li>";
            }));
            ["abonada", "eleitoral", "escala"].forEach(function (tipo) {
                const datas = plan.singles.filter(function (s) { return s.type === tipo; }).map(function (s) {
                    return Engine.fmt(s.iso) + (s.locked ? " (fixo)" : "");
                });
                if (!datas.length) return;
                itens.push('<li><span class="tag-tipo ' + tipo + '">' + esc(TIPOS[tipo].short) + '</span><div class="item-datas"><strong>' +
                    esc(TIPOS[tipo].label) + "</strong><small>" + datas.join(" · ") + '</small></div><strong class="qtd-dias">' +
                    datas.length + (datas.length > 1 ? " dias" : " dia") + "</strong></li>");
            });
            const emendados = plan.rest - plan.spent;
            const partes = gasto(plan.used);
            const atinRuim = plan.months.some(function (m) { return m.lost; });
            const atinAperto = plan.months.some(function (m) { return m.days >= 19 && m.days <= 20; });
            const seloAtin = atinRuim ? "danger" : atinAperto ? "warn" : "";
            const textoAtin = atinRuim ? "ATIN zerado em algum mês" : atinAperto ? "ATIN no limite (20 dias)" : "ATIN preservado";
            const seloPr = plan.prOk ? (plan.prLoss > 0 ? "warn" : "") : "danger";
            const textoPr = plan.prLoss > 0 ? "Desconto PR: " + brl.format(plan.prLoss) : "PR sem perda (R$ 0)";
            const meses = plan.months.filter(function (m) { return m.days > 0; }).map(function (m) {
                return MESES[m.month] + " " + m.days + "/20";
            }).join(" · ") || "nenhum mês encostou na trava";
            const tris = plan.quarters.map(function (q) {
                return (q.q + 1) + "º trimestre: " + q.non + " de " + q.safe + " dias · " + brl.format(q.loss);
            }).join("<br>");
            const ativo = state.activeId === plan.id;
            return '<article class="resultado' + (ativo ? " ativo" : "") + '" data-plan="' + idx + '">' +
                '<div class="resultado-topo">' +
                '<div class="numero"><strong>' + plan.rest + '</strong><span>dias de descanso</span></div>' +
                '<div class="resumo-plano">' +
                '<div class="titulo-linha"><span class="etiqueta">' + (idx + 1) + 'ª estratégia</span><h2>' + esc(plan.label) + '</h2></div>' +
                '<p class="subtitulo-plano">Usando ' + esc(partes.join(", ").replace(/, ([^,]*)$/, " e $1")) + ".</p>" +
                '<div class="metricas-chips">' +
                '<span class="chip-metrica verde"><i class="bi bi-stars"></i>+' + emendados + (emendados === 1 ? " dia emendado" : " dias emendados") + "</span>" +
                '<span class="chip-metrica"><i class="bi bi-calendar-range"></i>Até ' + plan.longest + " dias seguidos</span>" +
                '<span class="selo ' + seloAtin + '">' + textoAtin + "</span>" +
                '<span class="selo ' + seloPr + '">' + textoPr + "</span>" +
                "</div>" +
                '<p class="ajuda mt-2">' + esc(plan.blurb) + (plan.note ? " " + esc(plan.note) : "") + "</p>" +
                "</div></div>" +
                faixa(plan) +
                '<ul class="blocos">' + itens.join("") + "</ul>" +
                '<div class="rodape-resultado">' +
                '<details class="detalhe"><summary>Ver conta do ATIN e da PR</summary><p>' + meses + "</p><p>" + tris + "</p><p>Dias de férias ou licença-prêmio em folga que já existia: " + plan.waste + ".</p></details>" +
                '<button type="button" class="usar' + (ativo ? " aplicado" : "") + '" data-apply="' + idx + '"><i class="bi ' + (ativo ? "bi-check2-circle" : "bi-calendar2-plus") + '"></i> ' + (ativo ? "Aplicado no calendário" : "Aplicar no calendário") + "</button>" +
                "</div></article>";
        }).join("");
        host.innerHTML = '<div class="comparar">' + atalhos + '</div><div class="resultados">' + cards + "</div>";
    }

    function zona(dias) {
        if (dias > 20) return "danger";
        if (dias >= 19) return "warn";
        return "";
    }

    function periodosDeMapa(mapa, tipo) {
        const runs = [];
        let atual = null;
        state.model.days.forEach(function (day) {
            if (!day.inYear) return;
            if (mapa[day.iso] !== tipo) return;
            const indice = state.model.index.get(day.iso);
            if (!atual) atual = { start: day, end: day, len: 1 };
            else if (indice === state.model.index.get(atual.end.iso) + 1) { atual.end = day; atual.len++; }
            else { runs.push(atual); atual = { start: day, end: day, len: 1 }; }
        });
        if (atual) runs.push(atual);
        return runs;
    }

    function detalharPeriodosFerias(mapa) {
        const runs = periodosDeMapa(mapa, "ferias");
        if (!runs.length) return [];
        const n = state.model.n;
        const off = new Uint8Array(state.model.baseOff);
        Object.keys(mapa).forEach(function (iso) {
            const idx = state.model.index.get(iso);
            if (idx != null) off[idx] = 1;
        });
        return runs.map(function (run, idx) {
            const iStart = state.model.index.get(run.start.iso);
            const iEnd = state.model.index.get(run.end.iso);
            let kStart = iStart;
            let kEnd = iEnd;
            while (kStart > 0 && off[kStart - 1]) kStart--;
            while (kEnd + 1 < n && off[kEnd + 1]) kEnd++;
            const descanso = kEnd - kStart + 1;
            let gastoIlha = 0;
            for (let k = kStart; k <= kEnd; k++) {
                const d = state.model.days[k];
                if (d.inYear && mapa[d.iso]) gastoIlha++;
            }
            const ganhos = Math.max(0, descanso - gastoIlha);
            const meses = {};
            for (let k = iStart; k <= iEnd; k++) {
                const m = state.model.days[k].month;
                meses[m] = (meses[m] || 0) + 1;
            }
            return {
                ordem: idx + 1,
                start: run.start,
                end: run.end,
                len: run.len,
                descanso: descanso,
                ganhos: ganhos,
                restStart: state.model.days[kStart].iso,
                restEnd: state.model.days[kEnd].iso,
                meses: meses
            };
        });
    }

    function renderPdfSummary(report, cfg) {
        const citySelect = document.getElementById("city");
        const cityLabel = citySelect && citySelect.selectedOptions[0] ? citySelect.selectedOptions[0].textContent : "";
        const recSelect = document.getElementById("recesso");
        const recLabel = cfg.recesso !== "nenhum" && recSelect && recSelect.selectedOptions[0]
            ? " · " + recSelect.selectedOptions[0].textContent
            : "";
        const atinStatus = report.atinOk ? "ATIN preservado" : "Perda de ATIN: " + brl.format(report.atinLoss);
        const prStatus = report.prLoss > 0 ? "Desconto PR: " + brl.format(report.prLoss) : "PR sem perda (R$ 0)";
        document.getElementById("pdfHeader").innerHTML =
            '<div class="pdf-cabeca-esq">' +
            '<span class="marca-bolinha"><i class="bi bi-calendar2-check-fill"></i></span>' +
            '<div><h1>Calendário de Férias e Folgas — AFRE ' + cfg.year + '</h1>' +
            '<p>SEFAZ-SP · ' + esc(cityLabel + recLabel) + '</p></div>' +
            '</div>' +
            '<div class="pdf-cabeca-dir">' +
            '<span class="selo ' + (report.atinOk ? "" : "danger") + '">' + esc(atinStatus) + '</span>' +
            '<span class="selo ' + (report.prOk ? (report.prLoss > 0 ? "warn" : "") : "danger") + '">' + esc(prStatus) + '</span>' +
            '</div>';

        const detalhesFerias = detalharPeriodosFerias(state.manual);
        const lps = periodosDeMapa(state.manual, "lp");
        const cards = detalhesFerias.map(function (p) {
            return '<div class="pdf-periodo-card">' +
                '<div class="pdf-periodo-topo"><span class="tag-tipo ferias">' + p.ordem + 'º Período</span>' +
                (p.ordem === 1 ? '<em class="terco">1/3</em>' : "") +
                '<strong>' + p.len + 'd férias</strong></div>' +
                '<div class="pdf-periodo-datas">' + Engine.fmt(p.start.iso) + ' a ' + Engine.fmt(p.end.iso) + '</div>' +
                '<div class="pdf-periodo-ganho">+' + p.ganhos + 'd folga ganhos → <strong>' + p.descanso + 'd descanso</strong></div>' +
                '</div>';
        });
        lps.forEach(function (run) {
            cards.push('<div class="pdf-periodo-card">' +
                '<div class="pdf-periodo-topo"><span class="tag-tipo lp">Lic.-prêmio</span><strong>' + run.len + 'd</strong></div>' +
                '<div class="pdf-periodo-datas">' + Engine.fmt(run.start.iso) + ' a ' + Engine.fmt(run.end.iso) + '</div>' +
                '</div>');
        });
        ["abonada", "eleitoral", "escala"].forEach(function (tipo) {
            const datas = Object.keys(state.manual).filter(function (iso) { return state.manual[iso] === tipo; }).sort().map(function (iso) { return Engine.fmt(iso).slice(0, 5); });
            if (!datas.length) return;
            cards.push('<div class="pdf-periodo-card">' +
                '<div class="pdf-periodo-topo"><span class="tag-tipo ' + tipo + '">' + esc(TIPOS[tipo].short) + '</span><strong>' + datas.length + 'd</strong></div>' +
                '<div class="pdf-periodo-datas">' + datas.join(" · ") + '</div>' +
                '</div>');
        });
        document.getElementById("pdfPeriods").innerHTML = cards.join("");
    }

    function renderLockedControls() {
        const lockedIsos = Object.keys(state.locked);
        const manualIsos = Object.keys(state.manual);
        const banner = document.getElementById("lockedBanner");
        const optBtn = document.getElementById("optRestBtn");
        const calcBtn = document.getElementById("calcBtn");

        const cfg = readConfig();
        const metaFerias = cfg.feriasTotal || 30;
        const baseMap = lockedIsos.length ? state.locked : (!state.activeId ? state.manual : {});
        const feriasRuns = periodosDeMapa(baseMap, "ferias");
        const diasFerias = feriasRuns.reduce(function (s, r) { return s + r.len; }, 0);
        const temSelecaoManual = manualIsos.length > 0 && (!state.activeId || lockedIsos.length > 0);

        const mostrarCardFixo = lockedIsos.length > 0 || temSelecaoManual;
        optBtn.classList.toggle("d-none", true);

        if (mostrarCardFixo) {
            const chips = feriasRuns.map(function (r) {
                const datas = r.len === 1
                    ? Engine.fmt(r.start.iso)
                    : Engine.fmt(r.start.iso).slice(0, 5) + " → " + Engine.fmt(r.end.iso).slice(0, 5);
                return '<span class="fixo-chip"><i class="bi bi-pin-angle-fill"></i> ' + datas + " <em>" + r.len + "d</em></span>";
            });
            const bloqueados = periodosDeMapa(baseMap, "bloqueado");
            const diasBloqueados = bloqueados.reduce(function (s, r) { return s + r.len; }, 0);
            if (diasBloqueados > 0) {
                chips.push('<span class="fixo-chip bloqueado"><i class="bi bi-slash-circle-fill"></i> ' + diasBloqueados + (diasBloqueados === 1 ? " dia bloqueado" : " dias bloqueados") + "</span>");
            }
            const totalBase = lockedIsos.length ? lockedIsos.length : manualIsos.length;
            const outros = totalBase - diasFerias - diasBloqueados;
            if (outros > 0) {
                chips.push('<span class="fixo-chip neutro">+' + outros + (outros === 1 ? " outro" : " outros") + "</span>");
            }
            const parcial = diasFerias > 0 && diasFerias < metaFerias;
            const textoBotao = parcial
                ? '<i class="bi bi-magic"></i> Otimizar ' + (state.expandFixed ? metaFerias + " dias" : "os outros " + (metaFerias - diasFerias) + "d")
                : '<i class="bi bi-magic"></i> Otimizar ' + metaFerias + " dias";
            const seletorModo = parcial
                ? '<div class="fixo-segmento" role="radiogroup" aria-label="Modo de fixação">' +
                    '<button type="button" class="fixo-seg-btn' + (!state.expandFixed ? " ativo" : "") + '" data-expand-fixed="false" title="Mantém apenas os dias marcados neste período e distribui os demais nos outros períodos">' +
                        '<i class="bi bi-lock-fill"></i> Manter exato (' + diasFerias + 'd)' +
                    "</button>" +
                    '<button type="button" class="fixo-seg-btn' + (state.expandFixed ? " ativo" : "") + '" data-expand-fixed="true" title="Garante a data marcada e adiciona mais dias nos arredores para emendar feriados e fins de semana">' +
                        '<i class="bi bi-arrows-angle-expand"></i> Esticar arredores (+dias)' +
                    "</button>" +
                "</div>"
                : "";
            const subtexto = parcial
                ? (state.expandFixed
                    ? "Garante a data marcada e adiciona dias antes/depois no mesmo período para emendar folgas."
                    : "Mantém este período fechado em " + diasFerias + "d e distribui os outros " + (metaFerias - diasFerias) + " dias nos demais períodos.")
                : "Datas fixadas ou bloqueadas para a busca.";
            banner.classList.remove("d-none");
            banner.innerHTML =
                '<div class="fixo-linha-principal">' +
                    '<div class="fixo-esq">' +
                        '<div class="fixo-chips">' + chips.join("") + "</div>" +
                        '<span class="fixo-subtexto">' + esc(subtexto) + "</span>" +
                    "</div>" +
                    '<div class="fixo-dir">' +
                        seletorModo +
                        '<button type="button" class="otimizar-resto" data-run-opt="true">' + textoBotao + "</button>" +
                        '<button type="button" class="desafixar" id="unlockBtn" title="Desmarcar fixação"><i class="bi bi-x-lg"></i></button>' +
                    "</div>" +
                "</div>";
            calcBtn.innerHTML = textoBotao;
        } else {
            banner.classList.add("d-none");
            banner.innerHTML = "";
            calcBtn.innerHTML = '<i class="bi bi-magic"></i> Buscar melhores períodos';
        }
    }

    function renderFinance() {
        const cfg = readConfig();
        const report = Engine.analyze(state.model, cfg, state.manual);
        document.getElementById("liveScore").innerHTML = placarVivo(report);
        document.getElementById("monthBars").innerHTML = report.months.map(function (mes, idx) {
            const dil = report.diligencias[idx];
            const pct = Math.min(100, mes.days / 20 * 100);
            const classe = zona(mes.days);
            const visita = dil.remaining < dil.required ? "danger" : "ok";
            return '<article class="medidor"><header><span>' + MESES[mes.month] + '</span><span class="' + (classe || "ok") + '">' + mes.days + '/20</span></header>' +
                '<div class="trilho ' + classe + '"><span style="width:' + pct + '%"></span></div>' +
                '<p class="' + visita + '">' + dil.remaining + " dias úteis · cabem " + dil.capacity + " visitas</p>" +
                (mes.lost ? '<p class="danger">Perde o ATIN: ' + brl.format(mes.value) + "</p>" : "<p>ATIN " + brl.format(mes.value) + "</p>") +
                "</article>";
        }).join("");
        document.getElementById("quarterBars").innerHTML = report.quarters.map(function (q) {
            const pct = Math.min(100, q.non / Math.max(1, q.safe) * 100);
            const classe = q.cliff ? "danger" : q.non ? "warn" : "";
            const margem = Math.max(0, q.safe - q.non);
            const conta = q.cliff
                ? "Passou de 1/3 do trimestre. Perda de 100%."
                : q.non + "/" + q.days + " × " + brl.format(cfg.pr) + " = " + brl.format(q.loss) + ". Margem: " + margem + (margem === 1 ? " dia." : " dias.");
            return '<article class="trimestre"><header><span>' + (q.q + 1) + 'º trimestre</span><span class="' + (classe || "ok") + '">' + brl.format(q.loss) + "</span></header>" +
                '<div class="trilho ' + classe + '"><span style="width:' + pct + '%"></span></div>' +
                '<p class="' + (classe || "ok") + '">' + q.non + " de " + q.safe + " dias sem efetivo exercício</p><p>" + conta + "</p></article>";
        }).join("");
        renderValidation(report, cfg);
        renderLockedControls();
        renderPdfSummary(report, cfg);
    }

    function periodos(tipo) {
        return periodosDeMapa(state.manual, tipo);
    }

    function renderValidation(report, cfg) {
        const notas = [];
        function push(nivel, texto) { notas.push({ nivel: nivel, texto: texto }); }
        const ferias = periodos("ferias");
        const metaFerias = cfg.feriasTotal || 30;
        if (report.used.ferias > metaFerias) {
            push("danger", "Férias no calendário: " + report.used.ferias + " dias (acima dos " + metaFerias + " dias configurados).");
        }
        if (report.used.ferias === metaFerias) {
            push("ok", "Férias completas: " + metaFerias + " dias em " + ferias.length + (ferias.length > 1 ? " períodos" : " período") + " · ATIN e PR verificados.");
        }
        if (ferias.length > 3) push("danger", "Há " + ferias.length + " períodos de férias. O limite é 3.");
        ferias.forEach(function (run, idx) {
            if (!run.start.plain) push("danger", "O " + (idx + 1) + "º período começa em " + Engine.fmt(run.start.iso) + ", dia que já seria folga.");
            if (!run.end.plain) push("danger", "O " + (idx + 1) + "º período termina em " + Engine.fmt(run.end.iso) + ", dia que já seria folga.");
        });
        if ((report.used.lp || 0) >= 15) {
            periodos("lp").forEach(function (run) {
                if (run.len < 15) push("danger", "Licença-prêmio de " + run.len + " dias em " + Engine.fmt(run.start.iso) + ". O piso é 15.");
            });
        }
        Object.keys(report.abMonth).forEach(function (mes) {
            if (report.abMonth[mes] > 1) push("danger", MESES[mes] + " tem " + report.abMonth[mes] + " faltas abonadas. O limite é uma por mês.");
        });
        if ((report.used.abonada || 0) > 6) push("danger", "Há mais de 6 faltas abonadas no ano.");
        report.months.forEach(function (mes) {
            if (mes.lost) push("danger", MESES[mes.month] + " passou de 20 dias. Perda do ATIN: " + brl.format(mes.value) + ".");
            else if (mes.days >= 19) push("warn", MESES[mes.month] + " está em " + mes.days + "/20 dias de afastamento.");
        });
        report.quarters.forEach(function (q) {
            if (q.cliff) push("danger", "Abismo da PR no " + (q.q + 1) + "º trimestre: " + q.non + " dias, acima de " + q.safe + ". Perda de " + brl.format(cfg.pr) + ".");
        });
        report.diligencias.forEach(function (d) {
            const temAfastamento = Object.keys(state.manual).some(function (iso) {
                const i = state.model.index.get(iso);
                return i != null && state.model.days[i].month === d.month;
            });
            if (temAfastamento && d.remaining < d.required) {
                push("danger", MESES[d.month] + " fica com " + d.remaining + (d.remaining === 1 ? " dia útil" : " dias úteis") + ". Para 6 diligências, precisa de " + d.required + ".");
            }
        });
        const host = document.getElementById("validation");
        host.innerHTML = notas.map(function (n) { return '<p class="alerta ' + n.nivel + '">' + esc(n.texto) + "</p>"; }).join("");
    }

    function dicaDia(day, leave, isLocked, offSimulado, atinMes, abMes) {
        let base = diaCurto(day.iso) + " (" + SEMANA[day.dow] + ")";
        if (day.holiday) base += " · " + day.holiday.name;
        if (leave) base += " · " + TIPOS[leave].label + (isLocked ? " (fixado)" : "");
        if (!leave && day.plain) {
            const idx = state.model.index.get(day.iso);
            let esq = 0;
            for (let k = idx - 1; k >= 0 && offSimulado[k]; k--) esq++;
            let dir = 0;
            for (let k = idx + 1; k < state.model.n && offSimulado[k]; k++) dir++;
            const emenda = esq + dir;
            if (emenda > 0) {
                base += " — Se marcar aqui: +" + emenda + "d emendados (" + (emenda + 1) + "d seguidos)";
            }
            base += " · ATIN " + MESES[day.month].slice(0, 3) + ": " + atinMes + "/20";
            if (state.paint === "abonada" && abMes >= 1) {
                base += " · Já há 1 abonada no mês";
            }
        }
        return base;
    }

    function diaCurto(iso) {
        const p = iso.split("-");
        return Number(p[2]) + " de " + MESES[Number(p[1]) - 1] + " de " + p[0];
    }

    function renderCalendar() {
        const year = state.model.year;
        const hoje = new Date();
        const hojeIso = hoje.getFullYear() + "-" + String(hoje.getMonth() + 1).padStart(2, "0") + "-" + String(hoje.getDate()).padStart(2, "0");
        const detalhesFerias = detalharPeriodosFerias(state.manual);
        const offSimulado = new Uint8Array(state.model.baseOff);
        Object.keys(state.manual).forEach(function (iso) {
            const i = state.model.index.get(iso);
            const t = state.manual[iso];
            if (i != null && TIPOS[t] && !TIPOS[t].blocked) offSimulado[i] = 1;
        });
        let html = "";
        for (let mes = 0; mes < 12; mes++) {
            const primeiro = new Date(Date.UTC(year, mes, 1));
            const vazio = primeiro.getUTCDay();
            const total = new Date(Date.UTC(year, mes + 1, 0)).getUTCDate();
            const cabeca = ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"].map(function (d) {
                return '<span class="dow">' + d + "</span>";
            }).join("");
            let celulas = "";
            for (let i = 0; i < vazio; i++) celulas += '<span class="vazio"></span>';
            let afastadosMes = 0;
            let abonadasMes = 0;
            for (let dia = 1; dia <= total; dia++) {
                const iso = year + "-" + String(mes + 1).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
                const lv = state.manual[iso] || "";
                if (lv && TIPOS[lv] && TIPOS[lv].atin) afastadosMes++;
                if (lv === "abonada") abonadasMes++;
            }
            for (let dia = 1; dia <= total; dia++) {
                const iso = year + "-" + String(mes + 1).padStart(2, "0") + "-" + String(dia).padStart(2, "0");
                const day = state.model.days[state.model.index.get(iso)];
                const leave = state.manual[iso] || "";
                const isLocked = Boolean(state.locked[iso]);
                const rotulo = dicaDia(day, leave, isLocked, offSimulado, afastadosMes, abonadasMes);
                celulas += '<button type="button" class="' + classeDia(day, leave, isLocked) + '" data-iso="' + iso + '" aria-label="' + esc(rotulo) + '" title="' + esc(rotulo) + '"' +
                    (iso === hojeIso ? ' style="outline:2px solid var(--verde)"' : "") + ">" + dia + "</button>";
            }
            const tagMes = afastadosMes > 0
                ? '<span class="mes-atin ' + zona(afastadosMes) + '">' + afastadosMes + "/20</span>"
                : "";
            const periodosMes = detalhesFerias.filter(function (p) { return p.meses[mes]; });
            const rodapeFerias = periodosMes.length
                ? '<div class="mes-periodos">' + periodosMes.map(function (p) {
                    const qtdMeses = Object.keys(p.meses).length;
                    const infoDias = qtdMeses > 1 ? p.meses[mes] + "d no mês" : p.len + "d férias";
                    return '<div class="mes-periodo-item">' +
                        '<span class="mes-periodo-badge">' + p.ordem + 'º Período <small>· ' + infoDias + '</small></span>' +
                        '<span class="mes-periodo-ganho">+' + p.ganhos + 'd folga <strong>(' + p.descanso + 'd)</strong></span>' +
                        '</div>';
                }).join("") + '</div>'
                : "";
            html += '<article class="mes' + (periodosMes.length ? " com-ferias" : "") + '"><h3>' + MESES[mes] + tagMes + '</h3><div class="grade">' + cabeca + celulas + "</div>" + rodapeFerias + "</article>";
        }
        document.getElementById("calendar").innerHTML = html;
    }

    function renderHolidayList() {
        const linhas = Array.from(state.model.holidayMap.values()).sort(function (a, b) { return a.iso < b.iso ? -1 : 1; });
        document.getElementById("holidayList").innerHTML = linhas.map(function (h) {
            const ligado = !state.disabled[h.iso];
            return '<label class="item-feriado"><input type="checkbox" data-holiday="' + h.iso + '"' + (ligado ? " checked" : "") + ">" +
                "<span><strong>" + Engine.fmt(h.iso) + "</strong> · " + esc(h.name) + ' <small class="tag-feriado ' + esc(h.kind) + '">' + esc(h.kind) + (h.scope ? " · " + esc(h.scope) : "") + "</small>" +
                (h.note ? "<br><small>" + esc(h.note) + "</small>" : "") +
                (h.source === "custom" ? ' <button type="button" class="secundario" data-remove-custom="' + h.iso + '">remover</button>' : "") +
                "</span></label>";
        }).join("");
    }

    function renderChrome() {
        const cfg = readConfig();
        document.getElementById("atinPreview").textContent = "ATIN mensal = 300 × " + brl.format(cfg.ufesp) + " = " + brl.format(Engine.cents(300 * cfg.ufesp)) + ". Vinte dias ainda preservam o mês.";
        document.getElementById("customMonths").classList.toggle("d-none", document.getElementById("period").value !== "custom");
        const mode1Sub = document.getElementById("mode1Sub");
        if (mode1Sub) mode1Sub.textContent = cfg.feriasTotal + (cfg.feriasTotal === 1 ? " dia corrido" : " dias corridos");
        const rec = Engine.recessoInfo(cfg.year);
        const optNatal = document.querySelector('#recesso option[value="natal"]');
        const optAnoNovo = document.querySelector('#recesso option[value="anonovo"]');
        if (optNatal) optNatal.textContent = "Recesso — Natal (" + Engine.fmt(rec.natal.start).slice(0, 5) + " a " + Engine.fmt(rec.natal.end).slice(0, 5) + ")";
        if (optAnoNovo) optAnoNovo.textContent = "Recesso — Ano Novo (" + Engine.fmt(rec.anonovo.start).slice(0, 5) + " a " + Engine.fmt(rec.anonovo.end).slice(0, 5) + ")";
        const data = document.getElementById("hDate");
        data.min = cfg.year + "-01-01";
        data.max = cfg.year + "-12-31";
    }

    function vazio() {
        document.getElementById("scenarios").innerHTML = '<p class="aviso-calc" style="text-align:center;margin-top:1rem">Clique em <strong>Buscar melhores períodos</strong> para gerar as 3 estratégias.</p>';
    }

    function rebuild() {
        const cfg = readConfig();
        document.getElementById("year").value = cfg.year;
        state.model = Engine.buildModel(cfg.year, Engine.buildHolidayMap(cfg.year, cfg.city, state.custom, state.disabled, cfg.recesso));
        state.plans = [];
        state.activeId = null;
        renderChrome();
        renderHolidayList();
        renderCalendar();
        renderFinance();
        vazio();
        document.getElementById("calcMsg").textContent = "";
    }

    function paint(iso, shift) {
        const tipo = state.paint;
        if (state.activeId) {
            state.activeId = null;
        }
        const usarIntervalo = (shift && state.anchor && state.anchor !== iso) || (state.rangeMode && state.rangeStart && state.rangeStart !== iso);
        if (state.rangeMode && !state.rangeStart && !shift) {
            state.rangeStart = iso;
            state.anchor = iso;
            atualizarDicaPintura();
            renderCalendar();
            return;
        }
        if (usarIntervalo) {
            const origem = (state.rangeMode && state.rangeStart) ? state.rangeStart : state.anchor;
            const a = state.model.index.get(origem);
            const b = state.model.index.get(iso);
            for (let i = Math.min(a, b); i <= Math.max(a, b); i++) {
                const day = state.model.days[i];
                if (!day.inYear) continue;
                if (tipo === "apagar") {
                    delete state.manual[day.iso];
                    delete state.locked[day.iso];
                } else {
                    state.manual[day.iso] = tipo;
                    state.locked[day.iso] = tipo;
                }
            }
            state.rangeStart = null;
        } else if (tipo === "apagar" || state.manual[iso] === tipo) {
            delete state.manual[iso];
            delete state.locked[iso];
            state.rangeStart = null;
        } else {
            state.manual[iso] = tipo;
            state.locked[iso] = tipo;
            state.rangeStart = null;
        }
        state.anchor = iso;
        atualizarDicaPintura();
        renderCalendar();
        renderFinance();
        save();
    }

    function atualizarDicaPintura() {
        const hint = document.getElementById("paintHint");
        const btn = document.getElementById("rangeModeBtn");
        if (!hint || !btn) return;
        btn.setAttribute("aria-pressed", state.rangeMode ? "true" : "false");
        if (!state.rangeMode) {
            hint.textContent = "Clique marca um dia · Shift+clique preenche o intervalo.";
        } else if (state.rangeStart) {
            hint.innerHTML = "Início em <strong>" + Engine.fmt(state.rangeStart).slice(0, 5) + "</strong> — toque no dia final para preencher.";
        } else {
            hint.textContent = "Toque no 1º dia (início) e depois no 2º dia (fim) para preencher.";
        }
    }

    function sanitizarMapa(obj) {
        const limpo = {};
        if (!obj || typeof obj !== "object") return limpo;
        Object.keys(obj).forEach(function (iso) {
            if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && TIPOS[obj[iso]]) {
                limpo[iso] = obj[iso];
            }
        });
        return limpo;
    }

    function save() {
        try {
            const dados = {
                manual: state.manual,
                locked: state.locked,
                expandFixed: state.expandFixed,
                custom: state.custom,
                disabled: state.disabled,
                paint: state.paint,
                theme: document.body.classList.contains("tema-escuro") ? "dark" : "light"
            };
            ["year", "period", "monthFrom", "monthTo", "feriasTotal", "minBlock", "minOneBlock", "lp", "abonadas", "eleitoral", "escala", "ufesp", "maxDil", "city", "recesso"].forEach(function (id) {
                dados[id] = document.getElementById(id).value;
            });
            dados.pr = document.getElementById("prValor").value;
            dados.mode = (document.querySelector('input[name="feriasMode"]:checked') || {}).value;
            localStorage.setItem("afre-folga-v2", JSON.stringify(dados));
        } catch (err) { /* armazenamento indisponível */ }
    }

    function restore() {
        try {
            const dados = JSON.parse(localStorage.getItem("afre-folga-v2") || "null");
            if (!dados || typeof dados !== "object") return;
            ["year", "period", "monthFrom", "monthTo", "feriasTotal", "minBlock", "minOneBlock", "lp", "abonadas", "eleitoral", "escala", "ufesp", "maxDil", "city", "recesso"].forEach(function (id) {
                if (dados[id] != null && document.getElementById(id)) document.getElementById(id).value = String(dados[id]);
            });
            if (dados.pr != null) document.getElementById("prValor").value = String(dados.pr);
            if (dados.mode && ["1", "2", "3"].indexOf(String(dados.mode)) !== -1) {
                const radio = document.querySelector('input[name="feriasMode"][value="' + dados.mode + '"]');
                if (radio) radio.checked = true;
            }
            state.manual = sanitizarMapa(dados.manual);
            state.locked = sanitizarMapa(dados.locked);
            state.expandFixed = Boolean(dados.expandFixed);
            state.custom = Array.isArray(dados.custom)
                ? dados.custom.filter(function (c) { return c && /^\d{4}-\d{2}-\d{2}$/.test(c.iso) && typeof c.name === "string"; }).map(function (c) {
                    return { iso: c.iso, name: c.name.slice(0, 80), kind: c.kind === "facultativo" ? "facultativo" : "feriado" };
                })
                : [];
            state.disabled = {};
            if (dados.disabled && typeof dados.disabled === "object") {
                Object.keys(dados.disabled).forEach(function (iso) {
                    if (/^\d{4}-\d{2}-\d{2}$/.test(iso) && dados.disabled[iso]) state.disabled[iso] = true;
                });
            }
            state.paint = (dados.paint && (TIPOS[dados.paint] || dados.paint === "apagar")) ? dados.paint : "ferias";
            if (dados.theme === "dark") document.body.classList.add("tema-escuro");
            if (dados.theme === "light") document.body.classList.remove("tema-escuro");
        } catch (err) { /* preferência antiga ou inválida */ }
    }

    function restaurarDaUrl() {
        try {
            const hash = location.hash ? location.hash.slice(1) : "";
            if (!hash || hash.indexOf("plano=") === -1) return false;
            const params = new URLSearchParams(hash);
            const raw = params.get("plano");
            if (!raw) return false;
            const json = decodeURIComponent(escape(atob(raw)));
            const dados = JSON.parse(json);
            if (!dados || typeof dados !== "object") return false;
            ["year", "period", "monthFrom", "monthTo", "feriasTotal", "minBlock", "minOneBlock", "lp", "abonadas", "eleitoral", "escala", "city", "recesso"].forEach(function (id) {
                if (dados[id] != null && document.getElementById(id)) document.getElementById(id).value = String(dados[id]);
            });
            if (dados.mode && ["1", "2", "3"].indexOf(String(dados.mode)) !== -1) {
                const radio = document.querySelector('input[name="feriasMode"][value="' + dados.mode + '"]');
                if (radio) radio.checked = true;
            }
            state.manual = sanitizarMapa(dados.manual);
            state.locked = sanitizarMapa(dados.locked);
            state.expandFixed = Boolean(dados.expandFixed);
            return true;
        } catch (err) {
            return false;
        }
    }

    function gerarLinkCompartilhamento() {
        const payload = {
            year: document.getElementById("year").value,
            period: document.getElementById("period").value,
            city: document.getElementById("city").value,
            recesso: document.getElementById("recesso").value,
            feriasTotal: document.getElementById("feriasTotal").value,
            mode: (document.querySelector('input[name="feriasMode"]:checked') || {}).value,
            minBlock: document.getElementById("minBlock").value,
            minOneBlock: document.getElementById("minOneBlock").value,
            lp: document.getElementById("lp").value,
            abonadas: document.getElementById("abonadas").value,
            eleitoral: document.getElementById("eleitoral").value,
            escala: document.getElementById("escala").value,
            manual: state.manual,
            locked: state.locked,
            expandFixed: state.expandFixed
        };
        const b64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
        return location.origin + location.pathname + "#plano=" + b64;
    }

    function proximoDiaIso(iso) {
        const p = iso.split("-").map(Number);
        const dt = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1));
        return dt.getUTCFullYear() + "-" + String(dt.getUTCMonth() + 1).padStart(2, "0") + "-" + String(dt.getUTCDate()).padStart(2, "0");
    }

    function exportarIcs() {
        if (!Object.keys(state.manual).length && state.plans.length) {
            aplicarPlano(0, false);
        }
        const cfg = readConfig();
        const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
        const eventos = [];
        const detalhesFerias = detalharPeriodosFerias(state.manual);
        detalhesFerias.forEach(function (p) {
            eventos.push({
                uid: "afre-ferias-" + cfg.year + "-" + p.ordem + "@sefaz-sp",
                start: p.start.iso.replace(/-/g, ""),
                end: proximoDiaIso(p.end.iso).replace(/-/g, ""),
                summary: "Férias AFRE — " + p.ordem + "º Período (" + p.len + "d)",
                desc: "Período de férias: " + Engine.fmt(p.start.iso) + " a " + Engine.fmt(p.end.iso) + " (" + p.len + " dias). Descanso contínuo emendado: " + p.descanso + " dias (" + Engine.fmt(p.restStart) + " a " + Engine.fmt(p.restEnd) + ")."
            });
        });
        ["lp", "abonada", "eleitoral", "escala", "saude", "nojo"].forEach(function (tipo) {
            periodosDeMapa(state.manual, tipo).forEach(function (run, idx) {
                eventos.push({
                    uid: "afre-" + tipo + "-" + cfg.year + "-" + (idx + 1) + "@sefaz-sp",
                    start: run.start.iso.replace(/-/g, ""),
                    end: proximoDiaIso(run.end.iso).replace(/-/g, ""),
                    summary: TIPOS[tipo].label + " — AFRE (" + run.len + "d)",
                    desc: TIPOS[tipo].label + ": " + Engine.fmt(run.start.iso) + " a " + Engine.fmt(run.end.iso) + "."
                });
            });
        });
        if (!eventos.length) return false;
        const linhas = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Folga AFRE SEFAZ-SP//PT-BR",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH"
        ];
        eventos.forEach(function (ev) {
            linhas.push(
                "BEGIN:VEVENT",
                "UID:" + ev.uid,
                "DTSTAMP:" + stamp,
                "DTSTART;VALUE=DATE:" + ev.start,
                "DTEND;VALUE=DATE:" + ev.end,
                "SUMMARY:" + ev.summary,
                "DESCRIPTION:" + ev.desc,
                "TRANSP:OPAQUE",
                "END:VEVENT"
            );
        });
        linhas.push("END:VCALENDAR");
        const blob = new Blob([linhas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ferias-afre-" + cfg.year + ".ics";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        return true;
    }

    function rotuloTema() {
        const escuro = document.body.classList.contains("tema-escuro");
        document.getElementById("themeBtn").textContent = escuro ? "Tema claro" : "Tema escuro";
    }

    function syncTintas() {
        document.querySelectorAll("[data-paint]").forEach(function (botao) {
            botao.setAttribute("aria-pressed", botao.getAttribute("data-paint") === state.paint ? "true" : "false");
        });
    }

    function limparCenarios(texto) {
        state.plans = [];
        state.activeId = null;
        document.getElementById("scenarios").innerHTML = '<p class="aviso-calc" style="text-align:center;margin-top:1rem">' + texto + "</p>";
    }

    function aplicarPlano(idx, scrollToCalendar) {
        const plan = state.plans[idx];
        if (!plan) return;
        state.manual = Object.assign({}, plan.leaveMap);
        state.activeId = plan.id;
        renderScenarios({ plans: state.plans });
        renderCalendar();
        renderFinance();
        save();
        if (scrollToCalendar) {
            document.getElementById("calendar").scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }

    function executarBusca(scrollToResults) {
        const botao = document.getElementById("calcBtn");
        const msg = document.getElementById("calcMsg");
        botao.disabled = true;
        botao.innerHTML = '<i class="bi bi-hourglass-split"></i> Buscando…';
        msg.textContent = "";
        const fixedMap = Object.keys(state.locked).length ? state.locked : null;
        setTimeout(function () {
            try {
                const resultado = Engine.optimize(state.model, readConfig(), fixedMap);
                state.plans = resultado.plans || [];
                if (state.plans.length) {
                    state.manual = Object.assign({}, state.plans[0].leaveMap);
                    state.activeId = state.plans[0].id;
                    renderScenarios(resultado);
                    renderCalendar();
                    renderFinance();
                    save();
                } else {
                    state.activeId = null;
                    renderScenarios(resultado);
                }
                if (resultado.error) {
                    msg.textContent = "";
                } else if (fixedMap) {
                    msg.textContent = "1ª estratégia já aplicada no calendário abaixo · Clique nos cartões para alternar.";
                } else {
                    msg.textContent = "1ª estratégia (Máximo descanso) já aplicada no calendário abaixo · Clique nos cartões para alternar.";
                }
                if (scrollToResults) {
                    document.getElementById("scenarios").scrollIntoView({ behavior: "smooth", block: "start" });
                }
            } catch (err) {
                renderScenarios({ error: "Falha ao buscar: " + err.message });
            } finally {
                botao.disabled = false;
                renderLockedControls();
            }
        }, 30);
    }

    function init() {
        const de = document.getElementById("monthFrom");
        const ate = document.getElementById("monthTo");
        MESES.forEach(function (nome, i) {
            de.insertAdjacentHTML("beforeend", '<option value="' + (i + 1) + '">' + nome + "</option>");
            ate.insertAdjacentHTML("beforeend", '<option value="' + (i + 1) + '"' + (i === 11 ? " selected" : "") + ">" + nome + "</option>");
        });
        document.getElementById("paintbar").innerHTML = TINTAS.map(function (tinta) {
            const cor = tinta[0] === "apagar" ? "transparent" : "var(--" + tinta[0] + ")";
            const icone = tinta[0] === "apagar"
                ? '<i class="bi bi-eraser"></i>'
                : tinta[0] === "bloqueado"
                    ? '<i class="bi bi-slash-circle-fill" style="color:var(--bloqueado)"></i>'
                    : '<i class="ponto-tinta" style="background:' + cor + '"></i>';
            return '<button type="button" class="tinta" data-paint="' + tinta[0] + '">' + icone + tinta[1] + "</button>";
        }).join("");
        const amostras = [
            ["var(--fds)", "Fim de semana"], ["var(--feriado)", "Feriado"], ["var(--facul)", "Ponto facultativo"],
            ["var(--ferias)", "Férias"], ["var(--lp)", "Licença-prêmio"], ["var(--abonada)", "Abonada"],
            ["var(--eleitoral)", "Eleitoral"], ["var(--escala)", "Escala"], ["var(--bloqueado)", "Bloqueado"]
        ];
        document.getElementById("legend").innerHTML = amostras.map(function (item) {
            return '<span><i class="amostra" style="background:' + item[0] + '"></i>' + item[1] + "</span>";
        }).join("");

        const erros = Engine.holidaySelfCheck();
        if (erros.length) {
            const audit = document.getElementById("audit");
            audit.classList.remove("d-none");
            audit.textContent = "Auditoria do calendário falhou: " + erros.join(", ") + ".";
        }
        const guardado = (function () {
            try { return JSON.parse(localStorage.getItem("afre-folga-v1") || "{}").theme; } catch (err) { return null; }
        })();
        if (guardado === "dark") {
            document.body.classList.add("tema-escuro");
        }
        restore();
        restaurarDaUrl();
        rotuloTema();
        syncTintas();
        atualizarDicaPintura();
        rebuild();
    }

    document.getElementById("themeBtn").addEventListener("click", function () {
        document.body.classList.toggle("tema-escuro");
        rotuloTema();
        save();
    });
    document.getElementById("paintbar").addEventListener("click", function (ev) {
        const botao = ev.target.closest("[data-paint]");
        if (!botao) return;
        state.paint = botao.getAttribute("data-paint");
        syncTintas();
        save();
    });
    document.getElementById("rangeModeBtn").addEventListener("click", function () {
        state.rangeMode = !state.rangeMode;
        state.rangeStart = null;
        atualizarDicaPintura();
        renderCalendar();
    });
    document.getElementById("calendar").addEventListener("click", function (ev) {
        const dia = ev.target.closest("[data-iso]");
        if (!dia) return;
        paint(dia.getAttribute("data-iso"), ev.shiftKey);
    });
    document.getElementById("icsBtn").addEventListener("click", function () {
        const btn = document.getElementById("icsBtn");
        if (!exportarIcs()) {
            const original = btn.innerHTML;
            btn.innerHTML = '<i class="bi bi-exclamation-circle"></i> Marque ou busque antes';
            setTimeout(function () { btn.innerHTML = original; }, 2000);
        }
    });
    document.getElementById("shareBtn").addEventListener("click", function () {
        if (!Object.keys(state.manual).length && state.plans.length) {
            aplicarPlano(0, false);
        }
        const url = gerarLinkCompartilhamento();
        if (history.replaceState) history.replaceState(null, "", url);
        const btn = document.getElementById("shareBtn");
        const original = '<i class="bi bi-share-fill"></i> Compartilhar';
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(url).then(function () {
                btn.innerHTML = '<i class="bi bi-check2"></i> Link copiado!';
                setTimeout(function () { btn.innerHTML = original; }, 2200);
            }).catch(function () {
                btn.innerHTML = '<i class="bi bi-check2"></i> Link na barra!';
                setTimeout(function () { btn.innerHTML = original; }, 2200);
            });
        } else {
            btn.innerHTML = '<i class="bi bi-check2"></i> Link na barra!';
            setTimeout(function () { btn.innerHTML = original; }, 2200);
        }
    });
    document.getElementById("pdfBtn").addEventListener("click", function () {
        if (!Object.keys(state.manual).length && state.plans.length) {
            aplicarPlano(0, false);
        }
        document.body.classList.add("imprimindo-calendario");
        window.print();
    });
    window.addEventListener("afterprint", function () {
        document.body.classList.remove("imprimindo-calendario");
    });
    document.getElementById("clearBtn").addEventListener("click", function () {
        state.manual = {};
        state.locked = {};
        state.rangeStart = null;
        state.activeId = null;
        atualizarDicaPintura();
        renderCalendar();
        renderFinance();
        save();
    });
    function dispararOtimizacaoRestante() {
        if (!Object.keys(state.locked).length && Object.keys(state.manual).length) {
            state.locked = Object.assign({}, state.manual);
        }
        renderCalendar();
        renderFinance();
        save();
        executarBusca(true);
    }
    document.getElementById("optRestBtn").addEventListener("click", dispararOtimizacaoRestante);
    document.getElementById("lockedBanner").addEventListener("click", function (ev) {
        if (ev.target.closest("[data-run-opt]")) {
            dispararOtimizacaoRestante();
            return;
        }
        const modoBtn = ev.target.closest("[data-expand-fixed]");
        if (modoBtn) {
            state.expandFixed = modoBtn.getAttribute("data-expand-fixed") === "true";
            renderLockedControls();
            save();
            if (state.plans.length) executarBusca(false);
            return;
        }
        if (!ev.target.closest("#unlockBtn")) return;
        state.locked = {};
        if (!state.activeId) state.manual = {};
        renderCalendar();
        renderFinance();
        save();
    });
    document.getElementById("scenarios").addEventListener("click", function (ev) {
        const salto = ev.target.closest("[data-jump]");
        if (salto) {
            const idx = Number(salto.getAttribute("data-jump"));
            aplicarPlano(idx, false);
            const card = document.querySelector('[data-plan="' + idx + '"]');
            if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
            return;
        }
        const botao = ev.target.closest("[data-apply]");
        if (!botao) return;
        aplicarPlano(Number(botao.getAttribute("data-apply")), true);
    });
    document.getElementById("busca").addEventListener("submit", function (ev) {
        ev.preventDefault();
        executarBusca(false);
    });
    ["year", "period", "monthFrom", "monthTo", "city", "recesso"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", function () {
            rebuild();
            save();
        });
    });
    ["feriasTotal", "minBlock", "minOneBlock", "lp", "abonadas", "eleitoral", "escala", "ufesp", "prValor", "maxDil"].forEach(function (id) {
        document.getElementById(id).addEventListener("change", function () {
            limparCenarios("Parâmetros alterados. Busque de novo.");
            renderChrome();
            renderFinance();
            save();
        });
    });
    document.getElementById("feriasMode").addEventListener("change", function () {
        limparCenarios("Modelo de férias alterado. Busque de novo.");
        save();
    });
    document.getElementById("addHoliday").addEventListener("submit", function (ev) {
        ev.preventDefault();
        const iso = document.getElementById("hDate").value;
        const name = document.getElementById("hName").value.trim();
        const kind = document.getElementById("hKind").value;
        if (!iso || !name) return;
        state.custom = state.custom.filter(function (item) { return item.iso !== iso; });
        state.custom.push({ iso: iso, name: name, kind: kind });
        delete state.disabled[iso];
        document.getElementById("hName").value = "";
        rebuild();
        save();
    });
    document.getElementById("holidayList").addEventListener("change", function (ev) {
        const iso = ev.target.getAttribute("data-holiday");
        if (!iso) return;
        if (ev.target.checked) delete state.disabled[iso];
        else state.disabled[iso] = true;
        rebuild();
        save();
    });
    document.getElementById("holidayList").addEventListener("click", function (ev) {
        const iso = ev.target.getAttribute("data-remove-custom");
        if (!iso) return;
        ev.preventDefault();
        state.custom = state.custom.filter(function (item) { return item.iso !== iso; });
        delete state.disabled[iso];
        rebuild();
        save();
    });
    document.getElementById("restoreBtn").addEventListener("click", function () {
        state.custom = [];
        state.disabled = {};
        rebuild();
        save();
    });

    init();
})();
