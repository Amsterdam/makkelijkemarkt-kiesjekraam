import datetime
import random
from locust import HttpUser, task, between
from decouple import config

API_KEY = config('API_KEY')
API_MMAPPKEY = config('API_MMAPPKEY')

API_ROOT = '/api/1.1.0'

class koopman:
    def __init__(self, erkenningsNummer, marktId, koopmanId):
        self.KOOPMAN = erkenningsNummer
        self.MARKT = marktId
        self.KOOPMAN_ID = koopmanId

KOOPMANNEN = []
KOOPMANNEN.append(koopman('2019010303', '204', '10385'))
KOOPMANNEN.append(koopman('2005072001', '204', '4876'))
KOOPMANNEN.append(koopman('1975121601', '204', '506'))
KOOPMANNEN.append(koopman('2004041402', '204', '4437'))
KOOPMANNEN.append(koopman('2007052901', '20', '5383'))
KOOPMANNEN.append(koopman('2012011203', '20', '6910'))
KOOPMANNEN.append(koopman('2012011203', '20', '6910'))
KOOPMANNEN.append(koopman('2009011202', '20', '5851'))
KOOPMANNEN.append(koopman('2006060102', '20', '5135'))
KOOPMANNEN.append(koopman('2010062502', '20', '6428'))
KOOPMANNEN.append(koopman('2009011202', '20', '5851'))
KOOPMANNEN.append(koopman('2010041401', '20', '6352'))

class MakkelijkeMarktApiUser(HttpUser):
    wait_time = between(1, 2)
    headers = {
        'MmAppKey': API_MMAPPKEY,
    }
    api_key = API_KEY
    token = ''

    choice = random.choice(KOOPMANNEN)
    MARKT = choice.MARKT
    KOOPMAN = choice.KOOPMAN
    KOOPMAN_ID = choice.KOOPMAN_ID
    TODAY = datetime.date.today().isoformat()

    def on_start(self):
        choice = random.choice(KOOPMANNEN)
        self.MARKT = choice.MARKT
        self.KOOPMAN = choice.KOOPMAN

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

    # @task(36)
    def get_foto_for_hash(self):

        # To use this function get some foto hashes out of the DB.
        # For example: SELECT foto FROM koopman WHERE foto IS NOT NULL LIMIT 200;

        foto_hash = random.choice(foto_hashes)
        uri = f"/media/cache/resolve/koopman_rect_small/{foto_hash}"
        r = self.client.get(uri, headers=self.headers)
        print(f'Foto hash status: {r.status_code}')

    # @task
    def swagger_index(self):
        self.client.get('/#doc')

    @task(2)
    def get_markt(self):
        self.client.get(f'{API_ROOT}/markt/{self.MARKT}', headers=self.headers)

    @task(1)
    def get_markten(self):
        self.client.get(f'{API_ROOT}/markt/', headers=self.headers)

    # @task
    def get_marktconfiguratie(self):
        self.client.get(f'{API_ROOT}/markt/{self.MARKT}/marktconfiguratie/latest', headers=self.headers)

    @task(1)
    def get_branches(self):
        self.client.get(f'{API_ROOT}/branche/all', headers=self.headers)

    @task(5)
    def get_koopman(self):
        self.client.get(f'{API_ROOT}/koopman/erkenningsnummer/{self.KOOPMAN}', headers=self.headers)

    @task(1)
    def get_sollicaties_markt(self):
        self.client.get(f'{API_ROOT}/sollicitaties/markt/{self.MARKT}?listLength=10000&includeDoorgehaald=0', headers=self.headers)

    @task(2)
    def get_rsvp(self):
        self.client.get(f'{API_ROOT}/rsvp/koopman/{self.KOOPMAN}', headers=self.headers)

    # @task
    def post_rsvp(self):
        data = {
            "marktDate": "2022-05-03",
            "attending": True,
            "marktId": self.MARKT,
            "koopmanErkenningsNummer": self.KOOPMAN,
        }
        r = self.client.post(f'{API_ROOT}/rsvp', headers=self.headers, json=data)

    @task(4)
    def get_marktvoorkeur(self):
        self.client.get(f'{API_ROOT}/marktvoorkeur/markt/{self.MARKT}/koopman/{self.KOOPMAN}', headers=self.headers)

    # @task
    def post_marktvoorkeur(self):
        data = {
            "koopman": self.KOOPMAN,
            "markt": self.MARKT,
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

    @task(2)
    def get_plaatsvoorkeur_markt_koopman(self):
        self.client.get(f'{API_ROOT}/plaatsvoorkeur/markt/{self.MARKT}/koopman/{self.KOOPMAN}', headers=self.headers)

    @task(1)
    def get_plaatsvoorkeur_koopman(self):
        self.client.get(f'{API_ROOT}/plaatsvoorkeur/koopman/{self.KOOPMAN}', headers=self.headers)

    @task(2)
    def get_allocatie_markt_koopman(self):
        self.client.get(f'{API_ROOT}/allocation/markt/{self.MARKT}/koopman/{self.KOOPMAN}', headers=self.headers)

    @task(1)
    def get_allocatie_koopman(self):
        self.client.get(f'{API_ROOT}/allocation/koopman/{self.KOOPMAN}', headers=self.headers)

    # @task
    def post_plaatsvoorkeur(self):
        data = {
            "koopman": self.KOOPMAN,
            "markt": self.MARKT,
            "plaatsen": ["5","1","3"],
        }
        r = self.client.post(f'{API_ROOT}/plaatsvoorkeur', headers=self.headers, json=data)

    @task(9)
    def get_dag_vergunning_by_date(self):
        self.client.get(f'{API_ROOT}/dagvergunning_by_date/{self.KOOPMAN_ID}/{self.TODAY}/{self.TODAY}', headers=self.headers)

    # Too much data
    # @task
    def post_dagvergunning(self):
        data = {
            "erkenningsnummer": str(self.KOOPMAN),
            "marktId": int(self.MARKT),
            "dag": self.TODAY,
            "aanwezig": "Zelf",
            "aantal4MeterKramen": 2,
            "extraMeters": 2,
            "afvaleiland": 1
        }
        r = self.client.post(f'{API_ROOT}/dagvergunning/', headers=self.headers, json=data)

    @task(12)
    def post_concept_dagvergunning(self):
        data = {
            "erkenningsnummer": self.KOOPMAN,
            "marktId": int(self.MARKT),
            "dag": self.TODAY,
            "aanwezig": "Zelf",
            "aantal4MeterKramen": 2,
            "extraMeters": 2,
            "afvaleiland": 1
        }
        r = self.client.post(f'{API_ROOT}/dagvergunning_concept/', headers=self.headers, json=data)

    @task(4)
    def get_rapport_dubbelstaan(self):
        self.client.get(f'{API_ROOT}/rapport/dubbelstaan/{self.TODAY}', headers=self.headers)

    @task(5)
    def get_dagvergunning_by_markt_dag(self):
        self.client.get(f'{API_ROOT}/dagvergunning/?marktId={self.MARKT}&dag={self.TODAY}', headers=self.headers)