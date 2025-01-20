var sheetId = "YOUR_SHEET_ID_HERE"; //Update YOUR_SHEET_ID_HERE by ID of Google Sheet
var botToken = "YOUR_BOT_TOKEN_HERE"; //Update YOUR_BOT_TOKEN_HERE by Token Telegram Bot
var allowedUserIds = [123456789]; // Replace with your Telegram user ID
var lastUpdateId;
var expenseSheet = "Expense";
var tempExpenseSheet = "TempExpense";
var categoryListSheet = "Category List";
var categoriesPosition = "A1:A";

function doPost(e) {
    var update = JSON.parse(e.postData.contents);

    // Check if it's a duplicate update
    if (lastUpdateId == update.update_id) return;
    lastUpdateId = update.update_id;

    // Check if it's a callback query (for category selection)
    if (update.callback_query) {
        handleCallbackQuery(update.callback_query);
        return;
    }

    var message = update.message;
    if (!message || !message.text) return;

    var chatId = message.chat.id;

    // Check if the message is from your Telegram account
    if (!allowedUserIds.includes(chatId)) {
        sendMessage(chatId, "❌ You are not authorized to use this bot.");
        return; // Ignore messages from anyone else
    }

    var text = message.text.trim();

    // Check the "/out <amount>-<details>" command
    var regex = /^\/out\s+(\S+)-(.*)$/i;
    var match = text.match(regex);

    if (match) {
        var amount = parseAmount(match[1]);
        var details = match[2].trim();

        if (isNaN(amount)) {
            sendMessage(
                chatId,
                "❌ Invalid amount format! Example: /out 50k-Dinner"
            );
            return;
        }

        // Store the transaction data temporarily in a temporary sheet
        storePendingTransaction(chatId, amount, details);

        // Send category selection menu
        var categories = getCategories();
        sendInlineKeyboard(chatId, "Please select a category:", categories);
    } else {
        sendMessage(
            chatId,
            "❌ Wrong syntax! Please use: /out <amount>-<details>"
        );
    }
}

function handleCallbackQuery(callbackQuery) {
    var chatId = callbackQuery.message.chat.id;
    var category = callbackQuery.data; // The selected category

    // Retrieve the pending transaction for this user
    var pendingTransaction = retrievePendingTransaction(chatId);
    if (pendingTransaction) {
        // Save to Google Sheets
        var sheet =
            SpreadsheetApp.openById(sheetId).getSheetByName(expenseSheet);
        sheet.appendRow([
            formatDate(new Date()),
            pendingTransaction.amount,
            category,
            pendingTransaction.details,
        ]);

        // Send success message
        sendMessage(
            chatId,
            `✅ Transaction saved:\n- Amount: ${pendingTransaction.amount} đ\n- Category: ${category}\n- Details: ${pendingTransaction.details}`
        );
    } else {
        sendMessage(chatId, "❌ No pending transaction found.");
    }
}

function storePendingTransaction(chatId, amount, details) {
    var tempSheet = getTempSheet();
    tempSheet.appendRow([chatId, amount, details]);
}

function retrievePendingTransaction(chatId) {
    var tempSheet = getTempSheet();
    var data = tempSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == chatId) {
            // Remove the row and return the transaction
            tempSheet.deleteRow(i + 1); // Add 1 because rows are 1-indexed
            return {
                amount: data[i][1],
                details: data[i][2],
            };
        }
    }
    return null; // No transaction found
}

function getTempSheet() {
    var spreadsheet = SpreadsheetApp.openById(sheetId);
    var tempSheet = spreadsheet.getSheetByName(tempExpenseSheet);

    // Create the sheet if it doesn't exist
    if (!tempSheet) {
        tempSheet = spreadsheet.insertSheet(tempExpenseSheet);
        tempSheet.appendRow(["ChatId", "Amount", "Details"]); // Add headers
    }
    return tempSheet;
}

function sendMessage(chatId, text) {
    var url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    var payload = {
        chat_id: chatId,
        text: text,
    };

    var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
    };

    UrlFetchApp.fetch(url, options);
}

function sendInlineKeyboard(chatId, text, categories) {
    var url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    var inlineKeyboard = categories.map((category) => [
        { text: category, callback_data: category },
    ]);

    var payload = {
        chat_id: chatId,
        text: text,
        reply_markup: JSON.stringify({ inline_keyboard: inlineKeyboard }),
    };

    var options = {
        method: "post",
        contentType: "application/json",
        payload: JSON.stringify(payload),
    };

    UrlFetchApp.fetch(url, options);
}

function formatDate(date) {
    var options = {
        weekday: "short",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    };
    return date.toLocaleDateString("en-US", options);
}

function parseAmount(amount) {
    var regex = /^([0-9]+)(k|tr|t)?([0-9]*)?$/i; // Match main number, optional unit, and optional decimals
    var match = regex.exec(amount);

    if (!match) {
        return NaN; // Return NaN for invalid input
    }

    var mainNumber = parseInt(match[1], 10);
    var unit = match[2] ? match[2].toLowerCase() : "";
    var decimals = match[3] ? parseInt(match[3], 10) : 0;

    var multiplier = {
        k: 1000,
        tr: 1000000,
        t: 1000000000,
    };

    // Calculate the total value
    var mainValue = mainNumber * (multiplier[unit] || 1);
    var decimalValue =
        (decimals * (multiplier[unit] || 1)) /
        Math.pow(10, decimals.toString().length);

    return mainValue + decimalValue;
}

function getCategories() {
    var sheet =
        SpreadsheetApp.openById(sheetId).getSheetByName(categoryListSheet);
    var categoriesRange = sheet.getRange(categoriesPosition);
    return categoriesRange.getValues().flat().filter(String);
}

