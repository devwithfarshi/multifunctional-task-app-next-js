# 🧠 Multi-Functional To-Do App

A modern **full-stack productivity app** built with **Next.js 16**, featuring authentication, reminders, and email notifications.
Manage your tasks efficiently — anywhere, anytime.

---

## 🧱 Tech Stack

| Layer          | Tech                                         |
| -------------- | -------------------------------------------- |
| **Frontend**   | Next.js 16, React 19, TailwindCSS, Shadcn UI |
| **Backend**    | Next.js API Routes, Mongoose ODM             |
| **Database**   | MongoDB                                      |
| **Auth**       | NextAuth.js                                  |
| **Email**      | Nodemailer                                   |
| **Task Queue** | BullMQ + Redis                               |

---

## ✨ Features

### 🔐 Authentication

- Secure login & registration using **NextAuth.js**
- Supports **Credentials** and **Google OAuth**
- JWT-based session handling

### 📝 Task Management (CRUD)

- Create, Read, Update, Delete tasks
- Each user has their own task list
- Filter and search tasks easily
- Mark tasks as **complete** or **pending**

### ⏰ Reminders & Notifications

- Set **reminders** for tasks
- Automatic **email notifications** when a reminder is due
- **Enable/disable** reminders anytime

### 📧 Email Integration

- Uses **Nodemailer** for sending emails
- Pre-formatted email templates

### 🎨 UI & UX

- Built with **Tailwind CSS** + **Shadcn UI**
- Fully **responsive** and **modern dashboard**
- Light/Dark mode support
- Toast notifications for actions

### 🧠 Backend & API

- **Next.js App Router** with API routes
- **Mongoose ODM** for database management
- RESTful API structure
- Input validation and error handling

### ⚙️ Performance & Scalability

- **BullMQ + Redis** for scalable reminders
