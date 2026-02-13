
/**
 * GOOGLE APPS SCRIPT - VERSÃO DEFINITIVA PARA IMAGENS
 * 1. Salva arquivos Base64 no Google Drive
 * 2. Insere apenas o LINK na planilha
 * 3. Cria automaticamente os cabeçalhos se a planilha estiver vazia
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // Pasta para salvar as fotos (será criada se não existir)
    var folderName = "Fotos_WebCheckin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 1. Obter cabeçalhos existentes ou criar a partir das chaves do JSON
    var sheetHeaders = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
    
    // Se a planilha estiver zerada, usa as chaves do JSON como cabeçalho
    if (sheetHeaders.length === 0 || sheetHeaders[0] === "") {
      sheetHeaders = Object.keys(data);
      sheet.getRange(1, 1, 1, sheetHeaders.length).setValues([sheetHeaders]).setFontWeight("bold").setBackground("#f3f3f3");
    }

    // 2. Mapear os dados para a linha, tratando as imagens Base64
    var newRow = sheetHeaders.map(function(header) {
      var key = header.toString().trim();
      var value = data[key] || "";
      
      // Detecção de Base64 (Imagens)
      if (typeof value === 'string' && value.indexOf('data:image') === 0) {
        try {
          var splitData = value.split(',');
          var contentType = splitData[0].split(':')[1].split(';')[0];
          var rawBase64 = splitData[1];
          var ext = contentType.split('/')[1] || "jpg";
          
          // Nome do arquivo amigável
          var guestName = (data["Nome Titular"] || "Hospede").toString().replace(/[^a-z0-9]/gi, '_');
          var fileName = key.replace(/[^a-z0-9]/gi, '_') + "_" + guestName + "_" + new Date().getTime() + "." + ext;
          
          // Decodifica e salva no Drive
          var decoded = Utilities.base64Decode(rawBase64);
          var blob = Utilities.newBlob(decoded, contentType, fileName);
          var file = folder.createFile(blob);
          
          // Define permissão de visualização para que você possa abrir o link
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          return file.getUrl(); // RETORNA O LINK EM VEZ DO TEXTO BASE64
        } catch (imgErr) {
          return "Erro Imagem: " + imgErr.toString();
        }
      }
      return value;
    });

    // 3. Adiciona a linha na planilha
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro no Script: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
