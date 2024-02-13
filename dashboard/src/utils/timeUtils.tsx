function calculateTimeDifference(
  unixTimestamp: number | string | undefined
): string {
  if (unixTimestamp) {
    const timestampDate = new Date(unixTimestamp)
    const currentDate = new Date()
    const timeDifference = currentDate.getTime() - timestampDate.getTime()

    const hours = Math.floor(timeDifference / (1000 * 60 * 60))
    const minutes = Math.floor(
      (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
    )

    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      return `${String(days)} day${days > 1 ? "s" : ""}`
    } else {
      const formattedTime =
        hours > 0
          ? `${String(hours).padStart(2, "0")} hrs ${String(minutes).padStart(
              2,
              "0"
            )} min`
          : `${String(minutes).padStart(2, "0")} min`

      return formattedTime
    }
  }
  return "N/A"
}

export { calculateTimeDifference }
