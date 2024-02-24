import requests
from bs4 import BeautifulSoup
import argparse
import time
import logging
import sys
from utils import *


root = "http://127.0.0.1:8484/"
# root = "https://lean-queue.vercel.app"
state_file = "worker_state.json"


def google_search(term):
    url = f"https://www.google.com/search?q={term}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3"
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        titles = [result.text for result in soup.select('h3')]
        return titles[:5]
    else:
        print(f"Failed to retrieve search results for '{term}'")
        return []


def to_uppercase(titles):
    uppercase_titles = list(map(lambda x: x.upper(), titles))
    return uppercase_titles


def run_worker(worker_type):
    try:
        if worker_type == "case":
            while True:
                try:
                    response = get_next_task(
                        "type", "case")

                    if response:
                        task_id = response["id"]
                        titles = response["params"]["data"]

                        logging.info(titles)

                        time.sleep(0)
                        result = to_uppercase(titles)

                        response = send_results(task_id, result, None)

                    else:
                        logging.warning("No task received from the server")
                        time.sleep(5)

                except Exception as error:
                    logging.error("Error in run_worker:", error)
                    sys.exit(1)

        elif worker_type == "title":
            while True:
                try:
                    response = get_next_task(
                        "type", "title")

                    if response:
                        task_id = response["id"]
                        search_term = response["params"]["data"]

                        logging.info(search_term)

                        time.sleep(0)
                        result = google_search(search_term)

                        logging.info(result)

                        response = send_results(task_id, result, None)

                    else:
                        logging.warning("No task received from the server")
                        time.sleep(5)

                except Exception as error:
                    logging.error("Error in run_worker:", error)
                    sys.exit(1)

        elif worker_type == "titlecase":
            while True:
                try:
                    response = get_next_task("type", "titlecase")

                    if response:
                        title_data = response["params"]["data"]
                        main_task_id = response["id"]

                        queue_id = create_queue(title_data, "title", tags=[
                            "title", "dev," "localdb"])

                        result = get_queue_result(queue_id)

                        if result:
                            print('Result: ', result)

                            for value in result.values():
                                if 'result' in value:
                                    case_data = value['result']
                                    break

                            if case_data:
                                queue_id = create_queue(case_data, "case", tags=[
                                    "case", "dev," "localdb"])

                                result = get_queue_result(queue_id)

                                if result:
                                    for value in result.values():
                                        if 'result' in value:
                                            final_result = value['result']
                                            break

                                    send_results(
                                        main_task_id, final_result, None)
                                else:
                                    logging.error(
                                        "Empty result received for case queue.")
                            else:
                                logging.error(
                                    "Empty result received for case queue.")
                        else:
                            logging.error(
                                "Empty result received for title queue.")
                    else:
                        logging.warning("No task received from the server")
                        time.sleep(5)

                except Exception as error:
                    logging.error("Error in run_worker:", error)
                    sys.exit(1)

    except KeyboardInterrupt:
        print("Execution interrupted.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Run specific worker.')
    parser.add_argument('--title', action='store_true',
                        help='Run title worker.')
    parser.add_argument('--case', action='store_true', help='Run case worker.')
    parser.add_argument('--titlecase', action='store_true',
                        help='Run titlecase worker.')

    args = parser.parse_args()

    if args.title:
        run_worker("title")
    elif args.case:
        run_worker("case")
    elif args.titlecase:
        run_worker("titlecase")
    else:
        logging.error("No worker specified.")
        sys.exit(1)
