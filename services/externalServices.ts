
import { FullFormData } from "../types";

/**
 * Simulates sending data to a Google Sheet.
 * In a real scenario, this would POST to a Google Apps Script Web App URL.
 */
export const saveToGoogleSheets = async (data: FullFormData): Promise<boolean> => {
  console.log("Saving to Google Sheets...", data);
  // Simulating network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  return true;
};

/**
 * Simulates sending the PDF to Autentique for digital signature.
 * Autentique uses a GraphQL API.
 */
export const sendToAutentique = async (pdfBase64: string, guestEmail: string, guestName: string): Promise<string> => {
  console.log(`Sending contract to Autentique for ${guestName} (${guestEmail})...`);
  
  // Real implementation would look like this:
  /*
  const query = `
    mutation CreateDocument($document: DocumentInput!, $signers: [SignerInput!]!) {
      createDocument(document: $document, signers: $signers) {
        id
        name
      }
    }
  `;
  // POST to https://api.autentique.com.br/v2/graphql with AUTH token
  */

  await new Promise(resolve => setTimeout(resolve, 2000));
  return "doc_auth_123456789"; // Mock document ID
};
