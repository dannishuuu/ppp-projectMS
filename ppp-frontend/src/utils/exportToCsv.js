/**
 * Utility to download an array of project objects as a CSV file
 */
export const downloadProjectsCSV = (projects, filename = 'PPP_Projects_Report.csv') => {
  if (!projects || projects.length === 0) return;

  const headers = [
    'Project Code',
    'Project Name',
    'Type',
    'Sub-Category',
    'Developer',
    'Authority',
    'Address',
    'Sub-City',
    'Status',
    'Budget (ETB)',
    'Completion %',
    'Housing Units',
    'Commercial Spaces',
    'Parking Capacity',
    'Contract Signing Date',
    'Project Start Date',
    'Project End Date'
  ];

  const rows = projects.map(p => [
    `"${p.code || ''}"`,
    `"${(p.name || '').replace(/"/g, '""')}"`,
    `"${p.type || ''}"`,
    `"${p.subCategory || 'N/A'}"`,
    `"${(p.developer || '').replace(/"/g, '""')}"`,
    `"${(p.authority || '').replace(/"/g, '""')}"`,
    `"${(p.address || '').replace(/"/g, '""')}"`,
    `"${p.subCity || ''}"`,
    `"${p.status || ''}"`,
    p.preliminaryBudget || 0,
    p.completionPercentage || 0,
    p.housingUnits || 0,
    p.commercialSpaces || 0,
    p.parkingCapacity || 0,
    p.contractSigningDate || '',
    p.projectStartDate || '',
    p.projectEndDate || ''
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
