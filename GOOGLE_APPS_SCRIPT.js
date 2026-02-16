
/**
 * GOOGLE APPS SCRIPT - VERSÃO COM AUTO-EXPANSÃO DE COLUNAS
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

    // 1. Gerenciar Pasta de Arquivos
    var folderName = "Arquivos_Checkin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 2. Gerenciar Cabeçalhos (Auto-Expansão)
    // Pega os cabeçalhos atuais da linha 1
    var currentHeaders = sheet.getLastColumn() > 0 
      ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] 
      : [];
    
    var payloadKeys = Object.keys(data);
    
    // Identifica chaves no payload que ainda não são colunas na planilha
    var newKeys = payloadKeys.filter(function(key) {
      return currentHeaders.indexOf(key) === -1;
    });

    // Se houver campos novos, adiciona como novas colunas
    if (newKeys.length > 0) {
      var nextCol = currentHeaders.length + 1;
      sheet.getRange(1, nextCol, 1, newKeys.length).setValues([newKeys]);
      // Atualiza a lista de cabeçalhos local para mapear a linha corretamente
      currentHeaders = currentHeaders.concat(newKeys);
    }

    var attachments = [];
    var emailBody = "Novo cadastro recebido.\n\n";

    // 3. Mapear dados para as colunas
    var row = currentHeaders.map(function(h) {
      var val = data[h] || "";
      
      // Detecta Base64 (Imagens ou PDF) para salvar no Drive
      if (typeof val === 'string' && val.indexOf('data:') === 0) {
        try {
          var parts = val.split(',');
          var header = parts[0];
          var contentType = header.split(':')[1].split(';')[0];
          var base64Data = parts[1];
          
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

    // Adiciona a linha de dados
    sheet.appendRow(row);
    
    // 4. E-mail de Notificação
    try {
      MailApp.sendEmail({
        to: EMAIL_DESTINATARIO,
        subject: "CHECK-IN ATUALIZADO: " + (data["Nome Titular"] || "Novo Hóspede"),
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
