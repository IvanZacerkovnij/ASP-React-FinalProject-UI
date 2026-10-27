import { lazy, Suspense } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '../../pages/home/HomePage'
import { NotFoundPage } from '../../pages/not-found/NotFoundPage'
import { AppLayout } from '../../widgets/app-layout/AppLayout'
import { ProtectedRoute } from '../../features/auth/components/ProtectedRoute'
import { GuestRoute } from '../../features/auth/components/GuestRoute'
import { Spinner } from '../../shared/ui/Spinner'
import { APP_ROUTES } from '../../shared/config/routes'

const Login = lazy(() => import('../../pages/auth/LoginPage'))
const Register = lazy(() => import('../../pages/auth/RegisterPage'))
const VerifyEmail = lazy(() => import('../../pages/auth/VerifyEmailPage'))
const ForgotPassword = lazy(() => import('../../pages/auth/ForgotPasswordPage'))
const VerifyResetCode = lazy(() => import('../../pages/auth/VerifyResetCodePage'))
const ResetPassword = lazy(() => import('../../pages/auth/ResetPasswordPage'))
const AccountSecurity = lazy(() => import('../../pages/auth/AccountSecurityPage'))
const Landing = lazy(() => import('../../pages/auth/LandingPage'))
const Post = lazy(() => import('../../pages/post/PostPage'))
const Bookmarks = lazy(() => import('../../pages/bookmarks/BookmarksPage'))
const Profile = lazy(() => import('../../pages/profile/ProfilePage'))
const Followers = lazy(() => import('../../pages/profile/FollowersPage'))
const Following = lazy(() => import('../../pages/profile/FollowingPage'))
const Search = lazy(() => import('../../pages/search/SearchPage'))
const Explore = lazy(() => import('../../pages/explore/ExplorePage'))
const FollowRecommendations = lazy(() => import('../../pages/follow/FollowRecommendationsPage'))
const Settings = lazy(() => import('../../pages/settings/SettingsPage'))
const InformationLayout = lazy(() => import('../../widgets/information-layout/InformationLayout'))
const About = lazy(() => import('../../pages/information/AboutPage'))
const Help = lazy(() => import('../../pages/information/HelpPage'))
const Terms = lazy(() => import('../../pages/information/TermsPage'))
const Privacy = lazy(() => import('../../pages/information/PrivacyPage'))
const AdminRoute = lazy(() => import('../../features/moderation/AdminRoute'))
const AdminLayout = lazy(() => import('../../widgets/admin-layout/AdminLayout'))
const Dashboard = lazy(() => import('../../pages/admin/DashboardPage'))
const AdminUsers = lazy(() => import('../../pages/admin/UsersPage'))
const AdminUser = lazy(() => import('../../pages/admin/UserPage'))
const Moderation = lazy(() => import('../../pages/admin/ModerationPage'))
const Report = lazy(() => import('../../pages/admin/ReportPage'))
const AdminSettings = lazy(() => import('../../pages/admin/SettingsPage'))

const router = createBrowserRouter([
  { element: <InformationLayout />, children: [
    { path: APP_ROUTES.ABOUT, element: <About /> },
    { path: APP_ROUTES.HELP, element: <Help /> },
    { path: APP_ROUTES.TERMS, element: <Terms /> },
    { path: APP_ROUTES.PRIVACY, element: <Privacy /> },
  ] },
  { element: <GuestRoute />, children: [
    { path: APP_ROUTES.LANDING, element: <Landing /> },
    { path: APP_ROUTES.LOGIN, element: <Login /> },
    { path: APP_ROUTES.REGISTER, element: <Register /> },
    { path: APP_ROUTES.VERIFY_EMAIL, element: <VerifyEmail /> },
    { path: APP_ROUTES.FORGOT_PASSWORD, element: <ForgotPassword /> },
    { path: APP_ROUTES.VERIFY_RESET_CODE, element: <VerifyResetCode /> },
    { path: APP_ROUTES.RESET_PASSWORD, element: <ResetPassword /> },
  ] },
  { element: <ProtectedRoute />, children: [
    { element: <AppLayout />, children: [
      { path: APP_ROUTES.HOME, element: <HomePage /> },
      { path: APP_ROUTES.POST, element: <Post /> },
      { path: APP_ROUTES.BOOKMARKS, element: <Bookmarks /> },
      { path: APP_ROUTES.PROFILE, element: <Profile /> },
      { path: APP_ROUTES.FOLLOWERS, element: <Followers /> },
      { path: APP_ROUTES.FOLLOWING, element: <Following /> },
      { path: APP_ROUTES.SEARCH, element: <Search /> },
      { path: APP_ROUTES.EXPLORE, element: <Explore /> },
      { path: APP_ROUTES.FOLLOW_RECOMMENDATIONS, element: <FollowRecommendations /> },
      { path: APP_ROUTES.PREFERENCES, element: <Settings /> },
      { path: APP_ROUTES.SETTINGS, element: <AccountSecurity /> },
      { path: APP_ROUTES.SETTINGS_CHANGE_PASSWORD, element: <VerifyResetCode variant="settings" /> },
    ] },
    { element: <AdminRoute />, children: [
      { path: APP_ROUTES.ADMIN, element: <AdminLayout />, children: [
        { index: true, element: <Dashboard /> },
        { path: APP_ROUTES.ADMIN_USERS, element: <AdminUsers /> },
        { path: APP_ROUTES.ADMIN_USER, element: <AdminUser /> },
        { path: APP_ROUTES.ADMIN_MODERATION, element: <Moderation /> },
        { path: APP_ROUTES.ADMIN_REPORT, element: <Report /> },
        { path: APP_ROUTES.ADMIN_SETTINGS, element: <AdminSettings /> },
      ] },
    ] },
  ] },
  { path: '*', element: <NotFoundPage /> },
])

export function AppRouter() {
  return <Suspense fallback={<Spinner className="size-8 text-primary" />}><RouterProvider router={router} /></Suspense>
}
