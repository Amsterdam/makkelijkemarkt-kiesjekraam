import time
import sys
import random
import math

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from decouple import config


TIMEOUT = 10
ONDERNEMER = sys.argv[1]
WORKER_ID = int(sys.argv[2])

MARKTBEWERKER = config('MARKTBEWERKER')
PW = config('PW')
HOST = config('HOST')
LOOPS = config('LOOPS', cast=int, default=3)
BROWSER_SIZE_X = config('BROWSER_SIZE_X', cast=int, default=400)
BROWSER_SIZE_Y = config('BROWSER_SIZE_Y', cast=int, default=400)

MARKTEN_URL = f'{HOST}/markt'

SCREEN_RES_X, SCREEN_RES_Y = 3456/2, 2234/2  # for OSX: system_profiler SPDisplaysDataType |grep Resolution
MAX_WINDOWS_X = math.floor(SCREEN_RES_X / BROWSER_SIZE_X)
MAX_WINDOWS_Y = math.floor(SCREEN_RES_Y / BROWSER_SIZE_Y)
MAX_WINDOWS = MAX_WINDOWS_X * MAX_WINDOWS_Y

worker_base_id = WORKER_ID % MAX_WINDOWS
window_pos_x = (WORKER_ID % MAX_WINDOWS_X) * BROWSER_SIZE_X
window_row = math.floor(worker_base_id / MAX_WINDOWS_X)
window_row = min(window_row, MAX_WINDOWS_Y - 1)
window_pos_y = window_row * BROWSER_SIZE_Y

# Headless:
# options = Options()
# options.headless = True
# browser = webdriver.Chrome(options=options)

browser = webdriver.Chrome()
browser.set_window_size(BROWSER_SIZE_X, BROWSER_SIZE_Y)
browser.set_window_position(window_pos_x, window_pos_y)

time.sleep(random.random() * 5)
print(f'Starting worker {WORKER_ID}: {ONDERNEMER}')

browser.get(MARKTEN_URL)
user_input = browser.find_element(By.ID, 'username')
user_input.send_keys(MARKTBEWERKER)
time.sleep(1)

pw_input = browser.find_element(By.ID, 'password')
pw_input.send_keys(PW)
time.sleep(1)

submit_button = browser.find_element(By.ID, 'kc-login')
submit_button

submit_button.submit()


try:
  for i in range(LOOPS):
    time.sleep(random.random() * 2)
    browser.get(MARKTEN_URL)

    markt_link = browser.find_element(By.LINK_TEXT, 'Albert Cuyp')
    markt_link.click()

    profile_page = f'{HOST}/profile/{ONDERNEMER}'
    browser.get(profile_page)

    aanwezigheid_link = browser.find_element(By.LINK_TEXT, 'aanwezigheid')
    aanwezigheid_link.click()

    opslaan_button = browser.find_element(By.NAME, 'next')
    opslaan_button.click()



    plaatsvoorkeuren_link = browser.find_element(By.LINK_TEXT, 'plaatsvoorkeuren')
    plaatsvoorkeuren_link.click()

    opslaan_button = browser.find_element(By.NAME, 'redirectTo')
    opslaan_button.click()


    algvoorkeuren_link = browser.find_element(By.LINK_TEXT, 'algemene voorkeuren')
    algvoorkeuren_link.click()

    opslaan_button = browser.find_element(By.NAME, 'next')
    opslaan_button.click()

except Exception as e:
  print(e)
  print(f'ERROR: Worker {WORKER_ID} crashed')

else:
  print(f'OK: Worker {WORKER_ID} finished')

finally:
  browser.get(MARKTEN_URL)
  uitloggen_link = browser.find_element(By.LINK_TEXT, 'Uitloggen')
  uitloggen_link.click()
  time.sleep(10)

  browser.quit()
