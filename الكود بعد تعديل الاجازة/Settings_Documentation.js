const fs = require("fs");
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
  ShadingType, PageNumber, LevelFormat, PageBreak
} = require("docx");

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const headerCell = (text, width) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: { fill: "1A1A2E", type: ShadingType.CLEAR },
  margins: cellMargins,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: "Arial", size: 20, color: "FFFFFF" })] })],
});

const dataCell = (text, width, opts = {}) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: cellMargins,
  children: [new Paragraph({ children: [new TextRun({ text, font: "Arial", size: 20, color: opts.color || "333333" })] })],
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 24 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: "1A1A2E" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: "2E75B6" },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial", color: "333333" },
        paragraph: { spacing: { before: 200, after: 120 }, outlineLevel: 2 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [
        { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
      ]},
      { reference: "numbers", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "numbers2", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "numbers3", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
      { reference: "numbers4", levels: [
        { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
      ]},
    ]
  },
  sections: [
    // ============================================================
    // COVER PAGE
    // ============================================================
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [] }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Wadjet GRC Platform", font: "Arial", size: 52, bold: true, color: "1A1A2E" })]
        }),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Settings Module", font: "Arial", size: 44, bold: true, color: "2E75B6" })]
        }),
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Functional Description & Technical Specification", font: "Arial", size: 28, color: "666666" })]
        }),
        new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Version 1.0", font: "Arial", size: 24, color: "999999" })]
        }),
        new Paragraph({ spacing: { before: 100 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "August 2026", font: "Arial", size: 24, color: "999999" })]
        }),
        new Paragraph({ spacing: { before: 2000 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Prepared by: Engineering Team", font: "Arial", size: 22, color: "666666" })]
        }),
      ]
    },

    // ============================================================
    // TABLE OF CONTENTS PLACEHOLDER
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),

    // ============================================================
    // SECTION 1: OVERVIEW
    // ============================================================
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("1. Module Overview")] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "The Settings module provides system administrators with the ability to configure two critical platform capabilities: outbound email integration (Mail) and database backup management (Backup). These settings are accessible from the main navigation sidebar under the Settings section.", font: "Arial", size: 22 })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.1 Target Users")] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "System Administrators — responsible for SMTP configuration and email notification management", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Database Administrators — responsible for backup scheduling, retention, and restore operations", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Compliance Managers — compose and schedule outbound communications to stakeholders", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("1.2 Routes & Access")] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 6240],
      rows: [
        new TableRow({ children: [headerCell("Route", 3120), headerCell("Page", 6240)] }),
        new TableRow({ children: [dataCell("/settings/mail", 3120), dataCell("Mail — SMTP configuration and email composition", 6240)] }),
        new TableRow({ children: [dataCell("/settings/backup", 3120), dataCell("Backup — Scheduled backups and restore management", 6240)] }),
      ]
    }),

    // ============================================================
    // SECTION 2: MAIL
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("2. Mail Settings")] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "The Mail page provides two functional areas accessible via tabs: SMTP configuration and email composition. It enables the platform to send automated notifications, compliance alerts, and user-composed messages through an external SMTP relay.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.1 SMTP Configuration Tab")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The Settings tab presents a form for configuring the SMTP relay connection. Fields include:", font: "Arial", size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2800, 2200, 4360],
      rows: [
        new TableRow({ children: [headerCell("Field", 2800), headerCell("Required", 2200), headerCell("Description", 4360)] }),
        new TableRow({ children: [dataCell("SMTP Host", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("SMTP server hostname (e.g., smtp.gmail.com)", 4360)] }),
        new TableRow({ children: [dataCell("SMTP Port", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("Port number (e.g., 587 for TLS)", 4360)] }),
        new TableRow({ children: [dataCell("SMTP User", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("Mailbox address for authentication", 4360)] }),
        new TableRow({ children: [dataCell("App Password", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("Application-specific password (not the login password)", 4360)] }),
        new TableRow({ children: [dataCell("From Name", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("Display name for outgoing emails", 4360)] }),
        new TableRow({ children: [dataCell("From Email", 2800), dataCell("Yes", 2200, { color: "E74C3C" }), dataCell("Sender email address", 4360)] }),
        new TableRow({ children: [dataCell("Reply-To", 2800), dataCell("No", 2200, { color: "27AE60" }), dataCell("Optional reply-to address; defaults to From Email", 4360)] }),
      ]
    }),

    new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text: "Connection Status:", bold: true, font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "A status pill displays \"Connected\" (green) or \"Not connected\" (gray) based on the last verification result", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Verification runs automatically after saving configuration", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "If verification fails, the error message is displayed next to the status pill", font: "Arial", size: 22 })] }),

    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Security: Credentials are encrypted at rest using AES-256-GCM and never exposed through the API.", font: "Arial", size: 22, italics: true, color: "666666" })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.2 Test Email")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Below the SMTP form, a \"Send test email\" section allows administrators to verify the configuration. The button is disabled until the connection status shows \"Connected\". On success, a confirmation message is displayed and the recent activity table refreshes.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.3 Recent Activity")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "A table displays the most recent outbound emails with columns: Date, To, Subject, and Status (Sent/Failed). Failed messages are highlighted in red.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.4 Compose Tab")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The Compose tab provides a full email authoring interface:", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Subject line input", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Recipient Picker — dropdown with tabs for Individuals and Groups/Roles, plus CC/BCC email chip inputs", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Rich Text Editor — TipTap-based editor with toolbar (bold, italic, headings, lists, links)", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Attachment Upload — drag-and-drop zone with 10MB limit per file, displays uploaded files with remove option", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Schedule Control — radio buttons for \"Send now\" or \"Schedule for later\" with datetime picker", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Action buttons: Save as Draft, Send Now, Schedule", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Drafts & Scheduled list — filterable table showing status (Draft/Scheduled/Sent/Failed) with Edit, Send, and Delete actions", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("2.5 Email API Endpoints")] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 4680],
      rows: [
        new TableRow({ children: [headerCell("Method", 2340), headerCell("Endpoint", 2340), headerCell("Description", 4680)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/email/status", 2340), dataCell("Get SMTP connection status", 4680)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/email/recent", 2340), dataCell("Get recent email activity logs", 4680)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/email/config", 2340), dataCell("Get current SMTP configuration", 4680)] }),
        new TableRow({ children: [dataCell("PUT", 2340), dataCell("/email/config", 2340), dataCell("Save SMTP configuration", 4680)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/email/disconnect", 2340), dataCell("Disconnect email integration", 4680)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/email/test", 2340), dataCell("Send test email", 4680)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/email/attachments", 2340), dataCell("Upload email attachment", 4680)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/email/messages", 2340), dataCell("List messages (drafts, sent, etc.)", 4680)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/email/messages", 2340), dataCell("Create new message/draft", 4680)] }),
        new TableRow({ children: [dataCell("PUT", 2340), dataCell("/email/messages/:id", 2340), dataCell("Update existing message", 4680)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/email/messages/:id/send", 2340), dataCell("Send a draft message", 4680)] }),
        new TableRow({ children: [dataCell("DELETE", 2340), dataCell("/email/messages/:id", 2340), dataCell("Delete a message", 4680)] }),
      ]
    }),

    // ============================================================
    // SECTION 3: BACKUP
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("3. Backup & Restore")] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: "The Backup page provides database backup management with scheduling, retention, integrity verification, and point-in-time restore capabilities. It ensures data protection and disaster recovery readiness for the Wadjet GRC platform.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.1 Schedule & Retention")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "Administrators can configure automatic backup behavior:", font: "Arial", size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 6240],
      rows: [
        new TableRow({ children: [headerCell("Setting", 3120), headerCell("Description", 6240)] }),
        new TableRow({ children: [dataCell("Automatic backups", 3120), dataCell("Toggle to enable or disable scheduled backups", 6240)] }),
        new TableRow({ children: [dataCell("Run time (daily)", 3120), dataCell("Hour of the day to run the backup (00:00-23:00)", 6240)] }),
        new TableRow({ children: [dataCell("Keep last N", 3120), dataCell("Number of recent backups to retain (1-90); older backups are purged automatically", 6240)] }),
      ]
    }),
    new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "A status chip shows 'Scheduler on' (green) or 'Scheduler off' (gray). The last run time and result summary are displayed below the form. Changes are saved via the 'Save settings' button.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.2 Protection Posture")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "An info panel on the right side provides at-a-glance protection information:", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "SHA-256 checksum verification on every backup; integrity is checked before any restore", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Full-database snapshots (all collections) in native MongoDB BSON format, zip-packed", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Daily automatic runs with configurable retention window", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "bullets", level: 0 }, children: [new TextRun({ text: "Restore creates a safety backup of the current state before applying the restore", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.3 Backup History")]),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "A table lists all backup records with the following columns:", font: "Arial", size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 1560, 1560, 1560, 1170, 1170],
      rows: [
        new TableRow({ children: [headerCell("File", 2340), headerCell("Trigger", 1560), headerCell("Size", 1560), headerCell("Collections", 1560), headerCell("Docs", 1170), headerCell("Created", 1170)] }),
        new TableRow({ children: [dataCell("backup-20260823-0200.bak.zip", 2340), dataCell("scheduled", 1560), dataCell("24.5 MB", 1560), dataCell("12", 1560), dataCell("8,420", 1170), dataCell("Aug 23, 2026", 1170)] }),
      ]
    }),
    new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Each row includes Download and Delete action buttons. The checksum is displayed truncated (first 10 chars). Failed backups show the error message and are highlighted in red.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.4 On-Demand Backup") }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The \"Backup now\" button in the page header triggers an immediate backup outside the schedule. A loading spinner is displayed during the operation, and the history table refreshes automatically upon completion.", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.5 Restore") }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The \"Restore\" button opens a modal dialog with safety measures:", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers2", level: 0 }, children: [new TextRun({ text: "Warning banner explaining that restoring replaces all current data", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers2", level: 0 }, children: [new TextRun({ text: "File picker for selecting a backup file (.zip, .gz, .bak)", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers2", level: 0 }, children: [new TextRun({ text: "Confirmation text input requiring the user to type \"RESTORE\" (7 characters) to enable the restore button", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers2", level: 0 }, children: [new TextRun({ text: "On success: a safety backup of the current state is created automatically, then the selected backup is applied", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers2", level: 0 }, children: [new TextRun({ text: "The restore result shows the number of collections restored and the safety backup filename", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.6 Export to Excel")]),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The \"Export to Excel\" button generates a downloadable Excel/CSV export of platform data with a timestamped filename (e.g., wadjet-data-export-2026-08-23T14-30-00.xlsx).", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("3.7 Backup API Endpoints")] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 3510, 3510],
      rows: [
        new TableRow({ children: [headerCell("Method", 2340), headerCell("Endpoint", 3510), headerCell("Description", 3510)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/backup/config", 3510), dataCell("Get backup configuration", 3510)] }),
        new TableRow({ children: [dataCell("PUT", 2340), dataCell("/backup/config", 3510), dataCell("Save backup configuration", 3510)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/backup/run", 3510), dataCell("Trigger an immediate backup", 3510)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/backup/records", 3510), dataCell("List all backup records", 3510)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/backup/records/:id/download", 3510), dataCell("Download a specific backup file", 3510)] }),
        new TableRow({ children: [dataCell("DELETE", 2340), dataCell("/backup/records/:id", 3510), dataCell("Delete a backup record", 3510)] }),
        new TableRow({ children: [dataCell("GET", 2340), dataCell("/backup/export", 3510), dataCell("Export data to Excel/CSV", 3510)] }),
        new TableRow({ children: [dataCell("POST", 2340), dataCell("/backup/restore", 3510), dataCell("Restore from a backup file", 3510)] }),
      ]
    }),

    // ============================================================
    // SECTION 4: DATA FLOW
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("4. Data Flow & Architecture")] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.1 Mail Data Flow")] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "Administrator navigates to /settings/mail and the Settings tab loads SMTP config from GET /email/config", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "Connection status is fetched from GET /email/status", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "Recent activity is loaded from GET /email/recent", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "On \"Save & verify\": credentials are sent via PUT /email/config, server encrypts with AES-256-GCM and stores", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "After save, GET /email/status is called to verify the connection", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers3", level: 0 }, children: [new TextRun({ text: "Compose tab: messages are managed via CRUD endpoints and can be saved as drafts or sent immediately", font: "Arial", size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun("4.2 Backup Data Flow")] }),
    new Paragraph({ numbering: { reference: "numbers4", level: 0 }, children: [new TextRun({ text: "On page load: GET /backup/config and GET /backup/records are called in parallel", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers4", level: 0 }, children: [new TextRun({ text: "On \"Save settings\": PUT /backup/config persists the schedule configuration", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers4", level: 0 }, children: [new TextRun({ text: "On \"Backup now\": POST /backup/run triggers the backup pipeline", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers4", level: 0 }, children: [new TextRun({ text: "On restore: POST /backup/restore with the backup file; server creates a safety backup, then applies the restore", font: "Arial", size: 22 })] }),
    new Paragraph({ numbering: { reference: "numbers4", level: 0 }, children: [new TextRun({ text: "On export: GET /backup/export returns a downloadable .xlsx file", font: "Arial", size: 22 })] }),

    // ============================================================
    // SECTION 5: COMPONENT INVENTORY
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("5. Component Inventory")] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 3120, 3120],
      rows: [
        new TableRow({ children: [headerCell("Component", 3120), headerCell("File Path", 3120), headerCell("Lines", 3120)] }),
        new TableRow({ children: [dataCell("Mail Page", 3120), dataCell("client/src/pages/settings/Mail.jsx", 3120), dataCell("303", 3120)] }),
        new TableRow({ children: [dataCell("Backup Page", 3120), dataCell("client/src/pages/settings/Backup.jsx", 3120), dataCell("385", 3120)] }),
        new TableRow({ children: [dataCell("Email Compose", 3120), dataCell("client/src/pages/settings/mail/EmailCompose.jsx", 3120), dataCell("205", 3120)] }),
        new TableRow({ children: [dataCell("Schedule Control", 3120), dataCell("client/src/pages/settings/mail/ScheduleControl.jsx", 3120), dataCell("53", 3120)] }),
        new TableRow({ children: [dataCell("Rich Text Editor", 3120), dataCell("client/src/pages/settings/mail/RichTextEditor.jsx", 3120), dataCell("83", 3120)] }),
        new TableRow({ children: [dataCell("Recipient Picker", 3120), dataCell("client/src/pages/settings/mail/RecipientPicker.jsx", 3120), dataCell("254", 3120)] }),
        new TableRow({ children: [dataCell("Draft List", 3120), dataCell("client/src/pages/settings/mail/DraftList.jsx", 3120), dataCell("177", 3120)] }),
        new TableRow({ children: [dataCell("Attachment Upload", 3120), dataCell("client/src/pages/settings/mail/AttachmentUpload.jsx", 3120), dataCell("100", 3120)] }),
      ]
    }),

    // ============================================================
    // SECTION 6: NAVIGATION
    // ============================================================
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun("6. Navigation & Access Control")] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: "The Settings module is accessible from the main navigation sidebar. It is grouped under a \"Settings\" section with the gear icon. The section contains two navigation items:", font: "Arial", size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [1560, 2340, 2340, 3120],
      rows: [
        new TableRow({ children: [headerCell("Icon", 1560), headerCell("Label", 2340), headerCell("Route", 2340), headerCell("Description", 3120)] }),
        new TableRow({ children: [dataCell("Mail", 1560), dataCell("Mail", 2340), dataCell("/settings/mail", 2340), dataCell("SMTP settings & compose", 3120)] }),
        new TableRow({ children: [dataCell("DatabaseBackup", 1560), dataCell("Backup", 2340), dataCell("/settings/backup", 2340), dataCell("Backup schedule & restore", 3120)] }),
      ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Both routes are wrapped in a ProtectedRoute, ensuring only authenticated users can access them. The sidebar is rendered by the AppLayout component which reads NAV_SECTIONS from the nav.js configuration.", font: "Arial", size: 22 })] }),
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("Settings_Module_Documentation.docx", buffer);
  console.log("Done: Settings_Module_Documentation.docx");
});
