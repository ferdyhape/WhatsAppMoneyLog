# WaMoneyLog - WhatsApp Money Tracker Bot

## :open_book: Description

A WhatsApp bot for tracking personal income and expenses using the `@whiskeysockets/baileys` library.  
This bot automatically parses money-related messages, stores transactions in a database, and provides detailed financial reports directly through WhatsApp conversations.

Built with Node.js, Express.js, and Prisma ORM for robust data management and easy customization.

---

## :hammer_and_wrench: Requirements

- Node.js v18+
- PostgreSQL/MySQL/SQLite (supported by Prisma)
- WhatsApp account for bot connection

---

## :file_folder: Project Structure

```
WaMoneyLog/
├── client/                 # Web interface files
│   ├── assets/            # Static assets (icons, images)
│   ├── index.html         # Main web interface
│   └── server.html        # Server status page
├── config/                # Configuration files
│   ├── keywordsTrigger.js # Trigger keywords and money patterns
│   └── params.js          # Application parameters
├── controllers/           # Request controllers
│   └── whatsappController.js
├── helpers/               # Utility functions
│   ├── formatter.js       # Data formatting helpers
│   ├── logger.js          # Logging utilities
│   ├── parsingMessage.js  # Message parsing logic
│   └── response.js        # Response helpers
├── prisma/                # Database schema and migrations
│   ├── migrations/        # Database migration files
│   └── schema.prisma      # Database schema definition
├── routes/                # API routes
│   └── webRoute.js
├── services/              # Business logic
│   └── transactionService.js
├── templates/             # Message templates
│   ├── help.txt           # Help command template
│   ├── template_message.txt # Transaction confirmation template
│   └── template_report.txt  # Report generation template
└── logs/                  # Application logs
    └── app.log
```

---

## :rocket: How to Install

1. **Clone this repository**

   ```bash
   git clone https://github.com/ferdyhape/WhatsAppMoneyLog.git
   ```

2. **Go to the project directory and install dependencies**

   ```bash
   cd wamoneylog
   npm install
   ```

3. **Set up your database**

   - Configure your database connection in the `.env` file
   - Run Prisma migrations:

   ```bash
   npx prisma migrate dev
   ```

4. **Configure environment variables**

   Create a `.env` file:

   ```env
   DATABASE_URL="your_database_connection_string" # e.g., "mysql://user:password@localhost:5432/dbname"
   ALLOWED_WHATSAPP_NUMBER=6287856725286 # Your WhatsApp number
   PORT=3000 # Port for the web server
   ```

5. **Run the application**

   ```bash
   npm start
   ```

6. **Connect your WhatsApp**

   - Open your browser and go to `http://localhost:3000` (or your configured port)
   - Scan the QR code with your WhatsApp mobile app to connect the bot

---

## :speech_balloon: How to Use

### Recording Transactions

Send messages in the format:

```
in [amount] [description]
out [amount] [description]
```

**Optional:** Add `-date:DD-MM-YYYY` to specify a custom date

**Examples:**

```
out 10rb lunch -date:23-06-2025
in 300rb project payment
out 15rb coffee and snacks
```

_If `-date` is not provided, today's date will be used automatically._

### Viewing Reports

Send commands to view your transaction history:

```
-show daily:DD-MM-YYYY
-show monthly:MM-YYYY
-show yearly:YYYY
```

**Examples:**

```
-show daily:25-06-2025
-show monthly:06-2025
-show yearly:2025
```

### Getting Help

Send `help` to get the complete list of available commands and usage instructions.

---

## :gear: Customization

### Money Keywords & Patterns

You can customize trigger keywords and money conversion patterns in `config/keywordsTrigger.js`:

```javascript
// Income triggers
export const incomeKeywords = ["in", "income", "masuk"];

// Expense triggers
export const expenseKeywords = ["out", "expense", "keluar"];

// Money conversion patterns
export const moneyConvert = [
  ["rb", 1_000], // ribu
  ["k", 1_000], // thousand
  ["jt", 1_000_000], // juta
  ["m", 1_000_000_000], // miliar
];
```

### Message Templates

Customize bot responses by editing templates in the `templates/` directory:

- `help.txt` - Help command response
- `template_message.txt` - Transaction confirmation message
- `template_report.txt` - Report formatting template

---

## :building_construction: Built With

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Prisma ORM** - Database management
- **@whiskeysockets/baileys** - WhatsApp Web API
- **SQLite/PostgreSQL/MySQL** - Database options

---

## :man: About Creator

[![linkedin](https://img.shields.io/badge/linkedin-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ferdy-hahan-pradana)
[![instagram](https://img.shields.io/badge/instagram-833AB4?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/ferdyhape)
[![github](https://img.shields.io/badge/github-333?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ferdyhape)
