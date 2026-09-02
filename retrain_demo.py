import requests, json
url = "http://127.0.0.1:8000/api/retrain"
payload = {"num_samples": 100, "fake_ratio": 0.0, "smote_ratio": 0.0}
response = requests.post(url, json=payload)
print("Status:", response.status_code)
print("Response:", response.text)
