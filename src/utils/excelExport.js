import * as XLSX from 'xlsx';

// Export attendance data to Excel
export const exportAttendanceToExcel = (attendanceData, sessionData, fileName = null) => {
  try {
    // Prepare data for Excel export
    const worksheetData = [];
    
    // Add header information
    worksheetData.push([
      'Smart Attendance Management System',
      '',
      '',
      '',
      '',
      ''
    ]);
    worksheetData.push([
      'Attendance Report',
      '',
      '',
      '',
      '',
      ''
    ]);
    worksheetData.push(['']); // Empty row
    
    // Add session details
    if (sessionData) {
      worksheetData.push([
        'Session Details:',
        '',
        '',
        '',
        '',
        ''
      ]);
      worksheetData.push([
        'Subject:',
        sessionData.subject || 'N/A',
        '',
        'Session ID:',
        sessionData.sessionId || 'N/A',
        ''
      ]);
      worksheetData.push([
        'Date:',
        sessionData.createdAt ? new Date(sessionData.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString(),
        '',
        'Time:',
        sessionData.createdAt ? new Date(sessionData.createdAt.toDate()).toLocaleTimeString() : new Date().toLocaleTimeString(),
        ''
      ]);
      worksheetData.push([
        'Location:',
        sessionData.location?.address || 'Manual Location',
        '',
        'Status:',
        sessionData.isActive ? 'Active' : 'Ended',
        ''
      ]);
      worksheetData.push(['']); // Empty row
    }
    
    // Add column headers
    worksheetData.push([
      'S.No.',
      'Student ID',
      'Student Name',
      'Status',
      'Check-in Time',
      'Remarks'
    ]);
    
    // Sort students by Student ID in ascending order (as requested)
    const sortedData = [...attendanceData].sort((a, b) => {
      const idA = a.studentId || '';
      const idB = b.studentId || '';
      return idA.localeCompare(idB);
    });
    
    // Add attendance data
    sortedData.forEach((record, index) => {
      worksheetData.push([
        index + 1,
        record.studentId || 'N/A',
        record.studentName || 'N/A',
        (record.status || 'Present').charAt(0).toUpperCase() + (record.status || 'Present').slice(1),
        record.markedAt ? new Date(record.markedAt.toDate()).toLocaleTimeString() : 'N/A',
        record.status === 'late' ? 'Late arrival' : record.status === 'absent' ? 'Absent' : 'On time'
      ]);
    });
    
    // Add summary
    worksheetData.push(['']); // Empty row
    worksheetData.push([
      'Summary:',
      '',
      '',
      '',
      '',
      ''
    ]);
    
    const stats = calculateAttendanceStats(attendanceData);
    worksheetData.push([
      'Total Students:',
      stats.total,
      '',
      'Present:',
      stats.present,
      ''
    ]);
    worksheetData.push([
      'Absent:',
      stats.absent,
      '',
      'Late:',
      stats.late,
      ''
    ]);
    worksheetData.push([
      'Attendance Rate:',
      `${stats.attendanceRate}%`,
      '',
      '',
      '',
      ''
    ]);
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 8 },  // S.No.
      { wch: 15 }, // Student ID
      { wch: 25 }, // Student Name
      { wch: 12 }, // Status
      { wch: 15 }, // Check-in Time
      { wch: 20 }  // Remarks
    ];
    
    // Add some styling (merge cells for headers)
    worksheet['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: 5 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: 5 } }  // Session Details header
    ];
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
    
    // Generate filename
    const defaultFileName = `attendance_${sessionData?.subject || 'report'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFileName = fileName || defaultFileName;
    
    // Write and download file
    XLSX.writeFile(workbook, finalFileName);
    
    return {
      success: true,
      fileName: finalFileName,
      message: 'Excel file downloaded successfully'
    };
    
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export Excel file'
    };
  }
};

// Export multiple sessions to Excel with separate sheets
export const exportMultipleSessionsToExcel = (sessionsData, fileName = null) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Create summary sheet
    const summaryData = [];
    summaryData.push(['Smart Attendance Management System - Multi-Session Report']);
    summaryData.push(['Generated on:', new Date().toLocaleString()]);
    summaryData.push(['']); // Empty row
    
    summaryData.push(['Session Summary:']);
    summaryData.push(['S.No.', 'Subject', 'Date', 'Time', 'Total Students', 'Present', 'Absent', 'Late', 'Attendance Rate']);
    
    sessionsData.forEach((sessionGroup, index) => {
      const { session, attendance } = sessionGroup;
      const stats = calculateAttendanceStats(attendance);
      
      summaryData.push([
        index + 1,
        session.subject || 'N/A',
        session.createdAt ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'N/A',
        session.createdAt ? new Date(session.createdAt.toDate()).toLocaleTimeString() : 'N/A',
        stats.total,
        stats.present,
        stats.absent,
        stats.late,
        `${stats.attendanceRate}%`
      ]);
    });
    
    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [
      { wch: 8 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, 
      { wch: 15 }, { wch: 10 }, { wch: 10 }, { wch: 8 }, { wch: 15 }
    ];
    
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    
    // Create individual sheets for each session
    sessionsData.forEach((sessionGroup, index) => {
      const { session, attendance } = sessionGroup;
      const sheetData = [];
      
      // Add session header
      sheetData.push([`${session.subject || 'Session'} - Attendance`]);
      sheetData.push([
        'Date:', 
        session.createdAt ? new Date(session.createdAt.toDate()).toLocaleDateString() : 'N/A',
        '',
        'Time:',
        session.createdAt ? new Date(session.createdAt.toDate()).toLocaleTimeString() : 'N/A'
      ]);
      sheetData.push(['']);
      
      // Add headers
      sheetData.push(['S.No.', 'Student ID', 'Student Name', 'Status', 'Check-in Time']);
      
      // Sort and add attendance data
      const sortedAttendance = [...attendance].sort((a, b) => 
        (a.studentId || '').localeCompare(b.studentId || '')
      );
      
      sortedAttendance.forEach((record, idx) => {
        sheetData.push([
          idx + 1,
          record.studentId || 'N/A',
          record.studentName || 'N/A',
          (record.status || 'Present').charAt(0).toUpperCase() + (record.status || 'Present').slice(1),
          record.markedAt ? new Date(record.markedAt.toDate()).toLocaleTimeString() : 'N/A'
        ]);
      });
      
      const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
      worksheet['!cols'] = [
        { wch: 8 }, { wch: 15 }, { wch: 25 }, { wch: 12 }, { wch: 15 }
      ];
      
      const sheetName = `${session.subject || 'Session'}_${index + 1}`.substring(0, 31); // Excel sheet name limit
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    });
    
    // Generate filename
    const defaultFileName = `attendance_multi_sessions_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFileName = fileName || defaultFileName;
    
    // Write and download file
    XLSX.writeFile(workbook, finalFileName);
    
    return {
      success: true,
      fileName: finalFileName,
      message: 'Multi-session Excel file downloaded successfully'
    };
    
  } catch (error) {
    console.error('Error exporting multiple sessions to Excel:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export multi-session Excel file'
    };
  }
};

