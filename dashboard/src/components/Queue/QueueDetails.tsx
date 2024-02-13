function QueueDetails() {
  return (
    <div className="overflow-hidden bg-gray-800 shadow sm:rounded-lg mt-12 text-white mx-8">
      <div className=" border-gray-100  ">
        <dl className=" divide-gray-100">
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-white">Pending Tasks</dt>
            <dd className="mt-1 text-sm leading-6 text-white sm:col-span-2 sm:mt-0">
              15
            </dd>
          </div>

          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium ">Max Retries</dt>
            <dd className="mt-1 text-sm leading-6  sm:col-span-2 sm:mt-0">3</dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium ">Estimated Time</dt>
            <dd className="mt-1 text-sm leading-6  sm:col-span-2 sm:mt-0">
              2 hours
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium ">Completed Time</dt>
            <dd className="mt-1 text-sm leading-6  sm:col-span-2 sm:mt-0">
              1.5 hours
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium ">Options</dt>
            <dd className="mt-1 text-sm leading-6  sm:col-span-2 sm:mt-0">
              options here
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium ">Notes</dt>
            <dd className="mt-1 text-sm leading-6  sm:col-span-2 sm:mt-0">
              Queue notes here
            </dd>
          </div>
          <div className="px-4 py-6 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"></div>
        </dl>
      </div>
    </div>
  )
}

export default QueueDetails
