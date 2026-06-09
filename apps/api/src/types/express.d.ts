// Extend Express.User so passport's req.user matches our auth middleware shape
declare global {
  namespace Express {
    interface User {
      id: string
      role: string
    }
  }
}

export {}
