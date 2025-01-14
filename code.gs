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
    if (amount.toLowerCase().includes("k")) {
        return parseInt(amount.replace("k", "")) * 1000;
    } else if (amount.toLowerCase().includes("tr")) {
        return parseInt(amount.replace("tr", "")) * 1000000;
    } else if (amount.toLowerCase().includes("t")) {
        return parseInt(amount.replace("t", "")) * 1000000000;
    } else {
        return parseInt(amount);
    }
}

function getCategories() {
    var sheet = SpreadsheetApp.openById(sheetId).getSheetByName("Sheet2");
    var categoriesRange = sheet.getRange("E3:E14");
    return categoriesRange.getValues().flat().filter(String);
}

