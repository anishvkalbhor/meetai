<!-- Hero Banner -->
<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?font=Righteous&size=30&center=true&vCenter=true&width=900&height=90&duration=4000&lines=Meet.AI+💬+Your+AI-powered+Meeting+Assistant" alt="MeetAI Banner"/>
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/anishvkalbhor/meetai?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Next.js-15-blue?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/Powered%20by-Gemini%20%7C%20OpenRouter.ai-yellow?style=for-the-badge" />
</p>

---

## 🚀 About MeetAI

> 🤖 **MeetAI** is your intelligent meeting sidekick. It blends modern video conferencing with real-time **AI agents**, delivering **live transcriptions**, **meeting summaries**, and **automated post-call actions**. Think of it as a smart co-host for every video call.

---

## ✨ Key Features

- 🎥 **Real-time video + audio** (powered by [Stream Video SDK](https://getstream.io/video/))
- 🤖 **AI agents** that think, speak, and summarize (via Gemini/OpenRouter)
- 📝 **Live transcriptions** and **intelligent summaries** post-meeting
- 🗓️ Meeting scheduling with agent configuration & session history
- 👋 Create your **personalized** chat with your agents
- 🧠 Async workflows with **Inngest** for background logic
- 🧩 Built modularly using **Shadcn UI** and **TailwindCSS**
- 🔐 Secure auth using **Clerk** and **better-auth**
- 🧭 End-to-end type safety with **tRPC + Drizzle ORM**

---

## 🧱 Tech Stack

<div align="center">

| Category        | Technologies                                                                 |
|----------------|--------------------------------------------------------------------------------|
| 🖥️ **Frontend** | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI                     |
| 🧠 **AI Layer** | Google Gemini API, OpenRouter.ai, Huggingface API                            |
| 🔧 **Backend**  | tRPC, Drizzle ORM, PostgreSQL, Node.js                                        |
| 📹 **Streaming**| Stream SDKs for Video & Chat                                                  |
| 🔐 **Auth**     | Clerk, better-auth                                                            |
| 🔁 **Async**     | Inngest                                                                        |
| 🛠️ **Tools**     | ESLint, Postman, VSCode, Drizzle Studio                                       |

</div>

---

## 🎨 UI Previews

<div align="center" style="margin-top: 2rem;">

<h4>📊 Landing Page</h4>
<img width="600" height="450" alt="image" src="https://github.com/user-attachments/assets/ac3d8456-b57e-4232-a004-5e5ec4746468" />
<br/><br/>

<h4>🧠 Create Your AI Agent</h4>
<img width="600" height="450" alt="Agent Creation" src="https://github.com/user-attachments/assets/81aa3bc9-e4f6-423e-bba2-6577573f2df2" />
<br/><br/>

<h4>👋 Chat Page</h4>
<img width="600" height="450" alt="image" src="https://github.com/user-attachments/assets/8fe61af5-585e-46cf-bdac-3a8ba1ae630f" />
<br/><br/>

<h4> 🗫 Chat UI</h4>
<img width="600" height="450" alt="image" src="https://github.com/user-attachments/assets/419e5b9f-e0af-45d3-9d9c-b92574b50987" />

</div>

---

📂 Project Structure Overview

```bash
meetai/
│
├── src/
│   ├── app/              # Pages & layouts for Next.js routing
│   ├── modules/          # Modularized feature domains (auth, chat, meetings, agents)
│   ├── lib/              # AI services, stream clients, utils
│   ├── db/               # Drizzle schema + DB client
│   ├── inngest/          # Background jobs
│   └── components/       # Shared + UI components (via Shadcn)
│
├── drizzle/              # Migration + metadata
├── public/               # Static assets
├── .env.example          # Example env config
└── README.md

```

## ⚙️ Getting Started

> Run the app locally in under 60 seconds 🚀

```bash
# 1. Clone the project
git clone https://github.com/anishvkalbhor/meetai.git
cd meetai

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env # Fill in required API keys, DB credentials etc.

# 4. Launch dev server
npm run dev

```
<div align='center'>
  
📜 Licensed by MIT

🤝 Contributing
Pull requests, feature ideas, and issues are welcome!

If you found this useful, consider giving a ⭐️ on GitHub.
  
Built with ❤️ by Anish Kalbhor
</div>
