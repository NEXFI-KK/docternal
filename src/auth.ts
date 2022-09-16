import passport from 'passport'
import { Strategy as LocalStrategy } from 'passport-local'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import { IProfile, OIDCStrategy as MicrosoftStrategy, VerifyCallback } from 'passport-azure-ad'
import { Application, NextFunction, Request, Response } from 'express'
import { EnvConfig } from './EnvConfig';

/**
 * User info type to be added to the request after logging in.
 */
type DocternalUser = {
  id: string
  name: string
  email: string
  domain: string
  locale: string
}

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
export default function initAuth(app: Application, envConfig: EnvConfig) {
  // Local username/password auth
  app.get('/login', (req, res) => {
    res.render('login', {
      withLocalLogin: !!envConfig.LOCAL_USERS,
      withGoogleLogin: !!envConfig.GOOGLE_CLIENT_ID,
      withMicrosoftLogin: !!envConfig.MICROSOFT_CLIENT_ID,
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
  if (envConfig.GOOGLE_CLIENT_ID) {
    app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }))

    app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
      res.redirect('/')
    })

    passport.use(new GoogleStrategy({
      clientID: envConfig.GOOGLE_CLIENT_ID as string,
      clientSecret: envConfig.GOOGLE_CLIENT_SECRET as string,
      callbackURL: envConfig.GOOGLE_CALLBACK_URL as string,
    }, (accessToken, refreshToken, profile, cb) => {
      if (!profile._json.email || !profile._json.hd) {
        return cb(new Error('user has no email or domain'), undefined)
      }
      const user: DocternalUser = {
        id: profile.id,
        name: profile.displayName,
        email: profile._json.email,
        domain: profile._json.hd,
        locale: profile._json.locale || 'en',
      }
      return cb(null, user)
    }))
  }

  // Microsoft OAuth 2.0 login
  if (envConfig.MICROSOFT_CLIENT_ID) {
    app.get(
      '/auth/microsoft',
      (req, res, next) => {
        passport.authenticate('azuread-openidconnect', {
          response: res,
          failureRedirect: '/login',
        } as any)(req, res, next)
      },
      (req, res) => {
        res.redirect('/')
      },
    )

    app.post(
      '/auth/microsoft/callback',
      (req, res, next) => {
        passport.authenticate('azuread-openidconnect', {
          response: res,
          failureRedirect: '/login',
        } as any)(req, res, next)
      },
      regenerateSessionAfterAuthentication,
      (req, res) => {
        res.redirect('/')
      },
    )

    passport.use(new MicrosoftStrategy({
      identityMetadata: `https://login.microsoftonline.com/${envConfig.MICROSOFT_AD_TENANT_NAME}/v2.0/.well-known/openid-configuration`,
      clientID: envConfig.MICROSOFT_CLIENT_ID,
      responseType: 'id_token',
      responseMode: 'form_post',
      redirectUrl: envConfig.MICROSOFT_CALLBACK_URL,
      passReqToCallback: false,
      scope: [ 'profile', 'email' ],
    }, (iss: string, sub: string, profile: IProfile, done: VerifyCallback) => {
      if (!profile.oid) {
        return done(new Error('user has no oid'), undefined)
      }
      console.log('Signed in with Microsoft account')
      console.log(profile)
      const user: DocternalUser = {
        id: profile.oid,
        name: profile.displayName || 'Unknown',
        email: '',
        domain: '',
        locale: 'en',
      }
      return done(null, user)
    }))
  }
}

function regenerateSessionAfterAuthentication(req: Request, res: Response, next: NextFunction) {
  let passportInstance = (req.session as any).passport;
  return req.session.regenerate(function (err){
    if (err) {
      return next(err);
    }
    (req.session as any).passport = passportInstance;
    return req.session.save(next);
  });
}
