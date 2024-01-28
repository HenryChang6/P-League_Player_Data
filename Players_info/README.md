# P-League Player Data Retrieval

## Overview
This script automates the process of retrieving player information for P-League basketball players and stores the data in a structured JSON format.

## How to Run
Execute the script using the following command:

```bash
python3 RunThisScript.py
```

## Output Files
- `player_id.json`: Contains the IDs of all the players, which is used for subsequent crawling processes.
- `players_data.json`: The final file with detailed player data, including:
    - `player_id`: The unique identifier for each player in the website.
    - `chinese_name`: The player's name in Chinese characters.
    - `english_nickname`: The player's English nickname.
    - `english_name`: The player's full English name.
    - `team`: The name of the team the player is currently on.
    - `number`: The player's jersey number.
    - `position`: The playing position of the player (e.g., G, F, C).
    - `height`: The player's height in centimeters.
    - `weight`: The player's weight in kilograms.
    - `birthday`: The player's date of birth.
    - `identity`: The player's nationality or identity within the league.
    - `image_url`: A URL link to the player's image.

## Dependencies
Ensure that the required dependencies are installed before running the script:

```bash
pip install -r requirements.txt
```

