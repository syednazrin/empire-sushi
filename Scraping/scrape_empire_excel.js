import XLSX from 'xlsx';

// Empire Sushi store locations from https://empiresushi.com.my/store
const storesData = [
  // W.P. Kuala Lumpur (19 stores)
  { State: "W.P. Kuala Lumpur", Location: "Berjaya Times Square", Address: "LG-18D-2, Berjaya Times Square, 1, Jalan Imbi, 55100, Wilayah Persekutuan Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Setapak Central", Address: "Lot GK-6B Ground Floor, Setapak Central, No.67, Jalan Taman Ibu Kota, Danau Kota, 53300 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Sunway Velocity Shopping Mall", Address: "B-33 & B-35, Basement 1, Sunway Velocity Mall, Lingkaran SV, Sunway Velocity, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Avenue K", Address: "C-16A, Concourse Level, Avenue K, 156 Jalan Ampang, 50450 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Melawati Mall", Address: "Lot LG-32 & 33, Lower Ground Floor, UP2-01, Melawati Mall, No. 355, Jalan Bandar Melawati, Pusat Bandar Melawati, 53100 Kuala Lumpur", Hours: "10am -10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Sunway Putra Mall", Address: "LG25B, Lower Ground Floor, Sunway Putra Mall, No.100, Jalan Putra,50350 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Kompleks Sogo", Address: "LG-L11,Lower Ground Floor, Kompleks Sogo , 190 Jalan Tuanku Abdul Rahman , 50100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Wangsa Walk Mall", Address: "Lot. GK-02, Ground Floor, Wangsa Walk Mall, No. 9, Jalan Wangsa Perdana 1, Bandar Wangsa Maju, 53300 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "MyTOWN Shopping Centre", Address: "Lot No. B1-053A, Basement 1, MyTOWN Shopping Centre, No. 6, Jalan Cochrane, Seksyen 90, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "NU Sentral", Address: "Lot LG.14, Level Lower Ground, NU Sentral Shopping Centre, Jalan Tun Sambathan, Brickfields, 50470 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Lotus's Kepong", Address: "Lot FOL – 04, First Floor, Lotus's Kepong(Tesco Kepong), No.3, Jalan 7A/62A, Bandar Menjalara, 52200 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Suria KLCC", Address: "Lot OSC10, Concourse Level, Suria KLCC, Kuala Lumpur City Centre, 50088 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "AEON Mall Metro Prima", Address: "Lot F29, AEON Mall Metro Prima, No.1, Jalan Metro Prima, 52100 Kepong, Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "KL East Mall", Address: "Lot No. LG-42, KL East Mall, Off Middle Ring Road 2, 53100 KL East, Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Lotus's Ampang", Address: "Lot 36, GF, Lotus's Ampang, PT 8880, Jalan Pandan Prima Dataran, Pandan Indah, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Pavilion Bukit Jalil", Address: "Lot 1.69.01, Level 1, Pavillion Bukit Jalil 2, Persiaran Bukit Jalil 8, Bandar Bukit Jalil, 57000 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "AEON AU2", Address: "Lot G02 & G03, AEON Mall AU2, No 6, Jalan Taman Setiawangsa (Jalan 37/56), AU2 Taman Keramat, 54200 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "AEON Alpha Angle", Address: "Lot G-19, AEON Alpha Angle Shopping Centre, Jalan R1, Seksyen 1, Bandar Baru, Wangsa Maju, 53300 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Mid Valley Megamall", Address: "Lot TK-27 Third Floor, Mid Valley Megamall, Lingkaran Syed Putra, 59200 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "AEON Taman Maluri", Address: "Lot G03, Ground Floor AEON Taman Maluri Shopping Centre, Jalan Jejaka, Maluri, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "KL Sentral", Address: "Unit 4, Level 1, Stesen Sentral Kuala Lumpur, 50470 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "The Exchange TRX", Address: "C.OS.01 & C.OS.E01, Concourse Level, Plaza The Exchange TRX, Persiaran TRX, 55188, Tun Razak Exchange, Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Cheras Leisure Mall", Address: "Lot L1-49, Level 1, Cheras Leisure Mall, Jalan Manis 6, Taman Segar, Cheras, 56100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Publika Shopping Gallery", Address: "Lot 21, Level UG, Publika Shopping Gallery, 1, Jalan Dutamas 1, Solaris Dutamas, 50480 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Pavilion Bukit Bintang (Food Republic)", Address: "Stall #R02, Food Republic, Lot 1.41.00 - 1.51.00 & P1.13.00 - P1.20.00, Level 1, Gourmet Emporium, Jln Bukit Bintang, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Lalaport", Address: "LG1-15G Mitsui Shopping Park LaLaport BUKIT BINTANG CITY CENTRE, No. 2, Jalan Hang Tuah, 55100 Kuala Lumpur", Hours: "10am - 10pm" },
  { State: "W.P. Kuala Lumpur", Location: "Sunway Square", Address: "LG1-22, Lower Ground Floor, Sunway Square, Jalan Lagoon Selatan, Bandar Sunway, 47500 Petaling Jaya, Selangor", Hours: "10am - 10pm" },

  // Selangor (33 stores)
  { State: "Selangor", Location: "IOI Mall Puchong", Address: "Lot GK01A, Ground Floor, IOI Mall, Batu 9 Jalan Puchong, Bandar Puchong Jaya, 47170 Puchong, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "NU Empire", Address: "LG-29A, Lower Ground, NU Empire ,Jalan SS16/1, 47500 Subang Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "IPC Shopping Centre", Address: "LG1.31, Lower Ground Floor, Ikano Power Centre, No.2, Jalan PJU 7/2, Mutiara Damansara, 47800 Petaling Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Shah Alam", Address: "Lot No.18, Ground Floor, Lotus's Shah Alam, No.3 Jalan Aerobik 13/43, Seksyen 13, 40100 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Central i-City", Address: "LGK-01A, Lower Ground Floor, Central i-City, Plot 1, i-City, Persiaran Multimedia, Section 7, 40000 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Setia City Mall", Address: "LG – K06, Lower Ground Floor, Setia City Mall, No.7, Persiaran Setia Dagang Bandar Setia Alam, Seksyen U13, 40170 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Sunway Pyramid", Address: "LG2.51, Lower Ground Two, Sunway Pyramid, No 3, Jalan PJS11/15, Sunway City, 47500 Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "1 Utama Shopping Centre", Address: "Lot SK108, Second Floor, 1 Utama Shopping Centre, No.1, Lebuh Bandar Utama, Bandar Utama, 47800 Petaling Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Paradigm Mall Petaling Jaya", Address: "LGK-06 (P) & LGK-07 (P), Lower Ground (LG), Paradigm Mall, Jalan SS 7/26A, 47301 Kelana Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Kajang", Address: "Lot No. 11, Ground Floor, Lotus's Kajang, Lot PT 37280 & 11196, Mukim Kajang Saujana Impian, 43000 Kajang, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Puchong", Address: "Lot 4, First Floor, Lotus's Puchong, Lot 148 & 149, Pusat Bandar Puchong, Jalan Bandar 3, Off Jalan Puchong, 47100 Puchong, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "AEON Rawang", Address: "G03, Ground Floor, AEON Rawang Anggun, No. 1, Persiaran Anggun, Taman Anggun 48000 Rawang , Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "SB Mall", Address: "Lot LG-22, Lower Ground Floor, SB Mall, No. 2, Bandar Baru Sungai Buloh, Seksyen U20, 40160 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Kuala Selangor", Address: "Lot 5 & 19, Ground Floor, Lotus's Kuala Selangor, Jalan Medan Niaga 2, Medan Niaga Kuala Selangor, 45000 Kuala Selangor, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Semenyih", Address: "Lot G12 & G13, Ground Floor, Lotus's Semenyih, No.1, Jalan TPS 1/1, Taman Pelangi Semenyih, 43500 Semenyih, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "AEON Shah Alam", Address: "Lot KF9, First Floor, AEON Mall Shah Alam, No.1, Jalan Akuatik 13/64, Seksyen 13, 40100, Shah Alam Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Bukit Beruntung", Address: "G19 & G20, Ground Floor, Lotus's Bukit Beruntung, No.1, Jalan Orkid 1, Seksyen BS 1, Bandar Bukit Sentosa, 48300 Rawang, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Sunway Giza Mall", Address: "G.03A, Ground Floor, Sunway Giza Mall, No. 2, Jalan PJU 5/14, Kota Damansara, 47810 Petaling Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "AEON Mall Cheras Selatan", Address: "F59, First Floor, AEON Cheras Selatan Shopping Centre, Jalan Cheras Perdana Cheras, 43200 Balakong, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Gateway @ KLIA2", Address: "Lot No. L2-109, Level 2, gateway@klia2, Jalan klia 2/1, 64000 KLIA, Sepang, Selangor", Hours: "8:30am - 10:30pm" },
  { State: "Selangor", Location: "AEON Mall Taman Equine Shopping Centre", Address: "LG21, LG Floor, AEON Taman Equine Shopping Centre. No. 2, Jalan Equine, Taman Equine, Bandar Putra Permai, 43300 Seri Kembangan, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Setia City Mall (Dine-In)", Address: "Unit No. LG-141, 142 & 143, Lower Ground Floor, Setia City Mall, No. 7, Persiaran Setia Dagang, Bandar Setia Alam, Seksyen U13, 40170 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "AEON MALL Bukit Raja", Address: "G25, Ground Floor, AEON Bukit Raja, Persiaran Bukit Raja 2, Bandar Baru Klang 41150 Klang, Selangor", Hours: "10am-10pm" },
  { State: "Selangor", Location: "Lotus's Bukit Puchong", Address: "Lot G18, G19 & G20, Ground Floor, Lotus's Bandar Bukit Puchong, No. 1, Jalan BP 7/1, Bandar Bukit Puchong, 47120 Puchong, Selangor", Hours: "10am-10pm" },
  { State: "Selangor", Location: "AEON Mall Bukit Tinggi Shopping Centre", Address: "Lot F19, First Floor, AEON Bukit Tinggi Shopping Centre, No 1, Persiaran Batu Nilam 1/KS 6, Bandar Bukit Tinggi 2, 41200 Klang, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Setia Alam", Address: "Lot OLG07, OLG08, OLG09 & OLG10, Ground Floor, Lotuss Setia Alam, No. 2, Jalan Setia Prima S U13/S, Bandar Setia Alam, Seksyen U13, 40170 Shah Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "DPULZE Shopping Centre", Address: "LGK 03, Lower Ground Floor, Dpulze Shopping Centre, Lingkaran Cyber Point Timur, Cyber 12, 63000 Cyberjaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Quayside Mall", Address: "GF(W)-02-01, Quayside Mall, Gamuda Kemuning, 25.7, Persiaran Freesia, 42500 Telok Panglima Garang, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Puncak Alam", Address: "G-10, Ground Floor, Lotus's Puncak Alam, No 1, Jalan Niaga Bestari 9, Puncak Bestari, 42300 Bandar Puncak Alam, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Mydin Subang Jaya Hypermarket", Address: "GFNB-19 & GSA-04, Ground Floor, MYDIN SUBANG JAYA, Lot No. 675 & 676, Persiaran Subang Permai, USJ 1, 47500 Subang Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "The Curve", Address: "K-G02-W, Ground Floor, the Curve, No. 6, Jalan PJU 7/3, Mutiara Damansara, 47810 Petaling Jaya, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Lotus's Rimbayu", Address: "L-16, Ground Floor, Lotus's Rimbayu, No 2, Jalan Rimbayu 1, Bandar Rimbayu, 42500 Telok Panglima Garang, Kuala Langat, Selangor", Hours: "10am - 10pm" },
  { State: "Selangor", Location: "Mitsui Outlet Park KLIA", Address: "Kiosk 4-1, Kiosk 4-2, Ground Floor, Mitsui Outlet Park KLIA Sepang, Persiaran Komersial, 64000 KLIA, Sepang, Selangor", Hours: "10am - 10pm" },

  // W.P. Putrajaya (3 stores)
  { State: "W.P. Putrajaya", Location: "IOI City Mall", Address: "LG-K14, Lower Ground Floor, IOI City Mall, Lebuh IRC, IOI Resort City, 62502 Putrajaya", Hours: "10am - 10pm" },
  { State: "W.P. Putrajaya", Location: "IOI City Mall (Phase 2)", Address: "Lot No. L1-K202, First Floor, IOI City Mall 2, Lebuh IRC, IOI ResortCity, 62502 Putrajaya", Hours: "10am - 10pm" },
  { State: "W.P. Putrajaya", Location: "Alamanda Shopping Centre", Address: "OS18, Ground Floor, Alamanda Shopping Centre, Jalan Alamanda, Presint 1, 62000 Putrajaya", Hours: "10am - 10pm" },
  { State: "W.P. Putrajaya", Location: "IOI City Mall (Dine-In)", Address: "LG-30, Lower Ground Floor, IOI City Mall - Phase 1, Lebuh IRC, IOI Resort City, 62502, Putrajaya", Hours: "10am - 10pm" },

  // Pulau Pinang (9 stores)
  { State: "Pulau Pinang", Location: "1st Avenue Mall", Address: "Lot 4-06A,4 floor, 1st Avenue Mall, 182 Jalan Magazine, 10300 Georgetown, Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Gurney Paragon Mall", Address: "Lot LG.P2B, Lower Ground Floor, Gurney Paragon Mall, Kelawei Road, 10250 Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Gurney Plaza", Address: "170-B1-06/07, Plaza Gurney, Persiaran Gurney, 10250 Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Lotus's Penang E-Gate", Address: "Lot 1-1-17, 1st Floor, Lotuss Penang Egate, No 1, Lebuh Tengku Kudin 1, Bandar Jelutong, 11700 Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Queensbay Mall", Address: "LG-108(A)/108(B)/108(CA), Queensbay Mall, 100 Persiaran Bayan Indah, 11900 Bayan Lepas, Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Mydin Mall Bukit Mertajam", Address: "Lot G-08 Mydin Mall Bukit Mertajam, Lot-Lot 3424, 1619, 1611, 1511, 1186 Dan 850, Mukim 06, Jalan Baru, 13600 Seberang Perai Tengah, Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Sunway Carnival Mall", Address: "LG-K20 & LG-K21, Lower Ground Floor, Sunway Carnival Shopping Mall,No.3068, Jalan Todak, Pusat Bandar Seberang Jaya, 13700 Seberang Jaya, Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "AEON Mall Bukit Mertajam", Address: "Lot G16, Ground Floor, AEON Mall Bukit Mertajam , Lot No.30908, Jalan Rozhan, Alma, Seberang Perai Tengah , 14000 Bukit Mertajam, Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "Lotus's Tanjung Pinang", Address: "Lot G16, G17, G18 & G19, Ground Floor, Lotus's Tanjung Pinang, No 1, Jalan Seri Tanjung Pinang, Tanjung Tokong, 10470 Pulau Pinang", Hours: "10am - 10pm" },
  { State: "Pulau Pinang", Location: "C-Mart Nibong Tebal", Address: "Lot PK1, PK2, PK3, PK4, No. 3974, Jalan Industri Cenderawasih 1, Kompleks Industri Cenderawasih, Lot 5631, MK11, 14300, Nibong Tebal, Penang", Hours: "10am-10pm" },
  { State: "Pulau Pinang", Location: "Pearl City Mall", Address: "GK6 & GK7, Pearl City Mall, 1720, Persiaran Mutiara 4, Pusat Komersial Bandar Tasek Mutiara, 14120 Simpang Ampat, Pulau Pinang", Hours: "10am - 10pm" },

  // Kedah (8 stores)
  { State: "Kedah", Location: "Central Square", Address: "GF-14, Central Square Jln Kampung Baru 08000 Sungai Petani, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Amanjaya Mall", Address: "SP31 B&C, Second Floor, Amanjaya Mall, No.1 Jalan Jati 1, Kompleks Amanjaya, 08000 Sungai Petani, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Lotus's Mergong", Address: "Lot No. G24 & G25, Ground Floor, Lotus's Mergong, No.1, Lebuhraya Sultanah Bahiyah, 05150 Alor Setar, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Lotus's Sg Petani", Address: "Lot G19A & 19B, Ground Floor, Lotus's Sg. Petani, 300, Jalan Lagenda 1 Lagenda Heights, 08000 Sungai Petani, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Aman Central", Address: "Lot 4-K05, No. 1 Aman Central, Lebuhraya Darulaman, 05100 Alor Setar, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Aman Central (NEW)", Address: "Lot LG-K01, LG Floor, No.1, Aman Central, Lebuhraya Darulaman, 05100 Alor Star, Kedah", Hours: "10am - 10pm" },
  { State: "Kedah", Location: "Kulim Central", Address: "GK-20, Ground Floor, Kulim Central, Jalan KLC 1, 09000 Kulim, Kedah", Hours: "10am-10pm" },
  { State: "Kedah", Location: "Serai Wangi Mall", Address: "K5, Serai Wangi Mall, Lorong Serai Wangi 4/10, Taman Serai Wangi, 09400 Padang Serai, Kedah", Hours: "10am - 10pm" },

  // Perak (13 stores)
  { State: "Perak", Location: "Ipoh Parade", Address: "Lot No. KS03, Second Floor, Ipoh Parade, Jalan Sultan Abdul Jalil, Greentown, 31400 Ipoh, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "AEON Ipoh Station 18 Shopping Centre", Address: "Lot G69, Ground Floor, AEON Ipoh Station 18 Shopping Centre , No. 2, Susuran Stesen 18, Station 18, 31650 Ipoh, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "AEON Seri Manjung Shopping Centre", Address: "Lot G78, Ground Floor, AEON Seri Manjung Shopping Centre, Pusat Perniagaan Manjung Point 3, 32400 Seri Manjung, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "Sentra Mall", Address: "G45, Lot 12080, Klebang Perdana, 31200 Chemor, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "AEON Mall Kinta City Ipoh", Address: "G37, No. 2, Jalan Teh Lean Swee, Off Jalan Sultan Azlan Shah Utara, 31400, Ipoh Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "AEON Mall Taiping", Address: "AEON Mall Taiping, Lot 8576 & 8577,G25, Ground Floor, Jalan Kamunting, 34000 Taiping, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "AEON Big Midtown Falim", Address: "Lot G45, Ground Floor, AEON Midtown Falim Shopping Centre, No.1, Hala Falim 1, Taman Mas Jaya, Falim, 30200 Ipoh, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "Lotus's Manjung", Address: "Lot FOL 11, First Floor, Lotus's Manjung, Lot 16051, Mukim Sitiawan, Daerah Manjung, 32000 Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "Lotus's Taiping", Address: "Lot OLS-1, Second Floor, Lotus's Taiping, Lot 38, Jalan Istana Larut, 34000 Taiping, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "Taiping Mall", Address: "GK-07 & GK-08, Ground Floor, Taiping Mall, Jalan Tupai 3A, 34000 Taiping, Perak", Hours: "10am -10pm" },
  { State: "Perak", Location: "Lotus's Teluk Intan", Address: "G21 & 22, Groud Floor, Lotus's Teluk Intan, PT 5017, Rapid Mall Seri Intan, Jalan Changkat Jong, 36000 Teluk Intan, Perak", Hours: "10am - 10pm" },
  { State: "Perak", Location: "Lotus's Ipoh Bercham", Address: "Lot 18, Ground Floor, Lotus's Ipoh Bercham, No. 2 Laluan Tasek Timur 6, Taman Tasek Indra, 31400 Ipoh, Perak", Hours: "10am - 10pm" },

  // Johor (17 stores)
  { State: "Johor", Location: "Johor Bahru City Square", Address: "Lot MK3-05, Tingkat 3, Johor Bahru City Square, No. 106-108, Jalan Wong Ah Fook, 80000 Johor Bahru", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Toppen Shopping Centre", Address: "L2.62, Level 2, Toppen Shopping Centre, No.33, Jalan Harmonium, Taman Desa Tebrau, 81100 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Paradigm Mall Johor Bahru", Address: "Lot No. GFK-19, Ground Floor, Paradigm Mall Johor Bahru, Jalan Skudai, 81200 Johor Bahru", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Batu Pahat Mall", Address: "Kiosk Gk27 & Fk28, Ground Floor, Batu Pahat Mall, No.325, Jalan Kluang, 83000 Batu Pahat, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "AEON Bukit Indah", Address: "G39, Ground Floor, AEON Mall Bukit Indah, 8, Jalan Indah 15/2, Bukit Indah, 81200 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "AEON Tebrau City", Address: "FK3, First Floor, AEON Tebrau City, No 1, Jalan Desa Tebrau Taman Desa Tebrau 81100 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Mid Valley Southkey", Address: "Lot LGK-15 Lower Ground Floor, The Mall, Mid Valley Southkey, Persiaran Southkey 1, Southkey, 80150 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Lotus's Seri Alam", Address: "Lot 6, Ground Floor, Lotus's Seri Alam, PTD 111515, Jalan Seri Alam, Bandar Seri Alam, Masai, 81750 Johor", Hours: "10am -10pm" },
  { State: "Johor", Location: "AEON Taman University", Address: "Lot LG27, Lower Ground, AEON Taman Universiti Shopping Centre, No 4, Jalan Pendidikan, Taman Universiti, 81300 Skudai, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Lotus's Mutiara Rini", Address: "Lot G08, Ground Floor, Lotus's Mutiara Rini, 1, Persiaran Jasa 1 Mutiara Rini, 81380 Skudai, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Kluang Mall", Address: "Lot G-05, Ground Floor, Kluang Mall, Jalan Rambutan, Taman Suria, 86000 Kluang, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Lotus's Kluang", Address: "G16 & G17, Ground Floor, Lotus's Kluang, PTD 108366, Jalan Persiaran Utama, Bandar Newpark Kluang, 86000 Kluang, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Lotus's Muar", Address: "Lot L6, Lotus's Muar, No. 99, Pusat Komersial Gemilang Bakri, Jalan Gemilang, Jalan Bakri, 84200 Muar, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "AEON Mall Bandar Dato' Onn", Address: "AEON Mall Bandar Dato' Onn, Lot G03, Ground Floor. No.3, Jalan Dato' Onn 3, Bandar Dato' Onn, 81100 Johor Bharu", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Sutera Mall", Address: "G-017, Ground Floor, Sutera Mall, No.1, Jalan Sutera Tanjung 8/4, Taman Sutera Utama, 81300, Skudai, Johor Bahru", Hours: "10am - 10pm" },
  { State: "Johor", Location: "AEON Mall Kulaijaya", Address: "Lot GK1, Ground Floor, AEON Mall Kulaijaya, PTD 106273, Persiaran Indahpura Utama, Bandar Indahpura, 81000 Kulai Jaya, Johor", Hours: "10am-10pm" },
  { State: "Johor", Location: "Lotus's Setia Tropika", Address: "G1, Ground Floor, Lotus's Setia Tropika, H.S (D) 519154 PTD 169651 Mukim, 18, Jalan Setia Tropika 1/21, Setia Tropika, 81200 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Paradigm Mall Johor Bahru (NEW-3F)", Address: "3FK-12J, Third Floor, Paradigm Mall Johor Bahru, Jalan Skudai, 81200 Johor Bahru", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Angsana Johor Bahru Mall", Address: "L1.1A, Level 1, Angsana Johor Bahru Mall, 81200 Johor Bahru, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "IOI Mall Kulai", Address: "G-K-03, Ground Floor, IOI Mall Kulai, Lebuh Putra Utama, Bandar Putra, 81000 Kulai, Johor", Hours: "10am - 10pm" },
  { State: "Johor", Location: "Senai Airport", Address: "KA16, Aeromall, Senai International Airport, Johor Darul Ta'zim, 81250 Johor Bahru, Johor", Hours: "8:30am - 10:30pm" },

  // Melaka (4 stores)
  { State: "Melaka", Location: "AEON Bandaraya Melaka", Address: "GK 05 & GK 07, AEON Bandaraya Melaka Shopping Centre, No.2 Jalan Lagenda, Taman 1 – Legenda, 75400 Melaka", Hours: "10am - 10pm" },
  { State: "Melaka", Location: "Lotus's Melaka Cheng", Address: "F1, First Floor, Lotus's Melaka Cheng, 1, Jalan Inang 3, Taman Paya Rumput Utama, 75460 Melaka", Hours: "10am - 10pm" },
  { State: "Melaka", Location: "Mahkota Parade", Address: "Lot KG6H, Ground Floor, Mahkota Parade, No. 1, Jalan Merdeka, 75000 Melaka", Hours: "10am - 10pm" },
  { State: "Melaka", Location: "Mydin Jasin", Address: "Lot GFNB-27, Ground Floor, Mydin Mall Jasin Melaka, PT 8537, Seksyen 1, Bandar Jasin Bestari, Mukim Ayer Panas, 77200 Jasin, Melaka", Hours: "10am - 10pm" },

  // Pahang (3 stores)
  { State: "Pahang", Location: "Kuantan City Mall", Address: "L4-K-07, Level 4, Kuantan City Mall, Jalan Putra Square 6/1, Putra Square, 25200 Kuantan, Pahang", Hours: "10am - 10pm" },
  { State: "Pahang", Location: "East Coast Mall", Address: "L2-43A, Level 2, East Coast Mall, Jalan Putra Square 6, Putra Square, 25200, Kuantan, Pahang", Hours: "10am - 10pm" },
  { State: "Pahang", Location: "Lotus's Indera Mahkota", Address: "G04, Ground Floor, Lotus's Indera Mahkota, Lot 144749, Lot 144746 & Lot 144045, Off Jalan Tun Razak, Mukim Kuala Kuantan, Daerah Kuantan 25200 Kuantan, Pahang", Hours: "10am - 10pm" },

  // Terengganu (4 stores)
  { State: "Terengganu", Location: "Mesra Mall", Address: "Lot 27, Ground Floor, Mesra Mall, Lot 6490, Jalan Kemaman-Dungun, Daerah Kemaman, 24200, Kemasik, Terengganu", Hours: "10am - 10pm" },
  { State: "Terengganu", Location: "KTCC Mall", Address: "GK-68, Ground Floor, KTCC MALL, Muara Selatan, 20000 Kuala Terengganu, Terengganu", Hours: "10am - 10pm" },
  { State: "Terengganu", Location: "Giant Kuala Terengganu", Address: "G08 & PS28, Giant Hypermarket Kuala Terengganu(Complex), Lot PT1485, Jalan Padang Hiliran Mukim Chabang 3, 21100 Kuala Terengganu, Terengganu", Hours: "10am - 10pm" },
  { State: "Terengganu", Location: "Mydin Kuala Terengganu", Address: "No. 7,8,9 & 10, Mydin Kuala Terengganu, Lot PT 1547 & PT 1548 Jalan Sultan Mohamad, 21000 Kuala Terengganu, Terengganu", Hours: "10am - 10pm" },
  { State: "Terengganu", Location: "Mayang Mall", Address: "LG K5 & LG K6, Lower Ground Floor, Mayang Mall Kuala Terengganu, No 1, Mayang Mall, Persiaran Mayang, 20000 Kuala Terengganu, Terengganu", Hours: "10am - 10pm" },

  // Kelantan (3 stores)
  { State: "Kelantan", Location: "AEON Mall Kota Bharu", Address: "F35B, First Floor, AEON Mall Kota Bharu, Kg Sireh, 15050 Kota Bharu, Kelantan", Hours: "10am - 10pm" },
  { State: "Kelantan", Location: "KB Mall", Address: "Kiosk GK09, Ground Floor, KB Mall, Jalan Hamzah, 15050 Kota Bharu, Kelantan", Hours: "10am - 10pm" },
  { State: "Kelantan", Location: "Lotus's Kota Bharu", Address: "GOL01, Ground Floor, Lotus's Kota Bharu, Lot 1828, Seksyen 17, Bandar Kota Bahru, Jajahan Kota Bahru, 15050 Kelantan", Hours: "10am - 10pm" },

  // Negeri Sembilan (4 stores)
  { State: "Negeri Sembilan", Location: "AEON Seremban 2", Address: "G63, Ground Floor, AEON Seremban 2 Shopping Centre, 112, Persiaran S2 B1, Seremban 2, 70300 Seremban, Negeri Sembilan", Hours: "10am - 10pm" },
  { State: "Negeri Sembilan", Location: "Lotus's Nilai", Address: "G36, Ground Floor, Lotus's Nilai, No.1, Jalan BBN 1/3, Putra Nilai, 71800 Nilai, Negeri Sembilan", Hours: "10am - 10pm" },
  { State: "Negeri Sembilan", Location: "Mydin Mall Seremban 2", Address: "GK-09 & Seating Area, Ground Floor, MYDIN SEREMBAN 2, Lot 31156, Persiaran S2 B7, Seremban 2, 70300 Seremban, Negeri Sembilan", Hours: "10am - 10pm" },
  { State: "Negeri Sembilan", Location: "Mydin Senawang", Address: "GPL-21, GPL-22 & GPL-23, Ground Floor, Mydin Senawang, No. 110, Jalan BPS 7, Bandar Prima Senawang, 70450 Seremban, Negeri Sembilan", Hours: "10am - 10pm" },

  // Sarawak (4 stores)
  { State: "Sarawak", Location: "Vivacity Megamall", Address: "No. LG-K009A, Lower Ground Floor of Vivacity Megamall, Jalan Wan Alwi, 93350 Kuching, Sarawak", Hours: "10am - 10pm" },
  { State: "Sarawak", Location: "AEON Kuching Central", Address: "AEON Mall Kuching Central, Lot GK05, Jalan Tun Ahmad Zaidi Adruce Kuching, 93200 Sarawak", Hours: "10am - 10pm" },
  { State: "Sarawak", Location: "Plaza Merdeka", Address: "Kiosk No. B1-P3-L4-003, Lower Ground (Basement 1), Plaza Merdeka Shopping Center, 88 Pearl Street, 93000 Kuching, Sarawak", Hours: "10am - 10pm" },
  { State: "Sarawak", Location: "Boulevard Shopping Mall", Address: "G-B-19, Ground Floor, Boulevard Shopping Mall, Jalan Datuk Tawi Sli, 93250 Kuching, Sarawak", Hours: "10am - 10pm" },

  // Sabah (1 store)
  { State: "Sabah", Location: "Imago Shopping Mall", Address: "SPK B-03/04, Basement Floor, Imago Shopping Mall, KK Times Square Phase 2, Off Coastal Highway, 88100 Kota Kinabalu, Sabah", Hours: "10am - 10pm" },

  // Perlis (2 stores)
  { State: "Perlis", Location: "Kangar Jaya Mall", Address: "GF-K21 ,GF-K22, GF-K23 ,GF-K24, Kangar Jaya Mall, Plot 20683, Mukim Seriab, 01000 Kangar, Perlis", Hours: "10am - 10pm" },
  { State: "Perlis", Location: "Kompleks Arau", Address: "G10, Kompleks Arau, Jalan Arau-Kodiang, 02600 Arau, Perlis", Hours: "10am - 10pm" },
];

// Create worksheet
const ws = XLSX.utils.json_to_sheet(storesData);

// Set column widths
ws['!cols'] = [
  { wch: 20 }, // State
  { wch: 30 }, // Location
  { wch: 90 }, // Address
  { wch: 18 }, // Hours
];

// Create workbook
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Empire Sushi Stores');

// Write to file
const outputFile = 'empire_sushi_locations.xlsx';
XLSX.writeFile(wb, outputFile);

console.log(`✅ Successfully exported ${storesData.length} Empire Sushi store locations to ${outputFile}`);
console.log('\nStores by state:');
const stateCount = storesData.reduce((acc, store) => {
  acc[store.State] = (acc[store.State] || 0) + 1;
  return acc;
}, {});

Object.entries(stateCount).sort((a, b) => b[1] - a[1]).forEach(([state, count]) => {
  console.log(`  ${state}: ${count} store${count > 1 ? 's' : ''}`);
});
console.log(`\nTotal: ${storesData.length} stores nationwide`);
