
/**
 * GOOGLE APPS SCRIPT - VERSÃO DE DIAGNÓSTICO
 * Instruções:
 * 1. Selecione a função 'testePlanilha' na barra superior e clique em 'Executar'.
 * 2. Se aparecer uma linha na sua planilha, o Script está funcionando.
 * 3. O erro no 'doPost' ao clicar em executar é NORMAL (ele só funciona vindo do App).
 */

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
    
    // Fallback para caso o e.postData falhe em certas condições
    var contents = e && e.postData ? e.postData.contents : null;
    if (!contents) {
      return ContentService.createTextOutput("Erro: Dados não recebidos").setMimeType(ContentService.MimeType.TEXT);
    }
    
    var data = JSON.parse(contents);
    
    // Pasta para salvar as fotos
    var folderName = "Fotos_WebCheckin";
    var folders = DriveApp.getFoldersByName(folderName);
    var folder = folders.hasNext() ? folders.next() : DriveApp.createFolder(folderName);

    // Obter ou criar cabeçalhos
    var lastCol = sheet.getLastColumn();
    var headers = lastCol > 0 ? sheet.getRange(1, 1, 1, lastCol).getValues()[0] : [];
    
    if (headers.length === 0) {
      headers = Object.keys(data);
      sheet.appendRow(headers);
    }

    // Criar a nova linha baseada nos cabeçalhos existentes
    var row = headers.map(function(h) {
      var val = data[h] || "";
      
      // Se for uma imagem Base64, salva no Drive e retorna o Link
      if (typeof val === 'string' && val.indexOf('data:image') === 0) {
        try {
          var contentType = val.split(':')[1].split(';')[0];
          var base64Data = val.split(',')[1];
          var blob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, h + "_" + new Date().getTime() + ".jpg");
          var file = folder.createFile(blob);
          file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
          return file.getUrl();
        } catch (err) {
          return "Erro Imagem";
        }
      }
      return val;
    });

    sheet.appendRow(row);
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
