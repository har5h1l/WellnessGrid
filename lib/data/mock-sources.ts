import { InformationSource, Protocol, ProtocolStep } from "../types"

// Comprehensive disease presets based on the provided chronic disease reference
export const diseasePresets = [
  {
    id: "diabetes1",
    name: "Type 1 Diabetes",
    category: "Endocrine",
    description: "Autoimmune condition where the pancreas produces little or no insulin",
    commonSymptoms: ["frequent urination", "excessive thirst", "unexplained weight loss", "fatigue"],
    riskFactors: ["family history", "genetics", "environmental factors"],
    icon: "🩸"
  },
  {
    id: "diabetes2", 
    name: "Type 2 Diabetes",
    category: "Endocrine",
    description: "Metabolic disorder with high blood sugar over a prolonged period",
    commonSymptoms: ["increased thirst", "frequent urination", "fatigue", "blurred vision"],
    riskFactors: ["obesity", "family history", "sedentary lifestyle"],
    icon: "🩸"
  },
  {
    id: "hypertension",
    name: "Hypertension",
    category: "Cardiovascular",
    description: "Chronic elevation of arterial blood pressure",
    commonSymptoms: ["headaches", "shortness of breath", "nosebleeds", "chest pain"],
    riskFactors: ["age", "family history", "obesity", "high sodium diet"],
    icon: "💓"
  },
  {
    id: "coronary_artery_disease",
    name: "Coronary Artery Disease",
    category: "Cardiovascular", 
    description: "Narrowing of heart arteries reducing blood flow",
    commonSymptoms: ["chest pain", "shortness of breath", "fatigue", "irregular heartbeat"],
    riskFactors: ["high cholesterol", "smoking", "diabetes", "hypertension"],
    icon: "❤️"
  },
  {
    id: "heart_failure",
    name: "Heart Failure",
    category: "Cardiovascular",
    description: "Heart's inability to pump blood efficiently",
    commonSymptoms: ["shortness of breath", "fatigue", "swelling", "persistent cough"],
    riskFactors: ["coronary artery disease", "high blood pressure", "diabetes"],
    icon: "💔"
  },
  {
    id: "copd",
    name: "COPD",
    category: "Respiratory",
    description: "Progressive lung disease causing airflow blockage",
    commonSymptoms: ["chronic cough", "shortness of breath", "wheezing", "chest tightness"],
    riskFactors: ["smoking", "air pollution", "occupational dusts", "genetics"],
    icon: "🫁"
  },
  {
    id: "asthma",
    name: "Asthma",
    category: "Respiratory",
    description: "Chronic inflammation of airways causing breathing difficulty",
    commonSymptoms: ["wheezing", "shortness of breath", "chest tightness", "coughing"],
    riskFactors: ["allergies", "family history", "environmental triggers"],
    icon: "🫁"
  },
  {
    id: "chronic_kidney_disease",
    name: "Chronic Kidney Disease",
    category: "Renal",
    description: "Gradual loss of kidney function",
    commonSymptoms: ["fatigue", "swelling", "changes in urination", "nausea"],
    riskFactors: ["diabetes", "high blood pressure", "family history"],
    icon: "🫘"
  },
  {
    id: "stroke",
    name: "Stroke",
    category: "Neurological",
    description: "Interruption of blood supply to the brain",
    commonSymptoms: ["sudden weakness", "confusion", "trouble speaking", "severe headache"],
    riskFactors: ["high blood pressure", "smoking", "diabetes", "age"],
    icon: "🧠"
  },
  {
    id: "cancer_general",
    name: "Cancer (General)",
    category: "Oncological",
    description: "Malignant growths in various tissues",
    commonSymptoms: ["fatigue", "weight loss", "pain", "changes in skin"],
    riskFactors: ["age", "genetics", "lifestyle factors", "environmental exposure"],
    icon: "🎗️"
  },
  {
    id: "arthritis",
    name: "Arthritis",
    category: "Rheumatologic",
    description: "Joint inflammation causing pain and disability",
    commonSymptoms: ["joint pain", "swelling", "stiffness", "limited mobility"],
    riskFactors: ["age", "genetics", "previous injuries", "obesity"],
    icon: "🦴"
  },
  {
    id: "osteoporosis",
    name: "Osteoporosis",
    category: "Musculoskeletal",
    description: "Weakening of bones increasing fracture risk",
    commonSymptoms: ["back pain", "loss of height", "stooped posture", "fractures"],
    riskFactors: ["age", "gender", "hormone levels", "low calcium intake"],
    icon: "🦴"
  },
  {
    id: "depression",
    name: "Depression",
    category: "Mental Health",
    description: "Persistent low mood and loss of interest",
    commonSymptoms: ["persistent sadness", "loss of interest", "fatigue", "sleep changes"],
    riskFactors: ["genetics", "brain chemistry", "hormones", "life events"],
    icon: "😔"
  },
  {
    id: "alzheimers",
    name: "Alzheimer's Disease",
    category: "Neurological",
    description: "Progressive cognitive decline affecting memory and function",
    commonSymptoms: ["memory loss", "confusion", "difficulty with tasks", "personality changes"],
    riskFactors: ["age", "genetics", "family history", "head injuries"],
    icon: "🧠"
  },
  {
    id: "schizophrenia",
    name: "Schizophrenia",
    category: "Mental Health",
    description: "Severe mental disorders affecting thought and behavior",
    commonSymptoms: ["delusions", "hallucinations", "disorganized thinking", "abnormal motor behavior"],
    riskFactors: ["genetics", "brain chemistry", "environment", "drug use"],
    icon: "🧠"
  },
  {
    id: "hiv_aids",
    name: "HIV/AIDS",
    category: "Infectious",
    description: "Chronic viral infection impairing immune function",
    commonSymptoms: ["fever", "weight loss", "fatigue", "frequent infections"],
    riskFactors: ["unprotected sex", "contaminated needles", "blood transfusions"],
    icon: "🔴"
  },
  {
    id: "hepatitis",
    name: "Chronic Hepatitis",
    category: "Infectious",
    description: "Chronic inflammation of the liver due to viral infection",
    commonSymptoms: ["fatigue", "abdominal pain", "jaundice", "loss of appetite"],
    riskFactors: ["contaminated blood", "unprotected sex", "contaminated needles"],
    icon: "🟡"
  },
  {
    id: "hyperlipidemia",
    name: "Hyperlipidemia",
    category: "Cardiovascular",
    description: "Elevated blood lipid levels increasing cardiovascular risk",
    commonSymptoms: ["usually no symptoms", "chest pain", "heart attack", "stroke"],
    riskFactors: ["diet", "genetics", "obesity", "sedentary lifestyle"],
    icon: "🩸"
  },
  {
    id: "autism",
    name: "Autism Spectrum Disorders",
    category: "Neurological",
    description: "Neurodevelopmental disorders affecting communication and behavior",
    commonSymptoms: ["social difficulties", "communication challenges", "repetitive behaviors", "sensory sensitivities"],
    riskFactors: ["genetics", "advanced parental age", "premature birth"],
    icon: "🧩"
  },
  {
    id: "substance_use",
    name: "Substance Use Disorders",
    category: "Mental Health",
    description: "Chronic misuse of alcohol or drugs causing health problems",
    commonSymptoms: ["tolerance", "withdrawal", "loss of control", "continued use despite problems"],
    riskFactors: ["genetics", "mental health disorders", "peer pressure", "early use"],
    icon: "⚠️"
  },
  {
    id: "atrial_fibrillation",
    name: "Atrial Fibrillation",
    category: "Cardiovascular",
    description: "Irregular, often rapid heart rhythm",
    commonSymptoms: ["palpitations", "shortness of breath", "fatigue", "chest pain"],
    riskFactors: ["age", "heart disease", "high blood pressure", "thyroid disorders"],
    icon: "💓"
  }
]

