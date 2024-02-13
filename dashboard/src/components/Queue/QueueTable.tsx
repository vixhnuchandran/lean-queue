import { API_BASE_URL as API } from "../../constants"
import axios from "axios"
import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { GridSearchIcon } from "@mui/x-data-grid"

type TaskObjectType = {
  execution_time: string
  taskId: number
  task_id: number
  params: { num1: number | null; num2: number | null }
  priority: number
  status: "available" | "processing" | "completed" | "error"
  result: { result: string | number | null }
  start_time: string | null
  end_time: string | null
  expiry_time: string | null
}
type Queue = {
  queue_id: string
  tags: []
  options: { callback: string; expiryTime: string }
  created_at: string
  updated_at: string
  notes: string
  tasks: TaskObjectType[]
  total_tasks: number | string
  completed_tasks: number | string
  error_tasks: string
  processing_tasks: string
}

const initialQueue: Queue = {
  queue_id: "",
  tags: [],
  options: { callback: "", expiryTime: "" },
  created_at: "",
  updated_at: "",
  notes: "",
  tasks: [],
  total_tasks: "",
  completed_tasks: "",
  error_tasks: "",
  processing_tasks: "",
}

function classNames(...classes: (string | number | boolean)[]): string {
  return classes.filter(Boolean).join(" ")
}

export default function QueueTable() {
  const [queue, setQueue] = useState(initialQueue)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { pathname } = location
  const [searchTerm, setSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<string>("asc")

  function extractQueueId(url: string) {
    const match = url.match(/\/queues\/(\d+)/)
    return match ? parseInt(match[1], 10) : null
  }

  const handleSortClick = (sortByField: string) => {
    const newSortOrder =
      sortByField === sortBy && sortOrder === "asc" ? "desc" : "asc"

    setSortBy(sortByField)
    setSortOrder(newSortOrder)

    const queryParams = new URLSearchParams(location.search)
    queryParams.set("sortBy", sortByField)
    queryParams.set("sortOrder", newSortOrder)

    navigate({
      search: `?${queryParams.toString()}`,
    })

    fetchQueuesData(searchTerm, sortByField)
  }

  const handleSearchClick = async () => {
    const encodedSearchTerm = encodeURIComponent(searchTerm.trim())

    const queryParams = new URLSearchParams(location.search)
    queryParams.set("search", encodedSearchTerm)

    const newSearch = `&${queryParams.toString()}`

    navigate({
      search: newSearch,
    })

    await fetchQueuesData(encodedSearchTerm)
  }

  const handleRowClick = (taskId: number, event: React.MouseEvent) => {
    const isActionClick =
      (event.target as HTMLElement).closest(".action-column") !== null

    if (!isActionClick) {
      navigate(`task/${taskId}`)
    }
  }

  const handleStatusFilterChange = (selectedValue: string | null) => {
    setSelectedStatus(selectedValue)

    const searchParams = new URLSearchParams(location.search)
    if (selectedValue) {
      searchParams.set("status", selectedValue)
    } else {
      searchParams.delete("status")
    }

    navigate({ search: `?${searchParams.toString()}` })

    fetchQueuesData(searchTerm)
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-400"
      case "error":
        return "text-red-400"
      case "available":
        return "text-sky-400"
      case "processing":
        return "text-orange-400"
      default:
        return ""
    }
  }

  const fetchQueuesData = async (
    searchParam?: string,
    selectedStatus?: string
  ) => {
    const queue = extractQueueId(pathname)
    try {
      let apiUrl = `${API}/get-queue-details/${queue}`

      const queryParams = new URLSearchParams()

      if (searchParam) {
        queryParams.set("search", encodeURIComponent(searchParam))
      }

      if (selectedStatus) {
        queryParams.set("status", encodeURIComponent(selectedStatus))
      }

      apiUrl += `?${queryParams.toString()}`

      const response = await axios.get(apiUrl)
      const result = await response.data
      setQueue(result)
    } catch (err) {
      console.error("Error fetching data:", err)
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy === field) {
      return sortOrder === "asc" ? "↑" : "↓"
    }
    return null
  }

  useEffect(() => {
    const getUrlParams = () => {
      const params = new URLSearchParams(location.search)
      const searchParam = params.get("search") || ""
      const selectedStatus = params.get("status") || ""

      return {
        searchParam,
        selectedStatus,
      }
    }

    const handleInitialParams = async () => {
      const { searchParam, selectedStatus } = getUrlParams()

      setSearchTerm(searchParam)
      setSelectedStatus(selectedStatus)
      await fetchQueuesData(searchParam, selectedStatus)
    }

    handleInitialParams()
  }, [location.search, selectedStatus])

  return (
    <div className="px-4 sm:px-6 lg:px-8 mt-12">
      <div className="sm:flex sm:items-center ">
        <div className="sm:flex-auto flex   justify-between">
          <div className="flex  justify-start space-x-2">
            <input
              type="text"
              className="h-8 text-black text-base font-mono rounded-2xl pl-3"
              placeholder="Search by ID..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSearchClick}
              className="h-8 block  rounded-full bg-indigo-600  p-1 px-auto py-auto text-center text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <GridSearchIcon />
            </button>
          </div>
          <div className=" flex flex-end space-x-2">
            <div className="relative inline-block text-left">
              <select
                className="h-8 pl-2 pr-3 bg-white border border-gray-300 rounded-2xl text-gray-700 font-mono"
                onChange={e => handleStatusFilterChange(e.target.value)}
                value={selectedStatus || ""}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="error">Error</option>
                <option value="processing">Processing</option>
                <option value="available">Available</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-4 mt-4 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg overflow-y-auto max-h-[700px]">
        <table className="min-w-full divide-y divide-gray-300  ">
          <thead>
            <tr>
              <th
                onClick={() => handleSortClick("id")}
                scope="col"
                className="py-3.5 pl-4 pr-3 text-center text-base font-semibold  text-white sm:pl-6"
              >
                Task ID {getSortIcon("task_id")}
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Status
              </th>
              <th
                scope="col"
                className="hidden px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Execution Time
              </th>
            </tr>
          </thead>
          <tbody>
            {queue.tasks &&
              queue.tasks.map((each, index) => (
                <tr
                  key={each.taskId}
                  onClick={event => handleRowClick(each.task_id, event)}
                  className="cursor-pointer text-center hover:bg-gray-400 transition-all"
                >
                  <td
                    className={classNames(
                      index === 0 ? "" : " ransparent",
                      "relative py-4 pl-4 pr-3 text-base sm:pl-6 "
                    )}
                  >
                    <div className="font-medium text-white">{each.task_id}</div>
                  </td>
                  <td
                    className={classNames(
                      index === 0 ? "" : "transparent",
                      "relative py-4 pl-4 pr-3 text-base sm:pl-6"
                    )}
                  >
                    <div
                      className={`font-medium  ${getStatusClass(each.status)}`}
                    >
                      {each.status}
                    </div>
                  </td>

                  <td
                    className={classNames(
                      index === 0 ? "" : " border-gray-200",
                      "hidden px-3 py-3.5 text-base text-white lg:table-cell "
                    )}
                  >
                    <div className=" text-white">
                      {each.execution_time ?? "N/A"}
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
