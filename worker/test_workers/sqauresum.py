import argparse
import time
import json
import requests
import random
import sys
import logging
from utils import *

root = "http://127.0.0.1:8484"
# root = "https://lean-queue.vercel.app"
state_file = "worker_state.json"

logging.basicConfig(level=logging.INFO)


def calculate_square(tasks):
    squared_tasks = list(map(lambda x: x ** 2, tasks))
    return squared_tasks


def calculate_sum(tasks):
    summed_tasks = sum(tasks)
    return summed_tasks


def run_worker(worker_type):
    if worker_type == "sum":
        while True:
            try:
                response = get_next_task(
                    "type", "sum")

                if response:
                    task_id = response["id"]
                    data = response["params"]["data"]

                    logging.info(data)

                    time.sleep(0)
                    result = calculate_sum(data)

                    response = send_results(task_id, result, None)

                else:
                    logging.warning("No task received from the server")
                    time.sleep(5)

            except Exception as error:
                logging.error("Error in run_worker:", error)
                sys.exit(1)

    elif worker_type == "square":
        while True:
            try:
                response = get_next_task(
                    "type", "square")

                if response:
                    task_id = response["id"]
                    data = response["params"]["data"]

                    logging.info(data)

                    time.sleep(0)
                    result = calculate_square(data)

                    logging.info(result)

                    response = send_results(task_id, result, None)

                else:
                    logging.warning("No task received from the server")
                    time.sleep(5)

            except Exception as error:
                logging.error("Error in run_worker:", error)
                sys.exit(1)

    elif worker_type == "squaresum":
        while True:
            try:

                response = get_next_task("type", "squaresum")

                if response:
                    square_data = response["params"]["data"]
                    main_task_id = response["id"]

                    queue_id = create_queue(square_data, "square", tags=[
                        "square", "dev," "localdb"])

                    result = get_queue_result(queue_id)

                    for value in result.values():
                        if 'result' in value:
                            sum_data = value['result']
                            break

                    queue_id = create_queue(sum_data, "sum", tags=[
                        "sum", "dev," "localdb"])

                    result = get_queue_result(queue_id)

                    for value in result.values():
                        if 'result' in value:
                            final_result = value['result']
                            break

                    send_results(main_task_id, final_result, None)

                else:
                    logging.warning("No task received from the server")
                    time.sleep(5)

            except Exception as error:
                logging.error("Error in run_worker:", error)
                sys.exit(1)

    else:
        logging.error("Invalid worker type specified.")
        sys.exit(1)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run specific worker.')
    parser.add_argument('--sum', action='store_true', help='Run sum worker.')
    parser.add_argument('--square', action='store_true',
                        help='Run square worker.')
    parser.add_argument('--squaresum', action='store_true',
                        help='Run squaresum worker.')

    args = parser.parse_args()

    if args.sum:
        run_worker("sum")
    elif args.square:
        run_worker("square")
    elif args.squaresum:
        run_worker("squaresum")
    else:
        logging.error("No worker specified.")
        sys.exit(1)
