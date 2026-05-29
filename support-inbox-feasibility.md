# Support Ticket × My Inbox — Feasibility Audit

**Date:** 2026-05-28  
**Scope:** Business → Platform support using existing notification and My Inbox infrastructure (not live chat, not a separate support module).

---

## 1. Current My Inbox architecture

| Layer | Location | Behavior |
|-------|----------|----------|
| **DB** | `notifications` table (`Notification` model) | Per-user rows: `type`, `title`, `message`, `metadata` (JSON), `priority`, `channels`, `readAt`, optional `dedupeKey`. No parent/child or thread FK. |
| **API** | `GET/PATCH /api/me/notifications` | Cursor pagination, unread count, mark read / mark all read. Scoped by JWT `userId` only. |
| **Delivery** | `deliverUserNotification` → `createInboxNotification` | In-app row + `emitNotificationCreated` / `emitNotificationUnreadCount` on `user:{userId}` socket room. Optional push + email via same orchestrator. |
| **UI (shared)** | `NotificationInboxPage` + `useNotifications` | Flat list; click marks read and navigates if `metadata.url` present. Used by business (`/dashboard/notifications`), platform admin (`/platform-admin/notifications` → nav label **My inbox**), employee (`/employee/inbox`). |
| **Bell** | `NotificationBell` | Dropdown preview; same socket events; no extra polling beyond connect refresh. |

**Conclusion:** My Inbox is an **alert feed**, not a message store. It cannot hold multi-message threads by itself.

---

## 2. Notification model & APIs

- **Types today** (`notification.types.ts`): `tip_received`, `payout_paid`, `new_login`, `employee_invited`, `qr_scan`, `qr_payment_success`, `admin_announcement`, `system_alert`.
- **Announcements** are separate: `Announcement` audit table + fan-out via `sendPlatformAnnouncement` → many `Notification` rows (`admin_announcement`).
- **Platform ops alerts** use `onPlatformOperationalAlert` → `system_alert` to all `SUPER_ADMIN` + `isPlatformAdmin` users.

**Can inbox store conversational messages?** **No** — only single `message` text per notification.  
**Can it support threaded communication?** **No** — requires a dedicated ticket + message tables; inbox rows **point** to tickets via `metadata.ticketId` and `url`.

---

## 3. Platform Admin inbox flow

- Nav: `admin.sidebar.navNotifications` → `/platform-admin/notifications` (`NotificationInboxPage`).
- Announcements live under **Communication** (`/platform-admin/announcements`), not inbox.
- Socket: same `notification_created` / `notification_unread_count` as other roles.

---

## 4. Realtime notification flow

```
deliverUserNotification
  → createInboxNotification (Postgres)
  → emitNotificationCreated(userId, { notification, unreadCount })
  → optional push (FCM) + email
```

Socket join: authenticated users join `user:{userId}` (`socketServer.ts`). No ticket-specific socket events planned (avoids chat-style storms).

---

## 5. Existing database structures

| Table | Purpose |
|-------|---------|
| `notifications` | In-app inbox + dedupe |
| `announcements` | Broadcast audit only |
| `audit_logs` | Platform action trail |

No `support_*` tables exist today.

---

## 6. Socket events (notification-related)

| Event | Direction | Payload |
|-------|-----------|---------|
| `notification_created` | server → client | `{ notification, unreadCount, at }` |
| `notification_unread_count` | server → client | `{ unreadCount, at }` |

Reuse as-is for support ticket alerts.

---

## 7. Announcement messaging (reference pattern)

1. Create audit row (`Announcement`).
2. Resolve recipient user IDs by audience.
3. `deliverNotificationToUsers` with `dedupeKeyPrefix` per user.

**Support tickets (proposed):** mirror steps 1–3 but with `SupportTicket` + `SupportTicketMessage` for thread body; notifications are **pointers** only.

---

## 8. Feasibility answers

| Question | Answer |
|----------|--------|
| Can My Inbox store conversational messages? | **No** — use `SupportTicketMessage` for thread; inbox shows alerts. |
| Can it support threaded communication? | **Indirectly** — thread in ticket API/UI; inbox links to `/platform-admin/support/:id` or `/dashboard/support/:id`. |
| Can support tickets be a specialized inbox item? | **Yes** — `type` ∈ `support_ticket_*`, title badges `[TICKET] [OPEN]`, `metadata.status`, `metadata.ticketId`. |
| Minimal schema additions? | **`SupportTicket`** + **`SupportTicketMessage`** enums/status/category; extend notification `type` strings + list filters (`kind=support`, `q`, `status`). |

---

## 9. Recommended implementation (phases 2–8)

1. **Persistence:** `SupportTicket` (business-scoped, `ticketNumber`, status flow OPEN → PENDING → RESOLVED → CLOSED) + `SupportTicketMessage`.
2. **Business API:** `POST/GET /api/business/support/tickets`, reply on own tickets only (`MANAGER` + verified email).
3. **Platform API:** list/filter all tickets, reply, `PATCH` status; audit + rate limit on create.
4. **Notifications:** `support_ticket_created`, `support_ticket_reply`, `support_ticket_status` via existing orchestrator; admin fan-out via `listPlatformAdminUserIds`.
5. **UI:** `BusinessSupportPage` (form + history); extend `NotificationInboxPage` with support filter/search/badges; `SupportTicketDetailPage` for thread (no polling).
6. **Safety:** Server-side `businessId` checks; employees have no routes; admins via `requirePlatformAdmin`.
7. **Performance:** No new socket listeners; ticket detail loaded on navigation only; inbox uses existing `useNotifications` + optional query params.

---

## 10. Risks & mitigations

| Risk | Mitigation |
|------|------------|
| Inbox noise | Dedupe keys per ticket event; filter chip “Support” default-off for mixed feeds |
| Duplicate notifications | Unique dedupe per `ticketId` + event kind |
| Employee access | No support routes for `EMPLOYEE` role |
| Push prefs | Map support types to `systemAlerts` for manager/admin |

---

## 11. Sign-off

**Feasible** to deliver B2P support without a separate inbox or live chat. Proceed with dedicated ticket tables + notification pointers integrated into existing My Inbox.
