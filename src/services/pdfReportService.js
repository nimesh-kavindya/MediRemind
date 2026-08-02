import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

/**
 * Generates a professional Medical & Medication Report PDF for the user
 * @param {Object} userData User info (name, email)
 * @param {Array} medications List of user medications
 */
export const generateMedicationReportPDF = (userData = {}, medications = [], doseLogs = []) => {
  try {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const primaryColor = [13, 148, 136]; // Teal #0d9488
    const headerBgColor = [241, 245, 249]; // Slate 100
    const textColor = [15, 23, 42]; // Slate 900
    const mutedTextColor = [100, 116, 139]; // Slate 500

    const patientName = userData?.name || userData?.displayName || userData?.fullName || 'Valued Patient';
    const patientEmail = userData?.email || 'N/A';
    const reportDate = format(new Date(), 'PPP p');
    const reportId = `MR-${Math.floor(100000 + Math.random() * 900000)}`;

    const safeMeds = (Array.isArray(medications) ? medications : [])
      .filter(m => m && !m.archived && !m.isDeleted && m.name);
    const safeLogs = Array.isArray(doseLogs) && doseLogs.length > 0 
      ? doseLogs.filter(Boolean) 
      : JSON.parse(localStorage.getItem('dose_logs') || '[]');

    // 1. Header Banner
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 24, 'F');

    // App Brand Name
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('MediRemind', 14, 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text('Personal Health & Prescription Report', 120, 15, { align: 'left' });

    // 2. Report & Patient Details Box
    doc.setFillColor(...headerBgColor);
    doc.roundedRect(14, 30, 182, 32, 3, 3, 'F');

    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Patient Information', 20, 39);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...mutedTextColor);
    doc.text(`Name: `, 20, 46);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${patientName}`, 33, 46);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Email: `, 20, 53);
    doc.setTextColor(...textColor);
    doc.text(`${patientEmail}`, 33, 53);

    // Right side report metadata
    doc.setTextColor(...mutedTextColor);
    doc.text(`Report ID: `, 125, 39);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${reportId}`, 150, 39);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...mutedTextColor);
    doc.text(`Generated: `, 125, 46);
    doc.setTextColor(...textColor);
    doc.text(`${reportDate}`, 150, 46);

    // Deduplicate active medications by unique ID or normalized Name
    const activeUniqueMeds = Array.from(
      new Map(safeMeds.map(item => [item?.id || item?.name?.toLowerCase().trim(), item])).values()
    ).filter(Boolean);

    doc.setTextColor(...mutedTextColor);
    doc.text(`Total Medications: `, 125, 53);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`${activeUniqueMeds.length}`, 160, 53);

    // 3. Table of Medications
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(...textColor);
    doc.text('Active Medication Schedule', 14, 70);

    const formatTimeString = (timeStr) => {
      if (!timeStr || typeof timeStr !== 'string') return 'Not set';
      const cleaned = timeStr.trim();
      if (cleaned.toUpperCase().includes('AM') || cleaned.toUpperCase().includes('PM')) {
        return cleaned.toUpperCase();
      }
      const parts = cleaned.split(':');
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10) || 0;
      if (isNaN(hours)) return 'Not set';
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const strHours = hours < 10 ? `0${hours}` : `${hours}`;
      const strMins = minutes < 10 ? `0${minutes}` : `${minutes}`;
      return `${strHours}:${strMins} ${ampm}`;
    };

    const todayStr = new Date().toISOString().split('T')[0];

    const tableData = activeUniqueMeds.map((med, index) => {
      const rawTimes = Array.isArray(med.reminderTime) 
        ? med.reminderTime 
        : [med.reminderTime || '08:00'];
      
      const formattedTimes = rawTimes.map(t => formatTimeString(t)).join(', ');

      const mealTiming = med.mealTiming 
        ? med.mealTiming.replace('_', ' ').toUpperCase() 
        : 'NONE';

      const isTakenInLogs = safeLogs.some(l => {
        if (!l) return false;
        const matchesId = (l.medicationId === med.id || l.medId === med.id);
        const matchesName = (l.medicationName?.toLowerCase() === med.name?.toLowerCase() || l.medName?.toLowerCase() === med.name?.toLowerCase());
        const isToday = (l.dateStr === todayStr || l.date === todayStr || (l.timestamp && l.timestamp.startsWith(todayStr)));
        const isTaken = (l.status?.toLowerCase() === 'taken' || l.status?.toLowerCase() === 'completed');
        return (matchesId || matchesName) && isToday && isTaken;
      });

      const isTaken = med.taken || med.status?.toLowerCase() === 'taken' || isTakenInLogs;

      return [
        (index + 1).toString(),
        med.name || 'Unnamed',
        med.dosage || '-',
        med.frequency || 'Daily',
        formattedTimes,
        mealTiming,
        isTaken ? 'Taken Today' : 'Pending'
      ];
    });

    autoTable(doc, {
      startY: 74,
      head: [['#', 'Medication Name', 'Dosage', 'Frequency', 'Scheduled Time', 'Meal Timing', 'Today Status']],
      body: tableData.length > 0 ? tableData : [['-', 'No medications logged yet', '-', '-', '-', '-', '-']],
      theme: 'grid',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9
      },
      bodyStyles: {
        fontSize: 8.5,
        textColor: [30, 41, 59]
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252]
      },
      margin: { left: 14, right: 14 }
    });

    // 4. Notes & Guidelines Box
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 120;

    if (finalY < 230) {
      doc.setFillColor(240, 253, 250); // Teal soft tint
      doc.setDrawColor(20, 184, 166);
      doc.roundedRect(14, finalY, 182, 30, 2, 2, 'FD');

      doc.setTextColor(15, 118, 110);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Important Medical Notes & Guidelines', 20, finalY + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text('• Keep this schedule updated with your prescribing physician or pharmacist.', 20, finalY + 15);
      doc.text('• Do not alter dosages without consulting your primary healthcare provider.', 20, finalY + 20);
      doc.text('• In case of emergency or adverse reaction, seek immediate medical attention.', 20, finalY + 25);
    }

    // 5. Footer with Page Number
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(`MediRemind Confidential Report • Page ${i} of ${pageCount}`, 105, 287, { align: 'center' });
    }

    // Save PDF
    const cleanName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`MediRemind_Report_${cleanName}.pdf`);
  } catch (err) {
    console.error('Failed to generate PDF Report:', err);
    throw err;
  }
};
