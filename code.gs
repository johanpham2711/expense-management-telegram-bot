var sheetId = "YOUR_SHEET_ID_HERE"; //Update YOUR_SHEET_ID_HERE by ID of Google Sheet
var botToken = "YOUR_BOT_TOKEN_HERE"; //Update YOUR_BOT_TOKEN_HERE by Token Telegram Bot
var allowedUserIds = [123456789]; // Replace with your Telegram user ID
var lastUpdateId;
var expenseSheet = "Expense";
var tempExpenseSheet = "TempExpense";
var categoryListSheet = "Category List";
var categoriesPosition = "A1:A";
var balancePosition = "I3";

var transactionType = {
    cashIn: "Cash In",
    cashOut: "Cash Out",
};

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

    // Check the "/in <amount>-<details>" command
    var cashInRegex = /^\/in\s+(\S+)-(.*)$/i;
    var cashInMatch = text.match(cashInRegex);

    // Check the "/out <amount>-<details>" command
    var cashOutRegex = /^\/out\s+(\S+)-(.*)$/i;
    var cashOutMatch = text.match(cashOutRegex);

    if (cashInMatch) {
        handleCashInTransaction(chatId, cashInMatch);
    } else if (cashOutMatch) {
        handleCashOutTransaction(chatId, cashOutMatch);
    } else {
        sendMessage(
            chatId,
            "❌ Wrong syntax! Please use:\n/in <amount>-<details>\nor\n/out <amount>-<details>"
        );
    }
}

function handleCashInTransaction(chatId, cashInMatch) {
    var amount = parseAmount(cashInMatch[1]);
    var details = cashInMatch[2].trim();

    if (isNaN(amount)) {
        sendMessage(
            chatId,
            "❌ Invalid amount format! Example: /in 50k-Dinner"
        );
        return;
    }

    // Store the transaction data temporarily in a temporary sheet
    storePendingTransaction(chatId, transactionType.cashIn, amount, details);

    // Send category selection menu
    var categories = getCategories();
    sendInlineKeyboard(chatId, "Please select a category:", categories);
}

function handleCashOutTransaction(chatId, cashOutMatch) {
    var amount = parseAmount(cashOutMatch[1]);
    var details = cashOutMatch[2].trim();

    if (isNaN(amount)) {
        sendMessage(
            chatId,
            "❌ Invalid amount format! Example: /out 50k-Dinner"
        );
        return;
    }

    // Store the transaction data temporarily in a temporary sheet
    storePendingTransaction(chatId, transactionType.cashOut, amount, details);

    // Send category selection menu
    var categories = getCategories();
    sendInlineKeyboard(chatId, "Please select a category:", categories);
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
        if (pendingTransaction.type === transactionType.cashIn) {
            sheet.appendRow([
                formatDate(new Date()),
                pendingTransaction.amount,
                null,
                category,
                pendingTransaction.details,
            ]);

            // Get balance
            var balance = getBalance();
            var formattedBalance = formatAmount(balance);

            // Send success message
            sendMessage(
                chatId,
                `✅ Transaction saved:\n- Type: ${
                    pendingTransaction.type
                } 📥\n- Amount: ${formatAmount(
                    pendingTransaction.amount
                )}đ\n- Category: ${category}\n- Details: ${
                    pendingTransaction.details
                }\n- Balance: ${formattedBalance}đ`
            );
        } else {
            sheet.appendRow([
                formatDate(new Date()),
                null,
                pendingTransaction.amount,
                category,
                pendingTransaction.details,
            ]);

            // Get balance
            var balance = getBalance();
            var formattedBalance = formatAmount(balance);

            // Send success message
            sendMessage(
                chatId,
                `✅ Transaction saved:\n- Type: ${
                    pendingTransaction.type
                } 📤\n- Amount: ${formatAmount(
                    pendingTransaction.amount
                )}đ\n- Category: ${category}\n- Details: ${
                    pendingTransaction.details
                }\n- Balance: ${formattedBalance}đ`
            );
        }
    } else {
        sendMessage(chatId, "❌ No pending transaction found.");
    }
}

function storePendingTransaction(chatId, type, amount, details) {
    var tempSheet = getTempSheet();
    tempSheet.appendRow([chatId, type, amount, details]);
}

function retrievePendingTransaction(chatId) {
    var tempSheet = getTempSheet();
    var data = tempSheet.getDataRange().getValues();

    for (var i = 1; i < data.length; i++) {
        if (data[i][0] == chatId) {
            // Remove the row and return the transaction
            tempSheet.deleteRow(i + 1); // Add 1 because rows are 1-indexed
            return {
                type: data[i][1],
                amount: data[i][2],
                details: data[i][3],
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
        tempSheet.appendRow(["ChatId", "Type", "Amount", "Details"]); // Add headers
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

function formatAmount(amount) {
    return amount.toLocaleString("en-US");
}

function getCategories() {
    var sheet =
        SpreadsheetApp.openById(sheetId).getSheetByName(categoryListSheet);
    var categoriesRange = sheet.getRange(categoriesPosition);
    return categoriesRange.getValues().flat().filter(String);
}

function getBalance() {
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName(expenseSheet);
    var balanceCell = sheet.getRange(balancePosition);
    var balance = balanceCell.getValue();
    return balance;
}

