/** Trạng thái hồ sơ giáo viên (giống getStatusText của web ViewAdmin/AppTeacher). */
export function teacherStatusText(status: number | null | undefined): string {
  switch (status) {
    case 0:
      return 'Created';
    case 1:
      return 'Submitted';
    case 2:
      return 'Approved By Admin';
    case 3:
      return 'Rejected By Admin';
    case 4:
      return 'Approved Teacher';
    case 5:
      return 'Rejected Teacher';
    case 6:
      return 'Banned';
    default:
      return 'Unknown';
  }
}
