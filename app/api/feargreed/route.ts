import { NextResponse } from 'next/server'

export async function GET() {
  try {

    const res = await fetch(
      'https://api.alternative.me/fng/',
      {
        cache: 'no-store',
      }
    )

    const data = await res.json()

    const item = data.data[0]

    return NextResponse.json({
      value: Number(item.value),
      status: item.value_classification,
      time: item.timestamp,
    })

  } catch (error) {

    return NextResponse.json({
      value: 50,
      status: 'Neutral',
      time: '',
    })

  }
}
