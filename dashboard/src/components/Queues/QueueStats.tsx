import { ComponentType } from "react"

interface ChartBoxProps {
  Icon?: ComponentType<{ className?: string }>
  title: string
  value: string | number | undefined
  color: string
}

function ChartBox(props: ChartBoxProps) {
  const { Icon, title, value, color } = props

  return (
    <div>
      <div className="boxInfo">
        <div className="title flex space-x-2">
          {Icon && <Icon className={`h-10 ${color}`} />}
          <span className="my-auto">{title}</span>
        </div>
        <h1
          className={`text-6xl mt-2 text-center flex justify-center items-center font-semibold ${color}`}
        >
          {value}
        </h1>
      </div>
    </div>
  )
}

export default ChartBox
