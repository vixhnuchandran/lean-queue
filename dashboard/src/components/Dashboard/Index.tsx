import ChartBox from "./TasksStats"
import "../../styles/Dashboard.css"
import RecentQueues from "./RecentQueues"
import { ClockIcon } from "@heroicons/react/24/solid"

import { useEffect, useState } from "react"
import axios from "axios"
import { API_BASE_URL as API } from "../../constants"
import {
  BarsArrowDownIcon,
  CheckCircleIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
} from "@heroicons/react/24/outline"

interface TasksStats {
  totalTasks: number
  addedTasks: number
  pendingTasks: number
  completedTasks: number
  successTasks: number
  errorTasks: number
}

export default function Main() {
  const [tasksStats, setTasksStats] = useState<TasksStats>()
  const [selectedOption, setSelectedOption] = useState<string>("1 hour")

  const handleDropdownChange = (newOption: string) => {
    setSelectedOption(newOption)
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiURL = `${API}/tasks-stats?timeInterval=${selectedOption}`
        const response = await axios.get(apiURL)
        setTasksStats(response.data)
      } catch (error) {
        console.error(`Error fetching data: ${error}`)
      }
    }

    fetchData()
  }, [selectedOption])

  return (
    <div className="dashboard">
      {tasksStats && (
        <>
          <div className="box box1 bg-gray-800">
            <RecentQueues />
          </div>

          <div className="box box2 space-y-3   ">
            <div className="dropdown flex justify-end h-10 ">
              <select
                className="px-2 bg-gray-800 opacity-50 hover:bg-gray-600 "
                onChange={e => handleDropdownChange(e.target.value)}
              >
                <option value="1 hour"> 1 hour</option>
                <option value="1 day"> 24 hours</option>
                <option value="1 week"> 7 days</option>
                <option value="1 month"> 1 month</option>
                <option value=""> All time</option>
              </select>
            </div>

            <div className="box innerbox2 bg-gray-800">
              <ChartBox
                title="Pending Tasks"
                Icon={ClockIcon}
                value={tasksStats?.pendingTasks}
                color="text-orange-400"
                bgColor="bg-orange-400"
                percentage={(
                  (tasksStats?.pendingTasks / tasksStats?.totalTasks) * 100 || 0
                ).toFixed(0)}
              />
            </div>

            <div className="box innerbox3 bg-gray-800">
              <ChartBox
                title="Added Tasks"
                Icon={BarsArrowDownIcon}
                value={tasksStats?.addedTasks}
                color="text-sky-400"
                bgColor="bg-sky-400"
                percentage={(
                  (tasksStats?.addedTasks / tasksStats?.totalTasks) * 100 || 0
                ).toFixed(0)}
                onDropdownChange={selectedOption =>
                  handleDropdownChange(selectedOption)
                }
              />
            </div>

            <div className="box innerbox4 bg-gray-800">
              <ChartBox
                title="Completed Tasks"
                Icon={CheckCircleIcon}
                value={tasksStats?.completedTasks}
                color="text-indigo-400"
                bgColor="bg-indigo-400"
                percentage={(
                  (tasksStats?.completedTasks / tasksStats?.totalTasks) * 100 ||
                  0
                ).toFixed(0)}
                onDropdownChange={selectedOption =>
                  handleDropdownChange(selectedOption)
                }
              />
            </div>

            <div className="box innerbox5 bg-gray-800">
              <ChartBox
                title="Success Tasks"
                Icon={ShieldCheckIcon}
                value={tasksStats?.successTasks}
                color="text-green-400"
                bgColor="bg-green-400"
                percentage={(
                  (tasksStats?.successTasks / tasksStats?.completedTasks) *
                    100 || 0
                ).toFixed(2)}
                onDropdownChange={selectedOption =>
                  handleDropdownChange(selectedOption)
                }
              />
            </div>

            <div className="box innerbox6 bg-gray-800">
              <ChartBox
                title="Error Tasks"
                Icon={ShieldExclamationIcon}
                value={tasksStats?.errorTasks}
                color="text-red-400"
                bgColor="bg-red-400"
                percentage={(
                  (tasksStats?.errorTasks / tasksStats?.completedTasks) * 100 ||
                  0
                ).toFixed(2)}
                onDropdownChange={selectedOption =>
                  handleDropdownChange(selectedOption)
                }
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
