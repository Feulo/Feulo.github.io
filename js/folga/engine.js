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
      nojo: { label: 'Nojo / gala', short: 'Nojo/gala', atin: true, pr: false }
    };
    const CITY_PRESETS = {
      saopaulo: { label: 'São Paulo — Capital', holidays: [{ month: 1, day: 25, name: 'Aniversário de São Paulo' }] },
      campinas: { label: 'Campinas', holidays: [{ month: 12, day: 8, name: 'Nossa Senhora da Conceição' }] },
      santos: { label: 'Santos', holidays: [
        { month: 1, day: 26, name: 'Aniversário de Santos' },
        { month: 9, day: 8, name: 'Nossa Senhora do Monte Serrat' }
      ] },
      ribeirao: { label: 'Ribeirão Preto', holidays: [
        { month: 1, day: 20, name: 'São Sebastião' },
        { month: 6, day: 19, name: 'Aniversário de Ribeirão Preto' }
      ] },
      prudente: { label: 'Presidente Prudente', holidays: [
        { month: 1, day: 20, name: 'São Sebastião' },
        { month: 9, day: 14, name: 'Aniversário de Presidente Prudente' },
        { month: 12, day: 8, name: 'Imaculada Conceição' }
      ] },
      nenhuma: { label: 'Só nacional e estadual', holidays: [] }
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

    function buildHolidayMap(year, cityId, custom, disabled) {
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
      addMD(12, 24, { name: 'Véspera de Natal', scope: 'funcional', kind: 'facultativo', source: 'base', note: 'Em geral a partir das 13h. O simulador trata o dia inteiro como dispensa.' });
      addMD(12, 31, { name: 'Véspera de Ano Novo', scope: 'funcional', kind: 'facultativo', source: 'base', note: 'Em geral a partir das 13h. O simulador trata o dia inteiro como dispensa.' });
      (CITY_PRESETS[cityId] || CITY_PRESETS.saopaulo).holidays.forEach(function (h) {
        addMD(h.month, h.day, { name: h.name, scope: 'municipal', kind: 'feriado', source: 'municipal' });
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
      for (let t = Date.UTC(year + 1, 0, 1); t <= Date.UTC(year + 1, 0, 3); t += DAY) {
        const iso = toISO(t);
        const dow = new Date(t).getUTCDay();
        const weekend = dow === 0 || dow === 6;
        const holiday = iso.endsWith('-01-01') ? { name: 'Confraternização Universal', kind: 'feriado', scope: 'nacional' } : null;
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
        wasteHoliday: wasteHoliday, wasteWeekend: wasteWeekend, shape: shape, len: len
      };
    }

    function diversify(list, limit) {
      const picked = [];
      const sorted = list.slice().sort(function (a, b) {
        return b.bonus - a.bonus || a.wasteHoliday - b.wasteHoliday || b.shape - a.shape || a.wasteWeekend - b.wasteWeekend || b.island - a.island;
      });
      sorted.forEach(function (c) {
        if (picked.length >= limit) return;
        const clash = picked.some(function (p) {
          if (!overlaps(p, c)) return false;
          const inter = Math.min(p.j, c.j) - Math.max(p.i, c.i) + 1;
          return inter > Math.min(p.len, c.len) * 0.6;
        });
        if (!clash) picked.push(c);
      });
      sorted.forEach(function (c) {
        if (picked.length >= limit) return;
        if (picked.indexOf(c) === -1) picked.push(c);
      });
      return picked;
    }

    function parseFixed(model, fixedMap) {
      const occ = new Uint8Array(model.n);
      const baseCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const baseNon = [0, 0, 0, 0];
      const baseAbMonth = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
      const used = { ferias: 0, lp: 0, abonada: 0, eleitoral: 0, escala: 0, saude: 0, nojo: 0 };
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
        occ[i] = 1;
        used[type] = (used[type] || 0) + 1;
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
      for (let i = 0; i < feriasBlocks.length; i++) {
        const b = feriasBlocks[i];
        if (!model.days[b.i].plain) {
          return { error: 'O período de férias marcado no calendário começa em ' + fmt(model.days[b.i].iso) + ', que já é folga. Comece em dia útil.' };
        }
        if (!model.days[b.j].plain) {
          return { error: 'O período de férias marcado no calendário termina em ' + fmt(model.days[b.j].iso) + ', que já é folga. Termine em dia útil.' };
        }
      }
      if (used.ferias > 30) {
        return { error: 'Você marcou ' + used.ferias + ' dias de férias no calendário. O limite é 30 dias.' };
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

    function enumerate(model, cfg, fixedOcc, baseCounts) {
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
          if (end.holiday) break;
          const counts = countMonths(model, i, j);
          if (!monthsOk(addCounts(zeroCounts, counts))) break;
          if (!end.plain) continue;
          const info = attachment(model, i, j);
          byLen[len].push(Object.assign({ i: i, j: j, len: len, counts: counts }, info));
        }
      }
      for (let len = 1; len <= 30; len++) byLen[len] = diversify(byLen[len], 14);
      return byLen;
    }

    function setSignature(blocks) {
      return blocks.map(function (b) { return b.i + '-' + b.j; }).sort().join('|');
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
          return { error: 'Os períodos de férias fixados no calendário somam 30 dias, mas nenhum tem pelo menos ' + minOne + ' dias.' };
        }
        return { sets: [[]] };
      }
      if (targetSlots <= 0) {
        return { error: 'Você já fixou ' + fixed.length + ' período(s) no calendário somando ' + (30 - targetDays) + ' dias. Aumente o número de períodos ou complete os 30 dias.' };
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
              pairs.push({ x: x, y: y, cLen: cLen, counts: counts, bonus: x.bonus + y.bonus });
            });
          }
        });
      }
      pairs.sort(function (p, q) { return q.bonus - p.bonus; });
      const sets = [];
      const seen = new Set();
      pairs.slice(0, 750).forEach(function (p) {
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
        return { blocks: blocks, bonus: bonus, waste: waste };
      });
      scored.sort(function (a, b) { return b.bonus - a.bonus || a.waste - b.waste; });
      const out = [];
      const seen = new Set();
      scored.forEach(function (row) {
        if (out.length >= 220) return;
        const sig = setSignature(row.blocks);
        if (seen.has(sig)) return;
        seen.add(sig);
        out.push(row.blocks);
      });
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
      parts.forEach(function (part) {
        const placed = [];
        const used = occupiedRanges.slice();
        let ok = true;
        part.forEach(function (len) {
          let choice = null;
          let score = -Infinity;
          (byLen[len] || []).forEach(function (c) {
            if (used.some(function (u) { return overlaps(u, c); })) return;
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

    function buildOccupancy(model, ranges, fixedSingles) {
      const n = model.n;
      const off = new Uint8Array(model.baseOff);
      const isLeave = new Uint8Array(n);
      const leaveType = new Array(n).fill('');
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
        if (d.inYear && d.plain && !leaveType[i]) rem[d.month]++;
      });
      return rem;
    }

    function placeSingles(model, ranges, cfg, strategy, fixedInfo) {
      const fixedSingles = fixedInfo ? fixedInfo.singles : [];
      const occ = buildOccupancy(model, ranges, fixedSingles);
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

    function leaveMapFromPlan(model, blocks, singles) {
      const map = {};
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
      const used = { ferias: 0, lp: 0, abonada: 0, eleitoral: 0, escala: 0, saude: 0, nojo: 0 };
      const abMonth = {};
      let waste = 0;
      let spent = 0;
      Object.keys(leaveMap).forEach(function (iso) {
        const i = index.get(iso);
        if (i == null || !model.days[i].inYear) return;
        const type = leaveMap[iso];
        const meta = TYPE_META[type];
        if (!meta) return;
        const day = model.days[i];
        used[type] = (used[type] || 0) + 1;
        spent++;
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
        leaveTypeArr[i] = leaveMap[iso];
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
        feriasDays: feriasDays, abMonth: abMonth, minDilMargin: minMargin, required: required
      };
    }

    function signatureOf(model, leaveMap) {
      return Object.keys(leaveMap).sort().map(function (iso) { return iso + leaveMap[iso]; }).join(',');
    }

    function finishPlan(model, byLen, vacation, cfg, strategy, fixedInfo) {
      const ferias = rangesFrom(fixedInfo ? fixedInfo.feriasBlocks : [], 'ferias').concat(rangesFrom(vacation, 'ferias'));
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
      const leaveMap = leaveMapFromPlan(model, blocks, singles);
      const report = analyze(model, cfg, leaveMap);
      if (report.feriasDays !== 30 || !report.atinOk || !report.prOk || !report.dilOk) return null;
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

    function optimize(model, cfg, fixedMap) {
      const fixedInfo = parseFixed(model, fixedMap);
      if (fixedInfo.error) return { error: fixedInfo.error };
      const fixedFerias = fixedInfo.feriasBlocks;
      const fixedDays = fixedInfo.used.ferias || 0;
      const targetDays = 30 - fixedDays;
      const totalSlots = Math.max(cfg.mode || 3, fixedFerias.length + (targetDays > 0 ? 1 : 0));
      if (totalSlots > 3) {
        return { error: 'Com os períodos já marcados no calendário, seriam necessários mais de 3 períodos para fechar 30 dias.' };
      }
      const targetSlots = targetDays === 0 ? 0 : (cfg.mode >= fixedFerias.length + 1 ? cfg.mode - fixedFerias.length : 1);
      const byLen = enumerate(model, cfg, fixedInfo.occ, fixedInfo.baseCounts);
      const combined = combineVacation(byLen, targetSlots, targetDays, cfg.minBlock, cfg.minOneBlock, fixedFerias, fixedInfo.baseCounts);
      if (combined.error) return combined;
      if (!combined.sets.length) {
        return { error: 'Não há combinação somando os 30 dias de férias com essas restrições sem passar de 20 dias de afastamento num mês ou sem começar e terminar em dia útil.' };
      }
      const plans = [];
      const seen = new Set();
      combined.sets.forEach(function (set) {
        ['rest', 'cost', 'streak'].forEach(function (strategy) {
          const plan = finishPlan(model, byLen, set, cfg, strategy, fixedInfo);
          if (!plan || seen.has(plan.signature)) return;
          seen.add(plan.signature);
          plans.push(plan);
        });
      });
      if (!plans.length) {
        return { error: 'As combinações estouraram a meta de diligências, a trava de 20 dias do ATIN ou o limite de 1/3 da PR. Afrouxe os mínimos, os dias fixados ou o período da busca.' };
      }
      return {
        plans: pickThree(plans),
        fixedSummary: {
          feriasDays: fixedDays,
          feriasPeriods: fixedFerias.length,
          totalFixedDays: Object.keys(fixedMap || {}).length
        }
      };
    }

    function pickThree(plans) {
      const byRest = plans.slice().sort(function (a, b) {
        return b.rest - a.rest || b.longest - a.longest || a.loss - b.loss || a.waste - b.waste;
      });
      const byCost = plans.slice().sort(function (a, b) {
        return a.loss - b.loss || a.waste - b.waste || b.minDilMargin - a.minDilMargin || b.rest - a.rest;
      });
      const byStreak = plans.slice().sort(function (a, b) {
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
      take(byCost, 'Menor perda', 'Só férias e escala, que não descontam a PR. Abonada, eleitoral e licença-prêmio novas ficam de fora deste cenário.');
      take(byStreak, 'Maior sequência', 'O maior trecho contínuo sem trabalhar, ainda dentro das travas financeiras.');
      byRest.forEach(function (p) {
        if (chosen.length >= 3 || sigs.has(p.signature)) return;
        sigs.add(p.signature);
        chosen.push(Object.assign({}, p, {
          label: 'Alternativa',
          blurb: 'Próxima combinação diferente, para comparar outro ponto do ano.',
          id: 'alt' + chosen.length
        }));
      });
      return chosen.slice(0, 3);
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
      return errors;
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
        buildHolidayMap,
        buildModel,
        optimize,
        analyze,
        holidaySelfCheck,
        countMonths
    };
});
