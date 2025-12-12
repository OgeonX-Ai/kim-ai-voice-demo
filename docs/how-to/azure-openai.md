# Azure OpenAI Setup

## Requirements
- Azure subscription
- Azure OpenAI resource

## Step 1: Create Azure OpenAI resource
Azure Portal → Create resource → Azure OpenAI

## Step 2: Deploy a model
Azure OpenAI → Deployments → Create
Choose GPT-4o / GPT-4o-mini

## Step 3: Get credentials
From the resource:
- Endpoint URL
- API Key
- Deployment name

## Step 4: Add to the app
Settings → AI Providers → Azure OpenAI
- API Key
- Endpoint
- Deployment name

## Notes
Azure uses deployment names, not model IDs directly.