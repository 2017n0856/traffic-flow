"use client";

import { IncidentReportForm } from "@/features/admin/components/IncidentReportForm";
import { adminBodyMutedClass, adminPageTitleClass } from "@/lib/ui/form";

export function AdminControlCenter() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className={adminPageTitleClass}>Incident Report</h1>
        <p className={`mt-1 ${adminBodyMutedClass}`}>
          Manage operations, open moderation queues, and submit incidents.
        </p>
      </div>

      <IncidentReportForm largeTypography />
    </div>
  );
}
