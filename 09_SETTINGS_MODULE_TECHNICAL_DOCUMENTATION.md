# WADJET GRC — Settings Module: Technical Documentation

**Document Version:** 1.0  
**Classification:** Internal — Technical Reference  
**Module:** Settings  
**Last Updated:** 2026-08-23  
**Author:** WADJET GRC Engineering Team  

---

## Table of Contents

1. [Module Overview](#1-module-overview)
2. [Architecture](#2-architecture)
3. [Functionalities](#3-functionalities)
4. [Data Structures](#4-data-structures)
5. [User Roles & Permissions](#5-user-roles--permissions)
6. [Workflows](#6-workflows)
7. [API Endpoints](#7-api-endpoints)
8. [Integration Points](#8-integration-points)
9. [Edge Cases & Error Handling](#9-edge-cases--error-handling)
10. [Security Considerations](#10-security-considerations)

---

## 1. Module Overview

The Settings Module provides system configuration capabilities for the WADJET GRC platform. It includes email/mail configuration and management, as well as backup configuration and execution. The module supports operational tasks necessary for platform administration and communication.

### 1.1 Scope

| Capability | Description |
|---|---|
| Email Configuration | SMTP server settings and email templates |
| Email Compose | Compose and send emails with attachments |
| Email Drafts | Save and manage email drafts |
| Email Scheduling | Schedule emails for future delivery |
| Backup Configuration | Configure backup frequency and retention |
| Backup Execution | Execute and monitor backup operations |
| Backup History | View backup records and status |

### 1.2 Technology Stack

| Layer | Technology |
|---|---|
| Backend | Node.js native HTTP server (mock-server.mjs) |
| Data Layer | mock-data.mjs (EMAIL_CONFIG, EMAIL_MESSAGES, BACKUP_CONFIG, BACKUP_RECORDS) |
| Frontend | React (JSX) with React Router, TanStack Query |
| Rich Text | TipTap (WYSIWYG editor for email composition) |
| UI Components | Radix UI, shadcn/ui, Lucide icons |

---

## 2. Architecture

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          SETTINGS MODULE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                     Frontend Layer                               │   │
│  │  ┌──────────────────┐  ┌──────────────────┐                     │   │
│  │  │   Mail           │  │   Backup         │                     │   │
│  │  │   (Email UI)     │  │   (Backup UI)    │                     │   │
│  │  │                  │  │                  │                     │   │
│  │  │ Sub-components:  │  │ Sub-components:  │                     │   │
│  │  │ - EmailCompose   │  │ - BackupConfig   │                     │   │
│  │  │ - RichTextEditor │  │ - BackupHistory  │                     │   │
│  │  │ - RecipientPicker│  │                  │                     │   │
│  │  │ - DraftList      │  │                  │                     │   │
│  │  │ - AttachmentUpload│ │                  │                     │   │
│  │  │ - ScheduleControl│  │                  │                     │   │
│  │  └────────┬─────────┘  └────────┬─────────┘                     │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                   │
│  ┌───────────┼──────────────────────┼───────────────────────────────┐   │
│  │           ▼                      ▼                               │   │
│  │  ┌─────────────────────────────────────────────────────────┐   │   │
│  │  │              API Layer (mock-server.mjs)                 │   │   │
│  │  │  /api/email/messages  /api/email/config                  │   │   │
│  │  │  /api/backup/records /api/backup/config                  │   │   │
│  │  └─────────────────────────┬───────────────────────────────┘   │   │
│  └────────────────────────────┼──────────────────────────────────┘   │
│                               │                                       │
│  ┌────────────────────────────┼──────────────────────────────────┐   │
│  │                            ▼                                   │   │
│  │  ┌─────────────────────────────────────────────────────────┐  │   │
│  │  │              Data Layer (mock-data.mjs)                  │  │   │
│  │  │  EMAIL_CONFIG  EMAIL_MESSAGES  BACKUP_CONFIG  BACKUP_RECORDS│  │   │
│  │  └─────────────────────────────────────────────────────────┘  │   │
│  └────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Mail Sub-components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          MAIL COMPONENT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐      │
│  │  EmailCompose    │  │  RichTextEditor  │  │  RecipientPicker │      │
│  │  - To/CC/BCC     │  │  - WYSIWYG      │  │  - User search   │      │
│  │  - Subject       │  │  - Formatting   │  │  - Group select  │      │
│  │  - Send/Schedule │  │  - Attachments  │  │  - External      │      │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘      │
│                                                                         │
│  ┌──────────────────┐  ┌──────────────────┐                           │
│  │  AttachmentUpload│  │  ScheduleControl │                           │
│  │  - File select   │  │  - Date/Time     │                           │
│  │  - Progress      │  │  - Recurrence    │                           │
│  │  - Preview       │  │  - Timezone      │                           │
│  └──────────────────┘  └──────────────────┘                           │
│                                                                         │
│  ┌──────────────────┐                                                   │
│  │  DraftList       │                                                   │
│  │  - Auto-save     │                                                   │
│  │  - Edit/Delete   │                                                   │
│  │  - Resume        │                                                   │
│  └──────────────────┘                                                   │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Functionalities

### 3.1 Email Management

#### 3.1.1 Email Configuration
- Configure SMTP server settings (host, port, username, password)
- Set default sender address
- Configure TLS/SSL settings
- Test email configuration

#### 3.1.2 Email Composition
- Compose emails with WYSIWYG rich text editor
- Add recipients (To, CC, BCC)
- Select recipients from user list or enter external addresses
- Add attachments with preview
- Save as draft
- Schedule for future delivery

#### 3.1.3 Email Drafts
- Auto-save draft emails
- List all drafts with last modified date
- Resume editing drafts
- Delete unwanted drafts

#### 3.1.4 Email Scheduling
- Schedule emails for specific date/time
- Support for timezone selection
- Scheduled email queue management
- Cancel scheduled emails

#### 3.1.5 Email Messages
- Sent messages history
- Message status tracking (Sent, Draft, Scheduled, Failed)
- Message detail view with full content
- Attachment access

### 3.2 Backup Management

#### 3.2.1 Backup Configuration
- Configure backup frequency (daily, weekly, monthly)
- Set backup retention period
- Configure backup scope (full, incremental)
- Set backup storage location

#### 3.2.2 Backup Execution
- Manual backup trigger
- Automatic scheduled backup
- Backup progress monitoring
- Backup completion notification

#### 3.2.3 Backup Records
- Complete backup history
- Backup status tracking (In Progress, Completed, Failed)
- Backup size tracking
- Backup duration tracking
- Restore capability

---

## 4. Data Structures

### 4.1 Email Configuration Object

```javascript
{
  _id: "ec-1",
  smtpHost: "smtp.wadjet.local",
  smtpPort: 587,
  username: "noreply@wadjet.local",
  password: "********",             // Encrypted
  useTLS: true,
  defaultSender: "WADJET GRC <noreply@wadjet.local>",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
```

### 4.2 Email Message Object

```javascript
{
  _id: "em-1",
  from: "admin@wadjet.local",
  to: ["user@wadjet.local"],
  cc: [],
  bcc: [],
  subject: "Policy Review Required",
  body: "<p>Please review the updated Information Security Policy...</p>",
  bodyPlain: "Please review the updated Information Security Policy...",
  attachments: [
    {
      filename: "policy-v3.2.pdf",
      size: 245760,
      mimeType: "application/pdf"
    }
  ],
  status: "Sent",                   // Draft, Scheduled, Sent, Failed
  scheduledFor: null,
  sentAt: "2026-08-20T10:00:00Z",
  createdAt: "2026-08-20T09:30:00Z",
  updatedAt: "2026-08-20T10:00:00Z",
}
```

### 4.3 Email Draft Object

```javascript
{
  _id: "ed-1",
  userId: "u-admin",
  from: "admin@wadjet.local",
  to: ["user@wadjet.local"],
  cc: [],
  subject: "Draft: Q3 Risk Review",
  body: "<p>Draft content...</p>",
  attachments: [],
  status: "Draft",
  lastSavedAt: "2026-08-21T14:30:00Z",
  createdAt: "2026-08-21T14:00:00Z",
}
```

### 4.4 Backup Configuration Object

```javascript
{
  _id: "bc-1",
  frequency: "Daily",               // Daily, Weekly, Monthly
  retentionDays: 90,
  scope: "Full",                    // Full, Incremental
  storagePath: "/backups/wadjet-grc/",
  enabled: true,
  lastRunAt: "2026-08-23T02:00:00Z",
  nextRunAt: "2026-08-24T02:00:00Z",
  createdAt: "2025-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
}
```

### 4.5 Backup Record Object

```javascript
{
  _id: "br-1",
  backupCode: "BKP-2026-08-23-001",
  type: "Full",                     // Full, Incremental
  status: "Completed",              // In Progress, Completed, Failed
  sizeBytes: 104857600,             // 100 MB
  duration: 120,                    // seconds
  startedAt: "2026-08-23T02:00:00Z",
  completedAt: "2026-08-23T02:02:00Z",
  errorMessage: null,
  storagePath: "/backups/wadjet-grc/2026-08-23/",
  createdAt: "2026-08-23T02:00:00Z",
}
```

---

## 5. User Roles & Permissions

### 5.1 Settings Module Permissions

| Permission | Admin | Board | CISO | CRO | Risk Owner | Analyst | Viewer |
|---|---|---|---|---|---|---|---|
| settings.view | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| settings.manage | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |
| email.compose | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✗ |
| email.configure | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |
| backup.manage | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 6. Workflows

### 6.1 Email Sending Workflow

```
┌─────────────────┐
│ Compose Email   │
│ - Add recipients│
│ - Write content │
│ - Add attachments│
└────────┬────────┘
         │
         ├──── Save Draft ────▶ Store as Draft
         │
         ├──── Schedule ────▶ Store with Scheduled status
         │
         ▼
┌─────────────────┐
│ Send Email      │
│ - Validate      │
│ - Send via SMTP │
│ - Update status │
└────────┬────────┘
         │
         ├──── Success ────▶ Status = Sent
         │
         └──── Failure ────▶ Status = Failed
```

### 6.2 Backup Workflow

```
┌─────────────────┐
│ Backup Trigger  │
│ (Manual/Scheduled)│
└────────�────────┘
         │
         ▼
┌─────────────────┐
│ Backup Started  │
│ Status = In Progress│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Execute Backup  │
│ - Export data   │
│ - Compress      │
│ - Store         │
└────────┬────────┘
         │
         ├──── Success ────▶ Status = Completed
         │
         └──── Failure ────▶ Status = Failed
         │
         ▼
┌─────────────────┐
│ Record Backup   │
│ History         │
└─────────────────┘
```

---

## 7. API Endpoints

### 7.1 Email Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/email/messages` | List email messages |
| POST | `/api/email/messages` | Send email |
| GET | `/api/email/drafts` | List drafts |
| POST | `/api/email/drafts` | Save draft |
| DELETE | `/api/email/drafts/:id` | Delete draft |
| GET | `/api/email/config` | Get email configuration |
| PUT | `/api/email/config` | Update email configuration |
| POST | `/api/email/config/test` | Test email configuration |

### 7.2 Backup Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/backup/records` | List backup records |
| POST | `/api/backup/execute` | Trigger manual backup |
| GET | `/api/backup/config` | Get backup configuration |
| PUT | `/api/backup/config` | Update backup configuration |
| POST | `/api/backup/:id/restore` | Restore from backup |

---

## 8. Integration Points

### 8.1 Internal Integrations

| Module | Integration | Data Flow |
|---|---|---|
| Governance | Email notifications | Policy review reminders, attestation requests |
| All Modules | Scheduled notifications | Automated alerts via email |
| Auth | User directory | Email recipient selection |
| Reporting | Email delivery | Report distribution via email |

### 8.2 External Integrations

| System | Integration Type | Purpose |
|---|---|---|
| SMTP Server | Email delivery | Send platform notifications |
| File System | Backup storage | Store backup archives |

---

## 9. Edge Cases & Error Handling

### 9.1 Email Edge Cases

| Edge Case | Handling |
|---|---|
| SMTP connection failure | Status = Failed, retry logic |
| Invalid email address | Validation error before send |
| Attachment too large | Size limit enforcement |
| Scheduled email in past | Validation error |
| Draft auto-save conflict | Last-write-wins |

### 9.2 Backup Edge Cases

| Edge Case | Handling |
|---|---|
| Backup in progress | Prevent concurrent backups |
| Insufficient storage | Status = Failed, error message |
| Restore while active | Prevent restore during operations |
| Configuration change during backup | Use snapshot of config |

---

## 10. Security Considerations

### 10.1 Access Control
- Email configuration restricted to admins
- Backup management restricted to admins
- Email composition available to authorized roles
- SMTP credentials encrypted at rest

### 10.2 Data Protection
- Email content may contain sensitive GRC data
- Attachment scanning recommended
- Backup encryption recommended
- Access logging for compliance

### 10.3 Operational Security
- Backup retention policy enforced
- Backup access restricted
- Restore operations audited

---

*End of Settings Module Technical Documentation*
