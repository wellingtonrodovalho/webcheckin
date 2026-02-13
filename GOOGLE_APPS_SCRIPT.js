
/**
 * GOOGLE APPS SCRIPT - VERSÃO PARA CONVERSÃO DE IMAGENS
 * Este script salva as fotos no Drive e coloca o link na planilha.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var data = JSON.parse(e.postData.contents);
    
    // Pasta para salvar as fotos
    var folderName = "Fotos_WebCheckin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 1. Organizar Cabeçalhos
    var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (headers[0] === "") { // Se a planilha estiver vazia, cria os cabeçalhos do JSON
      headers = Object.keys(data);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight("bold");
    } else {
      headers = headers.map(function(h) { return h.toString().trim(); });
    }

    // 2. Processar Dados e Imagens
    var rowData = headers.map(function(header) {
      var value = data[header] || "";
      
      // Se for uma imagem (Base64)
      if (typeof value === 'string' && value.indexOf('data:image') === 0) {
        try {
          var parts = value.split(',');
          var contentType = parts[0].split(':')[1].split(';')[0];
          var base64Data = parts[1];
          var extension = contentType.split('/')[1];
          
          var nomeHospede = (data["Nome Titular"] || "Hospede").toString().replace(/[^a-z0-9]/gi, '_');
          var fileName = header + "_" + nomeHospede + "_" + new Date().getTime() + "." + extension;
          
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, fileName);
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          return file.getUrl(); // Retorna o LINK da foto
        } catch (err) {
          return "Erro na Foto: " + err.toString();
        }
      }
      return value;
    });

    // 3. Adicionar linha
    sheet.appendRow(rowData);
    return ContentService.createTextOutput("OK").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
