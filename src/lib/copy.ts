export interface AppCopy {
  common: {
    back: string;
    save: string;
    cancel: string;
    search: string;
    loading: string;
  };
  nav: {
    home: string;
    events: string;
    projects: string;
    resources: string;
    blog: string;
    about: string;
    login: string;
    dashboard: string;
    registerNow: string;
  };
  footer: {
    mission: string;
    about: string;
    explore: string;
    connect: string;
    missionLink: string;
    teamLink: string;
    timelineLink: string;
    contact: string;
    copyright: string;
    slogan: string;
  };
  auth: {
    signInTitle: string;
    signInSubtitle: string;
    signupTitle: string;
    signupSubtitle: string;
    email: string;
    password: string;
    confirmPassword: string;
    fullName: string;
    optional: string;
    signIn: string;
    signingIn: string;
    createAccount: string;
    creatingAccount: string;
    invalidCredentials: string;
    passwordMismatch: string;
    unableToSignIn: string;
    unableToSignup: string;
    alreadyHaveAccount: string;
    noAccount: string;
    signInLink: string;
    signupLink: string;
    forgotPassword: string;
    resetPasswordTitle: string;
    resetPasswordSubtitle: string;
    requestReset: string;
    sendResetLink: string;
    resetLinkSent: string;
    verifyEmailTitle: string;
    verifyEmailSubtitle: string;
    verifyEmailAction: string;
    emailChange: string;
    requestEmailChange: string;
    resendVerification: string;
  };
  admin: {
    studio: string;
    dashboard: string;
    applications: string;
    signOut: string;
    backToSite: string;
    searchPlaceholder: string;
    securityBanner: string;
  };
}

export const appCopy: AppCopy = {
  common: {
    back: "Back",
    save: "Save",
    cancel: "Cancel",
    search: "Search",
    loading: "Loading...",
  },
  nav: {
    home: "Home",
    events: "Events",
    projects: "Projects",
    resources: "Resources",
    blog: "Blog",
    about: "About",
    login: "Log In",
    dashboard: "Dashboard",
    registerNow: "Register Now",
  },
  footer: {
    mission:
      "Club Robotique & Recherche Technologique. Building the future at ENSA Agadir since 2008.",
    about: "About",
    explore: "Explore",
    connect: "Connect",
    missionLink: "Our Mission",
    teamLink: "Team",
    timelineLink: "Timeline",
    contact: "Contact Us",
    copyright: "All rights reserved.",
    slogan: "Our robots never sleep.",
  },
  auth: {
    signInTitle: "Sign In",
    signInSubtitle: "One login portal for members and admins.",
    signupTitle: "Create Account",
    signupSubtitle:
      "Sign up as a member to register for events and access resources.",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm Password",
    fullName: "Full Name",
    optional: "Optional",
    signIn: "Sign In",
    signingIn: "Signing in...",
    createAccount: "Create Account",
    creatingAccount: "Creating account...",
    invalidCredentials: "Invalid email or password.",
    passwordMismatch: "Passwords do not match.",
    unableToSignIn: "Unable to sign in right now.",
    unableToSignup: "Unable to create account right now.",
    alreadyHaveAccount: "Already have an account?",
    noAccount: "No account yet?",
    signInLink: "Sign in",
    signupLink: "Create one",
    forgotPassword: "Forgot password?",
    resetPasswordTitle: "Reset Password",
    resetPasswordSubtitle: "Request a secure link to reset your password.",
    requestReset: "Reset password",
    sendResetLink: "Send reset link",
    resetLinkSent: "If an account exists for this email, we sent a reset link.",
    verifyEmailTitle: "Verify Email",
    verifyEmailSubtitle: "Confirm your email to complete account security actions.",
    verifyEmailAction: "Verify email",
    emailChange: "Change email",
    requestEmailChange: "Send verification to new email",
    resendVerification: "Resend verification",
  },
  admin: {
    studio: "Studio",
    dashboard: "Dashboard",
    applications: "Applications",
    signOut: "Sign Out",
    backToSite: "Back to site",
    searchPlaceholder: "Search pages and actions...",
    securityBanner:
      "Default seeded admin password is still active. Change it in Settings.",
  },
};
