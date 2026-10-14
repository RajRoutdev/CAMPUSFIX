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
        Relationships: [];
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
        Relationships: [
          {
            foreignKeyName: "departments_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "locations_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "profiles_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "profiles_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "departments";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "issues_college_id_fkey";
            columns: ["college_id"];
            isOneToOne: false;
            referencedRelation: "colleges";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "issues_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "issue_images_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "issue_matches_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
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
        Relationships: [
          {
            foreignKeyName: "activity_logs_issue_id_fkey";
            columns: ["issue_id"];
            isOneToOne: false;
            referencedRelation: "issues";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
