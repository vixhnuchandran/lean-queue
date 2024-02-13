import React, { useEffect, useRef, useState } from "react"
import ReactPaginate from "react-paginate"
import {
  ArrowDownTrayIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { API_BASE_URL as API } from "../../constants"
import { useLocation, useNavigate } from "react-router-dom"

type Queue = {
  id: number
  type: string
  tags: string[]
  pageCount: number
  createdAt: Date
  updatedAt: Date
  totalTasks: number
}

const initialQueues: Queue = {
  id: 0,
  type: "",
  tags: [],
  pageCount: 0,
  createdAt: new Date(),
  updatedAt: new Date(),
  totalTasks: 0,
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ")
}

export default function QueuesTable() {
  const [queues, setQueues] = useState<Queue[]>([initialQueues])
  const linkRef = useRef<HTMLAnchorElement | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>()
  const navigate = useNavigate()
  const location = useLocation()
  const [, setLoading] = useState(false)
  const [sortBy, setSortBy] = useState<string>("")
  const [sortOrder, setSortOrder] = useState<string>("asc")
  const [pageCount, setPageCount] = useState<number>(0)
  const [itemOffset, setItemOffset] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(0)
  // const [selectedRows, setSelectedRows] = useState<number[]>([])

  const itemsPerPage = 8

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

    fetchQueuesData(searchTerm, sortByField, newSortOrder)
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

  const handleRowClick = (queueId: number, event: React.MouseEvent) => {
    const isActionClick =
      (event.target as HTMLElement).closest(".action-column") !== null

    if (!isActionClick) {
      window.location.href = `/queues/${queueId}`
    }
  }

  const handleTagClick = async (tag: string) => {
    setSelectedTag(tag)

    const encodedTagTerm = encodeURIComponent(tag.trim())

    const queryParams = new URLSearchParams(location.search)
    queryParams.set("tag", encodedTagTerm)

    const newTag = `&${queryParams.toString()}`

    navigate({
      search: newTag,
    })

    // Remove the search term from the query parameters
    queryParams.delete("search")

    navigate({
      search: `?${queryParams.toString()}`,
    })
  }

  const handleDeleteQueue = async (queueId: number) => {
    const confirmation = window.confirm(
      "Are you sure you want to delete this queue?"
    )

    if (confirmation) {
      try {
        setLoading(true)

        const response = await fetch(
          `http://127.0.0.1:8484/delete-queue/${queueId}`,
          {
            method: "POST",
          }
        )

        if (response.ok) {
          console.log("Queue deleted successfully!")
        } else {
          console.error("Error deleting queue:", response.statusText)
        }
      } catch (err) {
        console.error("Error deleting queue:", err)
      } finally {
        setLoading(false)
        window.location.reload()
      }
    }
  }

  const handleExportResult = async (queueId: number) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8484/get-results/${queueId}`,
        { method: "POST" }
      )

      if (response.ok) {
        const jsonData = await response.json()
        const blob = new Blob([JSON.stringify(jsonData)], {
          type: "application/json",
        })

        const link = linkRef.current

        if (link) {
          link.href = URL.createObjectURL(blob)
          link.download = `queue_${queueId}_result.json`

          link.click()
        }
      } else {
        console.error("Error exporting result:", response.statusText)
      }
    } catch (err) {
      console.error("Error exporting result:", err)
    }
  }

  const getSortIcon = (field: string) => {
    if (sortBy === field) {
      return sortOrder === "asc" ? "↑" : "↓"
    }
    return null
  }

  const getUrlParams = () => {
    const params = new URLSearchParams(location.search)
    const tagParam = params.get("tag") || ""
    const searchParam = params.get("search") || ""
    const sortByParam = params.get("sortBy") || ""
    const sortOrderParam = params.get("sortOrder") || ""
    return { searchParam, sortByParam, sortOrderParam, tagParam }
  }

  const handlePageClick = (selected: { selected: number }) => {
    const newOffset = selected.selected * itemsPerPage
    setItemOffset(newOffset)
    setCurrentPage(selected.selected)
    const { searchParam, sortByParam, sortOrderParam, tagParam } =
      getUrlParams()
    fetchQueuesData(searchParam, sortByParam, sortOrderParam, tagParam)
  }

  const fetchQueuesData = async (
    searchParam?: string,
    sortByParam?: string,
    sortOrderParam?: string,
    tagParam?: string
  ) => {
    try {
      let apiUrl = `${API}/queues-details`

      const queryParams = new URLSearchParams()

      if (searchParam) {
        queryParams.set("search", encodeURIComponent(searchParam))
      }

      if (tagParam) {
        queryParams.set("tag", encodeURIComponent(tagParam))
      } else if (selectedTag) {
        queryParams.set("tag", encodeURIComponent(selectedTag))
      }

      if (sortByParam && sortOrderParam) {
        queryParams.set("sortBy", sortByParam)
        queryParams.set("sortOrder", sortOrderParam)
      }

      queryParams.set("limit", itemsPerPage.toString())
      queryParams.set("offset", itemOffset.toString())
      apiUrl += `?${queryParams.toString()}`

      const response = await fetch(apiUrl)
      const result = await response.json()
      setPageCount(result.total_pages)

      setQueues(result.data)
    } catch (err) {
      console.error("Error fetching data:", err)
    }
  }

  useEffect(() => {
    const handleInitialParams = async () => {
      const { searchParam, sortByParam, sortOrderParam, tagParam } =
        getUrlParams()

      setSearchTerm(searchParam)
      setSortBy(sortByParam)
      setSortOrder(sortOrderParam)
      setSelectedTag(tagParam)
      await fetchQueuesData(searchParam, sortByParam, sortOrderParam, tagParam)
    }

    handleInitialParams()
  }, [location.search, itemOffset, itemsPerPage, selectedTag])

  return (
    <div className="px-4 sm:px-6 lg:px-8 ">
      <div className="sm:flex sm:items-center ">
        <div className="sm:flex-auto flex   justify-between">
          <div className="flex  justify-start space-x-2 mb-5">
            <input
              type="text"
              className="h-8 text-black text-base font-mono  pl-3"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
            <button
              type="button"
              onClick={handleSearchClick}
              className="h-8 block  bg-indigo-500 px-3 py-auto text-center text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Search
            </button>
          </div>
          <div className=" flex flex-end space-x-2 ">
            <div className="h-8 flex justify-start  gap-x-1  bg-green-500 px-1 py-auto text-center text-base font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
              <PlusIcon className="h-6 my-auto" />
              <a href="/queues/create-queue" className="my-auto">
                New Queue
              </a>
            </div>
          </div>
        </div>
      </div>
      <div className="-mx-4 mt-4 ring-1 ring-gray-300 sm:mx-0 sm:rounded-lg overflow-y-auto max-h-[700px] bg-gray-800">
        <table className="min-w-full divide-y divide-gray-300  ">
          <thead>
            <tr>
              <th
                scope="col"
                className=" cursor-pointer   py-3.5 pl-4 pr-3 text-center text-base font-semibold  text-white sm:pl-6"
              >
                {" "}
                <input
                  type="checkbox"
                  // onChange={handleSelectAllClick}
                  // checked={selectedRows.length === queue.tasks.length}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
              </th>
              <th
                scope="col"
                className=" cursor-pointer   py-3.5 pl-4 pr-3 text-center text-base font-semibold  text-white sm:pl-6"
                onClick={() => handleSortClick("id")}
              >
                ID {getSortIcon("id")}
              </th>
              <th
                scope="col"
                className="  cursor-pointer  px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
                onClick={() => handleSortClick("type")}
              >
                Type {getSortIcon("type")}
              </th>
              <th
                scope="col"
                className="   px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Tags
              </th>
              <th
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Total Tasks
              </th>
              <th
                onClick={() => handleSortClick("created_at")}
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Created At {getSortIcon("created_at")}
              </th>
              <th
                onClick={() => handleSortClick("updated_at")}
                scope="col"
                className=" px-3 py-3.5 text-center text-base font-semibold text-white lg:table-cell"
              >
                Updated At {getSortIcon("updated_at")}
              </th>
              <th
                scope="col"
                className="px-3 py-3.5 text-center text-base font-semibold text-white"
              >
                Actions
              </th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Select</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {queues &&
              queues.map((queue, index) => (
                <tr
                  key={queue.id}
                  onClick={event => handleRowClick(queue.id, event)}
                  className="cursor-pointer hover:bg-gray-900  bg-opacity-100 transition-all"
                >
                  <td
                    className={classNames(
                      index === 0 ? "" : " ransparent",
                      "relative py-4 pl-4 pr-3 text-base sm:pl-6 action-column"
                    )}
                  >
                    <input
                      type="checkbox"
                      // onChange={handleSelectAllClick}
                      // checked={selectedRows.length === queue.tasks.length}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </td>
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
                      index === 0 ? "" : "border-gray-200",
                      " px-3 py-3.5 text-base text-white lg:table-cell action-column"
                    )}
                  >
                    <div className="text-white text-sm ">
                      {Array.isArray(queue.tags) &&
                        queue.tags.map((tag, index) => (
                          <React.Fragment key={index}>
                            {tag
                              .toString()
                              .split(",")
                              .map((char, charIndex) => (
                                <React.Fragment key={charIndex}>
                                  <span
                                    onClick={() => handleTagClick(char)}
                                    className="inline-block border border-sky-400 px-1 py-1 mr-2 mb-2 rounded-lg text-sky-300 font-semibold hover:text-sky-600 "
                                  >
                                    {char}
                                  </span>
                                  {charIndex !== tag.length - 1 && (
                                    <span>, </span>
                                  )}
                                </React.Fragment>
                              ))}
                            {index !== queue.tags.length - 1 && <span>, </span>}
                          </React.Fragment>
                        ))}
                    </div>
                  </td>
                  <td
                    className={classNames(
                      index === 0 ? "" : " border-gray-200",
                      " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                    )}
                  >
                    <div className=" text-white"> {queue.totalTasks}</div>
                  </td>

                  <td
                    className={classNames(
                      index === 0 ? "" : " border-gray-200",
                      " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                    )}
                  >
                    <div className=" text-white">
                      {new Date(
                        queue.createdAt.valueOf() *
                          (queue.createdAt.valueOf() < 1e12 ? 1000 : 1)
                      ).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      })}
                    </div>
                  </td>
                  <td
                    className={classNames(
                      index === 0 ? "" : " border-gray-200",
                      " px-3 py-3.5 text-base pl-8 text-white lg:table-cell "
                    )}
                  >
                    <div className=" text-white">
                      {new Date(
                        queue.updatedAt.valueOf() *
                          (queue.updatedAt.valueOf() < 1e12 ? 1000 : 1)
                      ).toLocaleString("en-GB", {
                        day: "numeric",
                        month: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "numeric",
                        second: "numeric",
                      })}
                    </div>
                  </td>
                  <td
                    className={classNames(
                      index === 0 ? "" : " border-gray-200",
                      " px-0 py-3.5 text-base text-white lg:table-cell action-column"
                    )}
                  >
                    <div className="flex justify-center text-center space-x-10 ">
                      <a title="Add Tasks" href="/queues/add-tasks">
                        <PlusIcon className="h-7 font-semibold text-green-500 hover:text-green-700" />
                      </a>
                      <button
                        title="Export Result"
                        onClick={() => handleExportResult(queue.id)}
                      >
                        <ArrowDownTrayIcon className="h-7 text-blue-500 hover:text-blue-700" />
                      </button>
                      <button
                        title="Delete Queue"
                        onClick={() => handleDeleteQueue(queue.id)}
                      >
                        <XMarkIcon className="h-7 text-red-500 hover:text-red-700" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        {/* Pagination */}
        <ReactPaginate
          className="flex justify-center gap-x-5 my-6"
          breakLabel="..."
          nextLabel="next >"
          onPageChange={handlePageClick}
          pageRangeDisplayed={3}
          pageCount={pageCount}
          previousLabel="< previous"
          renderOnZeroPageCount={null}
          containerClassName="pagination"
          pageLinkClassName=" text-sky-400"
          previousLinkClassName={`${
            currentPage === 0
              ? "hidden"
              : "border p-1 text-sky-400 font-semibold"
          }`}
          nextLinkClassName={`${
            currentPage === pageCount - 1
              ? "hidden"
              : "border p-1 text-sky-400 font-semibold"
          }`}
          activeLinkClassName="border p-1 cursor-text"
        />
      </div>
    </div>
  )
}
