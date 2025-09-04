import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export interface AuthenticatedRequest extends NextRequest {
    user?: any;
}

/**
 * Authentication middleware for API routes
 */
export async function withAuth(
    request: NextRequest,
    handler: (req: AuthenticatedRequest) => Promise<NextResponse>
): Promise<NextResponse> {
    try {
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Missing or invalid authorization header' },
                { status: 401 }
            );
        }
        
        const token = authHeader.replace('Bearer ', '');
        const supabase = createClient();
        
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return NextResponse.json(
                { error: 'Invalid or expired token' },
                { status: 401 }
            );
        }
        
        // Add user to request
        const authenticatedRequest = request as AuthenticatedRequest;
        authenticatedRequest.user = user;
        
        return handler(authenticatedRequest);
    } catch (error) {
        console.error('Auth middleware error:', error);
        return NextResponse.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
    windowMs: number;
    max: number;
}

const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig = { windowMs: 15 * 60 * 1000, max: 100 }) {
    return (request: NextRequest): NextResponse | null => {
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const now = Date.now();
        const windowStart = now - config.windowMs;
        
        // Clean up old entries
        for (const [key, value] of rateLimitStore.entries()) {
            if (value.resetTime < now) {
                rateLimitStore.delete(key);
            }
        }
        
        const current = rateLimitStore.get(ip) || { count: 0, resetTime: now + config.windowMs };
        
        if (current.resetTime < now) {
            // Reset window
            current.count = 1;
            current.resetTime = now + config.windowMs;
        } else {
            current.count++;
        }
        
        rateLimitStore.set(ip, current);
        
        if (current.count > config.max) {
            return NextResponse.json(
                { error: 'Too many requests' },
                { 
                    status: 429,
                    headers: {
                        'Retry-After': Math.ceil((current.resetTime - now) / 1000).toString()
                    }
                }
            );
        }
        
        return null; // Continue processing
    };
}

/**
 * Input validation helpers
 */
export function validateRequired(obj: any, fields: string[]): string | null {
    for (const field of fields) {
        if (!obj[field]) {
            return `Missing required field: ${field}`;
        }
    }
    return null;
}

export function sanitizeString(str: string): string {
    if (typeof str !== 'string') return '';
    return str.trim().replace(/[<>]/g, '');
}

/**
 * Security headers
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
    response.headers.set('X-DNS-Prefetch-Control', 'on');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
    
    return response;
}
