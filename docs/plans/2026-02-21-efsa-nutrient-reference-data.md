# EFSA Nutrient Reference Data - Verification Document

> **Purpose:** Reference document for Task 4 seed data, comparing EFSA/IOM values with real-world supplement dosages.
> **Approach:** Option B - Hybrid (EFSA primary, US IOM fallback)
> **Created:** 2026-02-21
> **Status:** DRAFT - Pending verification

---

## Table of Contents

1. [Reference Value Types](#reference-value-types)
2. [Age Group Definitions](#age-group-definitions)
3. [Vitamins Reference Table](#vitamins-reference-table)
4. [Minerals Reference Table](#minerals-reference-table)
5. [Other Nutrients](#other-nutrients)
6. [Real-World Supplement Comparison](#real-world-supplement-comparison)
7. [Implementation Notes](#implementation-notes)
8. [Sources](#sources)

---

## Reference Value Types

| Type           | Full Name                     | Definition                                            | Source |
| -------------- | ----------------------------- | ----------------------------------------------------- | ------ |
| **PRI**        | Population Reference Intake   | Meets needs of ~97.5% of population                   | EFSA   |
| **AI**         | Adequate Intake               | Observed adequate intake (when PRI cannot be derived) | EFSA   |
| **UL**         | Tolerable Upper Intake Level  | Maximum safe chronic daily intake                     | EFSA   |
| **RDA**        | Recommended Dietary Allowance | US equivalent of PRI                                  | US IOM |
| **Safe Level** | Safe Level of Intake          | Alternative to UL when dose-response unclear          | EFSA   |

---

## Age Group Definitions

### EFSA Adult Age Groups

| Age Group ID | Ages        | Notes               |
| ------------ | ----------- | ------------------- |
| `18-50`      | 18-50 years | Young/middle adults |
| `51-70`      | 51-70 years | Older adults        |
| `71+`        | 71+ years   | Elderly             |

### Sex Categories

| Sex ID   | Applies To                 |
| -------- | -------------------------- |
| `male`   | Males only                 |
| `female` | Females only               |
| `all`    | Both sexes (no difference) |

### Special Considerations

- **Iron for women**: Pre-menopausal (18-50) have higher needs than post-menopausal (>50)
- **Vitamin D for elderly**: Higher AI (20 µg) for 71+ vs 15 µg for younger adults
- **Calcium**: Same for all adults ≥25 years

---

## Vitamins Reference Table

### Fat-Soluble Vitamins

| Nutrient      | Unit  | Adult PRI/AI     | Sex Diff | UL      | UL Source | Notes                                             |
| ------------- | ----- | ---------------- | -------- | ------- | --------- | ------------------------------------------------- |
| **Vitamin A** | µg RE | M: 750, F: 650   | ✓        | 3000    | EFSA      | Lower UL (1500) recommended for osteoporosis risk |
| **Vitamin D** | µg    | 15 AI (71+: 20)  | No       | **100** | EFSA 2023 | = 4000 IU                                         |
| **Vitamin E** | mg    | M: 13, F: 11 AI  | ✓        | **300** | EFSA 2024 | α-tocopherol only                                 |
| **Vitamin K** | µg    | ~70 AI (~1µg/kg) | No       | None    | EFSA      | No UL established                                 |

### Water-Soluble Vitamins

| Nutrient                          | Unit   | Adult PRI/AI       | Sex Diff     | UL                       | UL Source    | Notes                                           |
| --------------------------------- | ------ | ------------------ | ------------ | ------------------------ | ------------ | ----------------------------------------------- |
| **Vitamin C**                     | mg     | M: 110, F: 95      | ✓            | None (EFSA) / 2000 (IOM) | IOM fallback | EFSA did not set UL                             |
| **Vitamin B1 (Thiamine)**         | mg     | ~1.1 (0.1mg/MJ)    | Energy-based | None                     | EFSA         | No UL established                               |
| **Vitamin B2 (Riboflavin)**       | mg     | 1.6                | No           | None                     | EFSA         | Updated 2017                                    |
| **Vitamin B3 (Niacin)**           | mg NE  | M: ~16.5, F: ~13.2 | Energy-based | NA: 10, NM: 900          | EFSA         | Separate ULs for nicotinic acid vs nicotinamide |
| **Vitamin B5 (Pantothenic Acid)** | mg     | 5 AI               | No           | None                     | EFSA         | No UL established                               |
| **Vitamin B6**                    | mg     | M: 1.7, F: 1.6     | ✓            | **12.5**                 | EFSA 2023    | Lowered from 25mg                               |
| **Vitamin B7 (Biotin)**           | µg     | 40 AI              | No           | None                     | EFSA         | Higher than US (30 µg)                          |
| **Vitamin B9 (Folate)**           | µg DFE | 330                | No           | **1000**                 | EFSA         | UL for synthetic folic acid only                |
| **Vitamin B12**                   | µg     | 4 AI               | No           | None                     | EFSA         | No adverse effects defined                      |

---

## Minerals Reference Table

### Macro Minerals

| Nutrient       | Unit | Adult PRI/AI   | Sex Diff | UL       | UL Source | Notes                              |
| -------------- | ---- | -------------- | -------- | -------- | --------- | ---------------------------------- |
| **Calcium**    | mg   | 950 (≥25y)     | No       | **2500** | EFSA      |                                    |
| **Magnesium**  | mg   | M: 350, F: 300 | ✓        | **250**  | EFSA      | **UL applies to SUPPLEMENTS ONLY** |
| **Potassium**  | mg   | 3500 AI        | No       | None     | EFSA      | No UL established                  |
| **Phosphorus** | mg   | ~550 AI        | No       | None     | EFSA      | No UL established                  |

### Trace Minerals

| Nutrient       | Unit | Adult PRI/AI                       | Sex Diff | UL              | UL Source | Notes                          |
| -------------- | ---- | ---------------------------------- | -------- | --------------- | --------- | ------------------------------ |
| **Iron**       | mg   | M: 11, F: 16 (pre-meno), 11 (post) | ✓        | None / Safe: 25 | EFSA      | No UL; safe supplemental level |
| **Zinc**       | mg   | M: 11, F: 8                        | ✓        | **25**          | EFSA      |                                |
| **Selenium**   | µg   | 70 AI                              | No       | **255**         | EFSA 2023 | Lowered from 300 µg            |
| **Copper**     | mg   | 1.3-1.6                            | ~No      | **5**           | EFSA      |                                |
| **Manganese**  | mg   | 3 AI                               | No       | Safe: 8         | EFSA 2023 | "Safe level", not UL           |
| **Iodine**     | µg   | 150 AI                             | No       | **600**         | EFSA      |                                |
| **Chromium**   | µg   | None                               | —        | None            | EFSA      | No DRV established             |
| **Molybdenum** | µg   | 65 AI                              | No       | **600**         | EFSA      |                                |

---

## Other Nutrients

### Fatty Acids

| Nutrient      | Unit | Adult AI       | UL   | Notes                            |
| ------------- | ---- | -------------- | ---- | -------------------------------- |
| **EPA + DHA** | mg   | 250 combined   | None | EFSA; for cardiovascular benefit |
| **ALA**       | g    | 0.5% of energy | None | Essential omega-3                |

### Amino Acids & Other

| Nutrient        | Unit | Typical Dose | UL   | Notes                              |
| --------------- | ---- | ------------ | ---- | ---------------------------------- |
| **L-Theanine**  | mg   | 100-400      | None | No official DRV                    |
| **Collagen**    | g    | 2.5-15       | None | No official DRV                    |
| **Melatonin**   | mg   | 0.5-5        | None | No official DRV; varies by country |
| **CoQ10**       | mg   | 30-200       | None | No official DRV                    |
| **Ashwagandha** | mg   | 300-600      | None | No official DRV                    |
| **Probiotics**  | CFU  | 10^9-10^10   | None | No official DRV                    |

---

## Real-World Supplement Comparison

### Reference Brand: Raptor Nutrition (France)

Comparing EFSA reference values with actual supplement dosages:

| Product                    | Active Ingredient | Per Serving     | % of EFSA PRI/AI | % of EFSA UL | Assessment                       |
| -------------------------- | ----------------- | --------------- | ---------------- | ------------ | -------------------------------- |
| **Vitamine D3**            | Vitamin D         | 75 µg (3000 IU) | **500%**         | **75%**      | ✅ Safe (under UL 100µg)         |
| **Magnésium Bisglycinate** | Magnesium         | 300 mg          | 86-100%          | **120%**     | ⚠️ Exceeds supplement UL (250mg) |
|                            | Vitamin B6        | 2 mg            | 118-125%         | 16%          | ✅ Safe                          |
|                            | Taurine           | 90 mg           | —                | —            | ✅ No UL                         |
| **Zinc Bisglycinate**      | Zinc              | 30 mg (3 caps)  | 273-375%         | **120%**     | ⚠️ Exceeds UL (25mg)             |
| **Collagène Marin**        | Collagen          | 1,800 mg (1.8g) | —                | —            | ✅ No UL                         |
| **Omega 3 Epax**           | EPA               | 800 mg          | 320%\*           | —            | ✅ No UL                         |
|                            | DHA               | 600 mg          | 240%\*           | —            | ✅ No UL                         |

\*Based on 250mg combined EPA+DHA AI

### Key Observations

1. **Vitamin D at 75 µg (3000 IU)**:

   - ✅ Well within EFSA UL of 100 µg
   - Common "therapeutic" dose in European supplements
   - 1500% of daily value shown on label is vs. lower NRV, not vs. AI

2. **Magnesium at 300 mg**:

   - ⚠️ Exceeds EFSA **supplemental** UL of 250 mg
   - However, this is common in high-bioavailability forms
   - The UL is set conservatively for GI tolerance

3. **Zinc at 30 mg** (at max dose):

   - ⚠️ Exceeds EFSA UL of 25 mg
   - However, many supplements offer 15-30 mg
   - At recommended 1-2 capsules (10-20 mg): ✅ Safe

4. **Omega-3 (EPA 800mg + DHA 600mg)**:

   - ✅ No UL established
   - EFSA considers up to 5g/day EPA+DHA safe
   - This is a typical high-potency fish oil dose

5. **Marine Collagen at 1.8g**:
   - ✅ No official DRV or UL
   - Typical doses range 2.5-15g for skin/joint benefits
   - This is on the lower end

### Conclusion

Real-world supplements often provide doses at or slightly above EFSA ULs. Our app should:

- **Show warnings** when intake exceeds 80% of UL
- **Show danger** when intake exceeds 100% of UL
- **Allow users to proceed** (supplements are generally formulated safely)
- **Note context** (e.g., magnesium UL is for supplements, not total dietary intake)

---

## Implementation Notes

### For `lib/data/nutrients.ts`

```typescript
export const NUTRIENT_CATEGORIES = [
  { id: "vitamins", label: "Vitamins", sort_order: 1 },
  { id: "minerals", label: "Minerals", sort_order: 2 },
  { id: "fatty-acids", label: "Fatty Acids", sort_order: 3 },
  { id: "amino-acids", label: "Amino Acids", sort_order: 4 },
  { id: "other", label: "Other", sort_order: 5 },
] as const;
```

### For `lib/data/nutrient-limits.ts`

**Key changes from original plan:**

1. Age groups: Use `18-50` not `19-50`
2. Vitamin B6 UL: **12.5 mg** (not 25 mg)
3. Selenium UL: **255 µg** (not 300 µg)
4. Iron: Use `safe_level: 25` instead of `upper_limit: 45`
5. Manganese: Use `safe_level: 8` instead of UL
6. Add `ul_source` field: `'EFSA'` or `'IOM'`
7. Add `ul_context` field for special cases like magnesium

### Schema Considerations

```sql
-- Consider adding to nutrient_limits table:
ALTER TABLE nutrient_limits ADD COLUMN ul_source TEXT DEFAULT 'EFSA';
ALTER TABLE nutrient_limits ADD COLUMN ul_context TEXT; -- e.g., 'supplements_only'
ALTER TABLE nutrient_limits ADD COLUMN safe_level DECIMAL; -- For iron, manganese
```

---

## Sources

### EFSA Official

- [EFSA DRV Topic Page](https://www.efsa.europa.eu/en/topics/topic/dietary-reference-values)
- [EFSA DRV Finder Tool](https://multimedia.efsa.europa.eu/drvs/index.htm)
- [EFSA UL Summary Report (2024)](https://www.efsa.europa.eu/sites/default/files/2024-05/ul-summary-report.pdf)

### 2023-2024 Updated ULs

- [Vitamin B6 UL - 2023](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.8006) - Lowered to 12.5 mg
- [Selenium UL - 2023](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.7704) - Lowered to 255 µg
- [Vitamin D UL - 2023](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.8145) - Confirmed 100 µg
- [Vitamin E UL - 2024](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2024.8953) - Confirmed 300 mg
- [Manganese - 2023](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.8413) - Safe level 8 mg
- [Folate UL - 2023](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2023.8353) - Confirmed 1000 µg
- [Vitamin A UL - 2024](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2024.8814) - Confirmed 3000 µg
- [Iron UL - 2024](https://efsa.onlinelibrary.wiley.com/doi/10.2903/j.efsa.2024.8819) - No UL (insufficient data)

### US IOM (Fallback)

- [Dietary Reference Intakes Tables](https://ods.od.nih.gov/HealthInformation/Dietary_Reference_Intakes.aspx)

### Real-World Supplements

- [Raptor Nutrition (FR)](https://raptornutrition.fr/collections) - Used for dosage comparison

---

## Verification Checklist

- [ ] All vitamin ULs verified against 2023-2024 EFSA publications
- [ ] All mineral ULs verified against 2023-2024 EFSA publications
- [ ] Age groups corrected to EFSA standard (18-50, 51-70, 71+)
- [ ] Sex-specific values identified and documented
- [ ] Nutrients without UL clearly marked
- [ ] "Safe level" concept applied for iron and manganese
- [ ] Magnesium UL context (supplements only) documented
- [ ] Real-world supplement comparison completed
- [ ] Implementation notes updated for code changes

---

_Document prepared for PillsMe Supplement Planner - Task 4: Seed EFSA Nutrient Data_
