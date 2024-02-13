import { useState, useEffect } from "react"
import "../../styles/Queue.css"
import QueueTable from "./QueueTable"
import Tabs from "./Tabs"
import QueueDetails from "./QueueDetails"
import { API_BASE_URL as API } from "../../constants"
import { useLocation } from "react-router-dom"
import axios from "axios"

type Tab = {
  name: string
  href: string
  current: boolean
}

export default function Main() {
  const location = useLocation()

  const initialTabs: Tab[] = [
    { name: "Queue Details", href: "#", current: true },
    { name: "Tasks", href: `${location.pathname}/tasks`, current: false },
  ]
  const [tabs, setTabs] = useState<Tab[]>(initialTabs)

  interface TaskParamsAndResultType {
    params: { num1: number; num2: number }
    result: { result: number }
  }
  const [selectedTab, setSelectedTab] = useState<string>("Queue Details")
  const [, setTaskParamsAndResult] = useState<TaskParamsAndResultType[]>([])

  const handleTabChange = (tabName: string) => {
    setSelectedTab(tabName)

    const updatedTabs = tabs.map(tab => ({
      ...tab,
      current: tab.name === tabName,
    }))
    setTabs(updatedTabs)
  }

  const pathnameParts = location.pathname.split("/")
  const taskId = pathnameParts[pathnameParts.length - 1]

  useEffect(() => {
    const apiURL = `${API}/get-params-and-result/${taskId}`

    axios
      .post(apiURL)
      .then(response => {
        setTaskParamsAndResult(response.data)
      })
      .catch(error => {
        console.error(`Error fetching data: ${error}`)
      })
  }, [taskId])
  return (
    <>
      <div className="w-72 mx-8 bg-gray-800">
        <Tabs
          tabs={tabs}
          selectedTab={selectedTab}
          onTabChange={handleTabChange}
        />
      </div>
      <div className="box box1 ">
        {selectedTab === "Queue Details" && <QueueDetails />}
        {selectedTab === "Tasks" && <QueueTable />}
      </div>
    </>
  )
}
