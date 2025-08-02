import { NextRequest, NextResponse } from 'next/server'
import { HomepageIntegrationService } from '@/lib/services/homepage-integration'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    try {
        const supabase = await createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
        }

        await HomepageIntegrationService.generateSyntheticData(user.id)

        return NextResponse.json({ 
            success: true, 
            message: `Synthetic data generated for user ${user.id}`,
            userId: user.id
        })

    } catch (error) {
        console.error('Error generating synthetic data:', error)
        return NextResponse.json(
            { error: 'Failed to generate synthetic data' },
            { status: 500 }
        )
    }
}