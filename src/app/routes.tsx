import type { RouteObject } from 'react-router'
import { EditorPage } from '../pages/EditorPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { ProfilePage } from '../pages/ProfilePage.tsx'
import { AppLayout } from './AppLayout.tsx'

/** Rotas da aplicação. Partilhadas pelo browser (main.tsx) e pelos testes (memory router). */
export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <ProfilePage /> },
      { path: 'edit', element: <EditorPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
