import requests
from bs4 import BeautifulSoup
import os
import re
import json
from urllib.parse import urljoin

# 初始化最終的數據列表
datas = []

# 初始化欲抓取之 playerID
with open('player_id.json', 'r', encoding='utf-8') as file:
    playerIDs = json.load(file)
    print("成功將player_id JSON檔案轉換為Python資料")

for ID in playerIDs:
    URL = f"https://pleagueofficial.com/player/{ID}"
    response = requests.get(URL)
    html = response.content
    soup = BeautifulSoup(html, 'html.parser')
    
    # player id
    player_data = {"player_id": str(ID)}

    # 中文名稱
    chinese_name = soup.select_one(".player_name_ch span")
    player_data["chinese_name"] = chinese_name.get_text() if chinese_name else "unknown"

    # 英文暱稱
    english_nickname = soup.select_one(".player_name_en")
    player_data["english_nickname"] = english_nickname.get_text() if english_nickname else "unknown"

    # 英文名稱
    english_name = soup.select_one(".worker_black.fs20")
    player_data["english_name"] = english_name.get_text().split('\n')[0] if english_name else "unknown"
    
    # 隊伍名稱、背號、位置
    info = soup.select_one(".col-md-5.PC_only h5")
    if info:
        info_text = info.get_text()
        parts = info_text.split("|")
        player_data["team"] = parts[0].strip() if len(parts) > 0 else "unknown"
        player_data["number"] = re.search(r'# (\d+)', parts[1]).group(1) if len(parts) > 1 else "unknown"
        player_data["position"] = parts[2].strip() if len(parts) > 2 else "unknown"

    # 身高、體重、生日、身份
    stats = soup.select(".text-light.opacity-9.mt-md-3.fs16 span")
    for stat in stats:
        text = stat.get_text()
        if "身高" in text:
            height = re.search(r'(\d+)', text)
            player_data["height"] = int(height.group(1)) if height else "unknown"
        elif "體重" in text:
            weight = re.search(r'(\d+)', text)
            player_data["weight"] = int(weight.group(1)) if weight else "unknown"
        elif "生日" in text:
            player_data["birthday"] = text.split("：")[1]
        elif "身份" in text:
            player_data["identity"] = text.split("：")[1]
    
    
    # 圖片
    image_container = soup.select_one(".player_image")
    if image_container:
        style = image_container.get('style')
        image_url_match = re.search(r"url\('(.+?)'\)", style)
        if image_url_match:
            image_url = image_url_match.group(1)
            image_url = urljoin("https://d36fypkbmmogz6.cloudfront.net", image_url)
            image_response = requests.get(image_url)
            if image_response.status_code == 200:
                file_name = os.path.basename(image_url)
                image_path = os.path.join("image_data", file_name)
                os.makedirs("image_data", exist_ok=True)
                with open(image_path, 'wb') as file:
                    file.write(image_response.content)
                player_data["image_url"] = file_name
            else:
                player_data["image_url"] = "error"
        else:
            player_data["image_url"] = "error"

    datas.append(player_data)

# 將數據轉換為 JSON 格式
json_data = json.dumps(datas, ensure_ascii=False, indent=4)

# 將 JSON 數據寫入檔案
with open('players_data.json', 'w', encoding='utf-8') as file:
    file.write(json_data)

print("成功儲存players_data json檔案")
