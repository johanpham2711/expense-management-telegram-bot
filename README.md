# <p style="text-align: center">Expense Management Telegram Bot</p>

<div style="display: flex; justify-content: center; flex-wrap: wrap; gap: 10px; text-align: center;">

  <img src="https://img.shields.io/badge/google-4285F4?style=for-the-badge&logo=google&logoColor=white" alt="Google" />
  <img src="https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge&logo=telegram&logoColor=white" alt="Telegram" />
  
</div>

## Description

This project is a Telegram bot for tracking expenses. Users can quickly log expenses with categories and notes, which are saved to a Google Sheet for easy access and management.

[Expense Management Telegram Bot](https://github.com/johanpham2711/expense-management-telegram-bot) with [Google Sheets](https://docs.google.com/spreadsheets), [Google Apps Scripts](https://developers.google.com/apps-script), [Telegram Bot](https://core.telegram.org/bots/api),...

by [Johan Pham](https://github.com/johanpham2711)

---

## Features

-   Add expenses with custom categories and notes.
-   Save data to a specific Google Sheet.
-   Supports flexible amount formats (`5k`, `50k`, `5tr`).
-   User-friendly category selection.

---

## Prerequisites

1. **Google Account**: To access and edit Google Sheets.
2. **Google Apps Script**: Used for handling the bot logic and integration with Telegram.
3. **Telegram Bot**: Create your bot using the BotFather on Telegram and get the bot token.
4. **Google Sheet**: Create a Google Sheet to store expense data.

---

## Setup

### I. Setup a Telegram bot

1. Open **Telegram** and find `@BotFather`
2. Enter `/newbot` to create a new Bot
3. Enter name and username for the Bot
4. Take the **Token API** from BotFather (Example: `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### II. Create and Configure Google Sheet

1. Create a new **Google Sheet**.
2. Rename the second sheet tab to **"Sheet 2"**.
3. Set up the following column structure in **Sheet 2**:

    - **Column A**: Date
    - **Column B**: Amount
    - **Column C**: Category
    - **Column D**: Notes
    - **Column E**: Categories (list category names starting from `E3` to `E14` for dropdown values).

    Example structure in **Sheet 2**:

    | A          | B      | C        | D     | E          |
    | ---------- | ------ | -------- | ----- | ---------- |
    | Date       | Amount | Category | Notes | Categories |
    | 01/05/2025 | 50000  | Food     | Lunch | Food       |
    |            |        |          |       | Transport  |
    |            |        |          |       | Shopping   |

4. Copy the Google Sheet ID from the URL. It will look like this:

```bash
https://docs.google.com/spreadsheets/d/<your-sheet-id>/edit
```

### III. Set Up Google Apps Script

1. Open the script editor in your Google Sheet:
    - Go to **Extensions > Apps Script**.
2. Replace the existing code with the script from this repository (Code.gs).
3. Replace the following placeholders in the script:
    - `sheetId`: Replace with your Google Sheet ID.
    - `botToken`: Replace with your Telegram bot token.
4. Save the script.

### IV. Deploy as Web App

1. In the Apps Script editor, go to Deploy > New Deployment.
2. Select Web App as the deployment type.
3. Set the permissions to Anyone.
4. Copy the deployment URL.

### V. Connect Telegram Bot with Webhook

Run the following command in your terminal (replace placeholders):

```bash
curl -F "url=<web-app-url>" https://api.telegram.org/bot<bot-token>/setWebhook
```

or access this endpoint from browser:

```bash
https://api.telegram.org/bot<bot-token>/setWebhook?url=<web-app-url>
```

Explain:

-   `<web-app-url>`: The deployment URL of your Apps Script.
-   `<bot-token>`: Your Telegram bot token.

Check if you get this response:

```json
{
    "ok": true,
    "result": true,
    "description": "Webhook was set"
}
```

You can verify the webhook setup with:

```bash
curl https://api.telegram.org/bot<bot-token>/getWebhookInfo
```

---

## Usage

### Adding an Expense

To log an expense, use the following format in your Telegram bot:

```php
/chi <amount> <category> [note]
```

Explain:

-   `<amount>`: Enter the amount (supports k, tr, or full numbers).
-   `<category>`: Enter the category name or number from the list.
-   `[note]`: Optional additional notes.

Example:

```bash
/chi 50000 Food Lunch
```

### Selecting Categories

If you don’t remember category numbers, send /chi to display a list of available categories.

---

## Debugging and Logs

-   Use `Logger.log` in the Apps Script editor to debug values.
-   View logs by navigating to **View > Execution Logs**.

---

## Contributing

Feel free to fork this repository, submit issues, or create pull requests.

---

## License

This project is licensed under the MIT License.

---

## Acknowledgments

-   Google Apps Script Documentation
-   Telegram Bot API

