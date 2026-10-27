import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { HomePage } from '../../pages/home/HomePage'
import { NotFoundPage } from '../../pages/not-found/NotFoundPage'
import { AppLayout } from '../../widgets/app-layout/AppLayout'

const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
