
/**
 * GOOGLE APPS SCRIPT - VERSÃO ULTRA ROBUSTA
 * Wellington Rodovalho - Web Check-in
 */

const EMAIL_DESTINATARIO = "wellington.rodovalho@gmail.com";

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    // Captura o JSON - Tenta primeiro pelo parâmetro, depois pelo corpo
    var rawData = e.parameter.dadosJSON || (e.postData ? e.postData.contents : null);
    
    if (!rawData) {
      logDebug("Erro: Nenhum dado encontrado na requisição.");
      return ContentService.createTextOutput("Erro: Sem conteúdo").setMimeType(ContentService.MimeType.TEXT);
    }
    
    var data = JSON.parse(rawData);
    logDebug("Dados recebidos com sucesso para: " + data["Nome Titular"]);

    // 1. Pasta para fotos
    var folderName = "Fotos_WebCheckin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 2. Preparar Planilha e E-mail
    var attachments = [];
    var emailBody = "Novo cadastro de hóspede recebido.\n\n--- DADOS ---\n";
    
    var headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    if (headers.length === 0) {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    var row = headers.map(function(h) {
      var val = data[h] || "";
      
      // Se for imagem Base64
      if (typeof val === 'string' && val.indexOf('data:image') === 0) {
        try {
          var parts = val.split(',');
          var contentType = parts[0].split(':')[1].split(';')[0];
          var base64Data = parts[1];
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, h.replace(/[^a-z0-9]/gi, '_') + ".jpg");
          
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          attachments.push(blob);
          emailBody += h + ": [Link Drive: " + file.getUrl() + "]\n";
          return file.getUrl();
        } catch (err) {
          return "Erro na Imagem";
        }
      }
      
      emailBody += h + ": " + val + "\n";
      return val;
    });

    sheet.appendRow(row);
    
    // 3. Enviar E-mail
    try {
      MailApp.sendEmail({
        to: EMAIL_DESTINATARIO,
        subject: "CHECK-IN: " + (data["Nome Titular"] || "Hóspede") + " - " + (data["Imóvel"] || ""),
        body: emailBody + "\nAs fotos originais estão em anexo.",
        attachments: attachments
      });
    } catch (mErr) {
      logDebug("Erro e-mail: " + mErr.toString());
    }

    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    logDebug("Erro Geral: " + error.toString());
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}

// Função auxiliar para gravar erros na planilha e ajudar a descobrir o que houve
function logDebug(msg) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var logSheet = ss.getSheetByName("DEBUG_LOG") || ss.insertSheet("DEBUG_LOG");
    logSheet.appendRow([new Date(), msg]);
  } catch(e) {}
}
