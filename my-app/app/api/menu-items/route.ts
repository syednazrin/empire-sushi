import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  try {
    const menuDir = path.join(process.cwd(), 'public', 'Menu Items');
    const files = fs.readdirSync(menuDir).filter((f) => f.endsWith('.xlsx') && !f.startsWith('~$'));

    const allMenuItems: {
      store: string;
      item: string;
      price: number;
      category?: string;
    }[] = [];

    for (const file of files) {
      try {
        const storeName = file.replace(' Menu.xlsx', '');
        const filePath = path.join(menuDir, file);

        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(worksheet) as any[];

        data.forEach((row) => {
          const itemName =
            row['Item'] ||
            row['item'] ||
            row['Item Name'] ||
            row['Name'] ||
            row['Product'] ||
            row['Menu Item'];

          const price =
            parseFloat(row['Price']) ||
            parseFloat(row['price']) ||
            parseFloat(row['Price (RM)']) ||
            parseFloat(row['RM']) ||
            0;

          const category =
            row['Category'] ||
            row['category'] ||
            row['Type'] ||
            row['type'] ||
            undefined;

          if (itemName && price > 0) {
            allMenuItems.push({
              store: storeName,
              item: String(itemName),
              price,
              category: category ? String(category) : undefined,
            });
          }
        });
      } catch {
        // Skip invalid files
      }
    }

    return NextResponse.json(allMenuItems);
  } catch (error) {
    console.error('Error loading menu items:', error);
    return NextResponse.json(
      { error: 'Failed to load menu items' },
      { status: 500 }
    );
  }
};