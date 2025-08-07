import React from "react";
import AdminLayout from "../components/common/AdminLayout";
import { AuditLogViewer } from "../components/audit";

const AuditLogs = () => {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <AuditLogViewer />
      </div>
    </AdminLayout>
  );
};

export default AuditLogs;
