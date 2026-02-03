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
    
    console.log('Reading stores from JSON:', jsonPath);
    console.log('File exists:', fs.existsSync(jsonPath));
    
    if (!fs.existsSync(jsonPath)) {
      console.error('Stores JSON file not found');
      return NextResponse.json({ error: 'Stores data not found' }, { status: 500 });
    }

    const stores: StoreRow[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    console.log('Total stores loaded:', stores.length);
    
    return NextResponse.json(stores);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Failed to load stores', details: String(error) }, { status: 500 });
  }
}
