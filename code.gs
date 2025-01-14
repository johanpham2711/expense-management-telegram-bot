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

    // Check the message context
    var regex = /^\/chi\s+(\d+)\s+(\S+)\s*(.*)$/i;
    var match = text.match(regex);

    if (match) {
        var amount = match[1];
        var category = match[2];
        var note = match[3] || "";

        // Save to Google Sheets
        var sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();
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

