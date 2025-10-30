import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          full_name: string;
          role: 'admin' | 'student';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      tests: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          duration_minutes: number;
          total_marks: number;
          is_active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['tests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['tests']['Insert']>;
      };
      questions: {
        Row: {
          id: string;
          test_id: string;
          question_text: string;
          question_type: 'mcq' | 'multiple_correct';
          options: { id: string; text: string }[];
          correct_answers: string[];
          marks: number;
          order_index: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['questions']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['questions']['Insert']>;
      };
      test_attempts: {
        Row: {
          id: string;
          test_id: string;
          user_id: string;
          started_at: string;
          submitted_at: string | null;
          time_taken_seconds: number | null;
          score: number;
          total_marks: number;
          status: 'in_progress' | 'submitted' | 'auto_submitted';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['test_attempts']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['test_attempts']['Insert']>;
      };
      attempt_answers: {
        Row: {
          id: string;
          attempt_id: string;
          question_id: string;
          selected_answers: string[] | null;
          is_correct: boolean;
          marks_obtained: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attempt_answers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['attempt_answers']['Insert']>;
      };
    };
  };
};
