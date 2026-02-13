
/**
 * GOOGLE APPS SCRIPT - VERSÃO ROBUSTA PARA IMAGENS E DADOS
 * 
 * Este script recebe dados de um formulário, detecta imagens em base64,
 * salva-as no Google Drive e insere os links na planilha.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  // Aumentado o tempo de espera para evitar colisões em envios simultâneos
  lock.tryLock(30000); 

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0];
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // Pasta para salvar os arquivos
    var folderName = "Documentos_Hospedes_Reservas";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // 1. Obter ou Criar cabeçalhos
    var headers = [];
    if (sheet.getLastColumn() > 0) {
      headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(function(h) {
        return h.toString().trim();
      });
    }

    // Identificar novas chaves no JSON que não estão na planilha
    var jsonKeys = Object.keys(data);
    var missingKeys = jsonKeys.filter(function(key) {
      return headers.indexOf(key) === -1;
    });

    if (missingKeys.length > 0) {
      var startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, missingKeys.length)
           .setValues([missingKeys])
           .setFontWeight("bold")
           .setBackground("#F1F5F9")
           .setVerticalAlignment("middle");
      headers = headers.concat(missingKeys);
    }

    // 2. Processar cada valor da linha
    var rowData = headers.map(function(header) {
      var value = data[header];
      
      if (value === undefined || value === null) return "";

      // Verificar se é uma imagem em Base64 (Data URL)
      if (typeof value === 'string' && value.indexOf('data:image') === 0) {
        try {
          var parts = value.split(',');
          var metadata = parts[0];
          var base64Data = parts[1];
          
          var contentType = metadata.substring(5, metadata.indexOf(';'));
          var extension = contentType.split('/')[1] || "jpg";
          
          // Nome amigável para o arquivo
          var guestName = (data["Nome Titular"] || "Hospede").toString().replace(/[^a-z0-9]/gi, '_');
          var fileName = header.replace(/[^a-z0-9]/gi, '_') + "_" + guestName + "_" + new Date().getTime() + "." + extension;
          
          var decoded = Utilities.base64Decode(base64Data);
          var blob = Utilities.newBlob(decoded, contentType, fileName);
          
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          
          // Retorna o link do arquivo para a planilha
          return file.getUrl();
        } catch (err) {
          // Se falhar a conversão da imagem, salva um trecho do base64 para diagnóstico
          return "ERRO IMAGEM: " + err.toString() + " | Início: " + value.substring(0, 50);
        }
      }
      
      return value;
    });

    // 3. Inserir a linha na planilha
    sheet.appendRow(rowData);
    
    // Formatação básica de estética
    sheet.autoResizeColumns(1, headers.length);
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro Crítico: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
