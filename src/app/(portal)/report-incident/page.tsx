import { IncidentReportForm } from "@/features/admin/components/IncidentReportForm";

export default function ReportIncidentPage() {
  return (
    <IncidentReportForm
      defaultStatus="pending"
      successMessage="Incident submitted successfully. It is pending admin approval."
      helperText="Create a new incident marker and send it to admins for approval."
    />
  );
}
