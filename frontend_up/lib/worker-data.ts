export const workerTypeSkills: { [key: string]: string[] } = {
  "Security guards": [
    "Access Control", "Visitor Management", "Patrolling", "CCTV Monitoring", "Surveillance", "Incident Reporting", "Emergency Response", "Crowd Control", "Conflict Management", "Fire Safety Awareness", "Alarm Systems Handling", "Security Protocols", "Shift Management", "Team Supervision", "Risk Assessment", "Incident Investigation", "Report Writing", "Communication Skills", "Physical Fitness", "First Aid", "SOP Compliance"
  ],
  "Security Supervisor": [
    "Access Control", "Visitor Management", "Patrolling", "CCTV Monitoring", "Surveillance", "Incident Reporting", "Emergency Response", "Crowd Control", "Conflict Management", "Fire Safety Awareness", "Alarm Systems Handling", "Security Protocols", "Shift Management", "Team Supervision", "Risk Assessment", "Incident Investigation", "Report Writing", "Communication Skills", "Physical Fitness", "First Aid", "SOP Compliance"
  ],
  "Housekeepers": [
    "Cleaning & Sanitization", "Floor Cleaning", "Washroom Cleaning", "Waste Management", "Linen Handling", "Chemical Handling", "Housekeeping Equipment Operation", "Room Maintenance", "Deep Cleaning", "Hygiene Standards", "Inventory Management", "Time Management", "Attention to Detail"
  ],
  "Facility Manager": [
    "Facility Operations", "Maintenance Planning", "Vendor Management", "Asset Management", "Preventive Maintenance", "HVAC Knowledge", "Electrical & Plumbing Basics", "Budgeting", "Safety Compliance", "AMC Management", "Team Coordination", "Space Management", "Soft Services Management", "Hard Services Management", "SLA Monitoring", "Documentation"
  ],
  "Electricians": [
    "Wiring Installation", "Electrical Maintenance", "Panel Board Handling", "Circuit Breaker Installation", "Fault Detection", "Electrical Repair", "Power Tools Usage", "Load Calculation", "Earthing", "Lighting Systems", "Industrial Electrical Work", "Residential Electrical Work", "Safety Compliance", "Multimeter Usage"
  ],
  "Plumbers": [
    "Pipe Fitting", "Leakage Detection", "Drainage Systems", "Water Supply Systems", "Sanitary Installation", "Tap & Valve Repair", "Bathroom Fittings", "Sewage Systems", "Plumbing Tools Usage", "Pressure Testing", "Maintenance & Repair", "Blueprint Reading"
  ],
  "Liftman": [
    "Elevator Operation", "Passenger Assistance", "Safety Procedures", "Emergency Handling", "Lift Controls Knowledge", "Daily Lift Checks", "Communication Skills", "Crowd Handling", "Basic Troubleshooting", "SOP Compliance"
  ],
  "Fireman": [
    "Fire Fighting", "Fire Extinguisher Handling", "Fire Alarm Systems", "Emergency Evacuation", "Rescue Operations", "Fire Safety Inspection", "Disaster Management", "First Aid, PPE Handling", "Risk Assessment", "Incident Reporting"
  ],
  "Gardener": [
    "Plant Care", "Lawn Maintenance", "Pruning", "Landscaping", "Irrigation Systems", "Fertilization", "Pest Control", "Soil Preparation", "Gardening Tools Usage", "Nursery Management", "Seasonal Plantation", "Outdoor Maintenance"
  ],
  "Pantry Boy": [
    "Pantry Management", "Tea & Coffee Preparation", "Food Hygiene", "Utensil Cleaning", "Stock Replenishment", "Office Service Etiquette", "Time Management", "Basic Cooking", "Waste Disposal", "Cleanliness Maintenance"
  ],
  "Nurse": [
    "Patient Care", "Vital Signs Monitoring", "Medication Administration", "Wound Dressing", "Injection Handling", "IV Management", "Patient Hygiene Care", "Medical Documentation", "Emergency Care", "Infection Control", "Equipment Handling", "Compassionate Care"
  ],
  "Aya": [
    "Patient Assistance", "Elderly Care", "Child Care", "Bedside Assistance", "Feeding Support", "Hygiene Maintenance", "Mobility Support", "Basic First Aid", "Emotional Support", "Cleanliness Maintenance"
  ],
  "Carpenters": [
    "Wood Cutting", "Furniture Making", "Installation Work", "Repair & Maintenance", "Measurement & Marking", "Blueprint Reading", "Modular Furniture Assembly, Power Tools Usage", "Polishing & Finishing", "Safety Practices"
  ],
  "Welders": [
    "Arc Welding", "Gas Welding", "MIG Welding", "TIG Welding", "Fabrication Work", "Metal Cutting", "Blueprint Reading", "Welding Equipment Handling", "Safety Procedures", "Structural Welding", "Repair Welding"
  ],
  "Electronic mechanic": [
    "Electronic Repair", "Circuit Analysis", "PCB Repair", "Soldering", "Electronic Testing", "Troubleshooting", "Component Replacement", "Use of Testing Instruments", "Consumer Electronics Repair", "Industrial Electronics Basics"
  ],
  "Motor mechanic": [
    "Engine Repair", "Vehicle Maintenance", "Brake Systems", "Clutch Repair", "Transmission Systems", "Electrical Diagnostics", "Oil Change", "Suspension Systems", "Vehicle Inspection", "Tool Handling", "Fault Diagnosis"
  ],
  "Swimming trainer": [
    "Swimming Instruction", "Water Safety", "Lifesaving Techniques", "CPR", "Stroke Training", "Beginner Coaching", "Advanced Coaching", "Pool Safety Rules", "Fitness Training", "Child Training", "Adult Training"
  ],
  "WTP / STP operator": [
    "Water Treatment Process", "Sewage Treatment Process", "Chemical Dosing", "Pump Operation", "Valve Operation", "Plant Monitoring", "Water Quality Testing", "Equipment Maintenance", "Safety Compliance", "Log Book Maintenance", "Process Optimization"
  ],
  "Accountant": [
    "Bookkeeping", "Tally", "GST Filing", "Taxation", "Payroll Management", "Financial Reporting", "Balance Sheet Preparation", "Accounts Receivable", "Accounts Payable", "Audit Support", "Excel Skills", "Compliance Management"
  ],
  "Rajmistri (Masons)": [
    "Bricklaying", "Plastering", "Concreting", "Tiling", "Stone Masonry", "Blueprint Reading", "Material Estimation", "Safety Practices", "Finishing Work", "Formwork"
  ],
  "Any skilled/unskilled workers": [
    "General Maintenance", "Helper Work", "Machine Operation", "Manual Labor", "Cleaning Assistance", "Tool Handling", "Safety Awareness", "Basic Electrical Knowledge", "Basic Plumbing Knowledge", "Team Support", "Physical Work"
  ]
};

export const salaryRanges = [
  { key: "any", label: "Any", min: undefined, max: undefined },
  { key: "below10k", label: "Below 10,000", min: 0, max: 9999 },
  { key: "10k20k", label: "10,000 - 20,000", min: 10000, max: 20000 },
  { key: "20k30k", label: "20,000 - 30,000", min: 20000, max: 30000 },
  { key: "30k45k", label: "30,000 - 45,000", min: 30000, max: 45000 },
  { key: "45k60k", label: "45,000 - 60,000", min: 45000, max: 60000 },
  { key: "60k90k", label: "60,000 - 90,000", min: 60000, max: 90000 },
  { key: "above90k", label: "Above 90,000", min: 90001, max: undefined },
];

export const experienceRanges = [
  { key: "any", label: "Any", min: undefined, max: undefined },
  { key: "lessThan1", label: "Less than 1 Year", min: 0, max: 0.9 },
  { key: "1to2", label: "1 - 2 Years", min: 1, max: 2 },
  { key: "2to5", label: "2 - 5 Years", min: 2, max: 5 },
  { key: "above5", label: "Greater than 5 Years", min: 5.1, max: undefined },
];
