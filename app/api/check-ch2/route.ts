import { NextRequest, NextResponse } from 'next/server';
import { BlobServiceClient } from "@azure/storage-blob";

const containerName = "one";
const blobName = "ch2.json";

export async function POST(req: NextRequest) {
  const { walletAddress } = await req.json();

  if (!walletAddress) {
    return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
  }

  const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (!AZURE_STORAGE_CONNECTION_STRING) {
    console.error("Azure Storage connection string is not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  try {
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    const downloadBlockBlobResponse = await blockBlobClient.download(0);
    const jsonContent = await streamToText(downloadBlockBlobResponse.readableStreamBody);
    
    const addresses: string[] = JSON.parse(jsonContent);

    if (addresses.includes(walletAddress)) {
      return NextResponse.json({ message: 'Address is present in ch2.json' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Address is not present in ch2.json' }, { status: 200 });
    }
  } catch (error) {
    console.error('Error checking ch2.json:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ... existing streamToText function ...

async function streamToText(readable: NodeJS.ReadableStream | undefined): Promise<string> {
    if (!readable) {
      return '';
    }
    const chunks: Buffer[] = [];
    for await (const chunk of readable) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString('utf-8');
  }