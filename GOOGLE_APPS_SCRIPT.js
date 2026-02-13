
/**
 * GOOGLE APPS SCRIPT PARA RECEBIMENTO DE CADASTRO DE HÓSPEDES
 * 
 * Como usar:
 * 1. Na sua Planilha Google, vá em Extensões > Apps Script.
 * 2. Cole este código e salve.
 * 3. Clique em "Implantar" > "Nova implantação".
 * 4. Escolha "App da Web", coloque "Qualquer pessoa" em quem pode acessar.
 * 5. Copie a URL gerada e certifique-se que é a mesma no arquivo services/externalServices.ts.
 */

function doPost(e) {
  try {
    // Recebe o JSON enviado pelo formulário
    var data = JSON.parse(e.postData.contents);
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    
    // Se a planilha estiver vazia, cria a linha de cabeçalho baseada nas chaves do objeto
    if (sheet.getLastRow() === 0) {
      var headers = Object.keys(data);
      sheet.appendRow(headers);
      
      // Estiliza o cabeçalho (Negrito e cor de fundo)
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f4f6");
      headerRange.setBorder(true, true, true, true, true, true);
    }
    
    // Mapeia os valores do objeto para um array seguindo a ordem das colunas
    // (Garante que se você mudar a ordem no futuro, o script se adapta)
    var currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    var row = currentHeaders.map(function(header) {
      return data[header] !== undefined ? data[header] : "";
    });
    
    // Adiciona os dados na planilha
    sheet.appendRow(row);
    
    // Retorna uma resposta de sucesso para o navegador (mesmo que em no-cors o navegador ignore)
    return ContentService.createTextOutput("Dados recebidos com sucesso!")
                         .setMimeType(ContentService.MimeType.TEXT);
                         
  } catch (error) {
    // Em caso de erro, registra no log do Apps Script
    console.error("Erro no processamento do doPost: " + error.message);
    return ContentService.createTextOutput("Erro: " + error.message)
                         .setMimeType(ContentService.MimeType.TEXT);
  }
}
