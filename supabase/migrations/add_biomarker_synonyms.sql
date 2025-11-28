-- Migration: Add comprehensive biomarker synonyms
-- This script adds additional synonyms to improve OCR and manual input matching

-- Use a CTE approach to insert new synonyms, avoiding duplicates
-- First, let's create a temporary structure to hold all the new synonyms

INSERT INTO biomarker_synonyms (biomarker_id, synonym)
SELECT CAST(biomarker_id AS uuid), synonym
FROM (VALUES
  -- Bicarbonate (HCO3) - No existing synonyms
  ('40b72161-02bd-4897-818e-3c5948408d78', 'HCO3-'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'Bicarb'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'Total CO2'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'TCO2'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'Carbon dioxide content'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'CO2 content'),
  ('40b72161-02bd-4897-818e-3c5948408d78', 'CO2'),
  
  -- Monocytes (Mon) - No existing synonyms
  ('0d965c77-c7bb-4d99-86e3-140bb7aca211', 'Mono'),
  ('0d965c77-c7bb-4d99-86e3-140bb7aca211', 'Monos'),
  ('0d965c77-c7bb-4d99-86e3-140bb7aca211', 'Polynucléaires monocytes'),
  ('0d965c77-c7bb-4d99-86e3-140bb7aca211', 'Monocyte count'),
  
  -- Potassium (K) - No existing synonyms
  ('74a48d82-a72a-412c-a2db-215374a7620b', 'K+'),
  ('74a48d82-a72a-412c-a2db-215374a7620b', 'Kalium'),
  ('74a48d82-a72a-412c-a2db-215374a7620b', 'Potassium level'),
  ('74a48d82-a72a-412c-a2db-215374a7620b', 'Serum potassium'),
  
  -- Sodium (Na) - No existing synonyms
  ('c543a385-ce9e-4870-8433-c9f8fbd1cf81', 'Na+'),
  ('c543a385-ce9e-4870-8433-c9f8fbd1cf81', 'Natrium'),
  ('c543a385-ce9e-4870-8433-c9f8fbd1cf81', 'Sodium level'),
  ('c543a385-ce9e-4870-8433-c9f8fbd1cf81', 'Serum sodium'),
  
  -- Albumin (Alb) - Add to existing 2 synonyms
  ('d71dcdd5-a572-4232-979f-9267c439b623', 'ALB'),
  ('d71dcdd5-a572-4232-979f-9267c439b623', 'Serum albumin'),
  ('d71dcdd5-a572-4232-979f-9267c439b623', 'Albumin serum'),
  
  -- Apolipoprotein B (ApoB) - Add to existing 2 synonyms
  ('7c171222-a466-4c58-94b7-cc1bc0a914a8', 'Apo B'),
  ('7c171222-a466-4c58-94b7-cc1bc0a914a8', 'Apolipoprotein B-100'),
  ('7c171222-a466-4c58-94b7-cc1bc0a914a8', 'ApoB-100'),
  ('7c171222-a466-4c58-94b7-cc1bc0a914a8', 'APOB'),
  
  -- C-peptide - Add to existing 2 synonyms
  ('9045212a-2274-459f-b514-d65dd2f1424d', 'C peptide'),
  ('9045212a-2274-459f-b514-d65dd2f1424d', 'Connecting peptide'),
  ('9045212a-2274-459f-b514-d65dd2f1424d', 'CPEP'),
  
  -- Chloride (Cl) - Add to existing 2 synonyms
  ('278ed751-7727-4b03-bd99-7d6822f55290', 'Cl-'),
  ('278ed751-7727-4b03-bd99-7d6822f55290', 'Chloride level'),
  ('278ed751-7727-4b03-bd99-7d6822f55290', 'Serum chloride'),
  
  -- Fasting insulin - Add to existing 2 synonyms
  ('6db0da00-2e5d-4d40-a8d6-286a4a2256a7', 'Insulin fasting'),
  ('6db0da00-2e5d-4d40-a8d6-286a4a2256a7', 'Fasting insulin level'),
  ('6db0da00-2e5d-4d40-a8d6-286a4a2256a7', 'Serum insulin'),
  ('6db0da00-2e5d-4d40-a8d6-286a4a2256a7', 'Insulinemia'),
  ('6db0da00-2e5d-4d40-a8d6-286a4a2256a7', 'Ins'),
  
  -- Ferritin (Fer) - Add to existing 2 synonyms
  ('618f2d6f-dfe2-457c-be6a-4a00bcb4c93d', 'Ferritine'),
  ('618f2d6f-dfe2-457c-be6a-4a00bcb4c93d', 'Ferritin level'),
  ('618f2d6f-dfe2-457c-be6a-4a00bcb4c93d', 'Serum ferritin'),
  ('618f2d6f-dfe2-457c-be6a-4a00bcb4c93d', 'FER'),
  
  -- Fibrinogen (Fib) - Add to existing 2 synonyms
  ('ccf114de-36e4-4aad-bf67-4c65a08fd9d7', 'FIB'),
  ('ccf114de-36e4-4aad-bf67-4c65a08fd9d7', 'Factor I'),
  ('ccf114de-36e4-4aad-bf67-4c65a08fd9d7', 'Fibrinogène'),
  
  -- Free testosterone - Add to existing 2 synonyms
  ('f98d2c41-b92f-44da-9c77-cbb2baa6631b', 'fT'),
  ('f98d2c41-b92f-44da-9c77-cbb2baa6631b', 'FT'),
  ('f98d2c41-b92f-44da-9c77-cbb2baa6631b', 'Testosterone free'),
  
  -- Gamma-glutamyl transferase (GGT) - Add to existing 2 synonyms
  ('3942a61c-c6f8-4938-bd2e-03e1346c01b7', 'GGTP'),
  ('3942a61c-c6f8-4938-bd2e-03e1346c01b7', 'Gamma GT'),
  ('3942a61c-c6f8-4938-bd2e-03e1346c01b7', 'γ-GT'),
  ('3942a61c-c6f8-4938-bd2e-03e1346c01b7', 'Gamma-glutamyltransferase'),
  ('3942a61c-c6f8-4938-bd2e-03e1346c01b7', 'GGTase'),
  
  -- Homocysteine (Hcy) - Add to existing 2 synonyms
  ('6a22b63d-1d03-47af-b35d-65606812de7d', 'HCY'),
  ('6a22b63d-1d03-47af-b35d-65606812de7d', 'Homocystéine'),
  ('6a22b63d-1d03-47af-b35d-65606812de7d', 'Total homocysteine'),
  ('6a22b63d-1d03-47af-b35d-65606812de7d', 'tHcy'),
  
  -- International normalized ratio (INR) - Add to existing 2 synonyms
  ('70069a3d-90b3-49da-a18b-0700c2a43edb', 'INR ratio'),
  ('70069a3d-90b3-49da-a18b-0700c2a43edb', 'Normalized ratio'),
  ('70069a3d-90b3-49da-a18b-0700c2a43edb', 'Prothrombin time ratio'),
  
  -- Lactate dehydrogenase (LDH) - Add to existing 2 synonyms
  ('8b8922e1-6300-45a6-8a76-1637afd979cd', 'LD'),
  ('8b8922e1-6300-45a6-8a76-1637afd979cd', 'Lactic dehydrogenase'),
  ('8b8922e1-6300-45a6-8a76-1637afd979cd', 'Lactate DH'),
  
  -- Lymphocytes (Lym) - Add to existing 2 synonyms
  ('520b4d20-e91a-41bc-a454-73953b8eb4bf', 'Lymph'),
  ('520b4d20-e91a-41bc-a454-73953b8eb4bf', 'Lymphs'),
  ('520b4d20-e91a-41bc-a454-73953b8eb4bf', 'Lymphocyte count'),
  ('520b4d20-e91a-41bc-a454-73953b8eb4bf', 'Lymphocytes absolute'),
  ('520b4d20-e91a-41bc-a454-73953b8eb4bf', 'Polynucléaires lymphocytes'),
  
  -- Magnesium (Mg) - Add to existing 2 synonyms
  ('aabc5ce9-6245-4228-9eda-99835f60a6a3', 'Mg++'),
  ('aabc5ce9-6245-4228-9eda-99835f60a6a3', 'Magnésium'),
  ('aabc5ce9-6245-4228-9eda-99835f60a6a3', 'Serum magnesium'),
  ('aabc5ce9-6245-4228-9eda-99835f60a6a3', 'Magnesium level'),
  
  -- Mean platelet volume (MPV) - Add to existing 2 synonyms
  ('a6355603-bd7f-4fa7-a7c9-cedd86660da7', 'MPV volume'),
  ('a6355603-bd7f-4fa7-a7c9-cedd86660da7', 'Platelet volume mean'),
  
  -- Non-HDL cholesterol - Add to existing 2 synonyms
  ('77e2d641-fab4-4e6e-b1af-8ef61f8645ee', 'Non HDL'),
  ('77e2d641-fab4-4e6e-b1af-8ef61f8645ee', 'NonHDL'),
  ('77e2d641-fab4-4e6e-b1af-8ef61f8645ee', 'Cholesterol non-HDL'),
  
  -- Procalcitonin (PCT) - Add to existing 2 synonyms
  ('1b3d8005-b0ec-445e-b5bf-1e7a30b64741', 'Procalcitonine'),
  ('1b3d8005-b0ec-445e-b5bf-1e7a30b64741', 'Pro-CT'),
  
  -- Progesterone (Prog) - Add to existing 2 synonyms
  ('f947b287-4af9-4ff0-85b9-2a5b33efcd9b', 'P4'),
  ('f947b287-4af9-4ff0-85b9-2a5b33efcd9b', 'Progestérone'),
  ('f947b287-4af9-4ff0-85b9-2a5b33efcd9b', 'Serum progesterone'),
  
  -- Prothrombin time (PT) - Add to existing 2 synonyms
  ('90f1a76b-6cd9-4fa6-9c10-f14b3f13af95', 'Protime'),
  ('90f1a76b-6cd9-4fa6-9c10-f14b3f13af95', 'Prothrombin'),
  ('90f1a76b-6cd9-4fa6-9c10-f14b3f13af95', 'PT time'),
  ('90f1a76b-6cd9-4fa6-9c10-f14b3f13af95', 'Temps de prothrombine'),
  
  -- Red cell distribution width (RDW) - Add to existing 2 synonyms
  ('2b3e1b23-dc20-406b-a2a6-0cd7a0575604', 'RDW-CV'),
  ('2b3e1b23-dc20-406b-a2a6-0cd7a0575604', 'RDW-SD'),
  ('2b3e1b23-dc20-406b-a2a6-0cd7a0575604', 'Red cell width'),
  ('2b3e1b23-dc20-406b-a2a6-0cd7a0575604', 'Distribution width'),
  
  -- Sex hormone–binding globulin (SHBG) - Add to existing 2 synonyms
  ('7eb120cd-c113-476e-a9d9-e7fd0d9df37c', 'TeBG'),
  ('7eb120cd-c113-476e-a9d9-e7fd0d9df37c', 'SHB globulin'),
  ('7eb120cd-c113-476e-a9d9-e7fd0d9df37c', 'Androgen-binding protein'),
  
  -- Thyroid-stimulating hormone (TSH) - Add to existing 2 synonyms
  ('88c9d1ce-7e09-417a-9244-56759801499e', 'Thyrotropin'),
  ('88c9d1ce-7e09-417a-9244-56759801499e', 'TSH level'),
  ('88c9d1ce-7e09-417a-9244-56759801499e', 'Thyréostimuline'),
  
  -- Total iron-binding capacity (TIBC) - Add to existing 2 synonyms
  ('2bd4ef52-1715-4b83-82d7-c664f9ac0026', 'Iron binding capacity'),
  ('2bd4ef52-1715-4b83-82d7-c664f9ac0026', 'Total iron binding'),
  ('2bd4ef52-1715-4b83-82d7-c664f9ac0026', 'TIBC capacity'),
  
  -- Transferrin saturation - Add to existing 2 synonyms (note: TSAT already exists)
  ('450db172-79dd-435c-b86e-b4b4383ea906', 'Transferrin sat'),
  ('450db172-79dd-435c-b86e-b4b4383ea906', 'Iron saturation'),
  ('450db172-79dd-435c-b86e-b4b4383ea906', 'Saturation index'),
  
  -- Transferrin - Add new synonyms (TSAT should be removed but we'll handle that separately)
  ('2e4b90fa-a31c-403b-a43d-0801a4a95df8', 'TRF'),
  ('2e4b90fa-a31c-403b-a43d-0801a4a95df8', 'Tf'),
  ('2e4b90fa-a31c-403b-a43d-0801a4a95df8', 'Siderophilin'),
  ('2e4b90fa-a31c-403b-a43d-0801a4a95df8', 'Transferrine'),
  
  -- 25-hydroxy vitamin D - Add to existing 3 synonyms
  ('1a34393d-a645-4765-896b-bc23b0083bc3', '25(OH)D'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', '25-OH-Vitamin D'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', '25-hydroxyvitamin D'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', 'Calcifediol'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', 'Cholecalciferol metabolite'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', 'Vit D 25-OH'),
  ('1a34393d-a645-4765-896b-bc23b0083bc3', 'Vitamin D3 metabolite'),
  
  -- Activated partial thromboplastin time (aPTT) - Add to existing 3 synonyms
  ('e343cbfc-5b76-4a1d-93b0-c5a9f3964926', 'APTT'),
  ('e343cbfc-5b76-4a1d-93b0-c5a9f3964926', 'aPTT time'),
  ('e343cbfc-5b76-4a1d-93b0-c5a9f3964926', 'Partial thromboplastin time'),
  ('e343cbfc-5b76-4a1d-93b0-c5a9f3964926', 'PTT time'),
  ('e343cbfc-5b76-4a1d-93b0-c5a9f3964926', 'Temps de céphaline activé'),
  
  -- Alkaline phosphatase (ALP) - Add to existing 3 synonyms
  ('c320f5c5-b8f9-4b4e-85f7-2510bef8069f', 'ALKP'),
  ('c320f5c5-b8f9-4b4e-85f7-2510bef8069f', 'ALPase'),
  ('c320f5c5-b8f9-4b4e-85f7-2510bef8069f', 'Alk Phos'),
  ('c320f5c5-b8f9-4b4e-85f7-2510bef8069f', 'Phosphatase alkaline'),
  
  -- Basophils (Bas) - Add to existing 3 synonyms
  ('87bf47e8-a2ca-4f19-ad9f-2e1835c5f5c3', 'BASO'),
  ('87bf47e8-a2ca-4f19-ad9f-2e1835c5f5c3', 'Baso'),
  ('87bf47e8-a2ca-4f19-ad9f-2e1835c5f5c3', 'Basophil count'),
  ('87bf47e8-a2ca-4f19-ad9f-2e1835c5f5c3', 'Basophil percentage'),
  ('87bf47e8-a2ca-4f19-ad9f-2e1835c5f5c3', 'Basophiles'),
  
  -- Blood urea nitrogen (BUN) - Add to existing 3 synonyms
  ('d680389d-fd6d-461b-b101-6f1f022f211b', 'Urea nitrogen'),
  ('d680389d-fd6d-461b-b101-6f1f022f211b', 'Blood urea N'),
  ('d680389d-fd6d-461b-b101-6f1f022f211b', 'BUN level'),
  ('d680389d-fd6d-461b-b101-6f1f022f211b', 'Azotémie'),
  
  -- Creatine kinase (CK) - Add to existing 3 synonyms
  ('6a863480-f630-497b-b9be-1f4a319d5842', 'Creatine phosphokinase'),
  ('6a863480-f630-497b-b9be-1f4a319d5842', 'CPK-MB'),
  ('6a863480-f630-497b-b9be-1f4a319d5842', 'CK-MB'),
  ('6a863480-f630-497b-b9be-1f4a319d5842', 'Creatine kinase total'),
  
  -- Creatinine (Cr) - Add to existing 3 synonyms
  ('c3be3954-6de2-49a6-9368-9e61a2d574d2', 'CREAT'),
  ('c3be3954-6de2-49a6-9368-9e61a2d574d2', 'Creat'),
  ('c3be3954-6de2-49a6-9368-9e61a2d574d2', 'Creatinine level'),
  ('c3be3954-6de2-49a6-9368-9e61a2d574d2', 'Serum creatinine'),
  ('c3be3954-6de2-49a6-9368-9e61a2d574d2', 'Plasma creatinine'),
  
  -- DHEA-S - Add to existing 3 synonyms (DHEAS already exists)
  ('5e4b2cb6-c27e-45f9-9067-ecd14073a077', 'DHEA Sulfate'),
  ('5e4b2cb6-c27e-45f9-9067-ecd14073a077', 'Dehydroepiandrosterone sulfate'),
  ('5e4b2cb6-c27e-45f9-9067-ecd14073a077', 'DHEA-S level'),
  
  -- Direct bilirubin (DBIL) - Add to existing 3 synonyms
  ('f5b24ad1-68b9-4f0d-974c-f63ef1db35b4', 'Direct BIL'),
  ('f5b24ad1-68b9-4f0d-974c-f63ef1db35b4', 'Bilirubin direct'),
  ('f5b24ad1-68b9-4f0d-974c-f63ef1db35b4', 'Bilirubine directe'),
  
  -- Eosinophils (Eos) - Add to existing 3 synonyms
  ('3931f12d-3675-45ad-8e4b-3a45ac032169', 'EOS'),
  ('3931f12d-3675-45ad-8e4b-3a45ac032169', 'Eosinophil count'),
  ('3931f12d-3675-45ad-8e4b-3a45ac032169', 'Eosinophil percentage'),
  ('3931f12d-3675-45ad-8e4b-3a45ac032169', 'Eosinophiles'),
  ('3931f12d-3675-45ad-8e4b-3a45ac032169', 'EOS%'),
  
  -- Erythrocyte sedimentation rate (ESR) - Add to existing 3 synonyms
  ('bf86f1aa-93b0-45d2-8efd-e54f2cfd51c5', 'Sedimentation'),
  ('bf86f1aa-93b0-45d2-8efd-e54f2cfd51c5', 'Westergren ESR'),
  ('bf86f1aa-93b0-45d2-8efd-e54f2cfd51c5', 'ESR rate'),
  ('bf86f1aa-93b0-45d2-8efd-e54f2cfd51c5', 'Vitesse de sédimentation'),
  ('bf86f1aa-93b0-45d2-8efd-e54f2cfd51c5', 'VS'),
  
  -- Estimated glomerular filtration rate (eGFR) - Add to existing 3 synonyms
  ('f834bfa8-685c-4304-aa65-63cfa5fe1953', 'eGFR rate'),
  ('f834bfa8-685c-4304-aa65-63cfa5fe1953', 'Glomerular filtration rate'),
  ('f834bfa8-685c-4304-aa65-63cfa5fe1953', 'GFR estimated'),
  ('f834bfa8-685c-4304-aa65-63cfa5fe1953', 'eGFR CKD-EPI'),
  
  -- Estradiol (E2) - Add to existing 3 synonyms
  ('87f0ce0c-2ff6-41c9-89ed-5b314514b1f3', 'E2 level'),
  ('87f0ce0c-2ff6-41c9-89ed-5b314514b1f3', 'Estradiol level'),
  ('87f0ce0c-2ff6-41c9-89ed-5b314514b1f3', 'Estrogen E2'),
  ('87f0ce0c-2ff6-41c9-89ed-5b314514b1f3', 'Oestradiol'),
  
  -- Free T3 (FT3) - Add to existing 3 synonyms
  ('5d25c72a-f73a-434e-8c97-6e8920c8ce9e', 'T3 free'),
  ('5d25c72a-f73a-434e-8c97-6e8920c8ce9e', 'FT3 level'),
  ('5d25c72a-f73a-434e-8c97-6e8920c8ce9e', 'Triiodothyronine free'),
  
  -- Free T4 (FT4) - Add to existing 3 synonyms
  ('e35895e5-beeb-4a99-ae6a-8a9654f6e06c', 'T4 free'),
  ('e35895e5-beeb-4a99-ae6a-8a9654f6e06c', 'FT4 level'),
  ('e35895e5-beeb-4a99-ae6a-8a9654f6e06c', 'Thyroxine free'),
  
  -- HDL cholesterol - Add to existing 3 synonyms
  ('b0dc1af8-484c-4efa-a386-13efee139218', 'HDL-C'),
  ('b0dc1af8-484c-4efa-a386-13efee139218', 'HDL Chol'),
  ('b0dc1af8-484c-4efa-a386-13efee139218', 'High-density lipoprotein'),
  ('b0dc1af8-484c-4efa-a386-13efee139218', 'High density lipoprotein cholesterol'),
  ('b0dc1af8-484c-4efa-a386-13efee139218', 'Cholestérol HDL'),
  
  -- Hemoglobin (Hgb) - Add to existing 3 synonyms
  ('4c493d7f-eb9c-48ea-96b2-b57499c66886', 'HGB'),
  ('4c493d7f-eb9c-48ea-96b2-b57499c66886', 'HB'),
  ('4c493d7f-eb9c-48ea-96b2-b57499c66886', 'Hemoglobin level'),
  ('4c493d7f-eb9c-48ea-96b2-b57499c66886', 'Hb level'),
  ('4c493d7f-eb9c-48ea-96b2-b57499c66886', 'Hemoglobine'),
  
  -- Hemoglobin A1c (HbA1c) - Add to existing 3 synonyms
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'HbA1C'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'A1C'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'A1c'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'Glycohemoglobin'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'Glycated Hb'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'Hemoglobin A1c level'),
  ('6b849bcc-1b9a-472c-945e-7407d0293e5b', 'Diabetic control index'),
  
  -- High-sensitivity C-reactive protein (hs-CRP) - Add to existing 3 synonyms
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'hsCRP'),
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'high sensitivity CRP'),
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'hs CRP'),
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'Ultra-sensitive CRP'),
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'us-CRP'),
  ('b82575d5-6150-4632-a7ef-82ce6a66ae53', 'CRP high sensitivity'),
  
  -- Ionized calcium (iCa) - Add to existing 3 synonyms
  ('d335eae3-9ebd-49bd-be3a-e55dcb381a13', 'Ca++'),
  ('d335eae3-9ebd-49bd-be3a-e55dcb381a13', 'Ca2+'),
  ('d335eae3-9ebd-49bd-be3a-e55dcb381a13', 'Ionized Ca'),
  ('d335eae3-9ebd-49bd-be3a-e55dcb381a13', 'Calcium ionisé'),
  
  -- LDL cholesterol - Add to existing 3 synonyms
  ('210514f1-b784-4d32-8a35-648028e54d5e', 'LDL-C'),
  ('210514f1-b784-4d32-8a35-648028e54d5e', 'LDL Chol'),
  ('210514f1-b784-4d32-8a35-648028e54d5e', 'Low-density lipoprotein'),
  ('210514f1-b784-4d32-8a35-648028e54d5e', 'Low density lipoprotein cholesterol'),
  ('210514f1-b784-4d32-8a35-648028e54d5e', 'Cholestérol LDL'),
  
  -- Mean corpuscular hemoglobin (MCH) - Add to existing 3 synonyms
  ('f1d64301-c6d5-4565-9724-b3a0ce00b8e8', 'MCH pg'),
  ('f1d64301-c6d5-4565-9724-b3a0ce00b8e8', 'Corpuscular hemoglobin mean'),
  
  -- Mean corpuscular hemoglobin concentration (MCHC) - Add to existing 3 synonyms
  ('e8d0218a-392c-40da-894a-8bca183ed72a', 'MCHC concentration'),
  ('e8d0218a-392c-40da-894a-8bca183ed72a', 'Corpuscular Hb concentration mean'),
  
  -- Mean corpuscular volume (MCV) - Add to existing 3 synonyms
  ('aa68ecb0-8f85-4bbc-bd06-4d6b74c665ea', 'MCV fL'),
  ('aa68ecb0-8f85-4bbc-bd06-4d6b74c665ea', 'Corpuscular volume mean'),
  
  -- Neutrophils (Neu) - Add to existing 3 synonyms
  ('54207eed-2485-48ca-bb05-8a5806028582', 'NEU'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'Neut'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'Neutrophil count'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'Neutrophil percentage'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'Neutrophiles'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'NEU%'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'Polymorphonuclear neutrophils'),
  ('54207eed-2485-48ca-bb05-8a5806028582', 'PMN'),
  
  -- Serum iron (Fe) - Add to existing 3 synonyms
  ('7267f469-7904-4e3a-9a06-1f3dcf018531', 'Iron level'),
  ('7267f469-7904-4e3a-9a06-1f3dcf018531', 'Iron serum'),
  ('7267f469-7904-4e3a-9a06-1f3dcf018531', 'Serum Fe'),
  ('7267f469-7904-4e3a-9a06-1f3dcf018531', 'Iron total'),
  ('7267f469-7904-4e3a-9a06-1f3dcf018531', 'Fer sérique'),
  
  -- Total bilirubin (TBIL) - Add to existing 3 synonyms
  ('d62deee9-d404-4da9-9937-cdd7475aac91', 'Total BIL'),
  ('d62deee9-d404-4da9-9937-cdd7475aac91', 'Bilirubin total'),
  ('d62deee9-d404-4da9-9937-cdd7475aac91', 'T Bilirubin'),
  ('d62deee9-d404-4da9-9937-cdd7475aac91', 'Bilirubine totale'),
  ('d62deee9-d404-4da9-9937-cdd7475aac91', 'TB'),
  
  -- Total cholesterol (TC) - Add to existing 3 synonyms
  ('2aedefe0-13f4-4331-8ca7-e416767b4230', 'Total Chol'),
  ('2aedefe0-13f4-4331-8ca7-e416767b4230', 'Cholesterol total'),
  ('2aedefe0-13f4-4331-8ca7-e416767b4230', 'T Cholesterol'),
  ('2aedefe0-13f4-4331-8ca7-e416767b4230', 'Cholestérol'),
  ('2aedefe0-13f4-4331-8ca7-e416767b4230', 'Cholesterol level'),
  
  -- Total protein (TP) - Add to existing 3 synonyms
  ('5bbf9309-6a39-4bef-82d8-ea7220273f9f', 'Total Prot'),
  ('5bbf9309-6a39-4bef-82d8-ea7220273f9f', 'Protein total'),
  ('5bbf9309-6a39-4bef-82d8-ea7220273f9f', 'T Protein'),
  ('5bbf9309-6a39-4bef-82d8-ea7220273f9f', 'Serum total protein'),
  ('5bbf9309-6a39-4bef-82d8-ea7220273f9f', 'Total proteins'),
  
  -- Total testosterone (T) - Add to existing 3 synonyms
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'Testosterone total'),
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'T level'),
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'Testosterone level'),
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'Testosterone serum'),
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'Total T'),
  ('4947d90a-3ed7-4953-8d36-0f049a2dadb7', 'TT'),
  
  -- Triglycerides (TG) - Add to existing 3 synonyms
  ('a46cdfe2-2df3-40bc-8eeb-5c909dfbbd70', 'Trig'),
  ('a46cdfe2-2df3-40bc-8eeb-5c909dfbbd70', 'Triglyceride'),
  ('a46cdfe2-2df3-40bc-8eeb-5c909dfbbd70', 'TG level'),
  ('a46cdfe2-2df3-40bc-8eeb-5c909dfbbd70', 'Triacylglycerol'),
  ('a46cdfe2-2df3-40bc-8eeb-5c909dfbbd70', 'TAG'),
  
  -- Troponin - Add to existing 3 synonyms
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'Troponin I'),
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'TnI'),
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'Troponin T'),
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'TnT'),
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'High-sensitivity troponin'),
  ('2176e3d2-5193-472b-ad5d-9b6fe08d8032', 'hs-TnI'),
  
  -- Urea - Add to existing 3 synonyms
  ('2b54049c-2a4e-45ac-8a81-aee11dd2b559', 'Urea blood'),
  ('2b54049c-2a4e-45ac-8a81-aee11dd2b559', 'BUN equivalent'),
  
  -- Uric acid (UA) - Add to existing 3 synonyms
  ('bb9426b2-b016-4d98-a3c1-837d1e13eeb6', 'Urate'),
  ('bb9426b2-b016-4d98-a3c1-837d1e13eeb6', 'Uric acid level'),
  ('bb9426b2-b016-4d98-a3c1-837d1e13eeb6', 'Serum uric acid'),
  
  -- Vitamin B12 - Add to existing 4 synonyms
  ('2eaf4f1a-e476-441d-bf96-0fc681b3d3f6', 'Vit B12'),
  ('2eaf4f1a-e476-441d-bf96-0fc681b3d3f6', 'B-12'),
  ('2eaf4f1a-e476-441d-bf96-0fc681b3d3f6', 'B 12'),
  ('2eaf4f1a-e476-441d-bf96-0fc681b3d3f6', 'Vitamin B-12'),
  ('2eaf4f1a-e476-441d-bf96-0fc681b3d3f6', 'Cobalamine'),
  
  -- White blood cell count (WBC) - Add to existing 4 synonyms
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'White cell count'),
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'Leukocyte count'),
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'WBC count'),
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'Total WBC'),
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'Leucocyte count'),
  ('f1dc6940-6a50-4928-8896-261b5e76a3fa', 'White blood cells'),
  
  -- Alanine aminotransferase (ALT) - Add to existing 5 synonyms
  ('de82c6a5-be8d-40c0-bb57-4af6f33b5ba9', 'Alanine transaminase'),
  ('de82c6a5-be8d-40c0-bb57-4af6f33b5ba9', 'ALT level'),
  ('de82c6a5-be8d-40c0-bb57-4af6f33b5ba9', 'ALAT level'),
  ('de82c6a5-be8d-40c0-bb57-4af6f33b5ba9', 'Transaminase GPT'),
  
  -- Aspartate aminotransferase (AST) - Add to existing 5 synonyms
  ('9cb06bd6-d3fb-4c7a-a849-8e2b87315f72', 'Aspartate transaminase'),
  ('9cb06bd6-d3fb-4c7a-a849-8e2b87315f72', 'AST level'),
  ('9cb06bd6-d3fb-4c7a-a849-8e2b87315f72', 'ASAT level'),
  ('9cb06bd6-d3fb-4c7a-a849-8e2b87315f72', 'Transaminase GOT'),
  
  -- Calcium (total) - Add to existing 4 synonyms
  ('e0508293-0477-4b2d-8c4e-b73eb05b85fe', 'Calcium level'),
  ('e0508293-0477-4b2d-8c4e-b73eb05b85fe', 'Total Ca'),
  
  -- Fasting plasma glucose - Add to existing 4 synonyms
  ('5e28a0f1-9914-48e9-9820-6948f6895130', 'Fasting blood glucose'),
  ('5e28a0f1-9914-48e9-9820-6948f6895130', 'FBG'),
  ('5e28a0f1-9914-48e9-9820-6948f6895130', 'Fasting glucose level'),
  
  -- Folate - Add to existing 4 synonyms
  ('e41a36ad-193e-458a-888a-62341cd782fc', 'Folate level'),
  ('e41a36ad-193e-458a-888a-62341cd782fc', 'Serum folate'),
  
  -- Hematocrit - Add to existing 4 synonyms
  ('d06b10ac-4251-4903-91e7-0a360e415175', 'Hematocrit level'),
  ('d06b10ac-4251-4903-91e7-0a360e415175', 'HCT'),
  
  -- Phosphate - Add to existing 4 synonyms (all already exist)
  -- ('2b883d98-f494-41c1-8b17-fb0d9340b972', 'P'), -- Too ambiguous
  ('2b883d98-f494-41c1-8b17-fb0d9340b972', 'PO4'),
  ('2b883d98-f494-41c1-8b17-fb0d9340b972', 'Phosphate level'),
  
  -- Platelet count - Add to existing 4 synonyms
  ('e6509a26-e3ee-46eb-81f2-f137c4452624', 'PLT'),
  ('e6509a26-e3ee-46eb-81f2-f137c4452624', 'Platelet count level'),
  ('e6509a26-e3ee-46eb-81f2-f137c4452624', 'Thrombocyte count'),
  
  -- Red blood cell count - Add to existing 4 synonyms
  ('dc602dee-d8f1-4e90-a112-505000bf1f8d', 'RBC count'),
  ('dc602dee-d8f1-4e90-a112-505000bf1f8d', 'Erythrocyte count'),
  ('dc602dee-d8f1-4e90-a112-505000bf1f8d', 'Red cell count')
) AS new_synonyms(biomarker_id, synonym)
WHERE NOT EXISTS (
  SELECT 1 FROM biomarker_synonyms bs
  WHERE bs.biomarker_id = CAST(new_synonyms.biomarker_id AS uuid)
  AND LOWER(bs.synonym) = LOWER(new_synonyms.synonym)
);

-- Fix: Remove TSAT from Transferrin (it belongs to Transferrin saturation)
DELETE FROM biomarker_synonyms
WHERE biomarker_id = '2e4b90fa-a31c-403b-a43d-0801a4a95df8'  -- Transferrin
AND synonym = 'TSAT'
AND NOT EXISTS (
  -- Make sure TSAT doesn't already exist for Transferrin saturation
  SELECT 1 FROM biomarker_synonyms
  WHERE biomarker_id = '450db172-79dd-435c-b86e-b4b4383ea906'  -- Transferrin saturation
  AND synonym = 'TSAT'
);

-- Ensure TSAT exists for Transferrin saturation (it should already, but just in case)
INSERT INTO biomarker_synonyms (biomarker_id, synonym)
SELECT '450db172-79dd-435c-b86e-b4b4383ea906', 'TSAT'
WHERE NOT EXISTS (
  SELECT 1 FROM biomarker_synonyms
  WHERE biomarker_id = '450db172-79dd-435c-b86e-b4b4383ea906'
  AND synonym = 'TSAT'
);

