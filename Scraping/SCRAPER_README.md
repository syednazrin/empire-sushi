# Nippon Sushi Location Scraper

This script extracts all Nippon Sushi restaurant locations from their official website and exports them to Excel format.

## 📊 Data Source
[https://nipponsushi.com.my/location/](https://nipponsushi.com.my/location/)

## 📁 Output File
`nippon_sushi_locations.xlsx`

## 📍 Locations Extracted

### Total: 20 stores across 9 states

| State | Stores |
|-------|--------|
| **Selangor** | 8 stores |
| **Negeri Sembilan** | 2 stores |
| **Melaka** | 1 store |
| **Johor** | 4 stores |
| **Pahang** | 1 store |
| **Putrajaya** | 1 store |
| **Kelantan** | 1 store |
| **Penang** | 1 store |
| **Kedah** | 1 store |

## 🏪 Store Details Included

Each store entry contains:
- **State** - Malaysian state
- **Location** - City/area name
- **Address** - Full street address with postal code
- **Phone** - Landline number
- **WhatsApp** - WhatsApp contact number

## 🚀 Usage

### Run the scraper:
```bash
node scrape_nippon_excel.js
```

### Output:
Creates `nippon_sushi_locations.xlsx` in the root folder with all 20 store locations in a formatted Excel spreadsheet.

## 📋 Excel Features

- Clean column headers
- Auto-sized columns for readability
- Address column width: 80 characters
- Location/State columns: 18-20 characters
- Phone columns: 15 characters

## 🛠️ Technical Details

**Dependencies:**
- `xlsx` - Excel file generation

**Install:**
```bash
npm install xlsx
```

## 📝 Notes

- Data scraped from official Nippon Sushi website (February 2026)
- Some stores may not have phone or WhatsApp numbers listed
- Addresses include full postal codes for geocoding purposes

## 🔄 Alternative Formats

Also available:
- `scrape_nippon_locations_csv.py` - Python script for CSV export
- `scrape_nippon_locations.py` - Python script with pandas for Excel (requires pandas)

---

**Scraped on:** February 2, 2026  
**Source:** Nippon Sushi Malaysia Official Website
