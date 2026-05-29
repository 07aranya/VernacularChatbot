# VernacularChatbot (YourBuddy AI Tutor)

**VernacularChatbot** is an interactive, multilingual educational AI assistant designed to help students with their studies in regional languages, including Marathi and Hindi. Built using React, TypeScript, and powered by the Gemini API, this project provides a seamless conversational interface tailored for vernacular learning.

---

## ⚠️ Important Note Regarding the Live Demo
You can access the live demo of the application here: **[Live Demo](https://ai-vernacular-chatbot.vercel.app/)**

**Please Note: The AI will not generate responses unless a valid Gemini API key is provided.** The current live deployment is primarily meant to showcase the UI/UX design, layout, and how the application handles user interactions. To get actual AI-generated responses, you must run the project locally and configure your own API key.

---

## 🚀 Features
* **Multilingual Support:** Communicate and learn in vernacular languages like Hindi and Marathi.
* **Educational Focus:** Designed specifically as an AI tutor to assist with coursework and academic queries.
* **Modern UI/UX:** A clean, responsive, and intuitive chat interface.
* **AI-Powered:** Leverages the advanced capabilities of the Gemini API for highly contextual and accurate responses.

## 🛠️ Tech Stack
* **Frontend:** React, TypeScript, Vite
* **AI Integration:** Google Gemini API
* **Deployment:** Vercel

## 💻 Running the Project Locally

Follow these steps to run the chatbot on your local machine and fully interact with the AI:

### 1. Clone the repository
git clone [https://github.com/07aranya/VernacularChatbot.git](https://github.com/07aranya/VernacularChatbot.git)
cd VernacularChatbot 

### 2. Install dependencies
npm install

### 3. Configure your API Key
Because the application requires an API key to generate responses:

Go to Google AI Studio and generate a free API key.

Create a .env file in the root directory of your project.

Add your Gemini API key to the environment variables (e.g., VITE_GEMINI_API_KEY=your_api_key_here).


### 4. Start the development server
npm run dev

### 5. Open in Browser
Navigate to http://localhost:5173 (or the local port provided by Vite) to start chatting with the AI Tutor!


Created by 07aranya
