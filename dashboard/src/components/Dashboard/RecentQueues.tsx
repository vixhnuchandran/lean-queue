import { useEffect, useState } from "react"
import axios from "axios"
import { API_BASE_URL as API } from "../../constants"
import { calculateTimeDifference } from "../../utils/timeUtils"

interface RecentQueue {
  id?: string | number
  type?: string | number
  completedTasks?: string | number
  pendingTasks?: string | number
  updatedAt?: string | number
  avgExecTime?: string | number
  EstCompTime?: string | number
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}
const handleRowClick = (
  queueId: number | string | undefined,
  event: React.MouseEvent
) => {
  const isActionClick =
    (event.target as HTMLElement).closest(".action-column") !== null

  if (!isActionClick) {
    window.location.href = `/queues/${queueId}`
  }
}
function RecentQueues() {
  const [recentQueues, setRecentQueues] = useState<RecentQueue[]>([])

  useEffect(() => {
    const apiURL = `${API}/recent-queues`

    axios
      .get(apiURL)
      .then(response => {
        setRecentQueues(response.data)
      })
      .catch(error => {
        console.error(`Error fetching data: ${error}`)
      })
  }, [])

  return (
    <div className="px-4 sm:px-6 lg:px-8 ">
      <h1 className="text-3xl text-left mb-3 font-bold text-gray-300">
        Recent Queues
      </h1>

      <div className="-mx-4 mt-4  ring-gray-300 sm:mx-0 sm:rounded-lg overflow-y-auto max-h-[700px]">
        <table className="min-w-full divide-y divide-gray-300  ">
          <thead>
            <tr>
              <th
                scope="col"
                className=" cursor-pointer   py-3.5 pl-4 pr-3 text-center text-base font-semibold  text-white sm:pl-6"
              >
                ID
              </th>
              <th
                scope="col"
                className="  cursor-pointer  px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Type
              </th>

              <th
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Pending Tasks
              </th>
              <th
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Average Execution Time
              </th>
              <th
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Estimated Completion Time
              </th>
            </tr>
          </thead>
          <tbody>
            {recentQueues.map((queue, index) => (
              <tr
                key={queue.id}
                onClick={event => handleRowClick(queue.id, event)}
                className="cursor-pointer text-center hover:bg-gray-500 transition-all"
              >
                <td
                  className={classNames(
                    index === 0 ? "" : " ransparent",
                    "relative py-4 pl-4 pr-3 text-base sm:pl-6 "
                  )}
                >
                  <div className="font-medium text-white">{queue.id}</div>
                </td>
                <td
                  className={classNames(
                    index === 0 ? "" : " border-gray-200",
                    " px-3 py-3.5 text-base text-white lg:table-cell "
                  )}
                >
                  <div className=" text-white">{queue.type}</div>
                </td>

                <td
                  className={classNames(
                    index === 0 ? "" : " border-gray-200",
                    " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                  )}
                >
                  <div className=" text-white">{queue.pendingTasks}</div>
                </td>

                <td
                  className={classNames(
                    index === 0 ? "" : " border-gray-200",
                    " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                  )}
                >
                  <div className=" text-white">
                    {queue.avgExecTime ?? "N/A"}
                  </div>
                </td>
                <td
                  className={classNames(
                    index === 0 ? "" : " border-gray-200",
                    " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                  )}
                >
                  <div className=" text-white">
                    {queue.EstCompTime ?? "N/A"}
                  </div>
                </td>
                <td
                  className={classNames(
                    index === 0 ? "" : " border-gray-200",
                    " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                  )}
                >
                  <div className=" text-white">
                    <time
                      dateTime={calculateTimeDifference(queue.updatedAt)}
                      className="flex-none text-[11px] text-gray-500 text-left "
                    >
                      {calculateTimeDifference(queue.updatedAt) === "00 min"
                        ? "now"
                        : calculateTimeDifference(queue.updatedAt) + " ago"}
                    </time>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default RecentQueues
