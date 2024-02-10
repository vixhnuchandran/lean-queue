import time
import json
import requests
import random
import argparse
import logging
import sys

logging.basicConfig(level=logging.INFO)
root = "http://127.0.0.1:8484"


def check_queue(field, value):
    try:
        request_body = {field: value}

        response = requests.post(
            root + "/check-queue",
            json=request_body,
        )
        if response:
            data = response.json()
            if response.status_code == 200:
                return data["id"]

            elif response.status_code == 404:
                return 0
        return 0

    except Exception as error:
        logging.error("Error while checking queue:", error)
        return 0


def get_next_task(using, value):
    for _ in range(3):
        try:
            request_body = {
                using: value
            }

            response = requests.post(
                root + "/next-available-task", json=request_body)

            if not response.content:
                logging.error("Empty response received. Retrying...")
                continue

            data = response.json()

            return data

        except requests.Timeout:
            logging.error("Timeout occurred. Retrying...")
            time.sleep(1)

        except Exception as error:
            logging.error(f"Error: {error}. Retrying...")

    return None


def create_queue(tasks, queue_type, tags=None, options=None, notes=None):
    queue_json = {
        "type": queue_type,
        "tasks": [],
        "tags": tags if tags else ["dev", "localdb"],
        "options": options if options else {
            "expiryTime": 150000,
            "callback": "https://someurl.com",
            "retries": 3
        },
        "notes": notes if notes else f"main queue for {queue_type}"
    }

    for index, _ in enumerate([tasks], start=2001):
        task_json = {
            "taskId": str(index),
            "params": {"data": tasks},
            "priority": random.randint(1, 10)
        }
        queue_json["tasks"].append(task_json)

    try:

        response = requests.post(root + "/create-queue", json=queue_json)
        data = response.json()
        queue_id = data["queue"]
        print(
            f"{queue_type}-queue created successfully with id {queue_id} ", file=sys.stdout)
        return queue_id
    except requests.exceptions.RequestException as e:
        print(f"Error creating queue: {e}", file=sys.stderr)
        sys.exit(1)


def add_tasks(tasks, queue_id):
    tasks_json = {
        "queue": queue_id,
        "tasks": [],
    }

    for index, _ in enumerate([tasks], start=2001):
        tasks = {
            "taskId": str(index),
            "params": {"data": tasks},
            "priority": random.randint(1, 10)
        }
        tasks_json["tasks"].append(tasks)

    try:
        response = requests.post(root + "/create-queue", json=tasks_json)
        data = response.json()
        print(
            f"task added successfully in queue with id {queue_id} ", file=sys.stdout)

    except requests.exceptions.RequestException as e:
        print(f"Error creating queue: {e}", file=sys.stderr)
        sys.exit(1)


def send_results(task_id, result, error):
    try:
        request_body = {"id": task_id, "result": result, "error": error}

        response = requests.post(
            root + "/submit-results",
            json=request_body,
        )

        if response.status_code == 200:
            logging.info('Result submitted successfully\n')
        else:
            logging.error(
                f'Failed to submit result. Status code: {response.status_code}')

        return response

    except Exception as error:
        logging.error("Error while sending result:", error)


def get_queue_result(queue_id,):
    response = requests.get(f"{root}/completed-results/{queue_id}")
    return response.json()
