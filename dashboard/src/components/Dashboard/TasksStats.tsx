import { ComponentType } from "react"

interface ChartBoxProps {
  Icon?: ComponentType<{ className?: string }>
  title: string | number
  value: string | number
  color: string
  bgColor: string
  percentage: number | string
  onDropdownChange?: (selectedOption: string) => void
}

function ChartBox(props: ChartBoxProps) {
  const { Icon, title, value, color, percentage, bgColor } = props

  return (
    <div>
      <div className="boxInfo">
        <div className="flex justify-around space-x-2 overflow-hidden ">
          <div className="title flex  space-x-2 overflow-hidden ">
            {Icon && <Icon className={` overflow-hidden  h-8 ${color}`} />}
            <span className="my-auto">{title}</span>
          </div>
        </div>
        <div className="flex justify-around items-center">
          <h1
            className={` overflow-hidden text-6xl mt-2  font-medium ${color}`}
          >
            {value}
          </h1>
          <h1
            className={`overflow-hidden  text-xl mt-4  p-3 rounded-full text-zinc-50  border-gray-600 border  ${bgColor}  font-bold `}
          >
            {percentage}%
          </h1>
        </div>
      </div>
    </div>
  )
}

export default ChartBox
