#!/bin/bash
# Vercel build script - auto-sets staging env vars for preview deployments
if [ "$VERCEL_ENV" = "preview" ]; then
  export VITE_SUPABASE_PROJECT_ID=dqoybysbooxngrsxaekd
  export VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxb3lieXNib294bmdyc3hhZWtkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczNTc2OTYsImV4cCI6MjA3MjkzMzY5Nn0.tj87Iq5Me6weY5LKL8HMeyUJyfYDoozJZ6J3iD4QoiA
  echo "Using staging Supabase (preview deployment)"
fi
npx vite build
