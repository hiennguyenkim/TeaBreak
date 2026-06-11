// Vietnam Administrative Regions Data
const vietnamRegions = {
  "TP. Hồ Chí Minh": {
    "Quận 1": ["Phường Bến Nghé", "Phường Bến Thành", "Phường Cô Giang", "Phường Đa Kao", "Phường Nguyễn Thái Bình", "Phường Phạm Ngũ Lão", "Phường Tân Định"],
    "Quận 3": ["Phường Võ Thị Sáu", "Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5"],
    "Quận 5": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 6", "Phường 7", "Phường 8"],
    "Quận 10": ["Phường 1", "Phường 2", "Phường 4", "Phường 12", "Phường 14", "Phường 15"],
    "Quận Bình Thạnh": ["Phường 1", "Phường 2", "Phường 3", "Phường 15", "Phường 17", "Phường 25", "Phường 26"],
    "Quận Phú Nhuận": ["Phường 1", "Phường 2", "Phường 3", "Phường 9", "Phường 15", "Phường 17"],
    "Quận Gò Vấp": ["Phường 1", "Phường 3", "Phường 5", "Phường 7", "Phường 10", "Phường 15"],
    "Quận Tân Bình": ["Phường 1", "Phường 2", "Phường 4", "Phường 12", "Phường 15"]
  },
  "Hà Nội": {
    "Quận Ba Đình": ["Phường Cống Vị", "Phường Điện Biên", "Phường Giảng Võ", "Phường Kim Mã", "Phường Liễu Giai", "Phường Thành Công"],
    "Quận Hoàn Kiếm": ["Phường Chương Dương", "Phường Cửa Đông", "Phường Đồng Xuân", "Phường Hàng Bạc", "Phường Hàng Bài", "Phường Tràng Tiền"],
    "Quận Đống Đa": ["Phường Cát Linh", "Phường Hàng Bột", "Phường Khâm Thiên", "Phường Láng Hạ", "Phường Láng Thượng", "Phường Quang Trung"],
    "Quận Hai Bà Trưng": ["Phường Bách Khoa", "Phường Đồng Tâm", "Phường Lê Đại Hành", "Phường Minh Khai", "Phường Phố Huế"],
    "Quận Cầu Giấy": ["Phường Dịch Vọng", "Phường Mai Dịch", "Phường Nghĩa Tân", "Phường Quan Hoa", "Phường Trung Hòa"],
    "Quận Tây Hồ": ["Phường Bưởi", "Phường Nhật Tân", "Phường Quảng An", "Phường Thụy Khuê", "Phường Tứ Liên"]
  },
  "Đà Nẵng": {
    "Quận Hải Châu": ["Phường Bình Hiên", "Phường Bình Thuận", "Phường Hòa Cường Bắc", "Phường Hòa Cường Nam", "Phường Nam Dương", "Phường Phước Ninh"],
    "Quận Thanh Khê": ["Phường An Khê", "Phường Chính Gián", "Phường Hòa Khê", "Phường Tam Thuận", "Phường Tân Chính", "Phường Thạc Gián"],
    "Quận Sơn Trà": ["Phường An Hải Bắc", "Phường An Hải Đông", "Phường An Hải Tây", "Phường Mân Thái", "Phường Phước Mỹ"]
  },
  "Cần Thơ": {
    "Quận Ninh Kiều": ["Phường An Bình", "Phường An Cư", "Phường An Hòa", "Phường An Khánh", "Phường An Nghiệp", "Phường An Phú", "Phường Xuân Khánh"],
    "Quận Bình Thủy": ["Phường An Thới", "Phường Bình Thủy", "Phường Bùi Hữu Nghĩa", "Phường Long Hòa", "Phường Long Tuyền", "Phường Thới An Đông"]
  },
  "Hải Phòng": {
    "Quận Hồng Bàng": ["Phường Hạ Lý", "Phường Hoàng Văn Thụ", "Phường Minh Khai", "Phường Phan Bội Châu", "Phường Sở Dầu", "Phường Thượng Lý"],
    "Quận Lê Chân": ["Phường An Biên", "Phường An Dương", "Phường Cát Dài", "Phường Dư Hàng", "Phường Dư Hàng Kênh", "Phường Hàng Kênh"]
  },
  "Bình Dương": {
    "Thành phố Thủ Dầu Một": ["Phường Phú Cường", "Phường Hiệp Thành", "Phường Chánh Nghĩa", "Phường Phú Lợi", "Phường Phú Thọ"],
    "Thành phố Thuận An": ["Phường Lái Thiêu", "Phường An Thạnh", "Phường Vĩnh Phú", "Phường Bình Hòa"],
    "Thành phố Dĩ An": ["Phường Dĩ An", "Phường An Bình", "Phường Tân Đông Hiệp", "Phường Đông Hòa"]
  },
  "Đồng Nai": {
    "Thành phố Biên Hòa": ["Phường Quyết Thắng", "Phường Thanh Bình", "Phường Trung Dũng", "Phường Tân Phong", "Phường Thống Nhất", "Phường Trảng Dài"],
    "Thành phố Long Khánh": ["Phường Xuân Trung", "Phường Xuân Thanh", "Phường Xuân An"]
  },
  "Khánh Hòa": {
    "Thành phố Nha Trang": ["Phường Lộc Thọ", "Phường Tân Lập", "Phường Phước Tiến", "Phường Vạn Thạnh", "Phường Vĩnh Hải", "Phường Phước Long"],
    "Thành phố Cam Ranh": ["Phường Ba Ngòi", "Phường Cam Linh", "Phường Cam Thuận"]
  },
  "Lâm Đồng": {
    "Thành phố Đà Lạt": ["Phường 1", "Phường 2", "Phường 3", "Phường 4", "Phường 5", "Phường 10"],
    "Thành phố Bảo Lộc": ["Phường 1", "Phường 2", "Phường Lộc Sơn"]
  },
  "Quảng Ninh": {
    "Thành phố Hạ Long": ["Phường Bãi Cháy", "Phường Hồng Gai", "Phường Hồng Hà", "Phường Giếng Đáy", "Phường Cao Xanh"],
    "Thành phố Cẩm Phả": ["Phường Cẩm Tây", "Phường Cẩm Trung", "Phường Cẩm Thành"]
  }
};

const otherProvinces = [
  "An Giang", "Bà Rịa - Vũng Tàu", "Bắc Giang", "Bắc Kạn", "Bạc Liêu", "Bắc Ninh", "Bến Tre", "Bình Định", 
  "Bình Phước", "Bình Thuận", "Cà Mau", "Cao Bằng", "Đắk Lắk", "Đắk Nông", "Điện Biên", 
  "Đồng Tháp", "Gia Lai", "Hà Giang", "Hà Nam", "Hà Tĩnh", "Hải Dương", "Hậu Giang", 
  "Hòa Bình", "Hưng Yên", "Kiên Giang", "Kon Tum", "Lai Châu", "Lạng Sơn", 
  "Lào Cai", "Long An", "Nam Định", "Nghe An", "Ninh Bình", "Ninh Thuan", "Phú Thọ", "Phú Yên", 
  "Quảng Bình", "Quảng Nam", "Quảng Ngãi", "Quảng Trị", "Sóc Trăng", "Sơn La", 
  "Tây Ninh", "Thái Bình", "Thái Nguyên", "Thanh Hóa", "Thừa Thiên Huế", "Tiền Giang", "Trà Vinh", 
  "Tuyên Quang", "Vĩnh Long", "Vĩnh Phục", "Yên Bái"
];

window.vietnamRegions = vietnamRegions;
window.otherProvinces = otherProvinces;
