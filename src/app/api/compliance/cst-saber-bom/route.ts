import { NextResponse } from 'next/server';

export interface IndustrialBOMItem {
  id: string;
  sku: string;
  category: 'surveillance' | 'computing' | 'networking' | 'storage';
  qty: number;
  specSummary: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const items: IndustrialBOMItem[] = body.items || [];

    const evaluated = items.map((item) => {
      const requiresCst = item.category === 'surveillance' || item.category === 'networking';
      const requiresSaber = item.category === 'computing' || item.category === 'storage' || item.category === 'surveillance';
      
      return {
        ...item,
        cstMandate: requiresCst ? 'CST_TELECOM_REVIEW_REQUIRED' : 'N/A',
        saberMandate: requiresSaber ? 'PCOC_SCOP_MANDATORY' : 'EXEMPT',
        riskLevel: requiresCst ? 'HIGH_PORT_SCRUTINY' : 'STANDARD',
        estimatedClearanceHours: requiresCst ? 48 : 24,
      };
    });

    return NextResponse.json({
      status: 'AUDIT_SUCCESS',
      timestamp: new Date().toISOString(),
      destination: 'Riyadh Industrial Zone DDP',
      manifestCount: evaluated.length,
      evaluatedItems: evaluated,
    });
  } catch (err: any) {
    return NextResponse.json({ status: 'ERROR', message: err.message }, { status: 400 });
  }
}