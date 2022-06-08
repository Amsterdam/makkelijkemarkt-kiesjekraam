import time
from locust import HttpUser, task, between
from decouple import config

API_KEY = config('API_KEY')
API_MMAPPKEY = config('API_MMAPPKEY')
MARKT = config('MARKT')
KOOPMAN = config('KOOPMAN')

API_ROOT = '/api/1.1.0'


class MakkelijkeMarktApiUser(HttpUser):
    wait_time = between(1, 2)
    headers = {
        'MmAppKey': API_MMAPPKEY,
    }
    api_key = API_KEY
    token = ''

    def on_start(self):
        print('on_start')
        self.login()

    def login(self):
        login_url = f'{API_ROOT}/login/apiKey/'
        r = self.client.post(login_url, headers=self.headers, json={'api_key': self.api_key})
        self.token = r.json()['uuid']
        self.auth_header = {
            'Authorization': f'Bearer {self.token}',
        }
        self.headers = {
          **self.headers,
          **self.auth_header,
        }
        print(self.headers)

    # @task
    def swagger_index(self):
        self.client.get('/#doc')

    @task
    def get_markt(self):
        self.client.get(f'{API_ROOT}/markt/{MARKT}', headers=self.headers)

    @task
    def get_marktconfiguratie(self):
        self.client.get(f'{API_ROOT}/markt/{MARKT}/marktconfiguratie/latest', headers=self.headers)

    @task
    def get_branches(self):
        self.client.get(f'{API_ROOT}/branche/all', headers=self.headers)

    @task
    def get_koopman(self):
        self.client.get(f'{API_ROOT}/koopman/erkenningsnummer/{KOOPMAN}', headers=self.headers)

    @task
    def get_rsvp(self):
        self.client.get(f'{API_ROOT}/rsvp/koopman/{KOOPMAN}', headers=self.headers)

    # @task
    def post_rsvp(self):
        data = {
            "marktDate": "2022-05-03",
            "attending": True,
            "marktId": MARKT,
            "koopmanErkenningsNummer": KOOPMAN,
        }
        r = self.client.post(f'{API_ROOT}/rsvp', headers=self.headers, json=data)

    @task
    def get_marktvoorkeur(self):
        self.client.get(f'{API_ROOT}/marktvoorkeur/markt/{MARKT}/koopman/{KOOPMAN}', headers=self.headers)

    # @task
    def post_marktvoorkeur(self):
        data = {
            "koopman": KOOPMAN,
            "markt": MARKT,
            "anywhere": False,
            "minimum": 1,
            "maximum": 2,
            "hasInrichting": False,
            "bakType": "geen",
            "branche": "101 - FM - AGF (v)",
            "absentFrom": None,
            "absentUntil": None,
        }
        r = self.client.post(f'{API_ROOT}/marktvoorkeur', headers=self.headers, json=data)

    @task
    def get_plaatsvoorkeur(self):
        self.client.get(f'{API_ROOT}/plaatsvoorkeur/markt/{MARKT}/koopman/{KOOPMAN}', headers=self.headers)

    # @task
    def post_plaatsvoorkeur(self):
        data = {
            "koopman": KOOPMAN,
            "markt": MARKT,
            "plaatsen": ["5","1","3"],
        }
        r = self.client.post(f'{API_ROOT}/plaatsvoorkeur', headers=self.headers, json=data)
