#!/usr/bin/env node

/**
 * Security Fix Script for WellnessGrid
 * Addresses immediate security issues identified in the audit
 */

const fs = require('fs');
const path = require('path');

console.log('🔒 WellnessGrid Security Fix Script');
console.log('===================================');

function updateAnalyticsRoute() {
    console.log('\n🔧 Fixing hardcoded test user ID in analytics route...');
    
    const filePath = path.join(__dirname, '..', 'app', 'api', 'analytics', 'route.ts');
    
    if (!fs.existsSync(filePath)) {
        console.log('❌ Analytics route file not found');
        return false;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace hardcoded test user ID with environment variable
    const hardcodedId = '69478d34-90bd-476f-b47a-7d099c1cb913';
    const replacement = 'process.env.TEST_USER_ID || \'69478d34-90bd-476f-b47a-7d099c1cb913\'';
    
    if (content.includes(hardcodedId)) {
        content = content.replace(
            new RegExp(`'${hardcodedId}'`, 'g'),
            replacement
        );
        
        fs.writeFileSync(filePath, content);
        console.log('✅ Updated analytics route with environment variable');
        return true;
    } else {
        console.log('⚠️  Hardcoded ID not found - may already be fixed');
        return false;
    }
}

function updateGitignore() {
    console.log('\n📝 Updating .gitignore...');
    
    const gitignorePath = path.join(__dirname, '..', '.gitignore');
    const envEntries = [
        '.env.local',
        '.env.*.local',
        '*.log',
        'logs/',
        'npm-debug.log*',
        'yarn-debug.log*',
        'yarn-error.log*'
    ];
    
    let gitignoreContent = '';
    
    if (fs.existsSync(gitignorePath)) {
        gitignoreContent = fs.readFileSync(gitignorePath, 'utf8');
    }
    
    let updated = false;
    const lines = gitignoreContent.split('\n');
    
    envEntries.forEach(entry => {
        if (!lines.includes(entry)) {
            lines.push(entry);
            updated = true;
        }
    });
    
    if (updated) {
        fs.writeFileSync(gitignorePath, lines.join('\n'));
        console.log('✅ Updated .gitignore with security entries');
    } else {
        console.log('✅ .gitignore already contains necessary entries');
    }
    
    return true;
}

function createEnvExample() {
    console.log('\n📋 Creating .env.example template...');
    
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    const envLocalPath = path.join(__dirname, '..', '.env.local');
    
    const envTemplate = `# WellnessGrid Environment Variables
# Copy this file to .env.local and fill in your actual values

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# API Keys (Replace with your own)
HUGGINGFACE_API_KEY=your_huggingface_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENROUTER_API_KEY=your_openrouter_api_key

# External Services
FLASK_API_URL=your_flask_api_url

# Test Configuration (Optional)
TEST_USER_ID=your_test_user_id

# Security Note: Never commit .env.local to version control!
`;
    
    fs.writeFileSync(envExamplePath, envTemplate);
    console.log('✅ Created .env.example template');
    
    // Check if .env.local exists and warn about security
    if (fs.existsSync(envLocalPath)) {
        console.log('\n⚠️  WARNING: .env.local exists with potentially sensitive data');
        console.log('   Please regenerate your API keys from the providers:');
        console.log('   - Supabase: Dashboard > Settings > API');
        console.log('   - HuggingFace: Settings > Access Tokens');
        console.log('   - Google Gemini: AI Studio > API Keys');
        console.log('   - OpenRouter: Account > API Keys');
    }
    
    return true;
}

function createSecurityMiddleware() {
    console.log('\n🛡️ Creating security middleware...');
    
    const middlewarePath = path.join(__dirname, '..', 'lib', 'security.ts');
    
    const middlewareContent = `import { NextRequest, NextResponse } from 'next/server';
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
            return \`Missing required field: \${field}\`;
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
`;
    
    fs.writeFileSync(middlewarePath, middlewareContent);
    console.log('✅ Created security middleware');
    
    return true;
}

function printSecurityChecklist() {
    console.log('\n📋 URGENT SECURITY CHECKLIST');
    console.log('=============================');
    console.log('\n🚨 IMMEDIATE ACTIONS REQUIRED:');
    console.log('1. [ ] Regenerate Supabase service role key');
    console.log('      → Go to Supabase Dashboard > Settings > API');
    console.log('      → Click "Generate new service_role key"');
    console.log('      → Update SUPABASE_SERVICE_ROLE_KEY in .env.local');
    console.log('');
    console.log('2. [ ] Regenerate Supabase anon key');
    console.log('      → Go to Supabase Dashboard > Settings > API');
    console.log('      → Click "Generate new anon key"');
    console.log('      → Update NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
    console.log('');
    console.log('3. [ ] Rotate all API keys:');
    console.log('      → HuggingFace: https://huggingface.co/settings/tokens');
    console.log('      → Google Gemini: https://aistudio.google.com/apikey');
    console.log('      → OpenRouter: https://openrouter.ai/keys');
    console.log('');
    console.log('4. [ ] Add TEST_USER_ID to .env.local:');
    console.log('      → Add: TEST_USER_ID=69478d34-90bd-476f-b47a-7d099c1cb913');
    console.log('');
    console.log('5. [ ] Remove .env.local from git if committed:');
    console.log('      → git rm --cached .env.local');
    console.log('      → git commit -m "Remove environment file from tracking"');
    console.log('');
    console.log('⚠️  Until these steps are completed, your application has security vulnerabilities!');
}

async function main() {
    try {
        console.log('\n🔍 Running security fixes...');
        
        // Apply fixes
        updateAnalyticsRoute();
        updateGitignore();
        createEnvExample();
        createSecurityMiddleware();
        
        console.log('\n✅ Automated security fixes completed!');
        
        // Print manual steps
        printSecurityChecklist();
        
        console.log('\n📄 See SECURITY_AUDIT.md for complete security recommendations');
        
    } catch (error) {
        console.error('❌ Error running security fixes:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    updateAnalyticsRoute,
    updateGitignore,
    createEnvExample,
    createSecurityMiddleware
};