// Comprehensive Information Sources based on the provided guidelines
export const mockInformationSources: InformationSource[] = [
  // Diabetes Sources
  {
    id: "ada-diabetes-standards",
    title: "American Diabetes Association Standards of Care",
    type: "clinical_guideline",
    content: "Comprehensive evidence-based guidelines for diabetes diagnosis, treatment, and management. Includes recommendations for glucose monitoring, medication therapy, lifestyle interventions, and complication prevention.",
    url: "https://diabetesjournals.org/care/collection/40/Standards-of-Care",
    author: "American Diabetes Association",
    publishedDate: "2024-01-01",
    reliability: "high",
    tags: ["diabetes", "clinical-guidelines", "insulin", "monitoring", "type1", "type2"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-diabetes-guidelines",
    title: "CDC Diabetes Management Guidelines",
    type: "clinical_guideline",
    content: "Centers for Disease Control guidelines for diabetes prevention, management, and patient education. Includes population health approaches and evidence-based interventions.",
    url: "https://www.cdc.gov/diabetes/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-11-15",
    reliability: "high",
    tags: ["diabetes", "prevention", "management", "population-health"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "who-diabetes-management",
    title: "WHO Diabetes Management",
    type: "clinical_guideline",
    content: "World Health Organization global guidelines for diabetes prevention and control. Focuses on low-resource settings and international best practices.",
    url: "https://www.who.int/health-topics/diabetes",
    author: "World Health Organization",
    publishedDate: "2023-09-20",
    reliability: "high",
    tags: ["diabetes", "global-health", "prevention", "who"],
    isActive: true,
    addedBy: "system"
  },

  // Hypertension Sources
  {
    id: "aha-hypertension-guidelines",
    title: "AHA Hypertension Management Guidelines",
    type: "clinical_guideline",
    content: "American Heart Association comprehensive guidelines for hypertension diagnosis, classification, and treatment. Includes lifestyle modifications and pharmacological interventions.",
    url: "https://www.heart.org/en/health-topics/high-blood-pressure",
    author: "American Heart Association",
    publishedDate: "2023-12-01",
    reliability: "high",
    tags: ["hypertension", "blood-pressure", "cardiovascular", "treatment"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-hypertension-management",
    title: "CDC Hypertension Management",
    type: "clinical_guideline",
    content: "CDC evidence-based strategies for hypertension prevention and control in clinical and community settings.",
    url: "https://www.cdc.gov/bloodpressure/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-10-15",
    reliability: "high",
    tags: ["hypertension", "prevention", "community-health"],
    isActive: true,
    addedBy: "system"
  },

  // COPD Sources
  {
    id: "gold-copd-guidelines",
    title: "GOLD COPD Management Guidelines",
    type: "clinical_guideline",
    content: "Global Initiative for Chronic Obstructive Lung Disease evidence-based guidelines for COPD diagnosis, management, and prevention of exacerbations.",
    url: "https://goldcopd.org/",
    author: "Global Initiative for Chronic Obstructive Lung Disease",
    publishedDate: "2024-01-10",
    reliability: "high",
    tags: ["copd", "respiratory", "management", "exacerbations"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-copd-resources",
    title: "CDC COPD Resources",
    type: "patient_guide",
    content: "Comprehensive patient and provider resources for COPD management, including prevention strategies and quality of life improvements.",
    url: "https://www.cdc.gov/copd/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-08-30",
    reliability: "high",
    tags: ["copd", "patient-education", "prevention"],
    isActive: true,
    addedBy: "system"
  },

  // Asthma Sources  
  {
    id: "gina-asthma-guidelines",
    title: "GINA Asthma Management Guidelines",
    type: "clinical_guideline",
    content: "Global Initiative for Asthma evidence-based guidelines for asthma diagnosis, treatment, and management across all age groups.",
    url: "https://ginasthma.org/",
    author: "Global Initiative for Asthma",
    publishedDate: "2023-12-15",
    reliability: "high",
    tags: ["asthma", "respiratory", "management", "global"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-asthma-management",
    title: "CDC Asthma Management",
    type: "clinical_guideline",
    content: "CDC comprehensive asthma management guidelines including trigger identification, medication adherence, and emergency action plans.",
    url: "https://www.cdc.gov/asthma/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-11-20",
    reliability: "high",
    tags: ["asthma", "triggers", "action-plans", "medication"],
    isActive: true,
    addedBy: "system"
  },

  // Mental Health Sources
  {
    id: "apa-depression-guidelines",
    title: "APA Depression Treatment Guidelines",
    type: "clinical_guideline",
    content: "American Psychiatric Association evidence-based guidelines for depression diagnosis and treatment, including psychotherapy and pharmacotherapy recommendations.",
    url: "https://www.psychiatry.org/psychiatrists/practice/clinical-practice-guidelines",
    author: "American Psychiatric Association",
    publishedDate: "2023-10-01",
    reliability: "high",
    tags: ["depression", "mental-health", "psychotherapy", "medication"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-mental-health-resources",
    title: "CDC Mental Health Resources",
    type: "patient_guide",
    content: "Comprehensive mental health resources for patients and families, including prevention strategies and treatment options.",
    url: "https://www.cdc.gov/mentalhealth/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-09-15",
    reliability: "high",
    tags: ["mental-health", "prevention", "patient-resources"],
    isActive: true,
    addedBy: "system"
  },

  // Cancer Sources
  {
    id: "nccn-cancer-guidelines",
    title: "NCCN Cancer Treatment Guidelines",
    type: "clinical_guideline",
    content: "National Comprehensive Cancer Network evidence-based guidelines for cancer diagnosis, treatment, and survivorship care.",
    url: "https://www.nccn.org/guidelines",
    author: "National Comprehensive Cancer Network",
    publishedDate: "2024-01-05",
    reliability: "high",
    tags: ["cancer", "oncology", "treatment", "survivorship"],
    isActive: true,
    addedBy: "system"
  },
  {
    id: "cdc-cancer-resources",
    title: "CDC Cancer Prevention and Control",
    type: "clinical_guideline",
    content: "CDC comprehensive cancer prevention, screening, and control guidelines for various cancer types.",
    url: "https://www.cdc.gov/cancer/",
    author: "Centers for Disease Control and Prevention",
    publishedDate: "2023-12-10",
    reliability: "high",
    tags: ["cancer", "prevention", "screening", "control"],
    isActive: true,
    addedBy: "system"
  },

  // Arthritis Sources
  {
    id: "acr-arthritis-guidelines",
    title: "ACR Arthritis Treatment Guidelines",
    type: "clinical_guideline",
    content: "American College of Rheumatology guidelines for osteoarthritis and rheumatoid arthritis management, including pharmacologic and non-pharmacologic interventions.",
    url: "https://www.rheumatology.org/Practice-Quality/Clinical-Support/Clinical-Practice-Guidelines",
    author: "American College of Rheumatology",
    publishedDate: "2023-11-30",
    reliability: "high",
    tags: ["arthritis", "rheumatology", "osteoarthritis", "rheumatoid"],
    isActive: true,
    addedBy: "system"
  },

  // Additional sources for other conditions can be added here...
]

// Enhanced Protocol definitions
export const mockProtocols: Protocol[] = [
  {
    id: "diabetes-daily-management",
    name: "Comprehensive Diabetes Management Protocol",
    description: "Evidence-based daily routine for optimal diabetes control following ADA guidelines",
    conditionId: "diabetes1",
    type: "preset",
    sources: ["ada-diabetes-standards", "cdc-diabetes-guidelines"],
    isActive: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    steps: [
      {
        id: "morning-glucose-check",
        title: "Fasting Glucose Measurement",
        description: "Check blood glucose upon waking before eating or drinking. Target: 80-130 mg/dL",
        order: 1,
        isRequired: true,
        estimatedDuration: 2,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "medication-administration",
        title: "Diabetes Medication/Insulin",
        description: "Take prescribed diabetes medications or administer insulin as directed",
        order: 2,
        isRequired: true,
        estimatedDuration: 3,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "meal-planning",
        title: "Carbohydrate Counting and Meal Planning",
        description: "Plan meals with appropriate carbohydrate content and calculate insulin if needed",
        order: 3,
        isRequired: true,
        estimatedDuration: 10,
        frequency: "daily",
        timeOfDay: "any",
        resources: []
      },
      {
        id: "post-meal-monitoring",
        title: "Post-Meal Glucose Check",
        description: "Check glucose 1-2 hours after meals. Target: <180 mg/dL",
        order: 4,
        isRequired: true,
        estimatedDuration: 2,
        frequency: "daily",
        timeOfDay: "any",
        resources: []
      },
      {
        id: "evening-glucose",
        title: "Bedtime Glucose Check",
        description: "Check glucose before bed to prevent overnight hypoglycemia. Target: 100-140 mg/dL",
        order: 5,
        isRequired: true,
        estimatedDuration: 2,
        frequency: "daily",
        timeOfDay: "bedtime",
        resources: []
      }
    ]
  },
  {
    id: "asthma-control-protocol",
    name: "Daily Asthma Control Protocol",
    description: "GINA guideline-based asthma management for optimal control and prevention",
    conditionId: "asthma",
    type: "preset",
    sources: ["gina-asthma-guidelines", "cdc-asthma-management"],
    isActive: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-12-15T00:00:00Z",
    steps: [
      {
        id: "morning-peak-flow",
        title: "Morning Peak Flow Measurement",
        description: "Measure peak flow before taking medication to establish personal best and detect changes",
        order: 1,
        isRequired: true,
        estimatedDuration: 3,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "controller-medication",
        title: "Daily Controller Medication",
        description: "Take prescribed controller medication (usually inhaled corticosteroid) as directed",
        order: 2,
        isRequired: true,
        estimatedDuration: 2,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "trigger-avoidance",
        title: "Environmental Trigger Assessment",
        description: "Check air quality, pollen count, and plan to avoid known personal triggers",
        order: 3,
        isRequired: false,
        estimatedDuration: 5,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "symptom-monitoring",
        title: "Symptom and Peak Flow Logging",
        description: "Record symptoms, peak flow readings, and any rescue medication use",
        order: 4,
        isRequired: true,
        estimatedDuration: 3,
        frequency: "daily",
        timeOfDay: "evening",
        resources: []
      }
    ]
  },
  {
    id: "hypertension-management",
    name: "Hypertension Management Protocol",
    description: "AHA guideline-based blood pressure monitoring and lifestyle management",
    conditionId: "hypertension", 
    type: "preset",
    sources: ["aha-hypertension-guidelines", "cdc-hypertension-management"],
    isActive: true,
    createdAt: "2023-01-01T00:00:00Z",
    updatedAt: "2023-12-01T00:00:00Z",
    steps: [
      {
        id: "morning-bp-check",
        title: "Morning Blood Pressure Check",
        description: "Measure blood pressure after sitting quietly for 5 minutes. Target: <130/80 mmHg",
        order: 1,
        isRequired: true,
        estimatedDuration: 5,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "medication-compliance",
        title: "Antihypertensive Medication",
        description: "Take prescribed blood pressure medications at the same time daily",
        order: 2,
        isRequired: true,
        estimatedDuration: 1,
        frequency: "daily",
        timeOfDay: "morning",
        resources: []
      },
      {
        id: "lifestyle-monitoring",
        title: "Lifestyle Factor Tracking",
        description: "Monitor sodium intake, physical activity, weight, and stress levels",
        order: 3,
        isRequired: false,
        estimatedDuration: 5,
        frequency: "daily",
        timeOfDay: "evening",
        resources: []
      }
    ]
  }
]

// Enhanced tool presets with condition-specific tools
export const toolPresets = [
  {
    id: "mood-tracker",
    name: "Mood Tracker",
    type: "mood_tracker",
    description: "Track daily mood with emoji-based options and additional context",
    applicableConditions: ["depression", "anxiety", "substance_use", "all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["19:00"],
      customFields: [
        { 
          id: "mood", 
          name: "How are you feeling?", 
          type: "emoji_select", 
          required: true, 
          options: [
            { value: "very-sad", emoji: "😢", label: "Very Sad" },
            { value: "sad", emoji: "😔", label: "Sad" },
            { value: "neutral", emoji: "😐", label: "Neutral" },
            { value: "happy", emoji: "😊", label: "Happy" },
            { value: "very-happy", emoji: "😄", label: "Very Happy" }
          ]
        },
        { id: "energy", name: "Energy Level", type: "scale", required: true, min: 1, max: 10 },
        { id: "stress", name: "Stress Level", type: "scale", required: true, min: 1, max: 10 },
        { 
          id: "activities", 
          name: "Activities Today", 
          type: "multiselect", 
          required: false, 
          options: ["work", "exercise", "social", "hobbies", "rest", "therapy", "medication", "family_time", "study", "medical_appointment"]
        },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "symptom-tracker",
    name: "Symptom Tracker",
    type: "symptom_tracker",
    description: "Track symptoms with severity, location, and triggers",
    applicableConditions: ["all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["09:00", "15:00", "21:00"],
      customFields: [
        { 
          id: "symptom_type", 
          name: "Symptom Type", 
          type: "select_or_text", 
          required: true,
          options: ["headache", "fatigue", "nausea", "dizziness", "pain", "fever", "shortness_of_breath", "chest_pain", "cough", "other"]
        },
        { id: "severity", name: "Severity", type: "scale", required: true, min: 0, max: 10 },
        { id: "location", name: "Location", type: "text", required: false },
        { 
          id: "triggers", 
          name: "Possible Triggers", 
          type: "multiselect", 
          required: false,
          options: ["stress", "weather", "food", "exercise", "medication", "sleep_deprivation", "allergens", "other"]
        },
        { id: "duration", name: "Duration (minutes)", type: "number", required: false, min: 1, max: 1440 },
        { id: "notes", name: "Additional Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "medication-reminder",
    name: "Medication Reminder",
    type: "medication_reminder",
    description: "Track medication adherence with reminders and dosage tracking",
    applicableConditions: ["all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["08:00", "14:00", "20:00"],
      customFields: [
        { id: "medication_name", name: "Medication Name", type: "text", required: true },
        { id: "dosage", name: "Dosage", type: "text", required: true },
        { id: "frequency", name: "Times per day", type: "select", required: true, options: ["1", "2", "3", "4", "5", "6"] },
        { 
          id: "time_of_day", 
          name: "Preferred Times", 
          type: "time_multi", 
          required: true,
          help_text: "Select times when you want to take this medication"
        },
        { id: "taken", name: "Medication Taken", type: "boolean", required: true },
        { 
          id: "timing", 
          name: "Timing", 
          type: "select", 
          required: false, 
          options: ["with_food", "without_food", "before_food", "after_food", "bedtime", "as_needed"]
        },
        { 
          id: "side_effects", 
          name: "Side Effects", 
          type: "multiselect", 
          required: false,
          options: ["none", "nausea", "dizziness", "headache", "fatigue", "stomach_upset", "drowsiness", "other"]
        },
        { id: "effectiveness", name: "Effectiveness (1-10)", type: "scale", required: false, min: 1, max: 10 },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "glucose-tracker",
    name: "Glucose Monitoring",
    type: "glucose_tracker",
    description: "Track blood glucose levels with timing and context for diabetes management",
    applicableConditions: ["diabetes1", "diabetes2"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["07:00", "12:00", "18:00", "22:00"],
      customFields: [
        { id: "glucose_level", name: "Glucose Level (mg/dL)", type: "number", required: true, min: 40, max: 600 },
        { 
          id: "timing", 
          name: "Measurement Timing", 
          type: "select", 
          required: true, 
          options: ["fasting", "before_meal", "2h_after_meal", "bedtime", "random"]
        },
        { id: "carbs_consumed", name: "Carbohydrates (g)", type: "number", required: false, min: 0, max: 200 },
        { id: "insulin_taken", name: "Insulin Dose (units)", type: "number", required: false, min: 0, max: 100 },
        { 
          id: "symptoms", 
          name: "Symptoms", 
          type: "multiselect", 
          required: false, 
          options: ["none", "hypoglycemia", "hyperglycemia", "nausea", "fatigue", "dizziness", "headache"]
        },
        { id: "exercise", name: "Exercise in last 2 hours", type: "boolean", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "vital-signs-tracker",
    name: "Vital Signs Tracker",
    type: "vital_signs_tracker",
    description: "Track blood pressure, heart rate, and temperature with charts",
    applicableConditions: ["hypertension", "heart_failure", "coronary_artery_disease", "all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["08:00", "20:00"],
      customFields: [
        { id: "systolic", name: "Systolic Pressure (mmHg)", type: "number", required: false, min: 70, max: 250 },
        { id: "diastolic", name: "Diastolic Pressure (mmHg)", type: "number", required: false, min: 40, max: 150 },
        { id: "heart_rate", name: "Heart Rate (bpm)", type: "number", required: false, min: 40, max: 200 },
        { id: "temperature", name: "Temperature (°F)", type: "number", required: false, min: 95, max: 110, step: 0.1 },
        { 
          id: "position", 
          name: "Position During Measurement", 
          type: "select", 
          required: false, 
          options: ["sitting", "standing", "lying_down"]
        },
        { id: "medication_taken", name: "Medication Taken Today", type: "boolean", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "sleep-tracker",
    name: "Sleep Tracker",
    type: "sleep_tracker",
    description: "Track sleep patterns with automatic duration calculation and weekly graphs",
    applicableConditions: ["depression", "anxiety", "substance_use", "all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["22:00"],
      customFields: [
        { id: "bedtime", name: "Bedtime", type: "time", required: true },
        { id: "wake_time", name: "Wake Time", type: "time", required: true },
        { id: "sleep_quality", name: "Sleep Quality (1-10)", type: "scale", required: true, min: 1, max: 10 },
        { id: "time_to_fall_asleep", name: "Time to Fall Asleep (minutes)", type: "number", required: false, min: 0, max: 240 },
        { id: "night_awakenings", name: "Night Awakenings", type: "number", required: false, min: 0, max: 20 },
        { 
          id: "sleep_aids", 
          name: "Sleep Aids Used", 
          type: "multiselect", 
          required: false,
          options: ["none", "medication", "melatonin", "herbal_tea", "meditation", "white_noise", "weighted_blanket"]
        },
        { id: "dreams", name: "Dreams/Nightmares", type: "boolean", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "hydration-tracker",
    name: "Hydration Tracker",
    type: "hydration_tracker",
    description: "Simple water intake tracking with daily totals and quick logging",
    applicableConditions: ["all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["09:00", "12:00", "15:00", "18:00"],
      dailyGoal: 2000, // ml
      servingSizes: [
        { name: "Glass", ml: 250 },
        { name: "Bottle", ml: 500 },
        { name: "Large Bottle", ml: 750 },
        { name: "Cup", ml: 200 }
      ],
      customFields: [
        { 
          id: "serving_type", 
          name: "Serving Type", 
          type: "select", 
          required: true,
          options: ["glass_250ml", "bottle_500ml", "large_bottle_750ml", "cup_200ml", "custom"]
        },
        { id: "custom_amount", name: "Custom Amount (ml)", type: "number", required: false, min: 1, max: 2000 },
        { 
          id: "drink_type", 
          name: "Drink Type", 
          type: "select", 
          required: false,
          options: ["water", "herbal_tea", "coffee", "juice", "sports_drink", "other"]
        }
      ]
    }
  },
  {
    id: "nutrition-tracker",
    name: "Nutrition Tracker",
    type: "nutrition_tracker",
    description: "Track meals and calories with daily totals and nutritional insights",
    applicableConditions: ["diabetes1", "diabetes2", "all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["07:00", "12:00", "19:00"],
      customFields: [
        { 
          id: "meal_type", 
          name: "Meal Type", 
          type: "select", 
          required: true,
          options: ["breakfast", "lunch", "dinner", "snack", "other"]
        },
        { id: "food_name", name: "Food/Meal Name", type: "text", required: true },
        { id: "calories", name: "Calories", type: "number", required: false, min: 1, max: 5000 },
        { id: "carbs", name: "Carbohydrates (g)", type: "number", required: false, min: 0, max: 500 },
        { id: "protein", name: "Protein (g)", type: "number", required: false, min: 0, max: 200 },
        { id: "fat", name: "Fat (g)", type: "number", required: false, min: 0, max: 200 },
        { id: "fiber", name: "Fiber (g)", type: "number", required: false, min: 0, max: 100 },
        { id: "sodium", name: "Sodium (mg)", type: "number", required: false, min: 0, max: 10000 },
        { id: "portion_size", name: "Portion Size", type: "text", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "physical-activity-tracker",
    name: "Physical Activity Tracker",
    type: "exercise_tracker",
    description: "Log workouts and physical activities with duration, intensity, and summaries",
    applicableConditions: ["hypertension", "diabetes1", "diabetes2", "heart_failure", "arthritis", "all"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["18:00"],
      customFields: [
        { 
          id: "exercise_type", 
          name: "Exercise Type", 
          type: "select", 
          required: true,
          options: ["walking", "running", "swimming", "cycling", "strength_training", "yoga", "pilates", "dancing", "sports", "physical_therapy", "other"]
        },
        { id: "duration", name: "Duration (minutes)", type: "number", required: true, min: 1, max: 300 },
        { 
          id: "intensity", 
          name: "Intensity", 
          type: "select", 
          required: false,
          options: ["light", "moderate", "vigorous"]
        },
        { id: "calories_burned", name: "Calories Burned", type: "number", required: false, min: 1, max: 2000 },
        { id: "heart_rate_avg", name: "Average Heart Rate", type: "number", required: false, min: 60, max: 200 },
        { id: "distance", name: "Distance (miles)", type: "number", required: false, min: 0.1, max: 100, step: 0.1 },
        { 
          id: "symptoms_during", 
          name: "Symptoms During Exercise", 
          type: "multiselect", 
          required: false,
          options: ["none", "shortness_of_breath", "chest_pain", "dizziness", "fatigue", "joint_pain", "nausea"]
        },
        { id: "recovery_time", name: "Recovery Time (minutes)", type: "number", required: false, min: 0, max: 60 },
        { id: "enjoyment", name: "Enjoyment (1-10)", type: "scale", required: false, min: 1, max: 10 },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "peak-flow-tracker",
    name: "Peak Flow Monitor",
    type: "respiratory_tracker",
    description: "Monitor lung function with peak flow measurements for asthma and COPD",
    applicableConditions: ["asthma", "copd"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["08:00", "20:00"],
      customFields: [
        { id: "peak_flow", name: "Peak Flow (L/min)", type: "number", required: true, min: 100, max: 800 },
        { id: "personal_best_percent", name: "% of Personal Best", type: "number", required: false, min: 0, max: 150 },
        { 
          id: "zone", 
          name: "Zone", 
          type: "select", 
          required: false,
          options: ["green", "yellow", "red"]
        },
        { 
          id: "symptoms", 
          name: "Symptoms", 
          type: "multiselect", 
          required: false,
          options: ["none", "wheezing", "cough", "shortness_of_breath", "chest_tightness"]
        },
        { id: "rescue_medication", name: "Rescue Medication Used", type: "boolean", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "blood-pressure-tracker",
    name: "Blood Pressure Monitor",
    type: "vital_signs_tracker",
    description: "Dedicated blood pressure tracking with trend analysis",
    applicableConditions: ["hypertension", "heart_failure", "coronary_artery_disease"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["08:00", "20:00"],
      customFields: [
        { id: "systolic", name: "Systolic (mmHg)", type: "number", required: true, min: 70, max: 250 },
        { id: "diastolic", name: "Diastolic (mmHg)", type: "number", required: true, min: 40, max: 150 },
        { id: "heart_rate", name: "Heart Rate (bpm)", type: "number", required: false, min: 40, max: 200 },
        { 
          id: "position", 
          name: "Position", 
          type: "select", 
          required: false,
          options: ["sitting", "standing", "lying_down"]
        },
        { id: "medication_taken", name: "Medication Taken Today", type: "boolean", required: false },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  },
  {
    id: "pain-tracker",
    name: "Pain & Symptom Tracker",
    type: "symptom_tracker",
    description: "Track pain levels and arthritis symptoms with location mapping",
    applicableConditions: ["arthritis", "osteoporosis"],
    defaultSettings: {
      notifications: true,
      reminderTimes: ["09:00", "15:00", "21:00"],
      customFields: [
        { id: "pain_level", name: "Pain Level (0-10)", type: "scale", required: true, min: 0, max: 10 },
        { id: "stiffness", name: "Stiffness (0-10)", type: "scale", required: true, min: 0, max: 10 },
        { 
          id: "affected_joints", 
          name: "Affected Joints", 
          type: "multiselect", 
          required: false,
          options: ["hands", "wrists", "elbows", "shoulders", "neck", "back", "hips", "knees", "ankles", "feet"]
        },
        { id: "morning_stiffness_duration", name: "Morning Stiffness (minutes)", type: "number", required: false, min: 0, max: 480 },
        { id: "medication_taken", name: "Pain Medication Taken", type: "boolean", required: false },
        { 
          id: "activities_affected", 
          name: "Activities Affected", 
          type: "multiselect", 
          required: false,
          options: ["walking", "climbing_stairs", "writing", "dressing", "cooking", "sleeping", "driving"]
        },
        { id: "notes", name: "Notes", type: "textarea", required: false }
      ]
    }
  }
]