# Samarth Agri-Climate Q&A System

## Overview

A comprehensive, source-cited Q&A and analytics system for Indian Agriculture and Climate data. Built with React, TypeScript, Lovable Cloud (Supabase), and AI-powered natural language processing.

## Key Features

### ✅ Implemented (V1)

#### 1. **Live Data Integration**
- Database schema for agricultural production and climate/rainfall data
- Support for data.gov.in dataset catalog
- Automatic data ingestion via edge functions
- Full metadata and provenance tracking
- Sample datasets pre-configured

#### 2. **Natural Language Query Interface**
- AI-powered query processing using Lovable AI (Google Gemini 2.5 Flash)
- Natural language understanding for agriculture and climate questions
- Support for complex multi-part queries
- Example queries for quick testing

#### 3. **Answer Synthesis & Source Citation**
- Full provenance tracking for every query
- Citation-level data with resource IDs and API URLs
- Execution step logging
- Verification results tracking
- Query performance metrics

#### 4. **Data Visualization & Analytics**
- Interactive charts (bar, line, pie) using Recharts
- Automatic chart generation based on query context
- Production trends visualization
- Rainfall pattern analysis
- Data quality dashboards

#### 5. **Data Storage & Security**
- PostgreSQL database via Lovable Cloud
- Row Level Security (RLS) policies
- Public read access for datasets
- User-scoped query logging
- Encrypted data at rest

#### 6. **Audit & Provenance**
- Complete query execution logs
- Citation tracking for all data sources
- Execution time metrics
- Verification results
- Error tracking and reporting

## Architecture

```
Frontend (React + TypeScript)
├── Query Interface - Natural language input
├── Results Display - Charts, citations, provenance
├── Data Insights - Analytics dashboard
└── Data Ingestion - Sample data upload

Backend (Lovable Cloud / Supabase)
├── Database (PostgreSQL)
│   ├── datasets - Dataset catalog
│   ├── fact_production - Agriculture data
│   ├── fact_rainfall - Climate data
│   ├── query_logs - Full provenance
│   ├── data_quality_metrics - Quality tracking
│   └── user_alerts - Notifications
│
└── Edge Functions (Deno/TypeScript)
    ├── process-query - AI-powered Q&A
    └── ingest-data - Data ingestion

AI Layer (Lovable AI)
└── Google Gemini 2.5 Flash - NLU and answer synthesis
```

## Database Schema

### Core Tables

**datasets**
- Catalog of available agriculture and climate datasets
- Maps resource IDs to API endpoints
- Tracks data quality and sync status

**fact_production**
- State/district-wise crop production data
- Area, production, yield metrics
- Full raw record preservation
- Indexed by state, crop, year

**fact_rainfall**
- Monthly rainfall data by state/district
- IMD climate data
- Indexed by state, year, month

**query_logs**
- Complete query execution provenance
- Question, answer, citations
- Execution plan and SQL context
- Verification results
- Performance metrics

## Usage Guide

### Running Queries

1. Navigate to the "Query Data" tab
2. Enter a natural language question about agriculture or climate
3. Examples:
   - "Compare wheat production in Punjab and Haryana over the last 5 years"
   - "Show me rainfall patterns in Maharashtra for 2023"
   - "What are the top 3 crops by production in Kerala?"
4. View results with:
   - AI-generated answer
   - Interactive charts
   - Full citations with resource IDs
   - Execution provenance

### Ingesting Sample Data

1. Navigate to the "Ingest Data" tab
2. Select data type (Production or Rainfall)
3. Choose dataset ID
4. Click "Load Sample" or paste JSON data
5. Click "Ingest Data"
6. View ingestion results

### Viewing Analytics

1. Navigate to the "Insights" tab
2. View:
   - Production growth trends
   - Rainfall variance analysis
   - Historical trend charts
   - Crop distribution
   - Data quality metrics

## API Endpoints

### Process Query
**Endpoint:** `/functions/v1/process-query`
**Method:** POST
**Body:**
```json
{
  "question": "Your natural language question",
  "sessionId": "unique-session-id"
}
```

**Response:**
```json
{
  "answer": "AI-generated answer",
  "charts": [...],
  "citations": [...],
  "provenance": {...},
  "insights": [...]
}
```

### Ingest Data
**Endpoint:** `/functions/v1/ingest-data`
**Method:** POST
**Body:**
```json
{
  "datasetId": "SAMPLE_AGRI_001",
  "sampleData": [...],
  "dataType": "production"
}
```

## Technology Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Backend**: Lovable Cloud (Supabase)
- **Database**: PostgreSQL with RLS
- **Edge Functions**: Deno, TypeScript
- **AI**: Lovable AI Gateway (Google Gemini 2.5 Flash)
- **Charts**: Recharts
- **State Management**: React Query

## Security Features

- Row Level Security (RLS) on all tables
- Public read-only access for datasets
- User-scoped query logging
- Service role key protection
- Input validation
- Error handling with user-friendly messages
- Rate limit handling (429 errors)
- Credit depletion handling (402 errors)

## Data Quality & Validation

- Schema validation on ingestion
- Numeric sanity checks (non-negative values)
- Year range validation (1900-2100)
- Month validation (1-12)
- Data quality metrics tracking
- Anomaly detection
- Missing value tracking

## Future Enhancements (Roadmap)

### Phase 2
- Real-time data sync with data.gov.in API
- Advanced data validation rules
- Automated data quality scoring
- User authentication and profiles
- Custom dashboard builder

### Phase 3
- Multilingual support (Hindi, regional languages)
- Voice input/output
- Mobile app (React Native)
- Geospatial visualization with maps
- What-if scenario simulator

### Phase 4
- Machine learning predictions
- Trend forecasting
- Policy recommendations
- External API integrations
- Plugin architecture

## Development

### Prerequisites
- Node.js 18+
- Lovable Cloud account

### Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Lovable Cloud is auto-configured
4. Run dev server: `npm run dev`

### Environment Variables
Auto-configured by Lovable Cloud:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `LOVABLE_API_KEY` (server-side)

## Support

For issues, questions, or feature requests:
- Open an issue in the project repository
- Contact the development team
- Review documentation at https://docs.lovable.dev

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ using Lovable**
