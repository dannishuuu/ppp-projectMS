import React, { useState, useRef, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
  ButtonGroup,
  Chip,
} from '@mui/material';
import {
  Print as PrintIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  RestartAlt as ResetZoomIcon,
  Close as CloseIcon,
  AccountTree as TreeIcon,
  Business as BusinessIcon,
} from '@mui/icons-material';

/**
 * Color scheme matching reference image:
 * - Level 1 (CMD / CEO / Top Roots): Teal (#2ea89d)
 * - Level 2 (Executives / Chiefs / Divisions): Dark Charcoal / Slate (#313943)
 * - Level 3+ (Department Heads, Doctors, Managers, Staff): Teal (#38a89d)
 * - Connector lines: Dark Charcoal (#334155)
 */
const STYLES = {
  connectorColor: '#334155',
  rootBg: '#2ea89d',
  rootBorder: '#258b81',
  execBg: '#313943',
  execBorder: '#232a32',
  subBg: '#38a89d',
  subBorder: '#2a8b80',
};

// Recursive helper to split root chain (e.g. CMD -> CEO) from horizontal branches
function analyzeTree(roots) {
  if (!roots || roots.length === 0) return { rootChain: [], branchNodes: [] };

  // If there's 1 root
  if (roots.length === 1) {
    const root = roots[0];
    const chain = [root];
    let current = root;

    // If root has exactly 1 child, and that child has children or represents the executive level
    while (current.children && current.children.length === 1 && current.children[0].children && current.children[0].children.length > 0) {
      current = current.children[0];
      chain.push(current);
    }

    const branches = current.children || [];
    return { rootChain: chain, branchNodes: branches };
  }

  // If multiple roots, roots themselves form branches
  return { rootChain: [], branchNodes: roots };
}

