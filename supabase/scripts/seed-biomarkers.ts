import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

// Load environment variables from .env file
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL environment variable is required");
}

if (!supabaseKey) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ============================================================================
// BIOMARKER DATA STRUCTURE
// ============================================================================

interface Biomarker {
  name: string;
  short_name: string;
  slug: string;
  unit: string;
  category_id: string;
  thresholds: {
    unit: string;
    bands: Array<{
      name: string;
      min: number | null;
      max: number | null;
      status: "optimal" | "borderline" | "out_of_range";
    }>;
  };
  synonyms: string[];
}

// ============================================================================
// BIOMARKERS DATA WITH CATEGORIES, UNITS & THRESHOLDS
// ============================================================================

const biomarkersData: Biomarker[] = [
  // ========== BLOOD & IMMUNE (CBC) ==========
  {
    name: "White blood cell count",
    short_name: "WBC",
    slug: "wbc",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "low", min: null, max: 3.5, status: "out_of_range" },
        { name: "optimal", min: 3.5, max: 11, status: "optimal" },
        { name: "high", min: 11, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["WBC", "Leucocytes", "Leukocytes", "White cells"],
  },
  {
    name: "Red blood cell count",
    short_name: "RBC",
    slug: "rbc",
    unit: "10^12/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^12/L",
      bands: [
        { name: "low", min: null, max: 4.0, status: "out_of_range" },
        { name: "optimal", min: 4.0, max: 5.5, status: "optimal" },
        { name: "high", min: 5.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["RBC", "Red cells", "Erythrocytes", "Hématies"],
  },
  {
    name: "Hemoglobin",
    short_name: "Hgb",
    slug: "hemoglobin",
    unit: "g/dL",
    category_id: "blood_immune",
    thresholds: {
      unit: "g/dL",
      bands: [
        { name: "low", min: null, max: 12, status: "out_of_range" },
        { name: "optimal", min: 12, max: 17.5, status: "optimal" },
        { name: "high", min: 17.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Hgb", "Hemoglobin", "Hémoglobine"],
  },
  {
    name: "Hematocrit",
    short_name: "Hct",
    slug: "hematocrit",
    unit: "%",
    category_id: "blood_immune",
    thresholds: {
      unit: "%",
      bands: [
        { name: "low", min: null, max: 36, status: "out_of_range" },
        { name: "optimal", min: 36, max: 52, status: "optimal" },
        { name: "high", min: 52, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Hct", "Hematocrite", "Packed cell volume", "PCV"],
  },
  {
    name: "Mean corpuscular volume",
    short_name: "MCV",
    slug: "mcv",
    unit: "fL",
    category_id: "blood_immune",
    thresholds: {
      unit: "fL",
      bands: [
        { name: "low", min: null, max: 80, status: "out_of_range" },
        { name: "optimal", min: 80, max: 100, status: "optimal" },
        { name: "high", min: 100, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["MCV", "V.G.M.", "Mean cell volume"],
  },
  {
    name: "Mean corpuscular hemoglobin",
    short_name: "MCH",
    slug: "mch",
    unit: "pg",
    category_id: "blood_immune",
    thresholds: {
      unit: "pg",
      bands: [
        { name: "low", min: null, max: 27, status: "out_of_range" },
        { name: "optimal", min: 27, max: 33, status: "optimal" },
        { name: "high", min: 33, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["MCH", "T.C.M.H.", "Mean cell hemoglobin"],
  },
  {
    name: "Mean corpuscular hemoglobin concentration",
    short_name: "MCHC",
    slug: "mchc",
    unit: "g/dL",
    category_id: "blood_immune",
    thresholds: {
      unit: "g/dL",
      bands: [
        { name: "low", min: null, max: 32, status: "out_of_range" },
        { name: "optimal", min: 32, max: 36, status: "optimal" },
        { name: "high", min: 36, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["MCHC", "C.C.M.H.", "Mean cell Hb concentration"],
  },
  {
    name: "Red cell distribution width",
    short_name: "RDW",
    slug: "rdw",
    unit: "%",
    category_id: "blood_immune",
    thresholds: {
      unit: "%",
      bands: [
        { name: "optimal", min: 11.5, max: 14.5, status: "optimal" },
        { name: "high", min: 14.5, max: null, status: "borderline" },
      ],
    },
    synonyms: ["RDW", "Red cell distribution width"],
  },
  {
    name: "Platelet count",
    short_name: "Plt",
    slug: "platelet-count",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "low", min: null, max: 150, status: "out_of_range" },
        { name: "optimal", min: 150, max: 400, status: "optimal" },
        { name: "high", min: 400, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Plt", "Platelet count", "Thrombocytes", "Plaquettes"],
  },
  {
    name: "Mean platelet volume",
    short_name: "MPV",
    slug: "mpv",
    unit: "fL",
    category_id: "blood_immune",
    thresholds: {
      unit: "fL",
      bands: [
        { name: "optimal", min: 7.4, max: 10.4, status: "optimal" },
        { name: "borderline", min: 10.4, max: 12, status: "borderline" },
        { name: "high", min: 12, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["MPV", "Mean platelet volume"],
  },
  {
    name: "Neutrophils",
    short_name: "Neu",
    slug: "neutrophils",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "low", min: null, max: 1.5, status: "out_of_range" },
        { name: "optimal", min: 1.5, max: 8, status: "optimal" },
        { name: "high", min: 8, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Neu", "Neutrophils", "Polynucléaires neutrophiles"],
  },
  {
    name: "Lymphocytes",
    short_name: "Lym",
    slug: "lymphocytes",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "low", min: null, max: 1, status: "borderline" },
        { name: "optimal", min: 1, max: 4.8, status: "optimal" },
        { name: "high", min: 4.8, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Lym", "Lymphocytes"],
  },
  {
    name: "Monocytes",
    short_name: "Mon",
    slug: "monocytes",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "optimal", min: 0.2, max: 0.8, status: "optimal" },
        { name: "high", min: 0.8, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Mon", "Monocytes", "Monocytes"],
  },
  {
    name: "Eosinophils",
    short_name: "Eos",
    slug: "eosinophils",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "optimal", min: 0, max: 0.5, status: "optimal" },
        { name: "high", min: 0.5, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Eos", "Eosinophils", "Polynucléaires éosinophiles"],
  },
  {
    name: "Basophils",
    short_name: "Bas",
    slug: "basophils",
    unit: "10^9/L",
    category_id: "blood_immune",
    thresholds: {
      unit: "10^9/L",
      bands: [
        { name: "optimal", min: 0, max: 0.1, status: "optimal" },
        { name: "high", min: 0.1, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Bas", "Basophils", "Polynucléaires basophiles"],
  },

  // ========== IRON METABOLISM (BLOOD & IMMUNE) ==========
  {
    name: "Serum iron",
    short_name: "Fe",
    slug: "serum-iron",
    unit: "μg/dL",
    category_id: "blood_immune",
    thresholds: {
      unit: "μg/dL",
      bands: [
        { name: "low", min: null, max: 60, status: "out_of_range" },
        { name: "optimal", min: 60, max: 170, status: "optimal" },
        { name: "high", min: 170, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Fe", "Serum iron", "Iron"],
  },
  {
    name: "Ferritin",
    short_name: "Fer",
    slug: "ferritin",
    unit: "ng/mL",
    category_id: "blood_immune",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "low", min: null, max: 30, status: "borderline" },
        { name: "optimal", min: 30, max: 300, status: "optimal" },
        { name: "high", min: 300, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Fer", "Ferritin"],
  },
  {
    name: "Total iron-binding capacity",
    short_name: "TIBC",
    slug: "tibc",
    unit: "μg/dL",
    category_id: "blood_immune",
    thresholds: {
      unit: "μg/dL",
      bands: [
        { name: "optimal", min: 250, max: 425, status: "optimal" },
        { name: "borderline", min: 200, max: 250, status: "borderline" },
        { name: "high", min: 425, max: null, status: "borderline" },
      ],
    },
    synonyms: ["TIBC", "Total iron-binding capacity"],
  },
  {
    name: "Transferrin",
    short_name: "TSAT",
    slug: "transferrin",
    unit: "%",
    category_id: "blood_immune",
    thresholds: {
      unit: "%",
      bands: [
        { name: "low", min: null, max: 16, status: "out_of_range" },
        { name: "optimal", min: 16, max: 45, status: "optimal" },
        { name: "high", min: 45, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["TSAT", "Transferrin saturation", "Transferrin"],
  },
  {
    name: "Transferrin saturation",
    short_name: "Tf Sat",
    slug: "transferrin-saturation",
    unit: "%",
    category_id: "blood_immune",
    thresholds: {
      unit: "%",
      bands: [
        { name: "low", min: null, max: 20, status: "borderline" },
        { name: "optimal", min: 20, max: 50, status: "optimal" },
        { name: "high", min: 50, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Tf Sat", "Transferrin saturation"],
  },

  // ========== METABOLISM (GLUCOSE, ELECTROLYTES, ETC.) ==========
  {
    name: "Fasting plasma glucose",
    short_name: "Glucose",
    slug: "fasting-glucose",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "low", min: null, max: 70, status: "out_of_range" },
        { name: "optimal", min: 70, max: 100, status: "optimal" },
        { name: "borderline", min: 100, max: 126, status: "borderline" },
        { name: "high", min: 126, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Glucose", "Fasting glucose", "Blood glucose", "Glycémie"],
  },
  {
    name: "Hemoglobin A1c",
    short_name: "HbA1c",
    slug: "hba1c",
    unit: "%",
    category_id: "metabolism",
    thresholds: {
      unit: "%",
      bands: [
        { name: "optimal", min: 0, max: 5.7, status: "optimal" },
        { name: "borderline", min: 5.7, max: 6.5, status: "borderline" },
        { name: "high", min: 6.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["HbA1c", "Hemoglobin A1c", "Glycated hemoglobin"],
  },
  {
    name: "Blood urea nitrogen",
    short_name: "BUN",
    slug: "bun",
    unit: "mg/dL",
    category_id: "organ",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 7, max: 20, status: "optimal" },
        { name: "borderline_high", min: 20, max: 25, status: "borderline" },
        { name: "high", min: 25, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["BUN", "Blood urea nitrogen", "Urée"],
  },
  {
    name: "Creatinine",
    short_name: "Cr",
    slug: "creatinine",
    unit: "mg/dL",
    category_id: "organ",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0.6, max: 1.2, status: "optimal" },
        { name: "borderline", min: 1.2, max: 1.5, status: "borderline" },
        { name: "high", min: 1.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Cr", "Creatinine", "Créatinine"],
  },
  {
    name: "Estimated glomerular filtration rate",
    short_name: "eGFR",
    slug: "egfr",
    unit: "mL/min/1.73m²",
    category_id: "organ",
    thresholds: {
      unit: "mL/min/1.73m²",
      bands: [
        { name: "low", min: null, max: 15, status: "out_of_range" },
        { name: "borderline", min: 15, max: 60, status: "borderline" },
        { name: "optimal", min: 60, max: null, status: "optimal" },
      ],
    },
    synonyms: ["eGFR", "Estimated GFR", "GFR"],
  },
  {
    name: "Uric acid",
    short_name: "UA",
    slug: "uric-acid",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 3.5, max: 7.2, status: "optimal" },
        { name: "borderline", min: 7.2, max: 8, status: "borderline" },
        { name: "high", min: 8, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["UA", "Uric acid", "Acide urique"],
  },
  {
    name: "Sodium",
    short_name: "Na",
    slug: "sodium",
    unit: "mEq/L",
    category_id: "metabolism",
    thresholds: {
      unit: "mEq/L",
      bands: [
        { name: "low", min: null, max: 135, status: "out_of_range" },
        { name: "optimal", min: 135, max: 145, status: "optimal" },
        { name: "high", min: 145, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Na", "Sodium", "Sodium"],
  },
  {
    name: "Potassium",
    short_name: "K",
    slug: "potassium",
    unit: "mEq/L",
    category_id: "metabolism",
    thresholds: {
      unit: "mEq/L",
      bands: [
        { name: "low", min: null, max: 3.5, status: "out_of_range" },
        { name: "optimal", min: 3.5, max: 5, status: "optimal" },
        { name: "high", min: 5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["K", "Potassium", "Potassium"],
  },
  {
    name: "Chloride",
    short_name: "Cl",
    slug: "chloride",
    unit: "mEq/L",
    category_id: "metabolism",
    thresholds: {
      unit: "mEq/L",
      bands: [
        { name: "low", min: null, max: 96, status: "borderline" },
        { name: "optimal", min: 96, max: 106, status: "optimal" },
        { name: "high", min: 106, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Cl", "Chloride"],
  },
  {
    name: "Bicarbonate",
    short_name: "HCO3",
    slug: "bicarbonate",
    unit: "mEq/L",
    category_id: "metabolism",
    thresholds: {
      unit: "mEq/L",
      bands: [
        { name: "optimal", min: 23, max: 29, status: "optimal" },
        { name: "borderline", min: 20, max: 23, status: "borderline" },
        { name: "high", min: 29, max: null, status: "borderline" },
      ],
    },
    synonyms: ["HCO3", "Bicarbonate", "CO2", "Bicarbonate"],
  },
  {
    name: "Calcium (total)",
    short_name: "Ca",
    slug: "calcium-total",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "low", min: null, max: 8.5, status: "out_of_range" },
        { name: "optimal", min: 8.5, max: 10.5, status: "optimal" },
        { name: "high", min: 10.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Ca", "Calcium", "Total calcium", "Calcium total"],
  },
  {
    name: "Ionized calcium",
    short_name: "iCa",
    slug: "ionized-calcium",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 4.5, max: 5.3, status: "optimal" },
        { name: "borderline", min: 4, max: 4.5, status: "borderline" },
      ],
    },
    synonyms: ["iCa", "Ionized calcium", "Free calcium"],
  },
  {
    name: "Phosphate",
    short_name: "Phos",
    slug: "phosphate",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 2.5, max: 4.5, status: "optimal" },
        { name: "borderline", min: 2, max: 2.5, status: "borderline" },
        { name: "high", min: 4.5, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Phos", "Phosphate", "Phosphorus", "Phosphore"],
  },
  {
    name: "Magnesium",
    short_name: "Mg",
    slug: "magnesium",
    unit: "mg/dL",
    category_id: "metabolism",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "low", min: null, max: 1.7, status: "borderline" },
        { name: "optimal", min: 1.7, max: 2.2, status: "optimal" },
        { name: "high", min: 2.2, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Mg", "Magnesium"],
  },
  {
    name: "Albumin",
    short_name: "Alb",
    slug: "albumin",
    unit: "g/dL",
    category_id: "organ",
    thresholds: {
      unit: "g/dL",
      bands: [
        { name: "low", min: null, max: 3.4, status: "out_of_range" },
        { name: "optimal", min: 3.4, max: 5.4, status: "optimal" },
        { name: "high", min: 5.4, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Alb", "Albumin"],
  },
  {
    name: "Total protein",
    short_name: "TP",
    slug: "total-protein",
    unit: "g/dL",
    category_id: "organ",
    thresholds: {
      unit: "g/dL",
      bands: [
        { name: "low", min: null, max: 6, status: "borderline" },
        { name: "optimal", min: 6, max: 8.3, status: "optimal" },
        { name: "high", min: 8.3, max: null, status: "borderline" },
      ],
    },
    synonyms: ["TP", "Total protein", "Protéines totales"],
  },

  // ========== ORGAN FUNCTION - LIVER ==========
  {
    name: "Alanine aminotransferase",
    short_name: "ALT",
    slug: "alt",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 0, max: 40, status: "optimal" },
        { name: "borderline", min: 40, max: 80, status: "borderline" },
        { name: "high", min: 80, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["ALT", "ALAT", "GPT", "Alanine aminotransferase", "SGPT"],
  },
  {
    name: "Aspartate aminotransferase",
    short_name: "AST",
    slug: "ast",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 0, max: 40, status: "optimal" },
        { name: "borderline", min: 40, max: 80, status: "borderline" },
        { name: "high", min: 80, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["AST", "ASAT", "GOT", "Aspartate aminotransferase", "SGOT"],
  },
  {
    name: "Gamma-glutamyl transferase",
    short_name: "GGT",
    slug: "ggt",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 0, max: 65, status: "optimal" },
        { name: "borderline", min: 65, max: 150, status: "borderline" },
        { name: "high", min: 150, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["GGT", "Gamma-glutamyl transferase"],
  },
  {
    name: "Alkaline phosphatase",
    short_name: "ALP",
    slug: "alp",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 30, max: 120, status: "optimal" },
        { name: "borderline", min: 20, max: 30, status: "borderline" },
        { name: "high", min: 120, max: null, status: "borderline" },
      ],
    },
    synonyms: ["ALP", "Alkaline phosphatase", "Phosphatase alcaline"],
  },
  {
    name: "Total bilirubin",
    short_name: "TBIL",
    slug: "total-bilirubin",
    unit: "mg/dL",
    category_id: "organ",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 1.2, status: "optimal" },
        { name: "borderline", min: 1.2, max: 2, status: "borderline" },
        { name: "high", min: 2, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["TBIL", "Total bilirubin", "Bilirubine totale"],
  },
  {
    name: "Direct bilirubin",
    short_name: "DBIL",
    slug: "direct-bilirubin",
    unit: "mg/dL",
    category_id: "organ",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 0.3, status: "optimal" },
        { name: "borderline", min: 0.3, max: 0.6, status: "borderline" },
        { name: "high", min: 0.6, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["DBIL", "Direct bilirubin", "Conjugated bilirubin"],
  },

  // ========== CARDIOVASCULAR ==========
  {
    name: "Total cholesterol",
    short_name: "TC",
    slug: "total-cholesterol",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 200, status: "optimal" },
        { name: "borderline", min: 200, max: 240, status: "borderline" },
        { name: "high", min: 240, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["TC", "Total cholesterol", "Cholestérol total"],
  },
  {
    name: "LDL cholesterol",
    short_name: "LDL",
    slug: "ldl-cholesterol",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 100, status: "optimal" },
        { name: "borderline", min: 100, max: 130, status: "borderline" },
        { name: "high", min: 130, max: 160, status: "borderline" },
        { name: "very_high", min: 160, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["LDL", "LDL cholesterol", "Bad cholesterol"],
  },
  {
    name: "HDL cholesterol",
    short_name: "HDL",
    slug: "hdl-cholesterol",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "low", min: null, max: 40, status: "out_of_range" },
        { name: "optimal", min: 40, max: null, status: "optimal" },
      ],
    },
    synonyms: ["HDL", "HDL cholesterol", "Good cholesterol"],
  },
  {
    name: "Non-HDL cholesterol",
    short_name: "Non-HDL",
    slug: "non-hdl-cholesterol",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 130, status: "optimal" },
        { name: "borderline", min: 130, max: 160, status: "borderline" },
        { name: "high", min: 160, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Non-HDL", "Non-HDL cholesterol"],
  },
  {
    name: "Triglycerides",
    short_name: "TG",
    slug: "triglycerides",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 150, status: "optimal" },
        { name: "borderline", min: 150, max: 200, status: "borderline" },
        { name: "high", min: 200, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["TG", "Triglycerides", "Triglycérides"],
  },
  {
    name: "Apolipoprotein B",
    short_name: "ApoB",
    slug: "apob",
    unit: "mg/dL",
    category_id: "cardio",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 0, max: 90, status: "optimal" },
        { name: "borderline", min: 90, max: 110, status: "borderline" },
        { name: "high", min: 110, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["ApoB", "Apolipoprotein B"],
  },

  // ========== HORMONAL ==========
  {
    name: "Thyroid-stimulating hormone",
    short_name: "TSH",
    slug: "tsh",
    unit: "mIU/L",
    category_id: "hormonal",
    thresholds: {
      unit: "mIU/L",
      bands: [
        { name: "low", min: null, max: 0.4, status: "borderline" },
        { name: "optimal", min: 0.4, max: 4, status: "optimal" },
        { name: "high", min: 4, max: null, status: "borderline" },
      ],
    },
    synonyms: ["TSH", "Thyroid stimulating hormone"],
  },
  {
    name: "Free T4",
    short_name: "FT4",
    slug: "free-t4",
    unit: "pg/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "pg/mL",
      bands: [
        { name: "low", min: null, max: 0.8, status: "borderline" },
        { name: "optimal", min: 0.8, max: 1.8, status: "optimal" },
        { name: "high", min: 1.8, max: null, status: "borderline" },
      ],
    },
    synonyms: ["FT4", "Free T4", "Free thyroxine"],
  },
  {
    name: "Free T3",
    short_name: "FT3",
    slug: "free-t3",
    unit: "pg/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "pg/mL",
      bands: [
        { name: "low", min: null, max: 2.3, status: "borderline" },
        { name: "optimal", min: 2.3, max: 4.2, status: "optimal" },
        { name: "high", min: 4.2, max: null, status: "borderline" },
      ],
    },
    synonyms: ["FT3", "Free T3", "Free triiodothyronine"],
  },
  {
    name: "Fasting insulin",
    short_name: "Insulin",
    slug: "fasting-insulin",
    unit: "mIU/L",
    category_id: "hormonal",
    thresholds: {
      unit: "mIU/L",
      bands: [
        { name: "optimal", min: 0, max: 12, status: "optimal" },
        { name: "borderline", min: 12, max: 20, status: "borderline" },
        { name: "high", min: 20, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Insulin", "Fasting insulin"],
  },
  {
    name: "C-peptide",
    short_name: "C-Pep",
    slug: "c-peptide",
    unit: "ng/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "optimal", min: 0.8, max: 3.1, status: "optimal" },
        { name: "borderline", min: 3.1, max: 5, status: "borderline" },
      ],
    },
    synonyms: ["C-Pep", "C-peptide"],
  },
  {
    name: "Total testosterone",
    short_name: "T",
    slug: "total-testosterone",
    unit: "ng/dL",
    category_id: "hormonal",
    thresholds: {
      unit: "ng/dL",
      bands: [
        { name: "low", min: null, max: 300, status: "out_of_range" },
        { name: "optimal", min: 300, max: 1000, status: "optimal" },
        { name: "high", min: 1000, max: null, status: "borderline" },
      ],
    },
    synonyms: ["T", "Total testosterone", "Testosterone"],
  },
  {
    name: "Free testosterone",
    short_name: "Free T",
    slug: "free-testosterone",
    unit: "pg/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "pg/mL",
      bands: [
        { name: "low", min: null, max: 4, status: "out_of_range" },
        { name: "optimal", min: 4, max: 24, status: "optimal" },
        { name: "high", min: 24, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Free T", "Free testosterone"],
  },
  {
    name: "Sex hormone–binding globulin",
    short_name: "SHBG",
    slug: "shbg",
    unit: "nmol/L",
    category_id: "hormonal",
    thresholds: {
      unit: "nmol/L",
      bands: [
        { name: "optimal", min: 20, max: 100, status: "optimal" },
        { name: "borderline", min: 10, max: 20, status: "borderline" },
        { name: "high", min: 100, max: null, status: "borderline" },
      ],
    },
    synonyms: ["SHBG", "Sex hormone-binding globulin"],
  },
  {
    name: "Estradiol",
    short_name: "E2",
    slug: "estradiol",
    unit: "pg/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "pg/mL",
      bands: [
        { name: "low", min: null, max: 10, status: "borderline" },
        { name: "optimal", min: 10, max: 50, status: "optimal" },
        { name: "high", min: 50, max: null, status: "borderline" },
      ],
    },
    synonyms: ["E2", "Estradiol", "Estrogen"],
  },
  {
    name: "Progesterone",
    short_name: "Prog",
    slug: "progesterone",
    unit: "ng/mL",
    category_id: "hormonal",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "low", min: null, max: 0.3, status: "out_of_range" },
        { name: "optimal", min: 0.3, max: 30, status: "optimal" },
        { name: "high", min: 30, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Prog", "Progesterone"],
  },
  {
    name: "DHEA-S",
    short_name: "DHEAS",
    slug: "dhea-s",
    unit: "μg/dL",
    category_id: "hormonal",
    thresholds: {
      unit: "μg/dL",
      bands: [
        { name: "low", min: null, max: 50, status: "borderline" },
        { name: "optimal", min: 50, max: 300, status: "optimal" },
        { name: "high", min: 300, max: null, status: "borderline" },
      ],
    },
    synonyms: ["DHEAS", "DHEA-S", "DHEA-Sulfate"],
  },

  // ========== NUTRITIONAL ==========
  {
    name: "25-hydroxy vitamin D",
    short_name: "Vitamin D",
    slug: "vitamin-d",
    unit: "ng/mL",
    category_id: "nutritional",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "deficient", min: null, max: 20, status: "out_of_range" },
        { name: "insufficient", min: 20, max: 30, status: "borderline" },
        { name: "optimal", min: 30, max: 100, status: "optimal" },
        { name: "high", min: 100, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Vitamin D", "25-OH Vitamin D", "25-OHD"],
  },
  {
    name: "Vitamin B12",
    short_name: "B12",
    slug: "vitamin-b12",
    unit: "pg/mL",
    category_id: "nutritional",
    thresholds: {
      unit: "pg/mL",
      bands: [
        { name: "low", min: null, max: 200, status: "out_of_range" },
        { name: "borderline", min: 200, max: 300, status: "borderline" },
        { name: "optimal", min: 300, max: null, status: "optimal" },
      ],
    },
    synonyms: ["B12", "Vitamin B12", "Cobalamin", "Cyanocobalamine"],
  },
  {
    name: "Folate",
    short_name: "Folate",
    slug: "folate",
    unit: "ng/mL",
    category_id: "nutritional",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "low", min: null, max: 5.4, status: "out_of_range" },
        { name: "optimal", min: 5.4, max: null, status: "optimal" },
      ],
    },
    synonyms: ["Folate", "Folic acid", "Folacin", "Acide folique"],
  },

  // ========== INFLAMMATION ==========
  {
    name: "High-sensitivity C-reactive protein",
    short_name: "hs-CRP",
    slug: "hs-crp",
    unit: "mg/L",
    category_id: "inflammation",
    thresholds: {
      unit: "mg/L",
      bands: [
        { name: "optimal", min: 0, max: 1, status: "optimal" },
        { name: "borderline", min: 1, max: 3, status: "borderline" },
        { name: "high", min: 3, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["hs-CRP", "High-sensitivity CRP", "CRP"],
  },
  {
    name: "Erythrocyte sedimentation rate",
    short_name: "ESR",
    slug: "esr",
    unit: "mm/hr",
    category_id: "inflammation",
    thresholds: {
      unit: "mm/hr",
      bands: [
        { name: "optimal", min: 0, max: 20, status: "optimal" },
        { name: "borderline", min: 20, max: 40, status: "borderline" },
        { name: "high", min: 40, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["ESR", "Sedimentation rate", "Sed rate"],
  },
  {
    name: "Fibrinogen",
    short_name: "Fib",
    slug: "fibrinogen",
    unit: "mg/dL",
    category_id: "inflammation",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 200, max: 400, status: "optimal" },
        { name: "borderline", min: 100, max: 200, status: "borderline" },
        { name: "high", min: 400, max: null, status: "borderline" },
      ],
    },
    synonyms: ["Fib", "Fibrinogen"],
  },
  {
    name: "Procalcitonin",
    short_name: "PCT",
    slug: "procalcitonin",
    unit: "ng/mL",
    category_id: "inflammation",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "optimal", min: 0, max: 0.1, status: "optimal" },
        { name: "borderline", min: 0.1, max: 0.5, status: "borderline" },
        { name: "high", min: 0.5, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["PCT", "Procalcitonin"],
  },

  // ========== COAGULATION ==========
  {
    name: "Prothrombin time",
    short_name: "PT",
    slug: "prothrombin-time",
    unit: "seconds",
    category_id: "blood_immune",
    thresholds: {
      unit: "seconds",
      bands: [
        { name: "optimal", min: 11, max: 13.5, status: "optimal" },
        { name: "borderline", min: 13.5, max: 16, status: "borderline" },
        { name: "high", min: 16, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["PT", "Prothrombin time"],
  },
  {
    name: "International normalized ratio",
    short_name: "INR",
    slug: "inr",
    unit: "ratio",
    category_id: "blood_immune",
    thresholds: {
      unit: "ratio",
      bands: [
        { name: "optimal", min: 0.8, max: 1.1, status: "optimal" },
        { name: "therapeutic", min: 2, max: 3, status: "optimal" },
        { name: "high", min: 3, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["INR", "International normalized ratio"],
  },
  {
    name: "Activated partial thromboplastin time",
    short_name: "aPTT",
    slug: "aptt",
    unit: "seconds",
    category_id: "blood_immune",
    thresholds: {
      unit: "seconds",
      bands: [
        { name: "optimal", min: 25, max: 35, status: "optimal" },
        { name: "borderline", min: 20, max: 25, status: "borderline" },
        { name: "high", min: 35, max: null, status: "borderline" },
      ],
    },
    synonyms: ["aPTT", "Activated partial thromboplastin time", "PTT"],
  },

  // ========== OTHER ==========
  {
    name: "Lactate dehydrogenase",
    short_name: "LDH",
    slug: "ldh",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 140, max: 280, status: "optimal" },
        { name: "borderline", min: 100, max: 140, status: "borderline" },
        { name: "high", min: 280, max: null, status: "borderline" },
      ],
    },
    synonyms: ["LDH", "Lactate dehydrogenase"],
  },
  {
    name: "Creatine kinase",
    short_name: "CK",
    slug: "creatine-kinase",
    unit: "U/L",
    category_id: "organ",
    thresholds: {
      unit: "U/L",
      bands: [
        { name: "optimal", min: 30, max: 200, status: "optimal" },
        { name: "borderline", min: 200, max: 500, status: "borderline" },
        { name: "high", min: 500, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["CK", "CPK", "Creatine kinase"],
  },
  {
    name: "Troponin",
    short_name: "Trop",
    slug: "troponin",
    unit: "ng/mL",
    category_id: "cardio",
    thresholds: {
      unit: "ng/mL",
      bands: [
        { name: "optimal", min: 0, max: 0.04, status: "optimal" },
        { name: "borderline", min: 0.04, max: 0.1, status: "borderline" },
        { name: "high", min: 0.1, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Trop", "Troponin", "Cardiac troponin"],
  },
  {
    name: "Homocysteine",
    short_name: "Hcy",
    slug: "homocysteine",
    unit: "μmol/L",
    category_id: "cardio",
    thresholds: {
      unit: "μmol/L",
      bands: [
        { name: "optimal", min: 0, max: 15, status: "optimal" },
        { name: "borderline", min: 15, max: 30, status: "borderline" },
        { name: "high", min: 30, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Hcy", "Homocysteine"],
  },
  {
    name: "Urea",
    short_name: "Urea",
    slug: "urea",
    unit: "mg/dL",
    category_id: "organ",
    thresholds: {
      unit: "mg/dL",
      bands: [
        { name: "optimal", min: 7, max: 20, status: "optimal" },
        { name: "borderline", min: 20, max: 25, status: "borderline" },
        { name: "high", min: 25, max: null, status: "out_of_range" },
      ],
    },
    synonyms: ["Urea", "Blood urea", "Urée"],
  },
];

// ============================================================================
// SEED FUNCTION
// ============================================================================

async function seedBiomarkers() {
  console.log("Starting biomarker seeding...");

  try {
    for (const biomarker of biomarkersData) {
      // 1. Insert or update biomarker_information
      const { data: existingBiomarker, error: selectError } = await supabase
        .from("biomarkers_information")
        .select("id")
        .eq("slug", biomarker.slug)
        .single();

      let biomarkerId: string;

      if (!selectError && existingBiomarker) {
        // Update existing
        const { data, error } = await supabase
          .from("biomarkers_information")
          .update({
            name: biomarker.name,
            short_name: biomarker.short_name,
            unit: biomarker.unit,
            category_id: biomarker.category_id,
            thresholds: biomarker.thresholds,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingBiomarker.id)
          .select("id")
          .single();

        if (error) {
          console.error(
            `❌ Error updating biomarker ${biomarker.slug}:`,
            error.message
          );
          continue;
        }
        biomarkerId = data!.id;
        console.log(`✅ Updated biomarker: ${biomarker.name}`);
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("biomarkers_information")
          .insert([
            {
              name: biomarker.name,
              short_name: biomarker.short_name,
              slug: biomarker.slug,
              unit: biomarker.unit,
              category_id: biomarker.category_id,
              thresholds: biomarker.thresholds,
            },
          ])
          .select("id")
          .single();

        if (error) {
          console.error(
            `❌ Error inserting biomarker ${biomarker.slug}:`,
            error.message
          );
          continue;
        }
        biomarkerId = data!.id;
        console.log(`✅ Inserted biomarker: ${biomarker.name}`);
      }

      // 2. Delete existing synonyms for this biomarker
      const { error: deleteError } = await supabase
        .from("biomarker_synonyms")
        .delete()
        .eq("biomarker_id", biomarkerId);

      if (deleteError) {
        console.error(
          `⚠️  Error deleting old synonyms for ${biomarker.slug}:`,
          deleteError.message
        );
      }

      // 3. Insert synonyms
      if (biomarker.synonyms.length > 0) {
        const synonymRows = biomarker.synonyms.map((synonym) => ({
          biomarker_id: biomarkerId,
          synonym,
        }));

        const { error: insertSynError } = await supabase
          .from("biomarker_synonyms")
          .insert(synonymRows);

        if (insertSynError) {
          console.error(
            `⚠️  Error inserting synonyms for ${biomarker.slug}:`,
            insertSynError.message
          );
        } else {
          console.log(
            `   → Added ${biomarker.synonyms.length} synonyms for ${biomarker.name}`
          );
        }
      }
    }

    console.log("✅ Seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
  }
}

// Run the seed
seedBiomarkers();
