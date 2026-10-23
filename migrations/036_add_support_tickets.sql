-- 036_add_support_tickets.sql
--
-- Replaces the dead-end "contact support" experience (a static FAQ page
-- with only a mailto: link, and no record an admin can ever see) with a
-- real, trackable support ticket system. Any authenticated user (buyer or
-- seller) can open a ticket; an admin queue lets staff see, respond to, and
-- resolve them, with a full threaded reply history on both sides.

CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  -- Optional context so a ticket about a specific purchase or listing links
  -- straight to it for the admin reviewing it, without the user having to
  -- paste an order id into free text. Both SET NULL on delete: a ticket's
  -- own history is independent of whether the referenced order/product still
  -- exists. orders.id is TEXT (a generated "ORD-XXXX-YYYY" string), not
  -- UUID like every other id in this schema -- matched here accordingly.
  order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON support_tickets(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status, created_at DESC);

CREATE TABLE IF NOT EXISTS support_ticket_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_admin_reply BOOLEAN NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ticket_replies_ticket ON support_ticket_replies(ticket_id, created_at ASC);
