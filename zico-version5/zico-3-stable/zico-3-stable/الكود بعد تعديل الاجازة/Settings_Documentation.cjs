const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, LevelFormat, PageBreak } = docx;

const border = { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' };
const borders = { top: border, bottom: border, left: border, right: border };
const cellMargins = { top: 80, bottom: 80, left: 120, right: 120 };

const hCell = (text, width) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: { fill: '1A1A2E', type: ShadingType.CLEAR },
  margins: cellMargins,
  children: [new Paragraph({ children: [new TextRun({ text, bold: true, font: 'Arial', size: 20, color: 'FFFFFF' })] })],
});

const dCell = (text, width, opts) => new TableCell({
  borders, width: { size: width, type: WidthType.DXA },
  shading: opts && opts.fill ? { fill: opts.fill, type: ShadingType.CLEAR } : undefined,
  margins: cellMargins,
  children: [new Paragraph({ children: [new TextRun({ text, font: 'Arial', size: 20, color: (opts && opts.color) || '333333' })] })],
});

const doc = new Document({
  styles: {
    default: { document: { run: { font: 'Arial', size: 24 } } },
    paragraphStyles: [
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 36, bold: true, font: 'Arial', color: '1A1A2E' },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true,
        run: { size: 28, bold: true, font: 'Arial', color: '2E75B6' },
        paragraph: { spacing: { before: 280, after: 160 }, outlineLevel: 1 } },
    ]
  },
  sections: [
    {
      properties: {
        page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }
      },
      children: [
        new Paragraph({ spacing: { before: 3000 }, children: [new TextRun({ text: '', font: 'Arial', size: 24 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Wadjet GRC Platform', font: 'Arial', size: 52, bold: true, color: '1A1A2E' })] }),
        new Paragraph({ spacing: { before: 200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Settings Module', font: 'Arial', size: 44, bold: true, color: '2E75B6' })] }),
        new Paragraph({ spacing: { before: 400 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Functional Description & Technical Specification', font: 'Arial', size: 28, color: '666666' })] }),
        new Paragraph({ spacing: { before: 1200 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Version 1.0', font: 'Arial', size: 24, color: '999999' })] }),
        new Paragraph({ spacing: { before: 100 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'August 2026', font: 'Arial', size: 24, color: '999999' })] }),
      ]
    },

    new Paragraph({ children: [new PageBreak()] }),

    // SECTION 1: OVERVIEW
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '1. Module Overview' })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'The Settings module provides system administrators with the ability to configure two critical platform capabilities: outbound email integration (Mail) and database backup management (Backup). These settings are accessible from the main navigation sidebar under the Settings section.', font: 'Arial', size: 22 })] }),
    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '1.1 Target Users' })] }),
    new Paragraph({ children: [new TextRun({ text: 'System Administrators \u2014 responsible for SMTP configuration and email notification management', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Database Administrators \u2014 responsible for backup scheduling, retention, and restore operations', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Compliance Managers \u2014 compose and schedule outbound communications to stakeholders', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '1.2 Routes & Access' })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 6240],
      rows: [
        new TableRow({ children: [hCell('Route', 3120), hCell('Page', 6240)] }),
        new TableRow({ children: [dCell('/settings/mail', 3120), dCell('Mail \u2014 SMTP configuration and email composition', 6240)] }),
        new TableRow({ children: [dCell('/settings/backup', 3120), dCell('Backup \u2014 Scheduled backups and restore management', 6240)] }),
      ]
    }),

    // SECTION 2: MAIL
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '2. Mail Settings' })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'The Mail page provides two functional areas accessible via tabs: SMTP configuration and email composition. It enables the platform to send automated notifications, compliance alerts, and user-composed messages through an external SMTP relay.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.1 SMTP Configuration Tab' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'The Settings tab presents a form for configuring the SMTP relay connection. Fields include:', font: 'Arial', size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2800, 2200, 4360],
      rows: [
        new TableRow({ children: [hCell('Field', 2800), hCell('Required', 2200), hCell('Description', 4360)] }),
        new TableRow({ children: [dCell('SMTP Host', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('SMTP server hostname (e.g., smtp.gmail.com)', 4360)] }),
        new TableRow({ children: [dCell('SMTP Port', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('Port number (e.g., 587 for TLS)', 4360)] }),
        new TableRow({ children: [dCell('SMTP User', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('Mailbox address for authentication', 4360)] }),
        new TableRow({ children: [dCell('App Password', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('Application-specific password', 4360)] }),
        new TableRow({ children: [dCell('From Name', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('Display name for outgoing emails', 4360)] }),
        new TableRow({ children: [dCell('From Email', 2800), dCell('Yes', 2200, { color: 'E74C3C' }), dCell('Sender email address', 4360)] }),
        new TableRow({ children: [dCell('Reply-To', 2800), dCell('No', 2200, { color: '27AE60' }), dCell('Optional reply-to address; defaults to From Email', 4360)] }),
      ]
    }),
    new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: 'Connection Status:', bold: true, font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'A status pill displays Connected (green) or Not connected (gray) based on the last verification result.', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Verification runs automatically after saving configuration.', font: 'Arial', size: 22 })] }),
    new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: 'Security: Credentials are encrypted at rest using AES-256-GCM and never exposed through the API.', font: 'Arial', size: 22, italics: true, color: '666666' })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.2 Test Email' })] }),
    new Paragraph({ children: [new TextRun({ text: 'Below the SMTP form, a Send test email section allows administrators to verify the configuration. The button is disabled until the connection status shows Connected. On success, a confirmation message is displayed and the recent activity table refreshes.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.3 Recent Activity' })] }),
    new Paragraph({ children: [new TextRun({ text: 'A table displays the most recent outbound emails with columns: Date, To, Subject, and Status (Sent/Failed). Failed messages are highlighted in red.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.4 Compose Tab' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'The Compose tab provides a full email authoring interface with the following capabilities:', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Subject line input', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Recipient Picker \u2014 dropdown with tabs for Individuals and Groups/Roles, plus CC/BCC email chip inputs', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Rich Text Editor \u2014 TipTap-based editor with toolbar (bold, italic, headings, lists, links)', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Attachment Upload \u2014 drag-and-drop zone with 10MB limit per file, displays uploaded files with remove option', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Schedule Control \u2014 radio buttons for Send now or Schedule for later with datetime picker', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Action buttons: Save as Draft, Send Now, Schedule', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Drafts & Scheduled list \u2014 filterable table with Edit, Send, and Delete actions', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '2.5 Email API Endpoints' })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 2340, 4680],
      rows: [
        new TableRow({ children: [hCell('Method', 2340), hCell('Endpoint', 2340), hCell('Description', 4680)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/email/status', 2340), dCell('Get SMTP connection status', 4680)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/email/recent', 2340), dCell('Get recent email activity logs', 4680)] }),
        new TableRow({ children: [dCell('PUT', 2340), dCell('/email/config', 2340), dCell('Save SMTP configuration', 4680)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/email/disconnect', 2340), dCell('Disconnect email integration', 4680)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/email/test', 2340), dCell('Send test email', 4680)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/email/messages', 2340), dCell('List messages (drafts, sent, etc.)', 4680)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/email/messages', 2340), dCell('Create new message/draft', 4680)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/email/messages/:id/send', 2340), dCell('Send a draft message', 4680)] }),
        new TableRow({ children: [dCell('DELETE', 2340), dCell('/email/messages/:id', 2340), dCell('Delete a message', 4680)] }),
      ]
    }),

    // SECTION 3: BACKUP
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '3. Backup & Restore' })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'The Backup page provides database backup management with scheduling, retention, integrity verification, and point-in-time restore capabilities. It ensures data protection and disaster recovery readiness for the Wadjet GRC platform.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.1 Schedule & Retention' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'Administrators can configure automatic backup behavior:', font: 'Arial', size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 6240],
      rows: [
        new TableRow({ children: [hCell('Setting', 3120), hCell('Description', 6240)] }),
        new TableRow({ children: [dCell('Automatic backups', 3120), dCell('Toggle to enable or disable scheduled backups', 6240)] }),
        new TableRow({ children: [dCell('Run time (daily)', 3120), dCell('Hour of the day to run the backup (00:00-23:00)', 6240)] }),
        new TableRow({ children: [dCell('Keep last N', 3120), dCell('Number of recent backups to retain (1-90)', 6240)] }),
      ]
    }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.2 Protection Posture' })] }),
    new Paragraph({ children: [new TextRun({ text: 'SHA-256 checksum verification on every backup; integrity is checked before any restore', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Full-database snapshots (all collections) in native MongoDB BSON format, zip-packed', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Daily automatic runs with configurable retention window', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Restore creates a safety backup of the current state before applying the restore', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.3 Backup History' })] }),
    new Paragraph({ children: [new TextRun({ text: 'A table lists all backup records with columns: File, Trigger, Size, Collections, Docs, Created, Checksum. Failed backups show the error message in red.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.4 On-Demand Backup' })] }),
    new Paragraph({ children: [new TextRun({ text: 'The Backup now button in the page header triggers an immediate backup outside the schedule. A loading spinner is displayed during the operation.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.5 Restore' })] }),
    new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: 'The Restore button opens a modal dialog with safety measures:', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Warning banner explaining that restoring replaces all current data', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'File picker for selecting a backup file (.zip, .gz, .bak)', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'Confirmation text input requiring the user to type RESTORE to enable the restore button', font: 'Arial', size: 22 })] }),
    new Paragraph({ children: [new TextRun({ text: 'On success: a safety backup is created automatically, then the selected backup is applied', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.6 Export to Excel' })] }),
    new Paragraph({ children: [new TextRun({ text: 'The Export to Excel button generates a downloadable Excel/CSV export with a timestamped filename.', font: 'Arial', size: 22 })] }),

    new Paragraph({ heading: HeadingLevel.HEADING_2, children: [new TextRun({ text: '3.7 Backup API Endpoints' })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [2340, 3510, 3510],
      rows: [
        new TableRow({ children: [hCell('Method', 2340), hCell('Endpoint', 3510), hCell('Description', 3510)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/backup/config', 3510), dCell('Get backup configuration', 3510)] }),
        new TableRow({ children: [dCell('PUT', 2340), dCell('/backup/config', 3510), dCell('Save backup configuration', 3510)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/backup/run', 3510), dCell('Trigger an immediate backup', 3510)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/backup/records', 3510), dCell('List all backup records', 3510)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/backup/records/:id/download', 3510), dCell('Download a specific backup file', 3510)] }),
        new TableRow({ children: [dCell('DELETE', 2340), dCell('/backup/records/:id', 3510), dCell('Delete a backup record', 3510)] }),
        new TableRow({ children: [dCell('GET', 2340), dCell('/backup/export', 3510), dCell('Export data to Excel/CSV', 3510)] }),
        new TableRow({ children: [dCell('POST', 2340), dCell('/backup/restore', 3510), dCell('Restore from a backup file', 3510)] }),
      ]
    }),

    // SECTION 4: COMPONENT INVENTORY
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '4. Component Inventory' })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [3120, 3120, 3120],
      rows: [
        new TableRow({ children: [hCell('Component', 3120), hCell('File Path', 3120), hCell('Lines', 3120)] }),
        new TableRow({ children: [dCell('Mail Page', 3120), dCell('client/src/pages/settings/Mail.jsx', 3120), dCell('303', 3120)] }),
        new TableRow({ children: [dCell('Backup Page', 3120), dCell('client/src/pages/settings/Backup.jsx', 3120), dCell('385', 3120)] }),
        new TableRow({ children: [dCell('Email Compose', 3120), dCell('mail/EmailCompose.jsx', 3120), dCell('205', 3120)] }),
        new TableRow({ children: [dCell('Schedule Control', 3120), dCell('mail/ScheduleControl.jsx', 3120), dCell('53', 3120)] }),
        new TableRow({ children: [dCell('Rich Text Editor', 3120), dCell('mail/RichTextEditor.jsx', 3120), dCell('83', 3120)] }),
        new TableRow({ children: [dCell('Recipient Picker', 3120), dCell('mail/RecipientPicker.jsx', 3120), dCell('254', 3120)] }),
        new TableRow({ children: [dCell('Draft List', 3120), dCell('mail/DraftList.jsx', 3120), dCell('177', 3120)] }),
        new TableRow({ children: [dCell('Attachment Upload', 3120), dCell('mail/AttachmentUpload.jsx', 3120), dCell('100', 3120)] }),
      ]
    }),

    // SECTION 5: NAVIGATION
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({ heading: HeadingLevel.HEADING_1, children: [new TextRun({ text: '5. Navigation & Access Control' })] }),
    new Paragraph({ spacing: { after: 200 }, children: [new TextRun({ text: 'The Settings module is accessible from the main navigation sidebar under the Settings section with the gear icon. Both routes are wrapped in a ProtectedRoute, ensuring only authenticated users can access them.', font: 'Arial', size: 22 })] }),
    new Table({
      width: { size: 9360, type: WidthType.DXA },
      columnWidths: [1560, 2340, 2340, 3120],
      rows: [
        new TableRow({ children: [hCell('Icon', 1560), hCell('Label', 2340), hCell('Route', 2340), hCell('Description', 3120)] }),
        new TableRow({ children: [dCell('Mail', 1560), dCell('Mail', 2340), dCell('/settings/mail', 2340), dCell('SMTP settings & compose', 3120)] }),
        new TableRow({ children: [dCell('DatabaseBackup', 1560), dCell('Backup', 2340), dCell('/settings/backup', 2340), dCell('Backup schedule & restore', 3120)] }),
      ]
    }),
  ]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync('Settings_Module_Documentation.docx', buffer);
  console.log('Done: Settings_Module_Documentation.docx');
});
