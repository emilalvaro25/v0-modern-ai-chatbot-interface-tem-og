# Eburon Deployment System

## Overview

The Eburon deployment system allows you to deploy code to unique slug-based URLs that can be accessed at `eburon.dev/slug/{your-slug}`.

## Features

- Unique slug-based URLs
- Public/private access control
- View counting
- Multiple language support (JavaScript, TypeScript, Python, SQL)
- CLI and API access
- Automatic language detection

## Database Schema

\`\`\`sql
CREATE TABLE deployments (
  id UUID PRIMARY KEY,
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  code TEXT NOT NULL,
  language VARCHAR(50) NOT NULL,
  user_id VARCHAR(255),
  public BOOLEAN DEFAULT false,
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
\`\`\`

## API Endpoints

### Create Deployment

\`\`\`bash
POST /api/deploy
Content-Type: application/json

{
  "code": "console.log('Hello World')",
  "name": "My App",
  "slug": "my-app",  // Optional, auto-generated if not provided
  "language": "javascript",  // Optional, auto-detected if not provided
  "userId": "user123",  // Optional
  "public": true  // Optional, default: false
}
\`\`\`

### List Deployments

\`\`\`bash
GET /api/deploy
GET /api/deploy?userId=user123
GET /api/deploy?public=true
\`\`\`

### Get Deployment

\`\`\`bash
GET /api/deploy/{slug}
\`\`\`

### Update Deployment

\`\`\`bash
PUT /api/deploy/{slug}
Content-Type: application/json

{
  "code": "console.log('Updated')",
  "name": "Updated Name",
  "public": true
}
\`\`\`

### Delete Deployment

\`\`\`bash
DELETE /api/deploy?slug={slug}
DELETE /api/deploy?slug={slug}&userId={userId}
\`\`\`

## CLI Usage

\`\`\`bash
# Deploy code
eburon deploy app.js

# Deploy with custom slug
eburon deploy app.js --slug my-app

# Deploy as public
eburon deploy app.js --public

# List deployments
eburon list

# Delete deployment
eburon delete my-app
\`\`\`

## Slug Rules

- 3-50 characters long
- Alphanumeric and hyphens only
- Cannot start or end with hyphen
- Cannot contain consecutive hyphens
- Cannot use reserved words (api, admin, dashboard, etc.)

## Examples

### Deploy JavaScript

\`\`\`bash
eburon deploy hello.js --name "Hello World" --public
# URL: https://eburon.dev/slug/abc123xyz
\`\`\`

### Deploy Python

\`\`\`bash
eburon deploy data_analysis.py --slug data-viz
# URL: https://eburon.dev/slug/data-viz
\`\`\`

### Deploy with API

\`\`\`javascript
const response = await fetch('https://eburon.dev/api/deploy', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    code: 'console.log("Hello")',
    name: 'My App',
    public: true
  })
})

const { deployment, url } = await response.json()
console.log('Deployed to:', url)
\`\`\`
