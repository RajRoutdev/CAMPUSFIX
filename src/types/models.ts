import { Database, UserRole, IssueSeverity, IssueStatus, ImageType } from './database.types';

export type College = Database['public']['Tables']['colleges']['Row'];
export type Department = Database['public']['Tables']['departments']['Row'];
export type Location = Database['public']['Tables']['locations']['Row'];
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Issue = Database['public']['Tables']['issues']['Row'];
export type IssueImage = Database['public']['Tables']['issue_images']['Row'];
export type IssueMatch = Database['public']['Tables']['issue_matches']['Row'];
export type ActivityLog = Database['public']['Tables']['activity_logs']['Row'];

export type { UserRole, IssueSeverity, IssueStatus, ImageType };

export interface IssueWithRelations extends Issue {
  location?: Location;
  department?: Department | null;
  reporter?: Profile;
  assignee?: Profile | null;
  images?: IssueImage[];
  activity_logs?: ActivityLog[];
}

export interface DemoAccount {
  email: string;
  role: UserRole;
  label: string;
  description: string;
  departmentName?: string;
}