// Helper function to calculate attendance statistics
const calculateAttendanceStats = (attendanceData) => {
  const total = attendanceData.length;
  const present = attendanceData.filter(record => 
    record.status === 'present' || !record.status
  ).length;
  const late = attendanceData.filter(record => 
    record.status === 'late'
  ).length;
  const absent = total - present - late;
  const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 0;
  
  return { total, present, late, absent, attendanceRate };
};

// Export template for bulk upload
export const exportAttendanceTemplate = (studentList = null, fileName = null) => {
  try {
    const templateData = [];
    
    // Add instructions
    templateData.push(['Smart Attendance Management System - Bulk Upload Template']);
    templateData.push(['Instructions: Fill in the Status column with: Present, Absent, or Late']);
    templateData.push(['']); // Empty row
    
    // Add headers
    templateData.push(['Student ID', 'Student Name', 'Status', 'Remarks']);
    
    // Add sample data or provided student list
    if (studentList && studentList.length > 0) {
      studentList.forEach(student => {
        templateData.push([
          student.studentId || student.id || '',
          student.studentName || student.name || '',
          '', // Empty status for filling
          '' // Empty remarks
        ]);
      });
    } else {
      // Add sample rows for template
      for (let i = 1; i <= 10; i++) {
        templateData.push([
          `ST${i.toString().padStart(3, '0')}`,
          `Student ${i}`,
          '',
          ''
        ]);
      }
    }
    
    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(templateData);
    
    // Set column widths
    worksheet['!cols'] = [
      { wch: 15 }, // Student ID
      { wch: 25 }, // Student Name
      { wch: 12 }, // Status
      { wch: 20 }  // Remarks
    ];
    
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Template');
    
    // Generate filename
    const defaultFileName = `attendance_template_${new Date().toISOString().split('T')[0]}.xlsx`;
    const finalFileName = fileName || defaultFileName;
    
    // Write and download file
    XLSX.writeFile(workbook, finalFileName);
    
    return {
      success: true,
      fileName: finalFileName,
      message: 'Template file downloaded successfully'
    };
    
  } catch (error) {
    console.error('Error exporting template:', error);
    return {
      success: false,
      error: error.message,
      message: 'Failed to export template file'
    };
  }
};