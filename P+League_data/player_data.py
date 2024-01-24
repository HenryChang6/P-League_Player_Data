import requests
from bs4 import BeautifulSoup
import os
import re
import json
from urllib.parse import urljoin

# 初始化最終的數據列表
datas = []

for num in range(40, 96):
    URL = f"https://pleagueofficial.com/player/{num}"
    response = requests.get(URL)

    # 頁面狀態檢查
    if response.status_code != 200 or response.url != URL:
        print(f"無法處理 player_id: {num}")
        continue

    html = response.content
    soup = BeautifulSoup(html, 'html.parser')

    # 初始化當前球員的數據字典
    player_data = {"player_id": str(num)}

    # 中文名稱
    chinese_name = soup.select_one(".player_name_ch span")
    player_data["chinese_name"] = chinese_name.get_text() if chinese_name else "unknown"

    # 英文暱稱
    english_nickname = soup.select_one(".player_name_en")
    player_data["english_nickname"] = english_nickname.get_text() if english_nickname else "unknown"

    # 英文名稱
    english_name = soup.select_one(".worker_black.fs20")[0]
    player_data["english_name"] = english_name.get_text() if english_name else "unknown"

    # 其他資訊（如球隊、身份、號碼等）
    info = soup.select_one(".col-md-5.PC_only h5")
    if info:
        info_text = info.get_text()
        parts = info_text.split(" | ")
        team = parts[0].strip() if len(parts) > 0 else "未知"
        number = parts[1].strip().replace("#", "").strip() if len(parts) > 1 else "未知"
        position = parts[2].strip() if len(parts) > 2 else "未知"
        player_data["team"] = team
        player_data["number"] = number
        player_data["position"] = position

    # 身高、體重、生日等
    stats = soup.select(".text-light.opacity-9.mt-md-3.fs16 span")
    for stat in stats:
        text = stat.get_text()
        if "身高" in text:
            player_data["height"] = text.split("：")[1]
        elif "體重" in text:
            player_data["weight"] = text.split("：")[1]
        elif "生日" in text:
            player_data["birthday"] = text.split("：")[1]

    # 圖片 
    image_container = soup.select_one(".player_image")
    if image_container:
        # 從 style 屬性中提取圖片 URL
        style = image_container.get('style')
        image_url_match = re.search(r"url\('(.+?)'\)", style)
        if image_url_match:
            image_url = image_url_match.group(1)
            # 確保 URL 完整
            image_url = urljoin("https://d36fypkbmmogz6.cloudfront.net", image_url)

            # 下載圖片
            image_response = requests.get(image_url)
            if image_response.status_code == 200:
                # 提取檔案名稱
                file_name = os.path.basename(image_url)
                image_path = os.path.join("image_data", file_name)

                # 保存圖片
                # os.makedirs("image_data", exist_ok=True)
                # with open(image_path, 'wb') as file:
                #     file.write(image_response.content)
                
                # 加入 player_data
                player_data["image_url"] = file_name

            else:
                player_data["image_url"] = "error"
        else:
            player_data["image_url"] = "error"

    datas.append(player_data)

# 將資料轉成 json file
json_data = json.dumps(datas, ensure_ascii=False, indent=4)

with open('players_data.json', 'w', encoding='utf-8') as file:
    file.write(json_data)

print("JSON 檔案已保存")