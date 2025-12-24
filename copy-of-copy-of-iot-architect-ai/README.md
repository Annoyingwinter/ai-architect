<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally with support for multiple AI providers.

View your app in AI Studio: https://ai.studio/apps/drive/1jY3YamlFF2lhaEFtZnvkyXIbv5u8bLCn

## AI Provider Support

This app supports multiple AI providers:
- **Google Gemini** - Advanced AI model from Google
- **ByteDance Doubao (豆包)** - ByteDance's AI assistant

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure AI Provider API Keys:
   
   Create a `.env.local` file in the project root with your API keys:
   
   **For Google Gemini:**
   ```
   API_KEY=your_gemini_api_key_here
   ```
   
   **For ByteDance Doubao:**
   ```
   DOUBAO_API_KEY=your_doubao_api_key_here
   ```
   
   You can configure one or both providers. The app will use the provider you select in the UI.

3. Run the app:
   ```bash
   npm run dev
   ```

## Getting API Keys

### Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the key to your `.env.local` file

### ByteDance Doubao API Key
1. Visit [ByteDance Volcano Engine](https://console.volcengine.com/ark)
2. Create an account and access the Doubao API section
3. Generate an API key
4. Copy the key to your `.env.local` file

