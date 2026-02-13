
/**
 * GOOGLE APPS SCRIPT - VERSÃO AUTO-CONFIGURÁVEL
 * 
 * 1. Limpe sua planilha completamente.
 * 2. Cole este código.
 * 3. Salve e Implante como "Nova Versão".
 * 4. Configure "Quem pode acessar" como "Qualquer pessoa".
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheets()[0]; // Pega a primeira aba
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // 1. Identificar cabeçalhos atuais
    var lastCol = Math.max(sheet.getLastColumn(), 1);
    var headers = [];
    
    if (sheet.getLastColumn() > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(function(h) {
        return h.toString().trim();
      }).filter(String);
    }

    // 2. Verificar se o JSON tem chaves que não existem nas colunas
    var jsonKeys = Object.keys(data);
    var missingKeys = jsonKeys.filter(function(key) {
      return headers.indexOf(key) === -1;
    });

    // 3. Se houver chaves novas, adiciona como novas colunas
    if (missingKeys.length > 0) {
      var startCol = headers.length + 1;
      sheet.getRange(1, startCol, 1, missingKeys.length)
           .setValues([missingKeys])
           .setFontWeight("bold")
           .setBackground("#F1F5F9")
           .setVerticalAlignment("middle");
      
      // Atualiza a lista de cabeçalhos para incluir as novas
      headers = headers.concat(missingKeys);
      // Ajusta a largura das novas colunas
      for(var i=0; i < missingKeys.length; i++) {
        sheet.setColumnWidth(startCol + i, 150);
      }
    }

    // 4. Montar a linha de dados seguindo a ordem exata dos cabeçalhos
    var rowData = headers.map(function(header) {
      return data[header] !== undefined ? data[header] : "";
    });

    // 5. Adicionar os dados na última linha
    sheet.appendRow(rowData);
    
    // Formatação de conveniência para a nova linha
    var lastRow = sheet.getLastRow();
    sheet.getRange(lastRow, 1, 1, headers.length).setVerticalAlignment("top");
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);

  } catch (error) {
    console.error("Erro: " + error.toString());
    return ContentService.createTextOutput("Erro: " + error.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
