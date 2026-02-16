/**
 * Supabase project configuration
 * Uses environment variables with production fallbacks
 */

export const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || "tpsgnnrkwgvgnsktuicr"
export const publicAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwc2dubnJrd2d2Z25za3R1aWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1MDE2NDcsImV4cCI6MjA4NjA3NzY0N30.oSLIdSvLWWdHWWcMyJ3WR4zwsu1tCAbawdkIYnQqnVY"