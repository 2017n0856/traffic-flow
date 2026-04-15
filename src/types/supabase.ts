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
          email: string;
          role: "admin" | "user";
          created_at: string | null;
        };
        Insert: {
          id: string;
          email: string;
          role?: "admin" | "user";
          created_at?: string | null;
        };
        Update: {
          email?: string;
          role?: "admin" | "user";
        };
        Relationships: [];
      };
      traffic_events: {
        Row: {
          id: string;
          created_at: string | null;
          type: "accident" | "closure" | "congestion" | null;
          description: string | null;
          status: "pending" | "approved" | null;
          is_predicted: boolean | null;
          location_lat: number;
          location_lng: number;
          location_point: unknown | null;
          reported_by: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string | null;
          type?: "accident" | "closure" | "congestion" | null;
          description?: string | null;
          status?: "pending" | "approved" | null;
          is_predicted?: boolean | null;
          location_lat: number;
          location_lng: number;
          location_point?: unknown | null;
          reported_by?: string | null;
        };
        Update: {
          created_at?: string | null;
          type?: "accident" | "closure" | "congestion" | null;
          description?: string | null;
          status?: "pending" | "approved" | null;
          is_predicted?: boolean | null;
          location_lat?: number;
          location_lng?: number;
          location_point?: unknown | null;
          reported_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "traffic_events_reported_by_fkey";
            columns: ["reported_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_activities_in_radius: {
        Args: {
          user_lat: number;
          user_lng: number;
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
