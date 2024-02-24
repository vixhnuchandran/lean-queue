import time
import json
import requests
import random
import argparse
import logging
import sys


logging.basicConfig(level=logging.INFO)
root = "http://127.0.0.1:8484"
# root = "https://lean-queue.vercel.app"


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

