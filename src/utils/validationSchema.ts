export const STATUTORY_PRE_CLEARANCE_DISCLAIMER =
  "PRE-SUBMISSION VERIFICATION ONLY: This digital report is an automated technical audit and does not constitute an official statutory certificate (PCoC/SCoC) or customs release. Legal certification and port clearance remain subject to accredited CAB approval and licensed customs brokerage on official government portals (SABER/Fasah).";

export const REGEX_PATTERNS = {
  HS_CODE: /^\d{4}\.\d{2}(\.\d{2})?$/,
  TAX_ID_KSA: /^3\d{13}3$/,
  POSITIVE_NUM: /^(?!0\d)\d*(\.\d{1,4})?$/,
  INVOICE_REF: /^[A-Z0-9_-]{3,32}$/
};

export interface RawLineItem {
  code?: string;
  name?: string;
  material?: string;
  qty?: string | number;
  unitPrice?: string | number;
  hsCode?: string;
}

export interface ValidatedLineItem {
  code: string;
  name: string;
  material: string;
  qty: number;
  unitPrice: number;
  hsCode: string;
  total: number;
}

export interface ValidationReport {
  isValid: boolean;
  sanitizedItems: ValidatedLineItem[];
  errors: string[];
}

export function validateAndSanitizePayload(
  rawItems: RawLineItem[],
  clientTaxId?: string
): ValidationReport {
  const errors: string[] = [];
  const sanitizedItems: ValidatedLineItem[] = [];

  if (clientTaxId && !REGEX_PATTERNS.TAX_ID_KSA.test(clientTaxId.trim())) {
    errors.push(`INVALID_TAX_ID: "${clientTaxId}" fails ZATCA 15-digit format (3xxxxxxxxxxxx3).`);
  }

  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    errors.push("EMPTY_PAYLOAD: At least one item is required.");
    return { isValid: false, sanitizedItems, errors };
  }

  rawItems.forEach((item, index) => {
    const row = index + 1;

    const qty = Number(item.qty);
    if (isNaN(qty) || qty <= 0) {
      errors.push(`ROW_${row}: Quantity must be a positive number (got "${item.qty}").`);
    }

    const unitPrice = Number(item.unitPrice);
    if (isNaN(unitPrice) || unitPrice < 0) {
      errors.push(`ROW_${row}: Unit price must be zero or positive (got "${item.unitPrice}").`);
    }

    let hsCode = (item.hsCode || "").trim();
    if (hsCode && !REGEX_PATTERNS.HS_CODE.test(hsCode)) {
      errors.push(`ROW_${row}: Invalid HS code "${hsCode}". Must follow ####.## or ####.##.## format.`);
    } else if (!hsCode) {
      const desc = `${item.name || ""} ${item.material || ""}`.toUpperCase();
      if (desc.includes("ALUM") || desc.includes("MULLION")) hsCode = "7604.29.00";
      else if (desc.includes("GLASS") || desc.includes("GLAZ")) hsCode = "7007.19.00";
      else if (desc.includes("STEEL") || desc.includes("BEAM")) hsCode = "7308.90.00";
      else hsCode = "8487.90.00";
    }

    const code = (item.code || `LINE-${String(row).padStart(2, "0")}`).trim().toUpperCase();
    const name = (item.name || "Standard Submittal Specimen").trim();
    const material = (item.material || "Commercial Specified Grade").trim();

    const cleanQty = isNaN(qty) || qty <= 0 ? 1 : qty;
    const cleanPrice = isNaN(unitPrice) || unitPrice < 0 ? 0 : unitPrice;

    sanitizedItems.push({
      code,
      name,
      material,
      qty: cleanQty,
      unitPrice: cleanPrice,
      hsCode,
      total: cleanQty * cleanPrice
    });
  });

  return {
    isValid: errors.length === 0,
    sanitizedItems,
    errors
  };
}