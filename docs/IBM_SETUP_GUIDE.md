# IBM Cloud Setup Guide

This guide walks through provisioning and configuring the IBM Cloud services used by SynapseMed.
**All IBM services are optional** — the app runs entirely with mock adapters until you configure credentials.

## Service Inventory

| Service | Plan | Purpose | Free Quota | Status |
|---------|------|---------|------------|--------|
| IBM Cloudant | Lite | Optional NoSQL document store | 1 GB storage | Optional (mock by default) |
| IBM Cloud Object Storage | Standard Smart Tier (Free Tier) | Document/backup storage | 25 GB/month | Optional (mock by default) |
| IBM Watson Assistant | Lite | Conversational AI for appointments/intake | 10,000 API interactions/month | Optional (mock by default) |
| IBM Watson Speech to Text | Lite | Clinical dictation/transcription | 500 minutes/month | Optional (mock by default) |
| IBM Code Engine | Free tier | Serverless container hosting | 100k vCPU-s, 200k GB-s/mo | Not provisioned |
| IBM watsonx.ai | Free Toolbox | AI model experiments | 300,000 tokens/month | Optional (mock by default) |

## Prerequisites

1. An IBM Cloud account (https://cloud.ibm.com/)
2. The IBM Cloud CLI (optional, for CLI-based provisioning)
3. The SynapseMed repo cloned and `apps/api/.env` created from `config/.env.example`

## Step 1: Copy environment template

```bash
cp config/.env.example apps/api/.env
```

Edit `apps/api/.env` and add your IBM credentials as you provision each service.

## Step 2: Provision IBM Cloud services

### IBM Cloudant (Lite)

1. In IBM Cloud console, navigate to **Databases → Cloudant**
2. Create a service with the **Lite** plan
3. Create a service credential
4. Copy the `url` and `apikey` into `.env`:
   ```
   CLOUDANT_URL=https://xxxxxxx-bluemix.cloudant.com
   CLOUDANT_API_KEY=your-cloudant-apikey
   CLOUDANT_DB_NAME=synapsemed
   ```

### IBM Cloud Object Storage (Lite)

1. In IBM Cloud console, navigate to **Storage → Cloud Object Storage**
2. Create a service with the **Lite** plan (Standard Smart Tier)
3. Create a bucket for SynapseMed documents
4. Create service credentials (HMAC or IAM)
5. Copy into `.env`:
   ```
   OBJECT_STORAGE_PROVIDER=ibm-cos
   IBM_COS_ENDPOINT=https://s3.us-south.cloud-object-storage.appdomain.cloud
   IBM_COS_BUCKET=synapsemed-documents
   IBM_COS_API_KEY=your-cos-apikey
   IBM_COS_INSTANCE_ID=your-instance-id
   IBM_COS_SERVICE_INSTANCE_CRN=your-crn
   ```

### IBM Watson Assistant (Lite)

1. In IBM Cloud console, navigate to **AI → Watson Assistant**
2. Create a service with the **Lite** plan
3. Create an assistant and note the Assistant ID
4. Create service credentials
5. Copy into `.env`:
   ```
   WATSON_ASSISTANT_URL=https://api.us-south.assistant.watson.cloud.ibm.com
   WATSON_ASSISTANT_API_KEY=your-watson-assistant-apikey
   WATSON_ASSISTANT_ASSISTANT_ID=your-assistant-id
   ```

### IBM Watson Speech to Text (Lite)

1. In IBM Cloud console, navigate to **AI → Speech to Text**
2. Create a service with the **Lite** plan
3. Create service credentials
4. Copy into `.env`:
   ```
   WATSON_SPEECH_TO_TEXT_URL=https://api.us-south.speech-to-text.watson.cloud.ibm.com
   WATSON_SPEECH_TO_TEXT_API_KEY=your-stt-apikey
   ```

### IBM watsonx.ai (Free Toolbox)

1. In IBM Cloud console, navigate to **AI → watsonx.ai**
2. Create a service instance
3. Create a project and note the Project ID
4. Create service credentials (API key)
5. Copy into `.env`:
   ```
   WATSONX_API_KEY=your-watsonx-apikey
   WATSONX_PROJECT_ID=your-project-id
   WATSONX_MODEL_ID=ibm/granite-13b-chat-v2
   WATSONX_URL=https://us-south.ml.cloud.ibm.com
   ```
6. Set `AI_PROVIDER=watsonx` to use watsonx for AI generation

## Step 3: Install IBM SDKs (when ready for real adapters)

The adapters currently fall back to mock implementations. To enable real IBM service calls:

```bash
cd apps/api
npm install @ibm-cloud/cloudant @ibm-cloud/cloud-object-storage @ibm-cloud/watson-assistant @ibm-cloud/speech-to-text @ibm-cloud/watsonx-ai
```

Then implement the real adapter classes in `apps/api/src/lib/ibm/ibm.config.ts` (currently returns mocks for Cloudant, Watson Assistant, and Speech to Text).

## Step 4: Verify configuration

Start the API and check the health endpoint:

```bash
cd apps/api
npm run dev
curl http://localhost:8080/api/v1/health
```

The response includes an `ibmServices` block showing which services are configured:

```json
{
  "ibmServices": {
    "cloudant": { "configured": false, "mock": true },
    "cos": { "configured": false, "mock": true },
    "watsonAssistant": { "configured": false, "mock": true },
    "speechToText": { "configured": false, "mock": true },
    "watsonx": { "configured": false, "mock": true },
    "aiProvider": { "id": "mock", "configured": false, "mock": true }
  }
}
```

## Step 5: Check per-service status

Each IBM service has a status endpoint:

```
GET /api/v1/practices/:practiceId/cloudant/status
GET /api/v1/practices/:practiceId/storage  (COS)
GET /api/v1/practices/:practiceId/assistant/message  (Watson Assistant)
GET /api/v1/practices/:practiceId/transcription  (Speech to Text)
```

## Security & Cost Control

- **Never commit `.env`** with real credentials. Add `apps/api/.env` to `.gitignore`.
- Use **IAM service IDs** with least-privilege access, not your personal API keys.
- Set **billing alerts** in IBM Cloud before enabling paid services.
- Monitor usage against free-tier quotas to avoid unexpected charges.
- All AI output is draft-only and requires qualified clinical review before use.

## Troubleshooting

| Issue | Likely cause | Fix |
|-------|-------------|-----|
| `CLOUDANT_NOT_CONFIGURED` | `CLOUDANT_URL` or `CLOUDANT_API_KEY` not set | Add to `.env` and restart API |
| `IBM_COS_NOT_CONFIGURED` | COS credentials incomplete | Set all `IBM_COS_*` variables |
| Service returns mock | Credentials not set OR provider not selected | Set `OBJECT_STORAGE_PROVIDER=ibm-cos` etc. |
| AI provider not switching | `AI_PROVIDER` not set to desired value | Set `AI_PROVIDER=watsonx` etc. |
