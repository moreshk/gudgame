import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
  
  const RECIPIENT_ADDRESS = "9wPKJm8rVXURCRJKEVJqLXW4PZSvLTUXb48t3Fn4Yvyh";
  
  export async function POST(req: Request) {
    try {
      const body: ActionPostRequest = await req.json();
      const { account } = body;
      const url = new URL(req.url);
      const amount = parseFloat(url.searchParams.get('amount') || '0') * 1e9; // Convert SOL to lamports
  
      const connection = new Connection("https://api.mainnet-beta.solana.com");
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: new PublicKey(account),
          toPubkey: new PublicKey(RECIPIENT_ADDRESS),
          lamports: amount,
        })
      );
  
      const payload: ActionPostResponse = await createPostResponse({
        fields: {
            transaction: transaction,
            message: `Donating ${amount / 1e9} SOL`,
        },
    });
  
      return new Response(JSON.stringify(payload), {
        headers: {
          ...ACTIONS_CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    } catch (error) {
      console.error('Error in POST handler:', error);
      return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
        status: 500,
        headers: {
          ...ACTIONS_CORS_HEADERS,
          'Content-Type': 'application/json',
        },
      });
    }
  }
  
  export async function OPTIONS(req: Request) {
    return new Response(null, {
      headers: ACTIONS_CORS_HEADERS,
    });
  }