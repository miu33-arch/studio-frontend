import { NextResponse } from 'next/server';

interface ComplianceRule {
  category: string;
  standard: string;
  cstMandate: 'COC-CST' | 'STANDARD_SABER';
  fasahWindow: string;
  accreditedBodies: string[];
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
    certificates: {
      pcoc: {
        type: 'Product Certificate (PCoC - Type 1a)',
        validity: '1 Year Renewable',
        scope: 'Factory Test Report + CE/SASO Machinery Safety Technical Construction File'
      },
      scoc: {
        penaltyRisk: 'DAP Risk: Unbound consignee CR stops SCoC issuance. Triggers immediate FASAH manifest rejection and container demurrage ($500–$1,500/day).'
      }
    },
    fasahPreflightChecklist: [
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
    certificates: {
      pcoc: {
        type: 'Product Certificate (PCoC)',
        validity: '1 Year',
        scope: 'SASO 3114 Conformance + CB Test Certificate'
      },
      scoc: {
        penaltyRisk: 'Non-compliant USB-C or missing CB report leads to immediate cargo re-export.'
      }
    },
    fasahPreflightChecklist: [
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
    certificates: {
      pcoc: {
        type: 'COC-CST Unified Track',
        validity: '12 Months',
        scope: 'CST Platform Integrated SABER Approval'
      },
      scoc: {
        penaltyRisk: 'Uncertified radio transmitters trigger immediate re-export with full carrier liability.'
      }
    },
    fasahPreflightChecklist: [
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
    certificates: {
      pcoc: {
        type: 'Standard PCoC',
        validity: '1 Year',
        scope: 'General Regulatory File Verification'
      },
      scoc: {
        penaltyRisk: 'Uncertified consignments trigger port detention and storage demurrage at Jeddah and Dammam ports.'
      }
    },
    fasahPreflightChecklist: [
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