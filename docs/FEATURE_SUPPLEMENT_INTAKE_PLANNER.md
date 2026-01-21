# Feature: Supplement Intake Planner

## Overview

A planning tool that helps users plan their supplement intake BEFORE buying to avoid nutrient overdose by calculating cumulative daily intake across multiple supplements.

**Goal:** Prevent users from accidentally overdosing on vitamins/minerals by showing them the combined daily intake from all planned supplements against maximum safe limits.

---

## The Three Input Methods

| Method | Description | Complexity |
|--------|-------------|------------|
| **1. From History** | Select previous supplements + search by brand for new variants | Medium (needs scraping) |
| **2. AI-Assisted** | User describes needs → AI recommends based on their brand preferences | High (AI + scraping) |
| **3. Manual Entry** | User types everything (name, brand, each nutrient value) | Low (just calculations) |

### Method 1: From History
- User can select supplements they've used before
- User can search by previous brands they've used
- System scrapes/searches to find if the same brand has the supplement they want
- Automatically fetches nutritional data for the selected product

### Method 2: AI-Assisted Search
- User types what supplements they need (e.g., "I need something for sleep and energy")
- System uses AI to recommend supplements
- Considers user's previous brand preferences when recommending
- Scrapes web to get product details and nutritional info

### Method 3: Manual Entry
- User types everything manually:
  - Supplement name
  - Brand
  - Individual nutrient values (Vitamin D: 5000 IU, etc.)
- Basic calculations performed to show daily intake totals
- No API calls needed - cheapest option

---

## Key Data Requirements

### 1. Nutrient Values Source
- **Methods 1 & 2:** Scrape/search product pages for nutrition facts
- **Method 3:** User enters manually

### 2. Reference Database Needed
- Maximum daily intake (Upper Limits) for each nutrient
- Recommended Daily Allowance (RDA) values
- Potentially sex/age-aware thresholds (similar to existing biomarker thresholds)

---

## Live vs Button-Triggered Fetching

### The Question
Should nutrient values be fetched live as the user types, or require a button press?

### Options Comparison

| Approach | Pros | Cons |
|----------|------|------|
| **Live (on type)** | Smoother UX, instant feedback | Expensive, many wasted API calls |
| **Button trigger** | Cost-controlled, intentional | Extra click, slightly worse UX |
| **Hybrid** | Best of both | More complex to build |

### Recommended: Hybrid Approach
- **Manual entry fields** → Update calculations instantly (no API cost)
- **Brand/product search** → Require button click or explicit "search" action
- **Debounce search inputs** → Wait 500ms after typing stops before searching
- **Aggressive caching** → If user searches "NOW Foods Vitamin D" once, don't call API again

---

## Proposed UX Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   START NEW PLAN                             │
├─────────────────────────────────────────────────────────────┤
│  How would you like to add supplements?                      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  From My     │  │  AI Search   │  │   Manual     │       │
│  │  History     │  │  & Recommend │  │   Entry      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   PLANNING WORKSPACE                         │
├─────────────────────────────────────────────────────────────┤
│  Selected Supplements:                                       │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [×] NOW Foods Vitamin D3 5000IU                         ││
│  │ [×] Thorne Magnesium Bisglycinate                       ││
│  │ [×] Nordic Naturals Omega-3                             ││
│  │                                          [+ Add More]   ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Daily Intake Summary:          (updates live as you add)   │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Nutrient      │ Your Total │ Max Safe │ Status          ││
│  │───────────────│────────────│──────────│─────────────────││
│  │ Vitamin D     │ 5000 IU    │ 4000 IU  │ ⚠️ OVER LIMIT   ││
│  │ Magnesium     │ 400 mg     │ 420 mg   │ ✓ OK            ││
│  │ Omega-3 (EPA) │ 650 mg     │ 3000 mg  │ ✓ OK            ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Save Plan]  [Export]  [Convert to Active Supplements]      │
└─────────────────────────────────────────────────────────────┘
```

---

## Open Questions

1. **Data source for nutrient values** - Which API/scraping service to use?
2. **Max daily intake reference** - Build our own database or use an existing API?
3. **Cost management** - How to limit AI/scraping calls?
4. **Plan persistence** - Should plans be saved to database or session-only?
5. **Integration with existing supplements** - How to convert a plan to actual tracked supplements?

---

## Technical Considerations

### Existing Infrastructure That Helps
- Groq SDK already installed (for AI recommendations)
- Supabase database ready for new tables
- React Query for state management
- Existing supplement model could be extended

### New Infrastructure Needed
- Nutrient reference data (RDA/Upper Limits table)
- Scraping/search service integration
- Plan storage schema
- Nutrient extraction from product data

---

## Next Steps

1. Clarify the open questions above
2. Define the database schema for plans and nutrient reference data
3. Choose scraping/search approach
4. Design detailed component architecture
5. Create implementation plan with phases
