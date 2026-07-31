export type AppRole =
  | "system_admin"
  | "project_manager"
  | "supervisor"
  | "employee"
  | "reader";

export type RecordStatus = "active" | "inactive" | "archived";
export type IncidentPriority = "low" | "medium" | "high" | "critical";
export type IncidentStatus =
  | "open"
  | "assigned"
  | "in_progress"
  | "resolved"
  | "closed"
  | "cancelled";
export type ReportStatus =
  | "draft"
  | "submitted"
  | "approved"
  | "rejected"
  | "archived";

export interface PlatformProfile {
  id: string;
  full_name: string;
  employee_no: string | null;
  phone: string | null;
  role: AppRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlatformProject {
  id: string;
  code: string;
  name: string;
  client_name: string | null;
  city: string | null;
  status: RecordStatus;
  start_date: string | null;
  end_date: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformBuilding {
  id: string;
  project_id: string;
  code: string;
  name: string;
  building_type: string | null;
  address: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformAsset {
  id: string;
  project_id: string;
  building_id: string | null;
  code: string;
  name: string;
  description: string | null;
  asset_type: string;
  location: string | null;
  manufacturer: string | null;
  model: string | null;
  serial_number: string | null;
  floors: number;
  gates_count: number;
  install_date: string | null;
  warranty_expiry: string | null;
  criticality: "Low" | "Medium" | "High" | "Critical";
  operational_status: "Running" | "Maintenance" | "Stopped";
  qr_code: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformGate {
  id: string;
  project_id: string;
  building_id: string | null;
  code: string;
  name: string;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformEmployee {
  id: string;
  project_id: string;
  user_id: string | null;
  employee_no: string;
  full_name: string;
  job_title: string | null;
  phone: string | null;
  status: RecordStatus;
  hired_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformWarehouse {
  id: string;
  project_id: string;
  code: string;
  name: string;
  location: string | null;
  status: RecordStatus;
  created_at: string;
  updated_at: string;
}

export interface PlatformWarehouseItem {
  id: string;
  warehouse_id: string;
  sku: string;
  name: string;
  unit: string;
  quantity: number;
  minimum_quantity: number;
  created_at: string;
  updated_at: string;
}

export interface PlatformStockMovement {
  id: string;
  item_id: string;
  movement_type:
    | "receipt"
    | "issue"
    | "transfer_in"
    | "transfer_out"
    | "adjustment";
  quantity: number;
  reference_no: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
}

export interface PlatformIncident {
  id: string;
  project_id: string;
  building_id: string | null;
  gate_id: string | null;
  report_no: string;
  title: string;
  description: string;
  priority: IncidentPriority;
  status: IncidentStatus;
  assigned_to: string | null;
  reported_by: string | null;
  due_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlatformReport {
  id: string;
  project_id: string;
  report_no: string;
  report_type: string;
  title: string;
  period_start: string | null;
  period_end: string | null;
  status: ReportStatus;
  payload: Record<string, unknown>;
  qr_payload: string | null;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuthUser {
  id: string;
  email?: string;
  phone?: string;
  user_metadata?: Record<string, unknown>;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: AuthUser;
}

export interface AuthState {
  session: AuthSession | null;
  profile: PlatformProfile | null;
  loading: boolean;
  configured: boolean;
  demoMode: boolean;
}
