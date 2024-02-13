import React from "react"

type Tab = {
  name: string
  href: string
  current: boolean
}

type TabsProps = {
  tabs: Tab[]
  selectedTab: string
  onTabChange: (tabName: string) => void
}

function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ")
}

const Tabs: React.FC<TabsProps> = ({ tabs, selectedTab, onTabChange }) => {
  return (
    <div>
      <div className="sm:hidden">
        <label htmlFor="tabs" className="sr-only">
          Select a tab
        </label>
        <select
          id="tabs"
          name="tabs"
          className="block w-full bg-gray-800 rounded-md border-gray-600 focus:border-indigo-500 focus:ring-indigo-500"
          value={selectedTab}
          onChange={e => onTabChange(e.target.value)}
        >
          {tabs.map(tab => (
            <option key={tab.name} value={tab.name}>
              {tab.name}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden sm:block">
        <nav
          className="isolate flex divide-x divide-gray-200 rounded-lg shadow"
          aria-label="Tabs"
        >
          {tabs.map((tab, tabIdx) => (
            <a
              key={tab.name}
              href={tab.href}
              onClick={() => onTabChange(tab.name)}
              className={classNames(
                tab.current
                  ? "text-gray-900 hover:text-gray-700 "
                  : "text-gray-500 ",
                tabIdx === 0 ? "rounded-l-lg" : "",
                tabIdx === tabs.length - 1 ? "rounded-r-lg" : "",
                "group relative min-w-0 flex-1 overflow-hidden bg-gray-700 py-4 px-4 text-white text-center text-sm font-medium hover:bg-gray-900 focus:z-10"
              )}
              aria-current={tab.current ? "page" : undefined}
            >
              <span>{tab.name}</span>
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

export default Tabs
