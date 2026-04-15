export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: "admin" | "user";
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: "admin" | "user";
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          email?: string | null;
          role?: "admin" | "user";
          updated_at?: string | null;
        };
      };
      traffic_events: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          latitude: number;
          longitude: number;
          severity: "low" | "medium" | "high" | null;
          status: "pending" | "approved" | "rejected" | null;
          approved_by_admin: boolean | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          latitude: number;
          longitude: number;
          severity?: "low" | "medium" | "high" | null;
          status?: "pending" | "approved" | "rejected" | null;
          approved_by_admin?: boolean | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          title?: string;
          description?: string | null;
          latitude?: number;
          longitude?: number;
          severity?: "low" | "medium" | "high" | null;
          status?: "pending" | "approved" | "rejected" | null;
          approved_by_admin?: boolean | null;
          updated_at?: string | null;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_activities_in_radius: {
        Args: {
          lat: number;
          lng: number;
          radius_km: number;
        };
        Returns: Database["public"]["Tables"]["traffic_events"]["Row"][];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type TrafficEvent = Database["public"]["Tables"]["traffic_events"]["Row"];
