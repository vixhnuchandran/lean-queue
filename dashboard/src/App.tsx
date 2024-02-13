import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from "react-router-dom"
import "./App.css"

import Dashboard from "./pages/Dashboard"
import Queues from "./pages/Queues"
import CreateQueue from "./pages/CreateQueue"
import AddTasks from "./pages/AddTasks"
import Queue from "./pages/Queue"
import Settings from "./pages/Settings"

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/">
        <Route index element={<Dashboard />} />
        <Route path="/queues" element={<Queues />} />
        <Route path="/settings" element={<Settings />} />

        <Route path="/queues/create-queue" element={<CreateQueue />} />
        <Route path="/queues/add-tasks" element={<AddTasks />} />
        <Route path="/queues/:queue">
          <Route index element={<Queue />} />
          <Route path="tasks" element={<Queue />} />
        </Route>
      </Route>
    )
  )

  return <RouterProvider router={router} />
}

export default App
