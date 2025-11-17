import { NextRequest, NextResponse } from 'next/server'
import mockData from '@/lib/mock-data.json'

export async function GET(
    request: NextRequest,
    context: { params: Promise<{ metric: string }> }
) {
    // simulate delay like express version
    await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500))
    
    const params = await context.params
    const metric = params.metric
    const trendData = (mockData.analytics.trends as any)[metric]
    
    if (!trendData) {
        return NextResponse.json({
            success: false,
            error: `Trend data not found for metric: ${metric}`
        }, { status: 404 })
    }
    
    return NextResponse.json({
        success: true,
        data: trendData
    })
}

