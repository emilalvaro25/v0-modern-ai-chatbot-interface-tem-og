# HyperFocus AI - Comprehensive Documentation

**Version:** 1.0.0  
**Last Updated:** October 2025  
**Project:** HyperFocus - Enterprise AI Platform with Voice Agent Demo

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Features](#features)
4. [Installation & Setup](#installation--setup)
5. [Authentication System](#authentication-system)
6. [Voice Agent Demo](#voice-agent-demo)
7. [LLM Benchmarking](#llm-benchmarking)
8. [System Monitoring](#system-monitoring)
9. [Security & Encryption](#security--encryption)
10. [API Reference](#api-reference)
11. [Database Schema](#database-schema)
12. [Deployment](#deployment)
13. [Troubleshooting](#troubleshooting)

---

## Overview

HyperFocus is an advanced AI platform built on top of Eburon AI, featuring:

- **Multi-model AI Support**: Emilio-120b, Emilio-flash-20b, Aquilles-V3.1, Alex-Coder
- **Voice Agent Demo**: Real-time speech-to-text and text-to-speech with Microsoft Vibe Voice integration
- **Enterprise Authentication**: Secure login with role-based access control
- **EY-Specific Access**: Dedicated demo environment for Ernst & Young testers
- **Performance Benchmarking**: Real-time LLM latency and energy tracking
- **System Monitoring**: Infrastructure health and redundancy management
- **Post-Quantum Cryptography**: Future-proof encryption with PQC measures
- **Responsible AI**: Content filtering, PII sanitization, and audit logging

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Web UI      │  │  Voice Agent │  │  EY Demo     │      │
│  │  (Next.js)   │  │  Interface   │  │  Portal      │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Middleware Layer                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth Check   │  │ Route Guard  │  │  PQC Filter  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                     API Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Auth APIs    │  │ Voice APIs   │  │ Benchmark    │      │
│  ├──────────────┤  ├──────────────┤  │ APIs         │      │
│  │ - Login      │  │ - Transcribe │  ├──────────────┤      │
│  │ - Signup     │  │ - Process    │  │ - Create     │      │
│  │ - Logout     │  │ - TTS        │  │ - Query      │      │
│  │ - Session    │  └──────────────┘  │ - Stats      │      │
│  └──────────────┘                    └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Service Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Ollama Cloud │  │  Deepgram    │  │  Encryption  │      │
│  │ LLM Service  │  │  STT/TTS     │  │  Service     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Neon         │  │ Upstash      │  │  Audit       │      │
│  │ PostgreSQL   │  │ Redis/Vector │  │  Logs        │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (Edge Runtime)
- **Database**: Neon PostgreSQL
- **Caching**: Upstash Redis
- **Vector Search**: Upstash Vector
- **AI Models**: Ollama Cloud (Emilio AI)
- **Voice**: Deepgram STT, Browser Speech Synthesis
- **Authentication**: JWT with HTTP-only cookies
- **Encryption**: AES-256-GCM, SHA-512
- **Deployment**: Vercel

---

## Features

### 1. Authentication System

- **Email/Password Login**: Secure credential-based authentication
- **JWT Sessions**: 24-hour session tokens with automatic renewal
- **Role-Based Access Control (RBAC)**:
  - `user`: Standard user access
  - `ey_tester`: Access to EY demo environment
  - `admin`: Full system access
- **Audit Logging**: All authentication events logged
- **Session Management**: Automatic cleanup of expired sessions

### 2. Voice Agent Demo (EY Exclusive)

- **Speech-to-Text**: Real-time voice transcription using Deepgram
- **LLM Processing**: Voice input processed through Ollama Cloud models
- **Text-to-Speech**: Browser-based speech synthesis for responses
- **Real-time Metrics**: Latency tracking and performance monitoring
- **Session History**: Conversation recording and playback

### 3. LLM Benchmarking

Comprehensive performance tracking for all AI models:

- **Latency Measurement**: Request/response time tracking
- **Token Counting**: Input/output token metrics
- **Energy Tracking**: Power consumption estimation (mWh)
- **Success Rate Monitoring**: Request failure tracking
- **Historical Analytics**: Trend analysis over time periods
- **Per-Model Statistics**: Comparative performance data

### 4. System Monitoring

Real-time infrastructure health monitoring:

- **Service Status**: Health checks for all system components
- **Resource Metrics**: CPU and memory usage tracking
- **Response Time**: API endpoint latency monitoring
- **Error Tracking**: Centralized error counting
- **Alert System**: Automatic status degradation detection
- **Historical Data**: Retention for forensic analysis

### 5. Post-Quantum Cryptography (PQC)

Future-proof security measures:

- **AES-256-GCM Encryption**: Quantum-resistant symmetric encryption
- **SHA-512 Hashing**: Secure cryptographic hashing
- **Key Rotation**: Automated encryption key management
- **CRYSTALS-Kyber Ready**: Prepared for NIST PQC standard integration
- **Audit Trail**: All encryption operations logged

### 6. Responsible AI

Content safety and compliance:

- **Content Filtering**: Automatic detection of harmful content
- **PII Sanitization**: Redaction of personal information
- **Guardrails**: Multi-level severity classification
- **Audit Logging**: Comprehensive activity tracking
- **Telemetry**: Usage analytics and monitoring

---

## Installation & Setup

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL database (Neon recommended)
- Ollama Cloud API key
- (Optional) Deepgram API key for voice features

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Database
DATABASE_URL=your_neon_database_url
POSTGRES_URL=your_postgres_url

# Redis
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Vector Search
UPSTASH_VECTOR_REST_URL=your_upstash_vector_url
UPSTASH_VECTOR_REST_TOKEN=your_upstash_vector_token

# Custom Search
UPSTASH_SEARCH_REST_URL=your_upstash_search_url
UPSTASH_SEARCH_REST_TOKEN=your_upstash_search_token

# Ollama Cloud
OLLAMA_API_KEY=your_ollama_api_key

# Authentication
NEXTAUTH_SECRET=your_super_secret_jwt_token_here
NEXTAUTH_URL=http://localhost:3000

# Voice (Optional)
DEEPGRAM_API_KEY=your_deepgram_api_key
```

### Database Setup

Run the SQL migration scripts in order:

```bash
# Create base tables
psql $DATABASE_URL -f scripts/001_create_conversations_and_messages.sql

# Fix user_id type (if needed)
psql $DATABASE_URL -f scripts/002_fix_user_id_type.sql

# Create auth and monitoring tables
psql $DATABASE_URL -f scripts/003_create_users_and_auth.sql
```

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository_url>
   cd v0-modern-ai-chatbot-interface-tem-og
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your actual values
   ```

4. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Main UI: http://localhost:3000
   - Login: http://localhost:3000/login
   - EY Demo: http://localhost:3000/ey/demo

---

## Authentication System

### Default Accounts

The system comes with pre-configured demo accounts:

**Admin Account:**
- Email: `admin@hyperfocus.ai`
- Password: `Admin@2025!`
- Role: `admin`

**EY Tester Accounts:**
- Email: `ey.tester1@ey.com` through `ey.tester5@ey.com`
- Password: `EYTest@2025!`
- Role: `ey_tester`

### API Endpoints

#### POST `/api/auth/login`
Authenticate user with credentials.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "user",
    "organization": "Company"
  },
  "token": "jwt_token_here"
}
```

#### POST `/api/auth/signup`
Create a new user account.

#### POST `/api/auth/logout`
Invalidate current session.

#### GET `/api/auth/session`
Check current authentication status.

---

## Voice Agent Demo

### Accessing the Demo

1. Navigate to `/login`
2. Sign in with EY tester credentials
3. Access `/ey/demo`

### Features

- **Voice Recording**: Click the microphone button to start/stop recording
- **Real-time Transcription**: Audio converted to text via Deepgram
- **AI Processing**: Transcript sent to Ollama Cloud for response
- **Voice Response**: Text-to-speech playback of AI response
- **Performance Metrics**: Real-time latency and token tracking

### Voice API Endpoints

#### POST `/api/voice/transcribe`
Convert audio to text.

**Request:** FormData with audio file

**Response:**
```json
{
  "transcript": "Transcribed text here",
  "duration_ms": 3500,
  "language": "en-US"
}
```

#### POST `/api/voice/process`
Process transcript through LLM.

**Request:**
```json
{
  "transcript": "User's question",
  "model": "gpt-oss:120b-cloud"
}
```

**Response:**
```json
{
  "response": "AI's answer",
  "latency_ms": 1250,
  "model": "gpt-oss:120b-cloud"
}
```

---

## LLM Benchmarking

### Benchmarking API

#### GET `/api/benchmarks`
Retrieve benchmark data.

**Query Parameters:**
- `limit`: Number of records (default: 50)
- `model`: Filter by specific model

**Response:**
```json
{
  "benchmarks": [...],
  "stats": {
    "total": 100,
    "avgLatency": 1200,
    "minLatency": 450,
    "maxLatency": 3500,
    "successRate": 0.98,
    "totalTokensInput": 5000,
    "totalTokensOutput": 8000,
    "totalEnergyUsage": 0.15
  }
}
```

#### POST `/api/benchmarks`
Create benchmark record.

#### PUT `/api/benchmarks`
Get aggregate statistics.

---

## System Monitoring

### Monitoring API

#### GET `/api/monitoring`
Get current system status.

**Response:**
```json
{
  "overallStatus": "healthy",
  "services": [
    {
      "service_name": "voice_agent",
      "status": "healthy",
      "cpu_usage": 45.2,
      "memory_usage": 62.8,
      "response_time_ms": 120
    }
  ],
  "summary": {
    "total": 5,
    "healthy": 4,
    "degraded": 1,
    "down": 0
  }
}
```

#### POST `/api/monitoring`
Report service status.

#### PUT `/api/monitoring`
Get historical data.

---

## Security & Encryption

### PQC Encryption

The system implements Post-Quantum Cryptography measures:

```typescript
import { encryptData, decryptData, filterContent, sanitizePII } from '@/lib/encryption'

// Encrypt sensitive data
const key = generateEncryptionKey()
const encrypted = encryptData(sensitiveData, key)

// Decrypt data
const decrypted = decryptData(encrypted, key)

// Filter content
const filterResult = filterContent(userInput)
if (!filterResult.allowed) {
  // Handle prohibited content
}

// Sanitize PII
const sanitized = sanitizePII(content)
```

### Responsible AI Features

- **Content Filtering**: Automatic detection of harmful content categories
- **PII Redaction**: Email, phone, SSN, credit card number sanitization
- **Audit Logging**: All operations tracked for compliance
- **Severity Levels**: Low, medium, high risk classification

---

## Database Schema

### Core Tables

- **users**: User accounts and authentication
- **sessions**: Active user sessions
- **conversations**: Chat conversations
- **messages**: Individual chat messages
- **voice_sessions**: Voice interaction recordings
- **llm_benchmarks**: Performance metrics
- **system_monitoring**: Infrastructure health
- **audit_logs**: Security and compliance logging
- **encryption_keys**: PQC key management

See `scripts/003_create_users_and_auth.sql` for complete schema.

---

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Environment Setup

Ensure all environment variables are set in Vercel:
- Database credentials
- API keys
- Authentication secrets

### Post-Deployment

1. Run database migrations
2. Verify system monitoring endpoints
3. Test authentication flow
4. Validate voice agent functionality

---

## Troubleshooting

### Common Issues

**Issue: Database connection fails**
- Verify `DATABASE_URL` is correct
- Check database is accessible from deployment environment
- Ensure SSL mode is configured properly

**Issue: Voice transcription not working**
- Confirm `DEEPGRAM_API_KEY` is set
- Check microphone permissions in browser
- Verify audio format is supported

**Issue: Authentication errors**
- Ensure `NEXTAUTH_SECRET` is set and secure
- Verify session cookies are enabled
- Check CORS settings

**Issue: EY demo access denied**
- Confirm user has `ey_tester` or `admin` role
- Check middleware configuration
- Verify session is active

### Support

For additional support:
- Check application logs in Vercel dashboard
- Review audit logs in database
- Monitor system health at `/api/monitoring`

---

## License

MIT License - See LICENSE file for details

## Contributors

Built by the Emilio AI and HyperFocus teams.

---

**Document Version:** 1.0.0  
**Last Updated:** October 2025
