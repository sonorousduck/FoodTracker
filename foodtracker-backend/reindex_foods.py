import os
from typing import Any, Dict, Optional

import requests


def build_index_payload() -> Dict[str, Any]:
    return {
        "settings": {
            "analysis": {
                "normalizer": {
                    "lowercase_normalizer": {
                        "type": "custom",
                        "filter": ["lowercase"],
                    }
                }
            }
        },
        "mappings": {
            "properties": {
                "name": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "normalizer": "lowercase_normalizer",
                        }
                    },
                },
                "brand": {
                    "type": "text",
                    "fields": {
                        "keyword": {
                            "type": "keyword",
                            "normalizer": "lowercase_normalizer",
                        }
                    },
                },
            }
        },
    }


def delete_index(es_url: str, index_name: str) -> None:
    response = requests.delete(f"{es_url}/{index_name}", timeout=10)
    if response.status_code in (200, 404):
        return
    response.raise_for_status()


def create_index(es_url: str, index_name: str) -> None:
    payload = build_index_payload()
    response = requests.put(f"{es_url}/{index_name}", json=payload, timeout=10)
    response.raise_for_status()


def reindex_foods(api_base_url: str, api_token: Optional[str]) -> None:
    headers = {}
    if api_token:
        headers["Authorization"] = f"Bearer {api_token}"
    response = requests.post(f"{api_base_url}/food/reindex", headers=headers, timeout=30)
    response.raise_for_status()
    body = response.json()
    print(f"Reindexed {body.get('indexedCount', 0)} foods.")


def main() -> int:
    es_url = os.getenv("ES_URL", "http://localhost:9200").rstrip("/")
    index_name = os.getenv("ES_FOOD_INDEX", "foods")
    api_base_url = os.getenv("API_BASE_URL", "http://localhost:3001").rstrip("/")
    api_token = os.getenv("API_TOKEN")

    print(f"Deleting index {index_name} at {es_url} (if it exists)...")
    delete_index(es_url, index_name)

    print(f"Creating index {index_name} with updated mappings...")
    create_index(es_url, index_name)

    print(f"Calling {api_base_url}/food/reindex...")
    reindex_foods(api_base_url, api_token)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
