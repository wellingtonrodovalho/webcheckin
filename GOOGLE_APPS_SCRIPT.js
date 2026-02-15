
/**
 * GOOGLE APPS SCRIPT - VERSÃO COM ENVIO DE E-MAIL
 * Este script salva os dados na planilha, as fotos no Drive e envia por e-mail.
 */

const EMAIL_DESTINATARIO = "wellington.rodovalho@gmail.com";

function testePlanilha() {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    sheet.appendRow([new Date(), "TESTE MANUAL", "O script tem permissão de escrita!"]);
    Browser.msgBox("Sucesso! Uma linha de teste foi adicionada à sua planilha.");
  } catch (e) {
    Browser.msgBox("Erro: " + e.toString());
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    
    var contents = e && e.postData ? e.postData.contents : null;
    if (!contents) {
      return ContentService.createTextOutput("Erro: Dados não recebidos").setMimeType(ContentService.MimeType.TEXT);
    }
    
    var data = JSON.parse(contents);
    
    // Pasta para salvar as fotos no Drive
    var folderName = "Fotos_WebCheckin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // Preparação para o E-mail
    var attachments = [];
    var emailBody = "Novo cadastro de hóspede recebido pelo sistema de Web Check-in.\n\n";
    emailBody += "--- DADOS DO FORMULÁRIO ---\n\n";

    // Obter ou criar cabeçalhos na planilha
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    if (headers.length === 0) {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    // Processar os campos para Planilha, Drive e E-mail
    var row = headers.map(function(h) {
      var val = data[h] || "";
      
      // Se for uma imagem Base64
      if (typeof val === 'string' && val.indexOf('data:image') === 0) {
        try {
          var contentType = val.split(':')[1].split(';')[0];
          var base64Data = val.split(',')[1];
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, h.replace(/[^a-z0-9]/gi, '_') + ".jpg");
          
          // Salva no Drive
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          // Adiciona aos anexos do e-mail
          attachments.push(blob);
          
          emailBody += h + ": [Foto Anexada e Salva no Drive]\n";
          return file.getUrl();
        } catch (err) {
          emailBody += h + ": [Erro ao processar imagem]\n";
          return "Erro Imagem";
        }
      }
      
      // Se for texto normal, adiciona ao corpo do e-mail
      emailBody += h + ": " + val + "\n";
      return val;
    });

    // Salva na Planilha
    sheet.appendRow(row);
    
    // Envia o E-mail
    var guestName = data["Nome Titular"] || "Hóspede";
    var propertyName = data["Imóvel"] || "Imóvel não especificado";
    
    MailApp.sendEmail({
      to: EMAIL_DESTINATARIO,
      subject: "WEB CHECK-IN: " + guestName + " - " + propertyName,
      body: emailBody + "\n\nAs fotos originais foram enviadas em anexo a este e-mail.",
      attachments: attachments
    });
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
