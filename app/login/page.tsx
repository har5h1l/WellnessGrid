import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AppLogo } from "@/components/app-logo"
import Link from "next/link"

export default function Login() {
  return (
    <div className="min-h-screen wellness-gradient flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <AppLogo size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600 mt-2">Welcome back to your health journey</p>
        </div>

        {/* Login Form */}
        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-center">Sign In</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="Enter your email" className="mt-1 rounded-2xl" />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="Enter your password" className="mt-1 rounded-2xl" />
            </div>

            <Link href="/dashboard">
              <Button className="w-full wellness-button-primary">Sign In</Button>
            </Link>

            <div className="text-center space-y-2">
              <Link href="#" className="text-sm text-purple-600 hover:underline">
                Forgot your password?
              </Link>
              <div className="text-sm text-gray-600">
                Don't have an account?{" "}
                <Link href="/setup" className="text-purple-600 hover:underline">
                  Get started
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Safe, secure, and HIPAA-compliant</p>
        </div>
      </div>
    </div>
  )
}
