
/**
 * GOOGLE APPS SCRIPT - VERSÃO ULTRA ROBUSTA
 * 
 * Instruções:
 * 1. Substitua todo o código anterior por este.
 * 2. Clique em Salvar (disquete).
 * 3. Clique em Implantar > Gerenciar Implantações.
 * 4. Edite a implantação atual, escolha "Nova Versão" e clique em Implantar.
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Espera até 10 segundos para evitar conflitos de escrita simultânea

  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Tenta ler os dados enviados
    var contents = e.postData.contents;
    var data = JSON.parse(contents);
    
    // Obtém os cabeçalhos atuais ou cria se estiver vazio
    var lastCol = sheet.getLastColumn();
    var headers = [];
    
    if (lastCol > 0) {
      headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    } else {
      // Se a planilha estiver totalmente limpa, usa as chaves do JSON como cabeçalho
      headers = Object.keys(data);
      sheet.appendRow(headers);
      // Formatação básica para o cabeçalho
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#E2E8F0");
    }

    // Prepara a nova linha baseada nos cabeçalhos existentes
    var newRow = headers.map(function(h) {
      return data[h] !== undefined ? data[h] : "";
    });

    // Adiciona a linha de dados
    sheet.appendRow(newRow);
    
    return ContentService.createTextOutput("Sucesso").setMimeType(ContentService.MimeType.TEXT);
    
  } catch (f) {
    console.error("Erro no script: " + f.toString());
    return ContentService.createTextOutput("Erro: " + f.toString()).setMimeType(ContentService.MimeType.TEXT);
  } finally {
    lock.releaseLock();
  }
}
