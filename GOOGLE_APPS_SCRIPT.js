
/**
 * GOOGLE APPS SCRIPT - VERSÃO COMPATIBILIDADE MÓVEL
 * Wellington Rodovalho - Web Check-in
 */

const EMAIL_DESTINATARIO = "wellington.rodovalho@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    // Tenta ler o JSON de todos os lugares possíveis (corpo, parâmetros, etc)
    var rawData = "";
    if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e.parameter && e.parameter.dadosJSON) {
      rawData = e.parameter.dadosJSON;
    } else {
      // Caso o navegador móvel envie como um objeto de formulário serializado
      rawData = JSON.stringify(e.parameter);
    }
    
    var data;
    try {
      data = JSON.parse(rawData);
    } catch(err) {
      // Tenta limpar a string caso tenha chegado com lixo de URL encoding
      data = JSON.parse(decodeURIComponent(rawData));
    }

    logDebug("Recebido via mobile de: " + (data["Nome Titular"] || "Desconhecido"));

    // 1. Garantir pasta
    var folderName = "Fotos_Checkin_Mobile";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 2. Processar colunas
    var headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (headers.length === 0) {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    var attachments = [];
    var emailBody = "Novo cadastro (Mobile/Web)\n\n";

    var row = headers.map(function(h) {
      var val = data[h] || "";
      
      if (typeof val === 'string' && val.indexOf('data:image') === 0) {
        try {
          var parts = val.split(',');
          var contentType = parts[0].split(':')[1].split(';')[0];
          var blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), contentType, h.replace(/[^a-z0-9]/gi, '_') + ".jpg");
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          attachments.push(blob);
          emailBody += h + ": " + file.getUrl() + "\n";
          return file.getUrl();
        } catch(e) { return "Erro Img"; }
      }
      
      emailBody += h + ": " + val + "\n";
      return val;
    });

    sheet.appendRow(row);
    
    // 3. E-mail
    try {
      MailApp.sendEmail({
        to: EMAIL_DESTINATARIO,
        subject: "MOBILE CHECK-IN: " + (data["Nome Titular"] || "Hóspede"),
        body: emailBody,
        attachments: attachments
      });
    } catch(e) {}

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    logDebug("Erro doPost: " + error.toString());
    return ContentService.createTextOutput("Error").setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

function logDebug(msg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName("DEBUG_LOG") || ss.insertSheet("DEBUG_LOG");
    logSheet.appendRow([new Date(), msg]);
  } catch(e) {}
}
