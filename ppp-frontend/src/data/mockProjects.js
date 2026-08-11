export const mockProjects = [
  // 15 Housing Projects
  {
    id: '1',
    code: 'PPP-H-001',
    name: 'AYAT Housing Project',
    type: 'Housing',
    subCategory: 'Mixed-Income Housing',
    description: '13,752 Housing units with 65/35% share model providing affordable modern residential towers with commercial basements.',
    address: 'Kazanchis',
    subCity: 'Arada',
    woreda: '08',
    siteArea: 226600,
    contractSigningDate: '2025-06-19',
    projectStartDate: '2025-07-01',
    projectEndDate: '2028-12-31',
    preliminaryBudget: 94016000000,
    status: 'Signed',
    completionPercentage: 15,
    housingUnits: 13752,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'AYAT SHARE COMPANY',
    authority: 'AAHDC',
    spvName: 'Ayat PPP Housing SPV PLC',
    financials: [
      { id: 'f1', date: '2025-06-19', type: 'Initial Budget', amount: 94016000000, description: 'Approved PPP master budget' },
      { id: 'f2', date: '2025-08-15', type: 'Disbursement Phase 1', amount: 14102400000, description: 'Equity contribution & site mobilization' }
    ],
    milestones: [
      { id: 'm1', name: 'Design Approval & Environmental Clearance', targetDate: '2025-08-01', actualDate: '2025-07-28', status: 'Completed' },
      { id: 'm2', name: 'Groundbreaking & Site Preparation', targetDate: '2025-09-01', actualDate: '2025-09-05', status: 'Completed' },
      { id: 'm3', name: 'Tower Substructure Completion', targetDate: '2026-06-30', actualDate: null, status: 'In Progress' },
      { id: 'm4', name: 'Final Handover & Unit Allocation', targetDate: '2028-12-31', actualDate: null, status: 'Pending' }
    ],
    documents: [
      { id: 'd1', name: 'Contract_AAHDC_AYAT.pdf', type: 'Contract', size: '4.8 MB', uploadDate: '2025-06-20' },
      { id: 'd2', name: 'Feasibility_Study_Ayat.pdf', type: 'Feasibility Study', size: '12.4 MB', uploadDate: '2025-05-10' },
      { id: 'd3', name: 'Environmental_Impact_Assessment.pdf', type: 'EIA Report', size: '6.1 MB', uploadDate: '2025-07-02' }
    ]
  },
  {
    id: '2',
    code: 'PPP-H-002',
    name: 'Gotera Condominium Expansion',
    type: 'Housing',
    subCategory: 'High-Density Residential',
    description: 'High-rise residential apartment blocks targeting middle-income families with modern green parks.',
    address: 'Gotera Interchange',
    subCity: 'Kirkos',
    woreda: '04',
    siteArea: 185000,
    contractSigningDate: '2024-11-10',
    projectStartDate: '2025-01-15',
    projectEndDate: '2027-10-30',
    preliminaryBudget: 62500000000,
    status: 'Under Construction',
    completionPercentage: 42,
    housingUnits: 8400,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'SUNSHINE CONSTRUCTION PLC',
    authority: 'AAHDC',
    spvName: 'Gotera Heights PPP Co.',
    financials: [
      { id: 'f1', date: '2024-11-10', type: 'Initial Budget', amount: 62500000000, description: 'Project concession contract amount' },
      { id: 'f2', date: '2025-02-01', type: 'Phase 1 Tranche', amount: 18750000000, description: 'Foundation & structural framing disbursement' }
    ],
    milestones: [
      { id: 'm1', name: 'Architectural Blueprint Sign-off', targetDate: '2024-12-15', actualDate: '2024-12-12', status: 'Completed' },
      { id: 'm2', name: 'Excavation & Foundation Work', targetDate: '2025-04-30', actualDate: '2025-05-02', status: 'Completed' },
      { id: 'm3', name: 'Structural Framing (Core 1-4)', targetDate: '2026-08-15', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Gotera_Concession_Agreement.pdf', type: 'Contract', size: '8.2 MB', uploadDate: '2024-11-12' },
      { id: 'd2', name: 'Structural_Audit_Report.pdf', type: 'Technical Audit', size: '3.9 MB', uploadDate: '2025-03-14' }
    ]
  },
  {
    id: '3',
    code: 'PPP-H-003',
    name: 'Sengatera Mid-Rise Housing Complex',
    type: 'Housing',
    subCategory: 'Urban Renewal Housing',
    description: 'Inner-city regeneration project combining public housing relocation units and market-rate flats.',
    address: 'Sengatera Business District',
    subCity: 'Lideta',
    woreda: '01',
    siteArea: 142000,
    contractSigningDate: '2025-02-20',
    projectStartDate: '2025-04-01',
    projectEndDate: '2027-06-30',
    preliminaryBudget: 48000000000,
    status: 'Under Construction',
    completionPercentage: 28,
    housingUnits: 6200,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'FLINTSTONE ENGINEERING',
    authority: 'AAHDC',
    spvName: 'Sengatera Living PPP Ltd',
    financials: [
      { id: 'f1', date: '2025-02-20', type: 'Initial Budget', amount: 48000000000, description: 'Approved PPP budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Site Clearing & Resettlement', targetDate: '2025-03-31', actualDate: '2025-03-25', status: 'Completed' },
      { id: 'm2', name: 'Basement Piling', targetDate: '2025-08-30', actualDate: '2025-09-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sengatera_PPP_Contract.pdf', type: 'Contract', size: '5.1 MB', uploadDate: '2025-02-22' }
    ]
  },
  {
    id: '4',
    code: 'PPP-H-004',
    name: 'CMC Green Village Housing PPP',
    type: 'Housing',
    subCategory: 'Eco-Friendly Residential',
    description: 'Solar-powered eco-housing estate with solar water heating, greywater recycling, and communal parks.',
    address: 'CMC Altad Road',
    subCity: 'Yeka',
    woreda: '12',
    siteArea: 310000,
    contractSigningDate: '2023-09-15',
    projectStartDate: '2023-11-01',
    projectEndDate: '2026-05-31',
    preliminaryBudget: 85000000000,
    status: 'Operational',
    completionPercentage: 96,
    housingUnits: 11200,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'GIZE REAL ESTATE & CONST.',
    authority: 'AAHDC',
    spvName: 'CMC Green Village SPV',
    financials: [
      { id: 'f1', date: '2023-09-15', type: 'Initial Budget', amount: 85000000000, description: 'Initial project allocation' },
      { id: 'f2', date: '2024-06-20', type: 'Revised Budget', amount: 88500000000, description: 'Scope extension for extra green solar panel capacity' }
    ],
    milestones: [
      { id: 'm1', name: 'Phase 1 Block Completion', targetDate: '2024-12-01', actualDate: '2024-11-28', status: 'Completed' },
      { id: 'm2', name: 'Phase 2 Block Completion', targetDate: '2025-10-01', actualDate: '2025-09-20', status: 'Completed' },
      { id: 'm3', name: 'Final Commissioning & Occupancy Permit', targetDate: '2026-04-15', actualDate: '2026-04-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'CMC_Green_Village_Contract.pdf', type: 'Contract', size: '10.5 MB', uploadDate: '2023-09-16' },
      { id: 'd2', name: 'Completion_Certificate_Phase1.pdf', type: 'Certificate', size: '2.1 MB', uploadDate: '2024-12-05' }
    ]
  },
  {
    id: '5',
    code: 'PPP-H-005',
    name: 'Bole Bulbula Smart City Housing',
    type: 'Housing',
    subCategory: 'Smart Residential',
    description: 'Modern residential smart district with fiber connectivity, centralized waste management, and playgrounds.',
    address: 'Bole Bulbula Ring Road',
    subCity: 'Bole',
    woreda: '09',
    siteArea: 275000,
    contractSigningDate: '2025-05-12',
    projectStartDate: '2025-07-01',
    projectEndDate: '2028-06-30',
    preliminaryBudget: 76000000000,
    status: 'Signed',
    completionPercentage: 10,
    housingUnits: 9800,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'NOAH REAL ESTATE',
    authority: 'AAHDC',
    spvName: 'Bole Smart Housing PPP Ltd',
    financials: [
      { id: 'f1', date: '2025-05-12', type: 'Initial Budget', amount: 76000000000, description: 'Concession agreement budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Town Planning Authorization', targetDate: '2025-07-31', actualDate: '2025-07-25', status: 'Completed' },
      { id: 'm2', name: 'Earthworks & Utility Layout', targetDate: '2026-01-31', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Bulbula_PPP_Agreement.pdf', type: 'Contract', size: '6.7 MB', uploadDate: '2025-05-14' }
    ]
  },
  {
    id: '6',
    code: 'PPP-H-006',
    name: 'Jeddah Street Residential Towers',
    type: 'Housing',
    subCategory: 'High-Density Residential',
    description: 'Twin 30-story residential towers with integrated day-care and community clinics.',
    address: 'Jeddah Street',
    subCity: 'Kirkos',
    woreda: '02',
    siteArea: 98000,
    contractSigningDate: '2025-01-08',
    projectStartDate: '2025-03-01',
    projectEndDate: '2027-12-15',
    preliminaryBudget: 42000000000,
    status: 'Under Construction',
    completionPercentage: 22,
    housingUnits: 5100,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'ENYWALES REAL ESTATE',
    authority: 'AAHDC',
    spvName: 'Jeddah Towers SPV',
    financials: [
      { id: 'f1', date: '2025-01-08', type: 'Initial Budget', amount: 42000000000, description: 'Base contract value' }
    ],
    milestones: [
      { id: 'm1', name: 'Geotechnical Soil Testing', targetDate: '2025-02-15', actualDate: '2025-02-10', status: 'Completed' },
      { id: 'm2', name: 'Foundation Slab Pouring', targetDate: '2025-08-30', actualDate: '2025-09-02', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Jeddah_Towers_Contract.pdf', type: 'Contract', size: '4.2 MB', uploadDate: '2025-01-10' }
    ]
  },
  {
    id: '7',
    code: 'PPP-H-007',
    name: 'Akaki Riverfront Social Housing',
    type: 'Housing',
    subCategory: 'Affordable Housing',
    description: 'Subsidized social housing initiative adjacent to Akaki eco-corridor development.',
    address: 'Kality Ring Road',
    subCity: 'Akaki Kality',
    woreda: '05',
    siteArea: 350000,
    contractSigningDate: '2025-07-01',
    projectStartDate: '2025-09-01',
    projectEndDate: '2029-03-31',
    preliminaryBudget: 110000000000,
    status: 'Procurement',
    completionPercentage: 5,
    housingUnits: 16500,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'AFRICA HOLDINGS & CONST.',
    authority: 'AAHDC',
    spvName: 'Akaki Riverfront PPP PLC',
    financials: [
      { id: 'f1', date: '2025-07-01', type: 'Initial Budget', amount: 110000000000, description: 'Master PPP Project Plan' }
    ],
    milestones: [
      { id: 'm1', name: 'RFP & Developer Final Selection', targetDate: '2025-06-30', actualDate: '2025-06-25', status: 'Completed' },
      { id: 'm2', name: 'Site Handover', targetDate: '2025-09-01', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Akaki_RFP_Document.pdf', type: 'Tender Document', size: '14.1 MB', uploadDate: '2025-04-15' }
    ]
  },
  {
    id: '8',
    code: 'PPP-H-008',
    name: 'Kolfe Keraniyo Community Village',
    type: 'Housing',
    subCategory: 'Mixed-Income Housing',
    description: 'Low-impact residential village offering studio, 1-bed, 2-bed, and 3-bed apartments.',
    address: 'Zenebework Area',
    subCity: 'Kolfe Keraniyo',
    woreda: '03',
    siteArea: 195000,
    contractSigningDate: '2024-08-14',
    projectStartDate: '2024-10-01',
    projectEndDate: '2027-04-30',
    preliminaryBudget: 54000000000,
    status: 'Under Construction',
    completionPercentage: 55,
    housingUnits: 7200,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'MIDROC INVESTMENT GROUP',
    authority: 'AAHDC',
    spvName: 'Kolfe Village PPP SPV',
    financials: [
      { id: 'f1', date: '2024-08-14', type: 'Initial Budget', amount: 54000000000, description: 'Base contract value' }
    ],
    milestones: [
      { id: 'm1', name: 'Superstructure Phase 1', targetDate: '2025-04-30', actualDate: '2025-04-20', status: 'Completed' },
      { id: 'm2', name: 'M&E Infrastructure Works', targetDate: '2026-03-31', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Kolfe_Village_Contract.pdf', type: 'Contract', size: '7.3 MB', uploadDate: '2024-08-16' }
    ]
  },
  {
    id: '9',
    code: 'PPP-H-009',
    name: 'Nifas Silk Workers Residence',
    type: 'Housing',
    subCategory: 'Industrial Worker Housing',
    description: 'Specialized affordable worker residence built close to industrial parks for textile and tech workforce.',
    address: 'Saris Abo Zone',
    subCity: 'Nifas Silk-Lafto',
    woreda: '07',
    siteArea: 160000,
    contractSigningDate: '2025-03-10',
    projectStartDate: '2025-05-01',
    projectEndDate: '2027-08-31',
    preliminaryBudget: 39000000000,
    status: 'Under Construction',
    completionPercentage: 30,
    housingUnits: 5800,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'YOTEK CONSTRUCTION',
    authority: 'AAHDC',
    spvName: 'Nifas Housing PPP Co.',
    financials: [
      { id: 'f1', date: '2025-03-10', type: 'Initial Budget', amount: 39000000000, description: 'Worker housing concession budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Foundation Concreting', targetDate: '2025-08-15', actualDate: '2025-08-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Nifas_Silk_Agreement.pdf', type: 'Contract', size: '5.9 MB', uploadDate: '2025-03-12' }
    ]
  },
  {
    id: '10',
    code: 'PPP-H-010',
    name: 'Addis Ketema Urban Relocation Flats',
    type: 'Housing',
    subCategory: 'Urban Renewal Housing',
    description: 'Urban upgrade housing complex replacing informal settlements with resilient modern apartments.',
    address: 'Mercato Perimeter',
    subCity: 'Addis Ketema',
    woreda: '06',
    siteArea: 120000,
    contractSigningDate: '2025-06-01',
    projectStartDate: '2025-07-15',
    projectEndDate: '2028-02-28',
    preliminaryBudget: 45000000000,
    status: 'Signed',
    completionPercentage: 8,
    housingUnits: 6000,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'SAMER REAL ESTATE',
    authority: 'AAHDC',
    spvName: 'Mercato Living PPP SPV',
    financials: [
      { id: 'f1', date: '2025-06-01', type: 'Initial Budget', amount: 45000000000, description: 'Urban renewal contract amount' }
    ],
    milestones: [
      { id: 'm1', name: 'Community Consultations & Signoff', targetDate: '2025-07-01', actualDate: '2025-06-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Addis_Ketema_Contract.pdf', type: 'Contract', size: '4.6 MB', uploadDate: '2025-06-03' }
    ]
  },
  {
    id: '11',
    code: 'PPP-H-011',
    name: 'Gullele Mountain View Apartments',
    type: 'Housing',
    subCategory: 'Eco-Friendly Residential',
    description: 'Terraced hillside residential complex with rainwater harvesting and integrated solar grids.',
    address: 'Entoto Road',
    subCity: 'Gullele',
    woreda: '02',
    siteArea: 210000,
    contractSigningDate: '2025-04-18',
    projectStartDate: '2025-06-01',
    projectEndDate: '2027-11-30',
    preliminaryBudget: 58000000000,
    status: 'Under Construction',
    completionPercentage: 20,
    housingUnits: 7500,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'HABESHA CONST. & DEV.',
    authority: 'AAHDC',
    spvName: 'Gullele Heights PPP Ltd',
    financials: [
      { id: 'f1', date: '2025-04-18', type: 'Initial Budget', amount: 58000000000, description: 'Base contract value' }
    ],
    milestones: [
      { id: 'm1', name: 'Slope Stabilization Work', targetDate: '2025-07-31', actualDate: '2025-08-05', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Gullele_Mountain_Contract.pdf', type: 'Contract', size: '6.3 MB', uploadDate: '2025-04-20' }
    ]
  },
  {
    id: '12',
    code: 'PPP-H-012',
    name: 'Lideta Heritage Housing Park',
    type: 'Housing',
    subCategory: 'Urban Renewal Housing',
    description: 'Heritage-sensitive urban housing project featuring cultural community centers and gardens.',
    address: 'Lideta Church Square',
    subCity: 'Lideta',
    woreda: '04',
    siteArea: 130000,
    contractSigningDate: '2024-03-25',
    projectStartDate: '2024-05-01',
    projectEndDate: '2026-09-30',
    preliminaryBudget: 41000000000,
    status: 'Under Construction',
    completionPercentage: 68,
    housingUnits: 5400,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'BETA REAL ESTATE',
    authority: 'AAHDC',
    spvName: 'Lideta Heritage PPP SPV',
    financials: [
      { id: 'f1', date: '2024-03-25', type: 'Initial Budget', amount: 41000000000, description: 'Concession contract value' }
    ],
    milestones: [
      { id: 'm1', name: 'Roofing & Exterior Enclosure', targetDate: '2025-11-30', actualDate: '2025-11-15', status: 'Completed' },
      { id: 'm2', name: 'Interior Finishing & Utilities', targetDate: '2026-06-30', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Lideta_Heritage_PPP.pdf', type: 'Contract', size: '5.8 MB', uploadDate: '2024-03-27' }
    ]
  },
  {
    id: '13',
    code: 'PPP-H-013',
    name: 'CMC Phase 2 Waterfront Housing',
    type: 'Housing',
    subCategory: 'Mixed-Income Housing',
    description: 'Waterfront residential precinct with boardwalks, green parks, and modern apartment units.',
    address: 'CMC Boulevard',
    subCity: 'Yeka',
    woreda: '10',
    siteArea: 250000,
    contractSigningDate: '2025-08-01',
    projectStartDate: '2025-10-01',
    projectEndDate: '2029-01-31',
    preliminaryBudget: 89000000000,
    status: 'Feasibility',
    completionPercentage: 0,
    housingUnits: 12000,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'TSEHAY REAL ESTATE PLC',
    authority: 'AAHDC',
    spvName: 'CMC Waterfront SPV',
    financials: [
      { id: 'f1', date: '2025-08-01', type: 'Initial Budget', amount: 89000000000, description: 'Proposed PPP capital outlay' }
    ],
    milestones: [
      { id: 'm1', name: 'Feasibility & Market Assessment', targetDate: '2025-09-30', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'CMC_Waterfront_Feasibility.pdf', type: 'Feasibility Study', size: '18.9 MB', uploadDate: '2025-08-05' }
    ]
  },
  {
    id: '14',
    code: 'PPP-H-014',
    name: 'Summit Park View Apartments',
    type: 'Housing',
    subCategory: 'High-Density Residential',
    description: 'Modern residential tower park near Summit Pepsi factory corridor.',
    address: 'Summit Road',
    subCity: 'Bole',
    woreda: '06',
    siteArea: 175000,
    contractSigningDate: '2024-06-15',
    projectStartDate: '2024-08-01',
    projectEndDate: '2026-12-31',
    preliminaryBudget: 51000000000,
    status: 'Under Construction',
    completionPercentage: 60,
    housingUnits: 6900,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'GIZE & METEC CONST.',
    authority: 'AAHDC',
    spvName: 'Summit Park View SPV',
    financials: [
      { id: 'f1', date: '2024-06-15', type: 'Initial Budget', amount: 51000000000, description: 'Approved budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Block Structural Top-Out', targetDate: '2025-10-15', actualDate: '2025-10-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Summit_Park_Contract.pdf', type: 'Contract', size: '7.1 MB', uploadDate: '2024-06-18' }
    ]
  },
  {
    id: '15',
    code: 'PPP-H-015',
    name: 'Kotebe Teacher Housing Cooperative',
    type: 'Housing',
    subCategory: 'Affordable Housing',
    description: 'Dedicated PPP affordable housing for educational sector staff and public service workers.',
    address: 'Kotebe Road',
    subCity: 'Yeka',
    woreda: '04',
    siteArea: 140000,
    contractSigningDate: '2023-11-20',
    projectStartDate: '2024-01-10',
    projectEndDate: '2026-03-31',
    preliminaryBudget: 36000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: 4800,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'SATCON CONSTRUCTION',
    authority: 'AAHDC',
    spvName: 'Kotebe Housing SPV',
    financials: [
      { id: 'f1', date: '2023-11-20', type: 'Initial Budget', amount: 36000000000, description: 'Project budget' },
      { id: 'f2', date: '2026-03-15', type: 'Final Settlement', amount: 36000000000, description: '100% project completion payout' }
    ],
    milestones: [
      { id: 'm1', name: 'Final Handover Ceremony', targetDate: '2026-03-31', actualDate: '2026-03-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kotebe_Handover_Certificate.pdf', type: 'Certificate', size: '3.4 MB', uploadDate: '2026-03-26' }
    ]
  },

  // 43 Non-Housing Projects (Commercial, Infrastructure, Parking, Logistics, Transit, Tech Parks)
  {
    id: '16',
    code: 'PPP-NH-001',
    name: 'Kazanchis Commercial & Financial Tower',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'A 45-story flagship financial hub providing Grade-A office spaces, conference halls, and automated underground parking.',
    address: 'Kazanchis Financial District',
    subCity: 'Kirkos',
    woreda: '08',
    siteArea: 45000,
    contractSigningDate: '2025-01-10',
    projectStartDate: '2025-03-01',
    projectEndDate: '2028-09-30',
    preliminaryBudget: 125000000000,
    status: 'Under Construction',
    completionPercentage: 25,
    housingUnits: null,
    commercialSpaces: 85000,
    parkingCapacity: 2400,
    developer: 'MIDROC INVESTMENT GROUP',
    authority: 'AACDA',
    spvName: 'Kazanchis Financial Tower PPP SPV',
    financials: [
      { id: 'f1', date: '2025-01-10', type: 'Initial Budget', amount: 125000000000, description: 'Master commercial tower concession budget' },
      { id: 'f2', date: '2025-04-01', type: 'Equity Investment', amount: 25000000000, description: 'Private investor equity contribution' }
    ],
    milestones: [
      { id: 'm1', name: 'Deep Excavation & Diaphragm Wall', targetDate: '2025-07-31', actualDate: '2025-08-05', status: 'Completed' },
      { id: 'm2', name: 'Basement Parking Structures B1-B5', targetDate: '2026-04-30', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Kazanchis_Financial_Tower_PPP.pdf', type: 'Contract', size: '15.2 MB', uploadDate: '2025-01-12' },
      { id: 'd2', name: 'Commercial_Lease_Strategy.pdf', type: 'Strategy Document', size: '4.5 MB', uploadDate: '2025-03-20' }
    ]
  },
  {
    id: '17',
    code: 'PPP-NH-002',
    name: 'Addis Smart Multi-Story Parking Hub (Bole)',
    type: 'Non-Housing',
    subCategory: 'Parking Infrastructure',
    description: 'Automated 10-level smart parking facility with EV charging stations and ground-floor retail outlets.',
    address: 'Bole Medhanealem Corridor',
    subCity: 'Bole',
    woreda: '03',
    siteArea: 18000,
    contractSigningDate: '2024-09-05',
    projectStartDate: '2024-11-01',
    projectEndDate: '2026-08-31',
    preliminaryBudget: 18500000000,
    status: 'Under Construction',
    completionPercentage: 74,
    housingUnits: null,
    commercialSpaces: 4500,
    parkingCapacity: 1800,
    developer: 'ZEMEN BUS & INFRASTRUCTURE PLC',
    authority: 'AATMA',
    spvName: 'Bole Smart Park SPV',
    financials: [
      { id: 'f1', date: '2024-09-05', type: 'Initial Budget', amount: 18500000000, description: 'Concession contract value' }
    ],
    milestones: [
      { id: 'm1', name: 'Robotic Parking Crane Assembly', targetDate: '2025-12-15', actualDate: '2025-12-10', status: 'Completed' },
      { id: 'm2', name: 'EV Charging Grid Testing', targetDate: '2026-06-30', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Smart_Parking_Contract.pdf', type: 'Contract', size: '6.1 MB', uploadDate: '2024-09-07' }
    ]
  },
  {
    id: '18',
    code: 'PPP-NH-003',
    name: 'Mercato Modern Logistics & Wholesaler Center',
    type: 'Non-Housing',
    subCategory: 'Logistics Hub',
    description: 'Multi-tiered logistics center with temperature-controlled warehouses, loading docks, and trader shops.',
    address: 'Mercato Sebategna',
    subCity: 'Addis Ketema',
    woreda: '05',
    siteArea: 85000,
    contractSigningDate: '2024-05-18',
    projectStartDate: '2024-07-01',
    projectEndDate: '2027-02-28',
    preliminaryBudget: 68000000000,
    status: 'Under Construction',
    completionPercentage: 58,
    housingUnits: null,
    commercialSpaces: 62000,
    parkingCapacity: 1200,
    developer: 'AFRICA LOGISTICS PARK PLC',
    authority: 'AACDA',
    spvName: 'Mercato Logistics PPP Ltd',
    financials: [
      { id: 'f1', date: '2024-05-18', type: 'Initial Budget', amount: 68000000000, description: 'Approved PPP budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Cold Storage Vault Installation', targetDate: '2025-10-31', actualDate: '2025-11-05', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Mercato_Logistics_PPP_Agreement.pdf', type: 'Contract', size: '11.8 MB', uploadDate: '2024-05-20' }
    ]
  },
  {
    id: '19',
    code: 'PPP-NH-004',
    name: 'Bole Lemi ICT & Innovation Tech Park',
    type: 'Non-Housing',
    subCategory: 'Technology Park',
    description: 'Special economic tech zone featuring incubator offices, data centers, solar farm, and auditoriums.',
    address: 'Bole Lemi Industrial Zone',
    subCity: 'Bole',
    woreda: '11',
    siteArea: 140000,
    contractSigningDate: '2023-12-01',
    projectStartDate: '2024-02-01',
    projectEndDate: '2026-07-31',
    preliminaryBudget: 92000000000,
    status: 'Operational',
    completionPercentage: 98,
    housingUnits: null,
    commercialSpaces: 95000,
    parkingCapacity: 3000,
    developer: 'ETHIO TELECOM & CHINESE TECH CONSORTIUM',
    authority: 'MInT',
    spvName: 'Bole Tech Hub SPV',
    financials: [
      { id: 'f1', date: '2023-12-01', type: 'Initial Budget', amount: 92000000000, description: 'ICT Concession Budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Tier III Data Center Commissioning', targetDate: '2025-05-01', actualDate: '2025-04-28', status: 'Completed' },
      { id: 'm2', name: 'Tech Incubator Grand Opening', targetDate: '2026-02-15', actualDate: '2026-02-12', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Tech_Park_Concession.pdf', type: 'Contract', size: '14.6 MB', uploadDate: '2023-12-05' }
    ]
  },
  {
    id: '20',
    code: 'PPP-NH-005',
    name: 'Meskel Square Underground Mall & Exhibition Complex',
    type: 'Non-Housing',
    subCategory: 'Commercial & Cultural Hub',
    description: 'Subterranean retail gallery, food court, and museum space under Meskel Square public arena.',
    address: 'Meskel Square',
    subCity: 'Kirkos',
    woreda: '01',
    siteArea: 55000,
    contractSigningDate: '2023-04-10',
    projectStartDate: '2023-06-01',
    projectEndDate: '2025-12-31',
    preliminaryBudget: 38000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: 32000,
    parkingCapacity: 1400,
    developer: 'CGCOC GROUP ETHIOPIA',
    authority: 'AABOC',
    spvName: 'Meskel Square Commercial SPV',
    financials: [
      { id: 'f1', date: '2023-04-10', type: 'Initial Budget', amount: 38000000000, description: 'Underground gallery contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Handover & Retail Opening', targetDate: '2025-12-31', actualDate: '2025-12-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Meskel_Square_Completion.pdf', type: 'Certificate', size: '5.4 MB', uploadDate: '2025-12-22' }
    ]
  },
  {
    id: '21',
    code: 'PPP-NH-006',
    name: 'Addis Ababa Central Bus Rapid Transit (BRT) Depot',
    type: 'Non-Housing',
    subCategory: 'Transit Infrastructure',
    description: 'Modern central bus depot, maintenance facility, and automated fare management headquarters.',
    address: 'Sarophtia Transit Hub',
    subCity: 'Nifas Silk-Lafto',
    woreda: '02',
    siteArea: 95000,
    contractSigningDate: '2025-02-15',
    projectStartDate: '2025-04-01',
    projectEndDate: '2027-10-31',
    preliminaryBudget: 53000000000,
    status: 'Under Construction',
    completionPercentage: 35,
    housingUnits: null,
    commercialSpaces: 8000,
    parkingCapacity: 650,
    developer: 'ANBESSA BUS & RENAULT CONSORTIUM',
    authority: 'AATMA',
    spvName: 'BRT Depot PPP Ltd',
    financials: [
      { id: 'f1', date: '2025-02-15', type: 'Initial Budget', amount: 53000000000, description: 'Depot concession project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Fleet Maintenance Bay Concrete Pouring', targetDate: '2025-11-30', actualDate: '2025-11-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'BRT_Depot_Agreement.pdf', type: 'Contract', size: '8.9 MB', uploadDate: '2025-02-18' }
    ]
  },
  {
    id: '22',
    code: 'PPP-NH-007',
    name: 'Piazza Cultural Heritage Arcade & Artisanal Market',
    type: 'Non-Housing',
    subCategory: 'Commercial & Cultural Hub',
    description: 'Restoration of historic Piazza market corridors into high-end retail arcades and coffee houses.',
    address: 'Churchill Avenue / Piazza',
    subCity: 'Arada',
    woreda: '01',
    siteArea: 28000,
    contractSigningDate: '2024-10-22',
    projectStartDate: '2024-12-01',
    projectEndDate: '2026-11-30',
    preliminaryBudget: 27000000000,
    status: 'Under Construction',
    completionPercentage: 62,
    housingUnits: null,
    commercialSpaces: 21000,
    parkingCapacity: 450,
    developer: 'VARNERO CONSTRUCTION PLC',
    authority: 'AABOC',
    spvName: 'Piazza Heritage Arcade SPV',
    financials: [
      { id: 'f1', date: '2024-10-22', type: 'Initial Budget', amount: 27000000000, description: 'Heritage arcade budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Historic Façade Preservation', targetDate: '2025-06-30', actualDate: '2025-06-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Piazza_Arcade_Contract.pdf', type: 'Contract', size: '7.8 MB', uploadDate: '2024-10-25' }
    ]
  },
  {
    id: '23',
    code: 'PPP-NH-008',
    name: 'Kality Eco-Industrial Park & Waste-to-Energy Plant',
    type: 'Non-Housing',
    subCategory: 'Green Energy Infrastructure',
    description: 'A 50MW waste-to-energy power station coupled with an industrial recycling park.',
    address: 'Kality Industrial Zone',
    subCity: 'Akaki Kality',
    woreda: '08',
    siteArea: 180000,
    contractSigningDate: '2024-04-12',
    projectStartDate: '2024-06-01',
    projectEndDate: '2027-05-31',
    preliminaryBudget: 145000000000,
    status: 'Under Construction',
    completionPercentage: 48,
    housingUnits: null,
    commercialSpaces: 12000,
    parkingCapacity: 500,
    developer: 'RAMBOLLE & CAMCE ENERGY CONSORTIUM',
    authority: 'EEU',
    spvName: 'Kality Waste Energy PPP Ltd',
    financials: [
      { id: 'f1', date: '2024-04-12', type: 'Initial Budget', amount: 145000000000, description: 'Energy PPP master contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Boiler & Turbine Foundations', targetDate: '2025-09-15', actualDate: '2025-09-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kality_Energy_PPP.pdf', type: 'Contract', size: '16.5 MB', uploadDate: '2024-04-15' }
    ]
  },
  {
    id: '24',
    code: 'PPP-NH-009',
    name: 'Entoto Eco-Tourism Resort & Cable Car Line',
    type: 'Non-Housing',
    subCategory: 'Tourism Infrastructure',
    description: '4.2 km scenic aerial cable car connecting Gullele to Entoto Park with boutique eco-lodges.',
    address: 'Entoto Park Ridge',
    subCity: 'Gullele',
    woreda: '01',
    siteArea: 110000,
    contractSigningDate: '2023-08-30',
    projectStartDate: '2023-10-15',
    projectEndDate: '2026-04-30',
    preliminaryBudget: 46000000000,
    status: 'Operational',
    completionPercentage: 95,
    housingUnits: null,
    commercialSpaces: 15000,
    parkingCapacity: 900,
    developer: 'DOPPELMAYR & KURIFTU RESORTS',
    authority: 'AABOC',
    spvName: 'Entoto Cable Car SPV',
    financials: [
      { id: 'f1', date: '2023-08-30', type: 'Initial Budget', amount: 46000000000, description: 'Tourism concession budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Cable Tower Erection (T1-T14)', targetDate: '2024-11-30', actualDate: '2024-11-25', status: 'Completed' },
      { id: 'm2', name: 'Commercial Operations Launch', targetDate: '2026-03-01', actualDate: '2026-02-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Entoto_Cable_Car_Concession.pdf', type: 'Contract', size: '9.3 MB', uploadDate: '2023-09-02' }
    ]
  },
  {
    id: '25',
    code: 'PPP-NH-010',
    name: 'Sarbet International Exhibition & Convention Center',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'State-of-the-art international convention center featuring 10 exhibition halls, 5-star hotel, and ballrooms.',
    address: 'Sarbet Ring Road',
    subCity: 'Nifas Silk-Lafto',
    woreda: '01',
    siteArea: 165000,
    contractSigningDate: '2025-03-20',
    projectStartDate: '2025-05-15',
    projectEndDate: '2028-11-30',
    preliminaryBudget: 135000000000,
    status: 'Signed',
    completionPercentage: 12,
    housingUnits: null,
    commercialSpaces: 110000,
    parkingCapacity: 3500,
    developer: 'SHERATON / MIDROC RETAIL PLC',
    authority: 'AACDA',
    spvName: 'Sarbet Convention Center PPP',
    financials: [
      { id: 'f1', date: '2025-03-20', type: 'Initial Budget', amount: 135000000000, description: 'Convention center PPP budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Master Site Clearance', targetDate: '2025-07-15', actualDate: '2025-07-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sarbet_Convention_Agreement.pdf', type: 'Contract', size: '13.1 MB', uploadDate: '2025-03-22' }
    ]
  },
  {
    id: '26',
    code: 'PPP-NH-011',
    name: 'Legehar Central Railway Station Transit Mall',
    type: 'Non-Housing',
    subCategory: 'Transit & Commercial',
    description: 'Transit-oriented development integrating historical Legehar station with retail concourses.',
    address: 'Legehar',
    subCity: 'Kirkos',
    woreda: '07',
    siteArea: 72000,
    contractSigningDate: '2024-07-19',
    projectStartDate: '2024-09-01',
    projectEndDate: '2027-03-31',
    preliminaryBudget: 74000000000,
    status: 'Under Construction',
    completionPercentage: 50,
    housingUnits: null,
    commercialSpaces: 58000,
    parkingCapacity: 1600,
    developer: 'EAGLE HILLS ETHIOPIA',
    authority: 'AACDA',
    spvName: 'Legehar Transit PPP SPV',
    financials: [
      { id: 'f1', date: '2024-07-19', type: 'Initial Budget', amount: 74000000000, description: 'TOD project contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Concourse Deck Concrete Pouring', targetDate: '2025-08-30', actualDate: '2025-09-05', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Legehar_TOD_Contract.pdf', type: 'Contract', size: '10.2 MB', uploadDate: '2024-07-22' }
    ]
  },
  {
    id: '27',
    code: 'PPP-NH-012',
    name: 'Gotera Logistics & Freight Terminal',
    type: 'Non-Housing',
    subCategory: 'Logistics Hub',
    description: 'Heavy vehicle freight terminal with automated container handling cranes and customs clearance offices.',
    address: 'Gotera Heavy Freight Lane',
    subCity: 'Kirkos',
    woreda: '05',
    siteArea: 105000,
    contractSigningDate: '2025-04-05',
    projectStartDate: '2025-06-01',
    projectEndDate: '2027-09-30',
    preliminaryBudget: 61000000000,
    status: 'Under Construction',
    completionPercentage: 24,
    housingUnits: null,
    commercialSpaces: 25000,
    parkingCapacity: 800,
    developer: 'ETHIO-DJIBOUTI RAILWAY & TRANSIT PLC',
    authority: 'ESLSE',
    spvName: 'Gotera Logistics PPP Co.',
    financials: [
      { id: 'f1', date: '2025-04-05', type: 'Initial Budget', amount: 61000000000, description: 'Freight terminal budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Perimeter Security & Customs Gate', targetDate: '2025-09-01', actualDate: '2025-08-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Gotera_Freight_Contract.pdf', type: 'Contract', size: '8.4 MB', uploadDate: '2025-04-08' }
    ]
  },
  {
    id: '28',
    code: 'PPP-NH-013',
    name: 'Gullele Botanical Garden Eco-Lodge & Spa',
    type: 'Non-Housing',
    subCategory: 'Tourism Infrastructure',
    description: 'Luxury eco-retreat inside Gullele Botanical Garden with organic restaurants and wellness pavilions.',
    address: 'Gullele Botanical Corridor',
    subCity: 'Gullele',
    woreda: '05',
    siteArea: 48000,
    contractSigningDate: '2025-05-30',
    projectStartDate: '2025-07-15',
    projectEndDate: '2027-04-30',
    preliminaryBudget: 23000000000,
    status: 'Signed',
    completionPercentage: 14,
    housingUnits: null,
    commercialSpaces: 12000,
    parkingCapacity: 300,
    developer: 'HAWASSA GREEN RESORTS PLC',
    authority: 'AABOC',
    spvName: 'Gullele Botanical Lodge SPV',
    financials: [
      { id: 'f1', date: '2025-05-30', type: 'Initial Budget', amount: 23000000000, description: 'Eco-lodge PPP agreement' }
    ],
    milestones: [
      { id: 'm1', name: 'Environmental Compliance Signoff', targetDate: '2025-07-01', actualDate: '2025-06-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Gullele_Lodge_PPP.pdf', type: 'Contract', size: '4.9 MB', uploadDate: '2025-06-01' }
    ]
  },
  {
    id: '29',
    code: 'PPP-NH-014',
    name: 'Arada Central Automated Parking Garage',
    type: 'Non-Housing',
    subCategory: 'Parking Infrastructure',
    description: 'Compact 8-floor mechanical parking silo servicing the congested Arada commercial district.',
    address: 'Arada Building Zone',
    subCity: 'Arada',
    woreda: '04',
    siteArea: 12000,
    contractSigningDate: '2024-11-15',
    projectStartDate: '2025-01-10',
    projectEndDate: '2026-06-30',
    preliminaryBudget: 14000000000,
    status: 'Under Construction',
    completionPercentage: 65,
    housingUnits: null,
    commercialSpaces: 2000,
    parkingCapacity: 1200,
    developer: 'PARK-TECH AFRICA PLC',
    authority: 'AATMA',
    spvName: 'Arada Parking SPV',
    financials: [
      { id: 'f1', date: '2024-11-15', type: 'Initial Budget', amount: 14000000000, description: 'Mechanical garage budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Steel Frame Superstructure Completion', targetDate: '2025-10-31', actualDate: '2025-10-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Arada_Parking_Contract.pdf', type: 'Contract', size: '5.2 MB', uploadDate: '2024-11-18' }
    ]
  },
  {
    id: '30',
    code: 'PPP-NH-015',
    name: 'Addis Smart Traffic Operations & Surveillance Center',
    type: 'Non-Housing',
    subCategory: 'Smart Infrastructure',
    description: 'Citywide AI traffic monitoring headquarters, license plate recognition grid, and central command control room.',
    address: 'Gotera Traffic Building',
    subCity: 'Kirkos',
    woreda: '06',
    siteArea: 22000,
    contractSigningDate: '2024-02-10',
    projectStartDate: '2024-04-01',
    projectEndDate: '2026-01-31',
    preliminaryBudget: 35000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: 6000,
    parkingCapacity: 200,
    developer: 'HUAWEI & ETHIO TELECOM PPP CONSORTIUM',
    authority: 'AATMA',
    spvName: 'Smart Traffic Addis SPV',
    financials: [
      { id: 'f1', date: '2024-02-10', type: 'Initial Budget', amount: 35000000000, description: 'Traffic command system project' }
    ],
    milestones: [
      { id: 'm1', name: 'Citywide Sensor Deployment (500 Junctions)', targetDate: '2025-08-31', actualDate: '2025-08-20', status: 'Completed' },
      { id: 'm2', name: 'Command Center Launch', targetDate: '2026-01-31', actualDate: '2026-01-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Smart_Traffic_Acceptance_Cert.pdf', type: 'Certificate', size: '3.1 MB', uploadDate: '2026-01-28' }
    ]
  },
  {
    id: '31',
    code: 'PPP-NH-016',
    name: 'Akaki Riverfront Promenade & Commercial Park',
    type: 'Non-Housing',
    subCategory: 'Commercial & Recreation',
    description: 'Urban riverfront revitalization featuring dining plazas, amphitheater, and boutique retail pods.',
    address: 'Akaki River Precinct',
    subCity: 'Akaki Kality',
    woreda: '03',
    siteArea: 140000,
    contractSigningDate: '2025-06-25',
    projectStartDate: '2025-08-15',
    projectEndDate: '2028-04-30',
    preliminaryBudget: 59000000000,
    status: 'Signed',
    completionPercentage: 6,
    housingUnits: null,
    commercialSpaces: 42000,
    parkingCapacity: 1100,
    developer: 'RIVERFRONT DEVELOPMENTS ETHIOPIA',
    authority: 'AACDA',
    spvName: 'Akaki Promenade SPV',
    financials: [
      { id: 'f1', date: '2025-06-25', type: 'Initial Budget', amount: 59000000000, description: 'Promenade project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Hydrological Barrier Testing', targetDate: '2025-09-30', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Akaki_Promenade_Agreement.pdf', type: 'Contract', size: '9.7 MB', uploadDate: '2025-06-27' }
    ]
  },
  {
    id: '32',
    code: 'PPP-NH-017',
    name: 'Bole Atlas Entertainment & Dining Galleria',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'Multi-screen cinema complex, international restaurant arcade, and bowling alley in prime Bole district.',
    address: 'Bole Atlas Road',
    subCity: 'Bole',
    woreda: '02',
    siteArea: 32000,
    contractSigningDate: '2024-01-20',
    projectStartDate: '2024-03-15',
    projectEndDate: '2026-09-30',
    preliminaryBudget: 38500000000,
    status: 'Under Construction',
    completionPercentage: 80,
    housingUnits: null,
    commercialSpaces: 29000,
    parkingCapacity: 950,
    developer: 'ATLAS COMMERCIAL HOLDINGS PLC',
    authority: 'AACDA',
    spvName: 'Bole Galleria PPP Ltd',
    financials: [
      { id: 'f1', date: '2024-01-20', type: 'Initial Budget', amount: 38500000000, description: 'Galleria concession budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Cinema Hall Acoustic Fit-out', targetDate: '2025-12-15', actualDate: '2025-12-12', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Galleria_Contract.pdf', type: 'Contract', size: '6.8 MB', uploadDate: '2024-01-22' }
    ]
  },
  {
    id: '33',
    code: 'PPP-NH-018',
    name: 'Sengatera Wholesale Gold & Jewelry Center',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'Secure, high-vault trading center specialized in precious metals, gold refining, and luxury jewelry retail.',
    address: 'Sengatera Banking Zone',
    subCity: 'Lideta',
    woreda: '02',
    siteArea: 24000,
    contractSigningDate: '2025-02-28',
    projectStartDate: '2025-04-15',
    projectEndDate: '2027-07-31',
    preliminaryBudget: 42500000000,
    status: 'Under Construction',
    completionPercentage: 26,
    housingUnits: null,
    commercialSpaces: 20000,
    parkingCapacity: 600,
    developer: 'ETHIOPIAN GEM & GOLD TRADING PLC',
    authority: 'NBE & AACDA',
    spvName: 'Sengatera Gold Vault SPV',
    financials: [
      { id: 'f1', date: '2025-02-28', type: 'Initial Budget', amount: 42500000000, description: 'Gold trading center budget' }
    ],
    milestones: [
      { id: 'm1', name: 'High-Security Underground Vault Pouring', targetDate: '2025-09-30', actualDate: '2025-09-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sengatera_Gold_Center_PPP.pdf', type: 'Contract', size: '8.1 MB', uploadDate: '2025-03-02' }
    ]
  },
  {
    id: '34',
    code: 'PPP-NH-019',
    name: 'Kotebe Health & Diagnostic Excellence Center',
    type: 'Non-Housing',
    subCategory: 'Healthcare Infrastructure',
    description: 'Specialized 300-bed PPP tertiary diagnostic hospital with MRI, Oncology, and Surgery suites.',
    address: 'Kotebe University Corridor',
    subCity: 'Yeka',
    woreda: '06',
    siteArea: 65000,
    contractSigningDate: '2024-08-01',
    projectStartDate: '2024-10-01',
    projectEndDate: '2027-03-31',
    preliminaryBudget: 78000000000,
    status: 'Under Construction',
    completionPercentage: 45,
    housingUnits: null,
    commercialSpaces: 35000,
    parkingCapacity: 750,
    developer: 'SILK ROAD HEALTHCARE GROUP',
    authority: 'AAHB',
    spvName: 'Kotebe Diagnostic Center SPV',
    financials: [
      { id: 'f1', date: '2024-08-01', type: 'Initial Budget', amount: 78000000000, description: 'Hospital PPP project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Radiology Vault Shielding Work', targetDate: '2025-07-31', actualDate: '2025-08-02', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kotebe_Health_PPP_Agreement.pdf', type: 'Contract', size: '12.0 MB', uploadDate: '2024-08-03' }
    ]
  },
  {
    id: '35',
    code: 'PPP-NH-020',
    name: 'Addis Ketema Multi-Modal Bus Terminal',
    type: 'Non-Housing',
    subCategory: 'Transit Infrastructure',
    description: 'Regional intercity bus terminal with integrated ticketing halls, waiting lounges, and hotel towers.',
    address: 'Autobis Tera',
    subCity: 'Addis Ketema',
    woreda: '01',
    siteArea: 115000,
    contractSigningDate: '2025-05-02',
    projectStartDate: '2025-07-01',
    projectEndDate: '2028-05-31',
    preliminaryBudget: 86000000000,
    status: 'Signed',
    completionPercentage: 11,
    housingUnits: null,
    commercialSpaces: 45000,
    parkingCapacity: 1500,
    developer: 'CROSS-COUNTRY TRANSPORT CONSORTIUM',
    authority: 'AATMA',
    spvName: 'Autobis Tera PPP SPV',
    financials: [
      { id: 'f1', date: '2025-05-02', type: 'Initial Budget', amount: 86000000000, description: 'Multi-modal terminal budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Temporary Bus Rerouting & Clearance', targetDate: '2025-07-15', actualDate: '2025-07-12', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Autobis_Tera_Contract.pdf', type: 'Contract', size: '10.9 MB', uploadDate: '2025-05-05' }
    ]
  },
  {
    id: '36',
    code: 'PPP-NH-021',
    name: 'Sarbet Green Sports & Aquatic Center',
    type: 'Non-Housing',
    subCategory: 'Sports Infrastructure',
    description: 'Olympic-size indoor swimming pool, tennis academies, and wellness center under a 25-year BOT model.',
    address: 'Old Airport Area',
    subCity: 'Nifas Silk-Lafto',
    woreda: '03',
    siteArea: 80000,
    contractSigningDate: '2023-10-10',
    projectStartDate: '2023-12-01',
    projectEndDate: '2026-05-31',
    preliminaryBudget: 32000000000,
    status: 'Operational',
    completionPercentage: 97,
    housingUnits: null,
    commercialSpaces: 14000,
    parkingCapacity: 700,
    developer: 'ETHIO-SPORTS ACADEMY PLC',
    authority: 'AACDA',
    spvName: 'Sarbet Sports SPV',
    financials: [
      { id: 'f1', date: '2023-10-10', type: 'Initial Budget', amount: 32000000000, description: 'Sports complex BOT contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Aquatic Center Filtration Testing', targetDate: '2025-11-30', actualDate: '2025-11-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sarbet_Sports_Contract.pdf', type: 'Contract', size: '6.4 MB', uploadDate: '2023-10-12' }
    ]
  },
  {
    id: '37',
    code: 'PPP-NH-022',
    name: 'Bole International Freight Handling Terminal 2',
    type: 'Non-Housing',
    subCategory: 'Logistics Hub',
    description: 'Air cargo terminal expansion with specialized pharmaceutical cold storage and automated sorters.',
    address: 'Bole International Airport Zone',
    subCity: 'Bole',
    woreda: '01',
    siteArea: 135000,
    contractSigningDate: '2024-12-18',
    projectStartDate: '2025-02-01',
    projectEndDate: '2027-11-30',
    preliminaryBudget: 115000000000,
    status: 'Under Construction',
    completionPercentage: 38,
    housingUnits: null,
    commercialSpaces: 50000,
    parkingCapacity: 1000,
    developer: 'ETHIOPIAN AIRLINES & SWISSPORT',
    authority: 'ECAA',
    spvName: 'Bole Cargo PPP SPV',
    financials: [
      { id: 'f1', date: '2024-12-18', type: 'Initial Budget', amount: 115000000000, description: 'Air cargo terminal contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Apron Concrete Reinforcement', targetDate: '2025-08-15', actualDate: '2025-08-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Cargo_Terminal_PPP.pdf', type: 'Contract', size: '14.1 MB', uploadDate: '2024-12-20' }
    ]
  },
  {
    id: '38',
    code: 'PPP-NH-023',
    name: 'Kirkos Media & Broadcasting Tower',
    type: 'Non-Housing',
    subCategory: 'Commercial & Telecom',
    description: '35-story media tower housing broadcasting studios, satellite teleport stations, and media office suites.',
    address: 'Meskel Flower Corridor',
    subCity: 'Kirkos',
    woreda: '03',
    siteArea: 38000,
    contractSigningDate: '2025-03-05',
    projectStartDate: '2025-05-01',
    projectEndDate: '2028-03-31',
    preliminaryBudget: 67000000000,
    status: 'Under Construction',
    completionPercentage: 18,
    housingUnits: null,
    commercialSpaces: 45000,
    parkingCapacity: 900,
    developer: 'EBC & KANA MEDIA CONSORTIUM',
    authority: 'MInT',
    spvName: 'Kirkos Media Tower SPV',
    financials: [
      { id: 'f1', date: '2025-03-05', type: 'Initial Budget', amount: 67000000000, description: 'Media tower project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Basement Piling Phase', targetDate: '2025-09-30', actualDate: '2025-10-02', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kirkos_Media_Contract.pdf', type: 'Contract', size: '7.9 MB', uploadDate: '2025-03-07' }
    ]
  },
  {
    id: '39',
    code: 'PPP-NH-024',
    name: 'Nifas Silk Eco-Solar Power Plant 30MW',
    type: 'Non-Housing',
    subCategory: 'Green Energy Infrastructure',
    description: 'Grid-connected 30MW solar PV plant generating clean energy for Nifas Silk industrial district.',
    address: 'Lafto Hills Sector',
    subCity: 'Nifas Silk-Lafto',
    woreda: '08',
    siteArea: 260000,
    contractSigningDate: '2024-06-20',
    projectStartDate: '2024-08-15',
    projectEndDate: '2026-04-30',
    preliminaryBudget: 41000000000,
    status: 'Under Construction',
    completionPercentage: 88,
    housingUnits: null,
    commercialSpaces: 1000,
    parkingCapacity: 100,
    developer: 'SCATEC SOLAR & ETHIO ENERGY',
    authority: 'EEU',
    spvName: 'Nifas Solar PPP SPV',
    financials: [
      { id: 'f1', date: '2024-06-20', type: 'Initial Budget', amount: 41000000000, description: 'Solar PPA project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'PV Panel Array Installation (Phase 1)', targetDate: '2025-07-31', actualDate: '2025-07-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Nifas_Solar_PPA_Contract.pdf', type: 'Contract', size: '9.8 MB', uploadDate: '2024-06-22' }
    ]
  },
  {
    id: '40',
    code: 'PPP-NH-025',
    name: 'Lideta Multi-Story Auto Trade Center',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'Automobile showroom complex, spare parts market, and multi-deck auto testing facility.',
    address: 'Geja Sefer Road',
    subCity: 'Lideta',
    woreda: '05',
    siteArea: 42000,
    contractSigningDate: '2025-07-10',
    projectStartDate: '2025-09-01',
    projectEndDate: '2028-01-31',
    preliminaryBudget: 49000000000,
    status: 'Procurement',
    completionPercentage: 4,
    housingUnits: null,
    commercialSpaces: 34000,
    parkingCapacity: 1100,
    developer: 'MOENCO & ETHIO AUTO PLC',
    authority: 'AACDA',
    spvName: 'Lideta Auto Trade SPV',
    financials: [
      { id: 'f1', date: '2025-07-10', type: 'Initial Budget', amount: 49000000000, description: 'Auto trade center budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Public Tender Selection', targetDate: '2025-06-30', actualDate: '2025-06-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Lideta_Auto_Tender_Notice.pdf', type: 'Tender Document', size: '3.8 MB', uploadDate: '2025-05-10' }
    ]
  },
  {
    id: '41',
    code: 'PPP-NH-026',
    name: 'Gullele Environmental Education Center & Planetarium',
    type: 'Non-Housing',
    subCategory: 'Commercial & Cultural Hub',
    description: 'Interactive science museum, digital dome planetarium, and eco-botany laboratory.',
    address: 'Entoto Science Park',
    subCity: 'Gullele',
    woreda: '04',
    siteArea: 35000,
    contractSigningDate: '2023-07-14',
    projectStartDate: '2023-09-01',
    projectEndDate: '2025-11-30',
    preliminaryBudget: 29000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: 12000,
    parkingCapacity: 350,
    developer: 'ETHIOPIAN SPACE SCIENCE SOCIETY & CONST.',
    authority: 'MInT',
    spvName: 'Gullele Planetarium SPV',
    financials: [
      { id: 'f1', date: '2023-07-14', type: 'Initial Budget', amount: 29000000000, description: 'Planetarium contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Planetarium Projection Dome Calibration', targetDate: '2025-10-31', actualDate: '2025-10-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Planetarium_Handover_Cert.pdf', type: 'Certificate', size: '2.9 MB', uploadDate: '2025-11-28' }
    ]
  },
  {
    id: '42',
    code: 'PPP-NH-027',
    name: 'CMC Technology & Data Center Campus',
    type: 'Non-Housing',
    subCategory: 'Technology Park',
    description: 'High-security green data center campus servicing banking, fintech, and cloud providers.',
    address: 'CMC Michael Sector',
    subCity: 'Yeka',
    woreda: '11',
    siteArea: 52000,
    contractSigningDate: '2024-11-01',
    projectStartDate: '2025-01-05',
    projectEndDate: '2026-12-31',
    preliminaryBudget: 71000000000,
    status: 'Under Construction',
    completionPercentage: 54,
    housingUnits: null,
    commercialSpaces: 40000,
    parkingCapacity: 600,
    developer: 'RAXIO DATA CENTERS & INSA',
    authority: 'MInT',
    spvName: 'CMC Data Park SPV',
    financials: [
      { id: 'f1', date: '2024-11-01', type: 'Initial Budget', amount: 71000000000, description: 'Data center project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Backup Generator Grid Installation', targetDate: '2025-11-15', actualDate: '2025-11-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'CMC_Data_Center_PPP.pdf', type: 'Contract', size: '11.3 MB', uploadDate: '2024-11-03' }
    ]
  },
  {
    id: '43',
    code: 'PPP-NH-028',
    name: 'Akaki Cold Storage Agricultural Hub',
    type: 'Non-Housing',
    subCategory: 'Logistics Hub',
    description: 'Post-harvest agricultural cold room network supporting flower and vegetable exports.',
    address: 'Kality Freight Corridor',
    subCity: 'Akaki Kality',
    woreda: '02',
    siteArea: 90000,
    contractSigningDate: '2025-01-25',
    projectStartDate: '2025-03-15',
    projectEndDate: '2027-06-30',
    preliminaryBudget: 52000000000,
    status: 'Under Construction',
    completionPercentage: 32,
    housingUnits: null,
    commercialSpaces: 38000,
    parkingCapacity: 450,
    developer: 'EHPEA & AP MOLER MAERSK',
    authority: 'MoA',
    spvName: 'Akaki Cold Chain PPP',
    financials: [
      { id: 'f1', date: '2025-01-25', type: 'Initial Budget', amount: 52000000000, description: 'Cold chain hub budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Refrigerated Warehouse Shell', targetDate: '2025-09-15', actualDate: '2025-09-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Akaki_Cold_Chain_Contract.pdf', type: 'Contract', size: '8.7 MB', uploadDate: '2025-01-28' }
    ]
  },
  {
    id: '44',
    code: 'PPP-NH-029',
    name: 'Arada Heritage Boutique Hotel & Gallery',
    type: 'Non-Housing',
    subCategory: 'Tourism Infrastructure',
    description: 'Conversion of historic municipality annex into a 5-star heritage boutique hotel.',
    address: 'Arada Sub-City Hall Square',
    subCity: 'Arada',
    woreda: '02',
    siteArea: 19000,
    contractSigningDate: '2024-05-05',
    projectStartDate: '2024-07-01',
    projectEndDate: '2026-08-31',
    preliminaryBudget: 31000000000,
    status: 'Under Construction',
    completionPercentage: 76,
    housingUnits: null,
    commercialSpaces: 16000,
    parkingCapacity: 250,
    developer: 'HYATT REGENCY CONSORTIUM',
    authority: 'AABOC',
    spvName: 'Arada Heritage Hotel SPV',
    financials: [
      { id: 'f1', date: '2024-05-05', type: 'Initial Budget', amount: 31000000000, description: 'Boutique hotel contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Interior Atrium Refurbishment', targetDate: '2025-10-31', actualDate: '2025-10-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Arada_Hotel_PPP_Contract.pdf', type: 'Contract', size: '6.2 MB', uploadDate: '2024-05-08' }
    ]
  },
  {
    id: '45',
    code: 'PPP-NH-030',
    name: 'Addis Smart Lighting & Fiber Grid Project',
    type: 'Non-Housing',
    subCategory: 'Smart Infrastructure',
    description: 'Replacing 85,000 streetlights with solar smart LEDs integrated with citywide public Wi-Fi.',
    address: 'Citywide Arterial Roads',
    subCity: 'Kirkos',
    woreda: '01',
    siteArea: 500000,
    contractSigningDate: '2023-11-12',
    projectStartDate: '2024-01-05',
    projectEndDate: '2025-12-31',
    preliminaryBudget: 44000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'PHILIPS LIGHTING & ZTE ETHIOPIA',
    authority: 'AACDA',
    spvName: 'Addis Smart Light SPV',
    financials: [
      { id: 'f1', date: '2023-11-12', type: 'Initial Budget', amount: 44000000000, description: 'Smart lighting PPP contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Final Acceptance Certificate', targetDate: '2025-12-31', actualDate: '2025-12-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Smart_Lighting_Cert.pdf', type: 'Certificate', size: '3.7 MB', uploadDate: '2026-01-05' }
    ]
  },
  {
    id: '46',
    code: 'PPP-NH-031',
    name: 'Bole Sub-City General Hospital PPP Extension',
    type: 'Non-Housing',
    subCategory: 'Healthcare Infrastructure',
    description: 'New 250-bed specialized pediatric and maternal healthcare wing under long-term operational PPP.',
    address: 'Bole Rwanda Street',
    subCity: 'Bole',
    woreda: '05',
    siteArea: 40000,
    contractSigningDate: '2025-04-14',
    projectStartDate: '2025-06-01',
    projectEndDate: '2028-02-28',
    preliminaryBudget: 63000000000,
    status: 'Under Construction',
    completionPercentage: 21,
    housingUnits: null,
    commercialSpaces: 22000,
    parkingCapacity: 500,
    developer: 'LANDMARK HOSPITAL GROUP',
    authority: 'AAHB',
    spvName: 'Bole Health Extension SPV',
    financials: [
      { id: 'f1', date: '2025-04-14', type: 'Initial Budget', amount: 63000000000, description: 'Hospital wing budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Structural Base Concreting', targetDate: '2025-09-15', actualDate: '2025-09-12', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Hospital_PPP.pdf', type: 'Contract', size: '9.1 MB', uploadDate: '2025-04-16' }
    ]
  },
  {
    id: '47',
    code: 'PPP-NH-032',
    name: 'Sengatera Financial District Underground Parking B3',
    type: 'Non-Housing',
    subCategory: 'Parking Infrastructure',
    description: 'Deep subterranean multi-level parking facility serving bank headquarters in Sengatera.',
    address: 'Sengatera Bank Avenue',
    subCity: 'Lideta',
    woreda: '01',
    siteArea: 20000,
    contractSigningDate: '2024-09-28',
    projectStartDate: '2024-11-15',
    projectEndDate: '2026-10-31',
    preliminaryBudget: 22500000000,
    status: 'Under Construction',
    completionPercentage: 58,
    housingUnits: null,
    commercialSpaces: 3000,
    parkingCapacity: 1500,
    developer: 'CBE & AWASH BANK CONSORTIUM',
    authority: 'AATMA',
    spvName: 'Sengatera Park SPV',
    financials: [
      { id: 'f1', date: '2024-09-28', type: 'Initial Budget', amount: 22500000000, description: 'Bank parking contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Slab Pouring Level -2', targetDate: '2025-08-30', actualDate: '2025-08-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sengatera_Parking_Contract.pdf', type: 'Contract', size: '5.7 MB', uploadDate: '2024-09-30' }
    ]
  },
  {
    id: '48',
    code: 'PPP-NH-033',
    name: 'Kotebe Eco-Park & Family Entertainment Hub',
    type: 'Non-Housing',
    subCategory: 'Commercial & Recreation',
    description: 'Family amusement park, botanical walk, outdoor sports courts, and organic food hall.',
    address: 'Kotebe Hillside',
    subCity: 'Yeka',
    woreda: '08',
    siteArea: 95000,
    contractSigningDate: '2025-02-12',
    projectStartDate: '2025-04-01',
    projectEndDate: '2027-05-31',
    preliminaryBudget: 34000000000,
    status: 'Under Construction',
    completionPercentage: 29,
    housingUnits: null,
    commercialSpaces: 18000,
    parkingCapacity: 650,
    developer: 'PARADISE PARKS ETHIOPIA',
    authority: 'AABOC',
    spvName: 'Kotebe Eco Park SPV',
    financials: [
      { id: 'f1', date: '2025-02-12', type: 'Initial Budget', amount: 34000000000, description: 'Eco-park contract budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Landscaping & Tree Plantation', targetDate: '2025-07-31', actualDate: '2025-07-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kotebe_Park_Agreement.pdf', type: 'Contract', size: '6.5 MB', uploadDate: '2025-02-15' }
    ]
  },
  {
    id: '49',
    code: 'PPP-NH-034',
    name: 'Addis Ketema Textile Trade & Wholesale Arcade',
    type: 'Non-Housing',
    subCategory: 'Commercial Complex',
    description: 'Modern 6-story wholesale market dedicated to traditional and modern Ethiopian textiles.',
    address: 'Teklehaimanot Square',
    subCity: 'Addis Ketema',
    woreda: '03',
    siteArea: 38000,
    contractSigningDate: '2024-03-18',
    projectStartDate: '2024-05-01',
    projectEndDate: '2026-07-31',
    preliminaryBudget: 41500000000,
    status: 'Under Construction',
    completionPercentage: 78,
    housingUnits: null,
    commercialSpaces: 32000,
    parkingCapacity: 700,
    developer: 'ETHIO-TEXTILE TRADERS ASSOCIATION',
    authority: 'AACDA',
    spvName: 'Textile Arcade PPP SPV',
    financials: [
      { id: 'f1', date: '2024-03-18', type: 'Initial Budget', amount: 41500000000, description: 'Textile arcade budget' }
    ],
    milestones: [
      { id: 'm1', name: 'HVAC & Fire Safety System Installation', targetDate: '2025-12-15', actualDate: '2025-12-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Textile_Arcade_Contract.pdf', type: 'Contract', size: '7.4 MB', uploadDate: '2024-03-20' }
    ]
  },
  {
    id: '50',
    code: 'PPP-NH-035',
    name: 'Gotera Freight Rail Terminal Logistics Plaza',
    type: 'Non-Housing',
    subCategory: 'Logistics Hub',
    description: 'Intermodal rail-to-truck transfer depot with automated weighbridges and bonded warehouses.',
    address: 'Gotera Rail Junction',
    subCity: 'Kirkos',
    woreda: '09',
    siteArea: 110000,
    contractSigningDate: '2025-06-12',
    projectStartDate: '2025-08-01',
    projectEndDate: '2028-04-30',
    preliminaryBudget: 79000000000,
    status: 'Signed',
    completionPercentage: 9,
    housingUnits: null,
    commercialSpaces: 35000,
    parkingCapacity: 900,
    developer: 'ETHIO-DJIBOUTI RAILWAY & LOGISTICS SPV',
    authority: 'ESLSE',
    spvName: 'Gotera Rail Hub SPV',
    financials: [
      { id: 'f1', date: '2025-06-12', type: 'Initial Budget', amount: 79000000000, description: 'Rail hub contract budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Rail Spur Track Layout Design', targetDate: '2025-08-31', actualDate: '2025-08-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Gotera_Rail_Hub_Contract.pdf', type: 'Contract', size: '10.5 MB', uploadDate: '2025-06-15' }
    ]
  },
  {
    id: '51',
    code: 'PPP-NH-036',
    name: 'Mercato Public Sanitary & Hygiene Stations (Phase 1-5)',
    type: 'Non-Housing',
    subCategory: 'Sanitation Infrastructure',
    description: 'Network of 20 modern, eco-friendly public sanitation complexes with solar water and recycling.',
    address: 'Mercato Commercial Zone',
    subCity: 'Addis Ketema',
    woreda: '04',
    siteArea: 15000,
    contractSigningDate: '2024-01-15',
    projectStartDate: '2024-03-01',
    projectEndDate: '2025-09-30',
    preliminaryBudget: 8500000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: 2000,
    parkingCapacity: 100,
    developer: 'CLEAN ADDIS WATER & SANITATION PLC',
    authority: 'AAWSA',
    spvName: 'Clean Mercato SPV',
    financials: [
      { id: 'f1', date: '2024-01-15', type: 'Initial Budget', amount: 8500000000, description: 'Sanitation stations budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Station Network Handover', targetDate: '2025-09-30', actualDate: '2025-09-20', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sanitation_Handover_Cert.pdf', type: 'Certificate', size: '2.1 MB', uploadDate: '2025-10-01' }
    ]
  },
  {
    id: '52',
    code: 'PPP-NH-037',
    name: 'Entoto Observatory & Tourism Visitor Pavilion',
    type: 'Non-Housing',
    subCategory: 'Tourism Infrastructure',
    description: 'Astronomical observatory viewing deck, souvenir market, and VIP visitor reception center.',
    address: 'Entoto Peak',
    subCity: 'Gullele',
    woreda: '01',
    siteArea: 25000,
    contractSigningDate: '2024-07-08',
    projectStartDate: '2024-09-01',
    projectEndDate: '2026-05-31',
    preliminaryBudget: 19500000000,
    status: 'Under Construction',
    completionPercentage: 82,
    housingUnits: null,
    commercialSpaces: 8000,
    parkingCapacity: 200,
    developer: 'ASTRO-TOURISM ETHIOPIA PLC',
    authority: 'AABOC',
    spvName: 'Entoto Visitor Pavilion SPV',
    financials: [
      { id: 'f1', date: '2024-07-08', type: 'Initial Budget', amount: 19500000000, description: 'Observatory pavilion budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Telescope Dome Installation', targetDate: '2025-11-30', actualDate: '2025-11-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Entoto_Pavilion_Contract.pdf', type: 'Contract', size: '4.8 MB', uploadDate: '2024-07-10' }
    ]
  },
  {
    id: '53',
    code: 'PPP-NH-038',
    name: 'Bole Airport Road Commercial Pedestrian Overpasses',
    type: 'Non-Housing',
    subCategory: 'Transit & Infrastructure',
    description: 'Skywalk network featuring enclosed elevated walkways with digital advertising and retail kiosks.',
    address: 'Bole Road Corridor',
    subCity: 'Bole',
    woreda: '04',
    siteArea: 18000,
    contractSigningDate: '2025-02-01',
    projectStartDate: '2025-03-15',
    projectEndDate: '2026-11-30',
    preliminaryBudget: 16000000000,
    status: 'Under Construction',
    completionPercentage: 40,
    housingUnits: null,
    commercialSpaces: 5000,
    parkingCapacity: null,
    developer: 'OUTDOOR MEDIA ETHIOPIA PLC',
    authority: 'AACDA',
    spvName: 'Bole Skywalk SPV',
    financials: [
      { id: 'f1', date: '2025-02-01', type: 'Initial Budget', amount: 16000000000, description: 'Skywalk contract budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Steel Span Erection across Bole Road', targetDate: '2025-08-31', actualDate: '2025-08-28', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Skywalk_PPP_Contract.pdf', type: 'Contract', size: '4.1 MB', uploadDate: '2025-02-03' }
    ]
  },
  {
    id: '54',
    code: 'PPP-NH-039',
    name: 'Akaki Kaliti Heavy Machinery Assembly & Trade Hub',
    type: 'Non-Housing',
    subCategory: 'Industrial Hub',
    description: 'Equipment showroom, assembly bays, and spare parts logistics depot for construction machinery.',
    address: 'Kaliti Ring Road Sector',
    subCity: 'Akaki Kality',
    woreda: '07',
    siteArea: 130000,
    contractSigningDate: '2024-10-10',
    projectStartDate: '2024-12-01',
    projectEndDate: '2027-08-31',
    preliminaryBudget: 72000000000,
    status: 'Under Construction',
    completionPercentage: 44,
    housingUnits: null,
    commercialSpaces: 55000,
    parkingCapacity: 600,
    developer: 'SANY ETHIOPIA & RIES ENGINEERING',
    authority: 'AACDA',
    spvName: 'Kaliti Machinery Hub SPV',
    financials: [
      { id: 'f1', date: '2024-10-10', type: 'Initial Budget', amount: 72000000000, description: 'Machinery hub budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Assembly Bay High-Bay Gantry Cranes', targetDate: '2025-09-30', actualDate: '2025-09-25', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kaliti_Machinery_Agreement.pdf', type: 'Contract', size: '9.4 MB', uploadDate: '2024-10-12' }
    ]
  },
  {
    id: '55',
    code: 'PPP-NH-040',
    name: 'Sarbet Urban Park & Subterranean Shopping Promenade',
    type: 'Non-Housing',
    subCategory: 'Commercial & Recreation',
    description: 'Integrated green city park above a 2-level luxury shopping mall and food hall.',
    address: 'Sarbet Square',
    subCity: 'Nifas Silk-Lafto',
    woreda: '04',
    siteArea: 65000,
    contractSigningDate: '2025-05-18',
    projectStartDate: '2025-07-01',
    projectEndDate: '2028-06-30',
    preliminaryBudget: 64000000000,
    status: 'Signed',
    completionPercentage: 7,
    housingUnits: null,
    commercialSpaces: 48000,
    parkingCapacity: 1300,
    developer: 'GIFT REAL ESTATE & RETAIL PLC',
    authority: 'AACDA',
    spvName: 'Sarbet Park Promenade SPV',
    financials: [
      { id: 'f1', date: '2025-05-18', type: 'Initial Budget', amount: 64000000000, description: 'Park promenade project budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Ground Mobilization', targetDate: '2025-07-15', actualDate: '2025-07-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Sarbet_Promenade_PPP.pdf', type: 'Contract', size: '8.3 MB', uploadDate: '2025-05-20' }
    ]
  },
  {
    id: '56',
    code: 'PPP-NH-041',
    name: 'Addis Ketema Modern Abattoir & Cold Storage PPP',
    type: 'Non-Housing',
    subCategory: 'Agriculture & Food Processing',
    description: 'HACCP-compliant automated meat processing plant with biogas generation and cold trucks.',
    address: 'Kera Corridor',
    subCity: 'Kirkos',
    woreda: '10',
    siteArea: 70000,
    contractSigningDate: '2024-04-30',
    projectStartDate: '2024-06-15',
    projectEndDate: '2026-12-31',
    preliminaryBudget: 37000000000,
    status: 'Under Construction',
    completionPercentage: 70,
    housingUnits: null,
    commercialSpaces: 20000,
    parkingCapacity: 300,
    developer: 'ELFORA AGRO-INDUSTRIES PLC',
    authority: 'MoA',
    spvName: 'Kera Abattoir PPP SPV',
    financials: [
      { id: 'f1', date: '2024-04-30', type: 'Initial Budget', amount: 37000000000, description: 'Abattoir PPP contract' }
    ],
    milestones: [
      { id: 'm1', name: 'Biogas Digester Tank Construction', targetDate: '2025-08-15', actualDate: '2025-08-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kera_Abattoir_Contract.pdf', type: 'Contract', size: '6.9 MB', uploadDate: '2024-05-02' }
    ]
  },
  {
    id: '57',
    code: 'PPP-NH-042',
    name: 'Kazanchis Executive Hotel & Conference Center',
    type: 'Non-Housing',
    subCategory: 'Tourism & Commercial',
    description: '28-story 4-star executive business hotel with ballroom, sky-lounge, and underground parking.',
    address: 'Kazanchis Guinea Conakry Street',
    subCity: 'Kirkos',
    woreda: '08',
    siteArea: 30000,
    contractSigningDate: '2023-10-25',
    projectStartDate: '2023-12-10',
    projectEndDate: '2026-03-31',
    preliminaryBudget: 56000000000,
    status: 'Operational',
    completionPercentage: 100,
    housingUnits: null,
    commercialSpaces: 35000,
    parkingCapacity: 800,
    developer: 'RADISSON BLU ETHIOPIA PLC',
    authority: 'AABOC',
    spvName: 'Kazanchis Hotel SPV',
    financials: [
      { id: 'f1', date: '2023-10-25', type: 'Initial Budget', amount: 56000000000, description: 'Hotel contract budget' }
    ],
    milestones: [
      { id: 'm1', name: 'Soft Opening & VIP Acceptance', targetDate: '2026-03-15', actualDate: '2026-03-10', status: 'Completed' }
    ],
    documents: [
      { id: 'd1', name: 'Kazanchis_Hotel_Cert.pdf', type: 'Certificate', size: '4.3 MB', uploadDate: '2026-03-12' }
    ]
  },
  {
    id: '58',
    code: 'PPP-NH-043',
    name: 'Bole Lemi Eco-Solar Substation 20MW',
    type: 'Non-Housing',
    subCategory: 'Green Energy Infrastructure',
    description: 'Dedicated solar substation providing uninterrupted power to Bole Lemi industrial park exporters.',
    address: 'Bole Lemi Phase 2',
    subCity: 'Bole',
    woreda: '12',
    siteArea: 150000,
    contractSigningDate: '2025-07-20',
    projectStartDate: '2025-09-01',
    projectEndDate: '2027-03-31',
    preliminaryBudget: 28000000000,
    status: 'Feasibility',
    completionPercentage: 0,
    housingUnits: null,
    commercialSpaces: null,
    parkingCapacity: null,
    developer: 'POWERCHINA & EEU CONSORTIUM',
    authority: 'EEU',
    spvName: 'Bole Solar Substation SPV',
    financials: [
      { id: 'f1', date: '2025-07-20', type: 'Initial Budget', amount: 28000000000, description: 'Proposed solar project outlay' }
    ],
    milestones: [
      { id: 'm1', name: 'Grid Interconnection Feasibility Study', targetDate: '2025-10-31', actualDate: null, status: 'In Progress' }
    ],
    documents: [
      { id: 'd1', name: 'Bole_Solar_Feasibility.pdf', type: 'Feasibility Study', size: '7.5 MB', uploadDate: '2025-07-22' }
    ]
  }
];
