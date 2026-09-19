import { NextResponse } from 'next/server';

interface HsComplianceRecord {
  hsCode: string;
  category: string;
  standard: string;
  pcocScope: string;
  pcocValidity: string;
  scocRule: string;
  cstMandate: 'COC-CST' | 'SABER_STANDARD';
  fasahClearanceWindow: string;
  penaltyRisk: string;
  accreditedBodies: string[];
}

const REGULATORY_REGISTRY: Record<string, HsComplianceRecord> = {
  '847130': {
    hsCode: '847130000000',
    category: 'Portable Automatic Data Processors / Laptops',
    standard: 'SASO-IEC-62368-1:2020 & SASO-3114:2026 (USB Type-C Mandate)',
    pcocScope: 'Model Level Certification (COC-CST Unified Track)',
    pcocValidity: '12 Months',
    scocRule: 'Mandatory Pre-Shipment Issuance prior to Port Arrival',
    cstMandate: 'COC-CST',
    fasahClearanceWindow: 'Green-Channel 48h (With Valid Pre-Filing)',
    penaltyRisk: 'Lack of unified COC-CST or USB-C conformity results in mandatory customs border impoundment and port demurrage.',
    accreditedBodies: ['TÜV Rheinland', 'Intertek', 'SGS']
  },
  '851762': {
    hsCode: '851762900001',
    category: 'Industrial Modems, Managed Switches & RF Apparatus',
    standard: 'SASO-CITC-RI054 / SASO-IEC-62368-1',
    pcocScope: 'COC-CST Integrated SABER Approval (Effective Feb 12, 2025)',
    pcocValidity: '12 Months',
    scocRule: 'Pre-Arrival Clearance Required via FASAH',
    cstMandate: 'COC-CST',
    fasahClearanceWindow: 'Fast-Track 48h FASAH Electronic Gate',
    penaltyRisk: 'CST platform migration mandate: Uncertified radio transmitters will be re-exported with full carrier liability.',
    accreditedBodies: ['TÜV Rheinland', 'Nemko', 'Intertek']
  },
  '760421': {
    hsCode: '760421000000',
    category: 'Architectural Aluminum Extrusions & Alloy Profiles',
    standard: 'SASO 2831:2018 / ASTM B221 (GB/T 5237 Parity)',
    pcocScope: 'Technical File & Factory Metallurgical Composition Test',
    pcocValidity: '12 Months',
    scocRule: 'Batch Inspection Certificate required per B/L',
    cstMandate: 'SABER_STANDARD',
    fasahClearanceWindow: 'Standard 72h Port Inspection Window',
    penaltyRisk: 'Failure of ASTM/SASO mechanical strength parity triggers mandatory port laboratory testing and 14-day clearance hold.',
    accreditedBodies: ['Intertek', 'SGS', 'Bureau Veritas']
  },
  '852691': {
    hsCode: '852691000000',
    category: 'Radio Navigation & GPS Fleet Telematics Hubs',
    standard: 'SASO-CITC-RI072 / SASO-IEC-60950',
    pcocScope: 'RF & GNSS Frequency Plan Compliance File',
    pcocValidity: '12 Months',
    scocRule: 'Mandatory Pre-Shipment Authorization',
    cstMandate: 'COC-CST',
    fasahClearanceWindow: '48h Security & Spectrum Clear Track',
    penaltyRisk: 'Radio devices operating outside CITC approved frequency bands will be confiscated at port of entry.',
    accreditedBodies: ['TÜV Rheinland', 'TUV SUD', 'Intertek']
  }
};

export async function POST(req: Request) {
  try {
    const { hsCode } = await req.json();
    const cleanHs = (hsCode || '').replace(/\D/g, '');

    if (cleanHs.length < 4) {
      return NextResponse.json({ error: 'Please enter at least 4 to 8 digits of the Saudi HS code.' }, { status: 400 });
    }

    const prefix6 = cleanHs.slice(0, 6);
    const prefix4 = cleanHs.slice(0, 4);

    const record = REGULATORY_REGISTRY[prefix6] || REGULATORY_REGISTRY[prefix4] || {
      hsCode: cleanHs.padEnd(12, '0'),
      category: 'General Regulated Industrial Hardware',
      standard: 'SASO General Safety & Quality Technical Regulations',
      pcocScope: 'Product Conformity Assessment (PCoC)',
      pcocValidity: '12 Months',
      scocRule: 'Mandatory Pre-Arrival SCoC via SABER Platform',
      cstMandate: ['8471', '8517', '8526'].includes(prefix4) ? 'COC-CST' : 'SABER_STANDARD',
      fasahClearanceWindow: '72h Pre-Declaration Window',
      penaltyRisk: 'Uncertified consignments trigger port detention and storage demurrage at Jeddah and Dammam ports.',
      accreditedBodies: ['TÜV Rheinland', 'Intertek', 'SGS']
    };

    return NextResponse.json({
      hsCode: cleanHs,
      category: record.category,
      standard: record.standard,
      cstMandate: record.cstMandate,
      fasahWindow: record.fasahClearanceWindow,
      accreditedBodies: record.accreditedBodies,
      certificates: {
        pcoc: {
          validity: record.pcocValidity,
          scope: record.pcocScope,
          type: record.cstMandate === 'COC-CST' ? 'COC-CST Unified Track' : 'Standard PCoC'
        },
        scoc: {
          penaltyRisk: record.penaltyRisk,
          rule: record.scocRule
        }
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal compliance audit failed' }, { status: 500 });
  }
}