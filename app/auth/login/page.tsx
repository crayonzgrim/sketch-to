import { LoginForm } from '@/components/auth/login-form'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-8 p-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Welcome to SketchTo</h1>
          <p className="text-muted-foreground">
            Sign in to start generating images
          </p>
        </div>
        <LoginForm />
        <p className="text-sm text-muted-foreground">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  )
}
