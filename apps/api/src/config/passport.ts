import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { User } from '../models/User'

export function initPassport() {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:4000/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email       = profile.emails?.[0]?.value?.toLowerCase()
          const displayName = profile.displayName
          const avatarUrl   = profile.photos?.[0]?.value

          if (!email) return done(new Error('No email from Google'), false)

          // Find by googleId first, then fall back to email
          let user = await User.findOne({ googleId: profile.id })

          if (!user) {
            user = await User.findOne({ email })
            if (user) {
              // Existing email/password account — link Google to it
              user.googleId    = profile.id
              user.displayName = displayName
              user.avatarUrl   = avatarUrl
              user.isVerified  = true
              await user.save()
            } else {
              // Brand new user via Google
              user = await User.create({
                email,
                googleId:    profile.id,
                displayName,
                avatarUrl,
                isVerified:  true,
              })
            }
          }

          return done(null, { id: user._id.toString(), role: user.role })
        } catch (err) {
          return done(err as Error, false)
        }
      }
    )
  )
}
