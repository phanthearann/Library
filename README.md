# 📚 Library Management REST API

## 1. Project Description

This project is a Library Management REST API built using Node.js without Express.

The system manages books, library members, loans, and categories. It uses JSON files to store data permanently.

## 2. Technologies Used

- Node.js
- JavaScript
- HTTP Module
- File System (fs.promises)
- EventEmitter
- JSON
- NPM
- Git & GitHub

## 3. Project Structure

```text
Library/
│
├── Data/
│   ├── activity.log
│   ├── books.json
│   ├── members.json
│   ├── loans.json
│   └── categories.json
│
├── lib/
│   ├── body.js
│   ├── events.js
│   └── send.js
│
├── resources/
│   ├── books.js
│   ├── members.js
│   ├── loans.js
│   └── categories.js
│
├── activity.js
├── check.config.json
├── check.js
├── config.js
├── router.js
├── server.js
├── package.json
└── README.md
```

## 4. Installation

Clone the repository:

```bash
git clone <repository-url>
```

Go to the project folder:

```bash
cd Library
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```powershell
Copy-Item .env.example .env
```

## 5. Run the Project

Start the server:

```bash
npm start
```

Run in development mode (if available):

```bash
npm run dev
```

Run automatic tests:

```bash
npm run check
```

## 6. API Endpoints

### Books API

| Method | Endpoint | Description |
|---|---|---|
| GET | /books | Get all books |
| POST | /books | Create a new book |
| GET | /books/:id | Get book by ID |
| PUT | /books/:id | Update a book |
| DELETE | /books/:id | Delete a book |

### Members API

| Method | Endpoint | Description |
|---|---|---|
| GET | /members | Get all members |
| POST | /members | Create a new member |
| GET | /members/:id | Get member by ID |
| PUT | /members/:id | Update a member |
| DELETE | /members/:id | Delete a member |

### Loans API

| Method | Endpoint | Description |
|---|---|---|
| GET | /loans | Get all loans |
| POST | /loans | Create a new loan |
| GET | /loans/:id | Get loan by ID |
| PUT | /loans/:id/end | End a loan |
| DELETE | /loans/:id | Delete a loan |

### Categories API

| Method | Endpoint | Description |
|---|---|---|
| GET | /categories | Get all categories |
| POST | /categories | Create a category |
| GET | /categories/:id | Get category by ID |
| PUT | /categories/:id | Update a category |
| DELETE | /categories/:id | Delete a category |

## 7. HTTP Status Codes

| Status Code | Description |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 404 | Not Found |
| 405 | Method Not Allowed |
| 409 | Conflict |
| 500 | Internal Server Error |

## 8. Data Storage

The project uses JSON files to store data.

- books.json - Stores book information.
- members.json - Stores member information.
- loans.json - Stores loan records.
- categories.json - Stores book categories.

Data is saved automatically whenever a resource is created, updated, or deleted.

## 9. Activity Log

The project uses EventEmitter to track activities.

Supported events:

- created
- updated
- deleted

All activities are recorded in `Data/activity.log`.

Example:

```text
2026-11-02T08:15:30.123Z created books #3
2026-11-02T08:16:02.511Z deleted books #3
```

## 10. Team Members

| Role | Name | Responsibility |
|---|---|---|
| Core Owner | [Your Name] | Server, Router, Activity Log, README |
| ITEM Owner | [Member Name] | Books Management |
| PERSON Owner | [Member Name] | Members Management |
| LINK Owner | [Member Name] | Loans Management |
| EXTRA Owner | [Member Name] | Categories Management |

## 11. Project Requirements

- Node.js without Express.
- Use CommonJS modules (`require` and `module.exports`).
- Use JSON files for data storage.
- Use `fs.promises` and `async/await`.
- Use EventEmitter for activity tracking.
- Return JSON responses for all API requests.

---

**Project:** Library Management REST API

**Course:** Web Development I (WBD I)

**Institution:** SETEC Institute
