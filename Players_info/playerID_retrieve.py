import requests
from bs4 import BeautifulSoup
import re
import json

playerIDs = []

# 共六隊，從 1 到 6
for i in range(1,7):
    URL = f"https://pleagueofficial.com/team/{i}/#player_info"
    response = requests.get(URL)
    html = response.content
    soup = BeautifulSoup(html, 'html.parser')
    objs = soup.select(".player_list .mb-grid-gutter a")
    for obj in objs:
        href = obj.get('href')
        if href:
            match = re.search(r'/player/(\d+)', href)
            if match:
                playerID = match.group(1)
                playerIDs.append(playerID)
        
json_data = json.dumps(playerIDs, ensure_ascii=False, indent=4)

# 將 JSON 數據寫入檔案
with open('player_id.json', 'w', encoding='utf-8') as file:
    file.write(json_data)

print("成功儲存player_id JSON檔案")