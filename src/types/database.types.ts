export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'student' | 'staff' | 'admin';
export type IssueSeverity = 'low' | 'medium' | 'high' | 'critical';
export type IssueStatus =
  | 'NEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLUTION_SUBMITTED'
  | 'VERIFIED'
  | 'CLOSED';
export type ImageType = 'original' | 'resolution';

export interface Database {
  public: {
    Tables: {
      colleges: {
        Row: {
          id: string;
          name: string;
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          logo_url?: string | null;
          created_at?: string;
        };
      };
      departments: {
        Row: {
          id: string;
          college_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          college_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          college_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      locations: {
        Row: {
          id: string;
          college_id: string;
          building: string;
          floor: string;
          room: string;
          area: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          college_id: string;
          building: string;
          floor: string;
          room: string;
          area?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          college_id?: string;
          building?: string;
          floor?: string;
          room?: string;
          area?: string | null;
          created_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          college_id: string;
          name: string;
          email: string;
          role: UserRole;
          department_id: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          college_id: string;
          name: string;
          email: string;
          role: UserRole;
          department_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          college_id?: string;
          name?: string;
          email?: string;
          role?: UserRole;
          department_id?: string | null;
          created_at?: string;
        };
      };
      issues: {
        Row: {
          id: string;
          ticket_number: string;
          college_id: string;
          reported_by: string;
          title: string;
          description: string;
          category: string;
          severity: IssueSeverity;
          status: IssueStatus;
          department_id: string | null;
          assigned_to: string | null;
          location_id: string;
          created_at: string;
          updated_at: string;
          resolved_at: string | null;
        };
        Insert: {
          id?: string;
          ticket_number?: string;
          college_id: string;
          reported_by: string;
          title: string;
          description: string;
          category: string;
          severity: IssueSeverity;
          status?: IssueStatus;
          department_id?: string | null;
          assigned_to?: string | null;
          location_id: string;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
        Update: {
          id?: string;
          ticket_number?: string;
          college_id?: string;
          reported_by?: string;
          title?: string;
          description?: string;
          category?: string;
          severity?: IssueSeverity;
          status?: IssueStatus;
          department_id?: string | null;
          assigned_to?: string | null;
          location_id?: string;
          created_at?: string;
          updated_at?: string;
          resolved_at?: string | null;
        };
      };
      issue_images: {
        Row: {
          id: string;
          issue_id: string;
          image_url: string;
          image_type: ImageType;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          image_url: string;
          image_type: ImageType;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          image_url?: string;
          image_type?: ImageType;
          created_at?: string;
        };
      };
      issue_matches: {
        Row: {
          id: string;
          issue_id: string;
          matched_issue_id: string;
          score: number;
          reason: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          matched_issue_id: string;
          score: number;
          reason: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          matched_issue_id?: string;
          score?: number;
          reason?: string;
          created_at?: string;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          issue_id: string;
          user_id: string;
          action: string;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          issue_id: string;
          user_id: string;
          action: string;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          issue_id?: string;
          user_id?: string;
          action?: string;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
  };
}
