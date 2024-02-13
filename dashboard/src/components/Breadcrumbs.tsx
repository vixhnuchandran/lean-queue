import { HomeIcon } from "@heroicons/react/24/outline"
import React from "react"
import { Link, useLocation } from "react-router-dom"

function Breadcrumbs() {
  const location = useLocation()

  let currentLink = ""

  const crumbs = location.pathname
    .split("/")
    .filter(crumb => crumb !== "")
    .map((crumb, index, array) => {
      currentLink += `/${crumb}`
      const isLastCrumb = index === array.length - 1

      return (
        <React.Fragment key={crumb}>
          <Link
            to={currentLink}
            className={isLastCrumb ? "font-semibold text-gray-100" : ""}
          >
            {crumb}
          </Link>
          {!isLastCrumb && <span className="separator">/</span>}
        </React.Fragment>
      )
    })

  const breadcrumbsWithHome = (
    <div className="flex items-center">
      <Link to="/" className="flex items-center ">
        <HomeIcon className="h-5 mr-1 " />
        Home
      </Link>
      <span className="separator mx-1">/</span>
      {crumbs}
    </div>
  )

  return <div>{breadcrumbsWithHome}</div>
}

export default Breadcrumbs
