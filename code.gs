var sheetId = "YOUR_SHEET_ID_HERE"; //Update YOUR_SHEET_ID_HERE by ID of Google Sheet
var botToken = "YOUR_BOT_TOKEN_HERE"; //Update YOUR_BOT_TOKEN_HERE by Token Telegram Bot
var lastUpdateId;
var pendingTransactions = []; // To track transactions awaiting category selection

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
    var text = message.text.trim();

    // Check the "/chi <amount>-<details>" command
    var regex = /^\/chi\s+(\S+)-(.*)$/i;
    var match = text.match(regex);

    if (match) {
        var amount = parseAmount(match[1]);
        var details = match[2].trim();

        if (isNaN(amount)) {
            sendMessage(
                chatId,
                "❌ Invalid amount format! Example: /chi 50k-Dinner"
            );
            return;
        }

        // Store the transaction data temporarily
        pendingTransactions.push({ amount: amount, details: details });

        // Send category selection menu
        var categories = getCategories();
        sendInlineKeyboard(chatId, "Please select a category:", categories);
    } else {
        sendMessage(
            chatId,
            "❌ Wrong syntax! Please use: /chi <amount>-<details>"
        );
    }
}

function handleCallbackQuery(callbackQuery) {
    var chatId = callbackQuery.message.chat.id;
    var category = callbackQuery.data; // The selected category

    // Check if there's a pending transaction for this user
    var pendingTransaction = pendingTransactions.pop();
    if (pendingTransaction) {
        // Save to Google Sheets
        var sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
        sheet.appendRow([
            formatDate(new Date()),
            pendingTransaction.amount,
            category,
            pendingTransaction.details,
        ]);

        // Send success message
        sendMessage(
            chatId,
            `✅ Transaction saved:\n- Amount: ${pendingTransaction.amount}\n- Category: ${category}\n- Details: ${pendingTransaction.details}`
        );
    } else {
        sendMessage(chatId, "❌ No pending transaction found.");
    }
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
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet2");
    var categoriesRange = sheet.getRange("E3:E14");
    return categoriesRange.getValues().flat().filter(String);
}

