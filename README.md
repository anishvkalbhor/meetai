
<p align="center">
  <img src="https://readme-typing-svg.herokuapp.com/?font=Righteous&size=28&center=true&vCenter=true&width=800&height=80&duration=4000&lines=Meet.AI+💬+Your+AI-powered+Meeting+Assistant" />
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/anishvkalbhor/meetai?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Next.js-15-blue?style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/badge/Powered%20by-Gemini%20%7C%20OpenRouter.ai-yellow?style=for-the-badge"/>
</p>

---

## 🚀 About MeetAI

> 🤖 **MeetAI** is a modern, full-stack meeting assistant platform that blends real-time video calls with the power of AI. From intelligent agent participation to auto-transcribed summaries — it's like having a smart co-host for every meeting.

---

## ✨ Features

- 🎥 **Real-time video/audio** powered by [Stream Video SDK](https://getstream.io/video/)
- 🧠 **AI agents** using Google Gemini and OpenRouter APIs
- ✍️ **Live transcription** & summarization after each call
- 📅 Schedule meetings, configure agents, track recordings
- 🔁 Handles background tasks seamlessly via **Inngest**
- 💅 Built with modular UI using **Shadcn UI** & **Tailwind CSS**
- 🧭 Fully type-safe backend with **tRPC** + **Drizzle ORM**

---

## 🧱 Tech Stack

<div align="center">

| Category         | Tech Used                                                                 |
|------------------|--------------------------------------------------------------------------|
| **Frontend**     | Next.js 15, React 19, TypeScript, TailwindCSS, Shadcn UI                 |
| **Backend/API**  | Node.js, tRPC, Drizzle ORM, PostgreSQL                                   |
| **AI Services**  | Google Gemini API, OpenRouter.ai                                          |
| **Video/Chat**   | Stream SDKs (Video + Chat)                                                |
| **Auth**         | Clerk, better-auth                                                       |
| **Async Logic**  | Inngest                                                                   |
| **Tools**        | VSCode, Postman, ESLint, GitHub                                           |

</div>

---

## 🖼️ UI Previews (Coming Soon)

<div align="center">

<h4>📊 Agents Page</h4>
<img width="600" height="500" alt="Dashboard Screenshot" src="https://github.com/user-attachments/assets/968d119e-bd07-4f94-afde-1ada3ba9996e" />
<br/><br/>

<h4>🛠️ Create Agent</h4>
<img width="600" height="500" alt="Agent Builder Screenshot" src="https://github.com/user-attachments/assets/81aa3bc9-e4f6-423e-bba2-6577573f2df2" />
<br/><br/>


<h4>📞 Create Meeting</h4>
<img width="600" height="500" alt="image" src="https://github.com/user-attachments/assets/2171ca35-ec78-4852-878f-72e4392550b9" />


</div>

---

## ⚙️ Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/anishvkalbhor/meetai.git
cd meetai

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env # then fill in your keys

# 4. Start dev server
npm run dev
