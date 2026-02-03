import csv

# Nippon Sushi store locations data
stores_data = [
    # Headers
    ["State", "Location", "Address", "Phone", "WhatsApp"],
    
    # Selangor (8 stores)
    ["Selangor", "Kelana Jaya", "Lot L1-3K,5K &6K, Residensi Highpark, No.1 Jalan SS6/7, SS6 Kelana Jaya, 47301 Petaling Jaya, Selangor", "03-78879888", "011-63357887"],
    ["Selangor", "Klang", "7&9, Jalan Bestari 9/KS09, KSL Bandar Besetari, 41200 Klang, Selangor", "03-31228001", "011-2716 8128"],
    ["Selangor", "Shah Alam", "B-LG13, Shop Lot Vista Alam, Jalan Ikhtisas, Seksyen 14, 40000 Shah Alam, Selangor", "03-55243433", "011-63373433"],
    ["Selangor", "Ampang", "No 84G, Jalan Mamanda 1, Taman Dato Ahmad Razali, 68000 Ampang, Selangor", "03-42668855", "010-4548856"],
    ["Selangor", "Kajang", "No. 2-3-G, Jalan Prima Saujana 2/1, Taman Prima Saujana, 43000 Kajang, Selangor", "03-87413555", "011-21004712"],
    ["Selangor", "Bandar Baru Bangi", "No. 8-G-1, Jalan Medan PB2A, Seksyen 9, 43650 Bandar Baru Bangi, Selangor", "03-89129667", "01165679667"],
    ["Selangor", "Batu Caves", "No. 16-G, Prima Samudera, Jalan Samudera 11, 68100 Batu Caves, Selangor", "03-61784422", "010-5534423"],
    ["Selangor", "Kota Damansara", "13, Jalan Teknologi 3/6E, Taman Sains Selangor, 47810 Petaling Jaya, Selangor", "03-61431222", "014-7292544"],
    
    # Negeri Sembilan (2 stores)
    ["Negeri Sembilan", "Seremban", "No. 11-G, Gerbang Seremban, Off Jalan Sungai Ujong, 70200 Seremban, Negeri Sembilan", "06-7607585", "011-63367585"],
    ["Negeri Sembilan", "Nilai", "PT 7260, Ground Floor, Jalan BBN 1/2A Putra Nilai, 71800 Nilai, Negeri Sembilan", "06-7909666", "013-5574162"],
    
    # Melaka (1 store)
    ["Melaka", "Melaka", "No. 15&17, Jalan Kommersial TAKH2, Taman Ayer Keroh Height, 75450 Ayer Keroh, Melaka", "06-2309559", "011-62659559"],
    
    # Johor (4 stores)
    ["Johor", "Batu Pahat", "No. 30, Jalan Rotan Utama, 83000 Batu Pahat, Johor", "07-4310802", "011-15495171"],
    ["Johor", "Muar", "Wisma LLT, N0:8-3, Jalan Abdul Rahman, 84000 Muar, Johor", "06-9536000", "011-35905171"],
    ["Johor", "Permas Jaya", "No.55, Jalan Permas 10/5, Bandar Baru Permas Jaya, 81750 Masai, Johor", "", ""],
    ["Johor", "Setia Tropika", "11 & 15, Jalan Setia Tropika 1/8, Taman Setia Tropika, 81200 Johor Bahru, Johor", "07-3635384", "011-53645171"],
    
    # Pahang (1 store)
    ["Pahang", "Kuantan", "No.A15G & A17G, Jalan Tun Ismail 1, 25250 Kuantan, Pahang", "09-5315374", "018-2576412"],
    
    # Putrajaya (1 store)
    ["Putrajaya", "Putrajaya", "C2-G-1, Ayer@8, 62250 WP Putrajaya", "", "013-8300119"],
    
    # Kelantan (1 store)
    ["Kelantan", "Kota Bharu", "Groundfloor Lot 1757 & 1758, Al-Khatiri Point, Bandar Baru Kubang Kerian, 16150 Kota Bharu, Kelantan", "09-7678418", "011-17828097"],
    
    # Penang (1 store)
    ["Penang", "Permatang Pauh", "B2-G 27 & 28, Lorong Pauh Jaya 1/3, Taman Pauh Jaya, 13500 Permatang Pauh, Pulau Pinang", "04-3839119", "014-3511327"],
    
    # Kedah (1 store)
    ["Kedah", "Alor Setar", "Lot 99 Menara Alor Setar, Lebuhraya Darul Aman, 05150 Alor Setar, Kedah", "04-7352290", "011-31073273"],
]

# Write to CSV
output_file = "nippon_sushi_locations.csv"
with open(output_file, 'w', newline='', encoding='utf-8') as f:
    writer = csv.writer(f)
    writer.writerows(stores_data)

print(f"✅ Successfully exported {len(stores_data) - 1} store locations to {output_file}")
print(f"\nStores by state:")
print("Selangor: 8 stores")
print("Negeri Sembilan: 2 stores")
print("Melaka: 1 store")
print("Johor: 4 stores")
print("Pahang: 1 store")
print("Putrajaya: 1 store")
print("Kelantan: 1 store")
print("Penang: 1 store")
print("Kedah: 1 store")
print(f"\nTotal: 20 stores")
