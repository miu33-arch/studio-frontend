class TariffEngineCore {
  constructor() {
    this.activeCorridor = 'gcc_sa';
    this.ratesCache = {};
  }

  async loadCorridor(corridorKey) {
    this.activeCorridor = corridorKey;
    if (!this.ratesCache[corridorKey]) {
      try {
        const response = await fetch(`/tariff-engine/modules/${corridorKey}/rates.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        this.ratesCache[corridorKey] = await response.json();
      } catch (err) {
        console.error(`Error loading corridor ${corridorKey}:`, err);
        return [];
      }
    }
    return this.ratesCache[corridorKey];
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

  calculateLine(item, tariff) {
    const fob = parseFloat(item.fob) || 0;
    const freight = parseFloat(item.freight) || 0;
    const cif = fob + freight;
    const duty = cif * (tariff.dutyRate || 0);
    
    let vat = 0;
    let penalties = 0;

    switch (this.activeCorridor) {
      case 'gcc_sa':
        vat = (cif + duty) * 0.15;
        break;
      case 'us_hts':
        penalties = fob * (tariff.penaltyDutyRate || 0);
        vat = 0;
        break;
    }

    const landed = cif + duty + vat + penalties;
    return { cif, duty, vat, penalties, landed };
  }
}

window.TariffEngine = new TariffEngineCore();
