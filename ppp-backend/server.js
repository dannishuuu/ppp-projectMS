const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

const loginRoutes = require('./routes/authRoutes/login.routes');
const userRoutes = require('./routes/usersRoutes/users.routes');
const orgTypeRoutes = require('./routes/organizationRoles/organizationType.routes');
const orgRoutes = require('./routes/organizationRoles/organization.routes');
const projectCatRoutes = require('./routes/projectController/projectCategory.routes');
const projectProposalRoutes = require('./routes/projectController/projectProposal.routes');
const projectReviewersRoutes = require('./routes/projectController/projectReviewers.routes');
const trackingItemTypeRoutes = require('./routes/projectController/trackingItemType.routes');
const trackingAreaRoutes = require('./routes/projectController/trackingArea.routes');
const checklistRoutes = require('./routes/projectController/checklist.routes');
const currencyRoutes = require('./routes/foundationService/currency.routes');
const proposalStatusRoutes = require('./routes/foundationService/proposalStatus.routes');
const projectStatusRoutes = require('./routes/foundationService/projectStatus.routes');
const fileRoutes = require('./routes/file.routes');
const reviewDecisionRoutes = require('./routes/reviewDecision.routes');
const proposalReviewRoutes = require('./routes/proposalReview.routes');
const documentSequenceRoutes = require('./routes/projectController/documentSequence.routes');
const countriesRoutes = require('./routes/foundationService/countries.routes');
const regionsRoutes = require('./routes/foundationService/regions.routes');
const zonesRoutes = require('./routes/foundationService/zones.routes');
const woredasRoutes = require('./routes/foundationService/woredas.routes');
const buildingTypeRoutes = require('./routes/foundationService/buildingTypes.routes');
const shopServiceTypeRoutes = require('./routes/foundationService/shopServiceTypes.routes');
const paymentTimingRoutes = require('./routes/foundationService/paymentTimings.routes');
const rentalPaymentTypeRoutes = require('./routes/foundationService/rentalPaymentTypes.routes');
const areaUnitRoutes = require('./routes/foundationService/areaUnits.routes');
const floorTypeRoutes = require('./routes/foundationService/floorTypes.routes');
const buildingRoutes = require('./routes/buildingRoutes/buildings.routes');
const buildingFloorRoutes = require('./routes/buildingRoutes/buildingFloors.routes');
const buildingUnitRoutes = require('./routes/buildingRoutes/buildingUnits.routes');


// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Routes

// Login routes
app.use('/api/v1', loginRoutes);

// User routes
app.use('/api/v1/users', userRoutes);

// Organization type routes
app.use('/api/v1/organization-types', orgTypeRoutes);

// Organization routes
app.use('/api/v1/organizations', orgRoutes);

// Project category routes
app.use('/api/v1/project-categories', projectCatRoutes);

// Project proposal routes
app.use('/api/v1/project-proposals', projectProposalRoutes);

// Project proposal reviewers routes
app.use('/api/v1/project-proposal-reviewers', projectReviewersRoutes);

// Tracking item type routes
app.use('/api/v1/tracking-item-types', trackingItemTypeRoutes);

// Tracking area routes
app.use('/api/v1/tracking-areas', trackingAreaRoutes);

// Checklist routes
app.use('/api/v1/checklists', checklistRoutes);

// Currency routes
app.use('/api/v1/currencies', currencyRoutes);

// Proposal status routes
app.use('/api/v1/proposal-statuses', proposalStatusRoutes);

// Project status routes
app.use('/api/v1/project-statuses', projectStatusRoutes);

// File upload routes
app.use('/api/v1/files', fileRoutes);

// Review decision routes
app.use('/api/v1/review-decisions', reviewDecisionRoutes);

// Proposal review routes
app.use('/api/v1/proposal-reviews', proposalReviewRoutes);

// Document sequence routes
app.use('/api/v1/document-sequences', documentSequenceRoutes);

// Countries routes
app.use('/api/v1/countries', countriesRoutes);

// Regions routes
app.use('/api/v1/regions', regionsRoutes);

// Zones routes
app.use('/api/v1/zones', zonesRoutes);

// Woredas routes
app.use('/api/v1/woredas', woredasRoutes);

// Building types routes
app.use('/api/v1/building-types', buildingTypeRoutes);

// Shop service Type
app.use('/api/v1/shop-service-types', shopServiceTypeRoutes);

// Serve uploaded files statically
app.use('/uploads', express.static('uploads'));

// Payment Timings
app.use('/api/v1/payment-timings', paymentTimingRoutes);

// Rental Payment Types
app.use('/api/v1/rental-payment-types', rentalPaymentTypeRoutes);

// Area units routes
app.use('/api/v1/area-units', areaUnitRoutes);

// Floor types routes
app.use('/api/v1/floor-types', floorTypeRoutes);

// Building
app.use('/api/v1/buildings', buildingRoutes);

// Building Floors
app.use('./api/v1/building-floors', buildingFloorRoutes);

// Building Units
app.use('./api/v1/building-units', buildingUnitRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});