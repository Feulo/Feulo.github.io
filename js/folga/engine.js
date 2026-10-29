(function (root, factory) {
    const api = factory();
    if (typeof module === "object" && module.exports) module.exports = api;
    root.FolgaEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
    "use strict";

    const DAY = 86400000;
    const MESES = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    const SEMANA = ['domingo','segunda','terça','quarta','quinta','sexta','sábado'];
    const TYPE_META = {
      ferias: { label: 'Férias', short: 'Férias', atin: true, pr: false },
      lp: { label: 'Licença-prêmio', short: 'Lic.-prêmio', atin: true, pr: true },
      abonada: { label: 'Falta abonada', short: 'Abonada', atin: true, pr: true },
      eleitoral: { label: 'Eleitoral / doação', short: 'Eleitoral', atin: true, pr: true },
      escala: { label: 'Escala / plantão', short: 'Escala', atin: false, pr: false },
      saude: { label: 'Licença-saúde', short: 'Saúde', atin: true, pr: true },
      nojo: { label: 'Nojo / gala', short: 'Nojo/gala', atin: true, pr: false },
      bloqueado: { label: 'Expediente obrigatório (bloqueado)', short: 'Bloqueado', atin: false, pr: false, blocked: true }
    };
    const CITY_PRESETS = {
      saopaulo: {
        label: 'São Paulo',
        holidays: [{ month: 1, day: 25, name: 'Aniversário de São Paulo' }]
      },
      dtic: {
        label: 'São Paulo',
        holidays: [{ month: 1, day: 25, name: 'Aniversário de São Paulo' }]
      },
      santos: {
        label: 'Santos',
        holidays: [
          { month: 1, day: 26, name: 'Aniversário de Santos' },
          { month: 9, day: 8, name: 'Nossa Senhora do Monte Serrat' }
        ]
      },
      taubate: {
        label: 'Taubaté',
        holidays: [
          { month: 2, day: 5, name: 'Elevação de Taubaté a cidade' },
          { easterDelta: 1, name: 'Festa de São Benedito' },
          { month: 10, day: 4, name: 'São Francisco das Chagas' }
        ]
      },
      sorocaba: {
        label: 'Sorocaba',
        holidays: [{ month: 8, day: 15, name: 'Aniversário de Sorocaba · N. Sra. da Ponte' }]
      },
      campinas: {
        label: 'Campinas',
        holidays: [{ month: 12, day: 8, name: 'Nossa Senhora da Conceição' }]
      },
      ribeirao: {
        label: 'Ribeirão Preto',
        holidays: [
          { month: 1, day: 20, name: 'São Sebastião' },
          { month: 6, day: 19, name: 'Aniversário de Ribeirão Preto' }
        ]
      },
      bauru: {
        label: 'Bauru',
        holidays: [{ month: 8, day: 1, name: 'Aniversário de Bauru' }]
      },
      riopreto: {
        label: 'São José do Rio Preto',
        holidays: [
          { month: 3, day: 19, name: 'Aniversário de São José do Rio Preto · São José' },
          { month: 12, day: 8, name: 'Imaculada Conceição' }
        ]
      },
      aracatuba: {
        label: 'Araçatuba',
        holidays: [{ month: 12, day: 2, name: 'Aniversário de Araçatuba' }]
      },
      prudente: {
        label: 'Presidente Prudente',
        holidays: [
          { month: 1, day: 20, name: 'São Sebastião' },
          { month: 9, day: 14, name: 'Aniversário de Presidente Prudente' },
          { month: 12, day: 8, name: 'Imaculada Conceição' }
        ]
      },
      marilia: {
        label: 'Marília',
        holidays: [
          { month: 4, day: 4, name: 'Aniversário de Marília' },
          { month: 7, day: 11, name: 'São Bento' },
          { month: 12, day: 8, name: 'Imaculada Conceição' }
        ]
      },
      abcd: {
        label: 'São Bernardo do Campo',
        holidays: [{ month: 8, day: 20, name: 'Aniversário de São Bernardo do Campo' }]
      },
      santoandre: {
        label: 'Santo André',
        holidays: [{ month: 4, day: 8, name: 'Aniversário de Santo André' }]
      },
      guarulhos: {
        label: 'Guarulhos',
        holidays: [{ month: 12, day: 8, name: 'Aniversário de Guarulhos · N. Sra. da Conceição' }]
      },
      osasco: {
        label: 'Osasco',
        holidays: [
          { month: 2, day: 19, name: 'Emancipação de Osasco' },
          { month: 6, day: 13, name: 'Santo Antônio' }
        ]
      },
      araraquara: {
        label: 'Araraquara',
        holidays: [{ month: 8, day: 22, name: 'Aniversário de Araraquara · São Bento' }]
      },
      jundiai: {
        label: 'Jundiaí',
        holidays: [{ month: 8, day: 15, name: 'Nossa Senhora do Desterro' }]
      },
      nenhuma: {
        label: 'Só feriados nacionais e estadual',
        holidays: []
      }
    };

    function pad(n) { return String(n).padStart(2, '0'); }
    function toISO(utc) {
      const dt = new Date(utc);
      return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
    }
    function parseISO(iso) {
      const [y, m, d] = iso.split('-').map(Number);
      return Date.UTC(y, m - 1, d);
    }
    function fmt(iso) {
      const [y, m, d] = iso.split('-');
      return d + '/' + m + '/' + y;
    }
    function cents(n) { return Math.round((Number(n) || 0) * 100) / 100; }
    function clamp(n, a, b) { return Math.min(b, Math.max(a, n)); }
    function easterUTC(year) {
      const a = year % 19;
      const b = Math.floor(year / 100);
      const c = year % 100;
      const d = Math.floor(b / 4);
      const e = b % 4;
      const f = Math.floor((b + 8) / 25);
      const g = Math.floor((b - f + 1) / 3);
      const h = (19 * a + b - d - g + 15) % 30;
      const i = Math.floor(c / 4);
      const k = c % 4;
      const l = (32 + 2 * e + 2 * i - h - k) % 7;
      const m = Math.floor((a + 11 * h + 22 * l) / 451);
      const month = Math.floor((h + l - 7 * m + 114) / 31);
      const day = ((h + l - 7 * m + 114) % 31) + 1;
      return Date.UTC(year, month - 1, day);
    }
    function quarterDays(year, q) {
      let s = 0;
      for (let m = q * 3; m < q * 3 + 3; m++) s += new Date(Date.UTC(year, m + 1, 0)).getUTCDate();
      return s;
    }

    function recessoInfo(year) {
      const d24 = Date.UTC(year, 11, 24);
      const dow24 = new Date(d24).getUTCDay();
      const offsetToMon = (dow24 + 6) % 7;
      const monNatal = d24 - offsetToMon * DAY;
      const friNatal = monNatal + 4 * DAY;
      const endNatal = Math.max(friNatal, Date.UTC(year, 11, 25));
      const monAnoNovo = monNatal + 7 * DAY;
      const friAnoNovo = monAnoNovo + 4 * DAY;
      const endAnoNovo = Math.max(friAnoNovo, Date.UTC(year + 1, 0, 1));
      const natalIsos = [];
      for (let t = monNatal; t <= friNatal; t += DAY) natalIsos.push(toISO(t));
      const anoNovoIsos = [];
      for (let t = monAnoNovo; t <= friAnoNovo; t += DAY) {
        if (t !== Date.UTC(year, 11, 25) && t !== Date.UTC(year + 1, 0, 1)) anoNovoIsos.push(toISO(t));
      }
      return {
        natal: {
          start: toISO(monNatal),
          end: toISO(endNatal),
          isos: natalIsos
        },
        anonovo: {
          start: toISO(monAnoNovo === Date.UTC(year, 11, 25) ? monAnoNovo + DAY : monAnoNovo),
          end: toISO(endAnoNovo),
          isos: anoNovoIsos
        }
      };
    }

    function buildHolidayMap(year, cityId, custom, disabled, recesso) {
      const map = new Map();
      function add(iso, entry) {
        if (!iso || disabled[iso]) return;
        const prev = map.get(iso);
        if (prev) {
          if (!prev.name.includes(entry.name)) prev.name += ' · ' + entry.name;
          if (entry.kind === 'feriado') prev.kind = 'feriado';
          prev.note = prev.note || entry.note || '';
          return;
        }
        map.set(iso, Object.assign({ iso: iso }, entry));
      }
      function addMD(month, day, entry) {
        add(year + '-' + pad(month) + '-' + pad(day), entry);
      }
      const fixed = [
        [1, 1, 'Confraternização Universal', 'nacional'],
        [4, 21, 'Tiradentes', 'nacional'],
        [5, 1, 'Dia do Trabalho', 'nacional'],
        [7, 9, 'Revolução Constitucionalista', 'estadual'],
        [9, 7, 'Independência do Brasil', 'nacional'],
        [10, 12, 'Nossa Senhora Aparecida', 'nacional'],
        [11, 2, 'Finados', 'nacional'],
        [11, 15, 'Proclamação da República', 'nacional'],
        [11, 20, 'Consciência Negra', 'nacional'],
        [12, 25, 'Natal', 'nacional']
      ];
      fixed.forEach(function (row) {
        addMD(row[0], row[1], { name: row[2], scope: row[3], kind: 'feriado', source: 'base' });
      });
      const easter = easterUTC(year);
      function addOff(delta, entry) { add(toISO(easter + delta * DAY), entry); }
      addOff(-48, { name: 'Carnaval (segunda)', scope: 'previsto', kind: 'facultativo', source: 'base', note: 'Ponto facultativo previsto. Confirmar decreto do exercício.' });
      addOff(-47, { name: 'Carnaval (terça)', scope: 'previsto', kind: 'facultativo', source: 'base', note: 'Ponto facultativo previsto. Confirmar decreto do exercício.' });
      addOff(-46, { name: 'Quarta-feira de Cinzas', scope: 'previsto', kind: 'facultativo', source: 'base', note: 'Em geral até as 14h. O simulador trata o dia inteiro como dispensa.' });
      addOff(-2, { name: 'Paixão de Cristo', scope: 'nacional', kind: 'feriado', source: 'base' });
      addOff(60, { name: 'Corpus Christi', scope: 'tradicional', kind: 'feriado', source: 'base', note: 'Recorrente no funcionalismo paulista. Não é feriado nacional.' });
      addMD(10, 28, { name: 'Dia do Servidor Público', scope: 'funcional', kind: 'facultativo', source: 'base', note: 'Ponto facultativo previsto. Confirmar decreto do exercício.' });
      addMD(12, 24, { name: 'Véspera de Natal', scope: 'funcional', kind: 'facultativo', source: 'base', note: 'Ponto facultativo (Decreto nº 70.273/2025, art. 1º, IX).' });
      addMD(12, 31, { name: 'Véspera de Ano Novo', scope: 'funcional', kind: 'facultativo', source: 'base', note: 'Ponto facultativo (Decreto nº 70.273/2025, art. 1º, X).' });
      (CITY_PRESETS[cityId] || CITY_PRESETS.saopaulo).holidays.forEach(function (h) {
        if (typeof h.easterDelta === 'number') {
          addOff(h.easterDelta, { name: h.name, scope: 'municipal', kind: 'feriado', source: 'municipal' });
        } else {
          addMD(h.month, h.day, { name: h.name, scope: 'municipal', kind: 'feriado', source: 'municipal' });
        }
      });
      const baseEntries = Array.from(map.entries());
      baseEntries.forEach(function (pair) {
        const entry = pair[1];
        if (entry.kind !== 'feriado') return;
        const t = parseISO(pair[0]);
        const dow = new Date(t).getUTCDay();
        let emenda = null;
        if (dow === 2) emenda = t - DAY;
        if (dow === 4) emenda = t + DAY;
        if (emenda == null) return;
        const iso = toISO(emenda);
        if (!iso.startsWith(String(year))) return;
        const edow = new Date(emenda).getUTCDay();
        if (edow === 0 || edow === 6 || map.has(iso)) return;
        add(iso, {
          name: 'Emenda de ' + entry.name,
          scope: 'ponte',
          kind: 'facultativo',
          source: 'emenda',
          note: 'Ponte tradicional prevista para feriado à terça ou à quinta. Desmarque se o decreto não confirmar.'
        });
      });
      if (recesso === 'natal' || recesso === 'anonovo') {
        const rec = recessoInfo(year)[recesso];
        const label = recesso === 'natal' ? 'Recesso — Natal' : 'Recesso — Ano Novo';
        rec.isos.forEach(function (iso) {
          add(iso, {
            name: label,
            scope: 'recesso',
            kind: 'facultativo',
            source: 'recesso',
            note: 'Recesso de final de ano mediante compensação de 1h diária (Decreto nº 70.273/2025, arts. 2º e 3º).'
          });
        });
      }
      custom.forEach(function (c) {
        if (!c.iso || c.iso.slice(0, 4) !== String(year)) return;
        add(c.iso, { name: c.name, scope: 'personalizado', kind: c.kind === 'facultativo' ? 'facultativo' : 'feriado', source: 'custom', note: 'Incluído por você.' });
      });
      return map;
    }

    function buildModel(year, holidayMap) {
      const days = [];
      for (let t = Date.UTC(year, 0, 1); t <= Date.UTC(year, 11, 31); t += DAY) {
        const iso = toISO(t);
        const dow = new Date(t).getUTCDay();
        const holiday = holidayMap.get(iso) || null;
        const weekend = dow === 0 || dow === 6;
        const month = new Date(t).getUTCMonth();
        days.push({
          iso: iso, dow: dow, weekend: weekend, holiday: holiday,
          plain: !weekend && !holiday, month: month, quarter: Math.floor(month / 3),
          inYear: true, year: year
        });
      }
      for (let t = Date.UTC(year + 1, 0, 1); t <= Date.UTC(year + 1, 0, 6); t += DAY) {
        const iso = toISO(t);
        const dow = new Date(t).getUTCDay();
        const weekend = dow === 0 || dow === 6;
        const holiday = holidayMap.get(iso) || (iso.endsWith('-01-01') ? { name: 'Confraternização Universal', kind: 'feriado', scope: 'nacional' } : null);
        days.push({
          iso: iso, dow: dow, weekend: weekend, holiday: holiday,
          plain: !weekend && !holiday, month: 0, quarter: 0, inYear: false, year: year + 1
        });
      }
      const n = days.length;
      const baseOff = new Uint8Array(n);
      const index = new Map();
      days.forEach(function (d, i) {
        index.set(d.iso, i);
        if (!d.plain) baseOff[i] = 1;
      });
      const qDays = [0, 1, 2, 3].map(function (q) { return quarterDays(year, q); });
      const qSafe = qDays.map(function (d) { return Math.floor(d / 3); });
      return { year: year, days: days, n: n, baseOff: baseOff, index: index, qDays: qDays, qSafe: qSafe, holidayMap: holidayMap };
    }

    function inPeriod(day, cfg) {
      return day.inYear && day.month + 1 >= cfg.from && day.month + 1 <= cfg.to;
    }

    function countMonths(model, i, j) {
      const c = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let k = i; k <= j; k++) if (model.days[k].inYear) c[model.days[k].month]++;
      return c;
    }
    function monthsOk(counts) {
      for (let m = 0; m < 12; m++) if (counts[m] > 20) return false;
      return true;
    }
    function addCounts(a, b) {
      const c = a.slice();
      for (let m = 0; m < 12; m++) c[m] += b[m];
      return c;
    }
    function overlaps(a, b) { return a.i <= b.j && b.i <= a.j; }

    function attachment(model, i, j) {
      const days = model.days;
      const off = model.baseOff;
      let left = 0;
      for (let k = i - 1; k >= 0 && off[k]; k--) left++;
      let right = 0;
      for (let k = j + 1; k < model.n && off[k]; k++) right++;
      let wasteWeekend = 0;
      let wasteHoliday = 0;
      for (let k = i; k <= j; k++) {
        if (days[k].holiday) wasteHoliday++;
        else if (days[k].weekend) wasteWeekend++;
      }
      const len = j - i + 1;
      const startDow = days[i].dow;
      const endDow = days[j].dow;
      let shape = 0;
      if (startDow === 1) shape += 2;
      if (endDow === 5) shape += 2;
      if (startDow === 5) shape -= 1;
      return {
        left: left, right: right, bonus: left + right, island: left + len + right,
        wasteHoliday: wasteHoliday, wasteWeekend: wasteWeekend, shape: shape, len: len,
        uteis: len - wasteHoliday - wasteWeekend
      };
    }

    function diversify(list, limit) {
      const picked = [];
      function pushUnique(c) {
        if (picked.length >= limit) return;
        if (picked.indexOf(c) !== -1) return;
        picked.push(c);
      }
      function take(sorted, allowClash, cap) {
        sorted.forEach(function (c) {
          if (picked.length >= (cap == null ? limit : Math.min(cap, limit))) return;
          if (!allowClash) {
            const clash = picked.some(function (p) {
              if (!overlaps(p, c)) return false;
              const inter = Math.min(p.j, c.j) - Math.max(p.i, c.i) + 1;
              return inter > Math.min(p.len, c.len) * 0.6;
            });
            if (clash) return;
          }
          pushUnique(c);
        });
      }
      const byBonus = list.slice().sort(function (a, b) {
        return b.bonus - a.bonus || a.wasteHoliday - b.wasteHoliday || b.shape - a.shape || a.wasteWeekend - b.wasteWeekend || b.island - a.island;
      });
      const byUteis = list.slice().sort(function (a, b) {
        return b.uteis - a.uteis || a.wasteWeekend - b.wasteWeekend || a.wasteHoliday - b.wasteHoliday || b.bonus - a.bonus;
      });
      const reserved = Math.max(4, Math.ceil(limit / 2));
      take(byBonus, false, reserved);
      take(byUteis, false, limit);
      take(byBonus, true, limit);
      take(byUteis, true, limit);
      return picked;
    }

    function parseFixed(model, fixedMap, expandFixed, totalFerias) {
      const limiteFerias = clamp(Number(totalFerias) || 30, 1, 30);
      const occ = new Uint8Array(model.n);
      const baseCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const baseNon = [0, 0, 0, 0];
      const baseAbMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const used = { ferias: 0, lp: 0, abonada: 0, eleitoral: 0, escala: 0, saude: 0, nojo: 0, bloqueado: 0 };
      const singles = [];
      if (!fixedMap) {
        return {
          occ: occ, baseCounts: baseCounts, baseNon: baseNon, baseAbMonth: baseAbMonth,
          used: used, feriasBlocks: [], lpBlocks: [], singles: singles
        };
      }
      Object.keys(fixedMap).forEach(function (iso) {
        const i = model.index.get(iso);
        const type = fixedMap[iso];
        if (i == null || !model.days[i].inYear || !TYPE_META[type]) return;
        const d = model.days[i];
        used[type] = (used[type] || 0) + 1;
        if (TYPE_META[type].blocked) {
          occ[i] = 1;
          return;
        }
        if (expandFixed && type === 'ferias') return;
        occ[i] = 1;
        if (TYPE_META[type].atin) baseCounts[d.month]++;
        if (TYPE_META[type].pr) baseNon[d.quarter]++;
        if (type === 'abonada') baseAbMonth[d.month]++;
        if (type !== 'ferias' && type !== 'lp') {
          singles.push({ i: i, iso: iso, type: type, gain: 0, locked: true });
        }
      });

      function extractRuns(type) {
        const runs = [];
        let cur = null;
        for (let i = 0; i < model.n; i++) {
          const d = model.days[i];
          if (!d.inYear || fixedMap[d.iso] !== type) {
            if (cur) { runs.push(cur); cur = null; }
            continue;
          }
          if (!cur) cur = { i: i, j: i, len: 1 };
          else { cur.j = i; cur.len++; }
        }
        if (cur) runs.push(cur);
        return runs.map(function (r) {
          const info = attachment(model, r.i, r.j);
          return Object.assign({
            i: r.i, j: r.j, len: r.len, counts: countMonths(model, r.i, r.j),
            type: type, locked: true
          }, info);
        });
      }

      const feriasBlocks = extractRuns('ferias');
      const lpBlocks = extractRuns('lp');
      for (let i = 0; i < lpBlocks.length; i++) {
        const b = lpBlocks[i];
        if (b.len < 15) {
          return { error: 'O bloco de licença-prêmio marcado no calendário tem ' + b.len + ' dia(s). O piso de cada bloco de licença-prêmio é de 15 dias.' };
        }
      }
      if (!expandFixed) {
        for (let i = 0; i < feriasBlocks.length; i++) {
          const b = feriasBlocks[i];
          if (!model.days[b.i].plain) {
            return { error: 'O período de férias marcado no calendário começa em ' + fmt(model.days[b.i].iso) + ', que já é folga. Comece em dia útil ou ative "Esticar arredores".' };
          }
          if (!model.days[b.j].plain) {
            return { error: 'O período de férias marcado no calendário termina em ' + fmt(model.days[b.j].iso) + ', que já é folga. Termine em dia útil ou ative "Esticar arredores".' };
          }
        }
      }
      if (used.ferias > limiteFerias) {
        return { error: 'Você marcou ' + used.ferias + ' dias de férias no calendário, mas o saldo configurado é de ' + limiteFerias + ' dias.' };
      }
      if (feriasBlocks.length > 3) {
        return { error: 'Você marcou ' + feriasBlocks.length + ' períodos de férias no calendário. O limite é 3 períodos.' };
      }
      if (!monthsOk(baseCounts)) {
        return { error: 'Os dias marcados no calendário já passam de 20 dias de afastamento no mesmo mês e zeram o ATIN.' };
      }
      for (let q = 0; q < 4; q++) {
        if (baseNon[q] * 3 > model.qDays[q]) {
          return { error: 'Os dias marcados no calendário já passam de 1/3 do ' + (q + 1) + 'º trimestre na PR.' };
        }
      }
      for (let m = 0; m < 12; m++) {
        if (baseAbMonth[m] > 1) {
          return { error: 'Há mais de uma falta abonada marcada em ' + MESES[m] + '. O limite é 1 por mês.' };
        }
      }
      if (used.abonada > 6) {
        return { error: 'Há mais de 6 faltas abonadas marcadas no calendário.' };
      }
      return {
        occ: occ, baseCounts: baseCounts, baseNon: baseNon, baseAbMonth: baseAbMonth,
        used: used, feriasBlocks: feriasBlocks, lpBlocks: lpBlocks, singles: singles
      };
    }

    function endAllowed(end, allowWeekendEnd) {
      if (!end) return false;
      if (end.plain) return true;
      return Boolean(allowWeekendEnd && end.weekend);
    }

    function setEndsOnWeekend(model, blocks) {
      return (blocks || []).some(function (b) {
        const day = model.days[b.j];
        return day && day.weekend;
      });
    }

    function enumerate(model, cfg, fixedOcc, baseCounts, allowWeekendEnd) {
      const byLen = Array.from({ length: 31 }, function () { return []; });
      const days = model.days;
      const zeroCounts = baseCounts || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      for (let i = 0; i < model.n; i++) {
        const start = days[i];
        if (!start.plain || !inPeriod(start, cfg)) continue;
        if (fixedOcc && fixedOcc[i]) continue;
        for (let len = 1; len <= 30; len++) {
          const j = i + len - 1;
          if (j >= model.n) break;
          const end = days[j];
          if (!end.inYear || !inPeriod(end, cfg)) break;
          if (fixedOcc && fixedOcc[j]) break;
          const counts = countMonths(model, i, j);
          if (!monthsOk(addCounts(zeroCounts, counts))) break;
          if (!endAllowed(end, allowWeekendEnd)) continue;
          const info = attachment(model, i, j);
          byLen[len].push(Object.assign({ i: i, j: j, len: len, counts: counts }, info));
        }
      }
      for (let len = 1; len <= 30; len++) byLen[len] = diversify(byLen[len], 16);
      return byLen;
    }

    function enumerateAnchor(model, anchor, fixedOcc, baseCounts) {
      const byLen = Array.from({ length: 31 }, function () { return []; });
      const days = model.days;
      const zeroCounts = baseCounts || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const minI = Math.max(0, anchor.j - 29);
      const maxJ = Math.min(model.n - 1, anchor.i + 29);
      for (let i = minI; i <= anchor.i; i++) {
        const start = days[i];
        if (!start.plain || !start.inYear) continue;
        if (fixedOcc && fixedOcc[i]) continue;
        for (let j = anchor.j; j <= maxJ; j++) {
          const len = j - i + 1;
          if (len > 30) break;
          const end = days[j];
          if (!end.inYear) break;
          if (fixedOcc && fixedOcc[j]) break;
          const counts = countMonths(model, i, j);
          if (!monthsOk(addCounts(zeroCounts, counts))) break;
          if (!end.plain) continue;
          let clashOcc = false;
          for (let k = i; k <= j; k++) {
            if (fixedOcc && fixedOcc[k]) { clashOcc = true; break; }
          }
          if (clashOcc) break;
          const info = attachment(model, i, j);
          byLen[len].push(Object.assign({
            i: i, j: j, len: len, counts: counts, locked: true,
            anchorStart: days[anchor.i].iso, anchorEnd: days[anchor.j].iso
          }, info));
        }
      }
      for (let len = 1; len <= 30; len++) byLen[len] = diversify(byLen[len], 12);
      return byLen;
    }

    function setSignature(blocks) {
      return blocks.map(function (b) { return b.i + '-' + b.j; }).sort().join('|');
    }

    function selectCandidatePairs(pairs, cap) {
      const byBonus = pairs.slice().sort(function (p, q) { return q.bonus - p.bonus || (q.uteis || 0) - (p.uteis || 0); });
      const byUteis = pairs.slice().sort(function (p, q) { return (q.uteis || 0) - (p.uteis || 0) || q.bonus - p.bonus; });
      const out = [];
      const seen = new Set();
      function take(list, n) {
        list.forEach(function (p) {
          if (out.length >= n) return;
          const key = p.x.i + '-' + p.x.j + '|' + p.y.i + '-' + p.y.j + '|' + p.cLen;
          if (seen.has(key)) return;
          seen.add(key);
          out.push(p);
        });
      }
      take(byBonus, Math.ceil(cap * 0.55));
      take(byUteis, cap);
      return out;
    }

    function combineVacationExpanded(byLen, anchorPools, totalSlots, totalFerias, minBlock, minOneBlock, baseCounts) {
      const metaDias = clamp(Number(totalFerias) || 30, 1, 30);
      const zeroCounts = baseCounts || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const minLen = Math.max(1, minBlock || 0);
      const minOne = Math.max(0, minOneBlock || 0);
      if (minLen * totalSlots > metaDias) {
        return { error: 'O mínimo de ' + minLen + ' dias por período não cabe em ' + metaDias + ' dias divididos em ' + totalSlots + ' período(s).' };
      }
      if (minOne > metaDias - minLen * (totalSlots - 1)) {
        return { error: 'Não cabe um período de pelo menos ' + minOne + ' dias dividindo ' + metaDias + ' dias em ' + totalSlots + ' período(s).' };
      }
      const pools = anchorPools.slice();
      const isFree = anchorPools.map(function () { return false; });
      while (pools.length < totalSlots) {
        pools.push(byLen);
        isFree.push(true);
      }

      function validSet(blocks) {
        if (!blocks.some(function (b) { return b.len >= minOne; })) return false;
        for (let a = 0; a < blocks.length; a++) {
          for (let b = a + 1; b < blocks.length; b++) {
            if (overlaps(blocks[a], blocks[b]) || blocks[a].j + 1 === blocks[b].i || blocks[b].j + 1 === blocks[a].i) return false;
          }
        }
        let counts = zeroCounts.slice();
        for (let k = 0; k < blocks.length; k++) counts = addCounts(counts, blocks[k].counts);
        return monthsOk(counts);
      }

      if (totalSlots === 1) {
        const sets = (pools[0][metaDias] || []).map(function (c) { return [c]; }).filter(validSet);
        return { sets: rankSets(sets) };
      }
      if (totalSlots === 2) {
        const sets = [];
        for (let a = minLen; a <= metaDias - minLen; a++) {
          const b = metaDias - a;
          if (Math.max(a, b) < minOne) continue;
          (pools[0][a] || []).forEach(function (x) {
            (pools[1][b] || []).forEach(function (y) {
              if (isFree[0] && isFree[1] && x.i >= y.i) return;
              const pair = [x, y];
              if (validSet(pair)) sets.push(pair);
            });
          });
        }
        return { sets: rankSets(sets) };
      }
      const pairs = [];
      for (let a = minLen; a <= metaDias - 2 * minLen; a++) {
        (pools[0][a] || []).forEach(function (x) {
          for (let b = minLen; b <= metaDias - a - minLen; b++) {
            const cLen = metaDias - a - b;
            if (cLen < minLen) continue;
            if (Math.max(a, b, cLen) < minOne) continue;
            (pools[1][b] || []).forEach(function (y) {
              if (isFree[0] && isFree[1] && x.i >= y.i) return;
              if (overlaps(x, y) || x.j + 1 === y.i || y.j + 1 === x.i) return;
              const counts = addCounts(zeroCounts, addCounts(x.counts, y.counts));
              if (!monthsOk(counts)) return;
              pairs.push({ x: x, y: y, cLen: cLen, counts: counts, bonus: x.bonus + y.bonus, uteis: (x.uteis || 0) + (y.uteis || 0) });
            });
          }
        });
      }
      const sets = [];
      const seen = new Set();
      selectCandidatePairs(pairs, 900).forEach(function (p) {
        (pools[2][p.cLen] || []).forEach(function (z) {
          if (isFree[1] && isFree[2] && p.y.i >= z.i) return;
          const blocks = [p.x, p.y, z];
          if (!validSet(blocks)) return;
          const sig = setSignature(blocks);
          if (seen.has(sig)) return;
          seen.add(sig);
          sets.push(blocks);
        });
      });
      return { sets: rankSets(sets) };
    }

    function combineVacation(byLen, targetSlots, targetDays, minBlock, minOneBlock, fixedFerias, baseCounts) {
      const fixed = fixedFerias || [];
      const zeroCounts = baseCounts || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const minLen = Math.max(1, minBlock || 0);
      const minOne = Math.max(0, minOneBlock || 0);
      const allLengths = function (extra) {
        return fixed.concat(extra).some(function (b) { return b.len >= minOne; });
      };

      if (targetDays === 0) {
        if (!allLengths([])) {
          return { error: 'Os períodos de férias fixados no calendário já usam todo o saldo, mas nenhum tem pelo menos ' + minOne + ' dias.' };
        }
        return { sets: [[]] };
      }
      if (targetSlots <= 0) {
        return { error: 'Você já fixou ' + fixed.length + ' período(s) no calendário. Aumente o número de períodos ou complete os dias de férias.' };
      }
      if (minLen * targetSlots > targetDays) {
        return { error: 'O mínimo de ' + minLen + ' dias por período não cabe nos ' + targetDays + ' dias restantes em ' + targetSlots + ' período(s).' };
      }
      const maxPossible = targetDays - minLen * (targetSlots - 1);
      const fixedSatisfiesOne = fixed.some(function (b) { return b.len >= minOne; });
      if (!fixedSatisfiesOne && minOne > maxPossible) {
        return { error: 'Não cabe um período de pelo menos ' + minOne + ' dias dividindo ' + targetDays + ' dias em ' + targetSlots + ' período(s) (com mínimo de ' + minLen + ' dias em cada).' };
      }

      function validWithFixed(blocks) {
        if (!allLengths(blocks)) return false;
        for (let a = 0; a < blocks.length; a++) {
          for (let f = 0; f < fixed.length; f++) {
            if (overlaps(blocks[a], fixed[f]) || blocks[a].j + 1 === fixed[f].i || fixed[f].j + 1 === blocks[a].i) return false;
          }
          for (let b = a + 1; b < blocks.length; b++) {
            if (overlaps(blocks[a], blocks[b]) || blocks[a].j + 1 === blocks[b].i || blocks[b].j + 1 === blocks[a].i) return false;
          }
        }
        let counts = zeroCounts.slice();
        for (let k = 0; k < blocks.length; k++) counts = addCounts(counts, blocks[k].counts);
        return monthsOk(counts);
      }

      if (targetSlots === 1) {
        const sets = (byLen[targetDays] || []).map(function (c) { return [c]; }).filter(validWithFixed);
        return { sets: rankSets(sets) };
      }
      if (targetSlots === 2) {
        const sets = [];
        for (let a = minLen; a <= targetDays - minLen; a++) {
          const b = targetDays - a;
          if (b < minLen) continue;
          if (!fixedSatisfiesOne && Math.max(a, b) < minOne) continue;
          (byLen[a] || []).forEach(function (x) {
            (byLen[b] || []).forEach(function (y) {
              if (x.i >= y.i) return;
              const pair = [x, y];
              if (validWithFixed(pair)) sets.push(pair);
            });
          });
        }
        return { sets: rankSets(sets) };
      }
      const pairs = [];
      for (let a = minLen; a <= targetDays - 2 * minLen; a++) {
        (byLen[a] || []).forEach(function (x) {
          for (let b = minLen; b <= targetDays - a - minLen; b++) {
            const cLen = targetDays - a - b;
            if (cLen < minLen) continue;
            if (!fixedSatisfiesOne && Math.max(a, b, cLen) < minOne) continue;
            (byLen[b] || []).forEach(function (y) {
              if (x.i >= y.i) return;
              if (overlaps(x, y) || x.j + 1 === y.i || y.j + 1 === x.i) return;
              const counts = addCounts(zeroCounts, addCounts(x.counts, y.counts));
              if (!monthsOk(counts)) return;
              pairs.push({ x: x, y: y, cLen: cLen, counts: counts, bonus: x.bonus + y.bonus, uteis: (x.uteis || 0) + (y.uteis || 0) });
            });
          }
        });
      }
      const sets = [];
      const seen = new Set();
      selectCandidatePairs(pairs, 900).forEach(function (p) {
        (byLen[p.cLen] || []).forEach(function (z) {
          const blocks = [p.x, p.y, z];
          if (!validWithFixed(blocks)) return;
          const sig = setSignature(blocks);
          if (seen.has(sig)) return;
          seen.add(sig);
          sets.push(blocks);
        });
      });
      return { sets: rankSets(sets) };
    }

    function rankSets(sets) {
      const scored = sets.map(function (blocks) {
        const bonus = blocks.reduce(function (s, b) { return s + b.bonus; }, 0);
        const waste = blocks.reduce(function (s, b) { return s + b.wasteHoliday * 3 + b.wasteWeekend; }, 0);
        const uteis = blocks.reduce(function (s, b) { return s + (b.uteis || 0); }, 0);
        return { blocks: blocks, bonus: bonus, waste: waste, uteis: uteis };
      });
      const byBonus = scored.slice().sort(function (a, b) { return b.bonus - a.bonus || a.waste - b.waste || b.uteis - a.uteis; });
      const byUteis = scored.slice().sort(function (a, b) { return b.uteis - a.uteis || a.waste - b.waste || b.bonus - a.bonus; });
      const out = [];
      const seen = new Set();
      function take(list, cap) {
        list.forEach(function (row) {
          if (out.length >= cap) return;
          const sig = setSignature(row.blocks);
          if (seen.has(sig)) return;
          seen.add(sig);
          out.push(row.blocks);
        });
      }
      take(byBonus, 160);
      take(byUteis, 280);
      return out;
    }

    function lpPartitions(total) {
      if (total <= 0) return [[]];
      if (total < 15) return [[total]];
      const found = [];
      const seen = new Set();
      function rec(remain, slots, acc) {
        if (found.length > 24) return;
        if (remain === 0) {
          const key = acc.slice().sort(function (a, b) { return a - b; }).join(',');
          if (!seen.has(key)) { seen.add(key); found.push(acc.slice()); }
          return;
        }
        if (slots === 0 || remain < 15) return;
        const maxL = Math.min(30, remain);
        for (let len = 15; len <= maxL; len++) {
          const left = remain - len;
          if (left !== 0 && left < 15) continue;
          acc.push(len);
          rec(left, slots - 1, acc);
          acc.pop();
        }
      }
      rec(total, 3, []);
      found.sort(function (a, b) { return a.length - b.length || b[0] - a[0]; });
      return found;
    }

    function rangesFrom(blocks, type) {
      return blocks.map(function (b) {
        return {
          i: b.i, j: b.j, len: b.len, counts: b.counts, bonus: b.bonus || 0,
          type: type, locked: Boolean(b.locked),
          wasteHoliday: b.wasteHoliday || 0, wasteWeekend: b.wasteWeekend || 0
        };
      });
    }

    function prCliff(model, ranges, extraNon) {
      const non = (extraNon || [0, 0, 0, 0]).slice();
      ranges.forEach(function (r) {
        if (!TYPE_META[r.type].pr) return;
        for (let k = r.i; k <= r.j; k++) {
          const day = model.days[k];
          if (day.inYear) non[day.quarter]++;
        }
      });
      for (let q = 0; q < 4; q++) if (non[q] * 3 > model.qDays[q]) return true;
      return false;
    }

    function placeLP(model, byLen, occupiedRanges, cfg, strategy, fixedInfo) {
      const fixedLpDays = fixedInfo ? (fixedInfo.used.lp || 0) : 0;
      const remainLp = Math.max(0, (cfg.lp || 0) - fixedLpDays);
      if (!remainLp || strategy === 'cost') {
        return {
          blocks: [],
          note: remainLp && strategy === 'cost' ? 'Não adiciona licença-prêmio, para evitar desconto na PR.' : ''
        };
      }
      const parts = lpPartitions(remainLp);
      const extraNon = [0, 0, 0, 0];
      const singleCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      if (fixedInfo) {
        fixedInfo.singles.forEach(function (s) {
          const d = model.days[s.i];
          if (TYPE_META[s.type].pr) extraNon[d.quarter]++;
          if (TYPE_META[s.type].atin) singleCounts[d.month]++;
        });
      }
      let best = null;
      const blockedOcc = fixedInfo ? fixedInfo.occ : null;
      parts.forEach(function (part) {
        const placed = [];
        const used = occupiedRanges.slice();
        let ok = true;
        part.forEach(function (len) {
          let choice = null;
          let score = -Infinity;
          (byLen[len] || []).forEach(function (c) {
            if (used.some(function (u) { return overlaps(u, c) || u.j + 1 === c.i || c.j + 1 === u.i; })) return;
            if (blockedOcc) {
              for (let k = c.i; k <= c.j; k++) {
                if (blockedOcc[k]) return;
              }
            }
            const trial = used.concat([{ i: c.i, j: c.j, type: 'lp', counts: c.counts }]);
            const counts = trial.reduce(function (acc, r) { return addCounts(acc, r.counts); }, singleCounts.slice());
            if (!monthsOk(counts)) return;
            if (prCliff(model, trial, extraNon)) return;
            const sc = strategy === 'streak' ? c.island * 10 + c.bonus : c.bonus * 10 - c.wasteHoliday * 8 - c.wasteWeekend;
            if (sc > score) { score = sc; choice = c; }
          });
          if (!choice) { ok = false; return; }
          const block = Object.assign({ type: 'lp' }, choice);
          placed.push(block);
          used.push(block);
        });
        if (!ok) return;
        const score = placed.reduce(function (s, b) { return s + b.bonus; }, 0) - (strategy === 'streak' ? 0 : placed.length);
        if (!best || score > best.score) best = { blocks: placed, score: score };
      });
      if (!best) return { blocks: [], note: 'A licença-prêmio não coube sem passar de 20 dias no mês ou de 1/3 do trimestre.' };
      const got = best.blocks.reduce(function (s, b) { return s + b.len; }, 0);
      const note = got < remainLp ? 'Couberam ' + got + ' de ' + remainLp + ' dias de licença-prêmio dentro das travas.' : '';
      return { blocks: best.blocks, note: note };
    }

    function buildOccupancy(model, ranges, fixedSingles, blockedOcc) {
      const n = model.n;
      const off = new Uint8Array(model.baseOff);
      const isLeave = new Uint8Array(n);
      const leaveType = new Array(n).fill('');
      if (blockedOcc) {
        for (let k = 0; k < n; k++) {
          if (blockedOcc[k] && !leaveType[k]) leaveType[k] = 'bloqueado';
        }
      }
      ranges.forEach(function (r) {
        for (let k = r.i; k <= r.j; k++) {
          off[k] = 1;
          isLeave[k] = 1;
          leaveType[k] = r.type;
        }
      });
      (fixedSingles || []).forEach(function (s) {
        off[s.i] = 1;
        isLeave[s.i] = 1;
        leaveType[s.i] = s.type;
      });
      return { off: off, isLeave: isLeave, leaveType: leaveType };
    }

    function localGain(model, off, isLeave, i) {
      let left = 0;
      let leftHas = false;
      for (let k = i - 1; k >= 0 && off[k]; k--) {
        left++;
        if (isLeave[k]) leftHas = true;
      }
      let right = 0;
      let rightHas = false;
      for (let k = i + 1; k < model.n && off[k]; k++) {
        right++;
        if (isLeave[k]) rightHas = true;
      }
      let gain = 1;
      if (!leftHas) gain += left;
      if (!rightHas) gain += right;
      return { gain: gain, run: left + right + 1, leftHas: leftHas, rightHas: rightHas };
    }

    function monthRemaining(model, leaveType) {
      const rem = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      model.days.forEach(function (d, i) {
        const t = leaveType[i];
        const isLeaveDay = t && (!TYPE_META[t] || !TYPE_META[t].blocked);
        if (d.inYear && d.plain && !isLeaveDay) rem[d.month]++;
      });
      return rem;
    }

    function placeSingles(model, ranges, cfg, strategy, fixedInfo) {
      const fixedSingles = fixedInfo ? fixedInfo.singles : [];
      const occ = buildOccupancy(model, ranges, fixedSingles, fixedInfo ? fixedInfo.occ : null);
      const atin = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const non = [0, 0, 0, 0];
      const abMonth = fixedInfo ? fixedInfo.baseAbMonth.slice() : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      ranges.forEach(function (r) {
        for (let k = r.i; k <= r.j; k++) {
          const d = model.days[k];
          if (!d.inYear) continue;
          if (TYPE_META[r.type].atin) atin[d.month]++;
          if (TYPE_META[r.type].pr) non[d.quarter]++;
        }
      });
      fixedSingles.forEach(function (s) {
        const d = model.days[s.i];
        if (!d.inYear) return;
        if (TYPE_META[s.type].atin) atin[d.month]++;
        if (TYPE_META[s.type].pr) non[d.quarter]++;
      });
      const rem = monthRemaining(model, occ.leaveType);
      const required = Math.ceil(6 / cfg.maxDil);
      const singles = fixedSingles.slice();
      const usedFixed = fixedInfo ? fixedInfo.used : {};
      const budgets = {
        escala: Math.max(0, (cfg.escala || 0) - (usedFixed.escala || 0)),
        abonada: Math.max(0, (cfg.abonadas || 0) - (usedFixed.abonada || 0)),
        eleitoral: Math.max(0, (cfg.eleitoral || 0) - (usedFixed.eleitoral || 0))
      };
      const typeOrder = strategy === 'cost' ? ['escala'] : ['escala', 'abonada', 'eleitoral'];
      typeOrder.forEach(function (type) {
        let budget = budgets[type] || 0;
        const rejected = new Set();
        let guard = model.n + budget + 5;
        const minGain = 2;
        while (budget > 0 && guard-- > 0) {
          let best = null;
          for (let i = 0; i < model.n; i++) {
            const d = model.days[i];
            if (!d.plain || !d.inYear || occ.leaveType[i] || rejected.has(i)) continue;
            if (d.month + 1 < cfg.from || d.month + 1 > cfg.to) continue;
            const g = localGain(model, occ.off, occ.isLeave, i);
            if (g.gain < minGain) continue;
            const score = strategy === 'streak' ? g.run * 1000 + g.gain : g.gain * 100 - (type === 'escala' ? 0 : 1);
            if (!best || score > best.score) best = { i: i, gain: g.gain, score: score };
          }
          if (!best) break;
          const day = model.days[best.i];
          let reject = false;
          if (type === 'abonada' && abMonth[day.month]) reject = true;
          if (TYPE_META[type].atin && atin[day.month] + 1 > 20) reject = true;
          if (TYPE_META[type].pr && (non[day.quarter] + 1) * 3 > model.qDays[day.quarter]) reject = true;
          if (rem[day.month] - 1 < required) reject = true;
          if (reject) { rejected.add(best.i); continue; }
          occ.off[best.i] = 1;
          occ.isLeave[best.i] = 1;
          occ.leaveType[best.i] = type;
          if (TYPE_META[type].atin) atin[day.month]++;
          if (TYPE_META[type].pr) non[day.quarter]++;
          if (type === 'abonada') abMonth[day.month] = 1;
          rem[day.month]--;
          singles.push({ i: best.i, iso: day.iso, type: type, gain: best.gain });
          budget--;
        }
      });
      return singles;
    }

    function leaveMapFromPlan(model, blocks, singles, fixedMap) {
      const map = {};
      if (fixedMap) {
        Object.keys(fixedMap).forEach(function (iso) {
          if (fixedMap[iso] === 'bloqueado') map[iso] = 'bloqueado';
        });
      }
      blocks.forEach(function (b) {
        for (let k = b.i; k <= b.j; k++) if (model.days[k].inYear) map[model.days[k].iso] = b.type;
      });
      singles.forEach(function (s) { map[s.iso] = s.type; });
      return map;
    }

    function analyze(model, cfg, leaveMap) {
      const n = model.n;
      const off = new Uint8Array(model.baseOff);
      const isLeave = new Uint8Array(n);
      const index = model.index;
      Object.keys(leaveMap).forEach(function (iso) {
        const i = index.get(iso);
        if (i == null) return;
        const t = leaveMap[iso];
        if (!TYPE_META[t] || TYPE_META[t].blocked) return;
        off[i] = 1;
        isLeave[i] = 1;
      });
      let rest = 0;
      let longest = 0;
      let longestStart = '';
      let longestEnd = '';
      const islands = [];
      let k = 0;
      while (k < n) {
        if (!off[k]) { k++; continue; }
        let j = k;
        let has = false;
        while (j < n && off[j]) {
          if (isLeave[j]) has = true;
          j++;
        }
        if (has) {
          const len = j - k;
          rest += len;
          islands.push({ start: model.days[k].iso, end: model.days[j - 1].iso, len: len });
          if (len > longest) {
            longest = len;
            longestStart = model.days[k].iso;
            longestEnd = model.days[j - 1].iso;
          }
        }
        k = j;
      }
      const atin = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const non = [0, 0, 0, 0];
      const used = { ferias: 0, lp: 0, abonada: 0, eleitoral: 0, escala: 0, saude: 0, nojo: 0, bloqueado: 0 };
      const abMonth = {};
      let waste = 0;
      let spent = 0;
      let feriasUteis = 0;
      Object.keys(leaveMap).forEach(function (iso) {
        const i = index.get(iso);
        if (i == null || !model.days[i].inYear) return;
        const type = leaveMap[iso];
        const meta = TYPE_META[type];
        if (!meta) return;
        const day = model.days[i];
        used[type] = (used[type] || 0) + 1;
        if (meta.blocked) return;
        spent++;
        if (type === 'ferias' && day.plain) feriasUteis++;
        if (meta.atin) atin[day.month]++;
        if (meta.pr) non[day.quarter]++;
        if ((type === 'ferias' || type === 'lp') && !day.plain) waste++;
        if (type === 'abonada') abMonth[day.month] = (abMonth[day.month] || 0) + 1;
      });
      const atinValue = cents(300 * cfg.ufesp);
      let atinLoss = 0;
      let atinOk = true;
      const months = atin.map(function (daysOff, m) {
        const lost = daysOff > 20;
        if (lost) { atinOk = false; atinLoss += atinValue; }
        return { month: m, days: daysOff, lost: lost, value: atinValue };
      });
      atinLoss = cents(atinLoss);
      let prLoss = 0;
      let prOk = true;
      const quarters = [0, 1, 2, 3].map(function (q) {
        const cliff = non[q] * 3 > model.qDays[q];
        if (cliff) prOk = false;
        const loss = cliff ? cfg.pr : cents(cfg.pr * non[q] / model.qDays[q]);
        prLoss += loss;
        return {
          q: q, non: non[q], days: model.qDays[q], safe: model.qSafe[q],
          cliff: cliff, loss: cents(loss),
          worked: model.qDays[q] - non[q]
        };
      });
      prLoss = cents(prLoss);
      const required = Math.ceil(6 / cfg.maxDil);
      let dilOk = true;
      let minMargin = Infinity;
      const leaveTypeArr = new Array(n).fill('');
      const leaveMonths = new Array(12).fill(false);
      Object.keys(leaveMap).forEach(function (iso) {
        const i = index.get(iso);
        if (i == null || !model.days[i].inYear) return;
        const t = leaveMap[iso];
        if (!TYPE_META[t] || TYPE_META[t].blocked) return;
        leaveTypeArr[i] = t;
        leaveMonths[model.days[i].month] = true;
      });
      const rem = monthRemaining(model, leaveTypeArr);
      const diligencias = rem.map(function (r, m) {
        const margin = r - required;
        if (leaveMonths[m] && margin < minMargin) minMargin = margin;
        if (r < required && leaveMonths[m]) dilOk = false;
        return { month: m, remaining: r, required: required, margin: margin, capacity: r * cfg.maxDil };
      });
      if (minMargin === Infinity) minMargin = 0;
      const feriasDays = used.ferias || 0;
      const gainPct = spent > 0 ? Math.round((rest - spent) / spent * 100) : 0;
      return {
        rest: rest, spent: spent, gainPct: gainPct, longest: longest,
        longestStart: longestStart, longestEnd: longestEnd, islands: islands,
        waste: waste, used: used, months: months, quarters: quarters,
        diligencias: diligencias, atinLoss: atinLoss, prLoss: prLoss,
        loss: cents(atinLoss + prLoss), atinOk: atinOk, prOk: prOk, dilOk: dilOk,
        feriasDays: feriasDays, feriasUteis: feriasUteis, abMonth: abMonth, minDilMargin: minMargin, required: required
      };
    }

    function signatureOf(model, leaveMap) {
      return Object.keys(leaveMap).sort().map(function (iso) { return iso + leaveMap[iso]; }).join(',');
    }

    function finishPlan(model, byLen, vacation, cfg, strategy, fixedInfo, expandFixed, fixedMap) {
      const ferias = expandFixed
        ? rangesFrom(vacation, 'ferias')
        : rangesFrom(fixedInfo ? fixedInfo.feriasBlocks : [], 'ferias').concat(rangesFrom(vacation, 'ferias'));
      const fixedLp = rangesFrom(fixedInfo ? fixedInfo.lpBlocks : [], 'lp');
      const occupied = ferias.concat(fixedLp);
      const lpPlace = placeLP(model, byLen, occupied, cfg, strategy, fixedInfo);
      const blocks = occupied.concat(lpPlace.blocks.map(function (b) {
        return {
          i: b.i, j: b.j, len: b.len, counts: b.counts, bonus: b.bonus, type: 'lp', locked: false,
          wasteHoliday: b.wasteHoliday || 0, wasteWeekend: b.wasteWeekend || 0
        };
      }));
      const singles = placeSingles(model, blocks, cfg, strategy, fixedInfo);
      const leaveMap = leaveMapFromPlan(model, blocks, singles, fixedMap);
      const report = analyze(model, cfg, leaveMap);
      const metaDias = clamp(Number(cfg && cfg.feriasTotal) || 30, 1, 30);
      if (report.feriasDays !== metaDias || !report.atinOk || !report.prOk || !report.dilOk) return null;
      return Object.assign(report, {
        blocks: blocks.map(function (b) {
          return {
            type: b.type, i: b.i, j: b.j, len: b.len, counts: b.counts, locked: Boolean(b.locked),
            start: model.days[b.i].iso, end: model.days[b.j].iso,
            startDow: model.days[b.i].dow, endDow: model.days[b.j].dow
          };
        }),
        singles: singles,
        leaveMap: leaveMap,
        note: lpPlace.note,
        strategy: strategy,
        signature: signatureOf(model, leaveMap)
      });
    }

    function optimizeCore(model, cfg, fixedMap) {
      const expandFixed = Boolean(cfg && cfg.expandFixed);
      const totalFerias = clamp(Number(cfg && cfg.feriasTotal) || 30, 1, 30);
      const fixedInfo = parseFixed(model, fixedMap, expandFixed, totalFerias);
      if (fixedInfo.error) return { error: fixedInfo.error };
      const fixedFerias = fixedInfo.feriasBlocks;
      const fixedDays = fixedInfo.used.ferias || 0;
      const targetDays = totalFerias - fixedDays;
      const requestedMode = Math.min(clamp(Number(cfg && cfg.mode) || 3, 1, 3), totalFerias);
      const totalSlots = expandFixed
        ? Math.max(requestedMode, fixedFerias.length || 1)
        : Math.max(requestedMode, fixedFerias.length + (targetDays > 0 ? 1 : 0));
      if (totalSlots > 3) {
        return { error: 'Com os períodos já marcados no calendário, seriam necessários mais de 3 períodos para fechar os ' + totalFerias + ' dias.' };
      }
      const byLen = enumerate(model, cfg, fixedInfo.occ, fixedInfo.baseCounts, false);
      let combined;
      const targetSlots = targetDays === 0 ? 0 : Math.min(targetDays, requestedMode >= fixedFerias.length + 1 ? requestedMode - fixedFerias.length : 1);
      if (expandFixed && fixedFerias.length > 0) {
        const anchorPools = fixedFerias.map(function (a) {
          return enumerateAnchor(model, a, fixedInfo.occ, fixedInfo.baseCounts);
        });
        combined = combineVacationExpanded(byLen, anchorPools, totalSlots, totalFerias, cfg.minBlock, cfg.minOneBlock, fixedInfo.baseCounts);
      } else {
        combined = combineVacation(byLen, targetSlots, targetDays, cfg.minBlock, cfg.minOneBlock, fixedFerias, fixedInfo.baseCounts);
      }
      if (combined.error) return combined;
      if (!combined.sets.length) {
        return { error: 'Não há combinação somando os ' + totalFerias + ' dias de férias com essas restrições sem passar de 20 dias de afastamento num mês ou sem começar e terminar em dia útil.' };
      }
      const plans = [];
      const seen = new Set();
      function addSets(sets, weekendEnd) {
        (sets || []).forEach(function (set) {
          ['rest', 'cost', 'streak'].forEach(function (strategy) {
            const plan = finishPlan(model, byLen, set, cfg, strategy, fixedInfo, expandFixed && fixedFerias.length > 0, fixedMap);
            if (!plan || seen.has(plan.signature)) return;
            seen.add(plan.signature);
            plan.weekendEnd = Boolean(weekendEnd || setEndsOnWeekend(model, set));
            plans.push(plan);
          });
        });
      }
      addSets(combined.sets, false);
      if (!expandFixed && targetDays >= 20 && requestedMode >= 3) {
        const byLenUteis = enumerate(model, cfg, fixedInfo.occ, fixedInfo.baseCounts, true);
        const combinedUteis = combineVacation(byLenUteis, targetSlots, targetDays, cfg.minBlock, cfg.minOneBlock, fixedFerias, fixedInfo.baseCounts);
        if (combinedUteis && combinedUteis.sets && combinedUteis.sets.length) {
          addSets(combinedUteis.sets.filter(function (set) { return setEndsOnWeekend(model, set); }), true);
        }
      }
      if (!plans.length) {
        return { error: 'As combinações estouraram a meta de diligências, a trava de 20 dias do ATIN ou o limite de 1/3 da PR. Afrouxe os mínimos, os dias fixados ou o período da busca.' };
      }
      return {
        plans: pickStrategies(plans),
        fixedSummary: {
          feriasDays: fixedDays,
          feriasPeriods: fixedFerias.length,
          totalFixedDays: Object.keys(fixedMap || {}).length,
          expanded: expandFixed && fixedFerias.length > 0
        }
      };
    }

    function hardCalendarError(error) {
      if (!error) return false;
      return /marcado no calendário|marcados no calendário|já fixou|saldo configurado|mais de 3 períodos|mais de uma falta|mais de 6 faltas|piso de cada bloco/.test(error);
    }

    function diagnoseAndRelax(model, cfg, fixedMap) {
      const trials = [];
      function addTrial(key, label, suggestion, nextCfg, nextFixed) {
        trials.push({
          key: key,
          label: label,
          suggestion: suggestion,
          cfg: nextCfg,
          fixedMap: nextFixed
        });
      }
      if ((cfg.minOneBlock || 0) > 0) {
        addTrial(
          'minOneBlock',
          'Ao menos 1 período longo',
          'Reduza "Ao menos 1 período ≥ ' + cfg.minOneBlock + '" para 0.',
          Object.assign({}, cfg, { minOneBlock: 0 }),
          fixedMap
        );
      }
      if ((cfg.minBlock || 0) > 0) {
        addTrial(
          'minBlock',
          'Mínimo por período',
          'Reduza "Mín. por período" de ' + cfg.minBlock + ' para 0.',
          Object.assign({}, cfg, { minBlock: 0 }),
          fixedMap
        );
      }
      if ((cfg.minBlock || 0) > 0 && (cfg.minOneBlock || 0) > 0) {
        addTrial(
          'minimos',
          'Mínimos de duração',
          'Zere os dois mínimos de duração dos períodos.',
          Object.assign({}, cfg, { minBlock: 0, minOneBlock: 0 }),
          fixedMap
        );
      }
      if ((cfg.from || 1) > 1 || (cfg.to || 12) < 12) {
        addTrial(
          'period',
          'Período da busca',
          'Amplie o período da busca para o ano todo (hoje: meses ' + cfg.from + '–' + cfg.to + ').',
          Object.assign({}, cfg, { from: 1, to: 12 }),
          fixedMap
        );
      }
      if ((cfg.abonadas || 0) > 0 || (cfg.eleitoral || 0) > 0) {
        addTrial(
          'singles',
          'Folgas de um dia',
          'Zere abonadas e eleitoral nesta busca — elas podem estourar ATIN, PR ou o piso de diligências.',
          Object.assign({}, cfg, { abonadas: 0, eleitoral: 0 }),
          fixedMap
        );
      }
      if ((cfg.lp || 0) > 0) {
        addTrial(
          'lp',
          'Licença-prêmio',
          'Tire a licença-prêmio desta busca — ela pode estourar o limite de 1/3 da PR.',
          Object.assign({}, cfg, { lp: 0 }),
          fixedMap
        );
      }
      const hasMovableFixed = fixedMap && Object.keys(fixedMap).some(function (iso) {
        return fixedMap[iso] !== 'bloqueado';
      });
      if (hasMovableFixed) {
        const onlyBlocked = {};
        Object.keys(fixedMap).forEach(function (iso) {
          if (fixedMap[iso] === 'bloqueado') onlyBlocked[iso] = 'bloqueado';
        });
        addTrial(
          'fixed',
          'Datas fixadas no calendário',
          'Solte as férias e folgas fixadas (os dias bloqueados continuam).',
          cfg,
          Object.keys(onlyBlocked).length ? onlyBlocked : null
        );
      }
      if (((cfg.from || 1) > 1 || (cfg.to || 12) < 12) && ((cfg.minBlock || 0) > 0 || (cfg.minOneBlock || 0) > 0)) {
        addTrial(
          'period+mins',
          'Período e mínimos',
          'Amplie a busca para o ano todo e zere os mínimos de duração.',
          Object.assign({}, cfg, { from: 1, to: 12, minBlock: 0, minOneBlock: 0 }),
          fixedMap
        );
      }

      const tried = [];
      let fallback = null;
      for (let t = 0; t < trials.length; t++) {
        const trial = trials[t];
        const result = optimizeCore(model, trial.cfg, trial.fixedMap);
        const unlocked = Boolean(result.plans && result.plans.length);
        tried.push({
          key: trial.key,
          label: trial.label,
          suggestion: trial.suggestion,
          unlocked: unlocked
        });
        if (unlocked && !fallback) {
          fallback = {
            applied: [{ key: trial.key, label: trial.label, suggestion: trial.suggestion }],
            plans: result.plans,
            fixedSummary: result.fixedSummary || null,
            cfg: trial.cfg,
            dropFixed: trial.key === 'fixed'
          };
        }
      }

      const unlocked = tried.filter(function (row) { return row.unlocked; });
      return {
        diagnosis: {
          cause: unlocked.length ? unlocked[0].key : (tried.length ? 'combinacao' : 'desconhecida'),
          title: unlocked.length
            ? 'A trava que impediu a busca foi: ' + unlocked[0].label.toLowerCase() + '.'
            : 'Nenhuma relaxação simples destravou a busca.',
          suggestion: unlocked.length
            ? unlocked[0].suggestion
            : 'Afrouxe as datas fixadas, os mínimos ou o intervalo, ou reduza o saldo de licença-prêmio e folgas de um dia.',
          trials: tried
        },
        fallback: fallback
      };
    }

    function optimize(model, cfg, fixedMap) {
      const result = optimizeCore(model, cfg, fixedMap);
      if (result.plans && result.plans.length) return result;
      if (hardCalendarError(result.error)) return result;
      return Object.assign({}, result, diagnoseAndRelax(model, cfg, fixedMap));
    }

    function pickStrategies(plans) {
      const classic = plans.filter(function (p) { return !p.weekendEnd; });
      const restPool = classic.length ? classic : plans;
      const byRest = restPool.slice().sort(function (a, b) {
        return b.rest - a.rest || b.longest - a.longest || a.loss - b.loss || a.waste - b.waste;
      });
      const byUteis = plans.slice().sort(function (a, b) {
        return (b.feriasUteis || 0) - (a.feriasUteis || 0) || a.waste - b.waste || b.rest - a.rest;
      });
      const byCost = restPool.slice().sort(function (a, b) {
        return a.loss - b.loss || a.waste - b.waste || b.minDilMargin - a.minDilMargin || b.rest - a.rest;
      });
      const byStreak = restPool.slice().sort(function (a, b) {
        return b.longest - a.longest || b.rest - a.rest || a.loss - b.loss;
      });
      const chosen = [];
      const sigs = new Set();
      function take(list, label, blurb) {
        for (let i = 0; i < list.length; i++) {
          if (sigs.has(list[i].signature)) continue;
          sigs.add(list[i].signature);
          chosen.push(Object.assign({}, list[i], { label: label, blurb: blurb, id: label + i }));
          return;
        }
      }
      take(byRest, 'Máximo descanso', 'Mais dias reais de folga, usando o saldo que aumenta a emenda sem zerar PR nem ATIN.');
      take(byUteis, 'Máximo dias úteis', 'Cobre o maior número de dias úteis com os 30 dias corridos. Pode terminar um período no sábado para chegar a 25 úteis; as outras estratégias continuam começando e terminando em dia útil.');
      take(byCost, 'Menor perda', 'Só férias e escala, que não descontam a PR. Abonada, eleitoral e licença-prêmio novas ficam de fora deste cenário.');
      take(byStreak, 'Maior sequência', 'O maior trecho contínuo sem trabalhar, ainda dentro das travas financeiras.');
      byRest.forEach(function (p) {
        if (chosen.length >= 4 || sigs.has(p.signature)) return;
        sigs.add(p.signature);
        chosen.push(Object.assign({}, p, {
          label: 'Alternativa',
          blurb: 'Próxima combinação diferente, para comparar outro ponto do ano.',
          id: 'alt' + chosen.length
        }));
      });
      return chosen.slice(0, 4);
    }

    function holidaySelfCheck() {
      const errors = [];
      const easterDates = { 2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16' };
      Object.keys(easterDates).forEach(function (y) {
        if (toISO(easterUTC(Number(y))) !== easterDates[y]) errors.push('Páscoa ' + y);
      });
      const map = buildHolidayMap(2027, 'saopaulo', [], {});
      const expect = {
        '2027-01-01': 'feriado', '2027-01-25': 'feriado',
        '2027-02-08': 'facultativo', '2027-02-09': 'facultativo', '2027-02-10': 'facultativo',
        '2027-03-26': 'feriado', '2027-04-21': 'feriado', '2027-05-01': 'feriado',
        '2027-05-27': 'feriado', '2027-05-28': 'facultativo', '2027-07-09': 'feriado',
        '2027-09-06': 'facultativo', '2027-09-07': 'feriado',
        '2027-10-11': 'facultativo', '2027-10-12': 'feriado', '2027-10-28': 'facultativo',
        '2027-11-01': 'facultativo', '2027-11-02': 'feriado', '2027-11-15': 'feriado',
        '2027-11-20': 'feriado', '2027-12-24': 'facultativo', '2027-12-25': 'feriado', '2027-12-31': 'facultativo'
      };
      Object.keys(expect).forEach(function (iso) {
        const got = map.get(iso);
        if (!got || got.kind !== expect[iso]) errors.push(iso);
      });
      ['2027-02-05', '2027-07-08', '2027-10-29', '2027-11-12', '2027-03-28'].forEach(function (iso) {
        if (map.has(iso)) errors.push('sobra ' + iso);
      });
      if (new Date(parseISO('2027-01-01')).getUTCDay() !== 5) errors.push('dow 01/01');
      if (new Date(parseISO('2027-07-09')).getUTCDay() !== 5) errors.push('dow 09/07');
      if (new Date(parseISO('2027-09-07')).getUTCDay() !== 2) errors.push('dow 07/09');
      const camp = buildHolidayMap(2027, 'campinas', [], {});
      if (camp.has('2027-01-25') || !camp.has('2027-12-08')) errors.push('campinas');
      const santos = buildHolidayMap(2027, 'santos', [], {});
      if (!santos.has('2027-01-26') || !santos.has('2027-09-08')) errors.push('santos');
      const taubate = buildHolidayMap(2027, 'taubate', [], {});
      if (!taubate.has('2027-02-05') || !taubate.has('2027-03-29') || !taubate.has('2027-10-04')) errors.push('taubate');
      const rec2026 = recessoInfo(2026);
      if (rec2026.natal.start !== '2026-12-21' || rec2026.natal.end !== '2026-12-25') errors.push('recesso natal 2026');
      if (rec2026.anonovo.start !== '2026-12-28' || rec2026.anonovo.end !== '2027-01-01') errors.push('recesso anonovo 2026');
      return errors;
    }

    const SHARE_TYPES = {
        f: "ferias", p: "lp", a: "abonada", e: "eleitoral",
        s: "escala", h: "saude", n: "nojo", k: "bloqueado"
    };
    const SHARE_CODES = {
        ferias: "f", lp: "p", abonada: "a", eleitoral: "e",
        escala: "s", saude: "h", nojo: "n", bloqueado: "k"
    };

    function doyFromIso(iso) {
        const [y, m, d] = iso.split("-").map(Number);
        return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / DAY) + 1;
    }
    function isoFromDoy(year, doy) {
        return toISO(Date.UTC(Number(year), 0, doy));
    }

    function encodeRuns(map, year) {
        if (!map) return "";
        const prefix = String(year);
        const isos = Object.keys(map).filter(function (iso) { return iso.slice(0, 4) === prefix; }).sort();
        const runs = [];
        isos.forEach(function (iso) {
            const type = map[iso];
            const code = SHARE_CODES[type];
            if (!code) return;
            const doy = doyFromIso(iso);
            const last = runs[runs.length - 1];
            if (last && last.code === code && last.doy + last.len === doy) last.len++;
            else runs.push({ code: code, doy: doy, len: 1 });
        });
        return runs.map(function (r) {
            return r.code + r.doy + (r.len > 1 ? "x" + r.len : "");
        }).join(",");
    }

    function decodeRuns(str, year) {
        const map = {};
        if (!str) return map;
        String(str).split(",").forEach(function (tok) {
            const m = /^([fpaeshnk])(\d{1,3})(?:x(\d{1,2}))?$/.exec(tok);
            if (!m) return;
            const type = SHARE_TYPES[m[1]];
            const start = Number(m[2]);
            const len = Number(m[3] || 1);
            for (let i = 0; i < len && i < 31; i++) {
                const iso = isoFromDoy(year, start + i);
                if (iso.slice(0, 4) === String(year)) map[iso] = type;
            }
        });
        return map;
    }

    function encodeSharePayload(p) {
        const year = String((p && p.year) || 2027);
        const bits = ["2", "y" + year.slice(-2)];
        const period = (p && p.period) || "all";
        if (period === "custom") {
            bits.push("q" + (p.monthFrom || 1) + "-" + (p.monthTo || 12));
        } else if (period !== "all") {
            bits.push("q" + period);
        }
        if (p && p.city && p.city !== "saopaulo") bits.push("c" + p.city);
        if (p && p.recesso && p.recesso !== "nenhum") bits.push("r" + (p.recesso === "anonovo" ? "a" : "t"));
        if (p && String(p.feriasTotal || 30) !== "30") bits.push("t" + p.feriasTotal);
        if (p && String(p.mode || 3) !== "3") bits.push("m" + p.mode);
        if (p && Number(p.minBlock)) bits.push("b" + p.minBlock);
        if (p && Number(p.minOneBlock)) bits.push("o" + p.minOneBlock);
        if (p && Number(p.lp)) bits.push("lp" + p.lp);
        if (p && Number(p.abonadas)) bits.push("ab" + p.abonadas);
        if (p && Number(p.eleitoral)) bits.push("el" + p.eleitoral);
        if (p && Number(p.escala)) bits.push("es" + p.escala);
        if (p && p.expandFixed) bits.push("x");
        const ferias = encodeRuns(p && p.manual, year);
        if (ferias) bits.push("F" + ferias);
        const locked = encodeRuns(p && p.locked, year);
        if (locked && locked === ferias) bits.push("K*");
        else if (locked) bits.push("K" + locked);
        return bits.join(".");
    }

    function decodeSharePayload(raw) {
        if (!raw || typeof raw !== "string") return null;
        if (raw.charAt(0) === "{") {
            try { return JSON.parse(raw); } catch (err) { return null; }
        }
        const bits = raw.split(".");
        if (!bits.length || bits[0] !== "2") return null;
        const out = {
            year: "2027", period: "all", city: "saopaulo", recesso: "nenhum",
            feriasTotal: "30", mode: "3", minBlock: "0", minOneBlock: "0",
            lp: "0", abonadas: "0", eleitoral: "0", escala: "0",
            expandFixed: false, manual: {}, locked: {}
        };
        bits.slice(1).forEach(function (bit) {
            if (!bit) return;
            if (bit === "x") { out.expandFixed = true; return; }
            if (bit === "K*") { out.locked = null; return; }
            const key = bit.charAt(0);
            const rest = bit.slice(1);
            if (key === "y" && /^\d{2}$/.test(rest)) out.year = "20" + rest;
            else if (key === "q") {
                const custom = /^(\d{1,2})-(\d{1,2})$/.exec(rest);
                if (custom) {
                    out.period = "custom";
                    out.monthFrom = custom[1];
                    out.monthTo = custom[2];
                } else if (/^(s1|s2|q1|q2|q3|q4)$/.test(rest)) out.period = rest;
            } else if (key === "c" && /^[a-z]+$/.test(rest)) out.city = rest;
            else if (key === "r") out.recesso = rest === "a" ? "anonovo" : "natal";
            else if (bit.slice(0, 2) === "lp" && /^\d+$/.test(bit.slice(2))) out.lp = bit.slice(2);
            else if (bit.slice(0, 2) === "ab" && /^\d+$/.test(bit.slice(2))) out.abonadas = bit.slice(2);
            else if (bit.slice(0, 2) === "el" && /^\d+$/.test(bit.slice(2))) out.eleitoral = bit.slice(2);
            else if (bit.slice(0, 2) === "es" && /^\d+$/.test(bit.slice(2))) out.escala = bit.slice(2);
            else if (key === "t" && /^\d+$/.test(rest)) out.feriasTotal = rest;
            else if (key === "m" && /^[123]$/.test(rest)) out.mode = rest;
            else if (key === "b" && /^\d+$/.test(rest)) out.minBlock = rest;
            else if (key === "o" && /^\d+$/.test(rest)) out.minOneBlock = rest;
            else if (key === "F") out.manual = decodeRuns(rest, out.year);
            else if (key === "K") out.locked = decodeRuns(rest, out.year);
        });
        if (out.locked === null) out.locked = Object.assign({}, out.manual);
        return out;
    }

    return {
        MESES,
        SEMANA,
        TYPE_META,
        CITY_PRESETS,
        fmt,
        cents,
        clamp,
        easterUTC,
        recessoInfo,
        buildHolidayMap,
        buildModel,
        optimize,
        analyze,
        holidaySelfCheck,
        countMonths,
        encodeSharePayload,
        decodeSharePayload
    };
});
