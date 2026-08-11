# PPP Project Proposal Management System
## User Guide for Operational Staff

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Managing Proposals](#4-managing-proposals)
5. [Review Process](#5-review-process)
6. [Managing Reviewers](#6-managing-reviewers)
7. [Document Management](#7-document-management)
8. [Administration](#8-administration)
9. [Frequently Asked Questions](#9-frequently-asked-questions)

---

## 1. Introduction

### 1.1 What is the PPP Project Proposal Management System?

The PPP Project Proposal Management System is a web-based platform that helps the Federal PPP Directorate manage project proposals from private sector developers. It provides a centralized system for submitting, reviewing, tracking, and approving PPP project proposals.

### 1.2 Who Should Use This Guide?

This guide is designed for:
- **Foundation Staff** - Who process and manage proposals
- **Reviewers** - Who evaluate and approve proposals
- **Administrators** - Who manage users and system settings

### 1.3 System Overview

The system handles the complete lifecycle of a PPP proposal:

```
Proposal Created → Under Review → Approved/Rejected → Implementation
```

---

## 2. Getting Started

### 2.1 Accessing the System

1. Open your web browser (Chrome, Firefox, Edge, or Safari)
2. Navigate to the system URL provided by your administrator
3. Enter your email address and password
4. Click "Sign In"

### 2.2 Navigation Overview

After logging in, you will see the main interface with:

- **Sidebar (Left)**: Contains navigation menus organized by category
- **Header (Top)**: Shows your profile, notifications, and logout
- **Main Content Area**: Displays the current page content

### 2.3 Understanding Your Role

Your access to features depends on your user role:

| Role | Permissions |
|------|-------------|
| **Administrator** | Full system access, user management, all settings |
| **Foundation Staff** | Create, edit, delete proposals, assign reviewers, manage organizations |
| **Reviewer** | View assigned proposals, approve/reject proposals |
| **Developer** | Create proposals, upload documents, view submission status |

---

## 3. Dashboard Overview

### 3.1 Dashboard Components

The dashboard provides a quick summary of your work:

**Summary Cards**:
- **Total Proposals**: Number of all proposals in the system
- **Pending Reviews**: Proposals awaiting your action
- **Recently Submitted**: Latest proposals added to the system
- **Approved**: Proposals that have been approved

**Quick Actions**:
- Click "New Proposal" to submit a proposal
- Click "View All Proposals" to see complete list

### 3.2 Understanding Proposal Status

| Status | Meaning |
|--------|---------|
| **Draft** | Proposal is being created, not yet submitted |
| **Pending** | Proposal submitted, awaiting review assignment |
| **Under Review** | Reviewers are evaluating the proposal |
| **Approved** | Proposal approved by all reviewers |
| **Rejected** | Proposal rejected (cannot proceed) |

---

## 4. Managing Proposals

### 4.1 Viewing All Proposals

1. Click on **Proposals** in the sidebar
2. Select **All Proposals** or **My Proposals**
3. Use the search box to find specific proposals
4. Filter by status, category, or organization using the dropdowns
5. Click on any proposal to view details

### 4.2 Creating a New Proposal

1. Click **New Proposal** button
2. Fill in the required information:

**Core Details Section**:
- **Proposed Project Name**: Enter the full project name
- **Developer (Organization)**: Select the submitting organization
- **Project Category**: Select the project type
- **Proposal Status**: Auto-set to Draft (editable by staff)

**Financials & Resources Section**:
- **Proposed Capital Amount**: Enter the investment amount
- **Currency**: Select the currency (ETB, USD, etc.)
- **Land Requested**: Enter land area in square meters

**Description & Remarks Section**:
- **Project Description**: Provide detailed project information
- **Remarks**: Add any additional notes

3. Click **Upload Files** to attach supporting documents
4. Click **Save as Draft** to save for later or **Submit** to send for review

### 4.3 Editing a Proposal

1. Go to the proposal details page
2. Click the **Edit** button
3. Make necessary changes
4. Click **Save Changes**

> **Note**: Only proposals in Draft status can be edited.

### 4.4 Deleting a Proposal

1. Go to the proposal details page
2. Click the **Delete** button
3. Confirm the deletion in the popup dialog

> **Warning**: Deleted proposals cannot be recovered.

---

## 5. Review Process

### 5.1 Submitting a Proposal for Review

Once a proposal is ready:

1. Open the proposal details
2. Click **Submit for Review**
3. Select reviewers to assign
4. Set due date for review completion
5. Click **Confirm**

The proposal status changes to "Under Review."

### 5.2 Reviewing a Proposal (For Reviewers)

1. Click on **My Reviews** in the sidebar
2. Find your assigned proposal
3. Click on the proposal to open the review page
4. Review the proposal details and attached documents
5. To take action:
   - Click **Approve** to approve the proposal
   - Click **Reject** to reject (must provide reason)
6. Add remarks if necessary
7. Confirm your action

### 5.3 Viewing Review Status

The details page shows:
- Number of assigned reviewers
- List of all reviewers
- Each reviewer's status (Pending, Approved, Rejected)
- Due dates for each reviewer

### 5.4 Understanding Approval Flow

**Single Reviewer**:
- Reviewer approves or rejects
- Decision is final

**Multiple Reviewers**:
- Each reviewer provides independent assessment
- Overall status may remain "Under Review" until all complete
- Final outcome based on collective decision

---

## 6. Managing Reviewers

### 6.1 Viewing Reviewers

1. Click on **Proposals** in the sidebar
2. Select **Reviewers**

The reviewers table shows:
- Reviewer name and email
- Assigned proposal
- Review status
- Due date
- Actions

### 6.2 Assigning Reviewers to a Proposal

1. Open the proposal details
2. Click **Submit for Review**
3. Search or select reviewers from the list
4. Set due date for each reviewer
5. Click **Confirm**

### 6.3 Reviewer Status Meanings

| Status | Description |
|--------|-------------|
| **Pending** | Reviewer has not taken action yet |
| **Approved** | Reviewer approved the proposal |
| **Rejected** | Reviewer rejected the proposal |
| **Cancelled** | Reviewer assignment was cancelled |

---

## 7. Document Management

### 7.1 Supported File Types

The system accepts the following document types:
- **PDF Documents** (.pdf)
- **Word Documents** (.doc, .docx)
- **Excel Spreadsheets** (.xls, .xlsx)
- **PowerPoint Presentations** (.ppt, .pptx)
- **Images** (.jpg, .jpeg, .png, .gif)

### 7.2 Uploading Documents

1. On the proposal form, scroll to **Attached Documents**
2. Click **Upload Files** button
3. Select one or more files (maximum 5 files)
4. Files are automatically uploaded
5. Each file displays name and size

### 7.3 Document Requirements

- Maximum file size: 10MB per file
- Maximum files per proposal: 5
- File names will be stored for reference

### 7.4 Downloading Documents

1. On the proposal details page
2. Find the document in the **Attached Documents** section
3. Click **Download** next to the file name
4. The file opens in a new browser tab or downloads

---

## 8. Administration

### 8.1 Managing Users (Administrators Only)

1. Click on **Administration** in the sidebar
2. Select **Users**

**Creating a New User**:
1. Click **Add User**
2. Fill in user details (first name, last name, email, role)
3. Click **Save**

**Editing a User**:
1. Find the user in the list
2. Click **Edit**
3. Update the information
4. Click **Save**

**Resetting Password**:
1. Click **Edit** on the user
2. Enter new password
3. Click **Save**

### 8.2 Managing Organizations

1. Click on **Foundation** in the sidebar
2. Select **Organizations**

**Adding an Organization**:
1. Click **Add Organization**
2. Fill in organization name and type
3. Click **Save**

### 8.3 Managing Categories

1. Click on **Foundation** in the sidebar
2. Select **Categories**

View and manage project categories used in proposals.

---

## 9. Frequently Asked Questions

### Q: How do I reset my password?

Contact your system administrator to reset your password.

### Q: Why can't I edit a proposal?

Proposals can only be edited when they are in **Draft** status. Once submitted for review, they cannot be modified.

### Q: How do I check if my proposal was approved?

Open the proposal details page and look at the status chip. **Approved** status is shown in green.

### Q: What happens if a reviewer rejects a proposal?

The proposal status changes to **Rejected**. The submitter will be notified. A rejected proposal typically cannot be resubmitted.

### Q: Can I upload multiple files at once?

Yes, you can select multiple files when uploading. Maximum 5 files per proposal.

### Q: What file formats are supported?

PDF, Word, Excel, PowerPoint, and image files (JPG, PNG, GIF) are supported.

### Q: How do I search for a proposal?

Use the search box at the top of the proposals list. You can search by project name, organization, or other criteria.

### Q: How do I filter proposals?

Use the dropdown filters above the proposals table to filter by status, category, or other criteria.

### Q: Can I export proposal data?

The system supports basic export functionality. Contact your administrator for advanced reporting needs.

### Q: Who do I contact for technical support?

Contact your system administrator or IT support team.

---

## Quick Reference Card

### Common Tasks

| Task | Steps |
|------|-------|
| **Login** | Enter email and password on login page |
| **Create Proposal** | Proposals → New Proposal → Fill form → Submit |
| **View Proposals** | Proposals → All Proposals |
| **Search Proposals** | Use search box at top of list |
| **Edit Proposal** | Open proposal → Click Edit → Save |
| **Submit for Review** | Open proposal → Submit for Review → Select reviewers |
| **Approve Proposal** | My Reviews → Open proposal → Click Approve |
| **Reject Proposal** | My Reviews → Open proposal → Click Reject → Add reason |
| **Upload Documents** | Scroll to Attached Documents → Upload Files |
| **Download Document** | Find document → Click Download |
| **View Dashboard** | Click Dashboard in sidebar |
| **Logout** | Click profile icon → Logout |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| **Ctrl + F** | Focus search box |
| **Ctrl + N** | New proposal |
| **Esc** | Close dialogs/modals |

---

## Support Information

For questions or issues:

- **System Administrator**: [Contact information]
- **Technical Support**: [Contact information]
- **User Guide Updates**: [Reference date]

---

**Document Version**: 1.0
**Last Updated**: August 2026
**Classification**: Internal Use Only