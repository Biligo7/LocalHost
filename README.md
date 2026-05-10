# Project Architecture Plan

This document outlines the architecture for our test project in preparation for the hackathon. These are the technologies that we will try to test in this repo

## Technologies

### Frontend
- **Next.js**: React framework for building the user interface
- **Tailwind CSS**: Utility-first CSS framework for styling UI/UX components

### Backend
- **Python with FastAPI**: Backend service for handling API requests and business logic

### Database and Authentication
- **Supabase or Firebase?**: Provides authentication, database management
  - Define tables and schemas
  - Connect authentication to the app
  - Perform database queries through the Python backend
  - Maybe use supabase edge functions or firebase cloud functions for the backend apis

## OpenAI APIs Integration

Test multiple OpenAI APIs:

- **Chat API**: Text-to-text 
- **Image API**: Generate images from text prompts or modify existing images
- **Video API**: Create videos from text or image inputs (maybe stretch if needed as it will be expensive)
- **Agent Builder**: Custom AI agents with triggering and usage through the app interface

## System Integration

- **Frontend-Backend Communication**: Integration between Next.js frontend and Python FastAPI backend
- **Database Operations**: All database queries routed through the Python backend for security and consistency
- **Auth**: Integrate auth for user authorization and frontend/backend requests through supabase/firebase