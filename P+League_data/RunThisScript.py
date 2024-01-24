import subprocess

# 执行 playerID_retrieve.py
subprocess.run(['python3', 'playerID_retrieve.py'], check=True)

# 执行 main.py
subprocess.run(['python3', 'main.py'], check=True)
