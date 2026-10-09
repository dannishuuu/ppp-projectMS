// models/index.js
module.exports = {
  // Official Project & Associations
  PppProject: require('./pppProject.model'),
  ProjectOrganization: require('./projectOrganization.model'),
  ProjectCategoryMap: require('./projectCategoryMap.model'),
  ProjectManager: require('./projectManager.model'),

  // Project Tracking & WBS
  ProjectTrackingType: require('./projectTrackingType.model'),
  ProjectTrackingArea: require('./projectTrackingArea.model'),
  ProjectTrackingChecklist: require('./projectTrackingChecklist.model'),
  ChecklistPerformanceLog: require('./checklistPerformanceLog.model'),

  // Templates & Master Definitions
  TrackingItemType: require('./trackingItemType.model'),
  TrackingArea: require('./trackingArea.model'),
  Checklist: require('./checklist.model'),
  ProjectCategory: require('./projectCategory.model'),
  ProjectStatus: require('./projectStatus.model'),
  DocumentSequence: require('./documentSequence.model'),

  // Proposals & Reviews
  ProjectProposal: require('./projectProposal.model'),
  ProposalCategory: require('./proposalCategory.model'),
  ProposalReviewer: require('./proposalReviewer.model'),
  ProposalReview: require('./proposalReview.model'),
  ProposalStatus: require('./proposalStatus.model'),
  ReviewDecision: require('./reviewDecision.model'),

  // Organizations & Users
  User: require('./users.model'),
  Organization: require('./organization.model'),
  OrganizationType: require('./organizationType.model'),
  BusinessSector: require('./businessSector.model'),

  // Geography & Assets
  Country: require('./countries.model'),
  Region: require('./region.model'),
  Zone: require('./zone.model'),
  Woreda: require('./woreda.model'),
  Building: require('./building.model'),
  BuildingFloor: require('./buildingFloor.model'),
  BuildingUnit: require('./buildingUnit.model'),
  BuildingType: require('./buildingTypes.model'),
  FloorType: require('./floorType.model'),
  AreaUnit: require('./areaUnit.model'),
  ShopServiceType: require('./shopServiceType.model'),

  // Contracts & Payments
  RentalContract: require('./rentalContract.model'),
  RentalPayment: require('./rentalPayments.model'),
  RentalPaymentType: require('./rentalPaymentType.model'),
  PaymentTiming: require('./paymentTiming.model'),
  ServiceChargeType: require('./serviceChargeTypes.model'),
  Currency: require('./currency.model'),
};
