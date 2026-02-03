import pandas as pd
import re

# Nippon Sushi store locations data
stores_data = []

# Selangor
stores_data.extend([
    {"State": "Selangor", "Location": "Kelana Jaya", "Address": "Lot L1-3K,5K &6K, Residensi Highpark, No.1 Jalan SS6/7, SS6 Kelana Jaya, 47301 Petaling Jaya, Selangor", "Phone": "03-78879888", "WhatsApp": "011-63357887"},
    {"State": "Selangor", "Location": "Klang", "Address": "7&9, Jalan Bestari 9/KS09, KSL Bandar Besetari, 41200 Klang, Selangor", "Phone": "03-31228001", "WhatsApp": "011-2716 8128"},
    {"State": "Selangor", "Location": "Shah Alam", "Address": "B-LG13, Shop Lot Vista Alam, Jalan Ikhtisas, Seksyen 14, 40000 Shah Alam, Selangor", "Phone": "03-55243433", "WhatsApp": "011-63373433"},
    {"State": "Selangor", "Location": "Ampang", "Address": "No 84G, Jalan Mamanda 1, Taman Dato Ahmad Razali, 68000 Ampang, Selangor", "Phone": "03-42668855", "WhatsApp": "010-4548856"},
    {"State": "Selangor", "Location": "Kajang", "Address": "No. 2-3-G, Jalan Prima Saujana 2/1, Taman Prima Saujana, 43000 Kajang, Selangor", "Phone": "03-87413555", "WhatsApp": "011-21004712"},
    {"State": "Selangor", "Location": "Bandar Baru Bangi", "Address": "No. 8-G-1, Jalan Medan PB2A, Seksyen 9, 43650 Bandar Baru Bangi, Selangor", "Phone": "03-89129667", "WhatsApp": "01165679667"},
    {"State": "Selangor", "Location": "Batu Caves", "Address": "No. 16-G, Prima Samudera, Jalan Samudera 11, 68100 Batu Caves, Selangor", "Phone": "03-61784422", "WhatsApp": "010-5534423"},
    {"State": "Selangor", "Location": "Kota Damansara", "Address": "13, Jalan Teknologi 3/6E, Taman Sains Selangor, 47810 Petaling Jaya, Selangor", "Phone": "03-61431222", "WhatsApp": "014-7292544"},
])

# Negeri Sembilan
stores_data.extend([
    {"State": "Negeri Sembilan", "Location": "Seremban", "Address": "No. 11-G, Gerbang Seremban, Off Jalan Sungai Ujong, 70200 Seremban, Negeri Sembilan", "Phone": "06-7607585", "WhatsApp": "011-63367585"},
    {"State": "Negeri Sembilan", "Location": "Nilai", "Address": "PT 7260, Ground Floor, Jalan BBN 1/2A Putra Nilai, 71800 Nilai, Negeri Sembilan", "Phone": "06-7909666", "WhatsApp": "013-5574162"},
])

# Melaka
stores_data.extend([
    {"State": "Melaka", "Location": "Melaka", "Address": "No. 15&17, Jalan Kommersial TAKH2, Taman Ayer Keroh Height, 75450 Ayer Keroh, Melaka", "Phone": "06-2309559", "WhatsApp": "011-62659559"},
])

# Johor
stores_data.extend([
    {"State": "Johor", "Location": "Batu Pahat", "Address": "No. 30, Jalan Rotan Utama, 83000 Batu Pahat, Johor", "Phone": "07-4310802", "WhatsApp": "011-15495171"},
    {"State": "Johor", "Location": "Muar", "Address": "Wisma LLT, N0:8-3, Jalan Abdul Rahman, 84000 Muar, Johor", "Phone": "06-9536000", "WhatsApp": "011-35905171"},
    {"State": "Johor", "Location": "Permas Jaya", "Address": "No.55, Jalan Permas 10/5, Bandar Baru Permas Jaya, 81750 Masai, Johor", "Phone": "", "WhatsApp": ""},
    {"State": "Johor", "Location": "Setia Tropika", "Address": "11 & 15, Jalan Setia Tropika 1/8, Taman Setia Tropika, 81200 Johor Bahru, Johor", "Phone": "07-3635384", "WhatsApp": "011-53645171"},
])

# Pahang
stores_data.extend([
    {"State": "Pahang", "Location": "Kuantan", "Address": "No.A15G & A17G, Jalan Tun Ismail 1, 25250 Kuantan, Pahang", "Phone": "09-5315374", "WhatsApp": "018-2576412"},
])

# Putrajaya
stores_data.extend([
    {"State": "Putrajaya", "Location": "Putrajaya", "Address": "C2-G-1, Ayer@8, 62250 WP Putrajaya", "Phone": "", "WhatsApp": "013-8300119"},
])

# Kelantan
stores_data.extend([
    {"State": "Kelantan", "Location": "Kota Bharu", "Address": "Groundfloor Lot 1757 & 1758, Al-Khatiri Point, Bandar Baru Kubang Kerian, 16150 Kota Bharu, Kelantan", "Phone": "09-7678418", "WhatsApp": "011-17828097"},
])

# Penang
stores_data.extend([
    {"State": "Penang", "Location": "Permatang Pauh", "Address": "B2-G 27 & 28, Lorong Pauh Jaya 1/3, Taman Pauh Jaya, 13500 Permatang Pauh, Pulau Pinang", "Phone": "04-3839119", "WhatsApp": "014-3511327"},
])

# Kedah
stores_data.extend([
    {"State": "Kedah", "Location": "Alor Setar", "Address": "Lot 99 Menara Alor Setar, Lebuhraya Darul Aman, 05150 Alor Setar, Kedah", "Phone": "04-7352290", "WhatsApp": "011-31073273"},
])

# Create DataFrame
df = pd.DataFrame(stores_data)

# Export to Excel
output_file = "nippon_sushi_locations.xlsx"
df.to_excel(output_file, index=False, sheet_name="Store Locations")

print(f"✅ Successfully exported {len(stores_data)} store locations to {output_file}")
print(f"\nStores by state:")
print(df['State'].value_counts().sort_index())
