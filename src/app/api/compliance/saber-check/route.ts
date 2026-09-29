import { NextResponse } from 'next/server';

interface ComplianceRule {
  category: string;
  standard: string;
  cstMandate: 'COC-CST' | 'STANDARD_SABER';
  fasahWindow: string;
  accreditedBodies: string[];
  sasoNameplateMandate?: {
    effectiveDate: string;
    legalBasis: string;
    enforcementScope: string;
    requirements: string[];
  };
  certificates: {
    pcoc: {
      type: string;
      validity: string;
      scope: string;
    };
    scoc: {
      penaltyRisk: string;
    };
  };
  fasahPreflightChecklist: Array<{
    item: string;
    description: string;
    mandatory: boolean;
    responsibleParty: 'EXPORTER' | 'IMPORTER' | 'SHARED';
  }>;
}

const REGULATORY_DATABASE: Record<string, ComplianceRule> = {
  // Industrial CNC Machinery & Machining Centers
  '845961000000': {
    category: 'Industrial CNC Machining & Engraving Systems',
    standard: 'SASO TR Machinery Safety (01-05-21-182) / ISO 12100:2010 / IEC 60204-1',
    cstMandate: 'STANDARD_SABER',
    fasahWindow: '72h Pre-Arrival Declaration (Mandatory)',
    accreditedBodies: ['TÜV Rheinland', 'Intertek', 'SGS', 'Bureau Veritas'],
    sasoNameplateMandate: {
      effectiveDate: '2026-10-01',
      legalBasis: 'SASO Circular 247 / Royal Decree M/36 (Art. 19)',
      enforcementScope: 'Mandatory Physical On-Body Hardware Marking (Zero Tolerance)',
      requirements: [
        'Saudi Importer Official Name (Bilingual Arabic/English) permanently engraved or laser-etched on machine chassis',
        'Importer 10-digit Commercial Registration (CR) Number verified against SABER portal',
        'OEM Multi-Client Isolation: Tooling and plate must match the active consignment importer (carton stickers invalid)'
      ]
    },
    certificates: {
      pcoc: {
        type: 'Product Certificate (PCoC - Type 1a)',
        validity: '1 Year Renewable',
        scope: 'Factory Test Report + CE/SASO Machinery Safety Technical Construction File'
      },
      scoc: {
        penaltyRisk: 'DAP Risk: Unbound consignee CR stops SCoC issuance. Non-compliant nameplate triggers immediate FASAH manifest rejection and container demurrage ($500–$1,500/day).'
      }
    },
    fasahPreflightChecklist: [
      {
        item: 'SASO M/36 ON-BODY NAMEPLATE AUDIT',
        description: 'Verify importer 10-digit CR and bilingual legal name are laser-etched/engraved directly on hardware body before container sealing. Packaging-only stickers strictly rejected.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'SASO Technical File & Factory Test Protocol',
        description: 'Certified lab reports matching ISO 12100 & IEC 60204-1 electrical safety directives.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Active SABER PCoC Issuance',
        description: 'Approved Product Certificate issued by SASO-accredited CAB prior to vessel departure.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Saudi Consignee Commercial Registration (CR) Binding',
        description: 'Destination buyer must link active 10-digit Saudi CR to the specific SABER submittal.',
        mandatory: true,
        responsibleParty: 'IMPORTER'
      },
      {
        item: 'Electronic Bill of Lading (eBOL) SABER Linkage',
        description: 'Draft B/L and commercial invoice matched to SABER platform to generate the SCoC.',
        mandatory: true,
        responsibleParty: 'SHARED'
      },
      {
        item: '72-Hour FASAH Pre-Declaration Filing',
        description: 'Electronic manifest and SCoC digest transmitted to ZATCA customs at least 72h prior to berth arrival.',
        mandatory: true,
        responsibleParty: 'SHARED'
      }
    ]
  },

  // IT & USB-C SASO 3114
  '847130000000': {
    category: 'Laptops & Portable Computing Machinery',
    standard: 'SASO 3114:2024 / IEC 62368-1 (Mandatory USB-C Standard)',
    cstMandate: 'STANDARD_SABER',
    fasahWindow: '48h Pre-Declaration Window',
    accreditedBodies: ['TÜV Rheinland', 'Nemko', 'Intertek'],
    sasoNameplateMandate: {
      effectiveDate: '2026-10-01',
      legalBasis: 'SASO Circular 247 / Royal Decree M/36 (Art. 19)',
      enforcementScope: 'Hardware Rating Plate & Importer Parity',
      requirements: [
        'Importer Legal Name & 10-digit CR permanently affixed to bottom casing/rating label',
        'Tamper-evident or indelible marking (packaging sticker alone invalid)',
        'Exact parity with SABER technical file photos'
      ]
    },
    certificates: {
      pcoc: {
        type: 'Product Certificate (PCoC)',
        validity: '1 Year',
        scope: 'SASO 3114 Conformance + CB Test Certificate'
      },
      scoc: {
        penaltyRisk: 'Non-compliant USB-C, missing CB report, or nameplate CR mismatch leads to immediate cargo re-export.'
      }
    },
    fasahPreflightChecklist: [
      {
        item: 'SASO M/36 RATING PLATE & CR PARITY',
        description: 'Inspect physical chassis rating label for importer 10-digit CR and bilingual identity before packing.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'CB Test Certificate & SASO 3114 Verification',
        description: 'IECEE CB scheme report verifying USB Type-C charging port standardization.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'SABER PCoC Registration',
        description: 'Registration of product details under SASO ICT equipment scope.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Consignee SABER SCoC Issuance',
        description: 'Generation of shipment certificate against shipping invoice.',
        mandatory: true,
        responsibleParty: 'IMPORTER'
      },
      {
        item: 'FASAH Pre-Clearance Lodging',
        description: 'Manifest submission 48-72 hours prior to vessel arrival.',
        mandatory: true,
        responsibleParty: 'SHARED'
      }
    ]
  },

  // Telecommunications & Networking CST Unified Scope
  '851762900001': {
    category: 'Industrial Modems, Managed Switches & RF Apparatus',
    standard: 'SASO-CITC-RI054 / SASO-IEC-62368-1',
    cstMandate: 'COC-CST',
    fasahWindow: 'Fast-Track 48h FASAH Electronic Gate',
    accreditedBodies: ['TÜV Rheinland', 'Nemko', 'Intertek'],
    sasoNameplateMandate: {
      effectiveDate: '2026-10-01',
      legalBasis: 'SASO Circular 247 / Royal Decree M/36 (Art. 19)',
      enforcementScope: 'Chassis Markings & CST Telemetry Parity',
      requirements: [
        'Importer Name and CR on device serial plate',
        'Zero discrepancy with CST approval license'
      ]
    },
    certificates: {
      pcoc: {
        type: 'COC-CST Unified Track',
        validity: '12 Months',
        scope: 'CST Platform Integrated SABER Approval'
      },
      scoc: {
        penaltyRisk: 'Uncertified radio transmitters or labeling mismatches trigger immediate re-export with full carrier liability.'
      }
    },
    fasahPreflightChecklist: [
      {
        item: 'SASO M/36 SERIAL & IMPORTER CR VERIFICATION',
        description: 'Physical validation of importer CR number and manufacturer serial plate on hardware casing.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'CST Technical Specification Approval',
        description: 'Type-approval certificate for RF frequency allocation within Saudi territory.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Unified COC-CST Platform Gateway Sync',
        description: 'SABER-CST unified digital link validation.',
        mandatory: true,
        responsibleParty: 'SHARED'
      },
      {
        item: 'FASAH 48h Fast-Track Lodging',
        description: 'Electronic pre-declaration for telecommunications priority lane.',
        mandatory: true,
        responsibleParty: 'IMPORTER'
      }
    ]
  },

  // Fallback defaults for general industrial items
  'default': {
    category: 'General Regulated Industrial Cargo',
    standard: 'SASO General Safety & Quality Technical Regulations',
    cstMandate: 'STANDARD_SABER',
    fasahWindow: '72h Pre-Declaration Window',
    accreditedBodies: ['TÜV Rheinland', 'Intertek', 'SGS'],
    sasoNameplateMandate: {
      effectiveDate: '2026-10-01',
      legalBasis: 'SASO Circular 247 / Royal Decree M/36 (Art. 19)',
      enforcementScope: 'Mandatory Physical On-Body Product Identification',
      requirements: [
        'Saudi Importer Name & 10-digit CR Number marked on physical body (laser/engraved/silk-screen/riveted)',
        'Carton or outer box labeling alone is non-compliant as of 2026-10-01',
        'Physical marking must match SABER digital registration exactly'
      ]
    },
    certificates: {
      pcoc: {
        type: 'Standard PCoC',
        validity: '1 Year',
        scope: 'General Regulatory File Verification'
      },
      scoc: {
        penaltyRisk: 'Uncertified consignments or nameplate discrepancies trigger port detention and storage demurrage at Jeddah and Dammam ports.'
      }
    },
    fasahPreflightChecklist: [
      {
        item: 'SASO M/36 PHYSICAL BODY NAMEPLATE CHECK',
        description: 'Confirm physical product carries permanent importer name and CR marking prior to container stuffing. Packaging-only stickers fail clearance.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Commercial Invoice & Packing List',
        description: 'ZATCA-compliant line-item description and matching 12-digit HS subheading.',
        mandatory: true,
        responsibleParty: 'EXPORTER'
      },
      {
        item: 'Consignee SABER Portal SCoC Sign-Off',
        description: 'Authorized importer account electronic approval on shipment certificate.',
        mandatory: true,
        responsibleParty: 'IMPORTER'
      },
      {
        item: 'FASAH 72h Pre-Arrival Submission',
        description: 'Pre-clearance manifest registered before vessel enters Saudi territorial waters.',
        mandatory: true,
        responsibleParty: 'SHARED'
      }
    ]
  }
};

export async function POST(req: Request) {
  try {
    const { hsCode } = await req.json();
    const cleanCode = (hsCode || '').replace(/[^0-9]/g, '');

    const rule = REGULATORY_DATABASE[cleanCode] || REGULATORY_DATABASE['default'];

    return NextResponse.json({
      status: 'success',
      hsCode: cleanCode,
      ...rule,
      timestamp: new Date().toISOString()
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to process compliance audit' },
      { status: 500 }
    );
  }
}