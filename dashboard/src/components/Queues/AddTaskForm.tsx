import { DocumentTextIcon } from "@heroicons/react/24/solid"
import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { API_BASE_URL as API } from "../../constants"

export default function AddTasksForm() {
  const navigate = useNavigate()

  const [notification, setNotification] = useState<{
    type: "success" | "error"
    message: string
    details?: string
  } | null>(null)

  const [jsonChoice, setJsonChoice] = useState<"file" | "input" | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (jsonChoice === "file") {
      // Handle file upload logic
      const jsonFileInput = document.getElementById(
        "json-upload"
      ) as HTMLInputElement

      if (
        jsonFileInput &&
        jsonFileInput.files &&
        jsonFileInput.files.length > 0
      ) {
        const file = jsonFileInput.files[0]

        if (!file) {
          setNotification({
            type: "error",
            message: "No file selected",
          })
          return
        }

        try {
          const fileContent = await file.text()

          const apiUrl = `${API}/add-tasks`
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: fileContent,
          })

          if (response.ok) {
            setNotification({
              type: "success",
              message: "File uploaded successfully!",
              details: `Response: ${response.statusText}`,
            })

            navigate("/queues")
          } else {
            setNotification({
              type: "error",
              message: `Error uploading file: ${response.statusText}`,
            })
          }
        } catch (error) {
          console.error("Error reading file:", error)
        }
      } else {
        setNotification({
          type: "error",
          message: "No file selected",
        })
      }
    } else if (jsonChoice === "input") {
      // Handle input data logic
      const jsonInput = document.getElementById(
        "json-input"
      ) as HTMLTextAreaElement

      if (jsonInput && jsonInput.value.trim() !== "") {
        const jsonData = jsonInput.value

        try {
          const apiUrl = "http://127.0.0.1:8484/add-tasks"
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: jsonData,
          })

          if (response.ok) {
            setNotification({
              type: "success",
              message: "JSON File uploaded successfully!",
              details: `Response: ${response.statusText}`,
            })
          } else {
            setNotification({
              type: "error",
              message: `Error uploading JSON file: ${response.statusText}`,
            })
          }
        } catch (error) {
          console.error("Error reading JSON file:", error)
          setNotification({
            type: "error",
            message: "An unexpected error occurred.",
          })
        }
      } else {
        console.log("No data to submit.")
      }
    } else {
      console.log("No data to submit.")
    }
  }

  const [, setJsonInput] = useState<string>("")
  const [, setJsonData] = useState<object | null>(null)
  const [jsonError, setJsonError] = useState<string | null>(null)

  const handleJsonInputChange = (
    event: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    const inputValue = event.target.value
    setJsonInput(inputValue)

    try {
      const parsedData = JSON.parse(inputValue)
      setJsonData(parsedData)
      setJsonError(null)
    } catch (error) {
      setJsonData(null)
      setJsonError("Invalid JSON format")
    }
  }

  const handleJsonChoice = (choice: "file" | "input") => {
    setJsonChoice(choice)
    // Reset notification when the user changes their choice
    setNotification(null)
  }

  return (
    <form>
      <div className="space-y-12 sm:space-y-16  ">
        <div>
          <div className="mt-0 space-y-8 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:pb-0">
            <div className="sm:grid sm:grid-cols-0 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="json-choice"
                className="block text-sm font-medium leading-6  sm:pt-1.5"
              >
                Choose JSON Input
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex justify-center space-x-4">
                  <label className="cursor-pointer text-sm leading-6 ">
                    <input
                      type="radio"
                      name="json-choice"
                      value="file"
                      checked={jsonChoice === "file"}
                      onChange={() => handleJsonChoice("file")}
                      className="mr-2"
                    />
                    File
                  </label>
                  <label className="cursor-pointer text-sm leading-6 ">
                    <input
                      type="radio"
                      name="json-choice"
                      value="input"
                      checked={jsonChoice === "input"}
                      onChange={() => handleJsonChoice("input")}
                      className="mr-2"
                    />
                    Input
                  </label>
                </div>
              </div>
            </div>
          </div>

          {jsonChoice === "file" && (
            <div className="sm:grid sm:grid-cols-0 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="json-upload"
                className="block text-sm font-medium leading-6  sm:pt-1.5"
              >
                JSON File
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <div className="flex max-w-2xl justify-center rounded-lg border border-dashed border-gray-100/25 px-6 py-3">
                  <div className="text-center">
                    <DocumentTextIcon
                      className="mx-auto h-12 w-12 text-gray-300"
                      aria-hidden="true"
                    />
                    <div className="mt-4 flex text-sm leading-6 ">
                      <label
                        htmlFor="json-upload"
                        className="relative cursor-pointer rounded-md bg-gray-700  font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
                      >
                        <span>Upload a JSON file</span>
                        <input
                          id="json-upload"
                          name="json-upload"
                          type="file"
                          accept=".json"
                          className="sr-only"
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs leading-5 ">JSON up to 100MB</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {jsonChoice === "input" && (
            <div className="sm:grid sm:grid-cols-0 sm:items-start sm:gap-4 sm:py-6">
              <label
                htmlFor="json-input"
                className="block text-sm font-medium leading-6  sm:pt-1.5"
              >
                JSON input
              </label>
              <div className="mt-2 sm:col-span-2 sm:mt-0">
                <textarea
                  id="json-input"
                  name="json-input"
                  onChange={handleJsonInputChange}
                  rows={3}
                  className={`${
                    jsonError ? "focus:ring-red-600" : " focus:ring-indigo-600"
                  } text-black p-2 h-96 block w-full max-w-2xl rounded-md py-1.5 border-0  shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset  sm:text-sm sm:leading-6`}
                  placeholder="Enter JSON data here..."
                />
                {jsonError && (
                  <div className=" text-red-500 font-mono text-sm  mt-2">
                    {jsonError}
                  </div>
                )}

                <p className="mt-3 text-sm leading-6 "></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {notification && (
        <div
          className={`${
            notification.type === "success"
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          } absolute top-4 right-4 p-4 border border-solid border-current rounded-md`}
        >
          <p className="font-semibold">{notification.message}</p>
          {notification.details && (
            <p className="mt-2 text-sm">{notification.details}</p>
          )}
        </div>
      )}

      <div className="mt-6 flex items-center justify-center gap-x-6">
        <a
          href="/queues"
          className="cursor-pointer text-sm font-semibold leading-6 "
        >
          Cancel
        </a>
        <button
          onClick={handleSubmit}
          type="submit"
          className="inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          Upload
        </button>
      </div>
    </form>
  )
}
