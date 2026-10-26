import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'stranger' },
  {
    path: 'stranger',
    loadComponent: () =>
      import('./features/stranger-chat/stranger-chat-page').then((m) => m.StrangerChatPage),
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login-page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./features/auth/register/register-page').then((m) => m.RegisterPage),
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/profile/profile-page').then((m) => m.ProfilePage),
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./features/chat/chat-page').then((m) => m.ChatPage),
  },
  {
    path: 'events',
    canActivate: [authGuard],
    loadComponent: () => import('./features/events/events-page').then((m) => m.EventsPage),
  },
  {
    path: 'learning',
    canActivate: [authGuard],
    loadComponent: () => import('./features/learning/learning-page').then((m) => m.LearningPage),
  },
  {
    path: 'werewolf',
    canActivate: [authGuard],
    loadComponent: () => import('./features/werewolf/werewolf-page').then((m) => m.WerewolfPage),
  },
  {
    path: 'werewolf/:roomId',
    canActivate: [authGuard],
    loadComponent: () => import('./features/werewolf/werewolf-page').then((m) => m.WerewolfPage),
  },
  {
    path: 'werewolf/join/:code',
    canActivate: [authGuard],
    loadComponent: () => import('./features/werewolf/werewolf-page').then((m) => m.WerewolfPage),
  },
  {
    path: 'groups',
    canActivate: [authGuard],
    loadComponent: () => import('./features/groups/groups-page').then((m) => m.GroupsPage),
  },
  {
    path: 'groups/:groupId',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/groups/group-detail/group-detail-page').then((m) => m.GroupDetailPage),
  },
  {
    path: 'invites/accept',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/groups/invitation-accept/invitation-accept-page').then(
        (m) => m.InvitationAcceptPage,
      ),
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found-page').then((m) => m.NotFoundPage),
  },
];
