import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Application } from 'express'

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: Express.User, done) => {
  done(null, obj);
});

passport.use(new LocalStrategy((username, password, cb) => {
  if (username === 'test' && password === 'test') {
    return cb(null, { username: 'test' })
  }
  return cb(null, false, { message: 'Incorrect username or password' })
}))

/**
 * Initialize the app's authentication functions.
 * @param app Express application to register routes on.
 */
export default function initAuth(app: Application) {
  // Local username/password auth
  app.get('/login', (req, res) => {
    res.render('login', {
      withLocalLogin: !!process.env.LOCAL_USERS,
      withGoogleLogin: !!process.env.GOOGLE_CLIENT_ID,
      withMicrosoftLogin: true,
    })
  })

  app.post('/logout', (req, res, next) => {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/login');
    })
  })
  
  app.post('/login/password', passport.authenticate('local', {
    successReturnToOrRedirect: '/',
    failureRedirect: '/login',
  }))

  // Google OAuth 2.0 login
  if (process.env.GOOGLE_CLIENT_ID) {
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] }))

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
      res.redirect('/')
    })

    passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    }, (accessToken, refreshToken, profile, cb) => {
      return cb(null, profile)
    }))
  }
}