export const OrgChartPrintModal = ({ open, onClose, company, treeData, allUnits = [] }) => {
  const [zoom, setZoom] = useState(1);
  const chartContainerRef = useRef(null);

  const { rootChain, branchNodes } = useMemo(() => {
    return analyzeTree(treeData?.roots || []);
  }, [treeData]);

  const handleZoomIn = () => setZoom((z) => Math.min(Number((z + 0.15).toFixed(2)), 1.8));
  const handleZoomOut = () => setZoom((z) => Math.max(Number((z - 0.15).toFixed(2)), 0.4));
  const handleZoomReset = () => setZoom(1);

  // Generate printable HTML document
  const generatePrintHtml = () => {
    const chartHtml = chartContainerRef.current ? chartContainerRef.current.innerHTML : '';
    const companyName = company?.name || treeData?.company?.name || 'Company';
    const totalUnits = allUnits.length || 0;
    const printDate = new Date().toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Organization Chart - ${companyName}</title>
  <style>
    @page {
      size: landscape;
      margin: 8mm 10mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    body {
      margin: 0;
      padding: 16px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background: #ffffff;
      color: #0f172a;
    }
    .print-header {
      text-align: center;
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 2px solid #e2e8f0;
    }
    .print-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.01em;
      margin: 0;
      text-transform: uppercase;
    }
    .print-subtitle {
      font-size: 12px;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
      letter-spacing: 0.05em;
    }
    .print-meta {
      font-size: 11px;
      color: #94a3b8;
      margin-top: 3px;
    }
    .org-chart-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100%;
      overflow: visible;
    }

    /* Org Chart Node Styling */
    .org-card {
      min-width: 135px;
      max-width: 175px;
      padding: 8px 10px;
      border-radius: 3px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      box-sizing: border-box;
      box-shadow: 0 1px 3px rgba(0,0,0,0.12);
      break-inside: avoid;
    }
    .org-card.root-card {
      background-color: ${STYLES.rootBg} !important;
      border: 1.5px solid ${STYLES.rootBorder} !important;
      color: #ffffff !important;
      min-height: 48px;
    }
    .org-card.exec-card {
      background-color: ${STYLES.execBg} !important;
      border: 1.5px solid ${STYLES.execBorder} !important;
      color: #ffffff !important;
      min-height: 52px;
    }
    .org-card.sub-card {
      background-color: ${STYLES.subBg} !important;
      border: 1.5px solid ${STYLES.subBorder} !important;
      color: #ffffff !important;
      min-height: 44px;
    }
    .card-title {
      font-size: 11px;
      font-weight: 800;
      line-height: 1.25;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      word-break: break-word;
    }
    .card-sub {
      font-size: 9.5px;
      font-weight: 600;
      opacity: 0.88;
      margin-top: 3px;
      text-transform: none;
    }

    /* Connectors */
    .v-stem {
      width: 2px;
      height: 20px;
      background-color: ${STYLES.connectorColor};
      margin: 0 auto;
    }
    .branch-row {
      display: flex;
      justify-content: center;
      align-items: flex-start;
      gap: 16px;
      position: relative;
    }
    .branch-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding-top: 20px;
      min-width: 140px;
      max-width: 185px;
    }
    /* Vertical drop line into Level 2 */
    .branch-col::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      width: 2px;
      height: 20px;
      background-color: ${STYLES.connectorColor};
      transform: translateX(-50%);
    }
    /* Horizontal distribution bus */
    .branch-col::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background-color: ${STYLES.connectorColor};
    }
    .branch-col:first-of-type::after {
      left: 50%;
    }
    .branch-col:last-of-type::after {
      right: 50%;
    }
    .branch-col:only-of-type::after {
      display: none;
    }

    /* Subtree in column */
    .col-subbranch {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    .sub-centered {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }
    /* Elbow branch for lower levels / staff */
    .elbow-tree {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      position: relative;
      padding-left: 20px;
      margin-top: 14px;
      width: 100%;
    }
    .elbow-tree::before {
      content: '';
      position: absolute;
      top: -14px;
      bottom: 24px;
      left: 10px;
      width: 2px;
      background-color: ${STYLES.connectorColor};
    }
    .elbow-row {
      position: relative;
      margin-bottom: 12px;
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }
    .elbow-row:last-child {
      margin-bottom: 0;
    }
    .elbow-row::before {
      content: '';
      position: absolute;
      top: 22px;
      left: -10px;
      width: 10px;
      height: 2px;
      background-color: ${STYLES.connectorColor};
    }
  </style>
</head>
<body>
  <div class="print-header">
    <h1 class="print-title">${companyName}</h1>
    <div class="print-subtitle">Organizational Hierarchy Structure</div>
    <div class="print-meta">Total Organization Units: ${totalUnits} &nbsp;|&nbsp; Printed: ${printDate}</div>
  </div>
  <div class="org-chart-wrap">
    ${chartHtml}
  </div>
</body>
</html>`;
  };

  const handlePrint = () => {
    const html = generatePrintHtml();
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    iframe.contentDocument.open();
    iframe.contentDocument.write(html);
    iframe.contentDocument.close();

    // Give browser brief tick to parse CSS and fonts before printing
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1500);
    }, 250);
  };

  /**
   * Render subordinates recursively within a column:
   * Direct children (Level 3) & intermediate levels stay centered.
   * Leaves or deeper nodes indent with an elbow connector (as shown in the reference image).
   */
  const renderColumnSubtree = (node, depthInCol = 1) => {
    if (!node.children || node.children.length === 0) return null;

    const children = node.children;
    const isSingleChild = children.length === 1;
    const child = children[0];

    // If 1 child and it has its own children (like Departmental Heads -> Doctors -> Nursing Staff),
    // keep it centered vertically with a straight vertical line.
    if (isSingleChild && child.children && child.children.length > 0) {
      return (
        <Box className="sub-centered" sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Box className="v-stem" sx={{ width: 2, height: 18, bgcolor: STYLES.connectorColor, my: 0 }} />
          <Box className="org-card sub-card" sx={cardSx(STYLES.subBg, STYLES.subBorder)}>
            <Typography className="card-title" sx={titleSx}>{child.name}</Typography>
            {child.manager_name && <Typography className="card-sub" sx={subSx}>{child.manager_name}</Typography>}
          </Box>
          {renderColumnSubtree(child, depthInCol + 1)}
        </Box>
      );
    }

    // If single child that is a leaf, or multiple children, render them with the elbow connector
    return (
      <Box
        className="elbow-tree"
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          pl: '22px',
          mt: '14px',
          width: '100%',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: '-14px',
            bottom: '22px',
            left: '11px',
            width: '2px',
            bgcolor: STYLES.connectorColor,
          },
        }}
      >
        {children.map((subChild) => (
          <Box
            key={subChild.id}
            className="elbow-row"
            sx={{
              position: 'relative',
              mb: '12px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              '&:last-child': { mb: 0 },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '21px',
                left: '-11px',
                width: '11px',
                height: '2px',
                bgcolor: STYLES.connectorColor,
              },
            }}
          >
            <Box className="org-card sub-card" sx={cardSx(STYLES.subBg, STYLES.subBorder)}>
              <Typography className="card-title" sx={titleSx}>{subChild.name}</Typography>
              {subChild.manager_name && <Typography className="card-sub" sx={subSx}>{subChild.manager_name}</Typography>}
            </Box>
            {/* If this node also has children, nest them */}
            {subChild.children && subChild.children.length > 0 && renderColumnSubtree(subChild, depthInCol + 1)}
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)',
            height: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        },
      }}
    >
      {/* Header toolbar */}
      <Box
        sx={{
          px: 3,
          py: 1.75,
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0,
        }}
      >
        <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'rgba(46, 168, 157, 0.2)', color: '#2ea89d', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <TreeIcon sx={{ fontSize: 22 }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#ffffff', letterSpacing: '-0.01em', lineHeight: 1.2 }} noWrap>
              {company?.name || treeData?.company?.name || 'Organization Structure Chart'}
            </Typography>
            <Chip
              size="small"
              label={`${allUnits.length} Units`}
              sx={{ height: 20, fontSize: '0.68rem', fontWeight: 800, bgcolor: 'rgba(255,255,255,0.12)', color: '#e2e8f0' }}
            />
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.65)', display: 'block' }}>
            Print & Export preview formatted according to hierarchical organization chart standard
          </Typography>
        </Box>

        {/* Zoom Controls */}
        <ButtonGroup size="small" variant="outlined" sx={{ bgcolor: 'rgba(255,255,255,0.06)', borderRadius: 2, borderColor: 'rgba(255,255,255,0.15)' }}>
          <Tooltip title="Zoom Out">
            <IconButton onClick={handleZoomOut} size="small" sx={{ color: '#ffffff', px: 1 }}>
              <ZoomOutIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Button disabled sx={{ color: '#ffffff !important', fontWeight: 700, fontSize: '0.74rem', minWidth: 54, borderLeft: '1px solid rgba(255,255,255,0.15)', borderRight: '1px solid rgba(255,255,255,0.15)' }}>
            {Math.round(zoom * 100)}%
          </Button>
          <Tooltip title="Zoom In">
            <IconButton onClick={handleZoomIn} size="small" sx={{ color: '#ffffff', px: 1 }}>
              <ZoomInIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Reset Zoom">
            <IconButton onClick={handleZoomReset} size="small" sx={{ color: '#ffffff', px: 1, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
              <ResetZoomIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
        </ButtonGroup>

        {/* Print Button */}
        <Button
          variant="contained"
          startIcon={<PrintIcon />}
          onClick={handlePrint}
          sx={{
            bgcolor: '#2ea89d',
            color: '#ffffff',
            fontWeight: 800,
            fontSize: '0.82rem',
            textTransform: 'none',
            px: 2.5,
            py: 0.85,
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(46, 168, 157, 0.35)',
            '&:hover': { bgcolor: '#26938a' },
          }}
        >
          Print / Save PDF
        </Button>

        {/* Close Button */}
        <IconButton onClick={onClose} size="small" sx={{ color: 'rgba(255,255,255,0.7)', '&:hover': { color: '#ffffff', bgcolor: 'rgba(255,255,255,0.1)' } }}>
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      {/* Preview Body with Scalable Canvas */}
      <DialogContent
        sx={{
          p: { xs: 2, sm: 4 },
          bgcolor: '#f1f5f9',
          overflow: 'auto',
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
        }}
      >
        <Box
          sx={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease-out',
            bgcolor: '#ffffff',
            p: 4,
            borderRadius: 3,
            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.01)',
            minWidth: 'fit-content',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* Chart Header on the canvas */}
          <Box sx={{ textAlign: 'center', mb: 4, pb: 2, borderBottom: '2px solid #e2e8f0', width: '100%' }}>
            <Typography sx={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em', textTransform: 'uppercase' }}>
              {company?.name || treeData?.company?.name || 'Company'}
            </Typography>
            <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', letterSpacing: '0.06em', textTransform: 'uppercase', mt: 0.5 }}>
              Organization Hierarchy Chart
            </Typography>
          </Box>

          {/* Org Chart Container */}
          <Box
            ref={chartContainerRef}
            className="org-chart-wrap"
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%',
            }}
          >
            {/* Top Root Chain (e.g. CMD -> CEO) */}
            {rootChain.map((rootNode) => (
              <React.Fragment key={rootNode.id}>
                <Box className="org-card root-card" sx={cardSx(STYLES.rootBg, STYLES.rootBorder, true)}>
                  <Typography className="card-title" sx={titleSx}>{rootNode.name}</Typography>
                  {rootNode.manager_name && <Typography className="card-sub" sx={subSx}>{rootNode.manager_name}</Typography>}
                </Box>
                {/* Vertical stem between root nodes or before the horizontal branch */}
                <Box className="v-stem" sx={{ width: 2, height: 20, bgcolor: STYLES.connectorColor, my: 0 }} />
              </React.Fragment>
            ))}

            {/* If no root chain was extracted, but roots exist */}
            {rootChain.length === 0 && branchNodes.length === 0 && (
              <Box sx={{ py: 6, textAlign: 'center', color: '#94a3b8' }}>
                <BusinessIcon sx={{ fontSize: 40, mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>No organization units found to display.</Typography>
              </Box>
            )}

            {/* Horizontal Branch Row (Level 2: Executives / Chiefs) */}
            {branchNodes.length > 0 && (
              <Box
                className="branch-row"
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  gap: '18px',
                  position: 'relative',
                }}
              >
                {branchNodes.map((branch) => (
                  <Box
                    key={branch.id}
                    className="branch-col"
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      position: 'relative',
                      pt: '20px',
                      minWidth: '140px',
                      maxWidth: '185px',
                      '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: '50%',
                        width: '2px',
                        height: '20px',
                        bgcolor: STYLES.connectorColor,
                        transform: 'translateX(-50%)',
                      },
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '2px',
                        bgcolor: STYLES.connectorColor,
                      },
                      '&:first-of-type::after': { left: '50%' },
                      '&:last-of-type::after': { right: '50%' },
                      '&:only-of-type::after': { display: 'none' },
                    }}
                  >
                    {/* Level 2 Executive Card (Dark Charcoal) */}
                    <Box className="org-card exec-card" sx={cardSx(STYLES.execBg, STYLES.execBorder)}>
                      <Typography className="card-title" sx={titleSx}>{branch.name}</Typography>
                      {branch.manager_name && <Typography className="card-sub" sx={subSx}>{branch.manager_name}</Typography>}
                    </Box>

                    {/* Column subordinates (Level 3+) */}
                    <Box className="col-subbranch" sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      {renderColumnSubtree(branch)}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

// Common CSS styling tokens for the cards
const cardSx = (bg, border, isRoot = false) => ({
  minWidth: isRoot ? 140 : 135,
  maxWidth: isRoot ? 180 : 175,
  minHeight: isRoot ? 46 : 44,
  p: '8px 10px',
  borderRadius: '3px',
  bgcolor: `${bg} !important`,
  border: `1.5px solid ${border}`,
  color: '#ffffff !important',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  textAlign: 'center',
  boxShadow: '0 2px 4px rgba(0,0,0,0.14)',
  boxSizing: 'border-box',
});

const titleSx = {
  fontSize: '0.72rem',
  fontWeight: 800,
  lineHeight: 1.25,
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
  wordBreak: 'break-word',
  color: '#ffffff !important',
};

const subSx = {
  fontSize: '0.62rem',
  fontWeight: 600,
  opacity: 0.9,
  mt: '2px',
  textTransform: 'none',
  color: 'rgba(255,255,255,0.92) !important',
};

export default OrgChartPrintModal;
