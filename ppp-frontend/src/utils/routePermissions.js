// utils/routePermissions.js
//
// Maps route paths to the permission code required to view them.
// Every code here mirrors the sidebar menu gating in
// components/Layout/Sidebar.jsx, so menu visibility and direct URL access
// stay consistent (a hidden menu item can no longer be opened by typing
// the URL directly).
//
// Matching rules:
//   - Entries are evaluated in order and the FIRST match wins, so more
//     specific paths are listed before their parent sections
//     ("/projects/proposals" before "/projects").
//   - A path matches an entry when it equals it or is a descendant of it:
//     "/projects/123/edit" inherits the permission of "/projects/:id/edit".
//   - ":name" segments match exactly one URL segment, so dynamic action
//     routes can declare their own permission codes
//     ("/projects/:id" -> project.details).
//   - Paths without an entry (Dashboard, /buildings, /contracts, ...) are
//     unrestricted — exactly like their sidebar entries, which carry no
//     `permission` field.

export const ROUTE_PERMISSIONS = [
  // Projects (action routes and children first, then the section root —
  // MORE SPECIFIC paths MUST come first, since a path matches an entry when
  // it equals it or is a descendant of it and the first match wins)
  { path: '/projects/proposals', permission: 'proposal.list' },
  { path: '/projects/reviews/:id', permission: 'proposal.proposal_review_detail' },
  { path: '/projects/reviews', permission: 'proposal.proposal_review_list' },
  { path: '/projects/new', permission: 'project.create' },
  { path: '/projects/:id/edit', permission: 'project.update' },
  { path: '/projects/:id', permission: 'project.details' },
  { path: '/projects', permission: 'project.list' },

  // User management (children first, then the section root)
  { path: '/users/list', permission: 'user.list' },
  { path: '/users/roles-permissions', permission: 'permission.list' },
  { path: '/users/user-roles', permission: 'user.user_role_management' },
  { path: '/users', permission: 'user.list' },

  // Document management
  { path: '/document-sequences', permission: 'document_management.list' },

  // Organizations
  { path: '/organizations', permission: 'organization.list' },

  // Company management
  { path: '/company/companymanagement', permission: 'company_management.list_company' },
  { path: '/company/orgunitype', permission: 'company_management.list_org_unit_type' },
  { path: '/company/companyorgunit', permission: 'company_management.list_org_structure' },

  // Foundation / reference data
  { path: '/foundation/organization-types', permission: 'foundation.list_organization_type' },
  { path: '/foundation/tracking-types', permission: 'foundation.list_tracking_type' },
  { path: '/foundation/project-categories', permission: 'foundation.list_project_category' },
  { path: '/foundation/project-statuses', permission: 'foundation.list_project_status' },
  { path: '/foundation/currencies', permission: 'foundation.list_currency' },
  { path: '/foundation/proposal-statuses', permission: 'foundation.list_proposal_status' },
  { path: '/foundation/geographical', permission: 'foundation.list_geographical' },
  { path: '/foundation/building-types', permission: 'foundation.list_building_type' },
  { path: '/foundation/shop-service-types', permission: 'foundation.list_shop_service_type' },
  { path: '/foundation/payment-timings', permission: 'foundation.list_payment_timing' },
  { path: '/foundation/rental-payment-types', permission: 'foundation.list_rental_payment_type' },
  { path: '/foundation/area-units', permission: 'foundation.list_area_unit' },
  { path: '/foundation/floor-types', permission: 'foundation.list_floor_type' },
  { path: '/foundation/business-sectors', permission: 'foundation.list_business_sector' },
  { path: '/foundation/organization-document-types', permission: 'foundation.list_organization_document_type' },
];

/**
 * Resolve the permission code required to view a route path.
 * @param {string} pathname - e.g. "/projects/new"
 * @returns {string|null} permission code, or null when the path is unrestricted
 */
export const getRequiredPermission = (pathname = '/') => {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
  const pathSegments = normalized.split('/');

  for (const { path, permission } of ROUTE_PERMISSIONS) {
    const patternSegments = path.split('/');
    // The pattern must fit within the path (exact match or ancestor match)
    if (pathSegments.length < patternSegments.length) continue;

    const matches = patternSegments.every(
      (segment, i) => segment.startsWith(':') || segment === pathSegments[i]
    );
    if (matches) return permission;
  }
  return null;
};
