import axios from 'axios';

// Configuration
const AWS_PROXY_URL = process.env.AMIGO_AWS_URL?.replace(/\/$/, '') || ''; // Your AWS Tunnel URL
const AMIGO_API_KEY = process.env.AMIGO_API_KEY || '';

// Create a dedicated Axios instance for Amigo via AWS
export const amigoClient = axios.create({
  baseURL: AWS_PROXY_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': AMIGO_API_KEY,
    'Accept': 'application/json',
  },
  // Timeout to prevent hanging if AWS is slow
  timeout: 45000, 
});

/**
 * Helper to call Amigo endpoints through the AWS Tunnel.
 * Ensures strict path formatting and error handling.
 */
export async function callAmigoAPI(endpoint: string, payload: any, idempotencyKey?: string) {
  if (!AWS_PROXY_URL) {
    throw new Error('AMIGO_AWS_URL is not defined in environment variables.');
  }

  // Ensure endpoint starts with / and ends with / as per Amigo docs (e.g., /data/)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // Amigo specific: some endpoints behave better with trailing slash
  const finalPath = cleanEndpoint.endsWith('/') ? cleanEndpoint : `${cleanEndpoint}/`;

  console.log(`[Amigo Tunnel] Request -> ${AWS_PROXY_URL}${finalPath}`);

  try {
    const headers: Record<string, string> = {};
    if (idempotencyKey) {
      headers['Idempotency-Key'] = idempotencyKey;
    }

    // We call the AWS URL. The AWS server is expected to forward this to https://amigo.ng/api/...
    const response = await amigoClient.post(finalPath, payload, { headers });
    
    return {
      success: true,
      data: response.data,
      status: response.status
    };

  } catch (error: any) {
    console.error('[Amigo Tunnel] Error:', error.message);
    
    // Extract detailed error if available
    const errorData = error.response?.data || { message: error.message };
    const status = error.response?.status || 500;

    return {
      success: false,
      data: errorData,
      status
    };
  }
}

// Map Network Names to Amigo IDs
export const AMIGO_NETWORKS: Record<string, number> = {
  'MTN': 1,
  'GLO': 2,
  'AIRTEL': 3,
  '9MOBILE': 4
};
