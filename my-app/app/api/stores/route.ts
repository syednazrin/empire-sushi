import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export type StoreRow = {
  name: string;
  address: string;
  lat: number;
  lng: number;
  brand: string;
};

export async function GET() {
  try {
    const jsonPath = path.join(process.cwd(), 'public', 'data', 'stores.json');
    console.log('Attempting to read stores from:', jsonPath);
    
    // Read directly without existsSync to avoid potential timeout
    const fileContent = fs.readFileSync(jsonPath, 'utf-8');
    const stores: StoreRow[] = JSON.parse(fileContent);
    
    console.log('Successfully loaded stores:', stores.length);
    return NextResponse.json(stores);
  } catch (error) {
    console.error('API error:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ 
      error: 'Failed to load stores', 
      details: errorMessage,
      cwd: process.cwd()
    }, { status: 500 });
  }
}
