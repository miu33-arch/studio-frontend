import { NextResponse } from 'next/server';

export interface CstSaberRule {
  hsPrefix: string;
  category: string;
  sasoStandard: string;
  cstRequirement: string;
  mandateType: 'COC-CST' | 'SABER_STANDARD' | 'DUAL_MANDATORY';
  effectiveDate: string;
  notes: string;
}

export const CST_SABER_REGULATORY_MATRIX: Record<string, CstSaberRule> = {
  // HS 8471: Automatic Data Processing Units
  '847130': {
    hsPrefix: '847130',
    category: 'Laptops / Portable Data Terminals',
    sasoStandard: 'SASO-IEC-62368-1:2020 / SASO-3114:2026',
    cstRequirement: 'CST Unified RF Type Approval (Wi-Fi 6E/7 / BLE) & USB-C Mandate',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Mandatory SABER PCoC (COC-CST track) via accredited Conformity Assessment Body.'
  },
  '847141': {
    hsPrefix: '847141',
    category: 'Industrial Compute / Edge Servers',
    sasoStandard: 'SASO-IEC-62368-1:2020 / SASO-CITC-RI056',
    cstRequirement: 'CST Enterprise IT Telemetry Approval',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Dual verification: SASO Electrical Safety & CST technical regulation under SABER.'
  },
  '847170': {
    hsPrefix: '847170',
    category: 'Storage Units / RAID NVR Arrays',
    sasoStandard: 'SASO-IEC-62368-1:2020',
    cstRequirement: 'SABER PCoC Safety Standard Verification',
    mandateType: 'SABER_STANDARD',
    effectiveDate: '2025-02-12',
    notes: 'Standard SASO Electrical Safety verification.'
  },
  '847180': {
    hsPrefix: '847180',
    category: 'RFID Interrogators / GPON Optical Network Units',
    sasoStandard: 'SASO-ETSI-EN-302-208',
    cstRequirement: 'CST Fixed Spectrum Conformity (UHF 920-925 MHz check)',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Transmitter EIRP compliance verified under SABER platform.'
  },

  // HS 8517: Telecommunications & RF Apparatus
  '851762': {
    hsPrefix: '851762',
    category: 'Industrial Modems, Managed Switches, UWB & Mesh Nodes',
    sasoStandard: 'SASO-CITC-RI054 / SASO-IEC-62368-1',
    cstRequirement: 'CST Integrated SABER Certificate (COC-CST)',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Matches Saudi HS 851762900001. CST portal RF direct licensing replaced by SABER.'
  },
  '851769': {
    hsPrefix: '851769',
    category: 'Wireless Headsets / VoIP Intercom Units',
    sasoStandard: 'SASO-CITC-RI113 / SASO-IEC-62368-1',
    cstRequirement: 'CST Short-Range Device (SRD) Type Approval',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Automatic SABER flag for Bluetooth/2.4GHz RF conformance.'
  },

  // HS 8526: Radar, Radio Navigation & Remote Control
  '852691': {
    hsPrefix: '852691',
    category: 'GPS Fleet Trackers / Telematics Hubs',
    sasoStandard: 'SASO-CITC-RI072 / SASO-IEC-60950',
    cstRequirement: 'CST Asset Tracking Device Approval (2G/4G/GNSS)',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Must declare 4G VoLTE and GNSS frequency plan in technical file.'
  },
  '852692': {
    hsPrefix: '852692',
    category: 'Industrial Radio Remote Controls / Actuator Receivers',
    sasoStandard: 'SASO-ETSI-EN-300-220',
    cstRequirement: 'CST SRD / Remote Actuation Approval (433/868 MHz)',
    mandateType: 'COC-CST',
    effectiveDate: '2025-02-12',
    notes: 'Submittals without accredited lab RED/EMC reports trigger customs hold.'
  },

  // HS 7216 & 7604: Construction Steel & Aluminum Extrusions
  '721631': {
    hsPrefix: '721631',
    category: 'Structural Steel U/I Sections (GB/T 700 / ASTM A36)',
    sasoStandard: 'SASO ASTM A36 / SASO-ISO-630',
    cstRequirement: 'SABER Quality Mark / Conformity Certificate',
    mandateType: 'SABER_STANDARD',
    effectiveDate: '2025-01-01',
    notes: 'Factory mill test certificates mandatory prior to port arrival.'
  },
  '760421': {
    hsPrefix: '760421',
    category: 'Aluminum Alloy Architectural Profiles (GB/T 5237 / SASO 2831)',
    sasoStandard: 'SASO 2831:2018 / ASTM B221',
    cstRequirement: 'SABER PCoC & SCoC Pre-Clearance Verification',
    mandateType: 'SABER_STANDARD',
    effectiveDate: '2025-01-01',
    notes: 'Requires accredited lab metallurgical composition testing.'
  }
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const items = body.items || [];

    const auditResults = items.map((item: any, idx: number) => {
      let rawHs = (item.hsCode || '').trim();

      // Smart HS detection fallback based on SKU keywords and category
      if (!rawHs) {
        const skuUpper = (item.sku || '').toUpperCase();
        const specUpper = (item.specSummary || '').toUpperCase();

        if (skuUpper.includes('HIK') || skuUpper.includes('CCTV') || skuUpper.includes('SURV') || specUpper.includes('SURVEILLANCE')) {
          rawHs = '851762900001';
        } else if (skuUpper.includes('SWITCH') || skuUpper.includes('3E1526P') || skuUpper.includes('POE') || item.category === 'networking') {
          rawHs = '851762000000';
        } else if (skuUpper.includes('STEEL') || skuUpper.includes('Q235B') || specUpper.includes('STRUCTURAL STEEL')) {
          rawHs = '721631000000';
        } else if (skuUpper.includes('AL-') || skuUpper.includes('EXTRUSION') || specUpper.includes('EXTRUSIONS')) {
          rawHs = '760421000000';
        } else if (skuUpper.includes('WIN75') || skuUpper.includes('AND21') || item.category === 'computing') {
          rawHs = '847130000000';
        } else if (skuUpper.includes('RAID') || skuUpper.includes('NVR') || item.category === 'storage') {
          rawHs = '847170000000';
        } else if (item.category === 'surveillance') {
          rawHs = '851762900001';
        } else {
          rawHs = '847141000000';
        }
      }

      const cleanHs = rawHs.replace(/\D/g, '');
      const prefix6 = cleanHs.slice(0, 6);
      const prefix4 = cleanHs.slice(0, 4);

      const matchedRule = CST_SABER_REGULATORY_MATRIX[prefix6] || null;
      const isTelecomOrRf = ['8471', '8517', '8526'].includes(prefix4);

      return {
        id: item.id || String(idx + 1),
        sku: item.sku || `SKU-${idx + 1}`,
        hsCode: rawHs,
        category: item.category || 'industrial',
        qty: Number(item.qty) || 1,
        description: item.specSummary || item.description || item.sku,
        cstParityRequired: Boolean(matchedRule?.mandateType === 'COC-CST' || (isTelecomOrRf && matchedRule?.mandateType !== 'SABER_STANDARD')),
        certificateType: matchedRule?.mandateType || (isTelecomOrRf ? 'COC-CST' : 'SABER_STANDARD'),
        applicableStandard: matchedRule?.sasoStandard || (isTelecomOrRf ? 'SASO-CITC-RI054 / SASO-IEC-62368-1' : 'SASO-STANDARD'),
        technicalRegulation: 'Technical Regulation for Communications and Information Technology Devices',
        effectiveDate: matchedRule?.effectiveDate || '2025-02-12',
        estimatedClearanceHours: isTelecomOrRf ? 48 : 72,
        notes: matchedRule?.notes || (isTelecomOrRf ? 'CST-SABER Unified RF Mandate' : 'Standard SASO clearance.')
      };
    });

    return NextResponse.json({
      status: 'success',
      timestamp: new Date().toISOString(),
      unifiedPlatformMandate: 'Effective February 12, 2025: CST RF type approvals integrated into SABER',
      totalAudited: auditResults.length,
      results: auditResults,
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to process BOM parity audit', error: String(error) },
      { status: 400 }
    );
  }
}