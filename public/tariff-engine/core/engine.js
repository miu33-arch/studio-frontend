// public/tariff-engine/engine.js (or inside your script)

class TariffEngineCore {
  constructor() {
    this.activeCorridor = 'gcc_sa';
    this.ratesCache = {};
  }

  async loadCorridor(corridorKey) {
    this.activeCorridor = corridorKey;

    if (this.ratesCache[corridorKey]) {
      return this.ratesCache[corridorKey];
    }

    // 1. Try Network First
    try {
      const res = await fetch(`/tariff-engine/modules/${corridorKey}/rates.json`, { cache: 'no-store' });
      if (res.ok) {
        const rates = await res.json();
        this.ratesCache[corridorKey] = rates;
        if (window.tradeDB) await window.tradeDB.saveCorridorRates(corridorKey, rates);
        return rates;
      }
    } catch (e) {
      // Offline mode - network unavailable
    }

    // 2. Fallback to IndexedDB Cache
    if (window.tradeDB) {
      const cached = await window.tradeDB.getCorridorRates(corridorKey);
      if (cached && cached.length) {
        this.ratesCache[corridorKey] = cached;
        return cached;
      }
    }

    // 3. Ultimate Fallback to Hardcoded Registry
    const fallback = CORRIDOR_REGISTRY[corridorKey] || [];
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
      vat = (cif + duty) * 0.19; // EU 19% standard import VAT
      penalties = baseFob * (tariff.penaltyDutyRate || 0);
    } else if (this.activeCorridor === 'us_hts') {
      penalties = baseFob * (tariff.penaltyDutyRate || 0); // Sec 232/301
    } else if (this.activeCorridor === 'asean_cn') {
      vat = (cif + duty) * 0.13; // PRC statutory VAT
    }

    const landed = cif + duty + vat + penalties;
    return { cif, duty, vat, penalties, landed };
  }
}

window.TariffEngine = new TariffEngineCore();