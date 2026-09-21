# MIU_33 Studio // Cross-Border Pre-Clearance Engine

Deterministic trade compliance and statutory document pre-validation engine designed for China-GCC/Saudi industrial procurement pipelines.

## Architectural Overview

- **ZATCA Phase-2 Schema Pre-Check**: Validates commercial invoice metadata, 15-digit Saudi Tax ID syntax, and cryptographic TLV payload structures.
- **SABER & SASO Dossier Validator**: Pre-screens technical specifications, HS codes, and mill test certificates against Saudi statutory regulations before formal submission.
- **Client-Side Staging Sandbox**: Append-only ingestion ledger preventing unvalidated mutations or schema cascades into production systems.

## Legal & Regulatory Scope

This platform operates strictly as a digital technical document preparation, data verification, and workflow auditing software tool. 

The Platform is **not** an accredited Conformity Assessment Body (CAB), an authorized certification body, a licensed customs clearing agent, or an affiliated governmental entity of the Kingdom of Saudi Arabia. Official certificates (PCoC/SCoC) and customs releases require formal submission through authorized portals (SABER/Fasah) by accredited CABs and licensed customs brokers.

For full terms and scope limitations, refer to [DISCLAIMER.md](./DISCLAIMER.md).

## Local Development

```bash
npm install
npm run dev
