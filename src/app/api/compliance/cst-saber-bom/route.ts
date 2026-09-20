import { NextResponse } from 'next/server';

export interface BOMItemPayload {
  id: string;
  sku: string;
  hsCode: string;
  category: string;
  qty: number;
  unitPriceUSD: number;
  specSummary: string;
  sasoStandardParity: string;
}

export interface SaberBomAuditRequest {
  items: BOMItemPayload[];
  incoterm: 'FOB' | 'CIF' | 'CFR' | 'DAP' | 'DDP';
  saberBindingStatus: 'BOUND' | 'PENDING_BUYER_ACTION';
  governingTR: string;
  cabId?: string;
  cabAccreditation?: string;
  pcocStatus?: 'VALID_ACTIVE' | 'EXPIRED' | 'MISSING_TEST_REPORT';
  scocReadiness?: 'READY_TO_ISSUE' | 'BLOCKED_BY_PCOC' | 'AWAITING_SHIPPING_DOCS';
  isFasahReady?: boolean;
}

const PEGGED_USD_SAR = 3.75;
const GCC_DUTY_RATE = 0.05;
const ZATCA_VAT_RATE = 0.15;

export async function POST(req: Request) {
  try {
    const body: SaberBomAuditRequest = await req.json();
    const {
      items = [],
      incoterm = 'CIF',
      saberBindingStatus = 'BOUND',
      governingTR = 'General Cargo',
      cabId = 'astc',
      cabAccreditation = 'P-CB 0372',
      pcocStatus = 'VALID_ACTIVE',
      scocReadiness = 'READY_TO_ISSUE',
      isFasahReady = true,
    } = body;

    // 1. Line-by-line Standard Parity & Regulatory Mapping
    const auditedManifest = items.map((item) => {
      const qty = Number(item.qty || 1);
      const unitPrice = Number(item.unitPriceUSD || 0);
      const lineFobUsd = qty * unitPrice;
      const lineFreightUsd = lineFobUsd * 0.08;
      const lineCifUsd = lineFobUsd + lineFreightUsd;
      const lineCifSar = lineCifUsd * PEGGED_USD_SAR;
      const lineDutySar = lineCifSar * GCC_DUTY_RATE;
      const lineVatSar = (lineCifSar + lineDutySar) * ZATCA_VAT_RATE;

      const isHsValid = /^\d{12}$/.test(item.hsCode.trim());

      return {
        sku: item.sku,
        hsCode: item.hsCode,
        hsFormatVerified: isHsValid,
        sasoStandardTarget: item.sasoStandardParity,
        lineCifSar: Math.round(lineCifSar * 100) / 100,
        lineDutySar: Math.round(lineDutySar * 100) / 100,
        lineVatSar: Math.round(lineVatSar * 100) / 100,
        conformityAssessment: {
          governingTR,
          notifiedBodyCode: cabAccreditation,
          pcocEligible: pcocStatus === 'VALID_ACTIVE',
          scocDispatchStatus: scocReadiness === 'READY_TO_ISSUE' ? 'PERMITTED' : 'HOLD_AT_ORIGIN',
        },
      };
    });

    // 2. Aggregate Fiscal Totals
    const totalFobUsd = items.reduce((acc, i) => acc + (Number(i.qty || 1) * Number(i.unitPriceUSD || 0)), 0);
    const totalFreightUsd = totalFobUsd * 0.08;
    const totalCifUsd = totalFobUsd + totalFreightUsd;
    const totalCifSar = totalCifUsd * PEGGED_USD_SAR;
    const totalCustomsDutySar = totalCifSar * GCC_DUTY_RATE;
    const taxableVatBaseSar = totalCifSar + totalCustomsDutySar;
    const totalZatcaVatSar = taxableVatBaseSar * ZATCA_VAT_RATE;
    const totalLandedFiscalSar = taxableVatBaseSar + totalZatcaVatSar;

    // 3. Incoterm Risk & Port Demurrage Assessment
    const highRiskDemurrage = (incoterm === 'DAP' || incoterm === 'DDP') && (!isFasahReady || saberBindingStatus === 'PENDING_BUYER_ACTION');

    const demurrageAnalysis = {
      incotermEvaluated: incoterm,
      isExposedToDemurrage: highRiskDemurrage,
      estimatedDailyDemurrageUSD: highRiskDemurrage ? '120 - 250 USD / Container / Day' : '0 USD (Risk Mitigated)',
      portNotice: highRiskDemurrage
        ? 'DAP/DDP RISK: Unlinked SCoC or missing FASAH 72h pre-filing shifts carrier detention and terminal demurrage costs directly to foreign consignor.'
        : 'LOW EXPOSURE: Consignee bound and technical regulations reconciled.',
    };

    // 4. Regulatory Pipeline Assertion
    const complianceLifecycle = {
      ruleCheck: 'NO VALID PCoC -> NO SCoC -> CARGO BLOCKED AT PORT',
      step1_PCoC: {
        status: pcocStatus,
        notifiedBody: cabAccreditation,
        validity: pcocStatus === 'VALID_ACTIVE' ? '1-Year Product Conformity Active' : 'Action Required',
      },
      step2_SCoC: {
        readiness: scocReadiness,
        scope: 'Single Commercial Invoice & B/L Linked',
      },
      step3_FASAH: {
        preFlightStatus: isFasahReady ? 'PASSED_72H_WINDOW' : 'PRE_CLEARANCE_BLOCKED',
        targetWindow: '72 Hours Prior to Berth Arrival',
      },
    };

    return NextResponse.json({
      status: 'AUDIT_COMPLETE',
      timestamp: new Date().toISOString(),
      governingTR,
      manifestItemCount: auditedManifest.length,
      complianceLifecycle,
      demurrageAnalysis,
      fiscalBreakdown: {
        peggedExchangeRate: PEGGED_USD_SAR,
        totalFobUsd: Math.round(totalFobUsd * 100) / 100,
        totalCifUsd: Math.round(totalCifUsd * 100) / 100,
        totalCifSar: Math.round(totalCifSar * 100) / 100,
        customsDutySar: Math.round(totalCustomsDutySar * 100) / 100,
        zatcaVatSar: Math.round(totalZatcaVatSar * 100) / 100,
        totalLandedFiscalSar: Math.round(totalLandedFiscalSar * 100) / 100,
      },
      auditedManifest,
    });
  } catch (error) {
    console.error('Error executing CST SABER BOM audit:', error);
    return NextResponse.json(
      { status: 'ERROR', message: 'Failed to process manifest payload' },
      { status: 500 }
    );
  }
}