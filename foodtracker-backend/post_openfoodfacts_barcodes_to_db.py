import argparse
import concurrent.futures as cf
import sys
import threading
import time
from typing import Dict, List, Optional, Tuple

import pandas as pd
import requests
from requests.adapters import HTTPAdapter
from tqdm import tqdm


class OpenFoodFactsImporter:
    def __init__(
        self,
        csv_file_path: str,
        api_base_url: str = "http://localhost:3001",
        auth_token: Optional[str] = None,
    ):
        self.csv_file_path = csv_file_path
        self.api_base_url = api_base_url
        self.auth_token = auth_token
        self.success_count = 0
        self.error_count = 0
        self.skipped_count = 0
        self.submitted_count = 0
        self.batch_success_count = 0
        self.batch_fail_count = 0
        self.errors: List[str] = []
        self._thread_local = threading.local()

    def _headers(self) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
        return headers

    def _clean_string(self, value) -> Optional[str]:
        if pd.isna(value) or value == "" or value == "N/A":
            return None
        return str(value).strip()

    def _clean_numeric(self, value) -> float:
        if pd.isna(value) or value == "" or value == "N/A":
            return 0.0
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0

    def _grams_to_mg(self, value: float) -> float:
        return value * 1000.0

    def _maybe_g_to_mg(self, value: float) -> float:
        # Heuristic: values <= 10 likely represent grams, otherwise assume already in mg.
        if value <= 10:
            return self._grams_to_mg(value)
        return value

    def _sodium_mg(self, row: Dict) -> float:
        sodium_g = self._clean_numeric(row.get("sodium_100g", 0))
        if sodium_g > 0:
            return self._grams_to_mg(sodium_g)

        salt_g = self._clean_numeric(row.get("salt_100g", 0))
        if salt_g > 0:
            # Sodium is roughly 40% of salt by weight.
            return self._grams_to_mg(salt_g) * 0.4

        return 0.0

    def _calories(self, row: Dict) -> int:
        kcal = self._clean_numeric(row.get("energy-kcal_100g", 0))
        if kcal > 0:
            return int(round(kcal))

        kj = self._clean_numeric(row.get("energy-kj_100g", 0)) or self._clean_numeric(row.get("energy_100g", 0))
        if kj > 0:
            return int(round(kj / 4.184))

        return 0

    def _build_measurements(self) -> List[Dict]:
        return [
            {
                "name": "100 grams",
                "abbreviation": "100g",
                "unit": "g",
                "weightInGrams": 100.0,
                "isDefault": True,
                "isFromSource": True,
            },
            {
                "name": "1 gram",
                "abbreviation": "1g",
                "unit": "g",
                "weightInGrams": 1.0,
                "isDefault": False,
                "isFromSource": True,
            },
        ]

    def _row_to_payload(self, row: Dict) -> Optional[Dict]:
        barcode = self._clean_string(row.get("code"))
        name = self._clean_string(row.get("product_name")) or self._clean_string(row.get("generic_name"))

        if not barcode or not name:
            return None

        food = {
            "sourceId": barcode,
            "name": name,
            "brand": self._clean_string(row.get("brands")),
            "foodGroup": self._clean_string(row.get("categories_en")),
            "calories": self._calories(row),
            "protein": self._clean_numeric(row.get("proteins_100g", 0)),
            "carbs": self._clean_numeric(row.get("carbohydrates_100g", 0)),
            "fat": self._clean_numeric(row.get("fat_100g", 0)),
            "fiber": self._clean_numeric(row.get("fiber_100g", 0)),
            "sugar": self._clean_numeric(row.get("sugars_100g", 0)),
            "sodium": self._sodium_mg(row),
            "saturatedFat": self._clean_numeric(row.get("saturated-fat_100g", 0)),
            "transFat": self._clean_numeric(row.get("trans-fat_100g", 0)),
            "cholesterol": self._maybe_g_to_mg(self._clean_numeric(row.get("cholesterol_100g", 0))),
            "addedSugar": self._clean_numeric(row.get("added-sugars_100g", 0)),
            "solubleFiber": self._clean_numeric(row.get("soluble-fiber_100g", 0)),
            "insolubleFiber": self._clean_numeric(row.get("insoluble-fiber_100g", 0)),
            "water": self._clean_numeric(row.get("water_100g", 0)),
            "omega3": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-3-fat_100g", 0))),
            "omega6": self._maybe_g_to_mg(self._clean_numeric(row.get("omega-6-fat_100g", 0))),
            "monoFat": self._maybe_g_to_mg(self._clean_numeric(row.get("monounsaturated-fat_100g", 0))),
            "polyFat": self._maybe_g_to_mg(self._clean_numeric(row.get("polyunsaturated-fat_100g", 0))),
            "ala": self._maybe_g_to_mg(self._clean_numeric(row.get("alpha-linolenic-acid_100g", 0))),
            "epa": self._maybe_g_to_mg(self._clean_numeric(row.get("eicosapentaenoic-acid_100g", 0))),
            "dha": self._maybe_g_to_mg(self._clean_numeric(row.get("docosahexaenoic-acid_100g", 0))),
            "calcium": self._clean_numeric(row.get("calcium_100g", 0)),
            "iron": self._clean_numeric(row.get("iron_100g", 0)),
            "potassium": self._clean_numeric(row.get("potassium_100g", 0)),
            "magnesium": self._clean_numeric(row.get("magnesium_100g", 0)),
            "phosphorus": self._clean_numeric(row.get("phosphorus_100g", 0)),
            "zinc": self._clean_numeric(row.get("zinc_100g", 0)),
            "copper": self._clean_numeric(row.get("copper_100g", 0)),
            "manganese": self._clean_numeric(row.get("manganese_100g", 0)),
            "selenium": self._clean_numeric(row.get("selenium_100g", 0)),
            "fluoride": self._clean_numeric(row.get("fluoride_100g", 0)),
            "molybdenum": self._clean_numeric(row.get("molybdenum_100g", 0)),
            "chlorine": self._clean_numeric(row.get("chloride_100g", 0)),
            "vitaminArae": self._clean_numeric(row.get("vitamin-a_100g", 0)),
            "vitaminC": self._clean_numeric(row.get("vitamin-c_100g", 0)),
            "vitaminB1": self._clean_numeric(row.get("vitamin-b1_100g", 0)),
            "vitaminB2": self._clean_numeric(row.get("vitamin-b2_100g", 0)),
            "vitaminB3": self._clean_numeric(row.get("vitamin-pp_100g", 0)),
            "vitaminB6": self._clean_numeric(row.get("vitamin-b6_100g", 0)),
            "vitaminB12": self._clean_numeric(row.get("vitamin-b12_100g", 0)),
            "folate": self._clean_numeric(row.get("folates_100g", 0) or row.get("vitamin-b9_100g", 0)),
            "vitaminD": self._clean_numeric(row.get("vitamin-d_100g", 0)),
            "vitaminE": self._clean_numeric(row.get("vitamin-e_100g", 0)),
            "vitaminK": self._clean_numeric(row.get("vitamin-k_100g", 0)),
            "betaine": self._clean_numeric(row.get("betaine_100g", 0)),
            "choline": self._clean_numeric(row.get("choline_100g", 0)),
            "caroteneBeta": self._clean_numeric(row.get("beta-carotene_100g", 0)),
            "measurements": self._build_measurements(),
        }

        return {"barcode": barcode, "food": food}

    def _get_session(self) -> requests.Session:
        if not hasattr(self._thread_local, "session"):
            session = requests.Session()
            adapter = HTTPAdapter(pool_connections=100, pool_maxsize=100)
            session.mount("http://", adapter)
            session.mount("https://", adapter)
            self._thread_local.session = session
        return self._thread_local.session

    def _post_batch(
        self,
        batch: List[Dict],
        batch_id: int,
        request_timeout: float,
        max_retries: int,
        retry_backoff: float,
    ) -> Dict:
        url = f"{self.api_base_url}/food-barcodes/bulk"
        session = self._get_session()

        for attempt in range(max_retries + 1):
            started = time.perf_counter()
            try:
                response = session.post(
                    url,
                    json=batch,
                    headers=self._headers(),
                    timeout=request_timeout,
                )
                latency = time.perf_counter() - started

                if response.status_code in (200, 201):
                    return {
                        "ok": True,
                        "rows": len(batch),
                        "batch_id": batch_id,
                        "status_code": response.status_code,
                        "latency_s": latency,
                        "attempts": attempt + 1,
                        "fatal_auth": False,
                        "error": "",
                    }

                if response.status_code in (401, 403):
                    return {
                        "ok": False,
                        "rows": len(batch),
                        "batch_id": batch_id,
                        "status_code": response.status_code,
                        "latency_s": latency,
                        "attempts": attempt + 1,
                        "fatal_auth": True,
                        "error": f"Unauthorized response ({response.status_code}).",
                    }

                can_retry = response.status_code == 429 or 500 <= response.status_code < 600
                if can_retry and attempt < max_retries:
                    sleep_s = retry_backoff * (2 ** attempt)
                    time.sleep(sleep_s)
                    continue

                body = response.text.strip()
                if len(body) > 300:
                    body = body[:300] + "... (truncated)"
                return {
                    "ok": False,
                    "rows": len(batch),
                    "batch_id": batch_id,
                    "status_code": response.status_code,
                    "latency_s": latency,
                    "attempts": attempt + 1,
                    "fatal_auth": False,
                    "error": f"HTTP {response.status_code}: {body}",
                }
            except requests.exceptions.RequestException as exc:
                latency = time.perf_counter() - started
                if attempt < max_retries:
                    sleep_s = retry_backoff * (2 ** attempt)
                    time.sleep(sleep_s)
                    continue
                return {
                    "ok": False,
                    "rows": len(batch),
                    "batch_id": batch_id,
                    "status_code": None,
                    "latency_s": latency,
                    "attempts": attempt + 1,
                    "fatal_auth": False,
                    "error": str(exc),
                }

        return {
            "ok": False,
            "rows": len(batch),
            "batch_id": batch_id,
            "status_code": None,
            "latency_s": 0.0,
            "attempts": max_retries + 1,
            "fatal_auth": False,
            "error": "Unknown failure",
        }

    def import_barcodes(
        self,
        batch_size: int = 100,
        workers: int = 4,
        max_inflight_batches: int = 16,
        request_timeout: float = 60.0,
        max_retries: int = 3,
        retry_backoff: float = 0.5,
        max_error_examples: int = 10,
    ):
        print(f"🚀 Starting OpenFoodFacts import from {self.csv_file_path}")
        print(f"📡 Target API: {self.api_base_url}/food-barcodes/bulk")
        print(
            "⚙️ Settings:"
            f" batch_size={batch_size}, workers={workers}, max_inflight={max_inflight_batches},"
            f" timeout={request_timeout}s, retries={max_retries}"
        )

        print("📥 Reading header to determine available columns...")
        header = pd.read_csv(self.csv_file_path, sep="\t", nrows=0)
        available_columns = set(header.columns)
        desired_columns = {
            "code",
            "product_name",
            "generic_name",
            "brands",
            "categories_en",
            "energy-kcal_100g",
            "energy-kj_100g",
            "energy_100g",
            "fat_100g",
            "saturated-fat_100g",
            "trans-fat_100g",
            "cholesterol_100g",
            "carbohydrates_100g",
            "sugars_100g",
            "added-sugars_100g",
            "fiber_100g",
            "soluble-fiber_100g",
            "insoluble-fiber_100g",
            "proteins_100g",
            "salt_100g",
            "sodium_100g",
            "omega-3-fat_100g",
            "omega-6-fat_100g",
            "monounsaturated-fat_100g",
            "polyunsaturated-fat_100g",
            "alpha-linolenic-acid_100g",
            "eicosapentaenoic-acid_100g",
            "docosahexaenoic-acid_100g",
            "water_100g",
            "calcium_100g",
            "iron_100g",
            "potassium_100g",
            "magnesium_100g",
            "phosphorus_100g",
            "zinc_100g",
            "copper_100g",
            "manganese_100g",
            "selenium_100g",
            "fluoride_100g",
            "molybdenum_100g",
            "chloride_100g",
            "vitamin-a_100g",
            "vitamin-b1_100g",
            "vitamin-b2_100g",
            "vitamin-pp_100g",
            "vitamin-b6_100g",
            "vitamin-b9_100g",
            "folates_100g",
            "vitamin-b12_100g",
            "vitamin-c_100g",
            "vitamin-d_100g",
            "vitamin-e_100g",
            "vitamin-k_100g",
            "beta-carotene_100g",
            "betaine_100g",
            "choline_100g",
        }

        usecols = sorted(desired_columns.intersection(available_columns))
        if "code" not in usecols:
            raise ValueError("CSV is missing required 'code' column.")
        print(f"✅ Using {len(usecols)} columns from CSV.")

        batch: List[Dict] = []
        processed_rows = 0
        posted_batches = 0
        next_batch_id = 1
        auth_failed = False
        total_latency_s = 0.0
        started_at = time.perf_counter()

        rows_progress = tqdm(
            total=None,
            unit="rows",
            desc="Rows scanned",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
            position=0,
        )
        batches_progress = tqdm(
            total=None,
            unit="batch",
            desc="Requests completed",
            leave=True,
            dynamic_ncols=True,
            file=sys.stdout,
            disable=False,
            position=1,
        )
        print("🧭 Progress bars initialized.")

        executor = cf.ThreadPoolExecutor(max_workers=workers)
        futures: Dict[cf.Future, Tuple[int, int]] = {}

        def update_postfix() -> None:
            elapsed = max(time.perf_counter() - started_at, 0.0001)
            batches_done = self.batch_success_count + self.batch_fail_count
            batches_per_s = batches_done / elapsed
            rows_per_s = self.success_count / elapsed
            batches_progress.set_postfix(
                {
                    "ok_rows": self.success_count,
                    "failed_rows": self.error_count,
                    "skipped_rows": self.skipped_count,
                    "inflight": len(futures),
                    "batch/s": f"{batches_per_s:.2f}",
                    "ok_rows/s": f"{rows_per_s:.1f}",
                },
                refresh=False,
            )

        def apply_result(result: Dict) -> None:
            nonlocal auth_failed, total_latency_s
            rows = result["rows"]
            total_latency_s += result["latency_s"]
            batches_progress.update(1)

            if result["ok"]:
                self.success_count += rows
                self.batch_success_count += 1
                tqdm.write(
                    f"OK    batch={result['batch_id']} rows={rows} "
                    f"status={result['status_code']} attempts={result['attempts']} "
                    f"latency={result['latency_s']:.2f}s"
                )
            else:
                self.error_count += rows
                self.batch_fail_count += 1
                if len(self.errors) < max_error_examples:
                    self.errors.append(
                        f"batch={result['batch_id']} rows={rows} "
                        f"status={result['status_code']} attempts={result['attempts']} "
                        f"error={result['error']}"
                    )
                tqdm.write(
                    f"FAIL  batch={result['batch_id']} rows={rows} "
                    f"status={result['status_code']} attempts={result['attempts']} "
                    f"error={result['error']}"
                )
                if result["fatal_auth"]:
                    auth_failed = True

            update_postfix()

        def drain_completed(block_until_one: bool) -> None:
            if not futures:
                return
            pending = list(futures.keys())
            timeout = None if block_until_one else 0
            return_when = cf.FIRST_COMPLETED if block_until_one else cf.ALL_COMPLETED
            done, _ = cf.wait(pending, timeout=timeout, return_when=return_when)
            for future in done:
                batch_id, rows = futures.pop(future)
                try:
                    result = future.result()
                except Exception as exc:
                    result = {
                        "ok": False,
                        "rows": rows,
                        "batch_id": batch_id,
                        "status_code": None,
                        "latency_s": 0.0,
                        "attempts": 1,
                        "fatal_auth": False,
                        "error": f"Unexpected worker error: {exc}",
                    }
                apply_result(result)

        def submit_batch(batch_items: List[Dict]) -> None:
            nonlocal posted_batches, next_batch_id
            if not batch_items:
                return
            batch_id = next_batch_id
            next_batch_id += 1
            posted_batches += 1
            self.submitted_count += len(batch_items)
            future = executor.submit(
                self._post_batch,
                batch_items,
                batch_id,
                request_timeout,
                max_retries,
                retry_backoff,
            )
            futures[future] = (batch_id, len(batch_items))
            update_postfix()

        try:
            for chunk in pd.read_csv(
                self.csv_file_path,
                sep="\t",
                usecols=usecols,
                chunksize=5000,
                dtype={"code": str},
                low_memory=False,
            ):
                for row in chunk.to_dict(orient="records"):
                    if auth_failed:
                        break

                    processed_rows += 1
                    payload = self._row_to_payload(row)
                    if payload is None:
                        self.skipped_count += 1
                        rows_progress.update(1)
                        continue

                    batch.append(payload)
                    rows_progress.update(1)

                    if len(batch) >= batch_size:
                        submit_batch(batch)
                        batch = []
                        while len(futures) >= max_inflight_batches:
                            drain_completed(block_until_one=True)
                            if auth_failed:
                                break

                    if futures and processed_rows % 250 == 0:
                        drain_completed(block_until_one=False)

                if auth_failed:
                    break

                if futures:
                    drain_completed(block_until_one=False)

            if not auth_failed and batch:
                submit_batch(batch)
                batch = []

            while futures:
                drain_completed(block_until_one=True)
        finally:
            for future in futures:
                future.cancel()
            executor.shutdown(wait=True, cancel_futures=True)
            rows_progress.close()
            batches_progress.close()

        elapsed_s = max(time.perf_counter() - started_at, 0.0001)
        avg_latency_s = total_latency_s / max(self.batch_success_count + self.batch_fail_count, 1)
        print(f"📦 Batches posted: {posted_batches}")
        print(f"🧾 Rows processed: {processed_rows}")
        print(f"⏭️ Rows skipped (missing barcode/name): {self.skipped_count}")
        print(f"📤 Rows submitted: {self.submitted_count}")
        print(f"✅ Successful rows sent: {self.success_count}")
        print(f"❌ Failed rows sent: {self.error_count}")
        print(f"✅ Successful requests: {self.batch_success_count}")
        print(f"❌ Failed requests: {self.batch_fail_count}")
        print(f"⏱️ Avg request latency: {avg_latency_s:.2f}s")
        print(f"🚄 Throughput: {self.success_count / elapsed_s:.1f} successful rows/sec")

        if auth_failed:
            print("🚫 Import aborted due to unauthorized response (401/403).")

        print("\n" + "=" * 50)
        print("📊 IMPORT SUMMARY")
        print("=" * 50)
        if self.errors:
            print(f"🚨 First {len(self.errors)} errors: {self.errors}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Import OpenFoodFacts barcodes into FoodTracker backend.")
    parser.add_argument(
        "--csv-file",
        default="/home/telesto/en.openfoodfacts.org.products.csv",
        help="Path to OpenFoodFacts TSV file.",
    )
    parser.add_argument(
        "--api-base-url",
        default="http://localhost:3001",
        help="Backend API base URL.",
    )
    parser.add_argument(
        "--auth-token",
        default=None,
        help="Bearer token for authenticated backend calls.",
    )
    parser.add_argument("--batch-size", type=int, default=100, help="Rows per API request.")
    parser.add_argument("--workers", type=int, default=4, help="Concurrent request workers.")
    parser.add_argument(
        "--max-inflight-batches",
        type=int,
        default=16,
        help="Maximum queued/in-flight batches before pausing producer.",
    )
    parser.add_argument(
        "--request-timeout",
        type=float,
        default=60.0,
        help="HTTP timeout per request in seconds.",
    )
    parser.add_argument(
        "--max-retries",
        type=int,
        default=3,
        help="Retries for transient network/server failures.",
    )
    parser.add_argument(
        "--retry-backoff",
        type=float,
        default=0.5,
        help="Base backoff seconds for retries (exponential).",
    )
    parser.add_argument(
        "--max-error-examples",
        type=int,
        default=10,
        help="Maximum number of detailed errors to keep in summary.",
    )
    args = parser.parse_args()

    importer = OpenFoodFactsImporter(args.csv_file, args.api_base_url, args.auth_token)
    importer.import_barcodes(
        batch_size=args.batch_size,
        workers=args.workers,
        max_inflight_batches=args.max_inflight_batches,
        request_timeout=args.request_timeout,
        max_retries=args.max_retries,
        retry_backoff=args.retry_backoff,
        max_error_examples=args.max_error_examples,
    )
