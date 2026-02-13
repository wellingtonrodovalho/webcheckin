
/**
 * GOOGLE APPS SCRIPT - VERSÃO COM SUPORTE A ARQUIVOS (DOCS/SELFIES)
 * 
 * Este script salva imagens enviadas em base64 no Google Drive
 * e coloca o link de visualização na planilha.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // Pasta para salvar os arquivos (Cria se não existir)
    var folderName = "Documentos_Hospedes_Reservas";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 1. Identificar e Criar cabeçalhos
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headers = [];
    if (sheet.getLastColumn() > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return h.toString().trim();
      }).filter(String);
    }

    var jsonKeys = Object.keys(data);
    var missingKeys = jsonKeys.filter(function(key) {
      return headers.indexOf(key) === -1;
    });

    if (missingKeys.length > 0) {
      var startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, missingKeys.length)
           .setValues([missingKeys])
           .setFontWeight("bold")
           .setBackground("#F1F5F9");
      headers = headers.concat(missingKeys);
    }

    // 2. Processar dados e converter base64 em links do Drive
    var rowData = headers.map(function(header) {
      var value = data[header];
      
      // Se o valor parecer uma imagem em base64
      if (typeof value === 'string' && value.indexOf('data:image') === 0) {
        try {
          var contentType = value.substring(5, value.indexOf(';'));
          var extension = contentType.split('/')[1];
          var base64Data = value.substring(value.indexOf(',') + 1);
          var decoded = Utilities.base64Decode(base64Data);
          var blob = Utilities.newBlob(decoded, contentType, header + "_" + data["Nome Titular"] + "_" + new Date().getTime() + "." + extension);
          
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          return file.getUrl();
        } catch (err) {
          return "Erro ao processar imagem: " + err.toString();
        }
      }
      
      return value !== undefined ? value : "";
    });

    // 3. Adicionar na planilha
    sheet.appendRow(rowData);
    
    // Auto-ajuste de colunas
    sheet.autoResizeColumns(1, headers.length);
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
