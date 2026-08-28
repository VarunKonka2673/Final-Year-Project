import requests, json
url = "http://127.0.0.1:8000/api/retrain"
payload = {"num_samples": 500, "fake_ratio": 0.05, "smote_ratio": 0.5}
resp = requests.post(url, json=payload)
print("Status:", resp.status_code)
print("Response:", resp.text)
