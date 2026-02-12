
import { FullFormData } from "../types";

/**
 * URL oficial fornecida pelo usuário para integração com Google Sheets.
 */
const GOOGLE_SHEETS_WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzIdZQ4miAqB6bXpO-4vh-lHZKWbL67t1jWyMjsqRVJfxEqoykfRzpStCqBroGijxaz/exec";

export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  console.log("Iniciando salvamento no Google Sheets...", data);

  if (!GOOGLE_SHEETS_WEBAPP_URL) {
    console.error("URL do Google Sheets não configurada.");
    return false;
  }

  try {
    // Usamos 'text/plain' para evitar que o navegador bloqueie a requisição por CORS (preflight).
    // O Apps Script receberá o JSON no campo e.postData.contents normalmente.
    await fetch(GOOGLE_SHEETS_WEBAPP_URL, {
      method: 'POST',
      mode: 'no-cors', 
      headers: {
        'Content-Type': 'text/plain',
      },
      body: JSON.stringify(data),
    });

    // Com mode 'no-cors', o fetch não retorna se deu certo ou errado (status sempre 0),
    // mas se não houver erro de rede, o dado foi enviado para os servidores do Google.
    return true;
  } catch (error) {
    console.error("Erro ao enviar para Google Sheets:", error);
    throw new Error("Falha na conexão com a planilha. Verifique sua internet.");
  }
};

export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  console.log(`Simulando envio para Autentique: ${guestName} (${guestEmail})...`);
  
  // Integração com Autentique requer API Key e conta paga.
  // Mantendo simulação conforme o fluxo do app.
  await new Promise(resolve => setTimeout(resolve, 2000));
  return "doc_mock_" + Math.random().toString(36).substr(2, 9);
};
