
/**
 * GOOGLE APPS SCRIPT - VERSÃO MULTI-FORMATO (IMG + PDF)
 * Wellington Rodovalho - Web Check-in
 */

const EMAIL_DESTINATARIO = "wellington.rodovalho@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    var rawData = "";
    if (e.postData && e.postData.contents) {
      rawData = e.postData.contents;
    } else if (e.parameter && e.parameter.dadosJSON) {
      rawData = e.parameter.dadosJSON;
    } else {
      rawData = JSON.stringify(e.parameter);
    }
    
    var data;
    try {
      data = JSON.parse(rawData);
    } catch(err) {
      data = JSON.parse(decodeURIComponent(rawData));
    }

    logDebug("Recebido cadastro de: " + (data["Nome Titular"] || "Hóspede"));

    // 1. Pasta
    var folderName = "Arquivos_Checkin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 2. Colunas
    var headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (headers.length === 0) {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    var attachments = [];
    var emailBody = "Novo cadastro recebido.\n\n";

    var row = headers.map(function(h) {
      var val = data[h] || "";
      
      // Detecta Base64 (Imagens ou PDF)
      if (typeof val === 'string' && val.indexOf('data:') === 0) {
        try {
          var parts = val.split(',');
          var header = parts[0];
          var contentType = header.split(':')[1].split(';')[0];
          var base64Data = parts[1];
          
          // Define a extensão baseada no tipo de conteúdo
          var extension = ".jpg";
          if (contentType === "application/pdf") {
            extension = ".pdf";
          } else if (contentType === "image/png") {
            extension = ".png";
          }
          
          var fileName = h.replace(/[^a-z0-9]/gi, '_') + "_" + new Date().getTime() + extension;
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
          
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          attachments.push(blob);
          emailBody += h + ": [Link: " + file.getUrl() + "]\n";
          return file.getUrl();
        } catch(e) { 
          logDebug("Erro ao processar arquivo " + h + ": " + e.toString());
          return "Erro no Arquivo"; 
        }
      }
      
      emailBody += h + ": " + val + "\n";
      return val;
    });

    sheet.appendRow(row);
    
    // 3. E-mail de Notificação
    try {
      MailApp.sendEmail({
        to: EMAIL_DESTINATARIO,
        subject: "CHECK-IN MULTIMÍDIA: " + (data["Nome Titular"] || "Novo Hóspede"),
        body: emailBody,
        attachments: attachments
      });
    } catch(e) {}

    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    logDebug("Erro crítico no processamento: " + error.toString());
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
