var sheetId = "YOUR_SHEET_ID_HERE"; //Update YOUR_SHEET_ID_HERE by ID of Google Sheet
var botToken = "YOUR_BOT_TOKEN_HERE"; //Update YOUR_BOT_TOKEN_HERE by Token Telegram Bot
var lastUpdateId;

function doPost(e) {
    var update = JSON.parse(e.postData.contents);

    // Check the new update
    if (lastUpdateId == update.update_id) return;
    lastUpdateId = update.update_id;

    var message = update.message;
    var chatId = message.chat.id;
    var text = message.text;

    // Check the command "/chi"
    if (text.startsWith("/chi ")) {
        var categories = getCategories();
        sendMessage(
            chatId,
            `Please select category:\n${categories
                .map((c, i) => `${i + 1}. ${c}`)
                .join("\n")}`
        );
    }

    // Check the message context
    var regex = /^\/chi\s+(\S+)\s+(\d+|\D+)\s*(.*)$/i;
    var match = text.match(regex);

    if (match) {
        var amount = parseAmount(match[1]);
        var category = match[2];
        var note = match[3] || "";

        // Save to Google Sheets
        var sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet1");
        sheet.appendRow([formatDate(new Date()), amount, category, note]);

        // Send back success message
        sendMessage(
            chatId,
            `✅ Saved: \n- Amount: ${amount} \n- Category: ${category} \n- Note: ${note}`
        );
    } else {
        sendMessage(
            chatId,
            "❌ Wrong syntax! Please use: \n/chi <amount> <category> [note]"
        );
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
    var regex = /^(\d+)(k|tr|t)?(\d+)?$/i; // Match main number, optional unit, and optional decimals
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

