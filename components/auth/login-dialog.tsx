'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoginForm } from '@/components/auth/login-form'

interface LoginDialogContextType {
  open: boolean
  openLoginDialog: () => void
  closeLoginDialog: () => void
}

const LoginDialogContext = createContext<LoginDialogContextType>({
  open: false,
  openLoginDialog: () => {},
  closeLoginDialog: () => {},
})

export function useLoginDialog() {
  return useContext(LoginDialogContext)
}

export function LoginDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openLoginDialog = useCallback(() => setOpen(true), [])
  const closeLoginDialog = useCallback(() => setOpen(false), [])

  return (
    <LoginDialogContext.Provider value={{ open, openLoginDialog, closeLoginDialog }}>
      {children}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-2xl">Welcome to SketchTo</DialogTitle>
            <DialogDescription className="text-center">
              Sign in to start generating images
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-4">
            <LoginForm />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            By signing in, you agree to our Terms of Service
          </p>
        </DialogContent>
      </Dialog>
    </LoginDialogContext.Provider>
  )
}
