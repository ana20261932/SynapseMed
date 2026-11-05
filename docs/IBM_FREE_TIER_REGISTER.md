# IBM Free Tier Register

This document tracks IBM Cloud services used by SynapseMed. Verify current plans, quotas, and pricing in your IBM Cloud account - these change over time.

## Service Inventory

| Service | Plan | Purpose | Free Quota | Region | Status | Notes |
|---------|------|---------|------------|--------|--------|-------|
| IBM Cloudant | Lite | Optional NoSQL document store for flexible documents | 1 GB storage, 20 reads/sec, 10 writes/sec, 1 instance per account | Varies by account | Optional (mock/default not used) | Do not add alongside MongoDB/SQLite by default. Evaluation only. |
| IBM Cloud Object Storage | Standard Smart Tier (Free Tier) | Document/backup storage adapter | 25 GB/month (as specified), Class A/B requests limits apply | Varies | Optional (mock by default) | Free for first 12 months typically; check current terms. |
| IBM Watson Assistant | Lite | Conversational AI for appointments/intake/screening | 10,000 API interactions/month | Varies | Optional (mock by default) | May be deprecated/replaced; verify current offering. |
| IBM Watson Speech to Text | Lite | Clinical dictation/transcription | 500 minutes/month | Varies | Optional (mock by default) | Verify current offering. |
| IBM Code Engine | Free tier | Serverless container hosting for demo | 100,000 vCPU-seconds, 200,000 GB-seconds, 100,000 HTTP requests/month | Varies | Not provisioned | Monitor usage to avoid overage. |
| IBM Cloud Event Notifications | Lite | Non-sensitive alerts/reminders | Limited (see IBM docs) | Varies | Not enabled | Never send PHI in notifications. |
| watsonx.ai | Free Toolbox | AI model experiments | 300,000 tokens/month, compute hours limited | Varies | Not configured | Use mock provider by default. |

## Configuration

All IBM services are disabled by default. Enable only after:
1. Reviewing current IBM Cloud pricing/catalog for your account
2. Configuring credentials in environment variables (never committed)
3. Setting up appropriate IAM service IDs with least privilege
4. Verifying data location/compliance requirements for your use case
5. Setting up billing alerts

## Environment Variables

See `config/.env.example` for all IBM-related variables. All adapters fall back to mocks when not configured.

## Cost Control
- Set spending/billing alerts in IBM Cloud
- Use mocks for development/testing
- Monitor usage against quotas
- Review bills regularly
- Have exit/migration plan for each service
