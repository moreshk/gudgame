import {
    ActionPostResponse,
    ACTIONS_CORS_HEADERS,
    createPostResponse,
    ActionGetResponse,
    ActionPostRequest,
  } from "@solana/actions";
  import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
  
  const RECIPIENT_ADDRESS = "9wPKJm8rVXURCRJKEVJqLXW4PZSvLTUXb48t3Fn4Yvyh";
  
  export const GET = async (req: Request) => {
    const payload: ActionGetResponse = {
      title: "Donate SOL",
      icon: "https://cryptologos.cc/logos/solana-sol-logo.png",
      description: "Donate SOL to support our project",
      label: "Donate",
      links: {
        actions: [
          {
            href: "/api/actions/donate/{amount}",
            label: "Donate",
            parameters: [
              {
                name: "amount",
                label: "Enter SOL amount",
              },
            ],
          },
        ],
      },
    };
  
    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  };
  
  export const POST = async (req: Request) => {
    const body: ActionPostRequest = await req.json();
    const { account } = body;
    const amount = parseFloat(req.url.split("amount=")[1]) * 1e9; // Convert SOL to lamports
  
    const connection = new Connection(process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.mainnet-beta.solana.com');
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
  
    return Response.json(payload, {
      headers: ACTIONS_CORS_HEADERS,
    });
  };
  
  export const OPTIONS = GET;