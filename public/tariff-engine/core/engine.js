// public/tariff-engine/engine.js

class TariffEngineCore {
  constructor() {
    this.activeCorridor = 'gcc_sa';
    this.ratesCache = {};
  }

  // Enforces valid customs digit lengths per regime
  validateHSLength(hsInput, corridorKey = this.activeCorridor) {
    const digitsOnly = (hsInput || '').replace(/\D/g, '');
    const len = digitsOnly.length;

    const rules = {
      gcc_sa: [6, 8, 10, 12],
      us_hts: [6, 8, 10],
      eu_taric: [6, 8, 10],
      asean_cn: [6, 8, 10]
    };

    const allowed = rules[corridorKey] || [6, 8, 10];

    if (!allowed.includes(len)) {
      return {
        valid: false,
        digits: len,
        message: `INVALID FORMAT: ${corridorKey.toUpperCase()} requires ${allowed.join(', ')} digits (Received: ${len}).`
      };
    }

    return { valid: true, digits: len };
  }

  async loadCorridor(corridorKey) {
    this.activeCorridor = corridorKey;

    if (this.ratesCache[corridorKey]) {
      return this.ratesCache[corridorKey];
    }

    // 1. Network Fetch Attempt
    try {
      const res = await fetch(`/tariff-engine/modules/${corridorKey}/rates.json`, { cache: 'no-store' });
      if (res.ok) {
        const rates = await res.json();
        this.ratesCache[corridorKey] = rates;
        if (window.tradeDB) await window.tradeDB.saveCorridorRates(corridorKey, rates);
        return rates;
      }
    } catch (e) {
      // Offline fallback triggered
    }

    // 2. IndexedDB Cache Read
    if (window.tradeDB) {
      const cached = await window.tradeDB.getCorridorRates(corridorKey);
      if (cached && cached.length) {
        this.ratesCache[corridorKey] = cached;
        return cached;
      }
    }

    // 3. Fallback to In-Memory Hardcoded Registry
    const fallback = (typeof CORRIDOR_REGISTRY !== 'undefined' && CORRIDOR_REGISTRY[corridorKey]) ? CORRIDOR_REGISTRY[corridorKey] : [];
    this.ratesCache[corridorKey] = fallback;
    return fallback;
  }

  matchTariff(hsQuery, rates) {
    const cleaned = (hsQuery || '').replace(/\D/g, '');
    let matched = (rates || []).find(t => t.code.replace(/\D/g, '') === cleaned);
    if (!matched) {
      matched = (rates || []).find(t => t.code.replace(/\D/g, '').startsWith(cleaned.substring(0, 4)));
    }
    return matched || {
      code: hsQuery || 'GENERIC',
      desc: 'Standard Industrial Material',
      dutyRate: 0.05,
      reg: 'Standard Customs Declaration',
      directive: 'STANDARD'
    };
  }

  calculateLine(item, tariff, conversionMultiplier = 1.0) {
    const baseFob = (parseFloat(item.fob) || 0) * conversionMultiplier;
    const baseFreight = (parseFloat(item.freight) || 0) * conversionMultiplier;
    const cif = baseFob + baseFreight;
    const duty = cif * (tariff.dutyRate || 0);
    let vat = 0;
    let penalties = 0;

    if (this.activeCorridor === 'gcc_sa') {
      vat = (cif + duty) * 0.15; // ZATCA 15% statutory VAT
    } else if (this.activeCorridor === 'eu_taric') {
      vat = (cif + duty) * 0.19; // EU 19% standard VAT
      penalties = baseFob * (tariff.penaltyDutyRate || 0); // EU Safeguard / ADD
    } else if (this.activeCorridor === 'us_hts') {
      penalties = baseFob * (tariff.penaltyDutyRate || 0); // Sec 232 / 301
    } else if (this.activeCorridor === 'asean_cn') {
      vat = (cif + duty) * 0.13; // PRC statutory VAT
    }

    const landed = cif + duty + vat + penalties;
    return { cif, duty, vat, penalties, landed };
  }
}

window.TariffEngine = new TariffEngineCore();